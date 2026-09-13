import express from 'express';
import {
  pool,
  isPgConnected,
  loadLeavesFromDisk,
  saveLeavesToDisk,
  loadUsersFromDisk,
  appendActivityLog
} from '../db.js';

const router = express.Router();

function mapLeaveRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    userCode: r.user_code,
    userName: r.user_name,
    userEmail: r.user_email,
    userAvatar: r.user_avatar,
    department: r.department,
    role: r.role,
    leaveType: r.leave_type,
    leaveCategory: r.leave_category,
    isHalfDay: Boolean(r.is_half_day),
    halfDaySession: r.half_day_session,
    startDate: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : '',
    endDate: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : '',
    totalDays: Number(r.total_days) || 1,
    reason: r.reason,
    handoverPerson: r.handover_person,
    emergencyContact: r.emergency_contact,
    attachment: r.attachment,
    status: r.status,
    appliedAt: r.applied_at,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    managerRemarks: r.manager_remarks,
  };
}

// Helper to calculate business days between two dates
function calculateBusinessDays(startDateStr, endDateStr, isHalfDay = false) {
  if (isHalfDay) return 0.5;
  if (!startDateStr || !endDateStr) return 1;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  if (start > end) return 1;

  let count = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 5 is Friday or 6 is Saturday
    // Consider Friday & Saturday or Sunday as weekend (standard 5-day week)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return Math.max(1, count);
}

// GET /api/leaves - Retrieve leaves data, quotas, and computed balances
router.get('/', async (req, res) => {
  try {
    let quotas = { casual: 14, sick: 10, annual: 15, emergency: 5, maternity: 90, paternity: 10 };
    let leaves = [];

    if (isPgConnected) {
      try {
        const qRes = await pool.query("SELECT quotas FROM leave_quotas WHERE id = 'default'");
        if (qRes.rows.length > 0 && qRes.rows[0].quotas) {
          quotas = qRes.rows[0].quotas;
        }
        const lRes = await pool.query('SELECT * FROM leaves ORDER BY applied_at DESC');
        if (lRes.rows.length > 0) {
          leaves = lRes.rows.map(mapLeaveRow);
        }
      } catch (pgErr) {
        console.warn('PG fetch leaves error, falling back to disk:', pgErr.message);
      }
    }

    if (leaves.length === 0) {
      const diskData = loadLeavesFromDisk() || { quotas, leaves: [] };
      if (diskData.quotas) quotas = diskData.quotas;
      if (Array.isArray(diskData.leaves)) leaves = diskData.leaves;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute metrics
    const totalCount = leaves.length;
    const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
    const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
    const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

    // Who is currently on leave today
    const onLeaveToday = leaves.filter(l => {
      if (l.status !== 'APPROVED') return false;
      const s = l.startDate;
      const e = l.endDate || l.startDate;
      return todayStr >= s && todayStr <= e;
    });

    res.json({
      success: true,
      quotas,
      leaves,
      metrics: {
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        onLeaveTodayCount: onLeaveToday.length,
        onLeaveTodayList: onLeaveToday,
      },
    });
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ error: 'Failed to load leaves database' });
  }
});

// POST /api/leaves/apply - Submit a new leave application
router.post('/apply', async (req, res) => {
  try {
    const data = loadLeavesFromDisk() || { quotas: {}, leaves: [] };
    const {
      userId,
      userCode,
      userName,
      userEmail,
      userAvatar,
      department,
      role,
      leaveType,
      isHalfDay,
      halfDaySession,
      startDate,
      endDate,
      reason,
      handoverPerson,
      emergencyContact,
      attachment,
    } = req.body;

    if (!startDate || !leaveType || !reason) {
      return res.status(400).json({ error: 'Start date, leave type, and reason are required' });
    }

    const calculatedDays = calculateBusinessDays(startDate, endDate || startDate, isHalfDay);
    const newId = req.body.id || `LV-${1000 + data.leaves.length + 1}`;

    const categoryMap = {
      casual: 'Casual Leave (CL)',
      sick: 'Sick / Medical Leave (SL)',
      annual: 'Annual / Earned Leave (AL)',
      emergency: 'Emergency Leave (EL)',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      unpaid: 'Leave Without Pay (LWP)',
    };

    const newLeave = {
      id: newId,
      userId: userId || `usr-${Date.now()}`,
      userCode: userCode || 'K001',
      userName: userName || 'Team Member',
      userEmail: userEmail || 'member@kodevio.com',
      userAvatar: userAvatar || null,
      department: department || 'Engineering',
      role: role || 'Developer',
      leaveType: leaveType.toLowerCase(),
      leaveCategory: categoryMap[leaveType.toLowerCase()] || 'Casual Leave (CL)',
      isHalfDay: Boolean(isHalfDay),
      halfDaySession: isHalfDay ? (halfDaySession || 'first_half') : null,
      startDate: startDate,
      endDate: endDate || startDate,
      totalDays: calculatedDays,
      reason: reason.trim(),
      handoverPerson: handoverPerson ? handoverPerson.trim() : 'None Assigned',
      emergencyContact: emergencyContact ? emergencyContact.trim() : 'N/A',
      attachment: attachment || null,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      managerRemarks: null,
    };

    data.leaves.unshift(newLeave);
    saveLeavesToDisk(data);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO leaves (
            id, user_id, user_code, user_name, user_email, user_avatar, department, role,
            leave_type, leave_category, is_half_day, half_day_session, start_date, end_date,
            total_days, reason, handover_person, emergency_contact, attachment, status,
            applied_at, reviewed_by, reviewed_at, manager_remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (id) DO NOTHING`,
          [
            newLeave.id, newLeave.userId, newLeave.userCode, newLeave.userName, newLeave.userEmail, newLeave.userAvatar,
            newLeave.department, newLeave.role, newLeave.leaveType, newLeave.leaveCategory, newLeave.isHalfDay,
            newLeave.halfDaySession, newLeave.startDate, newLeave.endDate, newLeave.totalDays, newLeave.reason,
            newLeave.handoverPerson, newLeave.emergencyContact, newLeave.attachment, newLeave.status,
            newLeave.appliedAt, newLeave.reviewedBy, newLeave.reviewedAt, newLeave.managerRemarks
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert leave error:', pgErr.message);
      }
    }

    // Audit log
    appendActivityLog({
      user: userName || 'Employee',
      role: role || 'Team',
      action: 'Applied for Leave',
      detail: `Submitted ${calculatedDays} day(s) ${newLeave.leaveCategory} from ${startDate} to ${endDate || startDate}`,
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: newLeave,
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ error: 'Failed to submit leave application' });
  }
});

// PATCH /api/leaves/:id/status - Approve, Reject, or Cancel a leave application
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, managerRemarks } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED', 'PENDING'].includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Valid status is required (APPROVED, REJECTED, CANCELLED, PENDING)' });
    }

    const data = loadLeavesFromDisk();
    const leaveIndex = data.leaves.findIndex(l => l.id === id);

    const currentLeave = leaveIndex !== -1 ? data.leaves[leaveIndex] : { id, userName: 'Member' };
    const newStatus = status.toUpperCase();

    const updatedLeave = {
      ...currentLeave,
      status: newStatus,
      reviewedBy: reviewedBy || (newStatus === 'CANCELLED' ? 'Cancelled by Applicant' : 'Super Admin'),
      reviewedAt: new Date().toISOString(),
      managerRemarks: managerRemarks ? managerRemarks.trim() : currentLeave.managerRemarks,
    };

    if (leaveIndex !== -1) {
      data.leaves[leaveIndex] = updatedLeave;
    } else {
      data.leaves.unshift(updatedLeave);
    }

    saveLeavesToDisk(data);

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE leaves SET status = $2, reviewed_by = $3, reviewed_at = NOW(), manager_remarks = $4 WHERE id = $1`,
          [id, newStatus, updatedLeave.reviewedBy, updatedLeave.managerRemarks]
        );
      } catch (pgErr) {
        console.warn('PG update leave status error:', pgErr.message);
      }
    }

    // Audit Log
    appendActivityLog({
      user: reviewedBy || 'Manager',
      role: 'Operations / Admin',
      action: `${newStatus === 'APPROVED' ? 'Approved' : newStatus === 'REJECTED' ? 'Rejected' : 'Updated'} Leave`,
      detail: `Marked leave ${id} for ${currentLeave.userName} as ${newStatus}${managerRemarks ? ` — Remarks: "${managerRemarks}"` : ''}`,
    });

    res.json({
      success: true,
      message: `Leave application ${id} status updated to ${newStatus}`,
      leave: updatedLeave,
    });
  } catch (err) {
    console.error('Error updating leave status:', err);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// PUT /api/leaves/quotas - Update company annual leave quotas
router.put('/quotas', async (req, res) => {
  try {
    const { casual, sick, annual, emergency, maternity, paternity } = req.body;
    const data = loadLeavesFromDisk();

    data.quotas = {
      ...data.quotas,
      casual: Number(casual) || data.quotas.casual,
      sick: Number(sick) || data.quotas.sick,
      annual: Number(annual) || data.quotas.annual,
      emergency: Number(emergency) || data.quotas.emergency,
      maternity: Number(maternity) || data.quotas.maternity,
      paternity: Number(paternity) || data.quotas.paternity,
    };

    saveLeavesToDisk(data);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO leave_quotas (id, quotas, updated_at) VALUES ('default', $1, NOW())
           ON CONFLICT (id) DO UPDATE SET quotas = $1, updated_at = NOW()`,
          [JSON.stringify(data.quotas)]
        );
      } catch (pgErr) {
        console.warn('PG update leave_quotas error:', pgErr.message);
      }
    }

    appendActivityLog({
      user: 'Super Admin',
      role: 'Leadership',
      action: 'Updated Leave Policy Quotas',
      detail: `Casual: ${data.quotas.casual}d, Sick: ${data.quotas.sick}d, Annual: ${data.quotas.annual}d, Emergency: ${data.quotas.emergency}d`,
    });

    res.json({
      success: true,
      message: 'Company leave quotas updated successfully',
      quotas: data.quotas,
    });
  } catch (err) {
    console.error('Error updating quotas:', err);
    res.status(500).json({ error: 'Failed to update leave quotas' });
  }
});

// DELETE /api/leaves/:id - Delete a leave entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = loadLeavesFromDisk();
    const initialLen = data.leaves.length;

    data.leaves = data.leaves.filter(l => l.id !== id);
    saveLeavesToDisk(data);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM leaves WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete leave error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: `Leave application ${id} deleted successfully`,
    });
  } catch (err) {
    console.error('Error deleting leave:', err);
    res.status(500).json({ error: 'Failed to delete leave application' });
  }
});

export default router;
