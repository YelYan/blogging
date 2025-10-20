const cron = require("node-cron");
const Story = require("../models/story");
const StoryService = require("../services/story.service");

// Update trending stories every hour
const updateTrendingStories = cron.schedule(
  "0 * * * *",
  async () => {
    try {
      console.log("Updating trending stories...");

      // Reset featured flag for old featured stories
      await Story.updateMany({ featured: true }, { featured: false });

      // Set new featured stories based on engagement
      const topStories = await Story.find({
        status: "published",
        published: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort("-likeCount -commentCount -views")
        .limit(5);

      for (const story of topStories) {
        story.featured = true;
        await story.save();
      }

      console.log("Trending stories updated successfully");
    } catch (error) {
      console.error("Error updating trending stories:", error);
    }
  },
  {
    scheduled: false,
  }
);

// Clean up deleted stories every day at midnight
const cleanupDeletedStories = cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("Cleaning up deleted stories...");

      // Permanently delete stories that have been in trash for 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deletedStories = await Story.find({
        status: "deleted",
        updatedAt: { $lt: thirtyDaysAgo },
      });

      for (const story of deletedStories) {
        await story.remove();
      }

      console.log(`Cleaned up ${deletedStories.length} deleted stories`);
    } catch (error) {
      console.error("Error cleaning up deleted stories:", error);
    }
  },
  {
    scheduled: false,
  }
);

// Archive old stories every week
const archiveOldStories = cron.schedule(
  "0 0 * * 0",
  async () => {
    try {
      console.log("Archiving old stories...");
      const result = await StoryService.archiveOldStories(365);
      console.log(`Archived ${result.modifiedCount} stories`);
    } catch (error) {
      console.error("Error archiving stories:", error);
    }
  },
  {
    scheduled: false,
  }
);

module.exports = {
  updateTrendingStories,
  cleanupDeletedStories,
  archiveOldStories,
};
