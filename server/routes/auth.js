const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  // forgotPassword,
  // resetPassword,
  // verifyResetToken,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/auth.js");
const { protect } = require("../middleware/auth/auth.middleware.js");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
// router.post("/forgotpassword", forgotPassword);
// router.put("/resetpassword/:resettoken", resetPassword);
// router.get("/resetpassword/:resettoken", verifyResetToken);
router.get("/verify-email/:token", verifyEmail);

// Protected routes
router.use(protect); // All routes after this require authentication
router.get("/me", getMe);
router.post("/logout", logout);
router.post("/resend-verification", resendVerificationEmail);

module.exports = router;
