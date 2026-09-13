import express from 'express';
import { loadActivityLogsFromDisk, saveActivityLogsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/activity-logs
router.get('/', (req, res) => {
  try {
    const logs = loadActivityLogsFromDisk();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load activity logs', details: err.message });
  }
});

// POST /api/activity-logs
router.post('/', (req, res) => {
  try {
    const newLog = appendActivityLog({
      eventType: req.body.eventType || 'SYSTEM_EVENT',
      title: req.body.title || 'System Mutation Recorded',
      details: req.body.details || '',
      actor: req.body.actor || 'User',
      severity: req.body.severity || 'INFO'
    });
    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log event', details: err.message });
  }
});

// DELETE /api/activity-logs (Clear Logs)
router.delete('/', (req, res) => {
  try {
    saveActivityLogsToDisk([]);
    res.json({ message: 'Activity logs cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs', details: err.message });
  }
});

export default router;
