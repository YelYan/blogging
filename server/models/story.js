const mongoose = require("mongoose");
const Comment = require("./comment");
const slugify = require("slugify");

const StorySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title"],
      unique: true,
      minlength: [4, "Please provide a title at least 4 characters"],
      maxlength: [200, "Title cannot be more than 200 characters"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Please provide content"],
      minlength: [10, "Please provide content at least 10 characters"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt cannot be more than 500 characters"],
    },
    image: {
      type: String,
      default: "default-story.jpg",
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: [
        "Technology",
        "Programming",
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Machine Learning",
        "DevOps",
        "Cybersecurity",
        "Design",
        "Business",
        "Career",
        "Lifestyle",
        "Tutorial",
        "Opinion",
        "News",
        "Other",
      ],
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    readtime: {
      type: Number,
      default: 3,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    dislikes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    dislikeCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookmarkedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot be more than 60 characters"],
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot be more than 160 characters"],
    },
    metaKeywords: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived", "deleted"],
      default: "published",
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastEditedAt: {
      type: Date,
    },
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
StorySchema.index({ slug: 1 });
StorySchema.index({ author: 1 });
StorySchema.index({ category: 1 });
StorySchema.index({ tags: 1 });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ likeCount: -1 });
StorySchema.index({ views: -1 });
StorySchema.index({ title: "text", content: "text" });

// Virtual for engagement score
StorySchema.virtual("engagementScore").get(function () {
  return (
    this.likeCount * 2 +
    this.commentCount * 3 +
    this.views * 0.1 +
    this.shares * 5
  );
});

// Pre-save middleware
StorySchema.pre("save", function (next) {
  // Generate slug from title
  if (this.isModified("title")) {
    this.slug = this.makeSlug();
  }

  // Generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, ""); // Remove HTML tags if any
    this.excerpt = plainText.substring(0, 197) + "...";
  }

  // Calculate read time based on content length
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.trim().split(/\s+/).length;
    this.readtime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // Set meta title and description if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title.substring(0, 60);
  }

  if (!this.metaDescription && this.excerpt) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }

  // Update lastEditedAt if content or title changed
  if (this.isModified("content") || this.isModified("title")) {
    this.lastEditedAt = Date.now();
  }

  // Update like and dislike counts
  this.likeCount = this.likes ? this.likes.length : 0;
  this.dislikeCount = this.dislikes ? this.dislikes.length : 0;
  this.bookmarkCount = this.bookmarkedBy ? this.bookmarkedBy.length : 0;

  next();
});

// Pre-remove middleware
StorySchema.pre("remove", async function (next) {
  // Delete all comments associated with this story
  await Comment.deleteMany({ story: this._id });

  // Remove story from users' read lists and bookmarks
  const User = mongoose.model("User");
  await User.updateMany(
    { $or: [{ readList: this._id }, { bookmarks: this._id }] },
    {
      $pull: {
        readList: this._id,
        bookmarks: this._id,
      },
    }
  );

  next();
});

// Methods
StorySchema.methods.makeSlug = function () {
  const randomString = Math.random().toString(36).substring(2, 8);
  return (
    slugify(this.title, {
      replacement: "-",
      remove: /[*+~.()'"!:@/?]/g,
      lower: true,
      strict: false,
      locale: "en",
      trim: true,
    }) +
    "-" +
    randomString
  );
};

// Check if user has liked the story
StorySchema.methods.isLikedByUser = function (userId) {
  return this.likes.includes(userId);
};

// Check if user has disliked the story
StorySchema.methods.isDislikedByUser = function (userId) {
  return this.dislikes.includes(userId);
};

// Check if user has bookmarked the story
StorySchema.methods.isBookmarkedByUser = function (userId) {
  return this.bookmarkedBy.includes(userId);
};

// Increment view count
StorySchema.methods.incrementViewCount = async function (userId) {
  // Check if user has already viewed
  if (userId) {
    const alreadyViewed = this.viewedBy.some(
      (view) => view.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      this.viewedBy.push({ user: userId });
    }
  }

  this.views += 1;
  return this.save();
};

// Static methods
StorySchema.statics.getTopStories = function (limit = 10) {
  return this.find({ status: "published", published: true })
    .sort("-likeCount -commentCount -views")
    .limit(limit)
    .populate("author", "username photo");
};

StorySchema.statics.getTrendingStories = function (days = 7, limit = 10) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    status: "published",
    published: true,
    createdAt: { $gte: dateFrom },
  })
    .sort("-views -likeCount -commentCount")
    .limit(limit)
    .populate("author", "username photo");
};

StorySchema.statics.getRelatedStories = async function (storyId, limit = 5) {
  const story = await this.findById(storyId);
  if (!story) return [];

  return this.find({
    _id: { $ne: storyId },
    status: "published",
    published: true,
    $or: [{ category: story.category }, { tags: { $in: story.tags } }],
  })
    .sort("-likeCount -views")
    .limit(limit)
    .populate("author", "username photo");
};

const Story = mongoose.model("Story", StorySchema);

module.exports = Story;
