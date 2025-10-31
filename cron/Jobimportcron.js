import cron from "node-cron"
import { fetchJobsFromAPI } from "../Services/Jobfecher.js"
import {addJobsToQueue} from "../Services/Queuemanager.js"
import { API_URLS } from "../config/constant.js"
import { logger } from "../utils/logger.js"

let cronJob = null;


 // Run job import for all API URLs
 // This function fetches jobs from all configured APIs and adds them to the queue
 
const runJobImport = async () => {

  let totalJobsFetched = 0;
  let totalAPIsProcessed = 0;
  let totalAPIsFailed = 0;

  for (const apiUrl of API_URLS) {
    try {
      logger.info(`\nProcessing: ${apiUrl}`);

      const jobs = await fetchJobsFromAPI(apiUrl);

      if (jobs.length === 0) {
        logger.warn(`No jobs found from ${apiUrl}`);
        continue;
      }

      const importLogId = await addJobsToQueue(jobs, apiUrl);

      logger.success(` Queued ${jobs.length} jobs (Log ID: ${importLogId})`);
      
      totalJobsFetched += jobs.length;
      totalAPIsProcessed++;

    } catch (error) {
      logger.error(` Error processing ${apiUrl}:`, error.message);
      totalAPIsFailed++;
      continue;
    }
  }


  return {
    totalAPIsProcessed,
    totalAPIsFailed,
    totalJobsFetched,
  };
};


const startCronJob = () => {
  const schedule = process.env.CRON_SCHEDULE || '0 * * * *'; // Default: Every hour

  logger.info(` Starting cron job with schedule: ${schedule}`);
  logger.info(` Next execution will be at: ${getNextCronTime(schedule)}`);

  cronJob = cron.schedule(schedule, async () => {
    try {
      await runJobImport();
    } catch (error) {
      logger.error('Error in cron job execution:', error);
    }
  });

  logger.success('✅ Cron job started successfully');
  
  return cronJob;
};


const stopCronJob = () => {
  if (cronJob) {
    cronJob.stop();
    logger.warn(' Cron job stopped');
  } else {
    logger.warn(' No cron job to stop');
  }
};


const getCronJobStatus = () => {
  return {
    isRunning: cronJob ? true : false,
    schedule: process.env.CRON_SCHEDULE || '0 * * * *',
    nextRun: cronJob ? getNextCronTime(process.env.CRON_SCHEDULE || '0 * * * *') : null,
  };
};

const getNextCronTime = (schedule) => {
  try {
    // Simple approximation  for accurate calculation, use a cron parser library
    const now = new Date();
    const parts = schedule.split(' ');
    
    if (parts[1] === '*') {
      // Runs every hour
      const next = new Date(now);
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      next.setSeconds(0);
      return next.toISOString();
    }
    
    return 'Unknown (check cron schedule)';
  } catch (error) {
    return 'Unknown';
  }
};

export {
  startCronJob,
  stopCronJob,
  runJobImport,
  getCronJobStatus,
};
