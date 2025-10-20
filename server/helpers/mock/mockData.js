const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const categories = [
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
];

const tags = [
  "javascript",
  "react",
  "nodejs",
  "typescript",
  "python",
  "mongodb",
  "express",
  "nextjs",
  "vue",
  "angular",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "git",
  "vscode",
  "api",
  "database",
  "security",
  "performance",
  "testing",
  "deployment",
  "ci-cd",
  "agile",
  "scrum",
  "ux",
  "ui",
  "design",
  "figma",
  "tailwind",
  "bootstrap",
  "sass",
  "webpack",
  "babel",
  "eslint",
  "jest",
  "cypress",
  "graphql",
  "rest",
  "microservices",
  "serverless",
  "blockchain",
  "ai",
  "ml",
  "deeplearning",
];

const storyTitles = [
  "Building Scalable Web Applications with React and Node.js",
  "The Complete Guide to TypeScript in 2024",
  "10 JavaScript Tricks Every Developer Should Know",
  "Understanding Microservices Architecture",
  "Getting Started with Docker and Kubernetes",
  "Machine Learning for Web Developers",
  "The Future of Web Development: Trends to Watch",
  "Building Real-time Applications with WebSockets",
  "Mastering CSS Grid and Flexbox",
  "Performance Optimization Techniques for React Apps",
  "Introduction to GraphQL: A Better Alternative to REST",
  "Securing Your Node.js Applications",
  "The Art of Writing Clean Code",
  "DevOps Best Practices for Modern Teams",
  "Building Progressive Web Apps from Scratch",
  "Understanding Async/Await in JavaScript",
  "Database Design Patterns and Best Practices",
  "Creating Beautiful UIs with Tailwind CSS",
  "Testing Strategies for Frontend Applications",
  "Deploying Applications to AWS: A Complete Guide",
  "Building Authentication Systems with JWT",
  "State Management in React: Redux vs Context API",
  "Creating RESTful APIs with Express.js",
  "Introduction to Serverless Architecture",
  "Web Accessibility: Building Inclusive Applications",
  "Git Workflow Strategies for Teams",
  "Understanding Cloud Computing Fundamentals",
  "Building Mobile Apps with React Native",
  "The Power of Static Site Generators",
  "Implementing CI/CD Pipelines with GitHub Actions",
];

const generateUsers = (count = 10) => {
  const users = [];
  const password = bcrypt.hashSync("password123", 10);

  // Create admin user
  users.push({
    username: "admin",
    email: "admin@bloghub.com",
    password,
    role: "admin",
    photo: `https://ui-avatars.com/api/?name=Admin&background=6366f1`,
    bio: "Platform administrator with full access to all features. Passionate about building great communities.",
    location: "San Francisco, CA",
    website: "https://bloghub.com",
    socialLinks: {
      twitter: "https://twitter.com/bloghub",
      github: "https://github.com/bloghub",
      linkedin: "https://linkedin.com/in/admin",
    },
    isEmailVerified: true,
    reputation: 10000,
    createdAt: faker.date.past({ years: 2 }),
  });

  // Create demo user
  users.push({
    username: "demo",
    email: "demo@bloghub.com",
    password,
    role: "user",
    photo: `https://ui-avatars.com/api/?name=Demo+User&background=10b981`,
    bio: "Demo account for testing the platform. Feel free to explore all features!",
    location: "New York, NY",
    website: "https://demo.bloghub.com",
    isEmailVerified: true,
    reputation: 500,
    createdAt: faker.date.past({ years: 2 }),
  });

  // Create random users
  for (let i = 0; i < count - 2; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    const city = faker.location.city();
    const country = faker.location.country();

    const user = {
      username,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password,
      role: Math.random() > 0.95 ? "moderator" : "user",
      photo: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${faker.string.hexadecimal(
        { length: 6, prefix: "" }
      )}`,
      bio: faker.lorem.sentences(2),
      location: `${city}, ${country}`,
      website: Math.random() > 0.5 ? faker.internet.url() : undefined,
      isEmailVerified: Math.random() > 0.2,
      reputation: faker.number.int({ min: 0, max: 5000 }),
      createdAt: faker.date.past({ years: 2 }),
    };

    // Add social links for some users
    if (Math.random() > 0.5) {
      user.socialLinks = {};
      if (Math.random() > 0.5) {
        user.socialLinks.twitter = `https://twitter.com/${username}`;
      }
      if (Math.random() > 0.5) {
        user.socialLinks.github = `https://github.com/${username}`;
      }
      if (Math.random() > 0.5) {
        user.socialLinks.linkedin = `https://linkedin.com/in/${username}`;
      }
    }

    users.push(user);
  }

  return users;
};

const generateStoryContent = () => {
  const sections = [];

  // Introduction
  sections.push(`<h2>Introduction</h2>`);
  sections.push(`<p>${faker.lorem.paragraphs(2)}</p>`);

  // Main sections
  for (let i = 0; i < 3; i++) {
    sections.push(`<h2>${faker.company.catchPhrase()}</h2>`);
    sections.push(`<p>${faker.lorem.paragraphs(3)}</p>`);

    // Add code block occasionally
    if (Math.random() > 0.5) {
      sections.push(`
        <pre><code>
// Example code
function example() {
  const result = await fetch('/api/data');
  return result.json();
}
        </code></pre>
      `);
    }

    // Add list occasionally
    if (Math.random() > 0.5) {
      sections.push(`
        <ul>
          <li>${faker.lorem.sentence()}</li>
          <li>${faker.lorem.sentence()}</li>
          <li>${faker.lorem.sentence()}</li>
        </ul>
      `);
    }
  }

  // Conclusion
  sections.push(`<h2>Conclusion</h2>`);
  sections.push(`<p>${faker.lorem.paragraphs(2)}</p>`);

  return sections.join("\n");
};

const generateStories = (users, count = 30) => {
  const stories = [];
  const usedTitles = new Set();

  for (let i = 0; i < count; i++) {
    // Get unique title
    let title;
    do {
      title =
        faker.helpers.arrayElement(storyTitles) +
        (usedTitles.size > 0
          ? ` - Part ${Math.floor(Math.random() * 5) + 1}`
          : "");
    } while (usedTitles.has(title));
    usedTitles.add(title);

    const author = faker.helpers.arrayElement(users);
    const createdAt = faker.date.past({ years: 1 });
    const content = generateStoryContent();
    const excerpt = faker.lorem.paragraphs(1).substring(0, 200) + "...";

    // Random tags for this story
    const storyTags = faker.helpers.arrayElements(
      tags,
      Math.floor(Math.random() * 5) + 2
    );

    // Calculate read time based on content length
    const wordCount = content.split(" ").length;
    const readtime = Math.max(1, Math.ceil(wordCount / 200));

    stories.push({
      author: author._id,
      title,
      content,
      excerpt,
      category: faker.helpers.arrayElement(categories),
      tags: storyTags,
      image: `https://picsum.photos/seed/${faker.string.alphanumeric(
        10
      )}/800/400`,
      featured: Math.random() > 0.8,
      published: true,
      publishedAt: createdAt,
      status: "published",
      readtime,
      views: faker.number.int({ min: 100, max: 10000 }),
      likeCount: faker.number.int({ min: 0, max: 500 }),
      commentCount: faker.number.int({ min: 0, max: 100 }),
      shares: faker.number.int({ min: 0, max: 50 }),
      allowComments: true,
      isPinned: Math.random() > 0.95,
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
      metaTitle: title.substring(0, 60),
      metaDescription: excerpt.substring(0, 160),
    });
  }

  return stories;
};

const generateComments = (stories, users, avgPerStory = 5) => {
  const comments = [];

  stories.forEach((story) => {
    const commentCount = faker.number.int({
      min: 0,
      max: avgPerStory * 2,
    });

    for (let i = 0; i < commentCount; i++) {
      const author = faker.helpers.arrayElement(users);
      const createdAt = faker.date.between({
        from: story.createdAt,
        to: new Date(),
      });

      comments.push({
        story: story._id,
        author: author._id,
        content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
        star: Math.random() > 0.5 ? faker.number.int({ min: 1, max: 5 }) : 0,
        likeCount: faker.number.int({ min: 0, max: 50 }),
        createdAt,
        updatedAt: createdAt,
      });
    }
  });

  return comments;
};

const addInteractions = (stories, users) => {
  stories.forEach((story) => {
    // Add random likes
    const likeCount = faker.number.int({
      min: 0,
      max: Math.min(users.length, 20),
    });
    const likers = faker.helpers.arrayElements(users, likeCount);
    story.likes = likers.map((user) => user._id);
    story.likeCount = likeCount;

    // Add random bookmarks
    const bookmarkCount = faker.number.int({
      min: 0,
      max: Math.min(users.length, 10),
    });
    const bookmarkers = faker.helpers.arrayElements(users, bookmarkCount);
    story.bookmarkedBy = bookmarkers.map((user) => user._id);
    story.bookmarkCount = bookmarkCount;

    // Add viewed by
    const viewCount = faker.number.int({ min: 1, max: users.length });
    const viewers = faker.helpers.arrayElements(users, viewCount);
    story.viewedBy = viewers.map((user) => ({
      user: user._id,
      viewedAt: faker.date.between({ from: story.createdAt, to: new Date() }),
    }));
  });

  return stories;
};

module.exports = {
  generateUsers,
  generateStories,
  generateComments,
  addInteractions,
  categories,
  tags,
};
