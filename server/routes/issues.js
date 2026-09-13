import express from 'express';
import {
  pool,
  isPgConnected,
  loadIssuesFromDisk,
  saveIssuesToDisk,
  appendActivityLog
} from '../db.js';

const router = express.Router();

function mapIssueRow(r) {
  return {
    id: r.id,
    projectId: r.project_id,
    projectTitle: r.project_title,
    clientName: r.client_name,
    clientUsername: r.client_username,
    severity: r.severity,
    issueType: r.issue_type,
    description: r.description,
    status: r.status,
    assignee: r.assignee,
    resolutionNotes: r.resolution_notes,
    reportedAt: r.reported_at,
    resolvedAt: r.resolved_at,
  };
}

// GET /api/issues
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM issues ORDER BY reported_at DESC');
        if (result.rows.length > 0) {
          const liveIssues = result.rows.map(mapIssueRow);
          saveIssuesToDisk(liveIssues);
          return res.json(liveIssues);
        }
      } catch (pgErr) {
        console.warn('PG fetch issues error, falling back to disk:', pgErr.message);
      }
    }
    const issues = loadIssuesFromDisk() || [];
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load issues', details: err.message });
  }
});

// POST /api/issues
router.post('/', async (req, res) => {
  try {
    const issues = loadIssuesFromDisk() || [];
    const newIssue = {
      id: req.body.id || `iss-${Date.now()}`,
      projectId: req.body.projectId || 'proj-gen',
      projectTitle: req.body.projectTitle || 'General Project',
      clientName: req.body.clientName || 'Client',
      clientUsername: req.body.clientUsername || 'client_user',
      severity: req.body.severity || 'MEDIUM',
      issueType: req.body.issueType || 'Bug',
      description: req.body.description || '',
      status: req.body.status || 'OPEN',
      assignee: req.body.assignee || 'Super Admin',
      resolutionNotes: req.body.resolutionNotes || '',
      reportedAt: req.body.reportedAt || new Date().toISOString(),
      resolvedAt: req.body.status === 'RESOLVED' ? new Date().toISOString() : null
    };

    issues.unshift(newIssue);
    saveIssuesToDisk(issues);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO issues (
            id, project_id, project_title, client_name, client_username, severity, issue_type,
            description, status, assignee, resolution_notes, reported_at, resolved_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            assignee = EXCLUDED.assignee,
            resolution_notes = EXCLUDED.resolution_notes,
            resolved_at = EXCLUDED.resolved_at`,
          [
            newIssue.id, newIssue.projectId, newIssue.projectTitle, newIssue.clientName,
            newIssue.clientUsername, newIssue.severity, newIssue.issueType, newIssue.description,
            newIssue.status, newIssue.assignee, newIssue.resolutionNotes, newIssue.reportedAt, newIssue.resolvedAt
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert issue error:', pgErr.message);
      }
    }

    appendActivityLog({
      eventType: 'ISSUE_REPORTED',
      title: `Post-Delivery Issue Filed: ${newIssue.projectTitle}`,
      details: `Type: ${newIssue.issueType} • Severity: ${newIssue.severity} • Assignee: ${newIssue.assignee}`,
      actor: 'Support Desk',
      severity: 'WARNING'
    });

    res.status(201).json(newIssue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create issue', details: err.message });
  }
});

// PUT /api/issues/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issues = loadIssuesFromDisk() || [];
    const idx = issues.findIndex(i => i.id === id);

    const current = idx !== -1 ? issues[idx] : { id };
    const updated = {
      ...current,
      ...req.body,
      id
    };

    if (req.body.status === 'RESOLVED' && current.status !== 'RESOLVED') {
      updated.resolvedAt = new Date().toISOString();
      appendActivityLog({
        eventType: 'ISSUE_RESOLVED',
        title: `Issue Resolved: ${updated.projectTitle}`,
        details: `Resolved by ${updated.assignee} • Notes: ${updated.resolutionNotes || 'Fix verified'}`,
        actor: updated.assignee || 'QA Team',
        severity: 'SUCCESS'
      });
    }

    if (idx !== -1) {
      issues[idx] = updated;
    } else {
      issues.unshift(updated);
    }
    saveIssuesToDisk(issues);

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE issues SET
            status = COALESCE($2, status),
            assignee = COALESCE($3, assignee),
            severity = COALESCE($4, severity),
            resolution_notes = COALESCE($5, resolution_notes),
            resolved_at = COALESCE($6, resolved_at)
          WHERE id = $1`,
          [id, updated.status, updated.assignee, updated.severity, updated.resolutionNotes, updated.resolvedAt || null]
        );
      } catch (pgErr) {
        console.warn('PG update issue error:', pgErr.message);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update issue', details: err.message });
  }
});

// DELETE /api/issues/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let issues = loadIssuesFromDisk() || [];
    issues = issues.filter(i => i.id !== id);
    saveIssuesToDisk(issues);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM issues WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete issue error:', pgErr.message);
      }
    }

    res.json({ message: 'Issue deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete issue', details: err.message });
  }
});

export default router;
