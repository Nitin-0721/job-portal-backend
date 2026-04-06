const express = require("express");
const router = express.Router();
const {
  applyToJob, getMyApplications, getJobApplicants,
  getAllApplicantsForRecruiter, updateApplicationStatus, withdrawApplication,
} = require("../controllers/applicationController");
const {
  protect, studentOnly, recruiterOnly,
} = require("../middleware/authMiddleware");

// ⚠️ Specific routes MUST come before dynamic /:id routes

// Student routes
router.get("/my", protect, studentOnly, getMyApplications);
router.post("/apply/:jobId", protect, studentOnly, applyToJob);

// Recruiter routes
router.get("/recruiter/all", protect, recruiterOnly, getAllApplicantsForRecruiter);
router.get("/job/:jobId", protect, recruiterOnly, getJobApplicants);

// Dynamic routes last
router.patch("/:id/status", protect, recruiterOnly, updateApplicationStatus);
router.delete("/:id", protect, studentOnly, withdrawApplication);

module.exports = router;
