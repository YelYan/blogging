const Story = require("../models/story");
const User = require("../models/user");
const ErrorResponse = require("../helpers/error/CustomError");
const asyncHandler = require("express-async-handler");
const path = require("path");

// @desc    Get all stories with advanced filtering
// @route   GET /api/stories
// @access  Public
const getStories = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 9,
    search,
    category,
    tags,
    author,
    sortBy = "latest",
    status = "published",
    featured,
    startDate,
    endDate,
    minReadTime,
    maxReadTime,
  } = req.query;

  // Build query
  const query = {};

  // Status filter (only show published for non-authors)
  if (!req.user || (req.user && req.user.role !== "admin")) {
    query.status = "published";
    query.published = true;
  } else if (status) {
    query.status = status;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Tags filter (can be comma-separated)
  if (tags) {
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    query.tags = { $in: tagsArray };
  }

  // Author filter
  if (author) {
    query.author = author;
  }

  // Featured filter
  if (featured !== undefined) {
    query.featured = featured === "true";
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Read time filter
  if (minReadTime || maxReadTime) {
    query.readtime = {};
    if (minReadTime) query.readtime.$gte = parseInt(minReadTime);
    if (maxReadTime) query.readtime.$lte = parseInt(maxReadTime);
  }

  // Determine sort order
  let sortOption = {};
  switch (sortBy) {
    case "popular":
      sortOption = { likeCount: -1, views: -1, commentCount: -1 };
      break;
    case "mostViewed":
      sortOption = { views: -1 };
      break;
    case "mostLiked":
      sortOption = { likeCount: -1 };
      break;
    case "mostCommented":
      sortOption = { commentCount: -1 };
      break;
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "alphabetical":
      sortOption = { title: 1 };
      break;
    case "readTime":
      sortOption = { readtime: 1 };
      break;
    case "latest":
    default:
      sortOption = { createdAt: -1 };
  }

  // Add pinned stories to the top
  sortOption = { isPinned: -1, ...sortOption };

  // Execute query
  const stories = await Story.find(query)
    .populate("author", "username email photo")
    .populate({
      path: "comments",
      select: "content author createdAt",
      populate: {
        path: "author",
        select: "username photo",
      },
      options: { limit: 3, sort: "-createdAt" },
    })
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Get total count for pagination
  const total = await Story.countDocuments(query);

  // Add additional data for authenticated users
  if (req.user) {
    stories.forEach((story) => {
      story.isLiked = story.likes.some(
        (like) => like.toString() === req.user.id
      );
      story.isBookmarked = story.bookmarkedBy.some(
        (bookmark) => bookmark.toString() === req.user.id
      );
      story.isAuthor = story.author._id.toString() === req.user.id;
    });
  }

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
    data: stories,
  });
});

// @desc    Get single story by slug or ID
// @route   GET /api/stories/:identifier
// @access  Public
const getStory = asyncHandler(async (req, res, next) => {
  const { identifier } = req.params;

  let story;

  // Check if identifier is a valid MongoDB ObjectId
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    story = await Story.findById(identifier);
  } else {
    // Otherwise, treat it as a slug
    story = await Story.findOne({ slug: identifier });
  }

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  // Check if story is published or user is the author/admin
  if (story.status !== "published" && !story.published) {
    if (
      !req.user ||
      (story.author.toString() !== req.user.id && req.user.role !== "admin")
    ) {
      return next(new ErrorResponse("Story not found", 404));
    }
  }

  // Populate author and comments with more details
  await story.populate([
    {
      path: "author",
      select: "username email photo bio followers followersCount",
    },
    {
      path: "comments",
      populate: {
        path: "author",
        select: "username photo",
      },
      options: { sort: "-createdAt" },
    },
  ]);

  // Increment view count
  if (req.user) {
    await story.incrementViewCount(req.user.id);
  } else {
    story.views += 1;
    await story.save();
  }

  // Get related stories
  const relatedStories = await Story.getRelatedStories(story._id, 4);

  // Add user-specific data if authenticated
  let responseData = story.toObject();
  if (req.user) {
    responseData.isLiked = story.isLikedByUser(req.user.id);
    responseData.isDisliked = story.isDislikedByUser(req.user.id);
    responseData.isBookmarked = story.isBookmarkedByUser(req.user.id);
    responseData.isAuthor = story.author._id.toString() === req.user.id;
    responseData.canEdit = responseData.isAuthor || req.user.role === "admin";
  }

  res.status(200).json({
    success: true,
    data: responseData,
    relatedStories,
  });
});

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
const createStory = asyncHandler(async (req, res, next) => {
  // Add author to request body
  req.body.author = req.user.id;

  // Handle tags - convert string to array if needed
  if (req.body.tags && typeof req.body.tags === "string") {
    req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
  }

  // Handle meta keywords
  if (req.body.metaKeywords && typeof req.body.metaKeywords === "string") {
    req.body.metaKeywords = req.body.metaKeywords
      .split(",")
      .map((keyword) => keyword.trim());
  }

  // Set published date if publishing immediately
  if (req.body.published === true || req.body.status === "published") {
    req.body.publishedAt = Date.now();
  }

  // Create story
  const story = await Story.create(req.body);

  // Update user's story count
  await User.findByIdAndUpdate(req.user.id, {
    $push: { stories: story._id },
    $inc: { storyCount: 1 },
  });

  // Populate author information
  await story.populate("author", "username email photo");

  res.status(201).json({
    success: true,
    data: story,
    message: "Story created successfully",
  });
});

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
const updateStory = asyncHandler(async (req, res, next) => {
  let story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  // Check ownership
  if (story.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to update this story", 403));
  }

  // Handle tags update
  if (req.body.tags && typeof req.body.tags === "string") {
    req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
  }

  // Handle meta keywords update
  if (req.body.metaKeywords && typeof req.body.metaKeywords === "string") {
    req.body.metaKeywords = req.body.metaKeywords
      .split(",")
      .map((keyword) => keyword.trim());
  }

  // Track edit history
  const editEntry = {
    editedBy: req.user.id,
    editedAt: Date.now(),
    changes: `Updated: ${Object.keys(req.body).join(", ")}`,
  };

  // Update story
  story = await Story.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastEditedAt: Date.now(),
      $push: { editHistory: editEntry },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("author", "username email photo");

  res.status(200).json({
    success: true,
    data: story,
    message: "Story updated successfully",
  });
});

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = asyncHandler(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  // Check ownership
  if (story.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to delete this story", 403));
  }

  // Soft delete or hard delete based on preference
  if (req.query.permanent === "true" || req.user.role === "admin") {
    // Hard delete - remove story and all associated data
    await story.remove();

    // Update user's story count
    await User.findByIdAndUpdate(story.author, {
      $pull: { stories: story._id },
      $inc: { storyCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Story permanently deleted",
      data: {},
    });
  } else {
    // Soft delete - just change status
    story.status = "deleted";
    story.published = false;
    await story.save();

    res.status(200).json({
      success: true,
      message: "Story moved to trash",
      data: story,
    });
  }
});

// @desc    Like/Unlike story
// @route   PUT /api/stories/:id/like
// @access  Private
const likeStory = asyncHandler(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  const userId = req.user.id;
  const isLiked = story.likes.includes(userId);
  const isDisliked = story.dislikes.includes(userId);

  if (isLiked) {
    // Unlike the story
    story.likes = story.likes.filter((id) => id.toString() !== userId);
    story.likeCount = story.likes.length;
  } else {
    // Like the story
    story.likes.push(userId);
    story.likeCount = story.likes.length;

    // Remove from dislikes if present
    if (isDisliked) {
      story.dislikes = story.dislikes.filter((id) => id.toString() !== userId);
      story.dislikeCount = story.dislikes.length;
    }

    // Notify author about the like (optional)
    // await createNotification(story.author, 'like', story._id, req.user.id);
  }

  await story.save();

  res.status(200).json({
    success: true,
    data: {
      likes: story.likeCount,
      dislikes: story.dislikeCount,
      isLiked: !isLiked,
      isDisliked: false,
    },
    message: isLiked ? "Story unliked" : "Story liked",
  });
});

// @desc    Dislike/Undislike story
// @route   PUT /api/stories/:id/dislike
// @access  Private
const dislikeStory = asyncHandler(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  const userId = req.user.id;
  const isDisliked = story.dislikes.includes(userId);
  const isLiked = story.likes.includes(userId);

  if (isDisliked) {
    // Remove dislike
    story.dislikes = story.dislikes.filter((id) => id.toString() !== userId);
    story.dislikeCount = story.dislikes.length;
  } else {
    // Add dislike
    story.dislikes.push(userId);
    story.dislikeCount = story.dislikes.length;

    // Remove from likes if present
    if (isLiked) {
      story.likes = story.likes.filter((id) => id.toString() !== userId);
      story.likeCount = story.likes.length;
    }
  }

  await story.save();

  res.status(200).json({
    success: true,
    data: {
      likes: story.likeCount,
      dislikes: story.dislikeCount,
      isLiked: false,
      isDisliked: !isDisliked,
    },
    message: isDisliked ? "Dislike removed" : "Story disliked",
  });
});

// @desc    Bookmark/Unbookmark story
// @route   PUT /api/stories/:id/bookmark
// @access  Private
const bookmarkStory = asyncHandler(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  const userId = req.user.id;
  const isBookmarked = story.bookmarkedBy.includes(userId);

  if (isBookmarked) {
    // Remove bookmark
    story.bookmarkedBy = story.bookmarkedBy.filter(
      (id) => id.toString() !== userId
    );
    story.bookmarkCount = story.bookmarkedBy.length;

    // Remove from user's bookmarks
    await User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: story._id },
    });
  } else {
    // Add bookmark
    story.bookmarkedBy.push(userId);
    story.bookmarkCount = story.bookmarkedBy.length;

    // Add to user's bookmarks
    await User.findByIdAndUpdate(userId, {
      $push: { bookmarks: story._id },
    });
  }

  await story.save();

  res.status(200).json({
    success: true,
    data: {
      bookmarkCount: story.bookmarkCount,
      isBookmarked: !isBookmarked,
    },
    message: isBookmarked ? "Bookmark removed" : "Story bookmarked",
  });
});

// @desc    Share story (increment share count)
// @route   PUT /api/stories/:id/share
// @access  Public
const shareStory = asyncHandler(async (req, res, next) => {
  const story = await Story.findByIdAndUpdate(
    req.params.id,
    { $inc: { shares: 1 } },
    { new: true }
  );

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { shares: story.shares },
    message: "Share count updated",
  });
});

// @desc    Get featured stories
// @route   GET /api/stories/featured
// @access  Public
const getFeaturedStories = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 5;

  const stories = await Story.find({
    featured: true,
    status: "published",
    published: true,
  })
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit);

  res.status(200).json({
    success: true,
    count: stories.length,
    data: stories,
  });
});

// @desc    Get trending stories
// @route   GET /api/stories/trending
// @access  Public
const getTrendingStories = asyncHandler(async (req, res, next) => {
  const days = parseInt(req.query.days) || 7;
  const limit = parseInt(req.query.limit) || 10;

  const stories = await Story.getTrendingStories(days, limit);

  res.status(200).json({
    success: true,
    count: stories.length,
    data: stories,
  });
});

// @desc    Get top stories
// @route   GET /api/stories/top
// @access  Public
const getTopStories = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const stories = await Story.getTopStories(limit);

  res.status(200).json({
    success: true,
    count: stories.length,
    data: stories,
  });
});

// @desc    Get stories by category
// @route   GET /api/stories/category/:category
// @access  Public
const getStoriesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const stories = await Story.find({
    category,
    status: "published",
    published: true,
  })
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Story.countDocuments({
    category,
    status: "published",
    published: true,
  });

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: stories,
  });
});

// @desc    Get stories by tag
// @route   GET /api/stories/tag/:tag
// @access  Public
const getStoriesByTag = asyncHandler(async (req, res, next) => {
  const { tag } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const stories = await Story.find({
    tags: { $in: [tag] },
    status: "published",
    published: true,
  })
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Story.countDocuments({
    tags: { $in: [tag] },
    status: "published",
    published: true,
  });

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: stories,
  });
});

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Public
const getUserStories = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status = "published" } = req.query;

  const query = { author: userId };

  // Only show published stories to public
  if (!req.user || req.user.id !== userId) {
    query.status = "published";
    query.published = true;
  } else if (status) {
    query.status = status;
  }

  const stories = await Story.find(query)
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Story.countDocuments(query);

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: stories,
  });
});

// @desc    Get user's bookmarked stories
// @route   GET /api/stories/bookmarks
// @access  Private
const getBookmarkedStories = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.user.id);

  const stories = await Story.find({
    _id: { $in: user.bookmarks },
    status: "published",
    published: true,
  })
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = user.bookmarks.length;

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: stories,
  });
});

// @desc    Get story statistics
// @route   GET /api/stories/:id/stats
// @access  Private (Author only)
const getStoryStats = asyncHandler(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  // Check ownership
  if (story.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse("Not authorized to view these statistics", 403)
    );
  }

  // Calculate additional statistics
  const viewsByDay = story.viewedBy.reduce((acc, view) => {
    const date = new Date(view.viewedAt).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    views: story.views,
    uniqueViews: story.viewedBy.length,
    likes: story.likeCount,
    dislikes: story.dislikeCount,
    comments: story.commentCount,
    bookmarks: story.bookmarkCount,
    shares: story.shares,
    engagementScore: story.engagementScore,
    readTime: story.readtime,
    viewsByDay,
    averageRating: 0, // Calculate from comments if ratings are implemented
    lastViewed:
      story.viewedBy.length > 0
        ? story.viewedBy[story.viewedBy.length - 1].viewedAt
        : null,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get all categories with story count
// @route   GET /api/stories/categories
// @access  Public
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Story.aggregate([
    {
      $match: {
        status: "published",
        published: true,
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likeCount" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// @desc    Get all tags with story count
// @route   GET /api/stories/tags
// @access  Public
const getTags = asyncHandler(async (req, res, next) => {
  const tags = await Story.aggregate([
    {
      $match: {
        status: "published",
        published: true,
      },
    },
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 50 }, // Top 50 tags
  ]);

  res.status(200).json({
    success: true,
    count: tags.length,
    data: tags,
  });
});

// @desc    Search stories
// @route   GET /api/stories/search
// @access  Public
const searchStories = asyncHandler(async (req, res, next) => {
  const {
    q,
    page = 1,
    limit = 10,
    searchIn = "all", // all, title, content, tags
  } = req.query;

  if (!q) {
    return next(new ErrorResponse("Search query is required", 400));
  }

  let searchQuery = {
    status: "published",
    published: true,
  };

  // Configure search based on searchIn parameter
  switch (searchIn) {
    case "title":
      searchQuery.title = { $regex: q, $options: "i" };
      break;
    case "content":
      searchQuery.content = { $regex: q, $options: "i" };
      break;
    case "tags":
      searchQuery.tags = { $in: [new RegExp(q, "i")] };
      break;
    case "all":
    default:
      searchQuery.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
  }

  const stories = await Story.find(searchQuery)
    .populate("author", "username photo")
    .sort("-createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Story.countDocuments(searchQuery);

  res.status(200).json({
    success: true,
    count: stories.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    query: q,
    data: stories,
  });
});

module.exports = {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  likeStory,
  dislikeStory,
  bookmarkStory,
  shareStory,
  getFeaturedStories,
  getTrendingStories,
  getTopStories,
  getStoriesByCategory,
  getStoriesByTag,
  getUserStories,
  getBookmarkedStories,
  getStoryStats,
  getCategories,
  getTags,
  searchStories,
};
