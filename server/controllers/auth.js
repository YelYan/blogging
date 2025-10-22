const crypto = require("crypto"); // Add this missing import
const User = require("../models/user");
const ErrorResponse = require("../helpers/error/CustomError");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const sendEmail = require("../helpers/sendMail/sendMail");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ErrorResponse("Email already registered", 400));
    }
    if (existingUser.username === username) {
      return next(new ErrorResponse("Username already taken", 400));
    }
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  // Send welcome email (optional)
  try {
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f4f4f4; padding: 20px; border-radius: 0 0 5px 5px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Welcome to BlogHub!</h1>
              </div>
              <div class="content">
                  <p>Hi ${user.username},</p>
                  <p>Welcome to BlogHub! We're excited to have you as part of our community.</p>
                  <p>Start exploring amazing stories, share your thoughts, and connect with writers from around the world.</p>
                  <p>Happy reading and writing!</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await sendEmail({
      email: user.email,
      subject: "Welcome to BlogHub!",
      html: welcomeHtml,
    });
  } catch (err) {
    console.error("Welcome email could not be sent:", err);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  const user = await User.findOne({ email }).select(
    "+password +loginAttempts +lockUntil"
  );

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    return next(
      new ErrorResponse(
        `Account is locked. Try again in ${lockTime} minutes`,
        423
      )
    );
  }

  // Check if account is banned
  if (user.isBanned) {
    const banMessage = user.bannedReason
      ? `Account is banned: ${user.bannedReason}`
      : "Account is banned";
    return next(new ErrorResponse(banMessage, 403));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(
      new ErrorResponse("Account is deactivated. Please contact support", 403)
    );
  }

  const isPasswordCorrect = await user.comparePassword(password);

  console.log(isPasswordCorrect, "check pass");

  if (!isPasswordCorrect) {
    await user.incLoginAttempts();
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Reset login attempts and update last login
  await user.resetLoginAttempts();

  // Populate necessary relations
  await user.populate([
    { path: "followers", select: "username photo" },
    { path: "following", select: "username photo" },
    { path: "bookmarks", select: "title slug" },
  ]);

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("followers", "username photo bio")
    .populate("following", "username photo bio")
    .populate({
      path: "stories",
      select: "title slug image createdAt likeCount commentCount",
      options: { sort: "-createdAt", limit: 5 },
    })
    .populate({
      path: "bookmarks",
      select: "title slug image author",
      populate: {
        path: "author",
        select: "username photo",
      },
      options: { limit: 5 },
    });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  // Update last login time
  await User.findByIdAndUpdate(req.user.id, {
    lastLogin: Date.now(),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: {},
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("SHA256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorResponse("Invalid or expired verification token", 400)
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new ErrorResponse("Email is already verified", 400));
  }

  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f4f4f4; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Verify Your Email</h1>
            </div>
            <div class="content">
                <p>Hi ${user.username},</p>
                <p>Please click the button below to verify your email address:</p>
                <center>
                    <a href="${verificationUrl}" class="button">Verify Email</a>
                </center>
                <p>Or copy and paste this link: ${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification - BlogHub",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// Existing forgotPassword, verifyResetToken, resetPassword functions remain the same...

// Enhanced sendTokenResponse function
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateJwtFromUser();

  // Prepare user data (avoid sending sensitive fields)
  const userData = {
    id: user._id,
    _id: user._id,
    username: user.username,
    email: user.email,
    photo: user.photo,
    bio: user.bio || "",
    role: user.role,
    location: user.location || "",
    website: user.website || "",
    socialLinks: user.socialLinks || {},
    followers: user.followers || [],
    followersCount: user.followersCount || 0,
    following: user.following || [],
    followingCount: user.followingCount || 0,
    stories: user.stories || [],
    storyCount: user.storyCount || 0,
    bookmarks: user.bookmarks || [],
    bookmarkCount: user.bookmarkCount || 0,
    readList: user.readList || [],
    readListLength: user.readListLength || 0,
    reputation: user.reputation || 0,
    totalViews: user.totalViews || 0,
    totalLikes: user.totalLikes || 0,
    isEmailVerified: user.isEmailVerified || false,
    isActive: user.isActive !== false,
    emailNotifications: user.emailNotifications || {
      newFollower: true,
      newComment: true,
      newLike: true,
      newsletter: true,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  // resetPassword,
  // forgotPassword,
  // verifyResetToken,
  verifyEmail,
  resendVerificationEmail,
};
