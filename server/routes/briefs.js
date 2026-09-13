import express from 'express';
import { pool, isPgConnected, loadBriefsFromDisk, saveBriefsToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

function mapBriefRow(r) {
  if (!r) return null;
  let raw = {};
  try {
    raw = typeof r.raw_json === 'string' ? JSON.parse(r.raw_json) : (r.raw_json || {});
  } catch (e) {
    raw = {};
  }
  return {
    id: r.id,
    buyerName: r.buyer_name,
    buyerUsername: r.buyer_username,
    country: r.country,
    flag: r.flag,
    title: r.title,
    description: r.description,
    budget: parseFloat(r.budget) || 0,
    currency: r.currency || 'USD',
    targetProfile: r.target_profile,
    matchScore: r.match_score || 90,
    status: r.status,
    category: r.category || raw.category || 'Web Development',
    dispatchedAt: r.dispatched_at || raw.dispatchedAt || null,
    createdAt: r.created_at
  };
}

// GET /api/briefs
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM fiverr_briefs ORDER BY created_at DESC');
        if (result.rows.length > 0) {
          const mapped = result.rows.map(mapBriefRow);
          saveBriefsToDisk(mapped);
          return res.json(mapped);
        }
      } catch (pgErr) {
        console.warn('PG fetch briefs error, falling back to disk:', pgErr.message);
      }
    }
    const briefs = loadBriefsFromDisk() || [];
    res.json(briefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load briefs', details: err.message });
  }
});

// POST /api/briefs
router.post('/', async (req, res) => {
  try {
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

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO fiverr_briefs (
            id, buyer_name, buyer_username, country, flag, title, description,
            budget, currency, target_profile, match_score, status, category, dispatched_at, raw_json, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            buyer_name = EXCLUDED.buyer_name,
            buyer_username = EXCLUDED.buyer_username,
            country = EXCLUDED.country,
            flag = EXCLUDED.flag,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            budget = EXCLUDED.budget,
            currency = EXCLUDED.currency,
            target_profile = EXCLUDED.target_profile,
            match_score = EXCLUDED.match_score,
            status = EXCLUDED.status,
            category = EXCLUDED.category,
            dispatched_at = EXCLUDED.dispatched_at,
            raw_json = EXCLUDED.raw_json`,
          [
            newBrief.id, newBrief.buyerName, newBrief.buyerUsername, newBrief.country, newBrief.flag,
            newBrief.title, newBrief.description, newBrief.budget, newBrief.currency, newBrief.targetProfile,
            newBrief.matchScore, newBrief.status, newBrief.category, newBrief.dispatchedAt,
            JSON.stringify({ matchScore: newBrief.matchScore, category: newBrief.category, dispatchedAt: newBrief.dispatchedAt }),
            newBrief.createdAt
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert brief error:', pgErr.message);
      }
    }

    const briefs = loadBriefsFromDisk() || [];
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const briefs = loadBriefsFromDisk() || [];
    const idx = briefs.findIndex(b => b.id === id);

    const updated = {
      ...(idx !== -1 ? briefs[idx] : {}),
      ...req.body,
      id
    };

    if (req.body.status === 'DISPATCHED' && (!briefs[idx] || briefs[idx].status !== 'DISPATCHED')) {
      updated.dispatchedAt = new Date().toISOString();
      appendActivityLog({
        eventType: 'BRIEF_DISPATCHED',
        title: `Buyer Brief Auto-Dispatched: ${updated.title}`,
        details: `Assigned to: ${updated.targetProfile} • Confidence: ${updated.matchScore}%`,
        actor: 'Auto-Dispatcher',
        severity: 'SUCCESS'
      });
    }

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE fiverr_briefs SET
            buyer_name = COALESCE($1, buyer_name),
            buyer_username = COALESCE($2, buyer_username),
            country = COALESCE($3, country),
            flag = COALESCE($4, flag),
            title = COALESCE($5, title),
            description = COALESCE($6, description),
            budget = COALESCE($7, budget),
            currency = COALESCE($8, currency),
            target_profile = COALESCE($9, target_profile),
            match_score = COALESCE($10, match_score),
            status = COALESCE($11, status),
            category = COALESCE($12, category),
            dispatched_at = COALESCE($13, dispatched_at),
            raw_json = COALESCE($14, raw_json)
           WHERE id = $15`,
          [
            updated.buyerName, updated.buyerUsername, updated.country, updated.flag,
            updated.title, updated.description, updated.budget, updated.currency,
            updated.targetProfile, updated.matchScore, updated.status, updated.category,
            updated.dispatchedAt,
            JSON.stringify({ matchScore: updated.matchScore, category: updated.category, dispatchedAt: updated.dispatchedAt }),
            id
          ]
        );
      } catch (pgErr) {
        console.warn('PG update brief error:', pgErr.message);
      }
    }

    if (idx !== -1) {
      briefs[idx] = updated;
    } else {
      briefs.unshift(updated);
    }
    saveBriefsToDisk(briefs);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brief', details: err.message });
  }
});

// DELETE /api/briefs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM fiverr_briefs WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete brief error:', pgErr.message);
      }
    }

    let briefs = loadBriefsFromDisk() || [];
    briefs = briefs.filter(b => b.id !== id);
    saveBriefsToDisk(briefs);
    res.json({ message: 'Brief deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brief', details: err.message });
  }
});

export default router;
