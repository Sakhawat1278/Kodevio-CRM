import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Trash2, Edit2, User, Users, Shield, ShieldCheck,
  ChevronDown, ChevronRight, MoreHorizontal, Filter, ArrowUpDown, ArrowLeft,
  Briefcase, TrendingUp, DollarSign, Settings, UserCheck, UserPlus,
  Mail, Phone, Globe, Building2, Star, Award, Grid, List, Eye,
  Check, AlertTriangle, RefreshCw, Download, Upload, LayoutGrid,
  Layers, Network, ZoomIn, ZoomOut, RotateCcw, ChevronsUpDown,
  Camera, Lock, Key, EyeOff, Calendar, Clock, Linkedin, Github, FileText,
  CheckSquare, Square
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import { usersApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS & HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_HIERARCHY = {
  administrator: { label: 'Administrator', rank: 1, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: ShieldCheck },
  project_manager: { label: 'Project Manager', rank: 2, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: Briefcase },
  sales_manager: { label: 'Sales Manager', rank: 3, color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', icon: TrendingUp },
  sales_executive: { label: 'Sales Executive', rank: 4, color: '#0891B2', bg: '#ECFEFF', border: '#CFFAFE', icon: TrendingUp },
  finance_manager: { label: 'Finance Manager', rank: 3, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: DollarSign },
  ops_manager: { label: 'Operations Manager', rank: 3, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Settings },
  ops_executive: { label: 'Operations Executive', rank: 4, color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7', icon: Settings },
  hr_manager: { label: 'Human Resources', rank: 3, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', icon: UserCheck },
  biz_dev: { label: 'Business Development', rank: 3, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: Network },
};

export const DEPARTMENT_OPTIONS = [
  'MANAGEMENT',
  'LEADERSHIP',
  'SALES',
  'OPERATIONS',
  'BDT',
];

export const DEPARTMENT_DESIGNATIONS_MAP = {
  MANAGEMENT: [
    'Project Manager',
    'Operations Manager',
    'Marketing Manager',
    'Sales Manager',
    'HR Manager',
  ],
  LEADERSHIP: [
    'CEO',
    'CFO',
    'CTO',
    'COO',
    'CMO',
    'CPO',
  ],
  SALES: [
    'Trainee Sales Executive',
    'Jr. Sales Executive',
    'Sales Executive',
    'Sr. Sales Executive',
    'Lead Sales Executive',
  ],
  OPERATIONS: [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'CMS Developer',
    'App Developer (Flutter)',
    'UI/UX Designer',
    'Graphics Designer',
  ],
  BDT: [
    'Senior Executive',
    'Business Development Team',
  ],
};

export const getDesignationsForDepartment = (dept) => {
  if (dept && DEPARTMENT_DESIGNATIONS_MAP[dept]) {
    return DEPARTMENT_DESIGNATIONS_MAP[dept];
  }
  return [
    'Project Manager',
    'Operations Manager',
    'Marketing Manager',
    'Sales Manager',
    'HR Manager',
    'Managing Director',
    'Senior Frontend Developer',
    'Senior Backend Developer',
    'Lead UI/UX Designer',
    'Head of Business Development',
  ];
};

export const DESIGNATION_OPTIONS = DEPARTMENT_DESIGNATIONS_MAP.MANAGEMENT;

export const ROLE_OPTIONS = Object.entries(ROLE_HIERARCHY).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const CATEGORY_OPTIONS = [
  'Category A — Web Development',
  'Category B — App Development',
  'Category C — UI/UX Design',
  'Category D — SEO & Marketing',
  'Category E — AI & Automation',
];

export const EMPLOYMENT_STATUS_OPTIONS = [
  'ACTIVE',
  'PROBATION',
  'TERMINATED',
  'RESIGNED',
  'ON LEAVE',
];

export const WEEKDAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    "id": "usr-001",
    "name": "Super Admin",
    "userCode": "K001",
    "email": "admin@kodevio.com",
    "phone": "+880 1711-000001",
    "password": "••••••••",
    "role": "administrator",
    "department": "MANAGEMENT",
    "designation": "Managing Director",
    "category": null,
    "status": "ACTIVE",
    "allowLogin": true,
    "joinDate": "2022-01-15",
    "confirmationDate": "2022-04-15",
    "monthlySalary": "9,500.00",
    "reportsTo": null,
    "weekendDays": [
      "Friday",
      "Saturday"
    ],
    "shiftStartTime": "09:00 AM",
    "shiftEndTime": "06:00 PM",
    "casualLeave": 10,
    "sickLeave": 14,
    "earnedLeave": 17,
    "lwop": 365,
    "linkedinUrl": "",
    "githubUrl": "",
    "portfolioUrl": "",
    "bio": "Founding administrator.",
    "avatar": null
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getRoleMeta(role) {
  return ROLE_HIERARCHY[role] || { label: role, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: User };
}

function getAvatarColor(name) {
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function StatusBadge({ status }) {
  const cfg = {
    ACTIVE: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    PROBATION: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
    INACTIVE: { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
    'ON LEAVE': { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
    TERMINATED: { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
    RESIGNED: { bg: '#F3E8FF', color: '#7E22CE', dot: '#A855F7' },
  }[status] || { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' };

  return (
    <span style={{ background: cfg.bg, color: cfg.color }} className="uv-status-badge">
      <span style={{ background: cfg.dot }} className="uv-status-dot" />
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  const meta = getRoleMeta(role);
  return (
    <span
      className="uv-role-badge"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  );
}

function UserAvatar({ user, size = 36 }) {
  const color = getAvatarColor(user.name);
  const initials = getInitials(user.name);
  return (
    <div
      className="uv-user-avatar"
      style={{ width: size, height: size, minWidth: size, background: color, fontSize: size * 0.36 }}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      ) : initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL ORG CHART TREE NODE (Top-Down with Horizontal Parallel Branches)
// ─────────────────────────────────────────────────────────────────────────────

function HorizontalOrgNode({ user, allUsers, onUserClick, expandedMap, onToggleExpand }) {
  const children = allUsers.filter(u => u.reportsTo === user.id);
  const meta = getRoleMeta(user.role);
  const RoleIcon = meta.icon;
  const color = getAvatarColor(user.name);
  const isExpanded = expandedMap[user.id] !== false; // default true

  return (
    <div className="h-org-branch-item">
      {/* Node Card */}
      <div
        className="h-org-card"
        onClick={() => onUserClick(user)}
        style={{ borderTopColor: meta.color }}
      >
        {/* Card Header: Role Pill & User Code */}
        <div className="h-org-card-header">
          <span
            className="h-org-role-pill"
            style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
          >
            <RoleIcon size={11} className="shrink-0" />
            <span className="truncate">{meta.label}</span>
          </span>
          {user.userCode && (
            <span className="h-org-code-pill">{user.userCode}</span>
          )}
        </div>

        {/* Identity Row: Avatar + Name + Email */}
        <div className="h-org-card-body">
          <div className="h-org-avatar" style={{ background: color }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : getInitials(user.name)}
            <span
              className={`h-org-status-dot ${user.status === 'ACTIVE' ? 'active' : 'inactive'}`}
            />
          </div>
          <div className="h-org-identity">
            <span className="h-org-name">{user.name}</span>
            <span className="h-org-email">{user.email}</span>
          </div>
        </div>

        {/* Department / Category Tag */}
        {(user.category || user.department) && (
          <div className="h-org-tag-row">
            {user.category ? (
              <span className="h-org-cat-tag" title={user.category}>
                {user.category.split('—')[0].trim()}
              </span>
            ) : (
              <span className="h-org-dept-tag">
                {user.department}
              </span>
            )}
          </div>
        )}

        {/* Bottom Bar: Expand / Collapse Toggle if has direct reports */}
        {children.length > 0 && (
          <div className="h-org-card-footer">
            <button
              type="button"
              className="h-org-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(user.id);
              }}
              title={isExpanded ? 'Collapse sub-team' : 'Expand sub-team'}
            >
              <span>{children.length} {children.length === 1 ? 'Direct Report' : 'Direct Reports'}</span>
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          </div>
        )}
      </div>

      {/* Children Sub-Branches arranged horizontally */}
      {children.length > 0 && isExpanded && (
        <div className="h-org-sub-tree">
          <div className="h-org-stem-down" />
          <div className="h-org-children-row">
            {children.map(child => (
              <HorizontalOrgNode
                key={child.id}
                user={child}
                allUsers={allUsers}
                onUserClick={onUserClick}
                expandedMap={expandedMap}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE ADD / EDIT USER FORM PANEL (Full Viewport with Smooth Animation)
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  // 1. Personal & System
  name: '',
  userCode: '',
  email: '',
  phone: '',
  password: '',
  role: 'sales_executive',
  avatar: '',

  // 2. Work & Organization
  department: 'Sales Team',
  designation: 'Sales Executive',
  category: '',
  status: 'ACTIVE',
  allowLogin: true,
  joinDate: new Date().toISOString().split('T')[0],
  confirmationDate: '',
  monthlySalary: '0.00',

  // 3. Management & Attendance
  reportsTo: '',
  weekendDays: ['Friday', 'Saturday'],
  shiftStartTime: '09:00 AM',
  shiftEndTime: '06:00 PM',
  casualLeave: 10,
  sickLeave: 14,
  earnedLeave: 17,
  lwop: 365,

  // 4. Socials & Presence
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  bio: '',
};

function UserFormPanel({ mode, user, allUsers, onBack, onSave }) {
  const [form, setForm] = useState(mode === 'edit' ? { ...EMPTY_FORM, ...user } : { ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.userCode) return;
    onSave(form);
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      set('avatar', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleWeekendDay = (day) => {
    const current = form.weekendDays || [];
    if (current.includes(day)) {
      set('weekendDays', current.filter(d => d !== day));
    } else {
      set('weekendDays', [...current, day]);
    }
  };

  const supervisorOptions = allUsers
    .filter(u => u.id !== (user?.id))
    .map(u => ({ value: u.id, label: `${u.name} (${getRoleMeta(u.role).label})` }));

  const showCategory = ['Operations', 'Executive'].includes(form.department) || ['ops_manager', 'ops_executive'].includes(form.role);

  return (
    <div
      key="user-form-panel"
      className="ufp-card"
    >
      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Profile Photo & Account Credentials ── */}
        <div className="ufp-section-strip">
          <div className="flex items-center gap-2">
            <User size={14} className="ufp-section-strip-icon" />
            <span>Profile Photo &amp; Account Credentials</span>
          </div>
        </div>

        <div className="ufp-section-body">
          {/* Avatar Upload Strip */}
          <div className="ufp-avatar-strip">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFile}
            />
            <div className="ufp-avatar-box" onClick={() => fileInputRef.current?.click()} title="Upload Avatar Photo">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="ufp-avatar-img" />
              ) : (
                <Camera size={20} />
              )}
            </div>

            <div className="ufp-avatar-meta">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ufp-upload-btn"
                >
                  <Upload size={13} />
                  <span>{form.avatar ? 'Change Photo' : 'Upload Avatar Photo'}</span>
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    onClick={() => set('avatar', '')}
                    className="uv-btn-remove-avatar"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="ufp-upload-subtext">PNG, JPG or WEBP up to 5MB</span>
            </div>
          </div>

          <div className="ufp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Full Name</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Tamiz Rabbi"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Employee Code</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="text"
                required
                value={form.userCode}
                onChange={e => set('userCode', e.target.value)}
                placeholder="e.g. EMP001"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Email Address</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="admin@kodevio.com"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Phone Number</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Password</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <div className="ufp-password-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={mode === 'add'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••"
                  className="ufp-input"
                />
                <button
                  type="button"
                  className="ufp-btn-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>System Role</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <CustomSelect
                size="compact"
                value={form.role}
                onChange={val => set('role', val)}
                options={ROLE_OPTIONS}
                placeholder="Select Role..."
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Work & Organization ── */}
        <div className="ufp-section-strip">
          <Briefcase size={14} className="ufp-section-strip-icon" />
          <span>Work &amp; Organization</span>
        </div>

        <div className="ufp-section-body">
          <div className="ufp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Department</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <CustomSelect
                size="compact"
                value={form.department}
                onChange={val => {
                  set('department', val);
                  const available = getDesignationsForDepartment(val);
                  if (available.length > 0 && !available.includes(form.designation)) {
                    set('designation', available[0]);
                  }
                }}
                options={DEPARTMENT_OPTIONS}
                placeholder="Select Department..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Designation</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <CustomSelect
                size="compact"
                value={form.designation}
                onChange={val => set('designation', val)}
                options={getDesignationsForDepartment(form.department)}
                placeholder="Select Designation..."
              />
            </div>

            {showCategory ? (
              <div className="ufp-field-group">
                <label className="ufp-label">
                  <span>Ops Category</span>
                </label>
                <CustomSelect
                  size="compact"
                  value={form.category || ''}
                  onChange={val => set('category', val)}
                  options={CATEGORY_OPTIONS}
                  placeholder="Select Category..."
                />
              </div>
            ) : (
              <div className="ufp-field-group">
                <label className="ufp-label">
                  <span>Employment Status</span>
                </label>
                <CustomSelect
                  size="compact"
                  value={form.status}
                  onChange={val => set('status', val)}
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  placeholder="Select Status..."
                />
              </div>
            )}

            {showCategory && (
              <div className="ufp-field-group">
                <label className="ufp-label">
                  <span>Employment Status</span>
                </label>
                <CustomSelect
                  size="compact"
                  value={form.status}
                  onChange={val => set('status', val)}
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  placeholder="Select Status..."
                />
              </div>
            )}

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Joining Date</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <CustomDatePicker
                size="compact"
                value={form.joinDate || ''}
                onChange={val => set('joinDate', val)}
                placeholder="Select Joining Date..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Confirmation Date</span>
              </label>
              <CustomDatePicker
                size="compact"
                value={form.confirmationDate || ''}
                onChange={val => set('confirmationDate', val)}
                placeholder="Select Confirmation Date..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Monthly Salary</span>
              </label>
              <div className="ufp-input-prefix-box">
                <span className="ufp-input-prefix-tag">$</span>
                <input
                  type="text"
                  value={form.monthlySalary || ''}
                  onChange={e => set('monthlySalary', e.target.value)}
                  placeholder="0.00"
                  className="ufp-input ufp-input-prefixed font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <label className="ufp-checkbox-label">
              <input
                type="checkbox"
                checked={form.allowLogin !== false}
                onChange={e => set('allowLogin', e.target.checked)}
                className="uv-checkbox"
              />
              <span>System Access (Allow User Login)</span>
            </label>
          </div>
        </div>

        {/* ── Section 3: Management & Attendance ── */}
        <div className="ufp-section-strip">
          <Clock size={14} className="ufp-section-strip-icon" />
          <span>Management &amp; Attendance</span>
        </div>

        <div className="ufp-section-body">
          <div className="ufp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Line Manager</span>
              </label>
              <CustomSelect
                size="compact"
                value={form.reportsTo || ''}
                onChange={val => set('reportsTo', val)}
                options={[{ value: '', label: 'None (Top-Level)' }, ...supervisorOptions]}
                placeholder="Select Manager..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Shift Start Time</span>
              </label>
              <div className="ufp-input-icon-wrap">
                <input
                  type="text"
                  value={form.shiftStartTime || ''}
                  onChange={e => set('shiftStartTime', e.target.value)}
                  placeholder="09:00 AM"
                  className="ufp-input"
                />
                <Clock size={14} className="ufp-input-icon" />
              </div>
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Shift End Time</span>
              </label>
              <div className="ufp-input-icon-wrap">
                <input
                  type="text"
                  value={form.shiftEndTime || ''}
                  onChange={e => set('shiftEndTime', e.target.value)}
                  placeholder="06:00 PM"
                  className="ufp-input"
                />
                <Clock size={14} className="ufp-input-icon" />
              </div>
            </div>
          </div>

          {/* Weekend Days */}
          <div>
            <label className="ufp-label mb-2">
              <span>Weekend Days (Select Active Off Days)</span>
            </label>
            <div className="ufp-weekdays-row">
              {WEEKDAY_OPTIONS.map(day => {
                const isSelected = (form.weekendDays || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekendDay(day)}
                    className={`ufp-weekday-pill ${isSelected ? 'is-active' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Annual Leave Balances Quota */}
          <div>
            <label className="ufp-label mb-2">
              <span>Annual Leave Balances Quota (Days per year)</span>
            </label>
            <div className="ufp-leave-grid">
              <div className="ufp-leave-box">
                <span className="ufp-leave-label">Casual Leave</span>
                <input
                  type="number"
                  className="ufp-leave-input"
                  value={form.casualLeave ?? 10}
                  onChange={e => set('casualLeave', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="ufp-leave-box">
                <span className="ufp-leave-label">Sick Leave</span>
                <input
                  type="number"
                  className="ufp-leave-input"
                  value={form.sickLeave ?? 14}
                  onChange={e => set('sickLeave', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="ufp-leave-box">
                <span className="ufp-leave-label">Earned Leave</span>
                <input
                  type="number"
                  className="ufp-leave-input"
                  value={form.earnedLeave ?? 17}
                  onChange={e => set('earnedLeave', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="ufp-leave-box">
                <span className="ufp-leave-label">LWOP Days</span>
                <input
                  type="number"
                  className="ufp-leave-input"
                  value={form.lwop ?? 365}
                  onChange={e => set('lwop', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Socials & Professional Presence ── */}
        <div className="ufp-section-strip">
          <Globe size={14} className="ufp-section-strip-icon" />
          <span>Socials &amp; Professional Presence</span>
        </div>

        <div className="ufp-section-body">
          <div className="ufp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                type="url"
                value={form.linkedinUrl || ''}
                onChange={e => set('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>GitHub Profile URL</span>
              </label>
              <input
                type="url"
                value={form.githubUrl || ''}
                onChange={e => set('githubUrl', e.target.value)}
                placeholder="https://github.com/..."
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Portfolio Website URL</span>
              </label>
              <input
                type="url"
                value={form.portfolioUrl || ''}
                onChange={e => set('portfolioUrl', e.target.value)}
                placeholder="https://..."
                className="ufp-input"
              />
            </div>
          </div>

          <div className="ufp-field-group">
            <label className="ufp-label">
              <span>Professional Bio &amp; Organizational Notes</span>
            </label>
            <textarea
              rows={3}
              value={form.bio || ''}
              onChange={e => set('bio', e.target.value)}
              placeholder="Enter summary biography, key achievements, or team onboarding notes..."
              className="ufp-textarea"
            />
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="ufp-footer">
          <button
            type="button"
            onClick={onBack}
            className="ufp-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ufp-btn-create"
          >
            {mode === 'add' ? (
              <>
                <UserPlus size={14} />
                <span>Create User</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MODAL (Rich Detail View with All 4 Sections)
// ─────────────────────────────────────────────────────────────────────────────

function UserViewModal({ user, allUsers, onClose, onEdit }) {
  const meta = getRoleMeta(user.role);
  const RoleIcon = meta.icon;
  const supervisor = allUsers.find(u => u.id === user.reportsTo);
  const directReports = allUsers.filter(u => u.reportsTo === user.id);
  const color = getAvatarColor(user.name);

  return (
    <div className="uv-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="uv-modal-card uv-view-modal-lg"
      >
        {/* Close */}
        <button type="button" className="uv-modal-close uv-view-close" onClick={onClose}>
          <X size={16} />
        </button>

        {/* Profile Hero */}
        <div className="uv-view-hero" style={{ background: `linear-gradient(135deg, ${meta.bg} 0%, #F8FAFC 100%)` }}>
          <div className="uv-view-avatar" style={{ background: color }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : getInitials(user.name)}
          </div>
          <div className="uv-view-hero-info">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="uv-view-name">{user.name}</h2>
              {user.userCode && (
                <span className="uv-view-code">{user.userCode}</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="uv-view-role" style={{ color: meta.color }}>
                <RoleIcon size={13} />
                <span>{meta.label}</span>
              </div>
              {user.designation && (
                <span className="uv-view-designation-text">• {user.designation}</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={user.status || 'ACTIVE'} />
              {user.allowLogin !== false ? (
                <span className="uv-access-badge-active">
                  <Check size={10} /> Login Enabled
                </span>
              ) : (
                <span className="uv-access-badge-inactive">
                  <X size={10} /> Login Disabled
                </span>
              )}
            </div>
          </div>

          <button type="button" className="uv-view-edit-btn" onClick={() => onEdit(user)}>
            <Edit2 size={13} /> Edit User
          </button>
        </div>

        {/* Details Body */}
        <div className="uv-view-body">
          {/* Card 1: Contact & Credentials */}
          <div className="uv-view-section-card">
            <h4 className="uv-view-section-heading">
              <User size={13} className="text-indigo-600" />
              <span>Contact & Identity</span>
            </h4>
            <div className="uv-view-grid">
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Mail size={11} /> Email Address</span>
                <span className="uv-view-field-value">{user.email || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Phone size={11} /> Phone Number</span>
                <span className="uv-view-field-value">{user.phone || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Shield size={11} /> Employee ID</span>
                <span className="uv-view-field-value font-mono">{user.userCode || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Lock size={11} /> Password Status</span>
                <span className="uv-view-field-value text-emerald-600 font-semibold">Encrypted / Protected</span>
              </div>
            </div>
          </div>

          {/* Card 2: Work & Organization */}
          <div className="uv-view-section-card">
            <h4 className="uv-view-section-heading">
              <Briefcase size={13} className="text-blue-600" />
              <span>Work & Organization</span>
            </h4>
            <div className="uv-view-grid">
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Building2 size={11} /> Department</span>
                <span className="uv-view-field-value">{user.department || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Award size={11} /> Designation</span>
                <span className="uv-view-field-value">{user.designation || '—'}</span>
              </div>
              {user.category && (
                <div className="uv-view-field">
                  <span className="uv-view-field-label"><Layers size={11} /> Ops Category</span>
                  <span className="uv-view-field-value text-emerald-700 font-semibold">{user.category}</span>
                </div>
              )}
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Calendar size={11} /> Joining Date</span>
                <span className="uv-view-field-value">{user.joinDate || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Calendar size={11} /> Confirmation Date</span>
                <span className="uv-view-field-value">{user.confirmationDate || '—'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><DollarSign size={11} /> Monthly Salary</span>
                <span className="uv-view-field-value font-mono font-bold text-slate-900">${user.monthlySalary || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Management & Attendance */}
          <div className="uv-view-section-card">
            <h4 className="uv-view-section-heading">
              <Clock size={13} className="text-amber-600" />
              <span>Management & Attendance</span>
            </h4>
            <div className="uv-view-grid">
              <div className="uv-view-field">
                <span className="uv-view-field-label"><UserCheck size={11} /> Line Manager</span>
                <span className="uv-view-field-value">{supervisor ? supervisor.name : 'None (Top-Level)'}</span>
              </div>
              <div className="uv-view-field">
                <span className="uv-view-field-label"><Clock size={11} /> Shift Schedule</span>
                <span className="uv-view-field-value">
                  {user.shiftStartTime || '09:00 AM'} - {user.shiftEndTime || '06:00 PM'}
                </span>
              </div>
            </div>

            {/* Weekend Days */}
            <div className="mt-3">
              <span className="uv-view-field-label mb-1.5 block">Weekend Days</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(user.weekendDays && user.weekendDays.length > 0 ? user.weekendDays : ['Friday', 'Saturday']).map(d => (
                  <span key={d} className="uv-view-weekend-chip">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Leave Balances */}
            <div className="mt-3">
              <span className="uv-view-field-label mb-1.5 block">Leave Balances</span>
              <div className="uv-leave-balances-grid">
                <div className="uv-view-leave-stat">
                  <span className="uv-view-leave-num">{user.casualLeave ?? 10}</span>
                  <span className="uv-view-leave-lbl">Casual Leave</span>
                </div>
                <div className="uv-view-leave-stat">
                  <span className="uv-view-leave-num">{user.sickLeave ?? 14}</span>
                  <span className="uv-view-leave-lbl">Sick Leave</span>
                </div>
                <div className="uv-view-leave-stat">
                  <span className="uv-view-leave-num">{user.earnedLeave ?? 17}</span>
                  <span className="uv-view-leave-lbl">Earned Leave</span>
                </div>
                <div className="uv-view-leave-stat">
                  <span className="uv-view-leave-num">{user.lwop ?? 365}</span>
                  <span className="uv-view-leave-lbl">LWOP Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Socials & Presence */}
          {(user.linkedinUrl || user.githubUrl || user.portfolioUrl || user.bio) && (
            <div className="uv-view-section-card">
              <h4 className="uv-view-section-heading">
                <Globe size={13} className="text-emerald-600" />
                <span>Socials & Professional Presence</span>
              </h4>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="uv-social-link-btn">
                    <Linkedin size={13} className="text-blue-600" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {user.githubUrl && (
                  <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="uv-social-link-btn">
                    <Github size={13} />
                    <span>GitHub</span>
                  </a>
                )}
                {user.portfolioUrl && (
                  <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="uv-social-link-btn">
                    <Globe size={13} className="text-emerald-600" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>

              {user.bio && (
                <div className="uv-view-bio-box">
                  <p className="uv-view-bio-text">{user.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Card 5: Direct Reports */}
          {directReports.length > 0 && (
            <div className="uv-view-section-card">
              <h4 className="uv-view-section-heading">
                <Users size={13} className="text-indigo-600" />
                <span>Direct Reports ({directReports.length})</span>
              </h4>
              <div className="uv-view-reports-list">
                {directReports.map(r => (
                  <div key={r.id} className="uv-view-report-chip">
                    <UserAvatar user={r} size={26} />
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900">{r.name}</span>
                      <span className="text-[11px] text-slate-500">{r.designation || getRoleMeta(r.role).label}</span>
                    </div>
                    <RoleBadge role={r.role} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({ users, onConfirm, onCancel }) {
  const isBulk = users.length > 1;
  return (
    <div className="uv-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="uv-modal-card uv-delete-modal"
      >
        <div className="uv-delete-icon-wrap">
          <AlertTriangle size={28} />
        </div>
        <h3 className="uv-delete-title">
          {isBulk ? `Delete ${users.length} Users?` : `Delete "${users[0]?.name}"?`}
        </h3>
        <p className="uv-delete-desc">
          {isBulk
            ? `You are about to permanently delete ${users.length} users. This action cannot be undone.`
            : 'This user will be permanently removed from the organization. This action cannot be undone.'}
        </p>
        <div className="uv-delete-footer">
          <button type="button" className="uv-btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="uv-btn-danger" onClick={onConfirm}>
            <Trash2 size={14} /><span>Delete</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN USERS VIEW
// ─────────────────────────────────────────────────────────────────────────────

export default function UsersView({ user: currentUser, onShowToast }) {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_users_db');
      if (saved) { const p = JSON.parse(saved); if (Array.isArray(p) && p.length > 0) return p; }
    } catch (e) {}
    return SEED_USERS;
  });

  // Fetch live users from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBackendUsers() {
      try {
        const res = await usersApi.fetchUsers();
        if (isMounted && res?.users && Array.isArray(res.users) && res.users.length > 0) {
          setUsers(res.users);
          localStorage.setItem('kodevio_users_db', JSON.stringify(res.users));
        }
      } catch (err) {
        console.warn('Backend users load note:', err.message);
      }
    }
    loadBackendUsers();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('kodevio_users_db', JSON.stringify(users));
    LiveSyncEngine.broadcast('users', users);
  }, [users]);

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'org' | 'add' | 'edit'
  const [orgZoom, setOrgZoom] = useState(1);
  const [expandedMap, setExpandedMap] = useState({});

  const handleToggleExpand = (id) => {
    setExpandedMap(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const handleExpandAll = () => {
    const next = {};
    users.forEach(u => { next[u.id] = true; });
    setExpandedMap(next);
  };

  const handleCollapseAll = () => {
    const next = {};
    users.forEach(u => { next[u.id] = false; });
    setExpandedMap(next);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalMode, setModalMode] = useState(null); // 'view' | 'delete' | 'bulk-delete'
  const [activeUser, setActiveUser] = useState(null);

  // ── Filtering & Sorting ──────────────────────────────────────────────────
  const filtered = users
    .filter(u => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q) || getRoleMeta(u.role).label.toLowerCase().includes(q);
      const matchDept = !filterDept || u.department === filterDept;
      const matchRole = !filterRole || u.role === filterRole;
      return matchQ && matchDept && matchRole;
    })
    .sort((a, b) => {
      let aVal = sortField === 'role' ? getRoleMeta(a.role).label : a[sortField] || '';
      let bVal = sortField === 'role' ? getRoleMeta(b.role).label : b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const allSelected = filtered.length > 0 && filtered.every(u => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSave = async (formData) => {
    if (viewMode === 'add') {
      const newUser = {
        ...formData,
        id: `usr-${Date.now()}`,
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      };
      setUsers(prev => [newUser, ...prev]);
      try {
        await usersApi.createUser(newUser);
      } catch (err) {
        console.warn('Backend user save error:', err);
      }
    } else if (viewMode === 'edit' && activeUser) {
      const updatedUser = { ...activeUser, ...formData };
      setUsers(prev => prev.map(u => u.id === activeUser.id ? updatedUser : u));
      try {
        await usersApi.updateUser(activeUser.id, updatedUser);
      } catch (err) {
        console.warn('Backend user update error:', err);
      }
    }
    setViewMode('list');
    setActiveUser(null);
    if (onShowToast) onShowToast();
  };

  const handleDelete = async (ids) => {
    setUsers(prev => prev.filter(u => !ids.includes(u.id)));
    setSelectedIds(new Set());
    setModalMode(null);
    setActiveUser(null);
    try {
      if (ids.length === 1) {
        await usersApi.deleteUser(ids[0]);
      } else {
        await usersApi.bulkDeleteUsers(ids);
      }
    } catch (err) {
      console.warn('Backend user delete error:', err);
    }
    if (onShowToast) onShowToast();
  };

  // Root users for org chart
  const rootUsers = users.filter(u => !u.reportsTo);

  const isFormView = viewMode === 'add' || viewMode === 'edit';

  return (
    <div className="uv-container">
      {/* ── Toolbar (Hidden when in Add/Edit full panel view) ──────────────── */}
      {!isFormView && (
        <div className="uv-toolbar">
          {/* Left: Search */}
          <div className="uv-search-box">
            <Search size={14} className="uv-search-icon" />
            <input
              type="text"
              className="uv-search-input"
              placeholder="Search users by name, email, role…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="uv-search-clear" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="uv-filter-row">
            <div className="uv-filter-select-wrap">
              <CustomSelect
                value={filterDept}
                onChange={setFilterDept}
                options={[{ value: '', label: 'All Departments' }, ...DEPARTMENT_OPTIONS.map(d => ({ value: d, label: d }))]}
                placeholder="All Departments"
                size="compact"
              />
            </div>
            <div className="uv-filter-select-wrap">
              <CustomSelect
                value={filterRole}
                onChange={setFilterRole}
                options={[{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS]}
                placeholder="All Roles"
                size="compact"
              />
            </div>
          </div>

          {/* Right: View toggle + Add */}
          <div className="uv-toolbar-right">
            <div className="uv-view-toggle">
              <button
                type="button"
                className={`uv-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                className={`uv-toggle-btn ${viewMode === 'org' ? 'active' : ''}`}
                onClick={() => setViewMode('org')}
                title="Org Chart"
              >
                <Network size={14} />
              </button>
            </div>
            <button
              type="button"
              className="uv-add-btn"
              onClick={() => { setActiveUser(null); setViewMode('add'); }}
            >
              <UserPlus size={14} />
              <span>Add User</span>
            </button>
          </div>
        </div>
      )}

      {/* ── VIEWS ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === 'add' || viewMode === 'edit' ? (
          <UserFormPanel
            key="panel-user-form"
            mode={viewMode}
            user={activeUser}
            allUsers={users}
            onBack={() => { setViewMode('list'); setActiveUser(null); }}
            onSave={handleSave}
          />
        ) : viewMode === 'org' ? (
          <motion.div
            key="org-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="h-org-view"
          >
            {/* Horizontal Org Chart Sub-header Toolbar */}
            <div className="h-org-header-toolbar">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-indigo-600" />
                <span className="font-extrabold text-sm text-slate-800">Organizational Hierarchy Tree</span>
                <span className="h-org-count-tag">{users.length} Members</span>
              </div>

              {/* Chart Actions: Zoom Controls + Expand/Collapse */}
              <div className="h-org-controls-row">
                <div className="h-org-btn-group">
                  <button
                    type="button"
                    className="h-org-ctrl-btn"
                    onClick={() => setOrgZoom(z => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="h-org-zoom-label">{Math.round(orgZoom * 100)}%</span>
                  <button
                    type="button"
                    className="h-org-ctrl-btn"
                    onClick={() => setOrgZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    className="h-org-ctrl-btn"
                    onClick={() => setOrgZoom(1)}
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                <div className="h-org-btn-group">
                  <button
                    type="button"
                    className="h-org-pill-btn"
                    onClick={handleExpandAll}
                  >
                    <ChevronsUpDown size={12} />
                    <span>Expand All</span>
                  </button>
                  <button
                    type="button"
                    className="h-org-pill-btn"
                    onClick={handleCollapseAll}
                  >
                    <span>Collapse</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Canvas with Scaled Tree */}
            <div className="h-org-canvas-viewport">
              <div
                className="h-org-tree-canvas"
                style={{
                  transform: `scale(${orgZoom})`,
                  transformOrigin: 'top center',
                }}
              >
                <div className="h-org-roots-row">
                  {rootUsers.map(root => (
                    <HorizontalOrgNode
                      key={root.id}
                      user={root}
                      allUsers={users}
                      onUserClick={(u) => { setActiveUser(u); setModalMode('view'); }}
                      expandedMap={expandedMap}
                      onToggleExpand={handleToggleExpand}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="w-full overflow-x-auto bg-white">
              <table className="uv-table">
                <thead className="uv-table-head">
                  <tr>
                    <th className="uv-th uv-th-check">
                      <input
                        type="checkbox"
                        className="uv-checkbox"
                        checked={allSelected}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(new Set(filtered.map(u => u.id)));
                          else setSelectedIds(new Set());
                        }}
                      />
                    </th>
                    <th className="uv-th uv-th-sortable-cell" onClick={() => toggleSort('name')}>
                      <div className="uv-th-inner">
                        <span>USER IDENTITY</span>
                        <ArrowUpDown size={11} className="uv-sort-icon" />
                      </div>
                    </th>
                    <th className="uv-th uv-th-sortable-cell" onClick={() => toggleSort('role')}>
                      <div className="uv-th-inner">
                        <span>ROLE / POSITION</span>
                        <ArrowUpDown size={11} className="uv-sort-icon" />
                      </div>
                    </th>
                    <th className="uv-th">
                      <div className="uv-th-inner">
                        <span>DEPARTMENT</span>
                      </div>
                    </th>
                    <th className="uv-th">
                      <div className="uv-th-inner">
                        <span>OPS CATEGORY</span>
                      </div>
                    </th>
                    <th className="uv-th">
                      <div className="uv-th-inner">
                        <span>REPORTS TO</span>
                      </div>
                    </th>
                    <th className="uv-th uv-th-sortable-cell" onClick={() => toggleSort('status')}>
                      <div className="uv-th-inner">
                        <span>STATUS</span>
                        <ArrowUpDown size={11} className="uv-sort-icon" />
                      </div>
                    </th>
                    <th className="uv-th uv-th-actions">
                      <div className="uv-th-inner justify-end">
                        <span>ACTIONS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="uv-empty-state">
                            <Users size={36} className="uv-empty-icon" />
                            <span className="uv-empty-text">No users found</span>
                            <span className="uv-empty-sub">Try adjusting your search or filters</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map((u, idx) => {
                      const supervisor = users.find(s => s.id === u.reportsTo);
                      const isSelected = selectedIds.has(u.id);
                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15, delay: idx * 0.02 }}
                          className={`uv-table-row ${isSelected ? 'is-selected' : ''}`}
                        >
                          <td className="uv-td uv-td-check">
                            <input
                              type="checkbox"
                              className="uv-checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const next = new Set(selectedIds);
                                if (e.target.checked) next.add(u.id);
                                else next.delete(u.id);
                                setSelectedIds(next);
                              }}
                            />
                          </td>
                          <td className="uv-td uv-td-user">
                            <div className="uv-td-user-inner">
                              <UserAvatar user={u} size={36} />
                              <div className="uv-td-user-info">
                                <span className="uv-td-user-name">{u.name}</span>
                                <span className="uv-td-user-email">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="uv-td">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="uv-td uv-td-dept">{u.department || '—'}</td>
                          <td className="uv-td uv-td-cat">
                            {u.category ? (
                              <span className="uv-cat-tag">{u.category}</span>
                            ) : '—'}
                          </td>
                          <td className="uv-td uv-td-reports">
                            {supervisor ? (
                              <div className="flex items-center gap-1.5">
                                <UserAvatar user={supervisor} size={22} />
                                <span className="uv-supervisor-name">{supervisor.name}</span>
                              </div>
                            ) : <span className="uv-td-empty">—</span>}
                          </td>
                          <td className="uv-td">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="uv-td uv-td-actions">
                            <div className="uv-action-btns">
                              <button
                                type="button"
                                className="uv-action-btn"
                                title="Edit User"
                                onClick={() => { setActiveUser(u); setViewMode('edit'); }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="uv-action-btn uv-action-danger"
                                title="Delete User"
                                onClick={() => { setActiveUser(u); setModalMode('delete'); }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Row count footer */}
            <div className="uv-table-footer">
              <span>Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</span>
              {someSelected && (
                <span className="uv-footer-selected">{selectedIds.size} selected</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Bulk Selection Bar ──────────────────────────────────── */}
      <AnimatePresence>
        {someSelected && !isFormView && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="uv-floating-selection-bar"
          >
            <span className="uv-selection-text">Selected: {selectedIds.size}</span>
            <span className="uv-selection-pipe">|</span>
            <button
              type="button"
              className="uv-selection-delete-link"
              onClick={() => setModalMode('bulk-delete')}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
            <button
              type="button"
              className="uv-selection-discard-pill"
              onClick={() => setSelectedIds(new Set())}
            >
              Discard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals (View & Delete Confirmations) ─────────────────────────── */}
      <AnimatePresence>
        {modalMode === 'view' && activeUser && (
          <UserViewModal
            key="view-modal"
            user={activeUser}
            allUsers={users}
            onClose={() => { setModalMode(null); setActiveUser(null); }}
            onEdit={(u) => { setModalMode(null); setActiveUser(u); setViewMode('edit'); }}
          />
        )}

        {modalMode === 'delete' && activeUser && (
          <DeleteConfirmModal
            key="delete-modal"
            users={[activeUser]}
            onConfirm={() => handleDelete([activeUser.id])}
            onCancel={() => { setModalMode(null); setActiveUser(null); }}
          />
        )}

        {modalMode === 'bulk-delete' && (
          <DeleteConfirmModal
            key="bulk-delete-modal"
            users={users.filter(u => selectedIds.has(u.id))}
            onConfirm={() => handleDelete([...selectedIds])}
            onCancel={() => setModalMode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
