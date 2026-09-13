import express from 'express';
import { pool, isPgConnected, loadActivityLogsFromDisk, saveActivityLogsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

function mapLogRow(r) {
  return {
    id: r.id,
    eventType: r.event_type,
    title: r.title,
    details: r.details,
    actor: r.actor,
    severity: r.severity,
    timestamp: r.timestamp
  };
}

// GET /api/activity-logs
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 200');
        if (result.rows.length > 0) {
          const mapped = result.rows.map(mapLogRow);
          saveActivityLogsToDisk(mapped);
          return res.json(mapped);
        }
      } catch (pgErr) {
        console.warn('PG fetch activity logs error, falling back to disk:', pgErr.message);
      }
    }
    const logs = loadActivityLogsFromDisk() || [];
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
router.delete('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM activity_logs');
      } catch (pgErr) {
        console.warn('PG delete activity logs error:', pgErr.message);
      }
    }
    saveActivityLogsToDisk([]);
    res.json({ message: 'Activity logs cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs', details: err.message });
  }
});

export default router;
