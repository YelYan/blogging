const asyncErrorWrapper = require("express-async-handler");
const User = require("../models/user");
const Story = require("../models/story");
const CustomError = require("../helpers/error/CustomError");
const {
  comparePassword,
  validateUserInput,
} = require("../helpers/input/inputHelpers");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const profile = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("followers", "username photo bio")
    .populate("following", "username photo bio")
    .populate("stories", "title slug image createdAt")
    .populate("bookmarks", "title slug image author");

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Get public user profile
// @route   GET /api/users/:userId
// @access  Public
const getPublicProfile = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select(
      "-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -loginAttempts"
    )
    .populate("followers", "username photo")
    .populate("following", "username photo")
    .populate({
      path: "stories",
      select: "title slug image createdAt likeCount commentCount",
      options: { sort: "-createdAt", limit: 10 },
    });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Check if current user is following this user
  let isFollowing = false;
  if (req.user) {
    const currentUser = await User.findById(req.user.id);
    isFollowing = currentUser.isFollowing(user._id);
  }

  return res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      isFollowing,
    },
  });
});

// @desc    Edit user profile
// @route   PUT /api/users/profile
// @access  Private
const editProfile = asyncErrorWrapper(async (req, res, next) => {
  const {
    email,
    username,
    bio,
    location,
    website,
    socialLinks,
    emailNotifications,
  } = req.body;

  const updateData = {
    email,
    username,
    bio,
    location,
    website,
    socialLinks,
    emailNotifications,
  };

  // Add photo if uploaded
  if (req.savedUserPhoto) {
    updateData.photo = req.savedUserPhoto;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncErrorWrapper(async (req, res, next) => {
  const { newPassword, oldPassword } = req.body;

  if (!validateUserInput(newPassword, oldPassword)) {
    return next(new CustomError("Please check your inputs", 400));
  }

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordCorrect = await user.comparePassword(oldPassword);

  if (!isPasswordCorrect) {
    return next(new CustomError("Old password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc    Follow a user
// @route   PUT /api/users/:userId/follow
// @access  Private
const followUser = asyncErrorWrapper(async (req, res, next) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return next(new CustomError("You cannot follow yourself", 400));
  }

  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    return next(new CustomError("User not found", 404));
  }

  const currentUser = await User.findById(req.user.id);
  const success = await currentUser.follow(userId);

  if (!success) {
    return next(new CustomError("You are already following this user", 400));
  }

  return res.status(200).json({
    success: true,
    message: `You are now following ${userToFollow.username}`,
    data: {
      followingCount: currentUser.followingCount,
      isFollowing: true,
    },
  });
});

// @desc    Unfollow a user
// @route   PUT /api/users/:userId/unfollow
// @access  Private
const unfollowUser = asyncErrorWrapper(async (req, res, next) => {
  const { userId } = req.params;

  const userToUnfollow = await User.findById(userId);
  if (!userToUnfollow) {
    return next(new CustomError("User not found", 404));
  }

  const currentUser = await User.findById(req.user.id);
  const success = await currentUser.unfollow(userId);

  if (!success) {
    return next(new CustomError("You are not following this user", 400));
  }

  return res.status(200).json({
    success: true,
    message: `You have unfollowed ${userToUnfollow.username}`,
    data: {
      followingCount: currentUser.followingCount,
      isFollowing: false,
    },
  });
});

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Public
const getFollowers = asyncErrorWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findById(userId).populate({
    path: "followers",
    select: "username photo bio followersCount",
    options: {
      skip: (page - 1) * limit,
      limit: limit * 1,
    },
  });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    count: user.followersCount,
    data: user.followers,
  });
});

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Public
const getFollowing = asyncErrorWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findById(userId).populate({
    path: "following",
    select: "username photo bio followersCount",
    options: {
      skip: (page - 1) * limit,
      limit: limit * 1,
    },
  });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    count: user.followingCount,
    data: user.following,
  });
});

// @desc    Add/Remove story from bookmarks
// @route   PUT /api/users/bookmarks/:storyId
// @access  Private
const toggleBookmark = asyncErrorWrapper(async (req, res, next) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    return next(new CustomError("Story not found", 404));
  }

  const user = await User.findById(req.user.id);
  const isBookmarked = user.hasBookmarked(storyId);

  if (isBookmarked) {
    await user.unbookmarkStory(storyId);

    // Update story's bookmarkedBy
    await Story.findByIdAndUpdate(storyId, {
      $pull: { bookmarkedBy: user._id },
      $inc: { bookmarkCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Story removed from bookmarks",
      isBookmarked: false,
    });
  } else {
    await user.bookmarkStory(storyId);

    // Update story's bookmarkedBy
    await Story.findByIdAndUpdate(storyId, {
      $addToSet: { bookmarkedBy: user._id },
      $inc: { bookmarkCount: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "Story added to bookmarks",
      isBookmarked: true,
    });
  }
});

// @desc    Get user's bookmarks
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarks = asyncErrorWrapper(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.user.id).populate({
    path: "bookmarks",
    populate: {
      path: "author",
      select: "username photo",
    },
    options: {
      skip: (page - 1) * limit,
      limit: limit * 1,
      sort: "-createdAt",
    },
  });

  return res.status(200).json({
    success: true,
    count: user.bookmarkCount,
    data: user.bookmarks,
  });
});

// @desc    Add/Remove story from read list
// @route   PUT /api/users/readlist/:slug
// @access  Private
const addStoryToReadList = asyncErrorWrapper(async (req, res, next) => {
  const { slug } = req.params;

  const story = await Story.findOne({ slug });
  if (!story) {
    return next(new CustomError("Story not found", 404));
  }

  const user = await User.findById(req.user.id);

  const isInReadList = user.readList.includes(story._id);

  if (isInReadList) {
    const index = user.readList.indexOf(story._id);
    user.readList.splice(index, 1);
    user.readListLength = user.readList.length;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Story removed from read list",
      status: false,
    });
  } else {
    user.readList.push(story._id);
    user.readListLength = user.readList.length;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Story added to read list",
      status: true,
    });
  }
});

// @desc    Get user's read list
// @route   GET /api/users/readlist
// @access  Private
const readListPage = asyncErrorWrapper(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.user.id).populate({
    path: "readList",
    populate: {
      path: "author",
      select: "username photo",
    },
    options: {
      skip: (page - 1) * limit,
      limit: limit * 1,
      sort: "-createdAt",
    },
  });

  return res.status(200).json({
    success: true,
    count: user.readListLength,
    data: user.readList,
  });
});

// @desc    Get top authors
// @route   GET /api/users/top-authors
// @access  Public
const getTopAuthors = asyncErrorWrapper(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const authors = await User.getTopAuthors(limit);

  return res.status(200).json({
    success: true,
    count: authors.length,
    data: authors,
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = asyncErrorWrapper(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(new CustomError("Search query is required", 400));
  }

  const users = await User.searchUsers(q);

  return res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Update user stats (reputation)
// @route   PUT /api/users/update-stats
// @access  Private
const updateUserStats = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const reputation = await user.calculateReputation();

  return res.status(200).json({
    success: true,
    data: {
      reputation,
      totalViews: user.totalViews,
      totalLikes: user.totalLikes,
    },
  });
});

module.exports = {
  profile,
  getPublicProfile,
  editProfile,
  changePassword,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  toggleBookmark,
  getBookmarks,
  addStoryToReadList,
  readListPage,
  getTopAuthors,
  searchUsers,
  updateUserStats,
};
