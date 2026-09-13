import express from 'express';
import {
  loadLeavesFromDisk,
  saveLeavesToDisk,
  loadUsersFromDisk,
  appendActivityLog
} from '../db.js';

const router = express.Router();

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
router.get('/', (req, res) => {
  try {
    const data = loadLeavesFromDisk();
    const allUsers = loadUsersFromDisk() || [];
    const userEmail = req.headers['x-user-email'];

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute metrics
    const totalCount = data.leaves.length;
    const pendingCount = data.leaves.filter(l => l.status === 'PENDING').length;
    const approvedCount = data.leaves.filter(l => l.status === 'APPROVED').length;
    const rejectedCount = data.leaves.filter(l => l.status === 'REJECTED').length;

    // Who is currently on leave today
    const onLeaveToday = data.leaves.filter(l => {
      if (l.status !== 'APPROVED') return false;
      const s = l.startDate;
      const e = l.endDate || l.startDate;
      return todayStr >= s && todayStr <= e;
    });

    res.json({
      success: true,
      quotas: data.quotas,
      leaves: data.leaves,
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
router.post('/apply', (req, res) => {
  try {
    const data = loadLeavesFromDisk();
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

    const newId = `LV-${1000 + data.leaves.length + 1}`;

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
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, managerRemarks } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED', 'PENDING'].includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Valid status is required (APPROVED, REJECTED, CANCELLED, PENDING)' });
    }

    const data = loadLeavesFromDisk();
    const leaveIndex = data.leaves.findIndex(l => l.id === id);

    if (leaveIndex === -1) {
      return res.status(404).json({ error: `Leave application ${id} not found` });
    }

    const currentLeave = data.leaves[leaveIndex];
    const newStatus = status.toUpperCase();

    data.leaves[leaveIndex] = {
      ...currentLeave,
      status: newStatus,
      reviewedBy: reviewedBy || (newStatus === 'CANCELLED' ? 'Cancelled by Applicant' : 'Super Admin'),
      reviewedAt: new Date().toISOString(),
      managerRemarks: managerRemarks ? managerRemarks.trim() : currentLeave.managerRemarks,
    };

    saveLeavesToDisk(data);

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
      leave: data.leaves[leaveIndex],
    });
  } catch (err) {
    console.error('Error updating leave status:', err);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// PUT /api/leaves/quotas - Update company annual leave quotas
router.put('/quotas', (req, res) => {
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
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadLeavesFromDisk();
    const initialLen = data.leaves.length;

    data.leaves = data.leaves.filter(l => l.id !== id);

    if (data.leaves.length === initialLen) {
      return res.status(404).json({ error: `Leave application ${id} not found` });
    }

    saveLeavesToDisk(data);

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
