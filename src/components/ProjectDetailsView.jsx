import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import JoditEditor from 'jodit-react';
import 'jodit/es2015/jodit.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FolderPlus,
  DollarSign,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Globe,
  Tag,
  FileText,
  CheckCircle2,
  CheckCircle,
  ExternalLink,
  Layers,
  Sparkles,
  RotateCcw,
  Code,
  Link as LinkIcon,
  Save,
  Send,
  Briefcase,
  Trash2,
  Edit2,
  Figma,
  Github,
  AlertCircle,
  Check,
  Copy,
  Plus,
  ChevronRight,
  X,
  Zap,
  UserCheck,
  RefreshCw,
  RotateCw,
  SlidersHorizontal,
  Activity,
  XCircle,
  MessageSquare,
  ListTodo,
  Users,
  AlertTriangle,
  Lock,
  Unlock,
  CheckSquare,
  Paperclip,
  Share2,
  Shield,
  Award,
  Mail,
  Search,
  Filter,
  History,
  Bug,
  LifeBuoy,
  ArrowRight,
  Info
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import { projectsApi } from '../api/client';

/* ─── Jodit Rich Text Editor wrapper (memoized to prevent re-mount) ─── */
const JoditScopeEditor = React.memo(({ value, onChange }) => {
  const editor = useRef(null);

  const config = useMemo(() => ({
    readonly: false,
    height: 420,
    toolbarAdaptive: false,
    toolbarSticky: true,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    placeholder: 'Enter detailed client requirements, wireframe links, technical stack, API integrations, and milestone deliverables...',
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', '|',
      'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    style: {
      font: '13px/1.6 Inter, -apple-system, sans-serif',
      background: '#FFFFFF',
    },
  }), []);

  const handleBlur = useCallback((newContent) => {
    onChange(newContent);
  }, [onChange]);

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        tabIndex={1}
        onBlur={handleBlur}
      />
    </div>
  );
});
JoditScopeEditor.displayName = 'JoditScopeEditor';

export const PROJECT_PIPELINE_STEPS = [
  { key: 'NRA', label: 'NRA', stepNumber: '01', subtitle: 'Requirements', description: 'New Requirement Ingestion & Scope Analysis' },
  { key: 'ISSUE', label: 'ISSUE', stepNumber: '02', subtitle: 'Blocker / Issue', description: 'Technical Blockers & Clarifications' },
  { key: 'WIP', label: 'WIP', stepNumber: '03', subtitle: 'In Progress', description: 'Active Development & Execution' },
  { key: 'REVISION', label: 'REVISION', stepNumber: '04', subtitle: 'Client Feedback', description: 'Iteration & Scope Revisions' },
  { key: 'CANCELED', label: 'CANCELED', stepNumber: '05', subtitle: 'On Hold / Drop', description: 'Suspended or Canceled Project' },
  { key: 'DELIVERED', label: 'DELIVERED', stepNumber: '06', subtitle: 'Delivered', description: 'Sent to Client for Approval' },
  { key: 'COMPLETED', label: 'COMPLETED', stepNumber: '07', subtitle: 'Completed', description: 'Order Accepted & Finished' }
];

export const PROJECT_STATUS_OPTIONS = [
  'NRA', 'ISSUE', 'WIP', 'IN PROGRESS', 'REVISION', 'IN REVISION', 'CANCELED', 'DELIVERED', 'COMPLETED', 'ON HOLD'
];

export const PROJECT_PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export const PROJECT_CATEGORY_OPTIONS = [
  'Web Development', 'Mobile App', 'Design', 'Marketing', 'SEO', 'CMS', 'Tips',
  'B2B - BD', 'B2B - Global', 'B2G - BD', 'B2G - Global', 'Other'
];

export const PROJECT_SERVICE_LINE_OPTIONS = [
  'UI/UX', 'Frontend', 'Backend', 'Deployment', 'UI/UX & Frontend', 'UI/UX & Backend',
  'UI/UX & Deployment', 'Frontend & Backend', 'Frontend & Deployment', 'Backend & Deployment',
  'UI/UX & Frontend & Backend', 'UI/UX & Frontend & Deployment', 'UI/UX & Backend & Deployment',
  'Frontend & Backend & Deployment', 'UI/UX & Frontend & Backend & Deployment', 'Wix', 'Shopify',
  'Webflow', 'WordPress', 'SquareSpace', 'Other'
];

export const PROJECT_MILESTONE_OPTIONS = [
  'Single Milestone', 'Milestone 1/3 (Design & Wireframe)', 'Milestone 2/3 (Core Development)',
  'Milestone 3/3 (Final Delivery)', 'Phase 1 — Discovery & Setup', 'Phase 2 — Implementation',
  'Phase 3 — QA & Deployment', 'Ongoing Maintenance'
];

export default function ProjectDetailsView({
  project,
  user,
  sellerProfiles = [],
  teamUsers = [],
  onBack,
  onSave,
  onDelete,
  onShowToast,
  onUpdateStatus
}) {
  // 7 Tabs: overview, description, tasks, team, discussion, activity, issues
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({ ...project });
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Sub-modules state (Tasks, Discussions, Activities, Issues)
  const [tasks, setTasks] = useState(() => {
    if (project?.tasks && Array.isArray(project.tasks) && project.tasks.length > 0) {
      return project.tasks;
    }
    return [
      { id: 'tsk-1', title: 'Setup UI component architecture & tokens', assignee: 'Mir Tawfiq', status: 'Done', priority: 'HIGH', dueDate: '2026-08-18' },
      { id: 'tsk-2', title: 'Implement Responsive Leaderboard Grid Tables', assignee: 'Mir Tawfiq', status: 'Done', priority: 'HIGH', dueDate: '2026-08-20' },
      { id: 'tsk-3', title: 'Integrate live API endpoints & DB sync', assignee: 'Sakhawat Hossain', status: 'In Progress', priority: 'URGENT', dueDate: '2026-08-22' },
      { id: 'tsk-4', title: 'QA testing & Cross-Browser Validation', assignee: 'Muntasir Ashif', status: 'Todo', priority: 'MEDIUM', dueDate: '2026-08-25' }
    ];
  });

  const [discussions, setDiscussions] = useState(() => {
    if (project?.discussions && Array.isArray(project.discussions) && project.discussions.length > 0) {
      return project.discussions;
    }
    return [
      {
        id: 'msg-1',
        senderName: project?.salesHandler?.name || 'Shuvo (Sales Lead)',
        senderRole: 'Sales Lead',
        senderAvatar: 'S',
        message: 'Client requested high emphasis on dark background contrast for table rows. Requirements are locked in Scope tab.',
        timestamp: 'Aug 16, 2:30 PM'
      },
      {
        id: 'msg-2',
        senderName: project?.opsHandler?.name || 'Shams (Operations Manager)',
        senderRole: 'Manager',
        senderAvatar: 'M',
        message: 'Dev team is assigned. Let us aim to wrap up core frontend by tomorrow so we can run QA before final delivery.',
        timestamp: 'Aug 16, 4:15 PM'
      },
      {
        id: 'msg-3',
        senderName: 'Mir Tawfiq',
        senderRole: 'Developer',
        senderAvatar: 'T',
        message: 'Components are completed and aligned. Running backend integration now.',
        timestamp: 'Aug 17, 10:45 AM'
      }
    ];
  });

  const [newMessageText, setNewMessageText] = useState('');

  const [activities, setActivities] = useState(() => {
    if (project?.activities && Array.isArray(project.activities) && project.activities.length > 0) {
      return project.activities;
    }
    return [
      { id: 'act-1', user: 'Super Admin', role: 'Superadmin', action: 'Created Project', detail: 'Initialized project with code APP - C34C and $250 budget', timestamp: 'Aug 15, 2026, 11:00 AM' },
      { id: 'act-2', user: 'Shams', role: 'Operations Manager', action: 'Assigned Team', detail: 'Assigned Mir Tawfiq as Frontend Lead and Sakhawat as Reviewer', timestamp: 'Aug 15, 2026, 02:30 PM' },
      { id: 'act-3', user: 'Shuvo', role: 'Sales Lead', action: 'Updated Scope', detail: 'Attached Figma Wireframes and Client Brief Specifications', timestamp: 'Aug 16, 2026, 10:15 AM' },
      { id: 'act-4', user: 'Mir Tawfiq', role: 'Developer', action: 'Task Completed', detail: 'Marked "Setup UI component architecture & tokens" as Done', timestamp: 'Aug 17, 2026, 09:30 AM' }
    ];
  });

  const [issues, setIssues] = useState(() => {
    if (project?.issues && Array.isArray(project.issues)) {
      return project.issues;
    }
    return [];
  });

  // Automated QA & Production Gate Checklist State
  const [qaItems, setQaItems] = useState(() => {
    if (project?.qaChecklist && Array.isArray(project.qaChecklist)) {
      return project.qaChecklist;
    }
    return [
      { id: 'qa_cross_browser', label: 'Cross-Browser Compatibility', description: 'Tested & rendering verified on Chrome, Safari, Firefox & Edge', checked: true },
      { id: 'qa_responsive', label: 'Mobile & Tablet Responsiveness', description: 'Verified layout on iOS Safari, Android Chrome & 1024px tablet screens', checked: true },
      { id: 'qa_performance', label: 'PageSpeed & Performance Score', description: 'Assets compressed, code minified, and verified fast load speed (>90 score)', checked: false },
      { id: 'qa_forms_api', label: 'Form Validations & Error Handling', description: 'All submit buttons, validation errors & API status codes verified', checked: false },
      { id: 'qa_seo_meta', label: 'SEO Meta Tags & Social Share Previews', description: 'Title, OpenGraph cards, description & favicon configured properly', checked: false },
      { id: 'qa_backup', label: 'Git Push & Asset Archive Backup', description: 'Source code committed to repository and client deliverables backed up to Drive', checked: false },
    ];
  });

  const handleToggleQaItem = (itemId) => {
    setQaItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
      setFormData((curr) => ({ ...curr, qaChecklist: next }));
      return next;
    });
    if (onShowToast) onShowToast('QA checklist updated');
  };

  const qaCompletedCount = useMemo(() => {
    return qaItems.filter((item) => item.checked).length;
  }, [qaItems]);

  // Modal states
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [assignMemberDept, setAssignMemberDept] = useState('Software Engineering');
  const [assignOpsManager, setAssignOpsManager] = useState('');
  const [assignMemberName, setAssignMemberName] = useState('Mir Tawfiq');
  const [assignMemberRole, setAssignMemberRole] = useState('Frontend & UI Developer');
  const [assignMemberEmail, setAssignMemberEmail] = useState('mir.tawfiq@kodevio.com');
  const [assignMemberStatus, setAssignMemberStatus] = useState('Active Execution');
  const [assignMemberNotes, setAssignMemberNotes] = useState('');
  const [assignMemberColor, setAssignMemberColor] = useState('#3B82F6');

  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState('HIGH');
  const [newIssueAssignee, setNewIssueAssignee] = useState('Mir Tawfiq');

  // Activity audit trail state & controls
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [activitySearch, setActivitySearch] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogAction, setNewLogAction] = useState('Status Note');

  const getActivityCategory = useCallback((action = '', detail = '') => {
    const act = (action + ' ' + detail).toLowerCase();
    if (act.includes('creat') || act.includes('init')) return { cat: 'cat-created', pill: 'pdp-act-pill-created', icon: Sparkles, label: 'Creation' };
    if (act.includes('assign') || act.includes('team') || act.includes('member')) return { cat: 'cat-assigned', pill: 'pdp-act-pill-assigned', icon: UserCheck, label: 'Assignment' };
    if (act.includes('scope') || act.includes('brief') || act.includes('figma') || act.includes('spec')) return { cat: 'cat-scope', pill: 'pdp-act-pill-scope', icon: FileText, label: 'Scope & Specs' };
    if (act.includes('task') || act.includes('done') || act.includes('completed')) return { cat: 'cat-task', pill: 'pdp-act-pill-task', icon: CheckSquare, label: 'Task Completed' };
    if (act.includes('deliver')) return { cat: 'cat-delivery', pill: 'pdp-act-pill-delivery', icon: Send, label: 'Delivery' };
    if (act.includes('issue') || act.includes('ticket') || act.includes('bug')) return { cat: 'cat-issue', pill: 'pdp-act-pill-issue', icon: AlertTriangle, label: 'Issue Ticket' };
    return { cat: 'cat-default', pill: 'pdp-act-pill-default', icon: Activity, label: 'Update' };
  }, []);

  const getActorColor = useCallback((role = '') => {
    const r = role.toLowerCase();
    if (r.includes('super') || r.includes('admin')) return '#7E22CE';
    if (r.includes('manager') || r.includes('ops')) return '#059669';
    if (r.includes('sales')) return '#D97706';
    if (r.includes('dev') || r.includes('engineer')) return '#2563EB';
    return '#64748B';
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (activityFilter !== 'ALL') {
        const meta = getActivityCategory(act.action, act.detail);
        if (activityFilter === 'ASSIGNMENT' && meta.cat !== 'cat-assigned') return false;
        if (activityFilter === 'SCOPE' && meta.cat !== 'cat-scope') return false;
        if (activityFilter === 'DELIVERY' && meta.cat !== 'cat-delivery') return false;
        if (activityFilter === 'TASK' && meta.cat !== 'cat-task') return false;
      }
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const str = `${act.user} ${act.role} ${act.action} ${act.detail} ${act.timestamp}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [activities, activityFilter, activitySearch, getActivityCategory]);

  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(act => {
      let dateKey = 'RECENT AUDIT TRAIL';
      if (act.timestamp) {
        const parts = act.timestamp.split(',');
        if (parts.length > 0) {
          dateKey = parts[0].trim().toUpperCase();
        }
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(act);
    });
    return groups;
  }, [filteredActivities]);

  const handleAddActivityLog = (e) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    const newAct = {
      id: `act-${Date.now()}`,
      user: user?.full_name || 'Operations Manager',
      role: user?.role || 'Manager',
      action: newLogAction || 'Status Note',
      detail: newLogNote.trim(),
      timestamp: new Date().toLocaleString()
    };
    setActivities(prev => [newAct, ...prev]);
    setNewLogNote('');
    setIsLogModalOpen(false);
    if (onShowToast) onShowToast('✅ Activity audit note logged successfully');
  };

  // Issues filter & search controls
  const [issueFilter, setIssueFilter] = useState('ALL');
  const [issueSearch, setIssueSearch] = useState('');

  // Toggle Resolve / Reopen Issue Ticket
  const handleToggleResolveIssue = (ticketId) => {
    const updated = issues.map(t => {
      if (t.id === ticketId) {
        const nextStatus = t.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
        return { ...t, status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' ? new Date().toLocaleString() : null };
      }
      return t;
    });
    setIssues(updated);

    const target = issues.find(t => t.id === ticketId);
    if (target) {
      const isNowResolved = target.status !== 'RESOLVED';
      const newAct = {
        id: `act-${Date.now()}`,
        user: user?.full_name || 'Team Member',
        role: user?.role || 'Team',
        action: isNowResolved ? 'Resolved Issue Ticket' : 'Reopened Issue Ticket',
        detail: `${isNowResolved ? 'Marked' : 'Reopened'} #${target.id}: "${target.title}" as ${isNowResolved ? 'RESOLVED' : 'OPEN'}`,
        timestamp: new Date().toLocaleString()
      };
      setActivities(prev => [newAct, ...prev]);
      if (onShowToast) onShowToast(isNowResolved ? `✅ Issue #${target.id} marked as resolved!` : `🔄 Issue #${target.id} reopened.`);
    }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter(ticket => {
      if (issueFilter === 'OPEN' && ticket.status === 'RESOLVED') return false;
      if (issueFilter === 'RESOLVED' && ticket.status !== 'RESOLVED') return false;
      if (issueFilter === 'URGENT' && ticket.priority !== 'URGENT') return false;
      if (issueSearch.trim()) {
        const q = issueSearch.toLowerCase();
        const str = `${ticket.id} ${ticket.title} ${ticket.description} ${ticket.reportedBy} ${ticket.assignedTo} ${ticket.priority} ${ticket.status}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [issues, issueFilter, issueSearch]);

  // Check if developer marked work as completed
  const isDevCompleted = useMemo(() => {
    if (formData.isDevCompleted) return true;
    if (tasks.length === 0) return false;
    return tasks.every(t => t.status === 'Done');
  }, [formData.isDevCompleted, tasks]);

  // Check if project is delivered
  const isDelivered = useMemo(() => {
    const s = String(formData.status || '').toUpperCase();
    return s.includes('DELIVERED') || s.includes('COMPLETED') || s === 'DONE';
  }, [formData.status]);

  // Sync incoming project prop changes
  useEffect(() => {
    if (project) {
      setFormData({ ...project });
      if (project.tasks) setTasks(project.tasks);
      if (project.discussions) setDiscussions(project.discussions);
      if (project.activities) setActivities(project.activities);
      if (project.issues) setIssues(project.issues);
    }
  }, [project]);

  // Active step index resolver for visual progress tracker
  const getActivePipelineIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('NRA') || s.includes('REQUIREMENT')) return 0;
    if (s.includes('ISSUE') || s.includes('BLOCKER')) return 1;
    if (s.includes('WIP') || s.includes('PROGRESS')) return 2;
    if (s.includes('REVISION') || s.includes('REVIEW')) return 3;
    if (s.includes('CANCEL') || s.includes('HOLD')) return 4;
    if (s.includes('DELIVERED') || s.includes('DISPATCH')) return 5;
    if (s.includes('COMPLETED') || s.includes('DONE') || s.includes('ACCEPTED')) return 6;
    return 2;
  };

  const currentActiveIdx = getActivePipelineIndex(formData.status);

  // Recalculate delivery amount whenever budget or fee percentage changes
  const handleBudgetChange = (newBudget) => {
    const b = parseFloat(newBudget) || 0;
    const p = parseFloat(formData.percentage) || 20;
    const net = b - b * (p / 100);
    setFormData((prev) => ({
      ...prev,
      budget: newBudget,
      deliveryAmount: net >= 0 ? net.toFixed(2) : '0.00'
    }));
  };

  const handlePercentageChange = (newPct) => {
    const b = parseFloat(formData.budget) || 0;
    const p = parseFloat(newPct) || 0;
    const net = b - b * (p / 100);
    setFormData((prev) => ({
      ...prev,
      percentage: newPct,
      deliveryAmount: net >= 0 ? net.toFixed(2) : '0.00'
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Save Project
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        tasks,
        discussions,
        activities,
        issues,
        isDevCompleted,
        updatedAt: new Date().toISOString()
      };

      if (onSave) {
        onSave(payload);
      } else {
        await projectsApi.updateProject(formData.id, payload);
      }
      if (onShowToast) onShowToast('Project details successfully saved to database!');
    } catch (err) {
      console.warn('Error saving project:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Developer Marks Work as Done
  const handleDevMarkDone = () => {
    const updatedTasks = tasks.map(t => ({ ...t, status: 'Done' }));
    setTasks(updatedTasks);
    setFormData(prev => ({ ...prev, isDevCompleted: true }));
    
    const newAct = {
      id: `act-${Date.now()}`,
      user: user?.full_name || 'Assigned Developer',
      role: 'Developer',
      action: 'Completed Dev Work',
      detail: 'All developer tasks marked as complete. Project is ready for Manager Delivery.',
      timestamp: new Date().toLocaleString()
    };
    setActivities(prev => [newAct, ...prev]);

    if (onShowToast) onShowToast('✅ Developer work marked as completed! Delivery button is now active for Manager.');
  };

  // Manager Updates Project to DELIVERED
  const handleManagerDeliverProject = async () => {
    const updatedForm = {
      ...formData,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      isDelivered: true
    };
    setFormData(updatedForm);

    const newAct = {
      id: `act-${Date.now()}`,
      user: user?.full_name || 'Operations Manager',
      role: 'Manager',
      action: 'Marked Project as DELIVERED',
      detail: 'Officially dispatched project to client for final approval. Client issue ticketing unlocked.',
      timestamp: new Date().toLocaleString()
    };
    setActivities(prev => [newAct, ...prev]);

    try {
      await projectsApi.updateProject(formData.id, {
        ...updatedForm,
        tasks,
        discussions,
        activities: [newAct, ...activities],
        issues
      });
      if (onShowToast) onShowToast('🚀 Project officially DELIVERED to client! Post-delivery ticketing is now unlocked.');
    } catch (e) {
      console.error(e);
    }
  };

  // Task Toggle
  const handleToggleTask = (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Done' ? 'In Progress' : 'Done';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);

    const target = tasks.find(t => t.id === taskId);
    if (target) {
      const newAct = {
        id: `act-${Date.now()}`,
        user: user?.full_name || 'Team Member',
        role: 'Team',
        action: 'Updated Task',
        detail: `Changed "${target.title}" status to ${target.status === 'Done' ? 'In Progress' : 'Done'}`,
        timestamp: new Date().toLocaleString()
      };
      setActivities(prev => [newAct, ...prev]);
    }
  };

  // Department options and keyword maps
  const DEPARTMENT_OPTIONS = [
    'Software Engineering',
    'UI/UX Design',
    'Sales Department',
    'Operations Management',
    'QA & Testing',
    'DevOps & Cloud',
    'Marketing & Growth'
  ];

  const deptKeywords = {
    'Software Engineering': ['developer', 'engineer', 'frontend', 'backend', 'fullstack', 'software', 'react', 'node', 'dev'],
    'UI/UX Design':         ['design', 'ui', 'ux', 'designer', 'figma', 'creative'],
    'Sales Department':     ['sales', 'business', 'bd', 'acquisition', 'lead'],
    'Operations Management':['operations', 'manager', 'project manager', 'pm', 'ops'],
    'QA & Testing':         ['qa', 'test', 'quality', 'tester'],
    'DevOps & Cloud':       ['devops', 'infra', 'cloud', 'infrastructure', 'sre', 'admin'],
    'Marketing & Growth':   ['marketing', 'seo', 'content', 'growth', 'social'],
  };

  const deptManagerKeywords = {
    'Software Engineering': ['software', 'tech', 'engineering', 'development', 'project_manager', 'project manager', 'cto', 'dev', 'lead'],
    'UI/UX Design':         ['design', 'creative', 'art', 'ui', 'ux', 'lead'],
    'Sales Department':     ['sales', 'business', 'lead'],
    'Operations Management':['ops', 'operations', 'project_manager', 'project manager', 'manager'],
    'QA & Testing':         ['qa', 'quality', 'test', 'lead'],
    'DevOps & Cloud':       ['devops', 'infra', 'cloud', 'sre', 'lead'],
    'Marketing & Growth':   ['marketing', 'growth', 'content', 'seo', 'lead'],
  };

  // Filter ops managers based on selected department
  const opsManagerOptions = useMemo(() => {
    const mgrKeys = deptManagerKeywords[assignMemberDept] || [];
    const matched = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      const d = (u.department || u.dept || '').toLowerCase();
      const isMgr = r.includes('manager') || r.includes('lead') || r.includes('head') || r.includes('ops') || r.includes('executive');
      return isMgr && (mgrKeys.some(k => r.includes(k) || d.includes(k)));
    });
    const fallback = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      return r.includes('manager') || r.includes('lead') || r.includes('head') || r.includes('ops');
    });
    const list = matched.length > 0 ? matched : fallback;
    const names = list.map(u => u.full_name || u.name || u.email).filter(Boolean);
    return names.length > 0 ? names : ['Shams (Operations & Project Manager)', 'Priya Sharma', 'David Kim', 'MD Motiur Rahman Emon'];
  }, [teamUsers, assignMemberDept]);

  // Filter members based on selected department
  const memberOptions = useMemo(() => {
    const memKeys = deptKeywords[assignMemberDept] || [];
    const matched = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      const d = (u.department || u.dept || '').toLowerCase();
      const isNotMgr = !r.includes('manager') && !r.includes('head');
      return isNotMgr && memKeys.some(k => r.includes(k) || d.includes(k));
    });
    const fallback = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      return !r.includes('manager') && !r.includes('head');
    });
    const list = matched.length > 0 ? matched : fallback;
    const names = list.map(u => u.full_name || u.name || u.email).filter(Boolean);
    return names.length > 0 ? names : ['Mir Tawfiq', 'Sakhawat Hossain', 'Muntasir Ashif', 'Tanvir Ahmed', 'Sarah Jenkins'];
  }, [teamUsers, assignMemberDept]);

  // Handle department change -> updates Ops Manager and Assigned Member automatically
  const handleDeptChange = (newDept) => {
    setAssignMemberDept(newDept);
    // Find matching ops manager
    const mgrKeys = deptManagerKeywords[newDept] || [];
    const matchedMgrs = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      const d = (u.department || u.dept || '').toLowerCase();
      const isMgr = r.includes('manager') || r.includes('lead') || r.includes('head') || r.includes('ops') || r.includes('executive');
      return isMgr && (mgrKeys.some(k => r.includes(k) || d.includes(k)));
    });
    const fallbackMgrs = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      return r.includes('manager') || r.includes('lead') || r.includes('head') || r.includes('ops');
    });
    const finalMgrs = matchedMgrs.length > 0 ? matchedMgrs : fallbackMgrs;
    if (finalMgrs.length > 0) {
      setAssignOpsManager(finalMgrs[0].full_name || finalMgrs[0].name || '');
    }

    // Find matching member
    const memKeys = deptKeywords[newDept] || [];
    const matchedMembers = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      const d = (u.department || u.dept || '').toLowerCase();
      const isNotMgr = !r.includes('manager') && !r.includes('head');
      return isNotMgr && memKeys.some(k => r.includes(k) || d.includes(k));
    });
    const fallbackMembers = teamUsers.filter(u => {
      const r = (u.role || u.position || '').toLowerCase();
      return !r.includes('manager') && !r.includes('head');
    });
    const finalMembers = matchedMembers.length > 0 ? matchedMembers : fallbackMembers;
    if (finalMembers.length > 0) {
      const chosen = finalMembers[0];
      const name = chosen.full_name || chosen.name || '';
      setAssignMemberName(name);
      setAssignMemberRole(chosen.role || chosen.position || 'Team Member');
      setAssignMemberEmail(chosen.email || `${name.toLowerCase().replace(/\s+/g, '.')}@kodevio.com`);
    }
  };

  // Handle member selection
  const handleMemberSelect = (memberName) => {
    setAssignMemberName(memberName);
    const found = teamUsers.find(u => (u.full_name || u.name) === memberName);
    if (found) {
      setAssignMemberRole(found.role || found.position || 'Team Member');
      setAssignMemberEmail(found.email || `${memberName.toLowerCase().replace(/\s+/g, '.')}@kodevio.com`);
    }
  };

  // Initialize defaults on modal open
  useEffect(() => {
    if (isAddTaskModalOpen) {
      if (!assignOpsManager && opsManagerOptions.length > 0) {
        setAssignOpsManager(opsManagerOptions[0]);
      }
      if (!assignMemberName && memberOptions.length > 0) {
        handleMemberSelect(memberOptions[0]);
      }
    }
  }, [isAddTaskModalOpen]);

  // Assign Member to Project (Manager Action)
  const handleAddTask = (e) => {
    e.preventDefault();
    const memberName = assignMemberName.trim();
    if (!memberName) return;

    const memberRole = assignMemberRole.trim() || 'Team Member';
    const initials = memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const newDev = {
      name: memberName,
      role: memberRole,
      dept: assignMemberDept,
      color: assignMemberColor || '#3B82F6',
      initials,
      email: assignMemberEmail || `${memberName.toLowerCase().replace(/\s+/g, '.')}@kodevio.com`,
      status: assignMemberStatus || 'Active Execution',
      notes: assignMemberNotes || '',
      opsManager: assignOpsManager || ''
    };

    // Update opsHandler if manager selected
    const updatedOps = assignOpsManager ? {
      name: assignOpsManager,
      role: 'Operations & Project Manager',
      dept: assignMemberDept,
      color: '#10B981',
      initials: assignOpsManager.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    } : formData.opsHandler;

    // Add to devAssignees in formData
    setFormData(prev => ({
      ...prev,
      opsHandler: updatedOps || prev.opsHandler,
      devAssignees: [...(prev.devAssignees || []), newDev]
    }));

    const newAct = {
      id: `act-${Date.now()}`,
      user: user?.full_name || 'Operations Manager',
      role: 'Manager',
      action: 'Assigned Member',
      detail: `Assigned ${memberName} (${memberRole}) under ${assignOpsManager || 'Operations Manager'} for ${assignMemberDept}`,
      timestamp: new Date().toLocaleString()
    };
    setActivities(prev => [newAct, ...prev]);

    setIsAddTaskModalOpen(false);
    if (onShowToast) onShowToast(`✅ ${memberName} has been assigned to this project!`);
  };

  // Send Discussion Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const isManager = (user?.role || '').toLowerCase().includes('manager') || (user?.role || '').includes('admin');
    const isSales = (user?.role || '').toLowerCase().includes('sales');
    const senderRole = isManager ? 'Manager' : isSales ? 'Sales Lead' : 'Developer';

    const msg = {
      id: `msg-${Date.now()}`,
      senderName: user?.full_name || 'Super Admin',
      senderRole,
      senderAvatar: user?.full_name ? user.full_name.charAt(0) : 'U',
      message: newMessageText.trim(),
      timestamp: 'Just now'
    };
    setDiscussions(prev => [...prev, msg]);
    setNewMessageText('');
  };

  // Open Issue Ticket (Sales Action - only after delivery)
  const handleCreateIssueTicket = (e) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;
    const ticket = {
      id: `ISSUE-${issues.length + 1}`,
      title: newIssueTitle.trim(),
      description: newIssueDesc.trim(),
      reportedBy: user?.full_name || 'Sales Lead',
      assignedTo: newIssueAssignee,
      priority: newIssuePriority,
      status: 'OPEN',
      createdAt: new Date().toLocaleString()
    };
    setIssues(prev => [ticket, ...prev]);

    const newAct = {
      id: `act-${Date.now()}`,
      user: user?.full_name || 'Sales Lead',
      role: 'Sales',
      action: 'Opened Client Issue Ticket',
      detail: `Reported ticket #${ticket.id}: "${ticket.title}" [Priority: ${ticket.priority}]`,
      timestamp: new Date().toLocaleString()
    };
    setActivities(prev => [newAct, ...prev]);

    setNewIssueTitle('');
    setNewIssueDesc('');
    setIsAddIssueModalOpen(false);
    if (onShowToast) onShowToast(`Issue ticket #${ticket.id} created and assigned to dev team.`);
  };

  // Assigned Members list for Team tab
  const assignedTeamList = useMemo(() => {
    const list = [];
    if (formData.salesHandler?.name) {
      list.push({
        id: 'SH-01',
        name: formData.salesHandler.name,
        role: 'Sales Lead & Client Handler',
        dept: 'Sales Department',
        code: '10017',
        color: formData.salesHandler.color || '#D97706',
        initials: formData.salesHandler.initials || 'SH',
        email: `${formData.salesHandler.name.toLowerCase().replace(/\s+/g, '.')}@kodevio.com`,
        tasksCount: 1,
        status: 'Active Client Inflow'
      });
    }
    if (formData.opsHandler?.name) {
      list.push({
        id: 'PM-01',
        name: formData.opsHandler.name,
        role: 'Operations & Project Manager',
        dept: 'Operations Management',
        code: '10034',
        color: formData.opsHandler.color || '#10B981',
        initials: formData.opsHandler.initials || 'PM',
        email: `${formData.opsHandler.name.toLowerCase().replace(/\s+/g, '.')}@kodevio.com`,
        tasksCount: 2,
        status: 'Overseeing Delivery'
      });
    }
    if (Array.isArray(formData.devAssignees) && formData.devAssignees.length > 0) {
      formData.devAssignees.forEach((dev, idx) => {
        list.push({
          id: `DEV-${idx + 1}`,
          name: dev.name || 'Assigned Developer',
          role: dev.role || 'Frontend & UI Developer',
          dept: dev.dept || 'Software Engineering',
          code: `100${40 + idx}`,
          color: dev.color || '#3B82F6',
          initials: dev.initials || 'DV',
          email: dev.email || `${(dev.name || 'dev').toLowerCase().replace(/\s+/g, '.')}@kodevio.com`,
          tasksCount: tasks.filter(t => (t.assignee || '').toLowerCase().includes((dev.name || '').toLowerCase())).length || 3,
          status: dev.status || 'Active Execution'
        });
      });
    } else {
      list.push({
        id: 'DEV-01',
        name: 'Mir Tawfiq',
        role: 'Senior React Developer',
        dept: 'Software Engineering',
        code: '10048',
        color: '#3B82F6',
        initials: 'MT',
        email: 'mir.tawfiq@kodevio.com',
        tasksCount: 3,
        status: 'Active Execution'
      });
    }
    return list;
  }, [formData, tasks]);

  // Turnaround info calculation
  const getDaysRemaining = (deadlineDate, status) => {
    if (!deadlineDate) return { text: 'No Deadline', days: null, isOverdue: false, isCompleted: false };
    const st = String(status || '').toUpperCase();
    if (st.includes('COMPLETED') || st === 'DONE') {
      return { text: 'Completed', days: 0, isOverdue: false, isCompleted: true };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d Overdue`, days: diffDays, isOverdue: true, isCompleted: false };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', days: 0, isOverdue: false, isCompleted: false };
    }
    return { text: `${diffDays} days remaining`, days: diffDays, isOverdue: false, isCompleted: false };
  };

  const turnaround = getDaysRemaining(formData.deadlineDate || formData.deliveryDate, formData.status);

  const getStatusTheme = (key) => {
    const k = String(key || '').toUpperCase();
    if (k.includes('CANCEL') || k.includes('HOLD')) return { theme: 'theme-red', actClass: 'act-theme-canceled' };
    if (k.includes('DELIVERED')) return { theme: 'theme-green', actClass: 'act-theme-delivered' };
    if (k.includes('COMPLETED') || k.includes('DONE')) return { theme: 'theme-green', actClass: 'act-theme-completed' };
    if (k.includes('WIP') || k.includes('PROGRESS')) return { theme: 'theme-blue', actClass: 'act-theme-wip' };
    if (k.includes('REVISION')) return { theme: 'theme-amber', actClass: 'act-theme-revision' };
    if (k.includes('ISSUE') || k.includes('BLOCKER')) return { theme: 'theme-rose', actClass: 'act-theme-issue' };
    return { theme: 'theme-purple', actClass: 'act-theme-nra' };
  };

  const currentTheme = getStatusTheme(formData.status || PROJECT_PIPELINE_STEPS[currentActiveIdx]?.key);

  const grossBudget = parseFloat(formData.budget || formData.totalAmount) || 0;
  const netEarned = parseFloat(formData.deliveryAmount || formData.earnedAmount) || 0;
  const feePct = parseFloat(formData.percentage) || 20;
  const feeAmount = (grossBudget * (feePct / 100)).toFixed(2);

  // Dropdown option arrays
  const profileOptions = sellerProfiles.length > 0
    ? sellerProfiles.map(p => p.name || p.username)
    : ['Kodevio Software Studio', 'Kodevio Studio', 'Apex UX & Product Design', 'Vance Automation Squad'];

  const salesUserOptions = teamUsers.length > 0
    ? teamUsers.map(u => u.full_name || u.name || u.email)
    : ['MD Motiur Rahman Emon', 'Sakhawat Hossain Sohan', 'Super Admin', 'Sophia Vance', 'Alex Carter'];

  const pmUserOptions = teamUsers.length > 0
    ? teamUsers.map(u => u.full_name || u.name || u.email)
    : ['Super Admin', 'Priya Sharma', 'David Kim', 'Sarah Jenkins', 'MD Motiur Rahman Emon'];

  return (
    <motion.div
      key="project-details-panel"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="pdp-wrapper"
    >
      <div className="pdp-body-container">
        {/* ── 1. PROJECT SITUATION & LIFECYCLE TRACKER (LUXURY WORKFLOW RIBBON) ── */}
        <div className="pdp-situation-tracker-card">
          {/* Workflow Stage Ribbon */}
          <div className="pdp-workflow-ribbon">
            {PROJECT_PIPELINE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentActiveIdx;
              const isActive = idx === currentActiveIdx;
              const isUpcoming = idx > currentActiveIdx;
              const isCanceled = step.key === 'CANCELED';
              const stepTheme = getStatusTheme(step.key);

              return (
                <React.Fragment key={step.key}>
                  <div
                    className={`pdp-ribbon-card ${isCompleted ? 'is-completed' : ''} ${isActive ? `is-active ${stepTheme.actClass}` : ''} ${isUpcoming ? 'is-upcoming' : ''}`}
                    title={`${step.label}: ${step.description}`}
                  >
                    <div className="pdp-ribbon-node">
                      {isCompleted ? (
                        isCanceled ? (
                          <XCircle size={12} className="text-red-600" />
                        ) : (
                          <Check size={11} className="stroke-[3] text-emerald-600" />
                        )
                      ) : isActive ? (
                        isCanceled ? (
                          <XCircle size={12} className="text-white" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )
                      ) : (
                        <span className="pdp-ribbon-node-num">{step.stepNumber}</span>
                      )}
                    </div>
                    <div className="pdp-ribbon-info">
                      <span className="pdp-ribbon-code">{step.label}</span>
                      <span className="pdp-ribbon-sub">{step.subtitle}</span>
                    </div>
                  </div>

                  {idx < PROJECT_PIPELINE_STEPS.length - 1 && (
                    <div className="pdp-ribbon-arrow">
                      <ChevronRight size={13} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── 2. HERO SUMMARY CARD (LUXURY CONTROLS BAR) ── */}
        <div className="pdp-hero-card">
          <div className="pdp-hero-left">
            <div className="pdp-avatar-box">
              <FolderPlus size={22} className="text-emerald-600" />
            </div>

            <div className="pdp-hero-identity">
              <div className="pdp-hero-name-row">
                <h2 className="pdp-hero-title">{formData.title || 'Untitled Project'}</h2>
                <span className="pdp-code-pill font-mono font-bold">
                  {formData.projectCode || formData.id}
                </span>
                {formData.orderNumber && (
                  <span className="pdp-order-pill font-mono">
                    #{formData.orderNumber}
                  </span>
                )}
              </div>

              <div className="pdp-hero-tags-row">
                <span className="pdp-hero-pill">
                  <Tag size={11} className="text-emerald-600" />
                  <strong>{formData.category || 'Web Development'}</strong>
                </span>

                <span className="pdp-hero-pill">
                  <Code size={11} className="text-blue-600" />
                  <span>{formData.service || formData.serviceLine || 'Frontend'}</span>
                </span>

                <span className="pdp-hero-pill">
                  <Globe size={11} className="text-purple-600" />
                  <span>{formData.fiverrProfile || 'Kodevio Software Studio'}</span>
                </span>

                <span className="pdp-hero-pill">
                  <User size={11} className="text-slate-500" />
                  <span>{formData.clientName || 'Direct Client'}</span>
                </span>

                {turnaround.isOverdue && (
                  <span className="pdp-hero-pill" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                    <Clock size={11} className="text-red-500" />
                    <strong>{turnaround.text}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pdp-hero-right">
            {/* Developer Work Completion Status */}
            <div className="hidden lg:flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DEV TEAM STATUS</span>
              {isDevCompleted ? (
                <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> DEV COMPLETED
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleDevMarkDone}
                  className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1"
                >
                  Mark Dev Work Done
                </button>
              )}
            </div>

            {/* Manager-Only Deliver Button */}
            <button
              type="button"
              onClick={handleManagerDeliverProject}
              disabled={!isDevCompleted || isDelivered}
              className={`pdp-deliver-btn ${isDelivered ? 'is-delivered-active' : ''}`}
              title={!isDevCompleted ? 'Locked: Wait for dev team to finish tasks' : isDelivered ? 'Project already delivered' : 'Deliver Project (Manager Only)'}
            >
              {isDelivered ? <CheckCircle2 size={14} /> : !isDevCompleted ? <Lock size={13} /> : <Send size={13} />}
              <span>{isDelivered ? 'DELIVERED TO CLIENT' : 'Deliver Project (Manager)'}</span>
            </button>

            {/* Manager Status Selector */}
            <div className="pdp-hero-status-box">
              <span className="pdp-hero-status-label">LIFECYCLE STAGE</span>
              <div className="pdp-status-select-wrap">
                <CustomSelect
                  value={formData.status || 'WIP'}
                  onChange={(val) => handleChange('status', val)}
                  options={PROJECT_STATUS_OPTIONS}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. METRICS SNAPSHOT STRIP ── */}
        <div className="pdp-metrics-strip">
          <div className="pdp-metric-box">
            <span className="pdp-metric-label">TOTAL CONTRACT VALUE</span>
            <span className="pdp-metric-value text-slate-900">${grossBudget.toLocaleString()}</span>
            <span className="pdp-metric-sub">Gross Order Budget</span>
          </div>

          <div className="pdp-metric-box">
            <span className="pdp-metric-label">PLATFORM COMMISSION ({feePct}%)</span>
            <span className="pdp-metric-value text-amber-600">${feeAmount}</span>
            <span className="pdp-metric-sub">Marketplace Fee Deduction</span>
          </div>

          <div className="pdp-metric-box">
            <span className="pdp-metric-label">NET REALIZED OUTPUT</span>
            <span className="pdp-metric-value text-emerald-600">${netEarned.toLocaleString()}</span>
            <span className="pdp-metric-sub">Net Delivery Payout</span>
          </div>

          <div className="pdp-metric-box">
            <span className="pdp-metric-label">DELIVERY DEADLINE</span>
            <span className="pdp-metric-value text-indigo-600 font-mono">
              {formData.deadlineDate || formData.deliveryDate || '2026-08-30'}
            </span>
            <span className="pdp-metric-sub font-semibold">{turnaround.text}</span>
          </div>
        </div>

        {/* ── 4. 5-TAB NAVIGATION STRIP BAR ── */}
        <div className="pdp-tabs-nav-container">
          {[
            { key: 'overview', label: 'Overview', icon: SlidersHorizontal },
            { key: 'description', label: 'Description', icon: FileText },
            { key: 'team', label: 'Team', icon: Users, count: assignedTeamList.length },
            { key: 'activity', label: 'Activity', icon: Activity, count: activities.length },
            { key: 'issues', label: 'Issues', icon: AlertTriangle, count: issues.length, locked: !isDelivered }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`pdp-tab-btn ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={14} className={isActive ? 'text-orange-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`pdp-tab-badge ${tab.locked ? 'badge-locked' : ''}`}>
                    {tab.locked ? <Lock size={10} className="inline mr-0.5" /> : null}
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: OVERVIEW TAB (MAIN 2-COLUMN LUXURY WORKSPACE)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="pdp-grid-layout">
            {/* Left Column: Financials, Milestone, Resources */}
            <div className="pdp-col-left">
              {/* Section 1: Financials & Contract Breakdown */}
              <div className="pdp-section-card">
                <div className="pdp-section-header">
                  <div className="pdp-section-title-box">
                    <div className="pdp-section-icon-badge icon-emerald">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <h4 className="pdp-section-title">Financials &amp; Contract Breakdown</h4>
                      <p className="pdp-section-sub">Gross contract budget, platform percentage, and net output</p>
                    </div>
                  </div>
                </div>

                <div className="pdp-form-grid-3">
                  <div className="pdp-field-group">
                    <label className="pdp-label">Gross Order Budget ($)</label>
                    <input
                      type="number"
                      value={formData.budget || formData.totalAmount || ''}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="0.00"
                      className="pdp-input font-bold"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label">Platform Fee (%)</label>
                    <input
                      type="number"
                      value={formData.percentage !== undefined ? formData.percentage : '20'}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                      placeholder="20"
                      className="pdp-input font-bold text-amber-600"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label">Net Delivery Amount ($)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.deliveryAmount || formData.earnedAmount || '0.00'}
                      className="pdp-input font-bold text-emerald-600 bg-slate-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Milestone & Timeline Strategy */}
              <div className="pdp-section-card">
                <div className="pdp-section-header">
                  <div className="pdp-section-title-box">
                    <div className="pdp-section-icon-badge icon-blue">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <h4 className="pdp-section-title">Milestone &amp; Timeline Strategy</h4>
                      <p className="pdp-section-sub">Project phase milestone and turnaround delivery deadlines</p>
                    </div>
                  </div>
                </div>

                <div className="pdp-form-grid-2">
                  <div className="pdp-field-group pdp-col-span-2">
                    <label className="pdp-label">Project Milestone Phase</label>
                    <CustomSelect
                      value={formData.milestone || 'Single Milestone'}
                      onChange={(val) => handleChange('milestone', val)}
                      options={PROJECT_MILESTONE_OPTIONS}
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label">Contract Start Date</label>
                    <CustomDatePicker
                      value={formData.startDate || ''}
                      onChange={(val) => handleChange('startDate', val)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label">Delivery Deadline Date</label>
                    <CustomDatePicker
                      value={formData.deadlineDate || formData.deliveryDate || ''}
                      onChange={(val) => {
                        handleChange('deadlineDate', val);
                        handleChange('deliveryDate', val);
                      }}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Resource & Personnel Allocation */}
              <div className="pdp-section-card">
                <div className="pdp-section-header">
                  <div className="pdp-section-title-box">
                    <div className="pdp-section-icon-badge icon-purple">
                      <UserCheck size={14} />
                    </div>
                    <div>
                      <h4 className="pdp-section-title">Resource &amp; Personnel Allocation</h4>
                      <p className="pdp-section-sub">Assigned sales representative and operations project manager</p>
                    </div>
                  </div>
                </div>

                <div className="pdp-form-grid-2">
                  <div className="pdp-field-group">
                    <label className="pdp-label">Sales Representative (Handler)</label>
                    <CustomSelect
                      value={formData.salesHandler?.name || formData.salesPerson || 'MD Motiur Rahman Emon'}
                      onChange={(val) => {
                        const initials = val.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        handleChange('salesHandler', { name: val, initials, color: '#10B981' });
                        handleChange('salesPerson', val);
                      }}
                      options={salesUserOptions}
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label">Operations Project Manager</label>
                    <CustomSelect
                      value={formData.opsHandler?.name || formData.projectManager || 'Super Admin'}
                      onChange={(val) => {
                        const initials = val.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        handleChange('opsHandler', { name: val, initials, color: '#059669' });
                        handleChange('projectManager', val);
                      }}
                      options={pmUserOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Requirements preview & Technical Links */}
            <div className="pdp-col-right">
              {/* Requirements & Scope Card */}
              <div className="pdp-section-card">
                <div className="pdp-section-header">
                  <div className="pdp-section-title-box">
                    <div className="pdp-section-icon-badge icon-amber">
                      <FileText size={14} />
                    </div>
                    <div>
                      <h4 className="pdp-section-title">Requirements &amp; Scope Overview</h4>
                      <p className="pdp-section-sub">High-level briefing and milestone scope notes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('description')}
                    className="pdp-link-badge-btn"
                  >
                    <span>Edit Full Scope</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="pdp-field-group">
                  <textarea
                    rows={6}
                    value={formData.notes || formData.requirements || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Enter project specifications, deliverables, and scope notes..."
                    className="pdp-textarea font-mono text-xs"
                  />
                </div>
              </div>

              {/* Technical & Delivery Links Card */}
              <div className="pdp-section-card">
                <div className="pdp-section-header">
                  <div className="pdp-section-title-box">
                    <div className="pdp-section-icon-badge icon-indigo">
                      <LinkIcon size={14} />
                    </div>
                    <div>
                      <h4 className="pdp-section-title">Technical &amp; Delivery Links</h4>
                      <p className="pdp-section-sub">Connected Figma design, GitHub repository, and live demo</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Figma size={12} className="text-purple-600" />
                      <span>Figma / Wireframe URL</span>
                    </label>
                    <div className="pdp-input-with-action">
                      <input
                        type="url"
                        value={formData.figmaUrl || ''}
                        onChange={(e) => handleChange('figmaUrl', e.target.value)}
                        placeholder="https://www.figma.com/file/..."
                        className="pdp-input"
                      />
                      {formData.figmaUrl && (
                        <a
                          href={formData.figmaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pdp-input-action-btn"
                          title="Open Figma File"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Github size={12} className="text-slate-900" />
                      <span>GitHub / Codebase Repository</span>
                    </label>
                    <div className="pdp-input-with-action">
                      <input
                        type="url"
                        value={formData.githubUrl || ''}
                        onChange={(e) => handleChange('githubUrl', e.target.value)}
                        placeholder="https://github.com/organization/repo"
                        className="pdp-input"
                      />
                      {formData.githubUrl && (
                        <a
                          href={formData.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pdp-input-action-btn"
                          title="Open Repository"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Globe size={12} className="text-blue-600" />
                      <span>Live Staging / Production URL</span>
                    </label>
                    <div className="pdp-input-with-action">
                      <input
                        type="url"
                        value={formData.demoUrl || ''}
                        onChange={(e) => handleChange('demoUrl', e.target.value)}
                        placeholder="https://staging.clientproject.com"
                        className="pdp-input"
                      />
                      {formData.demoUrl && (
                        <a
                          href={formData.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pdp-input-action-btn"
                          title="Open Live Preview"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: DESCRIPTION TAB (REQUIREMENTS & SCOPE NOTES)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'description' && (
          <div className="pdp-tab-content-panel">
            <div className="pdp-section-card" style={{ borderRadius: '0', border: 'none', borderTop: '1px solid #E2E8F0', padding: '1.25rem 1.5rem' }}>
              <div className="pdp-section-header">
                <div className="pdp-section-title-box">
                  <div className="pdp-section-icon-badge icon-amber">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h4 className="pdp-section-title">Requirements &amp; Scope Notes</h4>
                    <p className="pdp-section-sub">Comprehensive client brief, technical architecture, and deliverables</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="pdp-deliver-btn"
                  style={{ height: '36px', background: '#10B981', color: '#FFFFFF' }}
                >
                  <Save size={14} />
                  <span>Save Notes</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="pt-3">
                <div className="pdp-field-group">
                  <label className="pdp-label">Detailed Scope Specification</label>
                  <JoditScopeEditor
                    value={formData.notes || formData.requirements || ''}
                    onChange={(val) => handleChange('notes', val)}
                  />
                </div>

                <div className="pdp-form-grid-2" style={{ rowGap: '1.25rem' }}>
                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Figma size={12} className="text-purple-600" />
                      <span>Figma / Wireframe URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.figmaUrl || ''}
                      onChange={(e) => handleChange('figmaUrl', e.target.value)}
                      placeholder="https://figma.com/file/..."
                      className="pdp-input"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Github size={12} className="text-slate-900" />
                      <span>GitHub / Code Repository URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.githubUrl || ''}
                      onChange={(e) => handleChange('githubUrl', e.target.value)}
                      placeholder="https://github.com/organization/repo..."
                      className="pdp-input"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <Globe size={12} className="text-blue-600" />
                      <span>Live Demo / Staging URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.demoUrl || ''}
                      onChange={(e) => handleChange('demoUrl', e.target.value)}
                      placeholder="https://staging.clientproject.com..."
                      className="pdp-input"
                    />
                  </div>

                  <div className="pdp-field-group">
                    <label className="pdp-label flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-emerald-600" />
                      <span>Google Drive / Assets Folder</span>
                    </label>
                    <input
                      type="url"
                      value={formData.driveUrl || ''}
                      onChange={(e) => handleChange('driveUrl', e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="pdp-input"
                    />
                  </div>
                </div>

                {/* ── AUTOMATED QA & PRODUCTION DELIVERY GATEWAY ── */}
                <div className="pdp-qa-checklist-card">
                  <div className="pdp-qa-header">
                    <div className="flex items-center gap-2">
                      <div className="pdp-section-icon-badge icon-emerald">
                        <ShieldCheck size={15} />
                      </div>
                      <div>
                        <h4 className="pdp-qa-title">Automated QA &amp; Pre-Delivery Checklist Gate</h4>
                        <p className="pdp-qa-sub">Quality assurance checks required before shipping and marking as Delivered</p>
                      </div>
                    </div>
                    <div className="pdp-qa-progress-pill">
                      <span>{qaCompletedCount} of {qaItems.length} Signed Off</span>
                    </div>
                  </div>

                  <div className="pdp-qa-grid">
                    {qaItems.map((item) => (
                      <label key={item.id} className={`pdp-qa-item ${item.checked ? 'is-checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.checked)}
                          onChange={() => handleToggleQaItem(item.id)}
                          className="pdp-qa-checkbox"
                        />
                        <div className="flex flex-col">
                          <span className="pdp-qa-label-text">{item.label}</span>
                          <span className="pdp-qa-desc-text">{item.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks tab removed — member assignment moved to Team tab */}
        {activeTab === '__tasks_removed__' && (() => {
          const doneTasks = tasks.filter(t => t.status === 'Done').length;
          const totalTasks = tasks.length;
          const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
          const priorityConfig = {
            URGENT: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Urgent' },
            HIGH:   { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', label: 'High' },
            MEDIUM: { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', label: 'Medium' },
            LOW:    { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', label: 'Low' },
          };
          const statusConfig = {
            Done:        { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: '✓' },
            'In Progress': { color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', icon: '⏳' },
            Todo:        { color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', icon: '○' },
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* ── Header bar ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem', background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0', gap: '1rem', flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: '#EEF2FF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#4F46E5', flexShrink: 0
                  }}>
                    <ListTodo size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: '#0F172A' }}>
                        Task Management &amp; Assignments
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                        {doneTasks} of {totalTasks} completed
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        flex: 1, height: 5, background: '#E2E8F0',
                        borderRadius: 999, overflow: 'hidden', maxWidth: 220
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: pct === 100 ? '#10B981' : '#6366F1',
                          borderRadius: 999, transition: 'width 0.4s ease'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 900,
                        color: pct === 100 ? '#059669' : '#4F46E5'
                      }}>{pct}%</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0 1.1rem', height: 36,
                    background: '#0F172A', color: '#FFFFFF',
                    border: 'none', borderRadius: 9,
                    fontSize: '0.78rem', fontWeight: 850, cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.18)',
                    transition: 'all 0.15s ease', flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0F172A'}
                >
                  <Plus size={14} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* ── Column header ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 120px 110px 100px',
                gap: '0.75rem',
                padding: '0.55rem 1.5rem',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}>
                {['', 'TASK', 'ASSIGNEE', 'DUE DATE', 'STATUS'].map((h, i) => (
                  <span key={i} style={{ fontSize: '0.66rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em', textAlign: i > 1 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>

              {/* ── Task rows ── */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#FFFFFF' }}>
                {tasks.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    <ListTodo size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', margin: 0 }}>No tasks yet</p>
                    <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>Add tasks to track project progress</p>
                  </div>
                ) : tasks.map((task, idx) => {
                  const isDone = task.status === 'Done';
                  const pc = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                  const sc = statusConfig[task.status] || statusConfig.Todo;
                  const initials = task.assignee?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr 120px 110px 100px',
                        gap: '0.75rem',
                        alignItems: 'center',
                        padding: '0.85rem 1.5rem',
                        borderBottom: idx < tasks.length - 1 ? '1px solid #F1F5F9' : 'none',
                        borderLeft: `3px solid ${pc.color}`,
                        background: isDone ? '#FAFAFA' : '#FFFFFF',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isDone ? '#FAFAFA' : '#FFFFFF'; }}
                    >
                      {/* Checkbox */}
                      <div
                        onClick={() => handleToggleTask(task.id)}
                        style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: isDone ? 'none' : '2px solid #CBD5E1',
                          background: isDone ? '#10B981' : '#FFFFFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          boxShadow: isDone ? '0 1px 4px rgba(16,185,129,0.3)' : 'none'
                        }}
                      >
                        {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>

                      {/* Title + priority badge */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.8rem', fontWeight: 800, color: isDone ? '#94A3B8' : '#0F172A',
                            textDecoration: isDone ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {task.title}
                          </span>
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 900, padding: '1px 6px',
                            borderRadius: 4, border: `1px solid ${pc.border}`,
                            background: pc.bg, color: pc.color, textTransform: 'uppercase',
                            letterSpacing: '0.04em', flexShrink: 0
                          }}>
                            {task.priority}
                          </span>
                        </div>
                        {task.notes && (
                          <p style={{ fontSize: '0.68rem', color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>{task.notes}</p>
                        )}
                      </div>

                      {/* Assignee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          background: '#6366F1', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 900
                        }}>
                          {initials}
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, color: '#334155',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {task.assignee?.split(' ')[0]}
                        </span>
                      </div>

                      {/* Due date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                        <Calendar size={11} color="#94A3B8" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{task.dueDate}</span>
                      </div>

                      {/* Status badge */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.68rem', fontWeight: 900,
                          padding: '3px 9px', borderRadius: 6,
                          border: `1px solid ${sc.border}`,
                          background: sc.bg, color: sc.color,
                          textTransform: 'capitalize', letterSpacing: '0.02em'
                        }}>
                          {sc.icon} {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Footer summary ── */}
              {tasks.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { label: 'Total', count: tasks.length, color: '#0F172A' },
                    { label: 'Done', count: tasks.filter(t => t.status === 'Done').length, color: '#059669' },
                    { label: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, color: '#2563EB' },
                    { label: 'Todo', count: tasks.filter(t => t.status === 'Todo').length, color: '#64748B' },
                    { label: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length, color: '#EF4444' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: s.color }}>{s.count}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: TEAM TAB — ASSIGNED MEMBERS + ASSIGN MEMBER FEATURE
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ── Team Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0', gap: '1rem', flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: '#F0FDF4', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#059669', flexShrink: 0
                }}>
                  <Users size={17} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: '#0F172A' }}>Project Team</h4>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                    {assignedTeamList.length} member{assignedTeamList.length !== 1 ? 's' : ''} assigned to this project
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTaskModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0 1.1rem', height: 36,
                  background: '#059669', color: '#FFFFFF',
                  border: 'none', borderRadius: 9,
                  fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                onMouseLeave={e => e.currentTarget.style.background = '#059669'}
              >
                <Plus size={14} />
                <span>Assign Member</span>
              </button>
            </div>

            {/* ── Team Grid ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0',
              padding: '0',
              background: '#FFFFFF'
            }}>
              {assignedTeamList.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1', padding: '3.5rem 1.5rem',
                  textAlign: 'center', color: '#94A3B8'
                }}>
                  <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', margin: 0 }}>No members assigned yet</p>
                  <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.3rem' }}>Click "Assign Member" to add team members</p>
                </div>
              ) : assignedTeamList.map(member => (
                <div key={member.id} style={{
                  background: '#FFFFFF',
                  border: 'none',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: '1px solid #E2E8F0',
                  borderRadius: 0,
                  padding: '1.25rem 1rem',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  boxShadow: 'none',
                  transition: 'background 0.1s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  {/* Card Top */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: member.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 900,
                        boxShadow: `0 2px 8px ${member.color}50`
                      }}>
                        {member.initials}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: '#0F172A' }}>{member.name}</h4>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{member.role}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 900, padding: '3px 8px',
                      borderRadius: 6, background: '#F1F5F9',
                      color: '#475569', border: '1px solid #E2E8F0'
                    }}>
                      #{member.code}
                    </span>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#F1F5F9' }} />

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { label: 'Department', value: member.dept },
                      { label: 'Email', value: member.email },
                      { label: 'Status', value: member.status, isStatus: true },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>{row.label}</span>
                        {row.isStatus ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                            {row.value}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Contact Email button */}
                  <a
                    href={`mailto:${member.email}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      width: '100%', padding: '0.55rem',
                      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: '0.72rem', fontWeight: 800, color: '#475569', textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <Mail size={13} />
                    <span>Contact via Email</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: ACTIVITY TAB (CLEAN COMPACT AUDIT TRAIL FEED)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="pdp-tab-content-panel" style={{ padding: 0 }}>
            <div className="pdp-act-wrapper">
              {/* Activity Cards Feed Grid */}
              <div className="pdp-act-feed-container">
                {Object.keys(groupedActivities).length === 0 ? (
                  <div style={{
                    padding: '3rem 1.5rem', textAlign: 'center', background: '#F8FAFC',
                    borderRadius: 12, border: '1px dashed #CBD5E1'
                  }}>
                    <History size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3, color: '#64748B' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', margin: 0 }}>No matching activity entries found</p>
                    <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>Try clearing your search query or selecting a different category filter</p>
                  </div>
                ) : (
                  Object.entries(groupedActivities).map(([dateLabel, groupList]) => (
                    <div key={dateLabel} className="pdp-act-date-group">
                      <div className="pdp-act-date-header">
                        <span className="pdp-act-date-badge">{dateLabel}</span>
                        <span className="pdp-act-date-count">&bull; {groupList.length} {groupList.length === 1 ? 'event' : 'events'}</span>
                        <div className="pdp-act-date-line" />
                      </div>

                      <div className="pdp-act-grid">
                        {groupList.map(act => {
                          const meta = getActivityCategory(act.action, act.detail);
                          const IconComponent = meta.icon;
                          const actorColor = getActorColor(act.role);
                          const initials = (act.user || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                          return (
                            <div key={act.id} className={`pdp-act-item-card ${meta.cat}`}>
                              {/* Card Header */}
                              <div className="pdp-act-item-header">
                                <div className="pdp-act-actor-box">
                                  <div
                                    className="pdp-act-actor-avatar"
                                    style={{ backgroundColor: actorColor }}
                                  >
                                    {initials}
                                  </div>
                                  <span className="pdp-act-actor-name">{act.user}</span>
                                  <span className="pdp-act-role-tag">{act.role}</span>
                                </div>

                                <span className={`pdp-act-action-pill ${meta.pill}`}>
                                  <IconComponent size={10} strokeWidth={2.5} />
                                  <span>{act.action}</span>
                                </span>
                              </div>

                              {/* Card Detail Content */}
                              <div className="pdp-act-detail-box">
                                {act.detail}
                              </div>

                              {/* Card Footer: Timestamp */}
                              <div className="pdp-act-card-footer">
                                <span className="pdp-act-time-stamp">
                                  <Clock size={10} />
                                  <span>{act.timestamp}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: ISSUES TAB (POST-DELIVERY TICKETING SYSTEM)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'issues' && (
          <div className="pdp-tab-content-panel" style={{ padding: 0 }}>
            {!isDelivered ? (
              <div className="pdp-iss-locked-wrap">
                <div className="pdp-iss-locked-card">
                  {/* Glowing Amber Halo Icon */}
                  <div className="pdp-iss-locked-icon-halo">
                    <Lock size={26} strokeWidth={2.2} />
                  </div>

                  {/* Header Title & Pill */}
                  <div className="pdp-iss-locked-header-box">
                    <span className="pdp-iss-locked-pill">
                      <Lock size={10} />
                      <span>Post-Delivery Phase Required</span>
                    </span>
                    <h3 className="pdp-iss-locked-title">Post-Delivery Issue Ticketing Locked</h3>
                    <p className="pdp-iss-locked-desc">
                      Client revision requests and issue ticketing activate automatically once this project is officially marked as <strong className="text-slate-900 font-bold">DELIVERED</strong> by the Operations Manager.
                    </p>
                  </div>

                  {/* Visual Stage Progress Strip */}
                  <div className="pdp-iss-locked-track-box">
                    <div className="pdp-iss-track-node">
                      <span className="pdp-iss-track-lbl">Current Stage</span>
                      <span className="pdp-iss-track-val-current">{formData.status || 'WIP'}</span>
                    </div>

                    <div className="pdp-iss-track-arrow">
                      <span>&bull; &bull; &bull;</span>
                      <ArrowRight size={14} />
                    </div>

                    <div className="pdp-iss-track-node">
                      <span className="pdp-iss-track-lbl">Target Stage</span>
                      <span className="pdp-iss-track-val-target">DELIVERED</span>
                    </div>
                  </div>

                  {/* Informative Guidance Box */}
                  <div className="pdp-iss-locked-hint">
                    <Info size={14} />
                    <span>
                      <strong>Why is this locked?</strong> Issue tickets track post-delivery buyer revisions and QA fixes, keeping active development tasks uncluttered.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pdp-iss-wrapper">
                {/* 1. Header & Controls Strip */}
                <div className="pdp-iss-topbar">
                  <div className="pdp-iss-topbar-left">
                    <div className="pdp-iss-badge-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="pdp-iss-topbar-title">Post-Delivery Client Issue Tickets</h4>
                      <p className="pdp-iss-topbar-sub">Report, track, and resolve client feedback, revisions, and bug tickets</p>
                    </div>
                  </div>

                  <div className="pdp-iss-topbar-actions">
                    {/* Search input */}
                    <div className="pdp-iss-search-input-wrap">
                      <Search size={13} className="pdp-iss-search-icon" />
                      <input
                        type="text"
                        value={issueSearch}
                        onChange={(e) => setIssueSearch(e.target.value)}
                        placeholder="Search tickets..."
                        className="pdp-iss-search-input"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="pdp-iss-filter-pills">
                      {[
                        { key: 'ALL', label: 'All' },
                        { key: 'OPEN', label: 'Open' },
                        { key: 'RESOLVED', label: 'Resolved' },
                        { key: 'URGENT', label: 'Urgent' }
                      ].map(f => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setIssueFilter(f.key)}
                          className={`pdp-iss-filter-pill ${issueFilter === f.key ? 'is-active' : ''}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Open Ticket Button */}
                    <button
                      type="button"
                      onClick={() => setIsAddIssueModalOpen(true)}
                      className="pdp-iss-btn-create"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Open Issue Ticket</span>
                    </button>
                  </div>
                </div>

                {/* 2. Metrics Snapshot Strip */}
                <div className="pdp-iss-metrics-strip">
                  <div className="pdp-iss-metric-cell">
                    <span className="pdp-iss-metric-lbl">TOTAL ISSUE TICKETS</span>
                    <span className="pdp-iss-metric-val">{issues.length}</span>
                  </div>
                  <div className="pdp-iss-metric-cell">
                    <span className="pdp-iss-metric-lbl">OPEN / PENDING</span>
                    <span className="pdp-iss-metric-val text-amber-600 font-mono">
                      {issues.filter(i => i.status !== 'RESOLVED').length}
                    </span>
                  </div>
                  <div className="pdp-iss-metric-cell">
                    <span className="pdp-iss-metric-lbl">RESOLVED &amp; CLOSED</span>
                    <span className="pdp-iss-metric-val text-emerald-600 font-mono">
                      {issues.filter(i => i.status === 'RESOLVED').length}
                    </span>
                  </div>
                  <div className="pdp-iss-metric-cell">
                    <span className="pdp-iss-metric-lbl">LIFECYCLE STAGE</span>
                    <span className="pdp-iss-metric-val text-indigo-600 font-mono text-xs uppercase">
                      {formData.status || 'DELIVERED'}
                    </span>
                  </div>
                </div>

                {/* 3. Tickets Feed */}
                <div className="pdp-iss-feed-container">
                  {filteredIssues.length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC',
                      borderRadius: 12, border: '1px dashed #CBD5E1', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', gap: '0.65rem'
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: '#ECFDF5',
                        border: '1.5px solid #D1FAE5', color: '#059669', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {issues.length === 0 ? 'No Post-Delivery Issues Reported' : 'No Tickets Match Your Filter'}
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: '#64748B', maxWidth: 420, margin: 0 }}>
                        {issues.length === 0
                          ? 'Client delivery is approved with zero open bug reports or revision requests.'
                          : 'Try changing or resetting your search keyword or status filter above.'}
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map(ticket => {
                      const isResolved = ticket.status === 'RESOLVED';
                      const isUrgent = ticket.priority === 'URGENT';
                      const isHigh = ticket.priority === 'HIGH';

                      return (
                        <div
                          key={ticket.id}
                          className={`pdp-iss-card ${
                            isResolved
                              ? 'is-resolved'
                              : isUrgent
                              ? 'is-priority-urgent'
                              : isHigh
                              ? 'is-priority-high'
                              : 'is-priority-medium'
                          }`}
                        >
                          {/* Top Row: Ticket ID + Title + Badges */}
                          <div className="pdp-iss-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                              <span className="pdp-iss-card-id-pill">#{ticket.id}</span>
                              <h4 className="pdp-iss-card-title">{ticket.title}</h4>
                            </div>

                            <div className="pdp-iss-card-badges">
                              <span
                                className={
                                  isUrgent
                                    ? 'pdp-iss-pill-urgent'
                                    : isHigh
                                    ? 'pdp-iss-pill-high'
                                    : 'pdp-iss-pill-medium'
                                }
                              >
                                {ticket.priority}
                              </span>

                              <span
                                className={
                                  isResolved
                                    ? 'pdp-iss-pill-status-resolved'
                                    : 'pdp-iss-pill-status-open'
                                }
                              >
                                {isResolved ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                <span>{ticket.status}</span>
                              </span>
                            </div>
                          </div>

                          {/* Body Description */}
                          <p className="pdp-iss-card-desc">{ticket.description}</p>

                          {/* Footer Info & Quick Resolve Toggle */}
                          <div className="pdp-iss-card-footer">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <span>
                                Reported by:{' '}
                                <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                                  {ticket.reportedBy}
                                </strong>
                              </span>
                              <span>
                                Resolver:{' '}
                                <strong style={{ color: '#4F46E5', fontWeight: 700 }}>
                                  {ticket.assignedTo}
                                </strong>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Clock size={11} />
                                <span>{ticket.createdAt}</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleResolveIssue(ticket.id)}
                              className={`pdp-iss-btn-resolve-toggle ${isResolved ? 'is-resolved' : ''}`}
                            >
                              {isResolved ? (
                                <>
                                  <RotateCcw size={12} />
                                  <span>Reopen Ticket</span>
                                </>
                              ) : (
                                <>
                                  <Check size={12} strokeWidth={2.5} />
                                  <span>Mark Resolved</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 5. STICKY BOTTOM ACTION FOOTER (EXACT ORIGINAL DESIGN) ── */}
        <div className="pdp-footer-bar">
          <div className="pdp-footer-left">
            <button
              type="button"
              onClick={onBack}
              className="pdp-btn-back-footer"
            >
              <ArrowLeft size={13} />
              <span>Back to Projects</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(formData.id)}
                className="pdp-btn-delete-footer"
              >
                <Trash2 size={13} />
                <span>Delete Project</span>
              </button>
            )}
          </div>

          <div className="pdp-footer-right">
            <button
              type="button"
              onClick={onBack}
              className="pdp-btn-discard-footer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="pdp-btn-save-footer"
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving Changes...' : 'Save & Persist Changes'}</span>
            </button>
          </div>
        </div>

        {/* ── MODAL: ASSIGN MEMBER TO PROJECT ── */}
        {/* ── MODAL: ASSIGN MEMBER TO PROJECT (MATCHING FIVERR PROFILE / CLIENT MODAL DESIGN) ── */}
        <AnimatePresence>
          {isAddTaskModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="cli-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAddTaskModalOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="cli-details-modal-card"
                style={{ maxWidth: '680px' }}
              >
                {/* Sticky Header */}
                <div className="cli-modal-header-sticky">
                  <div className="flex items-center gap-3">
                    <div
                      className="cli-modal-avatar-circle"
                      style={{
                        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                        border: '1.5px solid #FED7AA',
                        color: '#EA580C',
                        boxShadow: '0 2px 5px rgba(234, 88, 12, 0.15)',
                      }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        Assign Team Member
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Assign department operations manager, role, and allocate execution member
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className="cli-panel-close-btn"
                    title="Close Form"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Content */}
                <form
                  onSubmit={handleAddTask}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  <div className="cli-details-section">
                    <h4 className="cli-details-section-header">
                      <User size={14} className="text-slate-600" />
                      <span>Department &amp; Operations Assignment</span>
                    </h4>
                    <div className="cli-form-grid-3col">
                      {/* 1. Department (Required) */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Department</span>
                          <span className="cli-label-req">(Required)</span>
                        </label>
                        <CustomSelect
                          value={assignMemberDept}
                          onChange={handleDeptChange}
                          options={DEPARTMENT_OPTIONS}
                          placeholder="Select Department"
                        />
                      </div>

                      {/* 2. Operations Manager (Required) */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Operations Manager</span>
                          <span className="cli-label-req">(Required)</span>
                        </label>
                        <CustomSelect
                          value={assignOpsManager}
                          onChange={(val) => setAssignOpsManager(val)}
                          options={opsManagerOptions}
                          placeholder="Select Ops Manager"
                        />
                      </div>

                      {/* 3. Assigned Member (Required) */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Assign Member</span>
                          <span className="cli-label-req">(Required)</span>
                        </label>
                        <CustomSelect
                          value={assignMemberName}
                          onChange={handleMemberSelect}
                          options={memberOptions}
                          placeholder="Select Member"
                        />
                      </div>

                      {/* 4. Role / Position */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Member Role / Position</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={assignMemberRole}
                          onChange={(e) => setAssignMemberRole(e.target.value)}
                          placeholder="e.g. Frontend & UI Developer"
                          className="cli-input"
                        />
                      </div>

                      {/* 5. Work Email */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Work Email</span>
                        </label>
                        <input
                          type="email"
                          value={assignMemberEmail}
                          onChange={(e) => setAssignMemberEmail(e.target.value)}
                          placeholder="member@kodevio.com"
                          className="cli-input"
                        />
                      </div>

                      {/* 6. Account Status */}
                      <div className="cli-field-group">
                        <label className="cli-field-label">
                          <span>Account Status</span>
                        </label>
                        <CustomSelect
                          value={assignMemberStatus}
                          onChange={(val) => setAssignMemberStatus(val)}
                          options={['Active Execution', 'Assigned & Queued', 'Review & QA', 'Overseeing Delivery']}
                          placeholder="Select Status"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Notes Section */}
                  <div className="cli-details-section-orange">
                    <h4 className="cli-details-section-header-orange">
                      <Globe size={14} className="text-orange-600" />
                      <span>Assignment Notes / Scope Allocation (Optional)</span>
                    </h4>
                    <div className="cli-field-group">
                      <input
                        type="text"
                        value={assignMemberNotes}
                        onChange={(e) => setAssignMemberNotes(e.target.value)}
                        placeholder="e.g. Lead frontend architecture, sprint milestones & UI delivery"
                        className="cli-input"
                      />
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.75rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsAddTaskModalOpen(false)}
                      className="fp-btn-cancel-compact"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="cli-btn-add-lead">
                      <Plus size={14} />
                      <span>Assign Member</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL 2: OPEN CLIENT ISSUE TICKET (SALES ACTION - POST-DELIVERY) ── */}
        <AnimatePresence>
          {isAddIssueModalOpen && (
            <div
              className="cli-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAddIssueModalOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="cli-details-modal-card"
                style={{ maxWidth: '580px' }}
              >
                {/* Sticky Header */}
                <div className="cli-modal-header-sticky">
                  <div className="flex items-center gap-3">
                    <div
                      className="cli-modal-avatar-circle"
                      style={{
                        background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                        border: '1.5px solid #FECACA',
                        color: '#DC2626',
                        boxShadow: '0 2px 5px rgba(220, 38, 38, 0.15)',
                      }}
                    >
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        Open Post-Delivery Issue Ticket
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Record buyer feedback, revision scope, and allocate developer resolver
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddIssueModalOpen(false)}
                    className="cli-panel-close-btn"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Form */}
                <form
                  onSubmit={handleCreateIssueTicket}
                  style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <span>Issue Summary / Title</span>
                      <span className="cli-label-req">(Required)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      placeholder="e.g. Mobile responsive navigation menu not expanding on iOS Safari"
                      className="cli-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Severity / Priority</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <CustomSelect
                        value={newIssuePriority}
                        onChange={setNewIssuePriority}
                        options={['URGENT', 'HIGH', 'MEDIUM', 'LOW']}
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Assign Resolver</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <CustomSelect
                        value={newIssueAssignee}
                        onChange={setNewIssueAssignee}
                        options={assignedTeamList.map((m) => m.name)}
                      />
                    </div>
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <span>Client Feedback &amp; Reproduction Details</span>
                      <span className="cli-label-req">(Required)</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newIssueDesc}
                      onChange={(e) => setNewIssueDesc(e.target.value)}
                      placeholder="Paste buyer feedback, error messages, and reproduction steps..."
                      className="pdp-textarea"
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.75rem',
                      marginTop: '0.35rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsAddIssueModalOpen(false)}
                      className="fp-btn-cancel-compact"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newIssueTitle.trim() || !newIssueDesc.trim()}
                      className="cli-btn-add-lead"
                      style={{ background: '#DC2626', borderColor: '#B91C1C' }}
                    >
                      <Plus size={14} />
                      <span>Open Ticket</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL 3: QUICK AUDIT LOG / STATUS NOTE ── */}
        <AnimatePresence>
          {isLogModalOpen && (
            <div className="cli-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsLogModalOpen(false); }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="cli-details-modal-card"
                style={{ maxWidth: '540px' }}
              >
                <div className="cli-modal-header-sticky">
                  <div className="flex items-center gap-3">
                    <div
                      className="cli-modal-avatar-circle"
                      style={{
                        background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                        border: '1.5px solid #E9D5FF',
                        color: '#7E22CE',
                        boxShadow: '0 2px 5px rgba(126, 34, 206, 0.15)',
                      }}
                    >
                      <History size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        Log Activity / Audit Note
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Record a manual progress note, client call summary, or milestone update
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="cli-panel-close-btn"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddActivityLog} style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <span>Action Type / Category</span>
                      <span className="cli-label-req">(Required)</span>
                    </label>
                    <CustomSelect
                      value={newLogAction}
                      onChange={(val) => setNewLogAction(val)}
                      options={['Status Note', 'Client Sync Call', 'Scope Revision', 'QA Signoff', 'Milestone Checkpoint']}
                      placeholder="Select Action Type"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <span>Audit Details / Log Summary</span>
                      <span className="cli-label-req">(Required)</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      placeholder="e.g. Conducted weekly sprint review with client; approved staging release build."
                      className="pdp-textarea"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsLogModalOpen(false)}
                      className="fp-btn-cancel-compact"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newLogNote.trim()}
                      className="cli-btn-add-lead"
                      style={{ background: '#7E22CE', borderColor: '#6B21A8' }}
                    >
                      <Plus size={14} />
                      <span>Post to Audit Trail</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
