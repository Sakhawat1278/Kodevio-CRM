import express from 'express';
import { pool, isPgConnected, loadMeetingsFromDisk, saveMeetingsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

function mapMeetingRow(r) {
  if (!r) return null;
  let attendees = [];
  try {
    attendees = typeof r.attendees === 'string' ? JSON.parse(r.attendees) : (r.attendees || []);
  } catch (e) {
    attendees = [];
  }
  return {
    id: r.id,
    clientName: r.client_name,
    clientUsername: r.client_username,
    title: r.title,
    date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : null,
    time: r.time,
    platform: r.platform,
    link: r.link,
    attendees,
    status: r.status,
    agenda: r.agenda,
    createdAt: r.created_at
  };
}

// GET /api/meetings
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM meetings ORDER BY date ASC, created_at DESC');
        if (result.rows.length > 0) {
          const mapped = result.rows.map(mapMeetingRow);
          saveMeetingsToDisk(mapped);
          return res.json(mapped);
        }
      } catch (pgErr) {
        console.warn('PG fetch meetings error, falling back to disk:', pgErr.message);
      }
    }
    const meetings = loadMeetingsFromDisk() || [];
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load meetings', details: err.message });
  }
});

// POST /api/meetings
router.post('/', async (req, res) => {
  try {
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
      agenda: req.body.agenda || 'Project progress and milestone review',
      createdAt: new Date().toISOString()
    };

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO meetings (id, client_name, client_username, title, date, time, platform, link, attendees, status, agenda, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             client_name = EXCLUDED.client_name,
             client_username = EXCLUDED.client_username,
             title = EXCLUDED.title,
             date = EXCLUDED.date,
             time = EXCLUDED.time,
             platform = EXCLUDED.platform,
             link = EXCLUDED.link,
             attendees = EXCLUDED.attendees,
             status = EXCLUDED.status,
             agenda = EXCLUDED.agenda`,
          [
            newMeeting.id, newMeeting.clientName, newMeeting.clientUsername, newMeeting.title,
            newMeeting.date || null, newMeeting.time, newMeeting.platform, newMeeting.link,
            JSON.stringify(newMeeting.attendees), newMeeting.status, newMeeting.agenda, newMeeting.createdAt
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert meeting error:', pgErr.message);
      }
    }

    const meetings = loadMeetingsFromDisk() || [];
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const meetings = loadMeetingsFromDisk() || [];
    const idx = meetings.findIndex(m => m.id === id);

    const updated = {
      ...(idx !== -1 ? meetings[idx] : {}),
      ...req.body,
      id
    };

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE meetings SET
            client_name = COALESCE($1, client_name),
            client_username = COALESCE($2, client_username),
            title = COALESCE($3, title),
            date = COALESCE($4, date),
            time = COALESCE($5, time),
            platform = COALESCE($6, platform),
            link = COALESCE($7, link),
            attendees = COALESCE($8, attendees),
            status = COALESCE($9, status),
            agenda = COALESCE($10, agenda)
           WHERE id = $11`,
          [
            updated.clientName, updated.clientUsername, updated.title,
            updated.date || null, updated.time, updated.platform, updated.link,
            updated.attendees ? JSON.stringify(updated.attendees) : null,
            updated.status, updated.agenda, id
          ]
        );
      } catch (pgErr) {
        console.warn('PG update meeting error:', pgErr.message);
      }
    }

    if (idx !== -1) {
      meetings[idx] = updated;
    } else {
      meetings.unshift(updated);
    }
    saveMeetingsToDisk(meetings);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update meeting', details: err.message });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM meetings WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete meeting error:', pgErr.message);
      }
    }

    let meetings = loadMeetingsFromDisk() || [];
    meetings = meetings.filter(m => m.id !== id);
    saveMeetingsToDisk(meetings);
    res.json({ message: 'Meeting deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meeting', details: err.message });
  }
});

export default router;
