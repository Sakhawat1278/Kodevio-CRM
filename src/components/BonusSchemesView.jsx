import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Award,
  TrendingUp,
  Settings2,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Sparkles,
  Layers,
  RotateCcw
} from 'lucide-react';
import { bonusSchemesApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';
import CustomSelect from './common/CustomSelect';

export default function BonusSchemesView({ user, onShowToast }) {
  const [selectedDept, setSelectedDept] = useState('SALES'); // 'SALES' | 'OPERATIONS'
  const [grades, setGrades] = useState([]);
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [isEditSchemeModalOpen, setIsEditSchemeModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);

  // Add Grade Form
  const [newGradeForm, setNewGradeForm] = useState({
    gradeName: '',
    minSalary: 20000,
    maxSalary: 35000,
    description: '',
  });

  // Edit Scheme Modal Form (Image 2)
  const [editSchemeForm, setEditSchemeForm] = useState({
    id: '',
    department: 'OPERATIONS',
    gradeName: 'Grade-1',
    minSalary: 35000,
    maxSalary: 40000,
    minTarget: 1600,
    minBonus: 1100,
    description: '',
    levels: []
  });

  // Load Bonus Schemes Data from API
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await bonusSchemesApi.fetchBonusSchemes();
      if (res?.success) {
        setGrades(res.grades || []);
        setEligibleEmployees(res.eligibleEmployees || []);
      }
    } catch (err) {
      console.warn('Bonus schemes load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit Scheme Modal
  const handleOpenEditSchemeModal = (grade) => {
    const defaultLevels = grade.levels && grade.levels.length > 0 ? grade.levels : [
      { level: 1, targetAmount: 1800, bonusAmount: 2200 },
      { level: 2, targetAmount: 2000, bonusAmount: 2500 },
      { level: 3, targetAmount: 2200, bonusAmount: 2800 },
      { level: 4, targetAmount: 2400, bonusAmount: 3100 },
      { level: 5, targetAmount: 2600, bonusAmount: 3400 },
      { level: 6, targetAmount: 2800, bonusAmount: 3700 },
      { level: 7, targetAmount: 3000, bonusAmount: 4000 },
      { level: 8, targetAmount: 3200, bonusAmount: 4300 },
      { level: 9, targetAmount: 3400, bonusAmount: 4600 },
      { level: 10, targetAmount: 3600, bonusAmount: 4900 },
      { level: 11, targetAmount: 3800, bonusAmount: 5200 },
      { level: 12, targetAmount: 4000, bonusAmount: 5500 }
    ];

    setEditingGrade(grade);
    setEditSchemeForm({
      id: grade.id,
      department: grade.department || selectedDept,
      gradeName: grade.gradeName || `Grade-${grade.gradeNumber || 1}`,
      minSalary: grade.minSalary || 35000,
      maxSalary: grade.maxSalary || 40000,
      minTarget: grade.minTarget !== undefined ? grade.minTarget : (defaultLevels[0]?.targetAmount || 1600),
      minBonus: grade.minBonus !== undefined ? grade.minBonus : (defaultLevels[0]?.bonusAmount || 1100),
      description: grade.description || '',
      levels: defaultLevels.map(l => ({ ...l }))
    });
    setIsEditSchemeModalOpen(true);
  };

  // Save Edit Scheme Modal (Image 2)
  const handleSaveEditScheme = async (e) => {
    e.preventDefault();
    if (!editSchemeForm.id) return;

    try {
      const payload = {
        department: editSchemeForm.department,
        gradeName: editSchemeForm.gradeName,
        minSalary: Number(editSchemeForm.minSalary),
        maxSalary: Number(editSchemeForm.maxSalary),
        minTarget: Number(editSchemeForm.minTarget),
        minBonus: Number(editSchemeForm.minBonus),
        description: editSchemeForm.description,
        levels: editSchemeForm.levels.map(lvl => ({
          level: Number(lvl.level),
          targetAmount: Number(lvl.targetAmount),
          bonusAmount: Number(lvl.bonusAmount)
        })).sort((a, b) => a.level - b.level)
      };

      const res = await bonusSchemesApi.updateGrade(editSchemeForm.id, payload);
      if (res?.success && res.grade) {
        setGrades(prev => prev.map(g => g.id === editSchemeForm.id ? res.grade : g));
      }
      setIsEditSchemeModalOpen(false);
      setEditingGrade(null);
      if (onShowToast) onShowToast();
      LiveSyncEngine.broadcast('bonus_schemes', payload);
      loadData();
    } catch (err) {
      console.error('Failed to update scheme:', err);
    }
  };

  // Create new grade
  const handleCreateGrade = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department: selectedDept,
        gradeName: newGradeForm.gradeName || `Grade-${currentDeptGrades.length + 1}`,
        minSalary: Number(newGradeForm.minSalary),
        maxSalary: Number(newGradeForm.maxSalary),
        description: newGradeForm.description,
        levels: [
          { level: 1, targetAmount: 1800, bonusAmount: 2200 },
          { level: 2, targetAmount: 2000, bonusAmount: 2500 },
          { level: 3, targetAmount: 2200, bonusAmount: 2800 },
          { level: 4, targetAmount: 2400, bonusAmount: 3100 },
          { level: 5, targetAmount: 2600, bonusAmount: 3400 },
          { level: 6, targetAmount: 2800, bonusAmount: 3700 },
          { level: 7, targetAmount: 3000, bonusAmount: 4000 },
          { level: 8, targetAmount: 3200, bonusAmount: 4300 },
          { level: 9, targetAmount: 3400, bonusAmount: 4600 },
          { level: 10, targetAmount: 3600, bonusAmount: 4900 },
          { level: 11, targetAmount: 3800, bonusAmount: 5200 },
          { level: 12, targetAmount: 4000, bonusAmount: 5500 }
        ],
      };
      const res = await bonusSchemesApi.createGrade(payload);
      if (res?.success && res.grade) {
        setGrades(prev => [...prev, res.grade]);
        setExpandedGradeId(res.grade.id);
      }
      setIsAddGradeModalOpen(false);
      setNewGradeForm({ gradeName: '', minSalary: 20000, maxSalary: 35000, description: '' });
      if (onShowToast) onShowToast();
      LiveSyncEngine.broadcast('bonus_schemes', payload);
      loadData();
    } catch (err) {
      console.error('Failed to create grade:', err);
    }
  };

  // Delete grade with Custom Confirmation Modal
  const handleConfirmDeleteGrade = async () => {
    if (!gradeToDelete) return;
    try {
      await bonusSchemesApi.deleteGrade(gradeToDelete.id);
      setGrades(prev => prev.filter(g => g.id !== gradeToDelete.id));
      setGradeToDelete(null);
      if (onShowToast) onShowToast();
      LiveSyncEngine.broadcast('bonus_schemes', { deleted: gradeToDelete.id });
      loadData();
    } catch (err) {
      console.error('Failed to delete grade:', err);
    }
  };

  // Clear all bonus schemes data
  const handleClearAllSchemes = async () => {
    try {
      setIsClearing(true);
      await bonusSchemesApi.clearBonusSchemes();
      setGrades([]);
      setEligibleEmployees([]);
      setIsClearAllModalOpen(false);
      if (onShowToast) onShowToast();
      LiveSyncEngine.broadcast('bonus_schemes', { cleared: true });
      loadData();
    } catch (err) {
      console.error('Failed to clear bonus schemes:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Load recommended standard 12-tier template for selected department
  const handleLoadStandardTemplate = async () => {
    try {
      const templateGrade = selectedDept === 'SALES' ? {
        department: 'SALES',
        gradeName: 'Grade-1',
        minSalary: 20000,
        maxSalary: 35000,
        description: 'Trainee & Junior Sales Executives',
        minTarget: 1800,
        minBonus: 2200,
        levels: [
          { level: 1, targetAmount: 1800, bonusAmount: 2200 },
          { level: 2, targetAmount: 2000, bonusAmount: 2500 },
          { level: 3, targetAmount: 2200, bonusAmount: 2800 },
          { level: 4, targetAmount: 2400, bonusAmount: 3100 },
          { level: 5, targetAmount: 2600, bonusAmount: 3400 },
          { level: 6, targetAmount: 2800, bonusAmount: 3700 },
          { level: 7, targetAmount: 3000, bonusAmount: 4000 },
          { level: 8, targetAmount: 3200, bonusAmount: 4300 },
          { level: 9, targetAmount: 3400, bonusAmount: 4600 },
          { level: 10, targetAmount: 3600, bonusAmount: 4900 },
          { level: 11, targetAmount: 3800, bonusAmount: 5200 },
          { level: 12, targetAmount: 4000, bonusAmount: 5500 }
        ]
      } : {
        department: 'OPERATIONS',
        gradeName: 'Grade-2',
        minSalary: 42001,
        maxSalary: 65000,
        description: 'Frontend, Backend & Flutter Developers',
        minTarget: 3200,
        minBonus: 3500,
        levels: [
          { level: 1, targetAmount: 3200, bonusAmount: 3500 },
          { level: 2, targetAmount: 3800, bonusAmount: 4200 },
          { level: 3, targetAmount: 4400, bonusAmount: 4900 },
          { level: 4, targetAmount: 5000, bonusAmount: 5700 },
          { level: 5, targetAmount: 5600, bonusAmount: 6500 },
          { level: 6, targetAmount: 6200, bonusAmount: 7300 },
          { level: 7, targetAmount: 6800, bonusAmount: 8200 },
          { level: 8, targetAmount: 7400, bonusAmount: 9100 },
          { level: 9, targetAmount: 8000, bonusAmount: 10000 },
          { level: 10, targetAmount: 8600, bonusAmount: 11000 },
          { level: 11, targetAmount: 9200, bonusAmount: 12000 },
          { level: 12, targetAmount: 9800, bonusAmount: 13100 }
        ]
      };

      const res = await bonusSchemesApi.createGrade(templateGrade);
      if (res?.success && res.grade) {
        setGrades(prev => [...prev, res.grade]);
        if (onShowToast) onShowToast();
        LiveSyncEngine.broadcast('bonus_schemes', templateGrade);
        loadData();
      }
    } catch (err) {
      console.error('Failed to load standard template:', err);
    }
  };

  // Modal Level Handlers
  const handleModalAddLevel = () => {
    const existing = editSchemeForm.levels || [];
    const nextLvl = existing.length > 0 ? Math.max(...existing.map(l => l.level)) + 1 : 1;
    const lastTarget = existing.length > 0 ? existing[existing.length - 1].targetAmount + 200 : 1800;
    const lastBonus = existing.length > 0 ? existing[existing.length - 1].bonusAmount + 300 : 2200;

    setEditSchemeForm(prev => ({
      ...prev,
      levels: [...prev.levels, { level: nextLvl, targetAmount: lastTarget, bonusAmount: lastBonus }]
    }));
  };

  const handleModalDeleteLevel = (lvlNum) => {
    setEditSchemeForm(prev => ({
      ...prev,
      levels: prev.levels.filter(l => l.level !== lvlNum)
    }));
  };

  const handleModalLevelChange = (lvlNum, field, value) => {
    setEditSchemeForm(prev => ({
      ...prev,
      levels: prev.levels.map(l => l.level === lvlNum ? { ...l, [field]: value } : l)
    }));
  };

  const handleModalReset12Levels = () => {
    const standardLevels = [
      { level: 1, targetAmount: 1800, bonusAmount: 2200 },
      { level: 2, targetAmount: 2000, bonusAmount: 2500 },
      { level: 3, targetAmount: 2200, bonusAmount: 2800 },
      { level: 4, targetAmount: 2400, bonusAmount: 3100 },
      { level: 5, targetAmount: 2600, bonusAmount: 3400 },
      { level: 6, targetAmount: 2800, bonusAmount: 3700 },
      { level: 7, targetAmount: 3000, bonusAmount: 4000 },
      { level: 8, targetAmount: 3200, bonusAmount: 4300 },
      { level: 9, targetAmount: 3400, bonusAmount: 4600 },
      { level: 10, targetAmount: 3600, bonusAmount: 4900 },
      { level: 11, targetAmount: 3800, bonusAmount: 5200 },
      { level: 12, targetAmount: 4000, bonusAmount: 5500 }
    ];
    setEditSchemeForm(prev => ({
      ...prev,
      levels: standardLevels
    }));
  };

  const currentDeptGrades = grades.filter(g => g.department === selectedDept);

  return (
    <div className="bs-container">
      {/* ── Top Header Banner ── */}
      <div className="bs-header-card">
        <div className="bs-header-left">
          <div className="bs-icon-badge">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="bs-header-title">Bonus Schemes &amp; Incentives</h1>
              <span className="bs-policy-pill">
                OPERATIONS &amp; SALES ONLY
              </span>
            </div>
            <p className="bs-header-sub">
              Configurable grade brackets and incentive tiers based on salary ranges.
            </p>
          </div>
        </div>

        <div className="bs-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {grades.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Clear all bonus schemes data"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setNewGradeForm({
                gradeName: `Grade-${currentDeptGrades.length + 1}`,
                minSalary: selectedDept === 'SALES' ? 20000 : 35000,
                maxSalary: selectedDept === 'SALES' ? 35000 : 50000,
                description: '',
              });
              setIsAddGradeModalOpen(true);
            }}
            className="bs-btn-primary"
          >
            <Plus size={14} />
            <span>Add Grade</span>
          </button>
        </div>
      </div>

      {/* ── Department Switcher Tabs ── */}
      <div className="bs-dept-tabs-bar">
        <button
          type="button"
          onClick={() => setSelectedDept('SALES')}
          className={`bs-dept-tab ${selectedDept === 'SALES' ? 'active' : ''}`}
        >
          <TrendingUp size={16} />
          <span>Sales Department</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedDept('OPERATIONS')}
          className={`bs-dept-tab ${selectedDept === 'OPERATIONS' ? 'active' : ''}`}
        >
          <Settings2 size={16} />
          <span>Operations Department</span>
        </button>
      </div>

      {/* ── Section Title Bar ── */}
      <div className="bs-grid-section-bar">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-500" />
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {selectedDept} GRADES &amp; SCHEMES
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            ({currentDeptGrades.length} Grades)
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Click any grade card or edit icon to configure levels
        </span>
      </div>

      {/* ── CARDS GRID (Modern Polished Layout) ── */}
      <div className="bs-cards-grid">
        {currentDeptGrades.length === 0 ? (
          <div className="prj-empty-table-cell" style={{ gridColumn: '1 / -1', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '3.75rem 1.5rem', width: '100%' }}>
            <div className="prj-empty-inner">
              <FolderKanban size={34} className="prj-empty-icon" />
              <h3 className="prj-empty-title">No bonus schemes found</h3>
              <p className="prj-empty-desc">
                There are no bonus scheme grades in your workspace. Click "+ Add Grade" to create a new scheme.
              </p>
            </div>
          </div>
        ) : (
          currentDeptGrades.map((grade) => {
            const levels = grade.levels || [];
            const previewLevels = levels.slice(0, 4);
            const remainingCount = levels.length - 4;

            // Format Department Name nicely: 'Operation' or 'Sales'
            const deptDisplay = grade.department === 'OPERATIONS' ? 'Operation' : 'Sales';
            const gradeDisplay = grade.gradeName || `Grade-${grade.gradeNumber || 1}`;

            return (
              <div
                key={grade.id}
                onClick={() => handleOpenEditSchemeModal(grade)}
                className="bs-scheme-card"
                title="Click to edit scheme"
              >
                {/* Header: Title, Grade, Salary and Actions */}
                <div className="bs-sc-header">
                  <div className="bs-sc-title-area">
                    <div className="bs-sc-dept-row">
                      <h3 className="bs-sc-dept-title">{deptDisplay}</h3>
                      <span className="bs-sc-grade-badge">{gradeDisplay}</span>
                    </div>
                    <div className="bs-sc-salary-row">
                      <span className="bs-sc-salary-lbl">Salary:</span>
                      <span className="bs-sc-salary-val">
                        ${grade.minSalary?.toLocaleString()} &mdash; ${grade.maxSalary?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bs-sc-actions" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditSchemeModal(grade);
                      }}
                      className="bs-sc-action-btn edit"
                      title="Edit Scheme"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGradeToDelete(grade);
                      }}
                      className="bs-sc-action-btn delete"
                      title="Delete Scheme"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="bs-sc-divider" />

                {/* Levels Preview Section */}
                <div className="bs-sc-preview-wrap">
                  <div className="bs-sc-preview-header">
                    <span className="bs-sc-preview-label">LEVELS PREVIEW</span>
                    <span className="bs-sc-preview-count">{levels.length} Levels</span>
                  </div>

                  {/* 4 Preview Tiles */}
                  <div className="bs-sc-preview-grid">
                    {previewLevels.map((lvl) => (
                      <div key={lvl.level} className="bs-sc-level-tile">
                        <span className="bs-sc-tile-level">L{lvl.level}</span>
                        <span className="bs-sc-tile-amount">${lvl.targetAmount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remaining Levels link */}
                <div className="bs-sc-more-levels">
                  {remainingCount > 0 ? `+ ${remainingCount} more levels` : 'All levels shown'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── EDIT SCHEME POPUP MODAL (Exact match to User Image 2 with Clients Panel aesthetics) ── */}
      <AnimatePresence>
        {isEditSchemeModalOpen && (
          <div className="cli-modal-overlay" onClick={e => {
            if (e.target === e.currentTarget) setIsEditSchemeModalOpen(false);
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="bs-modal-card"
            >
              {/* Modal Header */}
              <div className="bs-modal-header">
                <div>
                  <h3 className="bs-modal-title">Edit Scheme</h3>
                  <p className="bs-modal-subtitle">
                    Configure department, salary range, and target/bonus level tiers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditSchemeModalOpen(false)}
                  className="cli-panel-close-btn"
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveEditScheme} className="bs-modal-form">
                {/* Form Row 1: 4 columns (Type, Grade, Min Salary, Max Salary) */}
                <div className="bs-modal-grid-4col">
                  <div className="cli-field-group">
                    <label className="cli-field-label">Type</label>
                    <CustomSelect
                      size="compact"
                      value={editSchemeForm.department}
                      onChange={(val) => setEditSchemeForm(prev => ({ ...prev, department: val }))}
                      options={['OPERATION', 'SALES']}
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Grade</label>
                    <input
                      type="text"
                      required
                      value={editSchemeForm.gradeName}
                      onChange={e => setEditSchemeForm(prev => ({ ...prev, gradeName: e.target.value }))}
                      className="cli-input"
                      placeholder="e.g. Grade-1"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Min Salary</label>
                    <input
                      type="number"
                      required
                      value={editSchemeForm.minSalary}
                      onChange={e => setEditSchemeForm(prev => ({ ...prev, minSalary: e.target.value }))}
                      className="cli-input font-mono"
                      placeholder="35000"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Max Salary</label>
                    <input
                      type="number"
                      required
                      value={editSchemeForm.maxSalary}
                      onChange={e => setEditSchemeForm(prev => ({ ...prev, maxSalary: e.target.value }))}
                      className="cli-input font-mono"
                      placeholder="40000"
                    />
                  </div>
                </div>

                {/* Form Row 2: 2 columns (Minimum Target, Minimum Bonus) */}
                <div className="bs-modal-grid-2col">
                  <div className="cli-field-group">
                    <label className="cli-field-label">Minimum Target</label>
                    <input
                      type="number"
                      value={editSchemeForm.minTarget}
                      onChange={e => setEditSchemeForm(prev => ({ ...prev, minTarget: e.target.value }))}
                      className="cli-input font-mono"
                      placeholder="1600"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Minimum Bonus</label>
                    <input
                      type="number"
                      value={editSchemeForm.minBonus}
                      onChange={e => setEditSchemeForm(prev => ({ ...prev, minBonus: e.target.value }))}
                      className="cli-input font-mono"
                      placeholder="1100"
                    />
                  </div>
                </div>

                {/* Levels Configuration Header & Controls */}
                <div className="bs-modal-levels-header">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Levels Configuration</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({editSchemeForm.levels?.length || 0} Levels)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleModalReset12Levels}
                      className="bs-btn-small-outline text-xs"
                      title="Reset to 12 standard levels"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Standard 12</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleModalAddLevel}
                      className="bs-btn-small-outline text-xs"
                      title="Add a new level tier"
                    >
                      <Plus size={12} />
                      <span>Add Level</span>
                    </button>
                  </div>
                </div>

                {/* Levels Configuration Table */}
                <div className="bs-modal-table-container">
                  <table className="bs-modal-table">
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>LEVEL</th>
                        <th style={{ width: '44%' }}>TARGET AMOUNT</th>
                        <th style={{ width: '38%' }}>BONUS AMOUNT</th>
                        <th style={{ width: '6%', textAlign: 'right' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editSchemeForm.levels.map((lvl) => (
                        <tr key={lvl.level}>
                          <td className="font-extrabold text-slate-800 text-sm pl-4">
                            {lvl.level}
                          </td>
                          <td>
                            <input
                              type="number"
                              value={lvl.targetAmount}
                              onChange={e => handleModalLevelChange(lvl.level, 'targetAmount', e.target.value)}
                              className="bs-modal-input-cell font-mono"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={lvl.bonusAmount}
                              onChange={e => handleModalLevelChange(lvl.level, 'bonusAmount', e.target.value)}
                              className="bs-modal-input-cell font-mono font-bold text-emerald-600"
                            />
                          </td>
                          <td className="text-right pr-4">
                            {editSchemeForm.levels.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleModalDeleteLevel(lvl.level)}
                                className="bs-modal-cell-btn-delete"
                                title="Remove Level"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal Footer (Cancel & Save) */}
                <div className="bs-modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsEditSchemeModalOpen(false)}
                    className="bs-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bs-modal-btn-save"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD GRADE MODAL ── */}
      <AnimatePresence>
        {isAddGradeModalOpen && (
          <div className="cli-modal-overlay" onClick={e => {
            if (e.target === e.currentTarget) setIsAddGradeModalOpen(false);
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="bs-modal-card"
              style={{ maxWidth: '580px' }}
            >
              <div className="bs-modal-header">
                <div>
                  <h3 className="bs-modal-title">Add New {selectedDept} Grade</h3>
                  <p className="bs-modal-subtitle">Create a new grade scheme bracket based on salary range</p>
                </div>
                <button type="button" onClick={() => setIsAddGradeModalOpen(false)} className="cli-panel-close-btn">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGrade} className="bs-modal-form">
                {/* 3 Fields in 1 Compact Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="cli-field-group">
                    <label className="cli-field-label">Grade Name</label>
                    <input
                      type="text"
                      required
                      value={newGradeForm.gradeName}
                      onChange={e => setNewGradeForm({ ...newGradeForm, gradeName: e.target.value })}
                      className="cli-input"
                      placeholder="e.g. Grade-4"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Min Salary</label>
                    <input
                      type="number"
                      required
                      value={newGradeForm.minSalary}
                      onChange={e => setNewGradeForm({ ...newGradeForm, minSalary: e.target.value })}
                      className="cli-input font-mono"
                      placeholder="20000"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">Max Salary</label>
                    <input
                      type="number"
                      required
                      value={newGradeForm.maxSalary}
                      onChange={e => setNewGradeForm({ ...newGradeForm, maxSalary: e.target.value })}
                      className="cli-input font-mono"
                      placeholder="35000"
                    />
                  </div>
                </div>

                <div className="bs-modal-footer">
                  <button type="button" onClick={() => setIsAddGradeModalOpen(false)} className="bs-modal-btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="bs-modal-btn-save">
                    <Plus size={14} />
                    <span>Create Grade</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CUSTOM DELETE CONFIRMATION MODAL (Exact match to Clients & Fiverr Profiles panels) ── */}
      <AnimatePresence>
        {gradeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setGradeToDelete(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              {/* Header — matches meeting/clients modal design */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div className="cli-modal-icon-badge" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete Bonus Scheme?</h3>
                    <p className="cli-modal-sub-text">
                      {gradeToDelete.gradeName} &mdash; this cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGradeToDelete(null)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Callout */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  You are about to permanently delete <strong style={{ color: '#991B1B' }}>{gradeToDelete.gradeName}</strong> (${gradeToDelete.minSalary?.toLocaleString()} &mdash; ${gradeToDelete.maxSalary?.toLocaleString()}) from {gradeToDelete.department === 'OPERATIONS' ? 'Operations' : 'Sales'} department. All configured level tiers will be removed.
                </p>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setGradeToDelete(null)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGrade}
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
      </AnimatePresence>

      {/* ── CUSTOM CLEAR ALL SCHEMES CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {isClearAllModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && !isClearing) setIsClearAllModalOpen(false); }}
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
                  <div className="cli-modal-icon-badge" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Clear All Bonus Schemes?</h3>
                    <p className="cli-modal-sub-text">
                      Reset grades and payout configurations to empty
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  Are you sure you want to clear all existing bonus schemes data? This will remove all grades, level tiers, and employee payout adjustments across both Sales and Operations in both Neon PostgreSQL and local database stores.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={handleClearAllSchemes}
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
                    cursor: isClearing ? 'not-allowed' : 'pointer',
                    opacity: isClearing ? 0.7 : 1,
                    boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={13} />
                  <span>{isClearing ? 'Clearing...' : 'Yes, Clear Everything'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

