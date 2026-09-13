import express from 'express';
import { loadMeetingsFromDisk, saveMeetingsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/meetings
router.get('/', (req, res) => {
  try {
    const meetings = loadMeetingsFromDisk();
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load meetings', details: err.message });
  }
});

// POST /api/meetings
router.post('/', (req, res) => {
  try {
    const meetings = loadMeetingsFromDisk();
    const newMeeting = {
      id: req.body.id || `meet-${Date.now()}`,
      clientName: req.body.clientName || 'Client',
      clientUsername: req.body.clientUsername || 'client_user',
      title: req.body.title || 'Client Architecture Sync',
      date: req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || '15:00 UTC',
      platform: req.body.platform || 'Google Meet',
      link: req.body.link || 'https://meet.google.com/kdv-live-sync',
      attendees: Array.isArray(req.body.attendees) ? req.body.attendees : [req.body.clientName || 'Client', 'Super Admin'],
      status: req.body.status || 'SCHEDULED',
      agenda: req.body.agenda || 'Project progress and milestone review'
    };

    meetings.unshift(newMeeting);
    saveMeetingsToDisk(meetings);

    appendActivityLog({
      eventType: 'MEETING_SCHEDULED',
      title: `Client Meeting Scheduled: ${newMeeting.clientName}`,
      details: `${newMeeting.title} • Date: ${newMeeting.date} at ${newMeeting.time} via ${newMeeting.platform}`,
      actor: 'Executive Calendar',
      severity: 'INFO'
    });

    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule meeting', details: err.message });
  }
});

// PUT /api/meetings/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const meetings = loadMeetingsFromDisk();
    const idx = meetings.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const updated = {
      ...meetings[idx],
      ...req.body,
      id
    };

    meetings[idx] = updated;
    saveMeetingsToDisk(meetings);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update meeting', details: err.message });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let meetings = loadMeetingsFromDisk();
    meetings = meetings.filter(m => m.id !== id);
    saveMeetingsToDisk(meetings);
    res.json({ message: 'Meeting deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meeting', details: err.message });
  }
});

export default router;
