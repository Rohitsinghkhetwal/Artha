import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    description: {
      type: String,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      default: 'full-time',
    },
    category: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ sourceUrl: 1 });

const JobModel = mongoose.model('jobs', jobSchema)

export default JobModel