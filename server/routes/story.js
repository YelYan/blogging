const express = require("express");
const {
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
} = require("../controllers/story");

const { protect, authorize } = require("../middleware/auth/auth.middleware");
const {
  uploadStoryImage,
} = require("../middleware/uploadimg/upload.middleware");

const router = express.Router();

// Public routes
router.get("/search", searchStories);
router.get("/featured", getFeaturedStories);
router.get("/trending", getTrendingStories);
router.get("/top", getTopStories);
router.get("/categories", getCategories);
router.get("/tags", getTags);
router.get("/category/:category", getStoriesByCategory);
router.get("/tag/:tag", getStoriesByTag);
router.get("/user/:userId", getUserStories);
router.put("/:id/share", shareStory);

// Protected routes
router.use(protect); // All routes below this require authentication

router.get("/bookmarks", getBookmarkedStories);

router.route("/").get(getStories).post(uploadStoryImage, createStory);

router
  .route("/:id")
  .get(getStory)
  .put(uploadStoryImage, updateStory)
  .delete(deleteStory);

// Story-specific identifier route (can be ID or slug)
router.get("/view/:identifier", getStory);

// Story interactions
router.put("/:id/like", likeStory);
router.put("/:id/dislike", dislikeStory);
router.put("/:id/bookmark", bookmarkStory);

// Story statistics (author only)
router.get("/:id/stats", getStoryStats);

// Admin only routes
router.put("/:id/feature", authorize("admin"), async (req, res, next) => {
  const story = await Story.findByIdAndUpdate(
    req.params.id,
    { featured: req.body.featured },
    { new: true }
  );

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  res.status(200).json({
    success: true,
    data: story,
  });
});

router.put("/:id/pin", authorize("admin"), async (req, res, next) => {
  const story = await Story.findByIdAndUpdate(
    req.params.id,
    { isPinned: req.body.isPinned },
    { new: true }
  );

  if (!story) {
    return next(new ErrorResponse("Story not found", 404));
  }

  res.status(200).json({
    success: true,
    data: story,
  });
});

module.exports = router;
