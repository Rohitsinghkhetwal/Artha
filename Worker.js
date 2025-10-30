import dotenv from "dotenv"

import ConnectDatabase from "./config/Database.js"

import connectRedis from "./config/Redis.js"

import {jobQueue} from "./bull/queue.js"

import { processJob } from "./bull/processor.js"

import importlogModel from "./models/Importlog.model.js"

import { logger } from "./utils/logger.js"

import mongoose from "mongoose"



dotenv.config({
  path: "./config.env"
})

const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY) || 5;



const startWorker = async () => {
  try {

    logger.info(' Connecting to MongoDB...');
     await ConnectDatabase();

    logger.info('🔴 Connecting to Redis...');
     await connectRedis();

    logger.success(` Starting worker with concurrency: ${CONCURRENCY}`);

    // Process jobs from queue
    jobQueue.process(CONCURRENCY, async (job) => {
      logger.debug(`Processing job ${job.id}...`);
      return await processJob(job);
    });

    jobQueue.on('completed', async (job, result) => {
      logger.debug(`✅ Job ${job.id} completed:`, result.status);
      
      const { importLogId } = job.data;
      await checkAndCompleteImport(importLogId);
    });

    jobQueue.on('failed', async (job, err) => {
      logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);


      if (job.attemptsMade >= job.opts.attempts) {
        logger.error(` Job ${job.id} permanently failed - Max attempts reached`);
      } else {
        logger.warn(`Job ${job.id} will be retried (Attempt ${job.attemptsMade}/${job.opts.attempts})`);
      }
    });


    jobQueue.on('waiting', (jobId) => {
      logger.debug(` Job ${jobId} is waiting to be processed`);
    });


    jobQueue.on('active', (job) => {
      logger.debug(` Job ${job.id} is now active`);
    });


    jobQueue.on('progress', (job, progress) => {
      logger.debug(`Job ${job.id} progress: ${progress}%`);
    });

 
    jobQueue.on('stalled', (job) => {
      logger.warn(`  Job ${job.id} stalled - Will be reprocessed`);
    });

    logger.success(' Worker is ready and listening for jobs...');
    logger.info(` Listening to queue: ${jobQueue.name}`);

    // Log queue stats periodically
    setInterval(async () => {
      const [waiting, active, completed, failed] = await Promise.all([
        jobQueue.getWaitingCount(),
        jobQueue.getActiveCount(),
        jobQueue.getCompletedCount(),
        jobQueue.getFailedCount(),
      ]);

      logger.info(` Queue Stats - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`);
    }, 60000);

    const gracefulShutdown = async (signal) => {
      logger.warn(`\n${signal} received, shutting down worker...`);
      
      await jobQueue.close();
      logger.info(' Queue closed');
      
      await mongoose.connection.close();
      logger.info(' MongoDB connection closed');
      
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error(' Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(' Unhandled Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error(' Failed to start worker:', error);
    process.exit(1);
  }
};

const checkAndCompleteImport = async (importLogId) => {
  try {
    const [waiting, active, delayed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getDelayedCount(),
    ]);

    // If no more jobs in queue, mark import as completed
    if (waiting === 0 && active === 0 && delayed === 0) {
      const importLog = await importlogModel.findById(importLogId);

      if (importLog && importLog.status === 'in-progress') {
        importLog.status = 'completed';
        importLog.endTime = new Date();
        importLog.duration = importLog.endTime - importLog.startTime;
        await importLog.save();

        logger.success(`\n Import completed: ${importLogId}`);
      }
    }
  } catch (error) {
    logger.error('Error checking import completion:', error);
  }
};

startWorker()
