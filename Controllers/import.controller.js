import importlogModel from "../models/Importlog.model.js"
import { getQueueStats, addJobsToQueue } from "../Services/Queuemanager.js"
import { fetchJobsFromAPI } from "../Services/Jobfecher.js"
import { logger , } from "../utils/logger.js"

const getImportLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = status ? { status } : {};

    const logs = await importlogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await importlogModel.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching import logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import logs',
      error: error.message,
    });
  }
};

/**
 * Get single import log by ID
 * @route GET /api/imports/:id
 */
const getImportLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await importlogModel.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Import log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    logger.error('Error fetching import log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import log',
      error: error.message,
    });
  }
};

/**
 * Get import statistics
 * @route GET /api/imports/stats
 */
const getImportStats = async (req, res) => {
  try {
    const totalLogs = await importlogModel.countDocuments();
    const completedLogs = await importlogModel.countDocuments({ status: 'completed' });
    const failedLogs = await importlogModel.countDocuments({ status: 'failed' });
    const inProgressLogs = await importlogModel.countDocuments({ status: 'in-progress' });

    const aggregateStats = await importlogModel.aggregate([
      {
        $group: {
          _id: null,
          totalFetched: { $sum: '$totalFetched' },
          totalImported: { $sum: '$totalImported' },
          totalNew: { $sum: '$newJobs' },
          totalUpdated: { $sum: '$updatedJobs' },
          totalFailed: { $sum: '$failedJobs' },
        },
      },
    ]);

    const stats = aggregateStats[0] || {
      totalFetched: 0,
      totalImported: 0,
      totalNew: 0,
      totalUpdated: 0,
      totalFailed: 0,
    };

    res.json({
      success: true,
      data: {
        logs: {
          total: totalLogs,
          completed: completedLogs,
          failed: failedLogs,
          inProgress: inProgressLogs,
        },
        jobs: {
          totalFetched: stats.totalFetched,
          totalImported: stats.totalImported,
          new: stats.totalNew,
          updated: stats.totalUpdated,
          failed: stats.totalFailed,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching import stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import stats',
      error: error.message,
    });
  }
};

/**
 * Get queue statistics
 * @route GET /api/imports/queue
 */
const getQueueStat = async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue stats',
      error: error.message,
    });
  }
};

/**
 * Trigger manual import
 * @route POST /api/imports/trigger
 */
const triggerManualImport = async (req, res) => {
  try {
    const { apiUrl } = req.body;

    if (!apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'API URL is required',
      });
    }

    // Fetch jobs from the API
    const jobs = await fetchJobsFromAPI(apiUrl);
    
    // Add jobs to queue
    const importLogId = await addJobsToQueue(jobs, apiUrl);

    res.json({
      success: true,
      message: 'Manual import triggered successfully',
      data: {
        importLogId,
        jobsCount: jobs.length,
      },
    });
  } catch (error) {
    logger.error('Error triggering manual import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual import',
      error: error.message,
    });
  }
};

export {
  getImportLogs,
  getImportLogById,
  getImportStats,
  getQueueStat,
  triggerManualImport,
};

