const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      minlength: [6, "Please provide a password with min length: 6"],
      required: [true, "Please provide a password"],
      select: false,
    },
    photo: {
      type: String,
      default: "user.png",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "moderator"],
    },

    // Social Features
    followers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    following: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    followingCount: {
      type: Number,
      default: 0,
    },

    // Content Related
    stories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Story",
      },
    ],
    storyCount: {
      type: Number,
      default: 0,
    },
    readList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Story",
      },
    ],
    readListLength: {
      type: Number,
      default: 0,
    },
    bookmarks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Story",
      },
    ],
    bookmarkCount: {
      type: Number,
      default: 0,
    },

    // Profile Information
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    website: {
      type: String,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "Please provide a valid URL",
      ],
    },
    socialLinks: {
      twitter: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9_]+$/,
          "Invalid Twitter URL",
        ],
      },
      github: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+$/,
          "Invalid GitHub URL",
        ],
      },
      linkedin: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+$/,
          "Invalid LinkedIn URL",
        ],
      },
      facebook: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+$/,
          "Invalid Facebook URL",
        ],
      },
    },

    // Settings & Preferences
    emailNotifications: {
      newFollower: { type: Boolean, default: true },
      newComment: { type: Boolean, default: true },
      newLike: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedReason: String,
    bannedUntil: Date,

    // Stats
    totalViews: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    reputation: {
      type: Number,
      default: 0,
    },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Login History
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });

// Virtual for full profile URL
UserSchema.virtual("profileUrl").get(function () {
  return `/profile/${this._id}`;
});

// Virtual for checking if account is locked
UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
UserSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Update counts
  if (this.isModified("followers")) {
    this.followersCount = this.followers.length;
  }
  if (this.isModified("following")) {
    this.followingCount = this.following.length;
  }
  if (this.isModified("stories")) {
    this.storyCount = this.stories.length;
  }
  if (this.isModified("bookmarks")) {
    this.bookmarkCount = this.bookmarks.length;
  }
  if (this.isModified("readList")) {
    this.readListLength = this.readList.length;
  }

  next();
});

// Instance Methods
UserSchema.methods.generateJwtFromUser = function () {
  const { JWT_SECRET_KEY, JWT_EXPIRE } = process.env;

  const payload = {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
  };

  const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRE });

  return token;
};

UserSchema.methods.getResetPasswordTokenFromUser = function () {
  const { RESET_PASSWORD_EXPIRE } = process.env;

  // Generate random token
  const randomHexString = crypto.randomBytes(20).toString("hex");

  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash("SHA256")
    .update(randomHexString)
    .digest("hex");

  // Set expire time (1 hour from now)
  this.resetPasswordExpire =
    Date.now() + parseInt(RESET_PASSWORD_EXPIRE || 3600000);

  // Return the UNHASHED token for the email
  return randomHexString;
};

UserSchema.methods.getEmailVerificationToken = function () {
  // Generate random token
  const randomHexString = crypto.randomBytes(20).toString("hex");

  // Hash token and save to database
  this.emailVerificationToken = crypto
    .createHash("SHA256")
    .update(randomHexString)
    .digest("hex");

  // Set expire time (24 hours from now)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return randomHexString;
};

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.incLoginAttempts = function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 },
  });
};

// Follow/Unfollow methods
UserSchema.methods.follow = async function (userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    this.followingCount = this.following.length;
    await this.save();

    // Update the followed user's followers
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: this._id },
      $inc: { followersCount: 1 },
    });

    return true;
  }
  return false;
};

UserSchema.methods.unfollow = async function (userId) {
  const index = this.following.indexOf(userId);
  if (index > -1) {
    this.following.splice(index, 1);
    this.followingCount = this.following.length;
    await this.save();

    // Update the unfollowed user's followers
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: this._id },
      $inc: { followersCount: -1 },
    });

    return true;
  }
  return false;
};

UserSchema.methods.isFollowing = function (userId) {
  return this.following.includes(userId);
};

// Bookmark methods
UserSchema.methods.bookmarkStory = async function (storyId) {
  if (!this.bookmarks.includes(storyId)) {
    this.bookmarks.push(storyId);
    this.bookmarkCount = this.bookmarks.length;
    await this.save();
    return true;
  }
  return false;
};

UserSchema.methods.unbookmarkStory = async function (storyId) {
  const index = this.bookmarks.indexOf(storyId);
  if (index > -1) {
    this.bookmarks.splice(index, 1);
    this.bookmarkCount = this.bookmarks.length;
    await this.save();
    return true;
  }
  return false;
};

UserSchema.methods.hasBookmarked = function (storyId) {
  return this.bookmarks.includes(storyId);
};

// Calculate reputation
UserSchema.methods.calculateReputation = async function () {
  const Story = mongoose.model("Story");
  const Comment = mongoose.model("Comment");

  // Get user's stories stats
  const storiesStats = await Story.aggregate([
    { $match: { author: this._id } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likeCount" },
        totalViews: { $sum: "$views" },
        totalComments: { $sum: "$commentCount" },
      },
    },
  ]);

  // Get user's comments stats
  const commentsStats = await Comment.aggregate([
    { $match: { author: this._id } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likeCount" },
      },
    },
  ]);

  const storyStats = storiesStats[0] || {
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
  };
  const commentStats = commentsStats[0] || { totalLikes: 0 };

  // Calculate reputation score
  const reputation =
    storyStats.totalLikes * 10 +
    storyStats.totalComments * 5 +
    storyStats.totalViews * 0.1 +
    commentStats.totalLikes * 2 +
    this.followersCount * 3 +
    this.storyCount * 20;

  this.reputation = Math.round(reputation);
  this.totalLikes = storyStats.totalLikes;
  this.totalViews = storyStats.totalViews;

  await this.save();
  return this.reputation;
};

// Static methods
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.getTopAuthors = function (limit = 10) {
  return this.find({ role: { $ne: "banned" } })
    .sort("-reputation -followersCount -storyCount")
    .limit(limit)
    .select("username photo bio reputation followersCount storyCount");
};

UserSchema.statics.searchUsers = function (query) {
  return this.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { bio: { $regex: query, $options: "i" } },
    ],
    isActive: true,
    isBanned: false,
  }).select("username photo bio followersCount");
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
