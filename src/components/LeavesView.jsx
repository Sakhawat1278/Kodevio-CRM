import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Download,
  Calendar as CalendarIcon,
  UserCheck,
  UserX,
  FileText,
  Paperclip,
  Phone,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  X,
  Check,
  Settings,
  Sparkles,
  Info
} from 'lucide-react';
import CustomDatePicker from './common/CustomDatePicker';
import CustomSelect from './common/CustomSelect';
import { leavesApi, usersApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';

export const LEAVE_CATEGORIES = [
  { id: 'casual', label: 'Casual Leave (CL)', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Routine personal time off & family events' },
  { id: 'sick', label: 'Sick / Medical Leave (SL)', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', desc: 'Medical illness, recovery & doctor appointments' },
  { id: 'annual', label: 'Annual / Earned Leave (AL)', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Planned vacations and recreational holidays' },
  { id: 'emergency', label: 'Emergency Leave (EL)', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', desc: 'Urgent unplanned family emergencies' },
  { id: 'unpaid', label: 'Leave Without Pay (LWP)', color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', desc: 'Extended absence beyond allocated quotas' }
];

export default function LeavesView({ user, onShowToast, isManagerOrAdmin = true }) {
  const [activeTab, setActiveTab] = useState('my_leaves'); // 'my_leaves' | 'pending_approvals' | 'calendar' | 'ledger' | 'quotas'
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [quotas, setQuotas] = useState({
    casual: 14,
    sick: 10,
    annual: 15,
    emergency: 5,
    maternity: 90,
    paternity: 10
  });
  const [usersList, setUsersList] = useState([]);

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [managerRemarks, setManagerRemarks] = useState('');
  const [viewingLeaveDetails, setViewingLeaveDetails] = useState(null);

  // Custom Dropdowns in Modal
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isHandoverDropdownOpen, setIsHandoverDropdownOpen] = useState(false);
  const categoryDropdownRef = React.useRef(null);
  const handoverDropdownRef = React.useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (handoverDropdownRef.current && !handoverDropdownRef.current.contains(e.target)) {
        setIsHandoverDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters & Search for Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterType, setFilterType] = useState('All Leave Types');
  const [filterDepartment, setFilterDepartment] = useState('All Departments');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    leaveType: 'casual',
    isHalfDay: false,
    halfDaySession: 'first_half',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    handoverPerson: '',
    emergencyContact: '',
    attachmentName: ''
  });

  // Current logged in user info
  const currentUserEmail = user?.email || 'sakhawat@kodevio.com';
  const currentUserName = user?.full_name || user?.name || 'Sakhawat Hossain Sohan';
  const currentUserRole = user?.role || 'super_admin';
  const isSuperAdminOrOps = currentUserRole.toLowerCase().includes('admin') ||
    currentUserRole.toLowerCase().includes('ops') ||
    currentUserRole.toLowerCase().includes('lead') ||
    currentUserRole.toLowerCase().includes('manager');

  // Load leaves and users data
  const loadData = async () => {
    setLoading(true);
    try {
      const [leavesRes, usersRes] = await Promise.all([
        leavesApi.fetchLeaves().catch(() => ({ leaves: [], quotas: {} })),
        usersApi.fetchUsers().catch(() => ({ users: [] }))
      ]);

      if (leavesRes?.leaves && Array.isArray(leavesRes.leaves)) {
        setLeaves(leavesRes.leaves);
      }
      if (leavesRes?.quotas) {
        setQuotas(leavesRes.quotas);
      }
      if (usersRes?.users && Array.isArray(usersRes.users)) {
        setUsersList(usersRes.users);
      }
    } catch (err) {
      console.warn('LeavesView load note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Balances for Current User
  const myLeaves = useMemo(() => {
    return leaves.filter(l => 
      l.userEmail?.toLowerCase() === currentUserEmail.toLowerCase() ||
      l.userName?.toLowerCase() === currentUserName.toLowerCase()
    );
  }, [leaves, currentUserEmail, currentUserName]);

  const leaveBalances = useMemo(() => {
    const usage = {
      casual: 0,
      sick: 0,
      annual: 0,
      emergency: 0,
      unpaid: 0,
      pendingTotal: 0
    };

    myLeaves.forEach(l => {
      const type = (l.leaveType || 'casual').toLowerCase();
      const days = Number(l.totalDays) || 1;

      if (l.status === 'APPROVED') {
        if (usage[type] !== undefined) usage[type] += days;
      } else if (l.status === 'PENDING') {
        usage.pendingTotal += days;
      }
    });

    return {
      casual: { total: quotas.casual || 14, used: usage.casual, remaining: Math.max(0, (quotas.casual || 14) - usage.casual) },
      sick: { total: quotas.sick || 10, used: usage.sick, remaining: Math.max(0, (quotas.sick || 10) - usage.sick) },
      annual: { total: quotas.annual || 15, used: usage.annual, remaining: Math.max(0, (quotas.annual || 15) - usage.annual) },
      emergency: { total: quotas.emergency || 5, used: usage.emergency, remaining: Math.max(0, (quotas.emergency || 5) - usage.emergency) },
      unpaid: { used: usage.unpaid },
      pendingTotal: usage.pendingTotal
    };
  }, [myLeaves, quotas]);

  // Pending Approvals Queue
  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => l.status === 'PENDING');
  }, [leaves]);

  // Today on leave
  const onLeaveToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leaves.filter(l => {
      if (l.status !== 'APPROVED') return false;
      const s = l.startDate;
      const e = l.endDate || l.startDate;
      return today >= s && today <= e;
    });
  }, [leaves]);

  // Filtered Ledger List
  const filteredLedger = useMemo(() => {
    return leaves.filter(l => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.userName?.toLowerCase().includes(q);
        const matchReason = l.reason?.toLowerCase().includes(q);
        const matchCode = l.userCode?.toLowerCase().includes(q) || l.id?.toLowerCase().includes(q);
        const matchDept = l.department?.toLowerCase().includes(q);
        if (!matchName && !matchReason && !matchCode && !matchDept) return false;
      }

      // 2. Status Filter
      if (filterStatus !== 'All Statuses') {
        if (l.status !== filterStatus) return false;
      }

      // 3. Leave Type Filter
      if (filterType !== 'All Leave Types') {
        if (l.leaveType?.toLowerCase() !== filterType.toLowerCase()) return false;
      }

      // 4. Department Filter
      if (filterDepartment !== 'All Departments') {
        if (l.department?.toLowerCase() !== filterDepartment.toLowerCase()) return false;
      }

      return true;
    });
  }, [leaves, searchQuery, filterStatus, filterType, filterDepartment]);

  // Helper to calculate business days
  const calculateDays = (sStr, eStr, isHalf) => {
    if (isHalf) return 0.5;
    if (!sStr || !eStr) return 1;
    const s = new Date(sStr);
    const e = new Date(eStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 1;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 5 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  };

  // Submit Leave Application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      alert('Please enter a brief explanation for your leave request.');
      return;
    }

    const calculatedTotalDays = calculateDays(applyForm.startDate, applyForm.endDate, applyForm.isHalfDay);

    const payload = {
      userId: user?.id || `usr-${Date.now()}`,
      userCode: user?.user_code || user?.userCode || 'K001',
      userName: currentUserName,
      userEmail: currentUserEmail,
      userAvatar: user?.avatar_url || null,
      department: user?.department || 'Engineering',
      role: user?.designation || user?.role || 'Developer',
      leaveType: applyForm.leaveType,
      isHalfDay: applyForm.isHalfDay,
      halfDaySession: applyForm.isHalfDay ? applyForm.halfDaySession : null,
      startDate: applyForm.startDate,
      endDate: applyForm.isHalfDay ? applyForm.startDate : applyForm.endDate,
      reason: applyForm.reason,
      handoverPerson: applyForm.handoverPerson || 'None Assigned',
      emergencyContact: applyForm.emergencyContact || 'N/A',
      attachment: applyForm.attachmentName || null
    };

    try {
      const res = await leavesApi.applyLeave(payload);
      if (res?.leave) {
        setLeaves(prev => [res.leave, ...prev]);
      } else {
        const fallback = {
          id: `LV-${Date.now().toString().slice(-4)}`,
          ...payload,
          totalDays: calculatedTotalDays,
          status: 'PENDING',
          appliedAt: new Date().toISOString()
        };
        setLeaves(prev => [fallback, ...prev]);
      }
      setIsApplyModalOpen(false);
      setApplyForm({
        leaveType: 'casual',
        isHalfDay: false,
        halfDaySession: 'first_half',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        handoverPerson: '',
        emergencyContact: '',
        attachmentName: ''
      });
      if (onShowToast) onShowToast('Leave application submitted for approval! 🌴');
      LiveSyncEngine.broadcast('leaves', payload);
    } catch (err) {
      console.error('Apply error:', err);
      alert('Failed to submit application: ' + err.message);
    }
  };

  // Status Action (Approve / Reject / Cancel)
  const handleUpdateStatus = async (leaveId, targetStatus) => {
    try {
      const res = await leavesApi.updateLeaveStatus(leaveId, {
        status: targetStatus,
        reviewedBy: `${currentUserName} (${currentUserRole})`,
        managerRemarks: managerRemarks
      });

      setLeaves(prev => prev.map(l => l.id === leaveId ? {
        ...l,
        status: targetStatus,
        reviewedBy: `${currentUserName} (${currentUserRole})`,
        reviewedAt: new Date().toISOString(),
        managerRemarks: managerRemarks || l.managerRemarks
      } : l));

      setReviewingLeave(null);
      setManagerRemarks('');
      if (onShowToast) onShowToast(`Leave #${leaveId} marked as ${targetStatus}!`);
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update leave: ' + err.message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      alert('No leave records to export.');
      return;
    }

    const headers = ['ID', 'User Code', 'Employee Name', 'Department', 'Role', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Handover Person', 'Applied Date'];
    const rows = filteredLedger.map(l => [
      l.id,
      l.userCode || '---',
      `"${l.userName || 'Unknown'}"`,
      `"${l.department || '---'}"`,
      `"${l.role || '---'}"`,
      l.leaveCategory || l.leaveType,
      l.startDate,
      l.endDate,
      l.totalDays,
      l.status,
      `"${l.handoverPerson || 'None'}"`,
      new Date(l.appliedAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kodevio_Leave_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Day Calculation
  const currentMonthYear = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  return (
    <div className="leaves-view-container">
      {/* ── 1. TOP HEADER & METRICS BAR ── */}
      <div className="leaves-top-header">
        <div className="leaves-top-header-content">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="leaves-header-icon-box shrink-0">
              <CalendarDays size={20} className="text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="leaves-header-title">Leave Applications &amp; Staff Schedule</h2>
                <span className="leaves-version-badge shrink-0">HR Module</span>
              </div>
              <p className="leaves-header-sub">
                Manage leave quotas, submit time-off requests, and review department availability
              </p>
            </div>
          </div>

          <div className="leaves-top-header-actions">
            <button
              type="button"
              onClick={loadData}
              className="leaves-btn-secondary"
              title="Refresh leave database"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="leaves-btn-primary"
            >
              <Plus size={14} />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* ── 2. QUICK METRIC KPI CARDS ── */}
        <div className="leaves-kpi-grid">
          {/* Casual Leave Quota */}
          <div className="leaves-kpi-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="leaves-kpi-label text-blue-600">Casual Leave (CL)</span>
              <span className="leaves-kpi-pill bg-blue-50 text-blue-700 border-blue-200">
                {leaveBalances.casual.remaining}d Left
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="leaves-kpi-value">{leaveBalances.casual.used}</span>
              <span className="leaves-kpi-total">/ {leaveBalances.casual.total} Days Allocated</span>
            </div>
            <div className="leaves-kpi-progress">
              <div
                className="leaves-kpi-fill bg-blue-500"
                style={{ width: `${(leaveBalances.casual.used / (leaveBalances.casual.total || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Sick Leave Quota */}
          <div className="leaves-kpi-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="leaves-kpi-label text-red-600">Sick / Medical (SL)</span>
              <span className="leaves-kpi-pill bg-red-50 text-red-700 border-red-200">
                {leaveBalances.sick.remaining}d Left
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="leaves-kpi-value">{leaveBalances.sick.used}</span>
              <span className="leaves-kpi-total">/ {leaveBalances.sick.total} Days Allocated</span>
            </div>
            <div className="leaves-kpi-progress">
              <div
                className="leaves-kpi-fill bg-red-500"
                style={{ width: `${(leaveBalances.sick.used / (leaveBalances.sick.total || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Annual / Vacation */}
          <div className="leaves-kpi-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="leaves-kpi-label text-emerald-600">Annual Leave (AL)</span>
              <span className="leaves-kpi-pill bg-emerald-50 text-emerald-700 border-emerald-200">
                {leaveBalances.annual.remaining}d Left
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="leaves-kpi-value">{leaveBalances.annual.used}</span>
              <span className="leaves-kpi-total">/ {leaveBalances.annual.total} Days Allocated</span>
            </div>
            <div className="leaves-kpi-progress">
              <div
                className="leaves-kpi-fill bg-emerald-500"
                style={{ width: `${(leaveBalances.annual.used / (leaveBalances.annual.total || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Away Today / Attendance */}
          <div className="leaves-kpi-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="leaves-kpi-label text-amber-600">Away Today</span>
              <span className="leaves-kpi-pill bg-amber-50 text-amber-700 border-amber-200 font-bold">
                {onLeaveToday.length} On Leave
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="leaves-kpi-value">{onLeaveToday.length}</span>
              <span className="leaves-kpi-total font-bold text-slate-700">
                {onLeaveToday.length === 0 ? 'All Present' : 'Members Away'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
              <span className="text-[11px] font-bold text-slate-500">
                Queue:
              </span>
              <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 whitespace-nowrap">
                {pendingLeaves.length} in Queue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE TAB NAVIGATION ── */}
      <div className="leaves-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('my_leaves')}
          className={`leaves-tab-btn ${activeTab === 'my_leaves' ? 'active' : ''}`}
        >
          <FileText size={14} />
          <span>My Leaves &amp; History</span>
          <span className="leaves-tab-count">{myLeaves.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending_approvals')}
          className={`leaves-tab-btn ${activeTab === 'pending_approvals' ? 'active' : ''}`}
        >
          <Clock size={14} />
          <span>Pending Approvals</span>
          {pendingLeaves.length > 0 && (
            <span className="leaves-tab-count alert">{pendingLeaves.length}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`leaves-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <CalendarIcon size={14} />
          <span>Team Availability Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`leaves-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
        >
          <Building2 size={14} />
          <span>All Staff Leave Ledger</span>
          <span className="leaves-tab-count">{leaves.length}</span>
        </button>
      </div>

      {/* ── 4. TAB VIEWPORTS ── */}
      <div className="leaves-main-body">
        {/* ── TAB 1: MY LEAVES & BALANCE ── */}
        {activeTab === 'my_leaves' && (
          <div className="leaves-tab-pane">
            <div className="leaves-table-wrapper">
              <table className="leaves-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>APP ID</th>
                    <th style={{ minWidth: '160px' }}>LEAVE CATEGORY</th>
                    <th style={{ width: '130px' }}>START DATE</th>
                    <th style={{ width: '130px' }}>END DATE</th>
                    <th style={{ width: '80px' }}>DAYS</th>
                    <th style={{ minWidth: '200px' }}>REASON</th>
                    <th style={{ width: '140px' }}>HANDOVER</th>
                    <th style={{ width: '110px' }}>STATUS</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="leaves-empty-cell">
                        <div className="leaves-empty-inner">
                          <CalendarDays size={32} className="text-slate-300 mb-2" />
                          <h4>No leave requests found</h4>
                          <p>You have not submitted any leave applications yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myLeaves.map((l) => (
                      <tr key={l.id} className="leaves-table-row">
                        <td>
                          <span className="font-mono text-xs font-bold text-slate-800">{l.id}</span>
                        </td>
                        <td>
                          <span className="leaves-cat-badge">{l.leaveCategory || l.leaveType}</span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-700">{l.startDate}</span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-700">{l.endDate || l.startDate}</span>
                        </td>
                        <td>
                          <span className="leaves-days-pill">{l.totalDays}d</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 line-clamp-1" title={l.reason}>
                            {l.reason}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 truncate block max-w-[130px]" title={l.handoverPerson}>
                            {l.handoverPerson || 'None'}
                          </span>
                        </td>
                        <td>
                          <span className={`leaves-status-pill status-${l.status?.toLowerCase()}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingLeaveDetails(l)}
                              className="leaves-action-btn"
                              title="View full details"
                            >
                              <Info size={13} />
                            </button>
                            {l.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(l.id, 'CANCELLED')}
                                className="leaves-action-btn cancel-btn"
                                title="Cancel Application"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: PENDING APPROVALS QUEUE (FOR MANAGERS & ADMINS) ── */}
        {activeTab === 'pending_approvals' && (
          <div className="leaves-tab-pane">
            {pendingLeaves.length === 0 ? (
              <div className="leaves-empty-state-card">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <h4 className="font-bold text-slate-800">All caught up!</h4>
                <p className="text-xs text-slate-500">There are no pending leave applications awaiting approval.</p>
              </div>
            ) : (
              <div className="leaves-cards-grid">
                {pendingLeaves.map((l) => {
                  const rawType = (l.leaveCategory || l.leaveType || 'casual').toLowerCase();
                  const catObj = LEAVE_CATEGORIES.find(c => c.id === rawType) || {
                    label: l.leaveCategory || l.leaveType || 'Leave',
                    color: '#059669',
                    bg: '#ECFDF5',
                    border: '#A7F3D0'
                  };

                  return (
                    <div key={l.id} className="leaves-approval-card-clean">
                      {/* 1. Header: Avatar + User Info + Category Pill */}
                      <div className="leaves-card-header-row">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="leaves-card-avatar">
                            {l.userName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="leaves-card-user-name truncate">{l.userName}</h4>
                              <span className="leaves-card-code-badge">{l.userCode || 'K001'}</span>
                            </div>
                            <span className="leaves-card-user-role truncate">
                              {l.department} &bull; {l.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className="leaves-card-cat-pill-bold shrink-0"
                          style={{ backgroundColor: catObj.bg, color: catObj.color, borderColor: catObj.border }}
                        >
                          {catObj.label?.replace(/\(.*\)/, '').trim()}
                        </span>
                      </div>

                      {/* 2. Middle Block: Date & Duration Ribbon + Reason + Handover */}
                      <div className="leaves-card-content-block">
                        <div className="leaves-card-date-badge">
                          <CalendarDays size={13} className="text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800">
                            {l.startDate} {l.endDate && l.endDate !== l.startDate ? `→ ${l.endDate}` : ''}
                          </span>
                          <span className="leaves-card-duration-chip">
                            {l.totalDays} Day{l.totalDays > 1 ? 's' : ''} {l.isHalfDay ? `(${l.halfDaySession === 'first_half' ? '1st Half' : '2nd Half'})` : ''}
                          </span>
                        </div>

                        <p className="leaves-card-reason-body" title={l.reason}>
                          {l.reason}
                        </p>

                        {l.handoverPerson && l.handoverPerson !== 'None' && l.handoverPerson !== 'None Assigned' && (
                          <div className="leaves-card-handover-line">
                            <span>Handover Backup:</span>
                            <strong>{l.handoverPerson}</strong>
                          </div>
                        )}
                      </div>

                      {/* 3. Footer: App ID & Action Buttons */}
                      <div className="leaves-card-footer-row">
                        <span className="leaves-card-app-id">
                          #{l.id}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingLeave(l);
                              setManagerRemarks('');
                            }}
                            className="leaves-card-reject-btn"
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewingLeave(l);
                              setManagerRemarks('Approved. Work handover confirmed.');
                            }}
                            className="leaves-card-approve-btn"
                          >
                            <Check size={13} />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TEAM AVAILABILITY CALENDAR ── */}
        {activeTab === 'calendar' && (
          <div className="leaves-tab-pane is-padded">
            <div className="leaves-pane-header">
              <div>
                <h3 className="leaves-pane-title">Team Availability Calendar</h3>
                <p className="leaves-pane-sub">Visual schedule of staff time-off to prevent production bottlenecks</p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))}
                  className="leaves-cal-nav-btn"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-800 min-w-[120px] text-center">
                  {currentMonthYear}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))}
                  className="leaves-cal-nav-btn"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="leaves-calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i} className="leaves-cal-weekday-header">
                  {d}
                </div>
              ))}

              {/* Empty leading padding days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="leaves-cal-day-box is-empty" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                // Find leaves on this date
                const dayLeaves = leaves.filter(l => {
                  if (l.status !== 'APPROVED') return false;
                  return dateStr >= l.startDate && dateStr <= (l.endDate || l.startDate);
                });

                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div key={dayNum} className={`leaves-cal-day-box ${isToday ? 'is-today' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`leaves-cal-day-num ${isToday ? 'today-pill' : ''}`}>
                        {dayNum}
                      </span>
                      {dayLeaves.length > 0 && (
                        <span className="leaves-cal-badge-count">{dayLeaves.length} away</span>
                      )}
                    </div>

                    <div className="leaves-cal-events-list">
                      {dayLeaves.slice(0, 2).map((l, idx) => (
                        <div
                          key={idx}
                          onClick={() => setViewingLeaveDetails(l)}
                          className="leaves-cal-event-pill"
                          title={`${l.userName} (${l.leaveCategory}) — ${l.reason}`}
                        >
                          <span className="truncate">{l.userName}</span>
                        </div>
                      ))}
                      {dayLeaves.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayLeaves.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: ALL STAFF LEAVE LEDGER ── */}
        {activeTab === 'ledger' && (
          <div className="leaves-tab-pane">
            {/* Toolbar */}
            <div className="leaves-ledger-toolbar">
              <div className="leaves-search-box">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search staff, leave ID, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="leaves-search-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="leaves-search-clear">
                    <X size={11} />
                  </button>
                )}
              </div>

              <div className="leaves-toolbar-filters-grid">
                <div className="leaves-filter-item">
                  <CustomSelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={['All Statuses', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']}
                    placeholder="All Statuses"
                  />
                </div>

                <div className="leaves-filter-item">
                  <CustomSelect
                    value={filterType}
                    onChange={setFilterType}
                    options={['All Leave Types', 'casual', 'sick', 'annual', 'emergency', 'unpaid']}
                    placeholder="All Leave Types"
                  />
                </div>

                <div className="leaves-filter-item">
                  <CustomSelect
                    value={filterDepartment}
                    onChange={setFilterDepartment}
                    options={['All Departments', 'Engineering', 'Sales & BD', 'Operations', 'Design']}
                    placeholder="All Departments"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="leaves-btn-secondary"
                  title="Export filtered records to CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Master Table */}
            <div className="leaves-table-wrapper">
              <table className="leaves-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>APP ID</th>
                    <th style={{ width: '180px' }}>STAFF MEMBER</th>
                    <th style={{ width: '130px' }}>DEPARTMENT</th>
                    <th style={{ minWidth: '150px' }}>CATEGORY</th>
                    <th style={{ width: '120px' }}>TIMELINE</th>
                    <th style={{ width: '70px' }}>DAYS</th>
                    <th style={{ minWidth: '180px' }}>REASON &amp; NOTES</th>
                    <th style={{ width: '110px' }}>STATUS</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="leaves-empty-cell">
                        <div className="leaves-empty-inner">
                          <CalendarDays size={32} className="text-slate-300 mb-2" />
                          <h4>No leave records found</h4>
                          <p>Try resetting filters or searching with different keywords.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((l) => (
                      <tr key={l.id} className="leaves-table-row">
                        <td>
                          <span className="font-mono text-xs font-bold text-slate-800">{l.id}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">
                              {l.userName?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate" title={l.userName}>
                              {l.userName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-600">{l.department}</span>
                        </td>
                        <td>
                          <span className="leaves-cat-badge">{l.leaveCategory || l.leaveType}</span>
                        </td>
                        <td>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {l.startDate} &rarr; {l.endDate}
                          </span>
                        </td>
                        <td>
                          <span className="leaves-days-pill">{l.totalDays}d</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 line-clamp-1" title={l.reason}>
                            {l.reason}
                          </span>
                        </td>
                        <td>
                          <span className={`leaves-status-pill status-${l.status?.toLowerCase()}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setViewingLeaveDetails(l)}
                            className="leaves-action-btn"
                            title="Inspect details"
                          >
                            <Info size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. APPLY FOR LEAVE MODAL ── */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="leaves-modal-overlay" onClick={() => setIsApplyModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="leaves-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="leaves-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="leaves-header-icon-box">
                    <CalendarDays size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="leaves-modal-title">Apply for Leave</h3>
                    <p className="leaves-modal-sub">Submit a time-off request for manager approval</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="leaves-modal-close"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="leaves-modal-body">
                {/* Leave Type Select */}
                <div className="leaves-form-group">
                  <label className="leaves-label">Leave Category &amp; Type *</label>
                  <CustomSelect
                    value={applyForm.leaveType}
                    onChange={(val) => setApplyForm(prev => ({ ...prev, leaveType: val }))}
                    options={LEAVE_CATEGORIES.map((cat) => ({
                      value: cat.id,
                      label: cat.label,
                      color: cat.color,
                      badge: cat.id !== 'unpaid' && leaveBalances[cat.id] ? `${leaveBalances[cat.id].remaining}d left` : null,
                      desc: cat.desc,
                    }))}
                    placeholder="Select Leave Category..."
                    searchable={false}
                  />
                </div>

                {/* Duration Mode & Half-day Toggle */}
                <div className={`leaves-halfday-box ${applyForm.isHalfDay ? 'is-active' : ''}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={applyForm.isHalfDay}
                      onChange={(e) => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
                      className="accent-orange-600 w-3.5 h-3.5 rounded cursor-pointer"
                    />
                    <span className="leaves-halfday-title">Half-Day Leave (0.5d)</span>
                  </label>

                  {applyForm.isHalfDay && (
                    <div className="leaves-session-segmented-control">
                      <button
                        type="button"
                        onClick={() => setApplyForm({ ...applyForm, halfDaySession: 'first_half' })}
                        className={`leaves-session-pill ${applyForm.halfDaySession === 'first_half' ? 'active' : ''}`}
                      >
                        <span>🌅 1st Half (Morning)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyForm({ ...applyForm, halfDaySession: 'second_half' })}
                        className={`leaves-session-pill ${applyForm.halfDaySession === 'second_half' ? 'active' : ''}`}
                      >
                        <span>🌇 2nd Half (Afternoon)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates using CustomDatePicker */}
                <div className="leaves-form-row-2col">
                  <div className="leaves-form-group">
                    <label className="leaves-label">{applyForm.isHalfDay ? 'Date *' : 'Start Date *'}</label>
                    <CustomDatePicker
                      value={applyForm.startDate}
                      onChange={(dateVal) => setApplyForm(prev => ({
                        ...prev,
                        startDate: dateVal,
                        endDate: prev.endDate < dateVal ? dateVal : prev.endDate
                      }))}
                      placeholder="Select start date"
                    />
                  </div>

                  {!applyForm.isHalfDay && (
                    <div className="leaves-form-group">
                      <label className="leaves-label">End Date *</label>
                      <CustomDatePicker
                        value={applyForm.endDate}
                        onChange={(dateVal) => setApplyForm(prev => ({ ...prev, endDate: dateVal }))}
                        placeholder="Select end date"
                      />
                    </div>
                  )}
                </div>

                {/* Handover & Emergency Contact */}
                <div className="leaves-form-row-2col">
                  <div className="leaves-form-group">
                    <label className="leaves-label">Handover Colleague / Backup</label>
                    <CustomSelect
                      value={applyForm.handoverPerson}
                      onChange={(val) => setApplyForm(prev => ({ ...prev, handoverPerson: val }))}
                      options={[
                        { value: 'None Assigned', label: 'None Assigned' },
                        ...usersList.map((u) => {
                          const uName = u.full_name || u.name || u.username;
                          return {
                            value: uName,
                            label: uName,
                            desc: `${u.department || 'Team'} • ${u.designation || u.role || 'Member'}`,
                          };
                        }),
                      ]}
                      placeholder="Select Handover Person..."
                      searchable={true}
                    />
                  </div>

                  <div className="leaves-form-group">
                    <label className="leaves-label">Emergency Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+880 17..."
                      value={applyForm.emergencyContact}
                      onChange={(e) => setApplyForm({ ...applyForm, emergencyContact: e.target.value })}
                      className="leaves-input"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="leaves-form-group">
                  <label className="leaves-label">Reason &amp; Purpose *</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific reason for absence (e.g. medical doctor visit, personal travel, family emergency)..."
                    value={applyForm.reason}
                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                    className="leaves-textarea"
                    required
                  />
                </div>

                {/* Footer */}
                <div className="leaves-modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="leaves-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="leaves-btn-primary"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. MANAGER REVIEW & APPROVAL MODAL ── */}
      <AnimatePresence>
        {reviewingLeave && (
          <div className="leaves-modal-overlay" onClick={() => setReviewingLeave(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="leaves-modal-card max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="leaves-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="leaves-header-icon-box bg-orange-50 text-orange-600 border border-orange-200">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="leaves-modal-title">Review Leave Application</h3>
                    <p className="leaves-modal-sub">
                      Application #{reviewingLeave.id} &bull; {reviewingLeave.userName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="leaves-modal-close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="leaves-modal-body">
                {/* Applicant Profile & Category Card */}
                {(() => {
                  const revCat = LEAVE_CATEGORIES.find(
                    (c) => c.id === (reviewingLeave.leaveCategory || reviewingLeave.leaveType)?.toLowerCase()
                  ) || {
                    label: reviewingLeave.leaveCategory || reviewingLeave.leaveType || 'Leave',
                    color: '#2563EB',
                    bg: '#EFF6FF',
                    border: '#BFDBFE',
                  };

                  return (
                    <div className="leaves-review-summary-box">
                      {/* Profile Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm border border-slate-700">
                            {reviewingLeave.userName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 text-sm truncate">
                                {reviewingLeave.userName}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200/80 text-slate-700 rounded border border-slate-300/60">
                                {reviewingLeave.userCode || 'K001'}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 block truncate mt-0.5">
                              {reviewingLeave.department} &bull; {reviewingLeave.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className="leaves-card-cat-pill shrink-0"
                          style={{ backgroundColor: revCat.bg, color: revCat.color, borderColor: revCat.border }}
                        >
                          {revCat.label}
                        </span>
                      </div>

                      {/* 4 Crisp Metric Tiles */}
                      <div className="leaves-review-tiles-grid">
                        {/* Tile 1: Timeline */}
                        <div className="leaves-review-tile">
                          <span className="leaves-review-tile-label">
                            <CalendarDays size={12} className="text-slate-400" />
                            <span>Timeline</span>
                          </span>
                          <span className="leaves-review-tile-val text-slate-900">
                            {reviewingLeave.startDate} &rarr; {reviewingLeave.endDate || reviewingLeave.startDate}
                          </span>
                        </div>

                        {/* Tile 2: Duration */}
                        <div className="leaves-review-tile">
                          <span className="leaves-review-tile-label">
                            <Clock size={12} className="text-orange-500" />
                            <span>Duration</span>
                          </span>
                          <span className="leaves-review-tile-val text-orange-600 font-black">
                            {reviewingLeave.totalDays} Day{reviewingLeave.totalDays > 1 ? 's' : ''} {reviewingLeave.isHalfDay ? `(${reviewingLeave.halfDaySession === 'first_half' ? '1st Half' : '2nd Half'})` : ''}
                          </span>
                        </div>

                        {/* Tile 3: Handover Person */}
                        <div className="leaves-review-tile">
                          <span className="leaves-review-tile-label">
                            <UserCheck size={12} className="text-slate-400" />
                            <span>Handover Backup</span>
                          </span>
                          <span className="leaves-review-tile-val text-slate-800" title={reviewingLeave.handoverPerson}>
                            {reviewingLeave.handoverPerson || 'None Assigned'}
                          </span>
                        </div>

                        {/* Tile 4: Emergency Contact */}
                        <div className="leaves-review-tile">
                          <span className="leaves-review-tile-label">
                            <Phone size={12} className="text-slate-400" />
                            <span>Emergency Contact</span>
                          </span>
                          <span className="leaves-review-tile-val text-slate-800">
                            {reviewingLeave.emergencyContact || 'Not Provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Reason */}
                <div className="leaves-form-group">
                  <label className="leaves-label">Applicant's Reason &amp; Purpose</label>
                  <p className="leaves-review-reason-box">
                    "{reviewingLeave.reason}"
                  </p>
                </div>

                {/* Manager Feedback Input */}
                <div className="leaves-form-group">
                  <label className="leaves-label">Manager Feedback / Approval Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter approval notes, handover confirmations or reasons for rejection..."
                    value={managerRemarks}
                    onChange={(e) => setManagerRemarks(e.target.value)}
                    className="leaves-textarea"
                  />
                </div>

                {/* Actions */}
                <div className="leaves-modal-footer">
                  <button
                    type="button"
                    onClick={() => setReviewingLeave(null)}
                    className="leaves-btn-secondary"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(reviewingLeave.id, 'REJECTED')}
                      className="leaves-card-reject-btn"
                    >
                      <UserX size={13} />
                      <span>Reject Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(reviewingLeave.id, 'APPROVED')}
                      className="leaves-card-approve-btn"
                    >
                      <Check size={13} />
                      <span>Approve Application</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 7. INSPECT LEAVE DETAILS MODAL ── */}
      <AnimatePresence>
        {viewingLeaveDetails && (
          <div className="leaves-modal-overlay" onClick={() => setViewingLeaveDetails(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="leaves-modal-card max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="leaves-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="leaves-header-icon-box bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="leaves-modal-title">Leave Application Record</h3>
                    <p className="leaves-modal-sub">ID: #{viewingLeaveDetails.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingLeaveDetails(null)}
                  className="leaves-modal-close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="leaves-modal-body">
                <div className="leaves-review-summary-box">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {viewingLeaveDetails.userName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">
                          {viewingLeaveDetails.userName}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400 block truncate mt-0.5">
                          {viewingLeaveDetails.department} &bull; {viewingLeaveDetails.role}
                        </span>
                      </div>
                    </div>

                    <span className={`leaves-status-pill status-${viewingLeaveDetails.status?.toLowerCase()}`}>
                      {viewingLeaveDetails.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Category
                      </span>
                      <span className="font-bold text-slate-900">
                        {viewingLeaveDetails.leaveCategory || viewingLeaveDetails.leaveType}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Duration
                      </span>
                      <span className="font-extrabold text-orange-600">
                        {viewingLeaveDetails.totalDays} Day(s) ({viewingLeaveDetails.startDate} &rarr; {viewingLeaveDetails.endDate})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="leaves-form-group">
                  <label className="leaves-label">Applicant's Reason</label>
                  <p className="leaves-review-reason-box">
                    "{viewingLeaveDetails.reason}"
                  </p>
                </div>

                {viewingLeaveDetails.managerRemarks && (
                  <div className="leaves-form-group">
                    <label className="leaves-label">Manager Review Remarks</label>
                    <p className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-slate-800 font-medium leading-relaxed">
                      "{viewingLeaveDetails.managerRemarks}" &mdash; <strong className="text-blue-700">{viewingLeaveDetails.reviewedBy}</strong>
                    </p>
                  </div>
                )}

                <div className="leaves-modal-footer">
                  <button
                    type="button"
                    onClick={() => setViewingLeaveDetails(null)}
                    className="leaves-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
