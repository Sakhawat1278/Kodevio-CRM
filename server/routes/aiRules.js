import express from 'express';
import { pool, isPgConnected, loadAiRulesFromDisk, saveAiRulesToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

function mapAiRuleRow(r) {
  if (!r) return null;
  let keywords = [];
  try {
    keywords = typeof r.keywords === 'string' ? JSON.parse(r.keywords) : (r.keywords || []);
  } catch (e) {
    keywords = [];
  }
  return {
    id: r.id,
    ruleName: r.rule_name,
    targetProfile: r.target_profile,
    keywords,
    minBudget: parseFloat(r.min_budget) || 0,
    autoDispatch: r.auto_dispatch ?? true,
    priority: r.priority || 'MEDIUM',
    isActive: r.is_active ?? true,
    createdAt: r.created_at
  };
}

// GET /api/ai-rules
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM ai_rules ORDER BY priority DESC, created_at DESC');
        if (result.rows.length > 0) {
          const mapped = result.rows.map(mapAiRuleRow);
          saveAiRulesToDisk(mapped);
          return res.json(mapped);
        }
      } catch (pgErr) {
        console.warn('PG fetch AI rules error, falling back to disk:', pgErr.message);
      }
    }
    const rules = loadAiRulesFromDisk() || [];
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load AI match rules', details: err.message });
  }
});

// POST /api/ai-rules
router.post('/', async (req, res) => {
  try {
    const newRule = {
      id: req.body.id || `air-${Date.now()}`,
      ruleName: req.body.ruleName || 'Smart Routing Rule',
      targetProfile: req.body.targetProfile || 'Kodevio Studio',
      keywords: Array.isArray(req.body.keywords) ? req.body.keywords : ['react', 'fullstack'],
      minBudget: Number(req.body.minBudget) || 500,
      autoDispatch: req.body.autoDispatch ?? true,
      priority: req.body.priority || 'MEDIUM',
      isActive: req.body.isActive ?? true,
      createdAt: new Date().toISOString()
    };

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO ai_rules (id, rule_name, target_profile, keywords, min_budget, auto_dispatch, priority, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             rule_name = EXCLUDED.rule_name,
             target_profile = EXCLUDED.target_profile,
             keywords = EXCLUDED.keywords,
             min_budget = EXCLUDED.min_budget,
             auto_dispatch = EXCLUDED.auto_dispatch,
             priority = EXCLUDED.priority,
             is_active = EXCLUDED.is_active`,
          [
            newRule.id, newRule.ruleName, newRule.targetProfile, JSON.stringify(newRule.keywords),
            newRule.minBudget, newRule.autoDispatch, newRule.priority, newRule.isActive, newRule.createdAt
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert AI rule error:', pgErr.message);
      }
    }

    const rules = loadAiRulesFromDisk() || [];
    rules.unshift(newRule);
    saveAiRulesToDisk(rules);

    appendActivityLog({
      eventType: 'AI_RULE_CREATED',
      title: `AI Match Rule Created: ${newRule.ruleName}`,
      details: `Routes to: ${newRule.targetProfile} • Keywords: ${newRule.keywords.join(', ')}`,
      actor: 'AI Rule Engine',
      severity: 'INFO'
    });

    res.status(201).json(newRule);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create AI rule', details: err.message });
  }
});

// PUT /api/ai-rules/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rules = loadAiRulesFromDisk() || [];
    const idx = rules.findIndex(r => r.id === id);

    const updated = {
      ...(idx !== -1 ? rules[idx] : {}),
      ...req.body,
      id
    };

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE ai_rules SET
            rule_name = COALESCE($1, rule_name),
            target_profile = COALESCE($2, target_profile),
            keywords = COALESCE($3, keywords),
            min_budget = COALESCE($4, min_budget),
            auto_dispatch = COALESCE($5, auto_dispatch),
            priority = COALESCE($6, priority),
            is_active = COALESCE($7, is_active)
           WHERE id = $8`,
          [
            updated.ruleName, updated.targetProfile,
            updated.keywords ? JSON.stringify(updated.keywords) : null,
            updated.minBudget, updated.autoDispatch, updated.priority, updated.isActive, id
          ]
        );
      } catch (pgErr) {
        console.warn('PG update AI rule error:', pgErr.message);
      }
    }

    if (idx !== -1) {
      rules[idx] = updated;
    } else {
      rules.unshift(updated);
    }
    saveAiRulesToDisk(rules);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update AI rule', details: err.message });
  }
});

// DELETE /api/ai-rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM ai_rules WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete AI rule error:', pgErr.message);
      }
    }

    let rules = loadAiRulesFromDisk() || [];
    rules = rules.filter(r => r.id !== id);
    saveAiRulesToDisk(rules);
    res.json({ message: 'AI rule deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete AI rule', details: err.message });
  }
});

export default router;
