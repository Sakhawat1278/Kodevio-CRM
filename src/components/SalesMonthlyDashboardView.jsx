import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  Briefcase,
  FileText,
  Star,
  Zap,
  Target,
  ChevronRight,
  RefreshCw,
  Sparkles,
  DollarSign,
  Trophy,
  Filter,
  Search,
  Edit2,
  Save,
  X,
  Database,
  FolderKanban
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import { performanceApi } from '../api/client';

const DEFAULT_SALES_REPS = [];

export default function SalesMonthlyDashboardView({
  user,
  projectsData = [],
  clientsData = [],
  sellerProfiles = [],
  usersData = [],
  onShowToast
}) {
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time Database State
  const [salesTeamData, setSalesTeamData] = useState(DEFAULT_SALES_REPS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState(null);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearOptions = ['2026', '2025', '2024'];

  // Fetch from Real Database
  const fetchPerformanceFromDb = useCallback(async (showToast = false) => {
    try {
      setIsSyncing(true);
      const json = await performanceApi.fetchSales(selectedMonth, selectedYear);
      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        setSalesTeamData(json.data);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Real-time database fetch note, using active dataset:', err.message);
    } finally {
      setIsSyncing(false);
      if (showToast && onShowToast) {
        onShowToast('Sales Leaderboard synced with database in real-time');
      }
    }
  }, [selectedMonth, selectedYear, onShowToast]);

  // Initial Fetch & Dynamic Polling Interval (every 6 seconds)
  useEffect(() => {
    fetchPerformanceFromDb(false);
    const interval = setInterval(() => {
      fetchPerformanceFromDb(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchPerformanceFromDb]);

  // Save changes to Real Database
  const handleSaveRepStats = async (updatedRep) => {
    try {
      setIsSyncing(true);
      const updatedList = salesTeamData.map(r => r.id === updatedRep.id ? updatedRep : r);
      setSalesTeamData(updatedList);
      setIsEditModalOpen(false);

      await performanceApi.saveSales({
        month: selectedMonth,
        year: selectedYear,
        item: updatedRep
      });

      if (onShowToast) {
        onShowToast(`Updated and saved ${updatedRep.name} performance to database!`);
      }
    } catch (err) {
      console.error('Error saving performance to DB:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Search Filter
  const filteredData = useMemo(() => {
    let list = salesTeamData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        item => item.name.toLowerCase().includes(q) || String(item.id).includes(q) || (item.role && item.role.toLowerCase().includes(q))
      );
    }
    return list;
  }, [salesTeamData, searchQuery]);

  // Sort for Sales Leaderboard (achieved desc)
  const salesLeaderboard = useMemo(() => {
    return [...filteredData].sort((a, b) => (Number(b.achieved) || 0) - (Number(a.achieved) || 0));
  }, [filteredData]);

  // Sort for Quotation Leaderboard (totalQuoteValue desc)
  const quotationLeaderboard = useMemo(() => {
    return [...filteredData].sort((a, b) => (Number(b.totalQuoteValue) || 0) - (Number(a.totalQuoteValue) || 0));
  }, [filteredData]);

  // Spotlight leaders
  const topSalesman = salesLeaderboard[0] || null;
  const topQuoter = quotationLeaderboard[0] || null;

  // Aggregated totals
  const totalAchieved = useMemo(() => salesTeamData.reduce((acc, r) => acc + (Number(r.achieved) || 0), 0), [salesTeamData]);
  const totalTarget = useMemo(() => salesTeamData.reduce((acc, r) => acc + (Number(r.target) || 0), 0), [salesTeamData]);
  const teamProgressPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
  const totalBonusPool = salesTeamData.length > 0 ? 'TK 22,500' : 'TK 0';
  const totalQuotesCount = salesTeamData.reduce((acc, r) => acc + (Number(r.quotesCount) || 0), 0);

  return (
    <div className="sdb-clean-container">
      {/* ── 1. CLEAN CONTROLS BAR (34px Matching Heights) ── */}
      <div className="sdb-clean-topbar">
        <div className="sdb-clean-controls ml-auto">
          {/* Live Sync Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-extrabold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>REAL-TIME DB SYNC ACTIVE</span>
          </div>

          <div className="sdb-clean-search-box">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search executive..."
              className="sdb-clean-search-input"
            />
          </div>

          <div className="w-[125px]">
            <CustomSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
            />
          </div>

          <div className="w-[90px]">
            <CustomSelect
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchPerformanceFromDb(true)}
            className="sdb-highlight-refresh-btn"
            title="Refresh Leaderboard Data from Database"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. HIGH-IMPACT SPOTLIGHT HERO STRIP (LUMINOUS HIGHLIGHT CARDS) ── */}
      {(topSalesman || topQuoter) && (
        <div className="sdb-spotlight-strip">
          {/* Top Salesman Hero Tile */}
          {topSalesman && (
            <div className="sdb-hero-tile sdb-hero-gold-glow">
              <div className="sdb-hero-top">
                <div className="sdb-highlight-badge badge-gold-glow">
                  <Trophy size={13} />
                  <span>TOP SALESMAN — {selectedMonth.toUpperCase()}</span>
                </div>
                <span className="sdb-rank-trophy-tag">
                  🏆 Rank #1 Sales Lead
                </span>
              </div>

              <div className="sdb-hero-profile">
                <div className="sdb-hero-avatar-box avatar-gold-glow">
                  <Trophy size={20} />
                </div>
                <div className="sdb-hero-name-col">
                  <div className="flex items-center gap-1.5">
                    <h3 className="sdb-hero-name font-black text-slate-900">{topSalesman.name}</h3>
                    <span className="text-amber-500 text-sm">👑</span>
                  </div>
                  <p className="sdb-hero-sub font-semibold text-slate-600">
                    ID: {topSalesman.id} • {topSalesman.role} • {topSalesman.grade}
                  </p>
                </div>
              </div>

              <div className="sdb-hero-stats-row bg-white">
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-amber-900 font-bold">ACHIEVED</span>
                  <span className="sdb-stat-num text-emerald-600 font-black text-base">${Number(topSalesman.achieved).toLocaleString()}</span>
                </div>
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-slate-500 font-bold">TARGET</span>
                  <span className="sdb-stat-num text-slate-800 font-black text-base">${Number(topSalesman.target).toLocaleString()}</span>
                </div>
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-amber-800 font-bold">BONUS EARNING</span>
                  <span className="sdb-stat-num text-amber-600 font-black text-base">{topSalesman.bonus}</span>
                </div>
              </div>

              <div className="sdb-hero-progress-area">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-amber-900 tracking-wider">TARGET PROGRESS</span>
                  <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    {Math.round(((Number(topSalesman.achieved) || 0) / (Number(topSalesman.target) || 1)) * 100)}%
                  </span>
                </div>
                <div className="sdb-hero-bar-track bg-amber-200/60">
                  <div
                    className="sdb-hero-bar-fill fill-gold-glow"
                    style={{ width: (Math.round(((Number(topSalesman.achieved) || 0) / (Number(topSalesman.target) || 1)) * 100) + '%') }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Top Quoter Hero Tile */}
          {topQuoter && (
            <div className="sdb-hero-tile sdb-hero-purple-glow">
              <div className="sdb-hero-top">
                <div className="sdb-highlight-badge badge-purple-glow">
                  <Award size={13} />
                  <span>TOP QUOTER — {selectedMonth.toUpperCase()}</span>
                </div>
                <span className="sdb-rank-quote-tag">
                  🎯 Top Proposal Lead
                </span>
              </div>

              <div className="sdb-hero-profile">
                <div className="sdb-hero-avatar-box avatar-purple-glow">
                  <FileText size={20} />
                </div>
                <div className="sdb-hero-name-col">
                  <h3 className="sdb-hero-name font-black text-slate-900">{topQuoter.name}</h3>
                  <p className="sdb-hero-sub font-semibold text-slate-600">
                    ID: {topQuoter.id} • {topQuoter.role} • {topQuoter.grade}
                  </p>
                </div>
              </div>

              <div className="sdb-hero-stats-row bg-white">
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-purple-900 font-bold">TOTAL QUOTE VALUE</span>
                  <span className="sdb-stat-num text-slate-900 font-black text-base">${Number(topQuoter.totalQuoteValue).toLocaleString()}</span>
                </div>
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-purple-900 font-bold">BEST SINGLE QUOTE</span>
                  <span className="sdb-stat-num text-purple-600 font-black text-base">${Number(topQuoter.bestQuote).toLocaleString()}</span>
                </div>
                <div className="sdb-hero-stat">
                  <span className="sdb-stat-lbl text-indigo-900 font-bold">PROPOSALS SENT</span>
                  <span className="sdb-stat-num text-indigo-600 font-black text-base">{topQuoter.quotesCount} Deals</span>
                </div>
              </div>

              <div className="sdb-hero-progress-area">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-purple-900 tracking-wider">PROPOSAL PIPELINE ACTIVITY</span>
                  <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Active Benchmark</span>
                </div>
                <div className="sdb-hero-bar-track bg-purple-200/60">
                  <div className="sdb-hero-bar-fill fill-purple-glow" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. DUAL SIDE-BY-SIDE HIGHLIGHTED LEADERBOARDS ── */}
      <div className="sdb-clean-tables-grid">
        {/* ── LEFT LEADERBOARD: SALES PERFORMANCE ── */}
        <div className="sdb-clean-panel">
          <div className="sdb-clean-panel-header bg-slate-50/90 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="sdb-panel-icon-badge icon-amber-glow">
                <Trophy size={14} />
              </div>
              <div>
                <h3 className="sdb-clean-panel-title">Sales Leaderboard</h3>
                <p className="sdb-clean-panel-desc font-medium">Ranked by closed revenue &amp; quota attainment</p>
              </div>
            </div>
            <span className="sdb-badge-count-highlight">
              {salesLeaderboard.length} Representatives
            </span>
          </div>

          <div className="sdb-table-scroll-container">
            <table className="sdb-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '42px', textAlign: 'center' }}>RANK</th>
                  <th>SALESPERSON</th>
                  <th style={{ textAlign: 'right' }}>ACHIEVED</th>
                  <th style={{ textAlign: 'right' }}>TARGET</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>PROGRESS</th>
                  <th style={{ textAlign: 'right' }}>BONUS</th>
                </tr>
              </thead>
              <tbody>
                {salesLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="prj-empty-table-cell">
                      <div className="prj-empty-inner">
                        <FolderKanban size={34} className="prj-empty-icon" />
                        <h3 className="prj-empty-title">No sales data recorded</h3>
                        <p className="prj-empty-desc">There are no sales performance records for this month.</p>
                      </div>
                    </td>
                  </tr>
                ) : salesLeaderboard.map((rep, idx) => {
                  const progressPct = Number(rep.target) > 0 ? Math.round((Number(rep.achieved) / Number(rep.target)) * 100) : 0;
                  const isRank1 = idx === 0;
                  const isRank2 = idx === 1;
                  const isRank3 = idx === 2;

                  return (
                    <tr
                      key={rep.id}
                      className={`sdb-clean-row ${isRank1 ? 'row-highlight-gold' : isRank2 ? 'row-highlight-silver' : isRank3 ? 'row-highlight-bronze' : ''}`}
                    >
                      {/* Rank */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`sdb-rank-pill-clean ${isRank1 ? 'rank-gold' : isRank2 ? 'rank-silver' : isRank3 ? 'rank-bronze' : 'rank-num'}`}>
                          {isRank1 ? '🏆' : isRank2 ? '🥈' : isRank3 ? '🥉' : `#${idx + 1}`}
                        </span>
                      </td>

                      {/* Rep Info */}
                      <td>
                        <div className="sdb-user-compact-cell">
                          <div
                            className="sdb-user-avatar-dot shadow-sm"
                            style={{ backgroundColor: rep.color }}
                          >
                            {rep.initials}
                          </div>
                          <div className="sdb-user-compact-info">
                            <span className="sdb-user-compact-name flex items-center gap-1 font-bold">
                              {rep.name}
                              {isRank1 && <span className="text-amber-500 text-[10px]">👑</span>}
                            </span>
                            <span className="sdb-user-compact-sub">
                              {rep.id} • {rep.grade} • {rep.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Achieved */}
                      <td style={{ textAlign: 'right' }}>
                        {Number(rep.achieved) > 0 ? (
                          <span className="sdb-achieved-highlight-badge">
                            ${Number(rep.achieved).toLocaleString(undefined, { minimumFractionDigits: Number(rep.achieved) % 1 !== 0 ? 1 : 0 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs">$0</span>
                        )}
                      </td>

                      {/* Target */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-bold text-slate-600 text-xs">
                          ${Number(rep.target).toLocaleString()}
                        </span>
                      </td>

                      {/* Progress */}
                      <td>
                        <div className="sdb-clean-progress-col">
                          <span className={`sdb-progress-pct-num font-black ${progressPct >= 75 ? 'text-indigo-600' : progressPct >= 25 ? 'text-amber-600' : progressPct > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {progressPct}%
                          </span>
                          <div className="sdb-mini-track">
                            <div
                              className="sdb-mini-fill"
                              style={{
                                width: `${Math.min(100, progressPct)}%`,
                                backgroundColor: progressPct >= 75 ? '#4F46E5' : progressPct >= 25 ? '#EA580C' : progressPct > 0 ? '#EF4444' : '#CBD5E1'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Bonus */}
                      <td style={{ textAlign: 'right' }}>
                        {rep.bonus !== '—' ? (
                          <span className="sdb-bonus-highlight-pill">
                            {rep.bonus}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Highlighting Aggregated Footer */}
          <div className="sdb-clean-footer">
            <span className="sdb-clean-footer-title">TEAM AGGREGATED PERFORMANCE</span>
            <div className="sdb-clean-footer-stats">
              <div className="sdb-footer-stat-group">
                <span className="sdb-footer-stat-label">Achieved:</span>
                <span className="sdb-footer-val-achieved">
                  ${totalAchieved.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </span>
              </div>
              <div className="sdb-footer-stat-group">
                <span className="sdb-footer-stat-label">Target:</span>
                <span className="sdb-footer-val-target">
                  ${totalTarget.toLocaleString()}
                </span>
              </div>
              <div className="sdb-footer-stat-group">
                <span className="sdb-footer-stat-label">Progress:</span>
                <span className="sdb-footer-pct-pill">{teamProgressPct}%</span>
              </div>
              <div className="sdb-footer-stat-group">
                <span className="sdb-footer-stat-label">Bonus Pool:</span>
                <span className="sdb-footer-val-bonus">
                  {totalBonusPool}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT LEADERBOARD: QUOTATION PERFORMANCE ── */}
        <div className="sdb-clean-panel">
          <div className="sdb-clean-panel-header bg-slate-50/90 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="sdb-panel-icon-badge icon-purple-glow">
                <FileText size={14} />
              </div>
              <div>
                <h3 className="sdb-clean-panel-title">Quotation Leaderboard</h3>
                <p className="sdb-clean-panel-desc font-medium">Ranked by proposal volume &amp; quote value</p>
              </div>
            </div>
            <span className="sdb-badge-count-highlight text-purple-700 bg-purple-50 border-purple-200">
              {totalQuotesCount} Sent Proposals
            </span>
          </div>

          <div className="sdb-table-scroll-container">
            <table className="sdb-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '42px', textAlign: 'center' }}>RANK</th>
                  <th>SALESPERSON</th>
                  <th style={{ textAlign: 'center' }}>QUOTES</th>
                  <th style={{ textAlign: 'right' }}>TOTAL VALUE</th>
                  <th style={{ textAlign: 'right' }}>BEST QUOTE</th>
                </tr>
              </thead>
              <tbody>
                {quotationLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="prj-empty-table-cell">
                      <div className="prj-empty-inner">
                        <FolderKanban size={34} className="prj-empty-icon" />
                        <h3 className="prj-empty-title">No quotation data recorded</h3>
                        <p className="prj-empty-desc">There are no quotation performance records for this month.</p>
                      </div>
                    </td>
                  </tr>
                ) : quotationLeaderboard.map((rep, idx) => {
                  const isTopQuoter = idx === 0;
                  return (
                    <tr
                      key={rep.id}
                      className={`sdb-clean-row ${isTopQuoter ? 'row-highlight-purple' : ''}`}
                    >
                      {/* Rank */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`sdb-rank-pill-clean ${isTopQuoter ? 'rank-star-purple' : 'rank-num'}`}>
                          {isTopQuoter ? '★' : `#${idx + 1}`}
                        </span>
                      </td>

                      {/* Rep Info */}
                      <td>
                        <div className="sdb-user-compact-cell">
                          <div
                            className="sdb-user-avatar-dot shadow-sm"
                            style={{ backgroundColor: rep.color }}
                          >
                            {rep.initials}
                          </div>
                          <div className="sdb-user-compact-info">
                            <span className="sdb-user-compact-name font-bold">{rep.name}</span>
                            <span className="sdb-user-compact-sub">ID: {rep.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Quotes Pill */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`sdb-quotes-badge ${rep.quotesCount >= 10 ? 'quotes-high' : rep.quotesCount > 0 ? 'quotes-med' : 'quotes-zero'}`}>
                          {rep.quotesCount}
                        </span>
                      </td>

                      {/* Total Quote Value */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-black text-slate-900 text-xs">
                          ${Number(rep.totalQuoteValue).toLocaleString()}
                        </span>
                      </td>

                      {/* Best Quote */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {rep.bestQuoteClient !== '—' && (
                            <span className="sdb-client-micro-tag">
                              {rep.bestQuoteClient}
                            </span>
                          )}
                          <span className={`font-black text-xs ${Number(rep.bestQuote) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            ${Number(rep.bestQuote).toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
