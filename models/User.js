const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "recruiter"],
      default: "student",
    },

    // ── Student Profile Fields ──
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Education
    degree: { type: String, default: "" },
    branch: { type: String, default: "" },
    college: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    cgpa: { type: String, default: "" },

    // Skills
    skills: [{ type: String }],

    // Resume
    resume: { type: String, default: "" }, // file path

    // Social Links
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },

    // ── Recruiter Fields ──
    companyName: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
