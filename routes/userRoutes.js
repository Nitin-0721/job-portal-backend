const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadResume,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);

module.exports = router;
