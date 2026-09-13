import express from 'express';
import { loadIssuesFromDisk, saveIssuesToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/issues
router.get('/', (req, res) => {
  try {
    const issues = loadIssuesFromDisk();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load issues', details: err.message });
  }
});

// POST /api/issues
router.post('/', (req, res) => {
  try {
    const issues = loadIssuesFromDisk();
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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const issues = loadIssuesFromDisk();
    const idx = issues.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const updated = {
      ...issues[idx],
      ...req.body,
      id
    };

    if (req.body.status === 'RESOLVED' && issues[idx].status !== 'RESOLVED') {
      updated.resolvedAt = new Date().toISOString();
      appendActivityLog({
        eventType: 'ISSUE_RESOLVED',
        title: `Issue Resolved: ${updated.projectTitle}`,
        details: `Resolved by ${updated.assignee} • Notes: ${updated.resolutionNotes || 'Fix verified'}`,
        actor: updated.assignee || 'QA Team',
        severity: 'SUCCESS'
      });
    }

    issues[idx] = updated;
    saveIssuesToDisk(issues);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update issue', details: err.message });
  }
});

// DELETE /api/issues/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let issues = loadIssuesFromDisk();
    issues = issues.filter(i => i.id !== id);
    saveIssuesToDisk(issues);
    res.json({ message: 'Issue deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete issue', details: err.message });
  }
});

export default router;
