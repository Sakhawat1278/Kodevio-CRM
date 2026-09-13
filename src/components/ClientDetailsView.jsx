import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  Save,
  Trash2,
  Video,
  CheckCircle2,
  CheckCircle,
  UploadCloud,
  FileText,
  Tag,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Layers,
  Copy,
  Check,
  DollarSign,
  ShoppingBag,
  Building,
  MapPin,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Plus,
  FolderPlus,
  FolderKanban,
  X,
  Pencil
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import CustomTimePicker from './common/CustomTimePicker';
import CreateClientProjectView from './CreateClientProjectView';
import { CLIENT_STATUS_OPTIONS } from './ClientsView';
import { clientsApi, projectsApi } from '../api/client';

export default function ClientDetailsView({
  client,
  user,
  sellerProfiles = [],
  onBack,
  onSave,
  onDelete,
  onShowToast,
  onUpdateStatus
}) {
  const [formData, setFormData] = useState({ ...client });
  const [copiedField, setCopiedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [meetingDate, setMeetingDate] = useState(
    client?.meeting_time ? client.meeting_time.split(' ')[0] : new Date().toISOString().split('T')[0]
  );
  const [meetingTime, setMeetingTime] = useState(
    client?.meeting_time && client.meeting_time.split(' ')[1] ? client.meeting_time.split(' ')[1] : '14:30'
  );
  const attachmentInputRef = useRef(null);

  // Client Projects Management
  const [clientProjects, setClientProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      if (!client) return;
      setLoadingProjects(true);
      try {
        const res = await projectsApi.fetchProjects();
        const allProjects = res?.projects || [];
        const matched = allProjects.filter((p) => {
          const u = formData.username || formData.fiverr_username || '';
          const matchUser = u && (p.clientUsername?.toLowerCase() === u.toLowerCase() || p.client_username?.toLowerCase() === u.toLowerCase());
          const matchName = formData.name && p.clientName?.toLowerCase() === formData.name.toLowerCase();
          const matchId = p.clientId && p.clientId === formData.id;
          return matchUser || matchName || matchId;
        });

        if (matched.length > 0) {
          setClientProjects(matched);
        } else if (Array.isArray(formData.projects) && formData.projects.length > 0) {
          setClientProjects(formData.projects);
        } else {
          const numOrders = Number(formData.total_orders) || 0;
          if (numOrders > 0) {
            const initialList = [
              {
                id: `PRJ-${String(formData.id || '101').replace(/[^0-9]/g, '') || '101'}`,
                title: `${formData.category || 'Web Development'} — Custom Platform & Integration`,
                category: formData.category || 'Web Development',
                totalAmount: 1200,
                deadlineDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
                status: 'IN PROGRESS',
                fiverrOrderId: 'FO92014A9',
                orderUrl: formData.quotation_link || formData.inbox_link || '',
                notes: 'Primary engagement milestone deliverables and staging review'
              }
            ];
            setClientProjects(initialList);
          } else {
            setClientProjects([]);
          }
        }
      } catch (err) {
        console.warn('Projects fetch error:', err);
        setClientProjects(formData.projects || []);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [client?.id, formData.username, formData.name]);

  const handleProjectCreatedFromPanel = (createdProject) => {
    const updated = [createdProject, ...clientProjects];
    setClientProjects(updated);

    const newTotalOrders = (Number(formData.total_orders) || 0) + 1;
    const currentSpentNum = Number(String(formData.total_spent || '').replace(/[^0-9]/g, '')) || 0;
    const newSpentVal = `$${(currentSpentNum + (Number(createdProject.budget || createdProject.totalAmount) || 500)).toLocaleString()}`;

    handleChange('total_orders', newTotalOrders);
    handleChange('total_spent', newSpentVal);
    handleChange('projects', updated);
  };

  const handleDeleteProject = async (projId) => {
    try {
      await projectsApi.deleteProject(projId);
    } catch (err) {
      console.warn('Project delete note:', err);
    }
    const updated = clientProjects.filter((p) => p.id !== projId);
    setClientProjects(updated);
    handleChange('projects', updated);
    if (onShowToast) onShowToast();
  };

  const handleUpdateProjectStatus = async (projId, newStatus) => {
    const updated = clientProjects.map((p) => (p.id === projId ? { ...p, status: newStatus } : p));
    setClientProjects(updated);
    handleChange('projects', updated);
    try {
      await projectsApi.updateProject(projId, { status: newStatus });
    } catch (err) {
      console.warn('Project status note:', err);
    }
    if (onShowToast) onShowToast();
  };

  useEffect(() => {
    if (client) {
      setFormData({ ...client });
      if (client.meeting_time) {
        const parts = client.meeting_time.split(' ');
        if (parts[0]) setMeetingDate(parts[0]);
        if (parts[1]) setMeetingTime(parts[1]);
      }
    }
  }, [client]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
    if (onShowToast) onShowToast();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const sourceProfileOptions = sellerProfiles && sellerProfiles.length > 0
    ? sellerProfiles.map((p) => typeof p === 'object' ? (p.name || p.username || p.label) : p)
    : [
        'Kodevio Studio',
        'Kodevio Software Studio',
        'Apex UX & Product Design',
        'Kodevio SEO & Growth Lab',
        'Vance Automation Squad'
      ];

  const salesExecutiveOptions = [
    'MD Motiur Rahman Emon',
    'Marcus Chen',
    'Nina Roberts',
    'Sakhawat Hossain Sohan',
    'Sophia Vance',
    'Alex Carter'
  ];

  const serviceCategoryOptions = [
    'Web Development',
    'App Development',
    'UI/UX Design',
    'AI & Automation',
    'SEO & Marketing',
    'Full Stack Development',
    'Custom Software',
    'Bug Fixes & Maintenance'
  ];

  const acquisitionSourceOptions = [
    'Direct Outreach',
    'Buyer brief',
    'Client messages',
    'Direct order',
    'Custom offer',
    'Fiverr Pro Brief',
    'Upwork',
    'Direct Website',
    'LinkedIn',
    'Referral'
  ];

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      if (onSave) {
        onSave(formData);
      } else {
        await clientsApi.updateClient(formData.id, formData);
      }
      if (onShowToast) onShowToast();
    } catch (err) {
      console.warn('Error saving client:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetMeetingNow = () => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = {
      ...formData,
      meeting_time: formatted,
      status: 'MEETING STARTED'
    };
    setFormData(updated);
    if (onSave) onSave(updated);
    if (onShowToast) onShowToast();
  };

  const handleMarkMeetingDone = () => {
    const updated = {
      ...formData,
      status: 'MEETING DONE'
    };
    setFormData(updated);
    if (onSave) onSave(updated);
    if (onShowToast) onShowToast();
  };

  const handleSaveMeeting = () => {
    const formatted = `${meetingDate} ${meetingTime}`;
    const updated = {
      ...formData,
      meeting_time: formatted,
      status: formData.status === 'SUBMITTED' ? 'MEETING SCHEDULED' : formData.status
    };
    setFormData(updated);
    if (onSave) onSave(updated);
    if (onShowToast) onShowToast();
  };

  const handleClearMeeting = () => {
    const updated = {
      ...formData,
      meeting_time: null
    };
    setFormData(updated);
    if (onSave) onSave(updated);
    if (onShowToast) onShowToast();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleChange('attachment_name', file.name);
      if (onShowToast) onShowToast();
    }
  };

  const formatMeetingDisplay = (meetingStr) => {
    if (!meetingStr) return null;
    try {
      const parts = meetingStr.trim().split(' ');
      const d = parts[0];
      const t = parts[1] || '';
      if (!d) return meetingStr;
      const dateObj = new Date(d);
      const dateFormatted = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : d;
      return `${dateFormatted} • ${t || '14:30'}`;
    } catch (e) {
      return meetingStr;
    }
  };

  const clientInitials = formData.name
    ? formData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : formData.username
    ? formData.username.slice(0, 2).toUpperCase()
    : 'CL';

  if (isCreatingProject) {
    return (
      <CreateClientProjectView
        client={formData}
        sellerProfiles={sellerProfiles}
        onBack={() => setIsCreatingProject(false)}
        onProjectCreated={handleProjectCreatedFromPanel}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <motion.div
      key="client-details-panel"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="cdp-wrapper"
    >
      <div className="cdp-body-container">
      {/* COMPACT CLIENT HERO SUMMARY CARD */}
      <div className="cdp-hero-card">
        <div className="cdp-hero-left">
          <div className="cdp-avatar-box">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt={formData.name} className="cdp-avatar-img" />
            ) : (
              <div className="cdp-avatar-initials">{clientInitials}</div>
            )}
            <span className="cdp-status-dot-pulse" />
          </div>

          <div className="cdp-hero-identity">
            <div className="cdp-hero-name-row">
              <h2 className="cdp-hero-title">{formData.name || 'Unnamed Client'}</h2>
              <span className="cdp-hero-handle">
                @{formData.username || formData.fiverr_username || 'client_handle'}
              </span>
              <span className="cdp-id-badge">ID: {formData.id || 'N/A'}</span>
            </div>

            <div className="cdp-hero-tags-row">
              {formData.company_name && (
                <div className="cdp-hero-pill">
                  <Building size={11} className="text-slate-500" />
                  <span>{formData.company_name}</span>
                </div>
              )}

              <div className="cdp-hero-pill">
                <MapPin size={11} className="text-slate-500" />
                <span>{formData.country || 'UNITED STATES'}</span>
              </div>

              <div className="cdp-hero-pill">
                <Tag size={11} className="text-slate-500" />
                <span>{formData.category || 'Web Development'}</span>
              </div>

              {formData.created_at && (
                <div className="cdp-hero-pill cdp-pill-date">
                  <Clock size={11} className="text-slate-400" />
                  <span>Added {new Date(formData.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cdp-hero-right">
          {/* Live Status Selector & Inline Aligned Save Button */}
          <div className="cdp-hero-status-box">
            <span className="cdp-hero-status-label">CURRENT STATUS</span>
            <div className="cdp-hero-actions-row">
              <div className="cdp-status-select-wrap">
                <CustomSelect
                  value={formData.status || 'SUBMITTED'}
                  onChange={(val) => {
                    handleChange('status', val);
                    if (onUpdateStatus) onUpdateStatus(formData.id, val);
                  }}
                  options={CLIENT_STATUS_OPTIONS}
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="cdp-btn-save-hero"
                title="Save client profile updates"
              >
                <Save size={13} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPACT MAIN WORKSPACE GRID (2 COLUMNS) */}
      <div className="cdp-grid-layout">
        {/* LEFT COLUMN: Deep Information, Links & Briefing */}
        <div className="cdp-main-col">
          {/* Card 1: Account Identity & Contact */}
          <div className="cdp-section-card">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-indigo">
                  <User size={14} />
                </div>
                <div>
                  <h3 className="cdp-section-title">Client Identity & Contact</h3>
                  <p className="cdp-section-sub">Primary account profile details and communications</p>
                </div>
              </div>
            </div>

            <div className="cdp-form-grid-3">
              <div className="cdp-field-group">
                <label className="cdp-label">Customer Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Full Name"
                  className="cdp-input"
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Fiverr Username</label>
                <input
                  type="text"
                  value={formData.username || formData.fiverr_username || ''}
                  onChange={(e) => {
                    handleChange('username', e.target.value);
                    handleChange('fiverr_username', e.target.value);
                  }}
                  placeholder="e.g. sophia_vanguard"
                  className="cdp-input font-mono text-emerald-700 font-bold"
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="e.g. Vanguard Creative Ltd"
                  className="cdp-input"
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Email Address</label>
                <div className="cdp-input-with-action">
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="cdp-input"
                  />
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.email, 'email')}
                      className="cdp-input-action-btn"
                      title="Copy Email Address"
                    >
                      {copiedField === 'email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Phone Number</label>
                <div className="cdp-input-with-action">
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="cdp-input"
                  />
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.phone, 'phone')}
                      className="cdp-input-action-btn"
                      title="Copy Phone Number"
                    >
                      {copiedField === 'phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Country / Region</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="e.g. UNITED STATES"
                  className="cdp-input uppercase font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Sales, Sourcing & Assignment */}
          <div className="cdp-section-card">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-emerald">
                  <UserCheck size={14} />
                </div>
                <div>
                  <h3 className="cdp-section-title">Sales & Acquisition Pipeline</h3>
                  <p className="cdp-section-sub">Fiverr origin profile, sales executive, and source channel</p>
                </div>
              </div>
            </div>

            <div className="cdp-form-grid-3">
              <div className="cdp-field-group">
                <label className="cdp-label">Assigned Sales Executive</label>
                <CustomSelect
                  value={formData.sales_person_name || 'MD Motiur Rahman Emon'}
                  onChange={(val) => handleChange('sales_person_name', val)}
                  options={salesExecutiveOptions}
                  placeholder="Select Sales Executive..."
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Fiverr Source Profile</label>
                <CustomSelect
                  value={formData.source_profile || 'Kodevio Studio'}
                  onChange={(val) => handleChange('source_profile', val)}
                  options={sourceProfileOptions}
                  placeholder="Select Source Profile..."
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Service Category</label>
                <CustomSelect
                  value={formData.category || 'Web Development'}
                  onChange={(val) => handleChange('category', val)}
                  options={serviceCategoryOptions}
                  placeholder="Select Service Category..."
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Lead Acquisition Source</label>
                <CustomSelect
                  value={formData.source || 'Direct Outreach'}
                  onChange={(val) => handleChange('source', val)}
                  options={acquisitionSourceOptions}
                  placeholder="Select Acquisition Source..."
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Total Past Orders</label>
                <input
                  type="number"
                  value={formData.total_orders || 0}
                  onChange={(e) => handleChange('total_orders', Number(e.target.value))}
                  className="cdp-input font-bold"
                />
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Total Lifetime Value (Spent)</label>
                <input
                  type="text"
                  value={formData.total_spent || '$0'}
                  onChange={(e) => handleChange('total_spent', e.target.value)}
                  placeholder="e.g. $9,200"
                  className="cdp-input font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Client Projects & Active Orders */}
          <div className="cdp-section-card">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-indigo">
                  <FolderKanban size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="cdp-section-title">Client Projects & Orders</h3>
                    {clientProjects.length > 0 && (
                      <span className="cdp-project-count-badge">
                        {clientProjects.length} {clientProjects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    )}
                  </div>
                  <p className="cdp-section-sub">Active client engagements, custom milestones, and order tracking</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingProject(true)}
                className="cdp-btn-add-project"
                title="Add new project or order for this client"
              >
                <Plus size={13} />
                <span>Add Project</span>
              </button>
            </div>

            {/* Project List */}
            {clientProjects.length > 0 ? (
              <div className="cdp-projects-list">
                {clientProjects.map((project) => (
                  <div key={project.id} className="cdp-project-card">
                    <div className="cdp-project-main">
                      <div className="cdp-project-header-row">
                        <span className="cdp-project-id-pill">{project.id || 'PRJ-NEW'}</span>
                        <h4 className="cdp-project-title">{project.title}</h4>
                        <span className="cdp-project-category-badge">{project.category || 'Web Development'}</span>
                      </div>

                      {project.notes && (
                        <p className="cdp-project-notes-snippet">{project.notes}</p>
                      )}

                      <div className="cdp-project-meta-row">
                        {project.totalAmount ? (
                          <div className="cdp-project-meta-item">
                            <DollarSign size={12} className="text-emerald-600" />
                            <span className="font-bold text-slate-800">${Number(project.totalAmount).toLocaleString()}</span>
                          </div>
                        ) : null}

                        {project.deadlineDate && (
                          <div className="cdp-project-meta-item">
                            <Calendar size={12} className="text-slate-400" />
                            <span>Due {new Date(project.deadlineDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {project.fiverrOrderId && (
                          <div className="cdp-project-meta-item font-mono text-[11px] text-slate-500">
                            <span>Ref: #{project.fiverrOrderId}</span>
                          </div>
                        )}

                        {project.orderUrl && (
                          <a
                            href={project.orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cdp-project-order-link"
                          >
                            <ExternalLink size={11} />
                            <span>Order Page</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="cdp-project-actions">
                      <div className="cdp-project-status-select">
                        <CustomSelect
                          value={project.status || 'IN PROGRESS'}
                          onChange={(newSt) => handleUpdateProjectStatus(project.id, newSt)}
                          options={['IN PROGRESS', 'IN REVIEW', 'COMPLETED', 'ON HOLD', 'CANCELLED']}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="cdp-btn-delete-project"
                        title="Delete this project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cdp-projects-empty-state">
                <div className="cdp-projects-empty-icon">
                  <FolderPlus size={20} className="text-indigo-500" />
                </div>
                <div className="cdp-projects-empty-text">
                  <h4 className="font-bold text-slate-800 text-xs">No Projects Added Yet</h4>
                  <p className="text-[11px] text-slate-500">Record a new project, custom offer, or active Fiverr order for this client</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(true)}
                  className="cdp-btn-add-first-project"
                >
                  <Plus size={13} />
                  <span>Create First Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Quick Links & Quotations */}
          <div className="cdp-section-card">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-sky">
                  <Globe size={14} />
                </div>
                <div>
                  <h3 className="cdp-section-title">Fiverr Links & Quotations</h3>
                  <p className="cdp-section-sub">Direct workspace links for instant communication & offers</p>
                </div>
              </div>
            </div>

            <div className="cdp-form-grid-2">
              <div className="cdp-field-group">
                <label className="cdp-label">Fiverr Direct Inbox URL</label>
                <div className="cdp-link-input-row">
                  <input
                    type="url"
                    value={formData.inbox_link || ''}
                    onChange={(e) => handleChange('inbox_link', e.target.value)}
                    placeholder="https://www.fiverr.com/inbox/..."
                    className="cdp-input"
                  />
                  {formData.inbox_link && (
                    <a
                      href={formData.inbox_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cdp-btn-open-link"
                      title="Open Fiverr Inbox"
                    >
                      <ExternalLink size={12} />
                      <span>Open</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="cdp-field-group">
                <label className="cdp-label">Quotation / Custom Offer Link</label>
                <div className="cdp-link-input-row">
                  <input
                    type="url"
                    value={formData.quotation_link || ''}
                    onChange={(e) => handleChange('quotation_link', e.target.value)}
                    placeholder="https://www.fiverr.com/offers/..."
                    className="cdp-input"
                  />
                  {formData.quotation_link && (
                    <a
                      href={formData.quotation_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cdp-btn-open-link"
                      title="View Quotation"
                    >
                      <ExternalLink size={12} />
                      <span>View</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Attachments & Project Files */}
          <div className="cdp-section-card">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-violet">
                  <UploadCloud size={14} />
                </div>
                <div>
                  <h3 className="cdp-section-title">Documents & Project Attachments</h3>
                  <p className="cdp-section-sub">Specifications, requirements, and client briefs</p>
                </div>
              </div>
            </div>

            <div className="cdp-attachment-box">
              <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <div className="cdp-attachment-main">
                {formData.attachment_name ? (
                  <div className="cdp-file-preview-card">
                    <div className="flex items-center gap-2.5">
                      <div className="cdp-file-icon">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="cdp-file-name">{formData.attachment_name}</span>
                        <span className="cdp-file-sub">Attached Client Document</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        className="cdp-btn-file-change"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('attachment_name', '')}
                        className="cdp-btn-file-delete"
                        title="Remove file"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => attachmentInputRef.current?.click()}
                    className="cdp-dropzone-empty"
                  >
                    <UploadCloud size={22} className="text-slate-400 mb-1" />
                    <span className="font-bold text-xs text-slate-700">Click to upload client specification PDF or DOC</span>
                    <span className="text-[10px] text-slate-400">PDF, DOCX, ZIP, PNG, Figma files up to 25MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Briefing & Client Notes */}
          <div className="cdp-section-card cdp-card-notes">
            <div className="cdp-section-header">
              <div className="cdp-section-title-box">
                <div className="cdp-section-icon-badge icon-amber">
                  <FileText size={14} />
                </div>
                <div>
                  <h3 className="cdp-section-title">Requirements & Strategic Notes</h3>
                  <p className="cdp-section-sub">Comprehensive client briefing, meeting recap, and project notes</p>
                </div>
              </div>
            </div>

            <div className="cdp-notes-body">
              <textarea
                rows={4}
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="Write detailed client requirements, conversation takeaways, project timelines, deliverables, or follow-up action items..."
                className="cdp-textarea"
              />
              <div className="cdp-notes-footer">
                <span className="text-[10px] font-semibold text-slate-400">
                  {formData.note ? `${formData.note.length} characters` : 'No notes entered yet'}
                </span>
                <span className="text-[10px] font-medium text-emerald-600">Auto-saved to client dossier</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Meeting Scheduler, Fast Actions, Dossier Stats */}
        <div className="cdp-side-col">
          {/* Card 1: Meeting & Schedule Coordinator */}
          <div className="cdp-side-card">
            <div className="cdp-side-header">
              <div className="cdp-side-icon-badge icon-indigo">
                <Calendar size={14} />
              </div>
              <div>
                <h4 className="cdp-side-title">Meeting & Sync</h4>
                <p className="cdp-side-sub">Coordinate video calls & client sessions</p>
              </div>
            </div>

            {/* Current Meeting Status Box - Ultra Compact & Neat */}
            <div className={`cdp-meeting-status-card ${formData.meeting_time ? 'is-scheduled' : 'is-empty'}`}>
              {formData.meeting_time ? (
                <div className="cdp-meeting-card-content">
                  <div className="cdp-meeting-card-top">
                    <span className="cdp-meeting-badge-label">
                      <span className="cdp-meeting-live-dot" />
                      MEETING SCHEDULED
                    </span>
                    <span className="cdp-meeting-badge-time">
                      {formatMeetingDisplay(formData.meeting_time)}
                    </span>
                  </div>
                  <span className="cdp-meeting-card-sub">Session booked on agency calendar</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <AlertCircle size={13} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold">No meeting scheduled yet</span>
                </div>
              )}
            </div>

            {/* Date & Time Picker */}
            <div className="cdp-meeting-inputs-grid">
              <div>
                <label className="cdp-meeting-mini-label">Meeting Date</label>
                <CustomDatePicker
                  value={meetingDate}
                  onChange={(val) => setMeetingDate(val)}
                  placeholder="Select Date"
                />
              </div>

              <div>
                <label className="cdp-meeting-mini-label">Meeting Time</label>
                <CustomTimePicker
                  value={meetingTime}
                  onChange={(val) => setMeetingTime(val)}
                  placeholder="Select Time"
                />
              </div>
            </div>

            {/* Meeting Actions */}
            <div className="cdp-meeting-actions-stack">
              <button
                type="button"
                onClick={handleSaveMeeting}
                className="cdp-btn-meeting-primary"
              >
                <Calendar size={12} />
                <span>{formData.meeting_time ? 'Update Meeting' : 'Schedule Meeting'}</span>
              </button>

              <div className="cdp-meeting-actions-2col">
                <button
                  type="button"
                  onClick={handleSetMeetingNow}
                  className="cdp-btn-meeting-instant"
                  title="Schedule meeting right now"
                >
                  <Video size={11} />
                  <span>Start Now</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkMeetingDone}
                  className="cdp-btn-meeting-done"
                  title="Mark meeting completed"
                >
                  <CheckCircle size={11} />
                  <span>Done</span>
                </button>
              </div>

              {formData.meeting_time && (
                <button
                  type="button"
                  onClick={handleClearMeeting}
                  className="cdp-btn-meeting-clear"
                >
                  <Trash2 size={11} />
                  <span>Clear Schedule</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Account Dossier Overview */}
          <div className="cdp-side-card">
            <div className="cdp-side-header">
              <div className="cdp-side-icon-badge icon-emerald">
                <ShieldCheck size={14} />
              </div>
              <div>
                <h4 className="cdp-side-title">Client Account Dossier</h4>
                <p className="cdp-side-sub">Agency record metrics & stats</p>
              </div>
            </div>

            <div className="cdp-dossier-stats-list">
              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Client ID</span>
                <span className="cdp-dossier-val font-mono">{formData.id || 'N/A'}</span>
              </div>

              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Lifecycle Stage</span>
                <span className="cdp-dossier-val text-emerald-700 font-bold">{formData.status || 'SUBMITTED'}</span>
              </div>

              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Total Orders</span>
                <span className="cdp-dossier-val font-extrabold">{formData.total_orders || 0} Orders</span>
              </div>

              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Lifetime Value (LTV)</span>
                <span className="cdp-dossier-val font-extrabold text-slate-900">{formData.total_spent || '$0'}</span>
              </div>

              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Sales Exec</span>
                <span className="cdp-dossier-val font-semibold truncate max-w-[140px] text-right" title={formData.sales_person_name}>
                  {formData.sales_person_name || 'MD Motiur Rahman Emon'}
                </span>
              </div>

              <div className="cdp-dossier-item">
                <span className="cdp-dossier-label">Profile Origin</span>
                <span className="cdp-dossier-val font-semibold truncate max-w-[140px] text-right" title={formData.source_profile}>
                  {formData.source_profile || 'Kodevio Studio'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Action Bar */}
          <div className="cdp-side-card">
            <div className="cdp-side-header">
              <div className="cdp-side-icon-badge icon-sky">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="cdp-side-title">Quick Actions</h4>
                <p className="cdp-side-sub">Frequent shortcuts</p>
              </div>
            </div>

            <div className="cdp-quick-actions-stack">
              <button
                type="button"
                onClick={() => {
                  const summary = `Client: ${formData.name || formData.username} | Username: @${formData.username || formData.fiverr_username} | Status: ${formData.status} | Country: ${formData.country} | Exec: ${formData.sales_person_name}`;
                  handleCopy(summary, 'summary');
                }}
                className="cdp-quick-act-btn"
              >
                {copiedField === 'summary' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedField === 'summary' ? 'Summary Copied!' : 'Copy Client Summary'}</span>
              </button>

              {formData.inbox_link && (
                <a
                  href={formData.inbox_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cdp-quick-act-btn"
                >
                  <ExternalLink size={13} />
                  <span>Open Fiverr Inbox</span>
                </a>
              )}

              {formData.email && (
                <a
                  href={`mailto:${formData.email}`}
                  className="cdp-quick-act-btn"
                >
                  <Mail size={13} />
                  <span>Compose Email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ── Fixed Full-Width Sticky Bottom Bar (Docked Edge-to-Edge) ── */}
      <div className="cdp-sticky-footer">
        <div className="cdp-footer-left">
          <button
            type="button"
            onClick={onBack}
            className="cdp-btn-discard"
            title="Return to Clients List"
          >
            <ArrowLeft size={13} />
            <span>Back to Clients Table</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete && onDelete(formData)}
            className="cdp-btn-delete-footer"
            title="Delete this client account"
          >
            <Trash2 size={13} />
            <span>Delete Account</span>
          </button>
        </div>

        <div className="cdp-footer-right">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...client });
              if (client?.meeting_time) {
                const parts = client.meeting_time.split(' ');
                if (parts[0]) setMeetingDate(parts[0]);
                if (parts[1]) setMeetingTime(parts[1]);
              }
              if (onShowToast) onShowToast();
            }}
            className="cdp-btn-discard"
            title="Revert modifications"
          >
            <RotateCcw size={13} />
            <span>Discard Changes</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="cdp-btn-save-primary"
            title="Save client profile"
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving Changes…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
