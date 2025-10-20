const express = require("express");

const router = express.Router();

// const userRoute = require("./user");
const authRoute = require("./auth");
const storyRoute = require("./story");
// const commentRoute = require("./comment");

router.use("/auth", authRoute);
router.use("/stories", storyRoute);
// router.use("/user", userRoute);
// router.use("/comment", commentRoute);

module.exports = router;
