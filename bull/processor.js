import JobModel from "../models/Job.model.js";
import importlogModel from "../models/Importlog.model.js";
import { logger } from "../utils/logger.js";

//this file is for processing the job that is coming the bull queue 


const processJob = async (job) => {
  const { jobData, sourceUrl, importLogId } = job.data;

  try {
    
    // Validate required fields
    if(!importLogId) {
      throw new Error("Miising importLog")
    }

    if (!jobData.title) {
      throw new Error("Missing title");
    }
    if (!jobData.company) {
      throw new Error("Missing company");
    }

    // if (importLogId === "" || importLogId === "undefined") {
    //   return;
    // }

    // Check if job already exists
    const existingJob = await JobModel.findOne({
      externalId: jobData.externalId,
    });

    if (existingJob) {
      // UPDATE existing job
      await JobModel.findByIdAndUpdate(
        existingJob._id,
        {
          ...jobData,
          updatedAt: new Date(),
        },
        { new: true }
      );

      // Update  log - increment updated count
      await importlogModel.findByIdAndUpdate(importLogId, {
        $inc: {
          updatedJobs: 1,
          totalImported: 1,
        },
      });

      logger.info(`Updated job: ${jobData.title} (${jobData.externalId})`);

      return {
        status: "updated",
        jobId: existingJob._id,
        title: jobData.title,
      };
    } else {
      // CREATE new job
      const newJob = await JobModel.create(jobData);

      // Update import log - increment new count
      await importlogModel.findByIdAndUpdate(importLogId, {
        $inc: {
          newJobs: 1,
          totalImported: 1,
        },
      });

      logger.success(
        `Created new job: ${jobData.title} (${jobData.externalId})`
      );

      return {
        status: "created",
        jobId: newJob._id,
        title: jobData.title,
      };
    }
  } catch (error) {
    logger.error(
      `Failed to process job ${jobData?.externalId}:`,
      error.message
    );

    // Log failure in import log
    await importlogModel.findByIdAndUpdate(importLogId, {
      $inc: { failedJobs: 1 },
      $push: {
        failures: {
          reason: error.message,
          timestamp: new Date(),
        },
      },
    });

    throw error;
  }
};

export { processJob };
