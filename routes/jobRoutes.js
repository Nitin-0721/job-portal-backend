const express = require("express");
const router = express.Router();
const {
  createJob, getAllJobs, getJobById,
  getMyJobs, updateJob, deleteJob,
} = require("../controllers/jobController");
const { protect, recruiterOnly } = require("../middleware/authMiddleware");

// ⚠️ Specific routes MUST come before dynamic /:id routes
router.get("/recruiter/myjobs", protect, recruiterOnly, getMyJobs);

// Public — students browse jobs
router.get("/", protect, getAllJobs);
router.get("/:id", protect, getJobById);

// Recruiter only
router.post("/", protect, recruiterOnly, createJob);
router.put("/:id", protect, recruiterOnly, updateJob);
router.delete("/:id", protect, recruiterOnly, deleteJob);

module.exports = router;
