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

  const user = await User.create({
    username,
    email,
    password,
  });

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

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse("Please provide an email", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  }

  // Get reset token (unhashed version for email)
  const resetToken = user.getResetPasswordTokenFromUser();

  // Save user with hashed token in database
  await user.save({ validateBeforeSave: false });

  // Create reset url with UNHASHED token
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  console.log("Password Reset Request:", {
    email: user.email,
    resetToken: resetToken,
    resetUrl: resetUrl,
    tokenExpires: user.resetPasswordExpire,
  });

  // Development mode - log the URL
  if (process.env.NODE_ENV === "development") {
    console.log("\n=================================");
    console.log("PASSWORD RESET URL:");
    console.log(resetUrl);
    console.log("Token expires at:", new Date(user.resetPasswordExpire));
    console.log("=================================\n");
  }

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
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hi ${user.username},</p>
                    <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
                    <p>Please click the button below to reset your password:</p>
                    <center>
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </center>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all;">${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>© 2024 BlogHub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request - BlogHub",
      html,
    });

    res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Email send error:", err);

    // Reset token fields if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// @desc    Verify reset token
// @route   GET /api/auth/resetpassword/:resettoken
// @access  Public
const verifyResetToken = asyncHandler(async (req, res, next) => {
  const { resettoken } = req.params;

  console.log("Verifying token:", resettoken);

  // Hash the token from URL
  const resetPasswordToken = crypto
    .createHash("SHA256")
    .update(resettoken)
    .digest("hex");

  console.log("Hashed token for lookup:", resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    // Check if token exists but expired
    const expiredUser = await User.findOne({ resetPasswordToken });

    if (expiredUser) {
      console.log("Token expired at:", expiredUser.resetPasswordExpire);
      console.log("Current time:", new Date());
      return next(new ErrorResponse("Reset token has expired", 400));
    }

    console.log("Token not found in database");
    return next(new ErrorResponse("Invalid reset token", 400));
  }

  console.log("Token valid for user:", user.email);
  console.log("Token expires at:", user.resetPasswordExpire);

  res.status(200).json({
    success: true,
    message: "Token is valid",
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  console.log("Resetting password with token:", resettoken);

  if (!password) {
    return next(new ErrorResponse("Please provide a new password", 400));
  }

  // Hash the token from URL
  const resetPasswordToken = crypto
    .createHash("SHA256")
    .update(resettoken)
    .digest("hex");

  console.log("Looking for hashed token:", resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    console.log("User not found or token expired");
    return next(new ErrorResponse("Invalid or expired reset token", 400));
  }

  console.log("Resetting password for user:", user.email);

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Send success email (optional)
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { background-color: #f4f4f4; padding: 20px; border-radius: 0 0 5px 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Successful</h1>
                </div>
                <div class="content">
                    <p>Hi ${user.username},</p>
                    <p>Your password has been successfully reset.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Successful - BlogHub",
      html,
    });
  } catch (err) {
    console.error("Could not send confirmation email:", err);
  }

  sendTokenResponse(user, 200, res);
});

// Get token from model and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateJwtFromUser();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      photo: user.photo,
      role: user.role,
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  resetPassword,
  forgotPassword,
  verifyResetToken,
};
