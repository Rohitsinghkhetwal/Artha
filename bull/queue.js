import Queue from "bull"
import dotenv from "dotenv"

dotenv.config({
  path:"./config.env"
})
import { QUEUE_NAMES } from "../config/constant.js"
import { logger } from "../utils/logger.js"

const jobQueue = new Queue(QUEUE_NAMES.JOB_IMPORT, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

jobQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

jobQueue.on('waiting', (jobId) => {
  logger.debug(`Job ${jobId} is waiting`);
});

jobQueue.on('active', (job) => {
  logger.debug(`Job ${job.id} started processing`);
});

jobQueue.on('completed', (job, result) => {
  logger.debug(`Job ${job.id} completed with result:`, result);
});

jobQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

jobQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

jobQueue.on('progress', (job, progress) => {
  logger.debug(`Job ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, closing queue...');
  await jobQueue.close();
});

export { jobQueue }