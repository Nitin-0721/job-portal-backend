const Application = require("../models/Application");
const Job = require("../models/Job");

// ── POST /api/applications/apply/:jobId ── (student only)
const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.status === "closed") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    // Check if already applied
    const existing = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: "You have already applied to this job" });
    }

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter || "",
    });

    res.status(201).json({ message: "Application submitted successfully", application });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/applications/my ── (student sees own applications)
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate("job", "title company location type mode salaryMin salaryMax skills deadline postedBy")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/applications/job/:jobId ── (recruiter sees applicants for a job)
const getJobApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Make sure recruiter owns this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate(
        "applicant",
        "name email phone location degree branch college cgpa skills resume linkedin github bio"
      )
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/applications/recruiter/all ── (recruiter sees ALL applicants across all their jobs)
const getAllApplicantsForRecruiter = async (req, res) => {
  try {
    // Get all jobs by this recruiter
    const myJobs = await Job.find({ postedBy: req.user._id }).select("_id");
    const jobIds = myJobs.map((j) => j._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("job", "title")
      .populate(
        "applicant",
        "name email phone location degree branch college cgpa skills resume linkedin github bio"
      )
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── PATCH /api/applications/:id/status ── (recruiter updates status)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "shortlisted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Make sure recruiter owns the job
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.status = status;
    await application.save();

    res.json({ message: "Status updated successfully", application });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── DELETE /api/applications/:id ── (student withdraws)
const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await application.deleteOne();
    res.json({ message: "Application withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  applyToJob, getMyApplications, getJobApplicants,
  getAllApplicantsForRecruiter, updateApplicationStatus, withdrawApplication,
};
