const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── POST /api/users/register ──
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── POST /api/users/login ──
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/users/profile ──
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── PUT /api/users/profile ──
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name", "phone", "location", "bio",
      "degree", "branch", "college", "graduationYear", "cgpa",
      "skills", "linkedin", "github", "portfolio",
      "companyName", "companyWebsite",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── POST /api/users/upload-resume ──
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resume: req.file.filename },
      { new: true }
    ).select("-password");

    res.json({
      message: "Resume uploaded successfully",
      filename: req.file.filename,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── POST /api/users/forgot-password ──
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If this email is registered, you will receive a reset link shortly.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Reset URL - points to frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0c0c0e; color: #e8e6e0; padding: 32px; border-radius: 12px; border: 1px solid #1e1e22;">
        <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">Reset your password</h1>
        <p style="font-size: 13px; color: #888; margin: 0 0 24px;">You requested a password reset for your work.find account.</p>
        <a href="${resetUrl}" 
          style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 500;">
          Reset Password →
        </a>
        <p style="font-size: 12px; color: #555; margin: 24px 0 0;">This link expires in <strong style="color: #e8e6e0;">15 minutes</strong>.</p>
        <p style="font-size: 12px; color: #555; margin: 8px 0 0;">If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #1e1e22; margin: 24px 0;" />
        <p style="font-size: 11px; color: #444; margin: 0;">work<span style="color: #3b82f6;">.</span>find</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset your work.find password",
      html,
    });

    res.status(200).json({
      message: "If this email is registered, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    // Clear token if email fails
    if (error.user) {
      error.user.resetPasswordToken = undefined;
      error.user.resetPasswordExpire = undefined;
      await error.user.save({ validateBeforeSave: false });
    }

    res.status(500).json({ message: "Email could not be sent. Try again later." });
  }
};

// ── POST /api/users/reset-password/:token ──
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register, login, getProfile,
  updateProfile, uploadResume,
  forgotPassword, resetPassword,
};
