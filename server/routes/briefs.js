import express from 'express';
import { loadBriefsFromDisk, saveBriefsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/briefs
router.get('/', (req, res) => {
  try {
    const briefs = loadBriefsFromDisk();
    res.json(briefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load briefs', details: err.message });
  }
});

// POST /api/briefs
router.post('/', (req, res) => {
  try {
    const briefs = loadBriefsFromDisk();
    const newBrief = {
      id: req.body.id || `brf-${Date.now()}`,
      buyerName: req.body.buyerName || 'Prospective Client',
      buyerUsername: req.body.buyerUsername || 'client_user',
      country: req.body.country || 'United States',
      flag: req.body.flag || '🇺🇸',
      title: req.body.title || 'Custom Application Milestone',
      description: req.body.description || '',
      budget: Number(req.body.budget) || 1000,
      currency: req.body.currency || 'USD',
      targetProfile: req.body.targetProfile || 'Kodevio Studio',
      matchScore: Number(req.body.matchScore) || 90,
      status: req.body.status || 'PENDING_DISPATCH',
      category: req.body.category || 'Web Development',
      dispatchedAt: req.body.status === 'DISPATCHED' ? new Date().toISOString() : null,
      createdAt: req.body.createdAt || new Date().toISOString()
    };

    briefs.unshift(newBrief);
    saveBriefsToDisk(briefs);

    appendActivityLog({
      eventType: 'BRIEF_CREATED',
      title: `New Buyer Brief: ${newBrief.title}`,
      details: `Budget: $${newBrief.budget} • Buyer: ${newBrief.buyerName}`,
      actor: 'Inflow Engine',
      severity: 'INFO'
    });

    res.status(201).json(newBrief);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create brief', details: err.message });
  }
});

// PUT /api/briefs/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const briefs = loadBriefsFromDisk();
    const idx = briefs.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    const updated = {
      ...briefs[idx],
      ...req.body,
      id
    };

    if (req.body.status === 'DISPATCHED' && briefs[idx].status !== 'DISPATCHED') {
      updated.dispatchedAt = new Date().toISOString();
      appendActivityLog({
        eventType: 'BRIEF_DISPATCHED',
        title: `Buyer Brief Auto-Dispatched: ${updated.title}`,
        details: `Assigned to: ${updated.targetProfile} • Confidence: ${updated.matchScore}%`,
        actor: 'Auto-Dispatcher',
        severity: 'SUCCESS'
      });
    }

    briefs[idx] = updated;
    saveBriefsToDisk(briefs);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brief', details: err.message });
  }
});

// DELETE /api/briefs/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let briefs = loadBriefsFromDisk();
    briefs = briefs.filter(b => b.id !== id);
    saveBriefsToDisk(briefs);
    res.json({ message: 'Brief deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brief', details: err.message });
  }
});

export default router;
