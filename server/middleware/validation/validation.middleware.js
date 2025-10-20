const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../../helpers/error/CustomError");

// Validation rules for creating/updating a story
const storyValidationRules = () => {
  return [
    body("title")
      .trim()
      .isLength({ min: 4, max: 200 })
      .withMessage("Title must be between 4 and 200 characters"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters"),
    body("category")
      .isIn([
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
      ])
      .withMessage("Invalid category"),
    body("tags")
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          const tags = value.split(",");
          return tags.length <= 10;
        }
        if (Array.isArray(value)) {
          return value.length <= 10;
        }
        return false;
      })
      .withMessage("Maximum 10 tags allowed"),
    body("excerpt")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Excerpt cannot exceed 500 characters"),
    body("metaTitle")
      .optional()
      .isLength({ max: 60 })
      .withMessage("Meta title cannot exceed 60 characters"),
    body("metaDescription")
      .optional()
      .isLength({ max: 160 })
      .withMessage("Meta description cannot exceed 160 characters"),
  ];
};

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(new ErrorResponse(errorMessages.join(", "), 400));
  }
  next();
};

module.exports = {
  storyValidationRules,
  validate,
};
