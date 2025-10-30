import express from "express";
const router = express.Router()
import { getImportLogs, getImportStats, getQueueStat, getImportLogById,  triggerManualImport } from "../Controllers/import.controller.js"

router.get('/', getImportLogs);

// Get import statistics
router.get('/stats', getImportStats);

// Get queue statistics
router.get('/queue', getQueueStat);

// Get single import log by ID
router.get('/:id', getImportLogById);

// Trigger manual import
router.post('/trigger', triggerManualImport);

export default router


