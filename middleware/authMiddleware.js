const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Only students can access
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === "student") return next();
  return res.status(403).json({ message: "Access denied — students only" });
};

// Only recruiters can access
const recruiterOnly = (req, res, next) => {
  if (req.user && req.user.role === "recruiter") return next();
  return res.status(403).json({ message: "Access denied — recruiters only" });
};

module.exports = { protect, authorizeRoles, studentOnly, recruiterOnly };
