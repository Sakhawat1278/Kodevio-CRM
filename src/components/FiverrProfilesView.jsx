import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Globe,
  Trash2,
  Upload,
  ExternalLink,
  Award,
  Briefcase,
  User,
  CheckCircle2,
  Edit2,
  UploadCloud,
  DownloadCloud,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Eye,
  FolderKanban,
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import { fiverrProfilesApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';

export const SELLER_LEVEL_OPTIONS = [
  'Top Rated Seller',
  'Pro Verified',
  'Level 2 Seller',
  'Level 1 Seller',
  'Rising Talent',
  'New Seller',
];

export const PROFILE_STATUS_OPTIONS = [
  'ACTIVE',
  'TOP PERFORMER',
  'IN REVIEW',
  'PAUSED',
  'VACATION',
];

export const NICHE_OPTIONS = [
  'Web & App Development',
  'UI/UX & Mobile Design',
  'SEO & Performance Marketing',
  'AI & Automation Services',
  'Full-Stack Development',
  'CMS & E-Commerce',
  'Graphic Design & Branding',
  'Video & Motion Graphics',
];

export default function FiverrProfilesView({ onShowToast, onSyncDatabase, isSyncing, user, onProfilesChange }) {
  const [profiles, setProfilesRaw] = useState([]);
  const setProfiles = (val) => {
    const next = typeof val === 'function' ? val(profiles) : val;
    setProfilesRaw(next);
    if (onProfilesChange) onProfilesChange(next);
  };

  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalProfile, setEditModalProfile] = useState(null);
  const [viewModalProfile, setViewModalProfile] = useState(null);
  const [deleteModalProfile, setDeleteModalProfile] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'grid' (main default) | 'table'

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('All Seller Levels');
  const [filterNiche, setFilterNiche] = useState('All Niches');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

  const importInputRef = useRef(null);

  // New Profile Form State (Streamlined)
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    username: '',
    level: 'Top Rated Seller',
    badgeClass: 'badge-top-rated',
    niche: 'Web & App Development',
    avatar: '',
    profileUrl: '',
    status: 'ACTIVE',
  });

  // Load profiles from backend API
  useEffect(() => {
    const fetchProfilesData = async () => {
      setLoading(true);
      try {
        const res = await fiverrProfilesApi.fetchProfiles();
        if (res?.profiles && Array.isArray(res.profiles) && res.profiles.length > 0) {
          setProfiles(res.profiles);
        } else {
          // Default clean seed profiles
          setProfiles([]);
        }
      } catch (err) {
        console.warn('Failed to fetch Fiverr profiles, using local state:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfilesData();
  }, []);

  // Broadcast & persist profile updates
  useEffect(() => {
    if (profiles.length > 0) {
      LiveSyncEngine.broadcast('fiverr_profiles', profiles);
    }
  }, [profiles]);

  // Filter profiles based on active filters
  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.niche && p.niche.toLowerCase().includes(q));

    const matchesLevel =
      filterLevel === 'All Seller Levels' ||
      (p.level && p.level.toLowerCase().trim() === filterLevel.toLowerCase().trim());

    const matchesNiche =
      filterNiche === 'All Niches' ||
      (p.niche && p.niche.toLowerCase().trim() === filterNiche.toLowerCase().trim());

    const matchesStatus =
      filterStatus === 'All Statuses' ||
      (p.status && p.status.toUpperCase().trim() === filterStatus.toUpperCase().trim()) ||
      (!p.status && filterStatus === 'ACTIVE');

    return matchesSearch && matchesLevel && matchesNiche && matchesStatus;
  });

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredProfiles.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    for (const id of selectedIds) {
      try {
        await fiverrProfilesApi.deleteProfile(id);
      } catch (err) {
        console.warn('Bulk delete profile error:', err.message);
      }
    }
    setProfiles(profiles.filter((p) => !selectedIds.includes(p.id)));
    setSelectedIds([]);
    if (onShowToast) onShowToast();
  };

  const handleUpdateProfileStatus = async (id, newStatus) => {
    try {
      await fiverrProfilesApi.updateProfile(id, { status: newStatus });
      setProfiles(profiles.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      if (onShowToast) onShowToast();
    } catch (err) {
      console.warn('Update status error, updating optimistic local state:', err);
      setProfiles(profiles.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setNewProfileForm((prev) => ({ ...prev, avatar: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditAvatarFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && editModalProfile) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setEditModalProfile((prev) => ({ ...prev, avatar: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getBadgeClassForLevel = (lvl) => {
    const l = (lvl || '').toLowerCase();
    if (l.includes('top')) return 'badge-top-rated';
    if (l.includes('pro')) return 'badge-pro';
    if (l.includes('level 2')) return 'badge-level-2';
    if (l.includes('level 1')) return 'badge-level-1';
    if (l.includes('rising')) return 'badge-rising';
    return 'badge-new';
  };

  const handleAddProfileSubmit = async (e) => {
    e.preventDefault();
    if (!newProfileForm.name || !newProfileForm.username) return;

    const cleanUsername = newProfileForm.username.trim().replace('@', '');
    const badgeClass = getBadgeClassForLevel(newProfileForm.level);
    const profilePayload = {
      ...newProfileForm,
      username: cleanUsername,
      badgeClass,
      profileUrl: newProfileForm.profileUrl || `https://www.fiverr.com/${cleanUsername}`,
    };

    try {
      const res = await fiverrProfilesApi.createProfile(profilePayload);
      if (res?.profile) {
        setProfiles([res.profile, ...profiles]);
      } else {
        const fallbackProfile = {
          id: `fp-${Date.now()}`,
          ...profilePayload,
          created_at: new Date().toISOString(),
        };
        setProfiles([fallbackProfile, ...profiles]);
      }

      setIsAddModalOpen(false);
      setNewProfileForm({
        name: '',
        username: '',
        level: 'Top Rated Seller',
        badgeClass: 'badge-top-rated',
        niche: 'Web & App Development',
        avatar: '',
        profileUrl: '',
        status: 'ACTIVE',
      });
      if (onShowToast) onShowToast();
    } catch (err) {
      console.error('Failed to create profile:', err);
      const fallbackProfile = {
        id: `fp-${Date.now()}`,
        ...profilePayload,
        created_at: new Date().toISOString(),
      };
      setProfiles([fallbackProfile, ...profiles]);
      setIsAddModalOpen(false);
      if (onShowToast) onShowToast();
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editModalProfile?.id) return;

    const cleanUsername = editModalProfile.username.trim().replace('@', '');
    const badgeClass = getBadgeClassForLevel(editModalProfile.level);
    const updatedPayload = {
      ...editModalProfile,
      username: cleanUsername,
      badgeClass,
      profileUrl: editModalProfile.profileUrl || `https://www.fiverr.com/${cleanUsername}`,
    };

    try {
      await fiverrProfilesApi.updateProfile(editModalProfile.id, updatedPayload);
      setProfiles(profiles.map((p) => (p.id === editModalProfile.id ? updatedPayload : p)));
      setEditModalProfile(null);
      if (onShowToast) onShowToast();
    } catch (err) {
      console.warn('Edit profile API error, updating optimistic local state:', err);
      setProfiles(profiles.map((p) => (p.id === editModalProfile.id ? updatedPayload : p)));
      setEditModalProfile(null);
      if (onShowToast) onShowToast();
    }
  };

  const handleDeleteProfile = async (id) => {
    try {
      await fiverrProfilesApi.deleteProfile(id);
      setProfiles(profiles.filter((p) => p.id !== id));
      setDeleteModalProfile(null);
      if (onShowToast) onShowToast();
    } catch (err) {
      console.error('Failed to delete profile:', err);
      setProfiles(profiles.filter((p) => p.id !== id));
      setDeleteModalProfile(null);
      if (onShowToast) onShowToast();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Display Name',
      'Fiverr Username',
      'Seller Level',
      'Primary Niche',
      'Status',
      'Profile URL',
      'Created At',
    ];
    const rows = filteredProfiles.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.username || '').replace(/"/g, '""')}"`,
      `"${(p.level || '').replace(/"/g, '""')}"`,
      `"${(p.niche || '').replace(/"/g, '""')}"`,
      `"${(p.status || 'ACTIVE').replace(/"/g, '""')}"`,
      `"${(p.profileUrl || '').replace(/"/g, '""')}"`,
      `"${p.created_at || new Date().toISOString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fiverr_seller_profiles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast();
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        let imported = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          imported = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Parse CSV
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const dataRows = lines.slice(1);
            imported = dataRows.map((line, idx) => {
              const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
              return {
                id: `fp-import-${Date.now()}-${idx}`,
                name: cols[0] || 'Imported Seller',
                username: (cols[1] || 'seller_pro').replace('@', ''),
                level: cols[2] || 'Level 2 Seller',
                badgeClass: getBadgeClassForLevel(cols[2] || 'Level 2 Seller'),
                niche: cols[3] || 'Web & App Development',
                status: cols[4] || 'ACTIVE',
                profileUrl: cols[5] || `https://www.fiverr.com/${(cols[1] || 'seller_pro').replace('@', '')}`,
                created_at: cols[6] || new Date().toISOString(),
              };
            });
          }
        }

        if (imported.length > 0) {
          setProfiles([...imported, ...profiles]);
          if (onShowToast) onShowToast();
        }
      } catch (err) {
        console.error('Failed to import profiles:', err);
      }
    };
    reader.readAsText(file);
  };

  const getProfileInitials = (name) => {
    if (!name) return 'FP';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  };

  const renderLevelBadge = (level) => {
    const l = (level || 'New Seller').toLowerCase();
    if (l.includes('top')) {
      return (
        <span className="fp-level-pill fp-level-top-rated">
          <Award size={11} className="flex-shrink-0" />
          <span>Top Rated</span>
        </span>
      );
    }
    if (l.includes('pro')) {
      return (
        <span className="fp-level-pill fp-level-pro">
          <ShieldCheck size={11} className="flex-shrink-0" />
          <span>Pro Verified</span>
        </span>
      );
    }
    if (l.includes('level 2')) {
      return (
        <span className="fp-level-pill fp-level-2">
          <Sparkles size={11} className="flex-shrink-0" />
          <span>Level 2</span>
        </span>
      );
    }
    if (l.includes('level 1')) {
      return (
        <span className="fp-level-pill fp-level-1">
          <CheckCircle2 size={11} className="flex-shrink-0" />
          <span>Level 1</span>
        </span>
      );
    }
    if (l.includes('rising')) {
      return (
        <span className="fp-level-pill fp-level-rising">
          <TrendingUp size={11} className="flex-shrink-0" />
          <span>Rising Star</span>
        </span>
      );
    }
    return (
      <span className="fp-level-pill fp-level-new">
        <User size={11} className="flex-shrink-0" />
        <span>New Seller</span>
      </span>
    );
  };

  return (
    <div className="cli-fullwidth-container">
      {/* 1. SECONDARY SEARCH & FILTER ACTION TOOLBAR */}
      <div className="cli-sub-toolbar">
        <div className="cli-sub-toolbar-left">
          {/* Search Box */}
          <div className="cli-pill-search-box">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seller or niche..."
              className="cli-pill-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer pr-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="min-w-[145px]">
            <CustomSelect
              size="compact"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={['All Statuses', ...PROFILE_STATUS_OPTIONS]}
              placeholder="Status"
            />
          </div>

          {/* Seller Level Filter */}
          <div className="min-w-[160px]">
            <CustomSelect
              size="compact"
              value={filterLevel}
              onChange={(val) => setFilterLevel(val)}
              options={['All Seller Levels', ...SELLER_LEVEL_OPTIONS]}
              placeholder="Seller Level"
            />
          </div>

          {/* Primary Niche Filter */}
          <div className="min-w-[170px]">
            <CustomSelect
              size="compact"
              value={filterNiche}
              onChange={(val) => setFilterNiche(val)}
              options={['All Niches', ...NICHE_OPTIONS]}
              placeholder="Primary Niche"
            />
          </div>
        </div>

        <div className="cli-sub-toolbar-right">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv, .json"
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
          />

          {/* Table / Grid Mode Toggle */}
          <div className="cli-viewmode-toggle">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`cli-viewmode-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table Directory View"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`cli-viewmode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
            >
              <Grid size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => importInputRef.current && importInputRef.current.click()}
            className="cli-action-btn-outlined"
            title="Import Fiverr Profiles from CSV/JSON"
          >
            <UploadCloud size={14} />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="cli-action-btn-outlined"
            title="Export Profiles Database as CSV"
          >
            <DownloadCloud size={14} />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="cli-btn-add-lead"
          >
            <Plus size={15} />
            <span>Add Profile</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT: CLEAN GRID OR TABLE VIEW */}
      {viewMode === 'grid' ? (
        <div className="fp-cards-grid">
          {loading ? (
            <div className="text-center py-12 text-slate-400" style={{ gridColumn: '1 / -1' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
                <span>Loading Seller Profiles...</span>
              </div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="prj-empty-table-cell" style={{ gridColumn: '1 / -1', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '3.75rem 1.5rem', width: '100%' }}>
              <div className="prj-empty-inner">
                <FolderKanban size={34} className="prj-empty-icon" />
                <h3 className="prj-empty-title">No seller profiles found</h3>
                <p className="prj-empty-desc">
                  {searchQuery || (filterLevel && filterLevel !== 'All Seller Levels') || (filterNiche && filterNiche !== 'All Niches') || (filterStatus && filterStatus !== 'All Statuses')
                    ? 'No seller profiles matched your active search filters. Try clearing filters.'
                    : 'There are no seller profiles in your workspace. Click "+ Add Profile" to create a new profile.'}
                </p>
              </div>
            </div>
          ) : (
            filteredProfiles.map((prof) => {
              const isSelected = selectedIds.includes(prof.id);
              return (
                <div key={prof.id} className={`fp-profile-card ${isSelected ? 'is-selected' : ''}`}>
                  <div>
                    {/* Card Header: Checkbox + Avatar, Name, Handle, Level Badge */}
                    <div className="fp-card-header">
                      <div className="fp-card-user-left">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(prof.id)}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        {prof.avatar ? (
                          <img
                            src={prof.avatar}
                            alt={prof.name}
                            className="fp-card-avatar"
                          />
                        ) : (
                          <div className="fp-card-avatar-fallback">
                            {getProfileInitials(prof.name)}
                          </div>
                        )}
                        <div className="fp-card-user-meta">
                          <h3 className="fp-card-title">{prof.name}</h3>
                          <span className="fp-card-handle">@{prof.username}</span>
                        </div>
                      </div>
                      <div>{renderLevelBadge(prof.level)}</div>
                    </div>

                    {/* Middle Info Strip: Niche Badge & Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', marginBottom: '0.95rem' }}>
                      <div className="fp-card-niche-strip" style={{ margin: 0 }}>
                        <Briefcase size={11} />
                        <span>{prof.niche || 'Web & App Development'}</span>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: (prof.status || 'ACTIVE') === 'ACTIVE' ? '#ECFDF5' : '#F1F5F9',
                          color: (prof.status || 'ACTIVE') === 'ACTIVE' ? '#047857' : '#475569',
                          border: (prof.status || 'ACTIVE') === 'ACTIVE' ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {prof.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Visit Link + Action Icons */}
                  <div className="fp-card-footer-row">
                    <a
                      href={prof.profileUrl || `https://www.fiverr.com/${prof.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cli-inbox-pill-btn"
                    >
                      <Globe size={13} />
                      <span>VISIT PROFILE</span>
                    </a>

                    <div className="fp-card-actions-right">
                      <button
                        type="button"
                        onClick={() => setViewModalProfile(prof)}
                        className="cli-view-btn"
                        title="View Details"
                      >
                        VIEW
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalProfile({ ...prof })}
                        className="cli-act-btn edit-btn"
                        title="Edit Profile"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalProfile(prof)}
                        className="cli-act-btn delete-btn"
                        title="Delete Profile"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE DIRECTORY VIEW */
        <div className="w-full overflow-x-auto">
          <table className="cli-clone-table">
            <thead>
              <tr>
                <th className="cli-clone-th w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredProfiles.length > 0 && selectedIds.length === filteredProfiles.length}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="cli-clone-th">PROFILE IDENTITY</th>
                <th className="cli-clone-th">SELLER LEVEL</th>
                <th className="cli-clone-th">PRIMARY NICHE</th>
                <th className="cli-clone-th">STATUS</th>
                <th className="cli-clone-th">FIVERR LINK</th>
                <th className="cli-clone-th">DATE ADDED</th>
                <th className="cli-clone-th text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="cli-clone-td text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
                      <span>Loading Seller Profiles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="prj-empty-table-cell">
                    <div className="prj-empty-inner">
                      <FolderKanban size={34} className="prj-empty-icon" />
                      <h3 className="prj-empty-title">No seller profiles found</h3>
                      <p className="prj-empty-desc">
                        {searchQuery || (filterLevel && filterLevel !== 'All Seller Levels') || (filterNiche && filterNiche !== 'All Niches') || (filterStatus && filterStatus !== 'All Statuses')
                          ? 'No seller profiles matched your active search filters. Try clearing filters.'
                          : 'There are no seller profiles in your workspace. Click "+ Add Profile" to create a new profile.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((prof) => {
                  const isSelected = selectedIds.includes(prof.id);
                  const formattedDate = prof.created_at
                    ? new Date(prof.created_at).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '8/15/2026';

                  return (
                    <tr key={prof.id} className={`cli-clone-tr ${isSelected ? 'is-selected' : ''}`}>
                      {/* Selection Checkbox */}
                      <td className="cli-clone-td">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(prof.id)}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. PROFILE IDENTITY (Avatar 24px + Display Name on top, @username handle underneath) */}
                      <td className="cli-clone-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {prof.avatar ? (
                            <img
                              src={prof.avatar}
                              alt={prof.name}
                              style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                minHeight: '24px',
                                maxWidth: '24px',
                                maxHeight: '24px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                              className="border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                minHeight: '24px',
                                maxWidth: '24px',
                                maxHeight: '24px',
                                borderRadius: '50%',
                              }}
                              className="bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[10px] border border-emerald-300 flex-shrink-0"
                            >
                              {getProfileInitials(prof.name)}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="font-extrabold text-slate-900 text-xs uppercase block leading-tight">
                              {prof.name}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 block leading-tight">
                              @{prof.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. SELLER LEVEL (Styled Level Pill) */}
                      <td className="cli-clone-td">
                        {renderLevelBadge(prof.level)}
                      </td>

                      {/* 3. PRIMARY NICHE */}
                      <td className="cli-clone-td">
                        <span className="font-extrabold text-slate-900 text-xs uppercase block leading-tight">
                          {prof.niche || 'WEB & APP DEVELOPMENT'}
                        </span>
                      </td>

                      {/* 4. STATUS (Interactive Inline CustomSelect) */}
                      <td className="cli-clone-td">
                        <div className="min-w-[140px]">
                          <CustomSelect
                            size="compact"
                            value={prof.status || 'ACTIVE'}
                            onChange={(newStatus) => handleUpdateProfileStatus(prof.id, newStatus)}
                            options={PROFILE_STATUS_OPTIONS}
                            placeholder="Status"
                          />
                        </div>
                      </td>

                      {/* 5. FIVERR LINK (Exact Inbox-Style Pill) */}
                      <td className="cli-clone-td">
                        <a
                          href={prof.profileUrl || `https://www.fiverr.com/${prof.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cli-inbox-pill-btn"
                        >
                          <Globe size={13} />
                          <span>VISIT PROFILE</span>
                        </a>
                      </td>

                      {/* 6. DATE ADDED */}
                      <td className="cli-clone-td">
                        <span className="text-xs font-bold text-slate-700">
                          {formattedDate}
                        </span>
                      </td>

                      {/* 7. ACTIONS */}
                      <td className="cli-clone-td text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewModalProfile(prof)}
                            className="cli-view-btn"
                            title="View Profile Details"
                          >
                            VIEW
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditModalProfile({ ...prof })}
                            className="cli-act-btn edit-btn"
                            title="Edit Profile"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalProfile(prof)}
                            className="cli-act-btn delete-btn"
                            title="Delete Profile"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. ADD FIVERR PROFILE POPUP MODAL (STREAMLINED) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-details-modal-card"
            >
              {/* Sticky Header */}
              <div className="cli-modal-header-sticky">
                <div className="flex items-center gap-3">
                  <div
                    className="cli-modal-avatar-circle"
                    style={{
                      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                      border: '1.5px solid #A7F3D0',
                      color: '#059669',
                      boxShadow: '0 2px 5px rgba(5, 150, 105, 0.15)',
                    }}
                  >
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      Add New Fiverr Profile
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Enter seller account credentials, level, and primary category
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cli-panel-close-btn"
                  title="Close Form"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form
                onSubmit={handleAddProfileSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <User size={14} className="text-slate-600" />
                    <span>Profile Credentials &amp; Classification</span>
                  </h4>
                  <div className="cli-form-grid-3col">
                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Display Name / Studio Title</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newProfileForm.name}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, name: e.target.value })}
                        placeholder="e.g. Kodevio Software Studio"
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Fiverr Username</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <div className="cli-input-prefix-box">
                        <span className="cli-input-prefix-text">@</span>
                        <input
                          type="text"
                          required
                          value={newProfileForm.username}
                          onChange={(e) => setNewProfileForm({ ...newProfileForm, username: e.target.value })}
                          placeholder="kodevio_dev"
                          className="cli-input cli-input-prefixed font-mono text-emerald-700 font-bold"
                        />
                      </div>
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Avatar Image Upload</span>
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0 0.75rem',
                          height: '36px',
                          background: '#FFFFFF',
                          border: '1.5px dashed #CBD5E1',
                          borderRadius: '9px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: newProfileForm.avatar ? '#1E293B' : '#94A3B8',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Upload size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {newProfileForm.avatar ? 'Avatar Attached' : 'Upload Avatar'}
                        </span>
                        {newProfileForm.avatar && (
                          <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 800, flexShrink: 0 }}>✓</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Seller Level</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newProfileForm.level}
                        onChange={(val) => setNewProfileForm({ ...newProfileForm, level: val })}
                        options={SELLER_LEVEL_OPTIONS}
                        placeholder="Select Level"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Primary Niche / Category</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newProfileForm.niche}
                        onChange={(val) => setNewProfileForm({ ...newProfileForm, niche: val })}
                        options={NICHE_OPTIONS}
                        placeholder="Select Niche"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Account Status</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newProfileForm.status}
                        onChange={(val) => setNewProfileForm({ ...newProfileForm, status: val })}
                        options={PROFILE_STATUS_OPTIONS}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>
                </div>

                <div className="cli-details-section-orange">
                  <h4 className="cli-details-section-header-orange">
                    <Globe size={14} className="text-orange-600" />
                    <span>Direct Fiverr URL (Optional)</span>
                  </h4>
                  <div className="cli-field-group">
                    <input
                      type="text"
                      value={newProfileForm.profileUrl}
                      onChange={(e) => setNewProfileForm({ ...newProfileForm, profileUrl: e.target.value })}
                      placeholder="https://www.fiverr.com/username"
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
                    onClick={() => setIsAddModalOpen(false)}
                    className="fp-btn-cancel-compact"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cli-btn-add-lead">
                    <Plus size={14} />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. EDIT PROFILE POPUP MODAL (STREAMLINED) */}
      <AnimatePresence>
        {editModalProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditModalProfile(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-details-modal-card"
            >
              <div className="cli-modal-header-sticky">
                <div className="flex items-center gap-3">
                  <div
                    className="cli-modal-avatar-circle"
                    style={{
                      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                      border: '1.5px solid #C7D2FE',
                      color: '#4F46E5',
                    }}
                  >
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      Edit Fiverr Profile
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Update credentials, level, and category for @{editModalProfile.username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalProfile(null)}
                  className="cli-panel-close-btn"
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleEditProfileSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <User size={14} className="text-slate-600" />
                    <span>Seller Identity &amp; Classification</span>
                  </h4>
                  <div className="cli-form-grid-3col">
                    <div className="cli-field-group">
                      <label className="cli-field-label">Display Name</label>
                      <input
                        type="text"
                        required
                        value={editModalProfile.name || ''}
                        onChange={(e) => setEditModalProfile({ ...editModalProfile, name: e.target.value })}
                        className="cli-input"
                      />
                    </div>
                    <div className="cli-field-group">
                      <label className="cli-field-label">Fiverr Username</label>
                      <div className="cli-input-prefix-box">
                        <span className="cli-input-prefix-text">@</span>
                        <input
                          type="text"
                          required
                          value={editModalProfile.username || ''}
                          onChange={(e) => setEditModalProfile({ ...editModalProfile, username: e.target.value })}
                          className="cli-input cli-input-prefixed font-mono text-emerald-700 font-bold"
                        />
                      </div>
                    </div>
                    <div className="cli-field-group">
                      <label className="cli-field-label">Avatar Image</label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0 0.75rem',
                          height: '36px',
                          background: '#FFFFFF',
                          border: '1.5px dashed #CBD5E1',
                          borderRadius: '9px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: editModalProfile.avatar ? '#1E293B' : '#94A3B8',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Upload size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {editModalProfile.avatar ? 'Change Avatar' : 'Upload Avatar'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditAvatarFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">Seller Level</label>
                      <CustomSelect
                        size="compact"
                        value={editModalProfile.level || 'Level 2 Seller'}
                        onChange={(val) => setEditModalProfile({ ...editModalProfile, level: val })}
                        options={SELLER_LEVEL_OPTIONS}
                        placeholder="Seller Level"
                      />
                    </div>
                    <div className="cli-field-group">
                      <label className="cli-field-label">Primary Niche</label>
                      <CustomSelect
                        size="compact"
                        value={editModalProfile.niche || 'Web & App Development'}
                        onChange={(val) => setEditModalProfile({ ...editModalProfile, niche: val })}
                        options={NICHE_OPTIONS}
                        placeholder="Niche"
                      />
                    </div>
                    <div className="cli-field-group">
                      <label className="cli-field-label">Status</label>
                      <CustomSelect
                        size="compact"
                        value={editModalProfile.status || 'ACTIVE'}
                        onChange={(val) => setEditModalProfile({ ...editModalProfile, status: val })}
                        options={PROFILE_STATUS_OPTIONS}
                        placeholder="Status"
                      />
                    </div>
                  </div>
                </div>

                <div className="cli-details-section-orange">
                  <h4 className="cli-details-section-header-orange">
                    <Globe size={14} className="text-orange-600" />
                    <span>Direct Fiverr URL</span>
                  </h4>
                  <div className="cli-field-group">
                    <input
                      type="text"
                      value={editModalProfile.profileUrl || ''}
                      onChange={(e) => setEditModalProfile({ ...editModalProfile, profileUrl: e.target.value })}
                      className="cli-input"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditModalProfile(null)}
                    className="fp-btn-cancel-compact"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cli-btn-add-lead">
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. VIEW PROFILE DETAILS POPUP MODAL */}
      <AnimatePresence>
        {viewModalProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewModalProfile(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-details-modal-card"
            >
              {/* Header */}
              <div className="cli-modal-header-sticky">
                <div className="flex items-center gap-3">
                  {viewModalProfile.avatar ? (
                    <img
                      src={viewModalProfile.avatar}
                      alt={viewModalProfile.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                      className="border-2 border-emerald-200 flex-shrink-0"
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                      }}
                      className="bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm border-2 border-emerald-300 flex-shrink-0"
                    >
                      {getProfileInitials(viewModalProfile.name)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {viewModalProfile.name}
                      </h3>
                      {renderLevelBadge(viewModalProfile.level)}
                    </div>
                    <p className="text-xs font-mono text-emerald-600 font-bold">
                      @{viewModalProfile.username} • {viewModalProfile.niche}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewModalProfile(null)}
                  className="cli-panel-close-btn"
                  title="Close Details"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Details Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <Briefcase size={14} className="text-slate-600" />
                    <span>Account Overview</span>
                  </h4>
                  <div className="cli-form-grid-2col" style={{ fontSize: '0.82rem' }}>
                    <div>
                      <span className="text-slate-400 font-semibold block text-xs">Seller Level:</span>
                      <span className="text-slate-800 font-bold">{viewModalProfile.level || 'Top Rated Seller'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-xs">Primary Category:</span>
                      <span className="text-slate-800 font-bold">{viewModalProfile.niche || 'Web & App Development'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-xs">Account Status:</span>
                      <span className="text-emerald-700 font-extrabold">{viewModalProfile.status || 'ACTIVE'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-xs">Date Added:</span>
                      <span className="text-slate-800 font-bold">
                        {viewModalProfile.created_at
                          ? new Date(viewModalProfile.created_at).toLocaleDateString()
                          : 'August 15, 2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #EAECF0',
                }}
              >
                <a
                  href={viewModalProfile.profileUrl || `https://www.fiverr.com/${viewModalProfile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cli-inbox-pill-btn"
                >
                  <Globe size={14} />
                  <span>Open Fiverr Seller Profile ↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => setViewModalProfile(null)}
                  className="fp-btn-cancel-compact"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteModalProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteModalProfile(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div
                    className="cli-modal-icon-badge"
                    style={{
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                    }}
                  >
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete Fiverr Profile</h3>
                    <p className="cli-modal-sub-text">
                      Are you sure you want to remove this seller account?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalProfile(null)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#7F1D1D',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Are you sure you want to remove{' '}
                  <strong style={{ color: '#991B1B' }}>
                    {deleteModalProfile.name} (@{deleteModalProfile.username})
                  </strong>{' '}
                  from your agency directory? This action cannot be undone.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.6rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setDeleteModalProfile(null)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(deleteModalProfile.id)}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete Profile</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. FLOATING BOTTOM BULK SELECTION PILL BAR */}
      {selectedIds.length > 0 && (
        <div className="cli-floating-selection-bar">
          <span className="font-bold whitespace-nowrap flex-shrink-0">Selected: {selectedIds.length}</span>
          <span className="text-slate-600 flex-shrink-0">|</span>

          <button
            type="button"
            onClick={handleBulkDelete}
            className="cli-floating-item-btn text-red-400 hover:text-red-300"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="cli-floating-discard-btn"
          >
            Discard
          </button>
        </div>
      )}

      {/* 8. BULK DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBulkDeleteConfirm(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div
                    className="cli-modal-icon-badge"
                    style={{
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                    }}
                  >
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">
                      Delete {selectedIds.length} Profile{selectedIds.length > 1 ? 's' : ''}?
                    </h3>
                    <p className="cli-modal-sub-text">
                      Selected Fiverr seller profiles will be permanently removed
                    </p>
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

              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#7F1D1D',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  You are about to permanently delete{' '}
                  <strong style={{ color: '#991B1B' }}>
                    {selectedIds.length} selected Fiverr profile
                    {selectedIds.length > 1 ? 's' : ''}
                  </strong>
                  . All associated configuration will be removed.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.6rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
