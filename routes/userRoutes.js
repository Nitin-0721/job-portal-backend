const express = require("express");
const router = express.Router();
const {
  register, login, getProfile,
  updateProfile, uploadResume,
  forgotPassword, resetPassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);

module.exports = router;
