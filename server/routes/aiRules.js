import express from 'express';
import { loadAiRulesFromDisk, saveAiRulesToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/ai-rules
router.get('/', (req, res) => {
  try {
    const rules = loadAiRulesFromDisk();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load AI match rules', details: err.message });
  }
});

// POST /api/ai-rules
router.post('/', (req, res) => {
  try {
    const rules = loadAiRulesFromDisk();
    const newRule = {
      id: req.body.id || `air-${Date.now()}`,
      ruleName: req.body.ruleName || 'Smart Routing Rule',
      targetProfile: req.body.targetProfile || 'Kodevio Studio',
      keywords: Array.isArray(req.body.keywords) ? req.body.keywords : ['react', 'fullstack'],
      minBudget: Number(req.body.minBudget) || 500,
      autoDispatch: req.body.autoDispatch ?? true,
      priority: req.body.priority || 'MEDIUM',
      isActive: req.body.isActive ?? true
    };

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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rules = loadAiRulesFromDisk();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'AI rule not found' });
    }

    const updated = {
      ...rules[idx],
      ...req.body,
      id
    };

    rules[idx] = updated;
    saveAiRulesToDisk(rules);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update AI rule', details: err.message });
  }
});

// DELETE /api/ai-rules/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let rules = loadAiRulesFromDisk();
    rules = rules.filter(r => r.id !== id);
    saveAiRulesToDisk(rules);
    res.json({ message: 'AI rule deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete AI rule', details: err.message });
  }
});

export default router;
