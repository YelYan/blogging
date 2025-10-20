const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ErrorResponse = require("../../helpers/error/CustomError");

// Create upload directories if they don't exist
const uploadDirs = ["./uploads", "./uploads/stories", "./uploads/users"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for story images
const storyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/stories");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "story-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure storage for user avatars
const userStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/users");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "user-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter function
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        "Please upload an image file (JPEG, PNG, GIF, or WebP)",
        400
      ),
      false
    );
  }
};

// Upload middleware for story images
const uploadStoryImage = multer({
  storage: storyStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
}).fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// Upload middleware for user avatar
const uploadUserAvatar = multer({
  storage: userStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: imageFileFilter,
}).single("photo");

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ErrorResponse("File size too large", 400));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new ErrorResponse("Too many files uploaded", 400));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new ErrorResponse("Unexpected field name", 400));
    }
  }
  next(err);
};

// Delete file utility
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadStoryImage,
  uploadUserAvatar,
  handleUploadError,
  deleteFile,
};
