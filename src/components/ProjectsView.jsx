import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Globe,
  Trash2,
  Calendar,
  Download,
  FileText,
  User,
  Briefcase,
  Filter,
  ArrowUpDown,
  Grid,
  List,
  MoreHorizontal,
  Edit2,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  CheckCircle,
  Award,
  ExternalLink,
  DollarSign,
  Layers,
  FolderPlus,
  FolderKanban,
  Tag,
  AlertCircle,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Link,
  Github,
  Figma,
  Code,
  ShieldCheck,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import ProjectDetailsView from './ProjectDetailsView';
import { projectsApi, clientsApi, fiverrProfilesApi, usersApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';

export const PROJECT_STATUS_OPTIONS = [
  'NRA',
  'ISSUE',
  'WIP',
  'IN PROGRESS',
  'IN REVISION',
  'CANCELED',
  'DELIVERED',
  'COMPLETED',
  'ON HOLD'
];

export const PROJECT_CATEGORY_OPTIONS = [
  'Web Development',
  'Mobile App',
  'Design',
  'Marketing',
  'SEO',
  'CMS',
  'Tips',
  'B2B - BD',
  'B2B - Global',
  'B2G - BD',
  'B2G - Global',
  'Other'
];

export const SERVICE_LINE_OPTIONS = [
  'UI/UX',
  'Frontend',
  'Backend',
  'Deployment',
  'UI/UX & Frontend',
  'UI/UX & Backend',
  'UI/UX & Deployment',
  'Frontend & Backend',
  'Frontend & Deployment',
  'Backend & Deployment',
  'UI/UX & Frontend & Backend',
  'UI/UX & Frontend & Deployment',
  'UI/UX & Backend & Deployment',
  'Frontend & Backend & Deployment',
  'UI/UX & Frontend & Backend & Deployment',
  'Wix',
  'Shopify',
  'Webflow',
  'WordPress',
  'SquareSpace',
  'Other'
];

export const MILESTONE_OPTIONS = [
  'Single Milestone',
  'Milestone 1 — Wireframes & UI',
  'Milestone 2 — Frontend & Core Features',
  'Milestone 3 — Backend & Integrations',
  'Milestone 4 — Final QA & Handover',
  '1ST MILESTONE',
  '2ND MILESTONE',
  'FINAL MILESTONE',
  'Monthly Retainer'
];

export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const DEFAULT_DEV_POOL = [
  { name: 'MIR', initials: 'MT', color: '#3B82F6', designation: 'Frontend Developer' },
  { name: 'KHALID', initials: 'KH', color: '#0EA5E9', designation: 'Full Stack Dev' },
  { name: 'MUNTASIR', initials: 'MA', color: '#10B981', designation: 'Backend Dev' },
  { name: 'MONIRUL', initials: 'MM', color: '#06B6D4', designation: 'UI/UX Designer' },
  { name: 'MOHAMMAD', initials: 'MT', color: '#8B5CF6', designation: 'CMS Specialist' },
  { name: 'SAKHAWAT', initials: 'SH', color: '#EA580C', designation: 'Senior Lead' },
  { name: 'SHUVO', initials: 'SA', color: '#A855F7', designation: 'Sales & Ops' }
];

export const KANBAN_COLUMNS = [
  {
    id: 'backlog',
    title: 'Discovery & Backlog',
    color: '#475569',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
    statuses: ['NRA', 'DISCOVERY', 'SUBMITTED', 'ON HOLD'],
    defaultStatus: 'SUBMITTED',
  },
  {
    id: 'in_progress',
    title: 'In Execution & Dev',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    statuses: ['IN PROGRESS', 'WIP'],
    defaultStatus: 'IN PROGRESS',
  },
  {
    id: 'qa_review',
    title: 'QA & Dev Review',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    statuses: ['DEV REVIEW', 'ISSUE', 'IN REVISION'],
    defaultStatus: 'DEV REVIEW',
  },
  {
    id: 'delivered',
    title: 'Delivered to Client',
    color: '#7E22CE',
    bg: '#FAF5FF',
    border: '#E9D5FF',
    badgeBg: '#F3E8FF',
    badgeColor: '#6B21A8',
    statuses: ['DELIVERED'],
    defaultStatus: 'DELIVERED',
  },
  {
    id: 'completed',
    title: 'Completed & Accepted',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46',
    statuses: ['COMPLETED'],
    defaultStatus: 'COMPLETED',
  },
];

export default function ProjectsView({
  onShowToast,
  onSyncDatabase,
  isSyncing,
  user,
  onProjectsChange,
  onViewingDetailsChange
}) {
  const [projects, setProjectsRaw] = useState([]);
  const setProjects = (val) => {
    const next = typeof val === 'function' ? val(projects) : val;
    setProjectsRaw(next);
    if (onProjectsChange) onProjectsChange(next);
  };

  const [loading, setLoading] = useState(true);
  const [clientsList, setClientsList] = useState([]);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);

  // View Mode: Table or Kanban Board
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // Filters & Search (Month Wise, Deadline, Sales Handler, Client, Profile, Status, Due Days, Category, Team Member)
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [salesHandlerFilter, setSalesHandlerFilter] = useState('All Sales Handlers');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [profileFilter, setProfileFilter] = useState('All Profiles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [dueDaysFilter, setDueDaysFilter] = useState('All Due Days');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [quickFilter, setQuickFilter] = useState('all');

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [viewingProject, setViewingProject] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Notify parent if details drawer is open
  useEffect(() => {
    if (onViewingDetailsChange) {
      onViewingDetailsChange(Boolean(viewingProject));
    }
  }, [viewingProject, onViewingDetailsChange]);

  // Load all initial data (projects, clients, seller profiles, users)
  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, cliRes, profRes, userRes] = await Promise.all([
        projectsApi.fetchProjects().catch(() => ({ projects: [] })),
        clientsApi.fetchClients().catch(() => ({ clients: [] })),
        fiverrProfilesApi.fetchProfiles().catch(() => ({ profiles: [] })),
        usersApi.fetchUsers().catch(() => ({ users: [] }))
      ]);

      if (projRes?.projects && Array.isArray(projRes.projects)) {
        setProjects(projRes.projects);
      } else {
        setProjects([]);
      }

      if (cliRes?.clients && Array.isArray(cliRes.clients)) {
        setClientsList(cliRes.clients);
      }
      if (profRes?.profiles && Array.isArray(profRes.profiles)) {
        setSellerProfiles(profRes.profiles);
      }
      if (userRes?.users && Array.isArray(userRes.users)) {
        setTeamUsers(userRes.users);
      }
    } catch (err) {
      console.warn('ProjectsView load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync projects with localStorage & broadcast dynamic live sync
  useEffect(() => {
    if (projects.length > 0) {
      try {
        localStorage.setItem('kodevio_projects_db', JSON.stringify(projects));
        LiveSyncEngine.broadcast('projects', projects);
      } catch (e) {}
    }
  }, [projects]);

  // Inline quick status change
  const handleQuickStatusChange = async (projId, newStatus) => {
    const updated = projects.map((p) => (p.id === projId ? { ...p, status: newStatus.toUpperCase() } : p));
    setProjects(updated);
    if (viewingProject && viewingProject.id === projId) {
      setViewingProject((prev) => ({ ...prev, status: newStatus.toUpperCase() }));
    }
    try {
      await projectsApi.updateProject(projId, { status: newStatus.toUpperCase() });
    } catch (err) {
      console.warn('Quick status update note:', err);
    }
    if (onShowToast) onShowToast();
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e, projectId) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.setData('text/plain', String(projectId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e, targetCol) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const rawId = e.dataTransfer.getData('text/plain') || draggedProjectId;
    if (!rawId) return;

    const targetStatus = targetCol.defaultStatus;
    const project = projects.find((p) => String(p.id) === String(rawId));
    if (!project) return;

    if (targetCol.statuses.includes(project.status?.toUpperCase())) {
      setDraggedProjectId(null);
      return;
    }

    // Optimistic update
    const updated = projects.map((p) =>
      String(p.id) === String(rawId) ? { ...p, status: targetStatus } : p
    );
    setProjects(updated);
    if (viewingProject && String(viewingProject.id) === String(rawId)) {
      setViewingProject((prev) => ({ ...prev, status: targetStatus }));
    }
    setDraggedProjectId(null);

    if (onShowToast) {
      onShowToast(`Moved ${project.order_number || 'Project'} to ${targetCol.title} (${targetStatus})`);
    }

    try {
      await projectsApi.updateProject(rawId, { status: targetStatus });
    } catch (err) {
      console.warn('Drag-and-drop update error:', err);
    }
  };

  // Delete single project
  const handleDeleteProject = async (projId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    if (viewingProject && viewingProject.id === projId) {
      setViewingProject(null);
    }
    setDeleteConfirmProject(null);
    try {
      await projectsApi.deleteProject(projId);
    } catch (err) {
      console.warn('Delete project note:', err);
    }
    if (onShowToast) onShowToast();
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const idsToDelete = new Set(selectedIds);
    setProjects((prev) => prev.filter((p) => !idsToDelete.has(p.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
    try {
      await projectsApi.bulkDeleteProjects(Array.from(idsToDelete));
    } catch (err) {
      console.warn('Bulk delete projects note:', err);
    }
    if (onShowToast) onShowToast();
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const updated = projects.map((p) => (idSet.has(p.id) ? { ...p, status: newStatus.toUpperCase() } : p));
    setProjects(updated);
    setSelectedIds([]);
    try {
      await Promise.all(
        Array.from(idSet).map((id) => projectsApi.updateProject(id, { status: newStatus.toUpperCase() }))
      );
    } catch (err) {
      console.warn('Bulk status note:', err);
    }
    if (onShowToast) onShowToast();
  };

  // Dedicated Project Details Save & Update Handlers
  const handleSaveProjectFromDetails = async (updatedProj) => {
    if (!updatedProj || !updatedProj.id) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProj.id ? { ...updatedProj } : p))
    );
    setViewingProject(updatedProj);
    if (onShowToast) onShowToast();
    try {
      await projectsApi.updateProject(updatedProj.id, updatedProj);
    } catch (err) {
      console.warn('Background save project note:', err.message);
    }
  };

  const handleUpdateProjectStatus = async (id, newStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    if (onShowToast) onShowToast();
    try {
      await projectsApi.updateProject(id, { status: newStatus });
    } catch (err) {
      console.warn('Background update project status note:', err.message);
    }
  };

  // Export Projects to CSV
  const handleExportCSV = () => {
    if (projects.length === 0) {
      alert('No projects to export');
      return;
    }
    const headers = [
      'Project ID',
      'Project Code',
      'Title',
      'Category',
      'Service',
      'Client Name',
      'Client Username',
      'Fiverr Profile',
      'Milestone',
      'Status',
      'Priority',
      'Start Date',
      'Deadline Date',
      'Total Budget ($)',
      'Earned Amount ($)',
      'Sales Handler',
      'Project Manager'
    ];
    const rows = projects.map((p) => [
      `"${p.id || ''}"`,
      `"${p.projectCode || ''}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      `"${p.serviceLine || p.service || ''}"`,
      `"${p.clientName || ''}"`,
      `"${p.clientUsername || ''}"`,
      `"${p.fiverrProfile || ''}"`,
      `"${p.milestone || ''}"`,
      `"${p.status || ''}"`,
      `"${p.priority || ''}"`,
      `"${p.startDate || ''}"`,
      `"${p.deadlineDate || p.deliveryDate || ''}"`,
      p.budget || p.totalAmount || 0,
      p.deliveryAmount || p.earnedAmount || 0,
      `"${p.salesHandler?.name || p.salesPerson || ''}"`,
      `"${p.opsHandler?.name || p.projectManager || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kodevio_projects_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast();
  };

  // Status helper colors
  const getStatusBadgeClass = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (s.includes('PROGRESS') || s === 'WIP') return 'prj-status-progress';
    if (s.includes('REVISION')) return 'prj-status-revision';
    if (s.includes('DELIVERED')) return 'prj-status-delivered';
    if (s.includes('COMPLETED') || s === 'DONE') return 'prj-status-completed';
    if (s.includes('HOLD') || s.includes('PAUSE')) return 'prj-status-hold';
    if (s.includes('CANCEL')) return 'prj-status-cancelled';
    return 'prj-status-default';
  };

  const getPriorityBadgeClass = (pr) => {
    const p = String(pr || '').toUpperCase().trim();
    if (p === 'URGENT') return 'prj-priority-urgent';
    if (p === 'HIGH') return 'prj-priority-high';
    if (p === 'MEDIUM') return 'prj-priority-medium';
    return 'prj-priority-low';
  };

  // Days remaining calculation helper
  const getDaysRemainingInfo = (deadlineStr, status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'DELIVERED') {
      return { text: 'Delivered', class: 'prj-deadline-delivered', icon: CheckCircle };
    }
    if (!deadlineStr) return { text: 'No deadline', class: 'prj-deadline-none', icon: Clock };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr + 'T00:00:00');
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        class: 'prj-deadline-overdue',
        icon: AlertCircle
      };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', class: 'prj-deadline-urgent', icon: Clock };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays}d remaining`, class: 'prj-deadline-warning', icon: Clock };
    }
    return { text: `${diffDays}d remaining`, class: 'prj-deadline-ok', icon: Clock };
  };

  const formatCompactTimeline = (startStr, endStr) => {
    if (!startStr && !endStr) return '---';
    if (!startStr && endStr) {
      const end = new Date(endStr + 'T00:00:00');
      return `Due ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (startStr && !endStr) {
      const start = new Date(startStr + 'T00:00:00');
      return `From ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  };

  // Country flag ISO code resolver
  const getCountryCode = (countryName) => {
    if (!countryName) return 'us';
    const c = String(countryName).trim().toLowerCase();
    const map = {
      'united states': 'us',
      usa: 'us',
      us: 'us',
      'united kingdom': 'gb',
      uk: 'gb',
      'great britain': 'gb',
      canada: 'ca',
      germany: 'de',
      france: 'fr',
      australia: 'au',
      netherlands: 'nl',
      switzerland: 'ch',
      sweden: 'se',
      norway: 'no',
      denmark: 'dk',
      spain: 'es',
      italy: 'it',
      israel: 'il',
      uae: 'ae',
      'united arab emirates': 'ae',
      dubai: 'ae',
      singapore: 'sg',
      india: 'in',
      pakistan: 'pk',
      bangladesh: 'bd',
      brazil: 'br',
      mexico: 'mx',
      japan: 'jp',
      china: 'cn',
      turkey: 'tr',
      russia: 'ru',
      saudi: 'sa',
      'saudi arabia': 'sa',
      qatar: 'qa',
      kuwait: 'kw',
      bahrain: 'bh',
      oman: 'om',
      ireland: 'ie',
      belgium: 'be',
      austria: 'at',
      poland: 'pl',
      portugal: 'pt',
      greece: 'gr',
      finland: 'fi',
      'new zealand': 'nz',
      southafrica: 'za',
      'south africa': 'za',
      egypt: 'eg',
      nigeria: 'ng',
      kenya: 'ke',
    };
    return map[c] || 'us';
  };

  // Assigned developers resolver
  const getAssignedDevelopers = (p) => {
    if (Array.isArray(p.devAssignees) && p.devAssignees.length > 0) {
      return p.devAssignees;
    }
    if (Array.isArray(p.team_members) && p.team_members.length > 0) {
      return p.team_members;
    }
    if (Array.isArray(p.assignedDevs) && p.assignedDevs.length > 0) {
      return p.assignedDevs;
    }
    // Default fallback developer assignees
    return [
      { name: 'Mir Tawfiq', initials: 'MT', color: '#3B82F6', designation: 'Frontend Lead' },
      { name: 'Muntasir', initials: 'MA', color: '#10B981', designation: 'Fullstack Dev' },
    ];
  };

  // Developer task progress calculator
  const calculateDeveloperProgress = (p) => {
    if (Array.isArray(p.tasks) && p.tasks.length > 0) {
      const done = p.tasks.filter((t) => t.status === 'Done' || t.completed).length;
      const total = p.tasks.length;
      return { completed: done, total, percentage: Math.round((done / total) * 100) };
    }
    const status = String(p.status || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'DONE') return { completed: 5, total: 5, percentage: 100 };
    if (status === 'DELIVERED') return { completed: 4, total: 5, percentage: 80 };
    if (status.includes('REVISION') || status === 'ISSUE' || status === 'DEV REVIEW') return { completed: 3, total: 5, percentage: 60 };
    if (status.includes('PROGRESS') || status === 'WIP') return { completed: 2, total: 5, percentage: 40 };
    return { completed: 1, total: 5, percentage: 20 };
  };

  // Filtered and searched projects
  const filteredProjects = projects.filter((p) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchCode = p.projectCode?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || p.orderNumber?.toLowerCase().includes(q);
      const matchClient = p.clientName?.toLowerCase().includes(q) || p.clientUsername?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q) || p.scopeDescription?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q) || p.serviceLine?.toLowerCase().includes(q);
      const matchAssignees = p.salesHandler?.name?.toLowerCase().includes(q) || p.opsHandler?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchClient && !matchNotes && !matchCategory && !matchAssignees) {
        return false;
      }
    }

    // 2. Quick Filter
    if (quickFilter !== 'all') {
      const st = String(p.status || '').toUpperCase();
      const pr = String(p.priority || '').toUpperCase();
      if (quickFilter === 'in_progress' && !(st.includes('PROGRESS') || st === 'WIP')) return false;
      if (quickFilter === 'delivered' && !st.includes('DELIVERED')) return false;
      if (quickFilter === 'completed' && !(st.includes('COMPLETED') || st === 'DONE')) return false;
      if (quickFilter === 'in_revision' && !st.includes('REVISION')) return false;
      if (quickFilter === 'high_priority' && pr !== 'HIGH' && pr !== 'URGENT') return false;
    }

    // 3. Month Wise Filter
    if (monthFilter && monthFilter !== 'All Months' && monthFilter.trim()) {
      const dateStr = p.createdAt || p.startDate || p.deadlineDate || p.deliveryDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const mStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (mStr.toLowerCase() !== monthFilter.toLowerCase().trim()) return false;
    }

    // 4. Deadline DatePicker Filter
    if (deadlineFilter && deadlineFilter !== 'All Deadlines' && deadlineFilter.trim()) {
      const dStr = p.deadlineDate || p.deliveryDate;
      if (!dStr) return false;
      const targetDate = deadlineFilter.split('T')[0];
      const projectDate = dStr.split('T')[0];
      if (projectDate !== targetDate) return false;
    }

    // 5. Sales Handler Filter
    if (salesHandlerFilter && salesHandlerFilter !== 'All Sales Handlers' && salesHandlerFilter.trim()) {
      const sName = String(p.salesHandler?.name || p.salesPerson || p.sales_person_name || '').toLowerCase();
      const target = salesHandlerFilter.toLowerCase().trim();
      if (!sName.includes(target) && !target.includes(sName)) return false;
    }

    // 6. Client Filter
    if (clientFilter && clientFilter !== 'All Clients' && clientFilter.trim()) {
      const cName = String(p.clientName || '').toLowerCase();
      const cUser = String(p.clientUsername || '').toLowerCase();
      const target = clientFilter.toLowerCase().trim();
      if (!cName.includes(target) && !cUser.includes(target) && !target.includes(cName)) return false;
    }

    // 7. Profile Filter
    if (profileFilter && profileFilter !== 'All Profiles' && profileFilter.trim()) {
      const prof = String(p.fiverrProfile || '').toUpperCase();
      const target = profileFilter.toUpperCase().trim();
      if (!prof.includes(target) && !target.includes(prof)) return false;
    }

    // 8. Status Filter Dropdown
    if (statusFilter && statusFilter !== 'All Statuses' && statusFilter.trim()) {
      const st = String(p.status || '').toUpperCase();
      const target = statusFilter.toUpperCase().trim();
      if (target === 'IN PROGRESS' && !(st.includes('PROGRESS') || st === 'WIP')) return false;
      if (target === 'WIP' && !(st.includes('PROGRESS') || st === 'WIP')) return false;
      if (target === 'DELIVERED' && !st.includes('DELIVERED')) return false;
      if (target === 'COMPLETED' && !st.includes('COMPLETED')) return false;
      if (target === 'IN REVISION' && !st.includes('REVISION')) return false;
      if (target === 'ON HOLD' && !st.includes('HOLD')) return false;
      if (target === 'CANCELED' || target === 'CANCELLED') {
        if (!st.includes('CANCEL')) return false;
      } else if (st !== target && !st.includes(target)) {
        return false;
      }
    }

    // 9. Due Days Filter
    if (dueDaysFilter && dueDaysFilter !== 'All Due Days' && dueDaysFilter.trim()) {
      const dStr = p.deadlineDate || p.deliveryDate;
      if (!dStr) return false;
      const deadline = new Date(dStr + (dStr.includes('T') ? '' : 'T00:00:00'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (dueDaysFilter === 'Overdue') {
        if (diffDays >= 0 || ['COMPLETED', 'DELIVERED'].includes(String(p.status).toUpperCase())) return false;
      } else if (dueDaysFilter === 'Due Today') {
        if (diffDays !== 0) return false;
      } else if (dueDaysFilter === '1-3 Days') {
        if (diffDays < 1 || diffDays > 3) return false;
      } else if (dueDaysFilter === '4-7 Days') {
        if (diffDays < 4 || diffDays > 7) return false;
      } else if (dueDaysFilter === '8-14 Days') {
        if (diffDays < 8 || diffDays > 14) return false;
      } else if (dueDaysFilter === '15+ Days') {
        if (diffDays < 15) return false;
      }
    }

    // 10. Category Filter
    if (categoryFilter && categoryFilter !== 'All Categories' && categoryFilter.trim()) {
      const cat = String(p.category || '').toUpperCase();
      const target = categoryFilter.toUpperCase().trim();
      if (!cat.includes(target) && !target.includes(cat)) return false;
    }

    // 11. Team Member Filter
    if (teamMemberFilter && teamMemberFilter !== 'All Team Members' && teamMemberFilter.trim()) {
      const pmName = String(p.opsHandler?.name || p.projectManager || p.teamMember || '').toLowerCase();
      const target = teamMemberFilter.toLowerCase().trim();
      if (!pmName.includes(target) && !target.includes(pmName)) return false;
    }

    return true;
  });


  // Multi-select helpers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProjects.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Quick stats counts
  const totalCount = projects.length;
  const inProgressCount = projects.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return s.includes('PROGRESS') || s === 'WIP';
  }).length;
  const deliveredCount = projects.filter((p) => String(p.status || '').toUpperCase().includes('DELIVERED')).length;
  const completedCount = projects.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return s.includes('COMPLETED') || s === 'DONE';
  }).length;
  const revisionCount = projects.filter((p) => String(p.status || '').toUpperCase().includes('REVISION')).length;
  const highPriorityCount = projects.filter((p) => ['HIGH', 'URGENT'].includes(String(p.priority || '').toUpperCase())).length;

  // Dynamic filter options derived from current projects and team data
  const clientOptions = [
    'All Clients',
    ...Array.from(
      new Set(
        [
          ...projects.map((p) => p.clientName || p.clientUsername).filter(Boolean),
          ...clientsList.map((c) => c.name || c.username).filter(Boolean)
        ]
      )
    )
  ];

  const salesHandlerOptions = [
    'All Sales Handlers',
    ...Array.from(
      new Set(
        [
          ...projects.map((p) => p.salesHandler?.name || p.salesPerson || p.sales_person_name).filter(Boolean),
          ...teamUsers.filter(u => String(u.department || u.role || '').toUpperCase().includes('SALES')).map(u => u.full_name || u.name).filter(Boolean),
          'MD Motiur Rahman Emon',
          'Sakhawat Hossain Sohan',
          'Super Admin'
        ]
      )
    )
  ];

  const teamMemberOptions = [
    'All Team Members',
    ...Array.from(
      new Set(
        [
          ...projects.map((p) => p.opsHandler?.name || p.projectManager).filter(Boolean),
          ...teamUsers.map(u => u.full_name || u.name).filter(Boolean),
          'Priya Sharma',
          'David Kim',
          'Sarah Jenkins',
          'Super Admin'
        ]
      )
    )
  ];

  const monthOptions = [
    'All Months',
    'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026',
    'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'
  ];

  const deadlineOptions = [
    'All Deadlines',
    'Overdue',
    'Due Today',
    'Due Tomorrow',
    'This Week',
    'This Month',
    'Next Month'
  ];

  const dueDaysOptions = [
    'All Due Days',
    'Overdue',
    'Due Today',
    '1-3 Days',
    '4-7 Days',
    '8-14 Days',
    '15+ Days'
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-full">
      <AnimatePresence mode="wait">
        {viewingProject ? (
          <ProjectDetailsView
            key={`project-details-${viewingProject.id}`}
            project={viewingProject}
            user={user}
            sellerProfiles={sellerProfiles}
            teamUsers={teamUsers}
            onBack={() => setViewingProject(null)}
            onSave={handleSaveProjectFromDetails}
            onDelete={(projToDelete) => {
              setViewingProject(null);
              setDeleteConfirmProject(projToDelete);
            }}
            onShowToast={onShowToast}
            onUpdateStatus={(id, newStatus) => {
              handleUpdateProjectStatus(id, newStatus);
              if (viewingProject && viewingProject.id === id) {
                setViewingProject((prev) => ({ ...prev, status: newStatus }));
              }
            }}
          />
        ) : (
          <motion.div
            key="projects-table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="prj-view-container"
          >
            {/* ── 1. UNIFIED TOOLBAR & CONTROLS ── */}
            <div className="prj-toolbar-card">
              <div className="prj-toolbar-top-row">
                {/* Left: Search Box + 9 Filter Dropdowns + Reset */}
                <div className="prj-toolbar-left-group">
                  {/* Search */}
                  <div className="prj-search-box">
                    <Search size={13} className="prj-search-icon" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="prj-search-input"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="prj-search-clear">
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* 1. Month Wise Filter */}
                  <div className="prj-filter-item" style={{ width: '125px' }}>
                    <CustomSelect
                      value={monthFilter}
                      onChange={setMonthFilter}
                      options={monthOptions}
                      placeholder="Month Wise"
                    />
                  </div>

                  {/* 2. Deadline DatePicker Filter */}
                  <div className="prj-filter-item" style={{ width: '112px' }}>
                    <CustomDatePicker
                      value={deadlineFilter}
                      onChange={(val) => setDeadlineFilter(val)}
                      placeholder="Deadline"
                    />
                  </div>

                  {/* 3. Sales Handler Filter */}
                  <div className="prj-filter-item" style={{ width: '150px' }}>
                    <CustomSelect
                      value={salesHandlerFilter}
                      onChange={setSalesHandlerFilter}
                      options={salesHandlerOptions}
                      placeholder="Sales Handler"
                    />
                  </div>

                  {/* 4. Client Filter */}
                  <div className="prj-filter-item" style={{ width: '135px' }}>
                    <CustomSelect
                      value={clientFilter}
                      onChange={setClientFilter}
                      options={clientOptions}
                      placeholder="Client"
                    />
                  </div>

                  {/* 5. Profile Filter */}
                  <div className="prj-filter-item" style={{ width: '135px' }}>
                    <CustomSelect
                      value={profileFilter}
                      onChange={setProfileFilter}
                      options={[
                        'All Profiles',
                        ...sellerProfiles.map((p) => (typeof p === 'object' ? p.name || p.username : p)),
                        'KODEVIO',
                        'APP_CIVIC',
                        'APP_FORTUNE',
                        'CLICK_TOWN'
                      ]}
                      placeholder="All Profiles"
                    />
                  </div>

                  {/* 6. Status Filter */}
                  <div className="prj-filter-item" style={{ width: '130px' }}>
                    <CustomSelect
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={['All Statuses', ...PROJECT_STATUS_OPTIONS]}
                      placeholder="All Statuses"
                    />
                  </div>

                  {/* 7. Due Days Filter */}
                  <div className="prj-filter-item" style={{ width: '125px' }}>
                    <CustomSelect
                      value={dueDaysFilter}
                      onChange={setDueDaysFilter}
                      options={dueDaysOptions}
                      placeholder="Due Days"
                    />
                  </div>

                  {/* 8. Category Filter */}
                  <div className="prj-filter-item" style={{ width: '145px' }}>
                    <CustomSelect
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      options={['All Categories', ...PROJECT_CATEGORY_OPTIONS]}
                      placeholder="All Categories"
                    />
                  </div>

                  {/* 9. Team Member Filter */}
                  <div className="prj-filter-item" style={{ width: '145px' }}>
                    <CustomSelect
                      value={teamMemberFilter}
                      onChange={setTeamMemberFilter}
                      options={teamMemberOptions}
                      placeholder="Team Member"
                    />
                  </div>
                </div>

              {/* Right: Action Buttons & View Switcher */}
          <div className="prj-toolbar-right-group">
            {/* View Mode Toggle */}
            <div className="prj-view-switcher">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`prj-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Switch to Table View"
              >
                <List size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`prj-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                title="Switch to Drag & Drop Kanban Sprint Board"
              >
                <FolderKanban size={13} />
                <span>Kanban Board</span>
              </button>
            </div>

            {/* Actions (Export CSV) */}
            <div className="prj-actions-row">
              <button
                type="button"
                onClick={handleExportCSV}
                className="prj-btn-secondary"
                title="Export filtered projects to CSV"
              >
                <Download size={12} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. MULTI-SELECTION FLOATING PILL BAR (Exact Reference Match) ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="cli-floating-selection-bar"
            style={{ left: '50%' }}
          >
            <span className="font-bold whitespace-nowrap flex-shrink-0">Selected: {selectedIds.length}</span>
            <span className="text-slate-600 flex-shrink-0">|</span>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="cli-floating-item-btn text-red-400 hover:text-red-300"
              title="Delete selected projects"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="cli-floating-discard-btn"
              title="Discard selection"
            >
              Discard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. MAIN CONTENT AREA: TABLE VIEW OR DRAG-AND-DROP KANBAN SPRINT BOARD ── */}
      {loading ? (
        <div className="prj-loading-box">
          <RefreshCw size={24} className="animate-spin text-emerald-600 mb-2" />
          <span className="text-sm font-semibold text-slate-600">Loading projects database...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ── INTERACTIVE DRAG-AND-DROP KANBAN SPRINT BOARD ── */
        <div className="prj-kanban-container">
          <div className="prj-kanban-board">
            {KANBAN_COLUMNS.map((col) => {
              const colProjects = filteredProjects.filter((p) =>
                col.statuses.includes(p.status?.toUpperCase())
              );
              const isOver = dragOverColumnId === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col)}
                  className={`prj-kanban-column ${isOver ? 'is-drag-over' : ''}`}
                >
                  {/* Column Header */}
                  <div className="prj-kanban-col-header" style={{ borderTopColor: col.color }}>
                    <div className="flex items-center gap-2">
                      <span className="prj-kanban-col-dot" style={{ background: col.color }} />
                      <h4 className="prj-kanban-col-title">{col.title}</h4>
                    </div>
                    <span
                      className="prj-kanban-col-count"
                      style={{ background: col.badgeBg, color: col.badgeColor }}
                    >
                      {colProjects.length}
                    </span>
                  </div>

                  {/* Column Drop Zone / Card List */}
                  <div className="prj-kanban-cards-list">
                    {colProjects.length === 0 ? (
                      <div className="prj-kanban-empty-zone">
                        <span>Drop projects here</span>
                      </div>
                    ) : (
                      colProjects.map((p) => {
                        const rawClient = p.client || {};
                        const clientName = typeof rawClient === 'object' ? rawClient.name || rawClient.username || p.clientName || 'Direct Client' : rawClient || p.clientName || 'Direct Client';
                        const clientUsername = typeof rawClient === 'object' ? rawClient.username || rawClient.fiverr_username || '' : '';
                        const clientCountry = typeof rawClient === 'object' ? rawClient.country || 'USA' : 'USA';
                        const countryCode = getCountryCode(clientCountry);
                        const assignedDevs = getAssignedDevelopers(p);
                        const devProgress = calculateDeveloperProgress(p);

                        // Urgency chip
                        let urgencyLabel = 'On Track';
                        let urgencyClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        if (p.delivery_date) {
                          const diffDays = Math.ceil((new Date(p.delivery_date) - new Date()) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            urgencyLabel = `${Math.abs(diffDays)}d Overdue`;
                            urgencyClass = 'text-red-700 bg-red-50 border-red-200 font-extrabold';
                          } else if (diffDays === 0) {
                            urgencyLabel = 'Due Today';
                            urgencyClass = 'text-amber-700 bg-amber-50 border-amber-200 font-extrabold';
                          } else if (diffDays <= 3) {
                            urgencyLabel = `${diffDays}d left`;
                            urgencyClass = 'text-amber-700 bg-amber-50 border-amber-200';
                          }
                        }

                        const isDragging = draggedProjectId === p.id;

                        return (
                          <motion.div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            layoutId={`prj-card-${p.id}`}
                            className={`prj-kanban-card ${isDragging ? 'is-dragging' : ''}`}
                            onClick={() => setViewingProject(p)}
                          >
                            {/* Card Top Row: Order Code & Priority */}
                            <div className="prj-card-top-row">
                              <span className="prj-card-code">
                                {p.order_number || p.projectCode || `PRJ-${p.id}`}
                              </span>
                              <span className={`prj-priority-pill ${getPriorityBadgeClass(p.priority)}`}>
                                {p.priority || 'MEDIUM'}
                              </span>
                            </div>

                            {/* Card Title */}
                            <h5 className="prj-card-title" title={p.title || 'Untitled Project'}>
                              {p.title || 'Untitled Project'}
                            </h5>

                            {/* Client & Platform Info */}
                            <div className="prj-card-client-row">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {countryCode && (
                                  <img
                                    src={`https://flagcdn.com/16x12/${countryCode}.png`}
                                    alt={clientCountry}
                                    className="prj-country-flag flex-shrink-0"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                )}
                                <span className="prj-card-client-name truncate">{clientName}</span>
                                {clientUsername && (
                                  <span className="text-[10px] text-slate-400 font-mono truncate">@{clientUsername}</span>
                                )}
                              </div>
                              <span className="prj-card-budget">
                                ${p.budget || p.amount || 0}
                              </span>
                            </div>

                            {/* Progress & Task Ratio */}
                            <div className="prj-card-progress-wrap">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                                <span>Tasks & QA</span>
                                <span className="text-slate-800">{devProgress.percentage}%</span>
                              </div>
                              <div className="prj-card-progress-bar">
                                <div
                                  className="prj-card-progress-fill"
                                  style={{
                                    width: `${devProgress.percentage}%`,
                                    background: devProgress.percentage === 100 ? '#10B981' : '#3B82F6',
                                  }}
                                />
                              </div>
                            </div>

                            {/* Card Footer: Dev Avatars & Due Date */}
                            <div className="prj-card-footer">
                              {/* Assigned Developers Avatar Stack */}
                              <div className="prj-card-devs-stack">
                                {assignedDevs.slice(0, 3).map((dev, i) => (
                                  <div
                                    key={i}
                                    className="prj-card-dev-avatar"
                                    style={{ background: dev.color }}
                                    title={`${dev.name} (${dev.designation || 'Developer'})`}
                                  >
                                    {dev.initials}
                                  </div>
                                ))}
                                {assignedDevs.length > 3 && (
                                  <div className="prj-card-dev-avatar prj-card-dev-more">
                                    +{assignedDevs.length - 3}
                                  </div>
                                )}
                              </div>

                              {/* Due Date & Shortcuts */}
                              <div className="flex items-center gap-1.5">
                                {p.githubUrl && (
                                  <a
                                    href={p.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="prj-card-quick-link"
                                    title="Open GitHub Repository"
                                  >
                                    <Github size={11} />
                                  </a>
                                )}
                                {p.figmaUrl && (
                                  <a
                                    href={p.figmaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="prj-card-quick-link"
                                    title="Open Figma File"
                                  >
                                    <Figma size={11} className="text-purple-600" />
                                  </a>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${urgencyClass}`}>
                                  {urgencyLabel}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="prj-table-card">
          <div className="prj-table-wrapper">
            <table className="prj-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="prj-checkbox-btn"
                      title={selectedIds.length === filteredProjects.length && filteredProjects.length > 0 ? 'Deselect all' : 'Select all'}
                    >
                      {selectedIds.length === filteredProjects.length && filteredProjects.length > 0 ? (
                        <CheckSquare size={13} className="text-orange-600" />
                      ) : (
                        <Square size={13} className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th style={{ width: '130px' }}>PROJECT</th>
                  <th style={{ minWidth: '180px' }}>TITLE &amp; CATEGORY</th>
                  <th style={{ width: '160px' }}>CLIENT IDENTITY</th>
                  <th style={{ width: '135px' }}>FIVERR PROFILE</th>
                  <th style={{ width: '140px' }}>SALES HANDLER</th>
                  <th style={{ width: '120px' }}>ASSIGNED DEVS</th>
                  <th style={{ width: '110px' }}>DEV PROGRESS</th>
                  <th style={{ width: '100px' }}>DEADLINE</th>
                  <th style={{ width: '120px' }}>STATUS</th>
                  <th style={{ width: '90px' }}>PRIORITY</th>
                  <th style={{ width: '70px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="prj-empty-table-cell">
                      <div className="prj-empty-inner">
                        <FolderKanban size={34} className="prj-empty-icon" />
                        <h3 className="prj-empty-title">No projects found</h3>
                        <p className="prj-empty-desc">
                          {searchQuery || monthFilter !== 'All Months' || deadlineFilter || salesHandlerFilter !== 'All Sales Handlers' || clientFilter !== 'All Clients' || profileFilter !== 'All Profiles' || statusFilter !== 'All Statuses' || dueDaysFilter !== 'All Due Days' || categoryFilter !== 'All Categories' || teamMemberFilter !== 'All Team Members'
                            ? 'No projects matched your active search filters. Try resetting filters.'
                            : 'There are no active projects in your workspace. Click "+ Add Project" to create one.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const deadlineInfo = getDaysRemainingInfo(p.deadlineDate || p.deliveryDate || p.delivery_date, p.status);
                    const DeadlineIcon = deadlineInfo.icon;
                    const totalAmt = Number(p.budget || p.totalAmount || p.amount) || 0;
                    const earnedAmt = Number(p.deliveryAmount || p.earnedAmount) || 0;
                    const rawTitle = String(p.title || '').trim();
                    const excerptTitle = rawTitle.length > 20 ? `${rawTitle.slice(0, 20)}...` : (rawTitle || '---');

                    return (
                    <tr
                      key={p.id}
                      className={`prj-table-row ${isSelected ? 'selected' : ''}`}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(p.id)}
                          className="prj-checkbox-btn"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-emerald-600" />
                          ) : (
                            <Square size={16} className="text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="prj-cat-tag">
                          {p.category || 'Web App'}
                        </span>
                      </td>

                      {/* Service Line */}
                      <td>
                        <span className="prj-service-tag whitespace-nowrap">
                          {p.serviceLine || p.service_line || p.service || 'Full Stack'}
                        </span>
                      </td>

                      {/* Project Title (Excerpt: 8 chars + 3dot) */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingProject(p)}
                          className="prj-title-link text-left font-bold text-[11px] text-slate-900 hover:text-emerald-600 transition-colors whitespace-nowrap"
                          title={p.title}
                        >
                          {excerptTitle}
                        </button>
                      </td>

                      {/* Milestone */}
                      <td>
                        <span className="prj-milestone-pill whitespace-nowrap">
                          {p.milestone || 'Single Milestone'}
                        </span>
                      </td>

                      {/* Client (Name only) */}
                      <td>
                        <span className="prj-client-name">
                          {p.clientName || 'Direct Client'}
                        </span>
                      </td>

                      {/* Profile */}
                      <td>
                        <span className="prj-profile-pill whitespace-nowrap">
                          {p.fiverrProfile || 'Kodevio Studio'}
                        </span>
                      </td>

                      {/* Timeline (Compact Date Range) */}
                      <td>
                        <div
                          className="prj-timeline-chip"
                          title={p.startDate && (p.deadlineDate || p.deliveryDate) ? `${p.startDate} → ${p.deadlineDate || p.deliveryDate}` : ''}
                        >
                          <Calendar size={10} className="text-slate-400 shrink-0" />
                          <span>{formatCompactTimeline(p.startDate, p.deadlineDate || p.deliveryDate)}</span>
                        </div>
                      </td>

                      {/* Turnaround (Countdown badge) */}
                      <td>
                        <span className={`prj-deadline-pill ${deadlineInfo.class} whitespace-nowrap`}>
                          <DeadlineIcon size={10} />
                          <span>{deadlineInfo.text}</span>
                        </span>
                      </td>

                      {/* Financials */}
                      <td>
                        <div className="prj-financial-box">
                          <span className="prj-financial-earned">
                            ${earnedAmt.toLocaleString()}
                          </span>
                          <span className="prj-financial-total">
                            /${totalAmt.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Team Handlers */}
                      <td>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {/* Unified Avatar Stack */}
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {p.salesHandler && (
                              <span
                                className="prj-handler-dot"
                                style={{ backgroundColor: p.salesHandler.color || '#A855F7', zIndex: 4 }}
                                title={`Sales: ${p.salesHandler.name || p.salesPerson || 'Sales Lead'}`}
                              >
                                {p.salesHandler.initials || 'SA'}
                              </span>
                            )}
                            {p.opsHandler && (
                              <span
                                className="prj-handler-dot"
                                style={{ backgroundColor: p.opsHandler.color || '#10B981', zIndex: 3 }}
                                title={`PM: ${p.opsHandler.name || p.projectManager || 'Project Manager'}`}
                              >
                                {p.opsHandler.initials || 'PM'}
                              </span>
                            )}
                            {Array.isArray(p.devAssignees) && p.devAssignees.slice(0, 2).map((dev, idx) => (
                              <span
                                key={idx}
                                className="prj-handler-dot"
                                style={{ backgroundColor: dev.color || '#3B82F6', zIndex: 2 - idx }}
                                title={`Dev: ${dev.name || 'Developer'}`}
                              >
                                {dev.initials || 'D'}
                              </span>
                            ))}
                            {Array.isArray(p.devAssignees) && p.devAssignees.length > 2 && (
                              <span
                                className="prj-handler-dot bg-slate-200 text-slate-700 text-[6px]"
                                style={{ zIndex: 0 }}
                                title={`${p.devAssignees.length - 2} more devs`}
                              >
                                +{p.devAssignees.length - 2}
                              </span>
                            )}
                          </div>
                          <span className="prj-handler-name" title={p.opsHandler?.name || p.projectManager || p.salesHandler?.name || 'Assigned'}>
                            {p.opsHandler?.name || p.projectManager || p.salesHandler?.name || 'Assigned'}
                          </span>
                        </div>
                      </td>

                      {/* Status with Inline Changer */}
                      <td>
                        <div className="prj-status-select-wrap">
                          <select
                            value={p.status || 'IN PROGRESS'}
                            onChange={(e) => handleQuickStatusChange(p.id, e.target.value)}
                            className={`prj-status-select ${getStatusBadgeClass(p.status)}`}
                          >
                            {PROJECT_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-800 font-semibold">
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span className={`prj-priority-pill ${getPriorityBadgeClass(p.priority)}`}>
                          {p.priority || 'MEDIUM'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProject(p)}
                            className="prj-row-action-btn"
                            title="View & Edit Project Specifications"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmProject(p)}
                            className="prj-row-action-btn prj-delete-btn"
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 8. DELETE CONFIRMATION POPUP MODAL (Exact match with Clients Panel) ── */}
      <AnimatePresence>
        {deleteConfirmProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmProject(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              {/* Header */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div
                    className="cli-modal-icon-badge"
                    style={{
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      border: '1px solid #FECACA',
                      color: '#DC2626'
                    }}
                  >
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete Project?</h3>
                    <p className="cli-modal-sub-text">
                      {deleteConfirmProject.title} &mdash; this cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProject(null)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Warning Body */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  You are about to permanently delete <strong style={{ color: '#991B1B' }}>{deleteConfirmProject.title}</strong> ({deleteConfirmProject.projectCode || deleteConfirmProject.id}). All associated milestones, financials, and tasks will be removed.
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProject(null)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeleteProject(deleteConfirmProject.id);
                    setDeleteConfirmProject(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBulkDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              {/* Header */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div
                    className="cli-modal-icon-badge"
                    style={{
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      border: '1px solid #FECACA',
                      color: '#DC2626'
                    }}
                  >
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete {selectedIds.length} Projects?</h3>
                    <p className="cli-modal-sub-text">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Warning Body */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  You are about to permanently delete <strong style={{ color: '#991B1B' }}>{selectedIds.length} selected project{selectedIds.length === 1 ? '' : 's'}</strong>. All milestones and tracking details will be removed.
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleBulkDelete();
                    setShowBulkDeleteConfirm(false);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete {selectedIds.length} Projects</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
