const express = require("express");
const {
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
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth/auth.middleware");
const {
  uploadUserAvatar,
} = require("../middleware/uploadimg/upload.middleware");

const router = express.Router();

// Public routes
router.get("/top-authors", getTopAuthors);
router.get("/search", searchUsers);
router.get("/:userId", getPublicProfile);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

// Protected routes
router.use(protect); // All routes below require authentication

router.get("/profile/me", profile);
router.put("/profile/edit", uploadUserAvatar, editProfile);
router.put("/profile/change-password", changePassword);
router.put("/profile/update-stats", updateUserStats);

// Follow/Unfollow
router.put("/:userId/follow", followUser);
router.put("/:userId/unfollow", unfollowUser);

// Bookmarks
router.get("/bookmarks/list", getBookmarks);
router.put("/bookmarks/:storyId", toggleBookmark);

// Read List
router.get("/readlist/all", readListPage);
router.put("/readlist/:slug", addStoryToReadList);

module.exports = router;
