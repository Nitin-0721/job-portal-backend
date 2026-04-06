const Job = require("../models/Job");

// ── POST /api/jobs ── (recruiter only)
const createJob = async (req, res) => {
  try {
    const {
      title, description, location, type, mode,
      salaryMin, salaryMax, experience, openings,
      deadline, skills, perks,
    } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ message: "Title, description and location are required" });
    }

    const job = await Job.create({
      title, description, location, type, mode,
      salaryMin, salaryMax, experience, openings,
      deadline, skills, perks,
      postedBy: req.user._id,
    });

    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/jobs ── (all students can see)
const getAllJobs = async (req, res) => {
  try {
    const { search, type, mode, status } = req.query;

    const filter = { status: status || "active" };

    if (type) filter.type = type;
    if (mode) filter.mode = mode;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "name companyName email")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/jobs/:id ──
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name companyName email"
    );

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET /api/jobs/recruiter/myjobs ── (recruiter sees own jobs)
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── PUT /api/jobs/:id ── (recruiter only)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json({ message: "Job updated successfully", job: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── DELETE /api/jobs/:id ── (recruiter only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createJob, getAllJobs, getJobById,
  getMyJobs, updateJob, deleteJob,
};
