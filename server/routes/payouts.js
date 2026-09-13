import express from 'express';
import { loadPayoutsLedgerFromDisk, savePayoutsLedgerToDisk, appendActivityLog } from '../db.js';

const router = express.Router();

// GET /api/payouts
router.get('/', (req, res) => {
  try {
    const payouts = loadPayoutsLedgerFromDisk();
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payouts ledger', details: err.message });
  }
});

// POST /api/payouts
router.post('/', (req, res) => {
  try {
    const payouts = loadPayoutsLedgerFromDisk();
    const newPayout = {
      id: req.body.id || `pay-${Date.now()}`,
      staffId: req.body.staffId || 'usr-gen',
      staffName: req.body.staffName || 'Team Member',
      role: req.body.role || 'Specialist',
      department: req.body.department || 'Operations',
      month: req.body.month || 'August-2026',
      baseSalary: Number(req.body.baseSalary) || 0,
      achievedVolume: Number(req.body.achievedVolume) || 0,
      bonusMultiplier: req.body.bonusMultiplier || '1.0x',
      bonusAmount: Number(req.body.bonusAmount) || 0,
      totalPayout: (Number(req.body.baseSalary) || 0) + (Number(req.body.bonusAmount) || 0),
      currency: req.body.currency || 'USD',
      status: req.body.status || 'PENDING',
      paymentDate: req.body.paymentDate || new Date().toISOString().split('T')[0],
      transactionRef: req.body.transactionRef || `TXN-KDV-${Math.floor(100000 + Math.random() * 900000)}`
    };

    payouts.unshift(newPayout);
    savePayoutsLedgerToDisk(payouts);

    appendActivityLog({
      eventType: 'PAYOUT_DISPATCHED',
      title: `Compensation Ledger Updated: ${newPayout.staffName}`,
      details: `Total: $${newPayout.totalPayout.toLocaleString()} (Base: $${newPayout.baseSalary} + Bonus: $${newPayout.bonusAmount}) • Status: ${newPayout.status}`,
      actor: 'Payroll Engine',
      severity: 'SUCCESS'
    });

    res.status(201).json(newPayout);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payout record', details: err.message });
  }
});

// PUT /api/payouts/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const payouts = loadPayoutsLedgerFromDisk();
    const idx = payouts.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Payout record not found' });
    }

    const updated = {
      ...payouts[idx],
      ...req.body,
      id
    };

    payouts[idx] = updated;
    savePayoutsLedgerToDisk(payouts);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payout record', details: err.message });
  }
});

// DELETE /api/payouts/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let payouts = loadPayoutsLedgerFromDisk();
    payouts = payouts.filter(p => p.id !== id);
    savePayoutsLedgerToDisk(payouts);
    res.json({ message: 'Payout record deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payout record', details: err.message });
  }
});

export default router;
