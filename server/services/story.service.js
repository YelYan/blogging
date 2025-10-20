const Story = require("../models/story");
const User = require("../models/user");
const ErrorResponse = require("../helpers/error/CustomError");

class StoryService {
  // Create story with additional processing
  static async createStoryWithProcessing(storyData, userId) {
    try {
      // Add author
      storyData.author = userId;

      // Process tags
      if (storyData.tags && typeof storyData.tags === "string") {
        storyData.tags = storyData.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
      }

      // Create story
      const story = await Story.create(storyData);

      // Update user's story list
      await User.findByIdAndUpdate(userId, {
        $push: { stories: story._id },
        $inc: { storyCount: 1 },
      });

      return story;
    } catch (error) {
      throw error;
    }
  }

  // Get personalized feed for user
  static async getPersonalizedFeed(userId, page = 1, limit = 10) {
    try {
      const user = await User.findById(userId);

      // Get user's interests based on their reading history
      const readStories = await Story.find({
        _id: { $in: user.readList },
      }).select("category tags");

      // Extract categories and tags
      const categories = [...new Set(readStories.map((s) => s.category))];
      const tags = [...new Set(readStories.flatMap((s) => s.tags))];

      // Build personalized query
      const query = {
        status: "published",
        published: true,
        author: { $ne: userId }, // Exclude user's own stories
        $or: [{ category: { $in: categories } }, { tags: { $in: tags } }],
      };

      const stories = await Story.find(query)
        .populate("author", "username photo")
        .sort("-createdAt")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return stories;
    } catch (error) {
      throw error;
    }
  }

  // Get story recommendations
  static async getRecommendations(storyId, limit = 5) {
    try {
      const story = await Story.findById(storyId);
      if (!story) {
        throw new ErrorResponse("Story not found", 404);
      }

      // Find similar stories based on category and tags
      const recommendations = await Story.find({
        _id: { $ne: storyId },
        status: "published",
        published: true,
        $or: [{ category: story.category }, { tags: { $in: story.tags } }],
      })
        .populate("author", "username photo")
        .sort("-likeCount -views")
        .limit(limit);

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  static async bulkUpdateStories(storyIds, updates, userId) {
    try {
      // Verify ownership for all stories
      const stories = await Story.find({
        _id: { $in: storyIds },
        author: userId,
      });

      if (stories.length !== storyIds.length) {
        throw new ErrorResponse("Some stories not found or unauthorized", 403);
      }

      // Perform bulk update
      const result = await Story.updateMany(
        { _id: { $in: storyIds } },
        updates
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Archive old stories
  static async archiveOldStories(days = 365) {
    try {
      const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await Story.updateMany(
        {
          createdAt: { $lt: dateThreshold },
          status: "published",
        },
        {
          status: "archived",
          published: false,
        }
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Generate sitemap data
  static async generateSitemapData() {
    try {
      const stories = await Story.find({
        status: "published",
        published: true,
      })
        .select("slug updatedAt")
        .sort("-updatedAt");

      return stories.map((story) => ({
        url: `/story/${story.slug}`,
        lastmod: story.updatedAt,
        changefreq: "weekly",
        priority: 0.8,
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StoryService;
