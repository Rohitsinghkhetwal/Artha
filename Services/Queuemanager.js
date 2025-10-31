import importlogModel from "../models/Importlog.model.js"
import { jobQueue } from "../bull/queue.js"
import { logger } from "../utils/logger.js"

// services that are used for the adding the jobs to the queue 
const addJobsToQueue = async (jobs, sourceUrl) => {
  try {
    const importLog = await importlogModel.create({
      fileName: sourceUrl,
      totalFetched: jobs.length,
      status: 'in-progress',
      startTime: new Date(),
    });

    logger.info(`Created import log: ${importLog._id}`);

    const batchSize = parseInt(process.env.BATCH_SIZE) || 10
    let addedCount = 0;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);

      const queueJobs = batch.map((jobData, index) => ({
        data: {
          jobData,
          sourceUrl,
          importLogId:importLog._id.toString(),
        },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }));

      // console.log("QUEUE ARE HERE => ", queueJobs)

      await jobQueue.addBulk(queueJobs);
      addedCount += batch.length;

      logger.debug(`Added batch ${Math.floor(i / batchSize) + 1} to queue`);
    }

    logger.success(`Added ${addedCount} jobs to queue (Import Log: ${importLog._id})`);
    return importLog._id.toString();
  } catch (error) {
    logger.error('Error adding jobs to queue:', error.message);
    throw error;
  }
};


const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getCompletedCount(),
      jobQueue.getFailedCount(),
      jobQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Error getting queue stats:', error.message);
    throw error;
  }
};


const cleanQueue = async (olderThan = 24 * 60 * 60 * 1000) => {
  try {
    await jobQueue.clean(olderThan, 'completed');
    await jobQueue.clean(olderThan, 'failed');
    logger.success('Queue cleaned successfully');
  } catch (error) {
    logger.error('Error cleaning queue:', error.message);
    throw error;
  }
};


const pauseQueue = async () => {
  await jobQueue.pause();
  logger.warn('Queue paused');
};


const resumeQueue = async () => {
  await jobQueue.resume();
  logger.success('Queue resumed');
};

 export {
  addJobsToQueue,
  getQueueStats,
  cleanQueue,
  pauseQueue,
  resumeQueue,
};