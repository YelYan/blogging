const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const dotenv = require("dotenv");
const {
  generateUsers,
  generateStories,
  generateComments,
  addInteractions,
} = require("./helpers/mock/mockData");
const path = require("path");

// Models
const User = require("./models/User");
const Story = require("./models/Story");
const Comment = require("./models/comment");

// Load env vars
dotenv.config({
  path: "./config/config.env",
});

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Story.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log("✅ Existing data cleared");

    // Generate and save users
    console.log("👥 Creating users...");
    const userData = generateUsers(15);
    const users = await User.create(userData);
    console.log(`✅ Created ${users.length} users`);

    // Generate and save stories
    console.log("📝 Creating stories...");
    let storiesData = generateStories(users, 50);
    storiesData = addInteractions(storiesData, users);
    const stories = await Story.create(storiesData);
    console.log(`✅ Created ${stories.length} stories`);

    // Update user story counts and read lists
    for (const story of stories) {
      // Update author's story count
      await User.findByIdAndUpdate(story.author, {
        $push: { stories: story._id },
        $inc: { storyCount: 1 },
      });

      // Add to random users' read lists
      const readers = faker.helpers.arrayElements(
        users,
        faker.number.int({ min: 0, max: 10 })
      );
      for (const reader of readers) {
        await User.findByIdAndUpdate(reader._id, {
          $push: { readList: story._id },
          $inc: { readListLength: 1 },
        });
      }
    }

    // Generate and save comments
    console.log("💬 Creating comments...");
    const commentsData = generateComments(stories, users, 5);
    const comments = await Comment.create(commentsData);

    // Update story comment references
    for (const comment of comments) {
      await Story.findByIdAndUpdate(comment.story, {
        $push: { comments: comment._id },
        $inc: { commentCount: 1 },
      });
    }

    console.log(`✅ Created ${comments.length} comments`);

    // Create some followers/following relationships
    console.log("👥 Creating follower relationships...");
    for (const user of users) {
      const followingCount = faker.number.int({ min: 0, max: 10 });
      const following = faker.helpers.arrayElements(
        users.filter((u) => u._id.toString() !== user._id.toString()),
        followingCount
      );

      for (const followedUser of following) {
        await User.findByIdAndUpdate(user._id, {
          $push: { following: followedUser._id },
          $inc: { followingCount: 1 },
        });

        await User.findByIdAndUpdate(followedUser._id, {
          $push: { followers: user._id },
          $inc: { followersCount: 1 },
        });
      }
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Stories: ${stories.length}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log("\n🔑 Login Credentials:");
    console.log("   Admin: admin@bloghub.com / password123");
    console.log("   Demo: demo@bloghub.com / password123");
    console.log("   All users: password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
