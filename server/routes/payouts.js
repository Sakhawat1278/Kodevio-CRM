import express from 'express';
import {
  pool,
  isPgConnected,
  loadPayoutsLedgerFromDisk,
  savePayoutsLedgerToDisk,
  appendActivityLog
} from '../db.js';

const router = express.Router();

function mapPayoutRow(r) {
  return {
    id: r.id,
    staffId: r.staff_id,
    staffName: r.staff_name,
    role: r.role,
    department: r.department,
    month: r.month,
    baseSalary: Number(r.base_salary) || 0,
    achievedVolume: Number(r.achieved_volume) || 0,
    bonusMultiplier: r.bonus_multiplier || '1.0x',
    bonusAmount: Number(r.bonus_amount) || 0,
    totalPayout: Number(r.total_payout) || 0,
    currency: r.currency || 'USD',
    status: r.status || 'PENDING',
    paymentDate: r.payment_date ? new Date(r.payment_date).toISOString().split('T')[0] : '',
    transactionRef: r.transaction_ref,
    createdAt: r.created_at,
  };
}

// GET /api/payouts
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM payouts_ledger ORDER BY created_at DESC');
        if (result.rows.length > 0) {
          const livePayouts = result.rows.map(mapPayoutRow);
          savePayoutsLedgerToDisk(livePayouts);
          return res.json(livePayouts);
        }
      } catch (pgErr) {
        console.warn('PG fetch payouts error, falling back to disk:', pgErr.message);
      }
    }
    const payouts = loadPayoutsLedgerFromDisk() || [];
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payouts ledger', details: err.message });
  }
});

// POST /api/payouts
router.post('/', async (req, res) => {
  try {
    const payouts = loadPayoutsLedgerFromDisk() || [];
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
      transactionRef: req.body.transactionRef || `TXN-KDV-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString()
    };

    payouts.unshift(newPayout);
    savePayoutsLedgerToDisk(payouts);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO payouts_ledger (
            id, month, staff_id, staff_name, role, department, base_salary, achieved_volume,
            bonus_multiplier, bonus_amount, total_payout, status, payment_date, transaction_ref, currency, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            payment_date = EXCLUDED.payment_date,
            transaction_ref = EXCLUDED.transaction_ref,
            bonus_amount = EXCLUDED.bonus_amount,
            total_payout = EXCLUDED.total_payout`,
          [
            newPayout.id, newPayout.month, newPayout.staffId, newPayout.staffName, newPayout.role,
            newPayout.department, newPayout.baseSalary, newPayout.achievedVolume, newPayout.bonusMultiplier,
            newPayout.bonusAmount, newPayout.totalPayout, newPayout.status, newPayout.paymentDate || null,
            newPayout.transactionRef, newPayout.currency, newPayout.createdAt
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert payout error:', pgErr.message);
      }
    }

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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payouts = loadPayoutsLedgerFromDisk() || [];
    const idx = payouts.findIndex(p => p.id === id);

    const current = idx !== -1 ? payouts[idx] : { id };
    const updated = {
      ...current,
      ...req.body,
      id
    };

    if (idx !== -1) {
      payouts[idx] = updated;
    } else {
      payouts.unshift(updated);
    }
    savePayoutsLedgerToDisk(payouts);

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE payouts_ledger SET
            status = COALESCE($2, status),
            payment_date = COALESCE($3, payment_date),
            transaction_ref = COALESCE($4, transaction_ref),
            bonus_amount = COALESCE($5, bonus_amount),
            total_payout = COALESCE($6, total_payout),
            month = COALESCE($7, month)
          WHERE id = $1`,
          [id, updated.status, updated.paymentDate || null, updated.transactionRef, updated.bonusAmount, updated.totalPayout, updated.month]
        );
      } catch (pgErr) {
        console.warn('PG update payout error:', pgErr.message);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payout record', details: err.message });
  }
});

// DELETE /api/payouts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let payouts = loadPayoutsLedgerFromDisk() || [];
    payouts = payouts.filter(p => p.id !== id);
    savePayoutsLedgerToDisk(payouts);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM payouts_ledger WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete payout error:', pgErr.message);
      }
    }

    res.json({ message: 'Payout record deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payout record', details: err.message });
  }
});

export default router;
