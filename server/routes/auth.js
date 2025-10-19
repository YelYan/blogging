const express = require("express");
const { register, login, getMe, logout } = require("../controllers/auth.js");
const { protect } = require("../middleware/auth/auth.middleware.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
