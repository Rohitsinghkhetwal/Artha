import mongoose from "mongoose";

const importLogSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalFetched: {
      type: Number,
      default: 0,
    },
    totalImported: {
      type: Number,
      default: 0,
    },
    newJobs: {
      type: Number,
      default: 0,
    },
    updatedJobs: {
      type: Number,
      default: 0,
    },
    failedJobs: {
      type: Number,
      default: 0,
    },
    failures: [
      {
        jobId: String,
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'failed'],
      default: 'in-progress',
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

importLogSchema.index({ timestamp: -1 });
importLogSchema.index({ status: 1 });

const importlogModel = mongoose.model('Importlogs', importLogSchema)

export default importlogModel