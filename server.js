const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

// ── Middleware ──
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://job-portal-frontend-six-beryl.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded resumes as static files ──
// Create folder if it doesn't exist
const resumeDir = path.join(__dirname, "uploads/resumes");
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// ── Health check ──
app.get("/", (req, res) => {
  res.json({ message: "Job Portal API is running ✓" });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// ── Connect DB & Start Server ──
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB connected");
    app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  });
