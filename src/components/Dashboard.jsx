import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Package,
  Zap,
  Users,
  Settings,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Briefcase,
  Sparkles,
  Bot,
  User,
  Calendar,
  CalendarDays,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Layers,
  Instagram,
  Facebook,
  Globe,
  Star,
  Award,
  TrendingUp,
  X,
  UserCheck,
  ShieldCheck,
  Shield,
  Upload,
  Camera,
  FolderKanban,
  Activity,
  Database,
  Eye,
  Check,
  Code,
  Menu,
  ChevronDown,
} from 'lucide-react';
import ProfileSettingsView from './ProfileSettingsView';
import ClientsView from './ClientsView';
import ProjectsView from './ProjectsView';
import FiverrProfilesView from './FiverrProfilesView';
import UsersView from './UsersView';
import BonusSchemesView from './BonusSchemesView';
import SalesMonthlyDashboardView from './SalesMonthlyDashboardView';
import OperationsMonthlyDashboardView from './OperationsMonthlyDashboardView';
import LeavesView from './LeavesView';
import CustomSelect from './common/CustomSelect';
import SystemHealthInspectorModal from './SystemHealthInspectorModal';
import logoImg from '../assets/logo';
import { LiveSyncEngine } from '../services/liveSyncEngine';
import { syncApi, fiverrProfilesApi, clientsApi, projectsApi, usersApi, performanceApi, systemHealthApi, leavesApi } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS MATRIX
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  // 1. Leadership & Super Admin: Complete uninhibited command over all 10 modules
  super_admin: {
    roleName: 'Super Admin',
    department: 'Leadership',
    allowedTabs: ['overview', 'fiverr_profiles', 'clients', 'projects', 'sales_dashboard', 'ops_dashboard', 'leaves', 'profile', 'team', 'bonus_schemes'],
    defaultTab: 'overview',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    canManageUsers: true,
    canManageBonus: true,
    canDeliverProjects: true,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: true,
  },
  agency_admin: {
    roleName: 'Agency Admin',
    department: 'Leadership',
    allowedTabs: ['overview', 'fiverr_profiles', 'clients', 'projects', 'sales_dashboard', 'ops_dashboard', 'leaves', 'profile', 'team', 'bonus_schemes'],
    defaultTab: 'overview',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    canManageUsers: true,
    canManageBonus: true,
    canDeliverProjects: true,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: true,
  },

  // 2. Sales Department: Focused on Inflow, Deals, Clients, Fiverr Profiles & Sales Monthly metrics
  sales_manager: {
    roleName: 'Sales Manager',
    department: 'Sales & BD',
    allowedTabs: ['overview', 'fiverr_profiles', 'clients', 'projects', 'sales_dashboard', 'leaves', 'profile', 'team', 'bonus_schemes'],
    defaultTab: 'sales_dashboard',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: true,
  },
  sales_lead: {
    roleName: 'Sales Lead',
    department: 'Sales & BD',
    allowedTabs: ['overview', 'fiverr_profiles', 'clients', 'projects', 'sales_dashboard', 'leaves', 'profile', 'bonus_schemes'],
    defaultTab: 'sales_dashboard',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: true,
  },
  sales_executive: {
    roleName: 'Sales Executive',
    department: 'Sales & BD',
    allowedTabs: ['overview', 'fiverr_profiles', 'clients', 'projects', 'sales_dashboard', 'leaves', 'profile', 'bonus_schemes'],
    defaultTab: 'clients',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: true,
  },

  // 3. Operations & Project Management: Delivery velocity, QA, SLA %, Developer Allocation & Projects
  ops_manager: {
    roleName: 'Operations Manager',
    department: 'Operations',
    allowedTabs: ['overview', 'projects', 'clients', 'ops_dashboard', 'leaves', 'profile', 'team', 'bonus_schemes'],
    defaultTab: 'ops_dashboard',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    canManageUsers: true,
    canManageBonus: false,
    canDeliverProjects: true,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: false,
  },
  project_manager: {
    roleName: 'Project Manager',
    department: 'Operations',
    allowedTabs: ['overview', 'projects', 'clients', 'ops_dashboard', 'leaves', 'profile', 'team', 'bonus_schemes'],
    defaultTab: 'ops_dashboard',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: true,
    canViewAllFinancials: true,
    canAccessFiverrProfiles: false,
  },

  // 4. Engineering, Design, Developers: Project execution, Task checklist, Dev mark done, Ops workload
  developer: {
    roleName: 'Developer',
    department: 'Engineering',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
  senior_developer: {
    roleName: 'Senior Developer',
    department: 'Engineering',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
  fullstack_developer: {
    roleName: 'Full Stack Dev',
    department: 'Engineering',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
  frontend_developer: {
    roleName: 'Frontend Dev',
    department: 'Engineering',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
  ui_ux_designer: {
    roleName: 'UI/UX Designer',
    department: 'Design',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
  team_member: {
    roleName: 'Team Member',
    department: 'Operations',
    allowedTabs: ['projects', 'overview', 'ops_dashboard', 'leaves', 'profile'],
    defaultTab: 'projects',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    canManageUsers: false,
    canManageBonus: false,
    canDeliverProjects: false,
    canViewAllFinancials: false,
    canAccessFiverrProfiles: false,
  },
};

export function getUserPermissions(rawRole, rawDepartment) {
  const role = (rawRole || 'super_admin').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const dept = (rawDepartment || '').toLowerCase().trim();

  if (ROLE_PERMISSIONS[role]) {
    return ROLE_PERMISSIONS[role];
  }

  if (role.includes('admin') || role.includes('ceo') || role.includes('founder') || role.includes('director')) {
    return ROLE_PERMISSIONS.super_admin;
  }
  if (role.includes('sales') || dept.includes('sales') || dept.includes('business')) {
    if (role.includes('manager') || role.includes('head')) return ROLE_PERMISSIONS.sales_manager;
    if (role.includes('lead')) return ROLE_PERMISSIONS.sales_lead;
    return ROLE_PERMISSIONS.sales_executive;
  }
  if (role.includes('ops') || role.includes('pm') || role.includes('project_manager') || dept.includes('operation')) {
    if (role.includes('manager') || role.includes('head')) return ROLE_PERMISSIONS.ops_manager;
    return ROLE_PERMISSIONS.project_manager;
  }
  if (role.includes('dev') || role.includes('design') || role.includes('engineer') || role.includes('member') || dept.includes('engineering')) {
    return ROLE_PERMISSIONS.developer;
  }

  return ROLE_PERMISSIONS.super_admin;
}

// 1. Fresh KPI Sparkline
function FreshSparkline({ color = "#FF6B35", points = [12, 18, 14, 22, 19, 28, 25] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const width = 64;
  const height = 24;
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / (max - min || 1)) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' L ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={`M ${coords}`} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Safe Avatar with fallback initial badge when image is broken or missing
function SafeAvatar({ src, name = 'User', size = 26, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const isValidUrl = src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/'));

  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = String(name).replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const bgColors = [
    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
    { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' },
    { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
    { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
    { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  ];
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  const theme = bgColors[charCode % bgColors.length];

  if (!isValidUrl || imgError) {
    return (
      <div
        className={`safe-avatar-circle ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${Math.max(Math.round(size * 0.38), 10)}px`,
          backgroundColor: theme.bg,
          color: theme.color,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: 1,
          borderRadius: '50%',
          fontWeight: 800,
          boxSizing: 'border-box'
        }}
        title={name}
      >
        <span style={{ lineHeight: 1, display: 'inline-block', transform: 'translateY(0.5px)' }}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`safe-avatar-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block',
        boxSizing: 'border-box'
      }}
    />
  );
}

const formatCountry = (countryStr) => {
  if (!countryStr || typeof countryStr !== 'string') return { name: 'United States', flag: '🇺🇸', code: 'US' };
  const raw = countryStr.trim().toLowerCase();
  if (raw === 'us' || raw === 'usa' || raw.includes('united states') || raw.includes('america')) {
    return { name: 'United States', flag: '🇺🇸', code: 'US' };
  }
  if (raw === 'uk' || raw.includes('united kingdom') || raw.includes('great britain') || raw.includes('england')) {
    return { name: 'United Kingdom', flag: '🇬🇧', code: 'UK' };
  }
  if (raw === 'ca' || raw.includes('canada')) {
    return { name: 'Canada', flag: '🇨🇦', code: 'CA' };
  }
  if (raw === 'au' || raw.includes('australia')) {
    return { name: 'Australia', flag: '🇦🇺', code: 'AU' };
  }
  if (raw === 'de' || raw.includes('germany') || raw.includes('deutschland')) {
    return { name: 'Germany', flag: '🇩🇪', code: 'DE' };
  }
  if (raw === 'sg' || raw.includes('singapore')) {
    return { name: 'Singapore', flag: '🇸🇬', code: 'SG' };
  }
  if (raw === 'ae' || raw.includes('emirates') || raw.includes('uae') || raw.includes('dubai')) {
    return { name: 'UAE', flag: '🇦🇪', code: 'AE' };
  }
  if (raw === 'bd' || raw.includes('bangladesh')) {
    return { name: 'Bangladesh', flag: '🇧🇩', code: 'BD' };
  }
  if (raw === 'in' || raw.includes('india')) {
    return { name: 'India', flag: '🇮🇳', code: 'IN' };
  }
  const clean = countryStr.replace(/^(us|uk|ca|au|de|bd|in|sg|ae)\s+/i, '').trim();
  const capitalized = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'United States';
  return { name: capitalized, flag: '🌐', code: 'INTL' };
};

const formatProjectTitle = (rawTitle) => {
  if (!rawTitle || typeof rawTitle !== 'string') return 'Project Milestone';
  const clean = rawTitle.replace(/^[A-Z0-9_-]+\s*\|\|\s*/i, '').trim();
  return clean || rawTitle;
};

// 2. Fresh Revenue Area & Performance Spline Chart
function FreshRevenueChart({ period = '1Y', grossRevenue = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const datasetByPeriod = {
    '1M': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      values: grossRevenue > 0 ? [7.5, 9.2, 8.4, 11.6] : [0, 0, 0, 0],
      maxVal: grossRevenue > 0 ? 16 : 10
    },
    '3M': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      values: grossRevenue > 0 ? [24.5, 29.8, 34.2] : [0, 0, 0],
      maxVal: grossRevenue > 0 ? 45 : 10
    },
    '6M': {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      values: grossRevenue > 0 ? [17.5, 21.0, 23.5, 26.8, 30.5, 34.2] : [0, 0, 0, 0, 0, 0],
      maxVal: grossRevenue > 0 ? 45 : 10
    },
    '1Y': {
      labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      values: grossRevenue > 0 ? [14.2, 18.0, 16.5, 19.0, 22.4, 15.8, 24.0, 28.5, 23.2, 18.6, 26.4, 34.2] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      maxVal: grossRevenue > 0 ? 45 : 10
    },
    'ALL': {
      labels: ['2023', 'Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', '2026'],
      values: grossRevenue > 0 ? [48.0, 56.0, 68.0, 75.0, 89.0, 96.0, 115.0, 130.0, 145.0, 172.0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      maxVal: grossRevenue > 0 ? 200 : 10
    }
  };

  const data = datasetByPeriod[period] || datasetByPeriod['1Y'];
  const months = data.labels;
  const values = data.values;
  const maxVal = data.maxVal;

  const chartHeight = 150;
  const paddingLeft = 32;
  const paddingRight = 15;
  const paddingBottom = 25;
  const svgWidth = 800;

  const points = values.map((val, i) => {
    const x = paddingLeft + (i / (values.length - 1)) * (svgWidth - paddingLeft - paddingRight);
    const y = chartHeight - (val / maxVal) * (chartHeight - paddingBottom);
    return { x, y, val, month: months[i] };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`;

  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${chartHeight + 25}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id="freshAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Y-Axis Gridlines & Labels */}
      {yTicks.map((val, idx) => {
        const y = chartHeight - (val / maxVal) * (chartHeight - paddingBottom);
        return (
          <g key={idx}>
            <text x="26" y={y + 3} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="600">
              {val === 0 ? '$0' : `$${val}k`}
            </text>
            <line x1="32" y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        );
      })}

      {/* Luminous Area Fill */}
      <path d={areaD} fill="url(#freshAreaGrad)" />

      {/* Smooth Bezier Line */}
      <path d={pathD} fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" />

      {/* Month Labels & Interactive Data Rings */}
      {points.map((pt, i) => {
        const isActive = hoveredIdx === i;
        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            {isActive && (
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={chartHeight} stroke="#FF6B35" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
            )}

            {isActive && (
              <circle cx={pt.x} cy={pt.y} r="9" fill="#FF6B35" opacity="0.25" />
            )}

            <circle
              cx={pt.x}
              cy={pt.y}
              r={isActive ? 5 : 3.5}
              fill={isActive ? "#EA580C" : "#FF6B35"}
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            {isActive && (
              <g transform={`translate(${Math.min(Math.max(pt.x - 36, 10), svgWidth - 85)}, ${pt.y - 32})`}>
                <rect width="72" height="22" rx="6" fill="#0F172A" />
                <text x="36" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                  ${pt.val}k • {pt.month}
                </text>
              </g>
            )}

            <text
              x={pt.x}
              y={chartHeight + 16}
              textAnchor="middle"
              fill={isActive ? "#C2410C" : "#94A3B8"}
              fontSize="10"
              fontWeight={isActive ? "800" : "600"}
            >
              {pt.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 3. Fresh Retention Tier Bar Chart
function FreshRetentionChart({ activeTier = 'all' }) {
  const [hoveredIdx, setHoveredIdx] = useState(3); // Default Sep
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [
    { basic: 25, standard: 30, premium: 20 },
    { basic: 18, standard: 28, premium: 32 },
    { basic: 22, standard: 34, premium: 26 },
    { basic: 28, standard: 38, premium: 28 }, // Active month (Sep)
    { basic: 20, standard: 26, premium: 18 },
    { basic: 15, standard: 20, premium: 14 },
    { basic: 18, standard: 24, premium: 16 },
  ];

  return (
    <svg viewBox="0 0 280 120" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {data.map((item, idx) => {
        const x = 12 + idx * 37;
        const barWidth = 18;
        const startY = 95;

        const hBasic = item.basic * 0.75;
        const hStandard = item.standard * 0.75;
        const hPremium = item.premium * 0.75;

        const yBasic = startY - hBasic;
        const yStandard = yBasic - hStandard;
        const yPremium = yStandard - hPremium;

        const isActive = hoveredIdx === idx;

        const basicOpacity = activeTier === 'all' || activeTier === 'basic' ? 1 : 0.25;
        const standardOpacity = activeTier === 'all' || activeTier === 'standard' ? 1 : 0.25;
        const premiumOpacity = activeTier === 'all' || activeTier === 'premium' ? 1 : 0.25;

        return (
          <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} style={{ cursor: 'pointer' }}>
            <rect x={x} y={yBasic} width={barWidth} height={hBasic} rx="3" fill={isActive ? "#9A3412" : "#C2410C"} opacity={basicOpacity} />
            <rect x={x} y={yStandard} width={barWidth} height={hStandard} rx="3" fill={isActive ? "#EA580C" : "#FF6B35"} opacity={standardOpacity} />
            <rect x={x} y={yPremium} width={barWidth} height={hPremium} rx="3" fill={isActive ? "#FB923C" : "#FDBA74"} opacity={premiumOpacity} />

            <text
              x={x + barWidth / 2}
              y={startY + 14}
              textAnchor="middle"
              fill={isActive ? "#9A3412" : "#94A3B8"}
              fontSize="10"
              fontWeight={isActive ? "800" : "600"}
            >
              {months[idx]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 4. Fresh World Map Graphic with Glowing Location Pins
function FreshGeoMap({ activeGeo }) {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="pinPulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="1"/>
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.15"/>
        </radialGradient>
      </defs>

      <path d="M 15 20 Q 30 15 45 25 Q 40 45 25 50 Q 10 35 15 20 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
      <path d="M 35 55 Q 45 55 42 75 Q 35 85 30 70 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
      <path d="M 65 18 Q 80 15 85 28 Q 80 50 70 55 Q 60 35 65 18 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
      <path d="M 90 15 Q 125 12 135 32 Q 120 50 95 40 Z" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.5" />
      <path d="M 115 58 Q 135 55 138 72 Q 125 80 115 72 Z" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="0.5" />

      {/* Australia Pin */}
      <circle cx="126" cy="68" r={activeGeo === 'Australia' ? 7 : 5} fill="url(#pinPulse)" />
      <circle cx="126" cy="68" r={activeGeo === 'Australia' ? 3.5 : 2.5} fill="#059669" />

      {/* Malaysia Pin */}
      <circle cx="112" cy="42" r={activeGeo === 'Malaysia' ? 6 : 4} fill="url(#pinPulse)" />
      <circle cx="112" cy="42" r={activeGeo === 'Malaysia' ? 3 : 2} fill="#059669" />

      {/* Indonesia Pin */}
      <circle cx="118" cy="50" r={activeGeo === 'Indonesia' ? 6 : 4} fill="url(#pinPulse)" />
      <circle cx="118" cy="50" r={activeGeo === 'Indonesia' ? 3 : 2} fill="#10B981" />

      {/* Singapore Pin */}
      <circle cx="110" cy="46" r={activeGeo === 'Singapore' ? 6 : 3.5} fill="url(#pinPulse)" />
      <circle cx="110" cy="46" r={activeGeo === 'Singapore' ? 3 : 1.8} fill="#10B981" />

      <circle cx="32" cy="30" r="2" fill="#6EE7B7" />
      <circle cx="75" cy="25" r="2" fill="#6EE7B7" />
    </svg>
  );
}

// ─── DYNAMIC INTERACTIVE SPARKLINE COMPONENT ──────────────────────────────
function DynamicSparkline({ points = [], color = '#FF6B35', gradId = 'grad1' }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const data = points && points.length >= 2 ? points : [0, 0, 0, 0, 0, 0, 0];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 90;
  const height = 35;
  const paddingX = 5;
  const paddingY = 6;

  const coords = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - min) / range) * (height - paddingY * 2);
    return { x, y, val };
  });

  let linePath = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const lastX = coords[coords.length - 1].x;
  const firstX = coords[0].x;
  const areaPath = `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;

  return (
    <div className="relative group cursor-pointer">
      <svg className="cli-sparkline-svg overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradId})`} className="transition-all duration-300" />
        <path
          d={linePath}
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {coords.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={hoverIdx === idx ? 4 : 2.5}
            fill={hoverIdx === idx ? '#FFFFFF' : color}
            stroke={color}
            strokeWidth={hoverIdx === idx ? 2 : 1}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            className="transition-all duration-150 cursor-pointer"
          />
        ))}
      </svg>

      {hoverIdx !== null && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
          Val: {coords[hoverIdx].val}
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL STICKY TOP BAR COMPONENT (EXACT ORIGINAL DESIGN) ───────────────
function GlobalTopBar({ activeTab, user, isSyncing, onSync, onOpenInspector, clientsData, sellerProfiles, briefs, dispatchedCount, activeOrdersCount, revenue, usersData, isClientDetailsActive, projectsData = [], onToggleMobileMenu }) {
  const panelMeta = {
    clients:         { label: 'Clients Database',  sub: `(${clientsData.length} Records)` },
    projects:        { label: 'Projects Database', sub: `(${projectsData.length} Active Projects)` },
    sales_dashboard: { label: 'Sales Monthly Dashboard', sub: '(Executive Inflow & Quotas)' },
    ops_dashboard:   { label: 'Operations Monthly Dashboard', sub: '(SLA & Delivery Velocity)' },
    overview:        { label: 'Overview',          sub: '(Live Workspace)' },
    fiverr_profiles: { label: 'Fiverr Profiles',   sub: `(${sellerProfiles.length} Active Profiles)` },
    briefs:          { label: 'Buyer Briefs',       sub: `(${briefs.length} Incoming Queue)` },
    orders:          { label: 'Active Orders',      sub: `(${activeOrdersCount} Live Orders)` },
    automation:      { label: 'Auto-Dispatcher',    sub: '(Automation Engine)' },
    'ai-rules':      { label: 'AI Match Rules',     sub: '(8 Active Rules)' },
    profile:         { label: 'Profile Settings',   sub: '(Account Management)' },
    team:            { label: 'Users & Team',       sub: '(Team Management)' },
    bonus_schemes:   { label: 'Bonus Schemes',      sub: '(OPS & SALES Incentive Tiers)' },
    leaves:          { label: 'Leave Applications', sub: '(HR Management & Staff Schedule)' },
    settings:        { label: 'Agency Settings',    sub: '(Configuration)' },
  };

  const meta = panelMeta[activeTab] || { label: activeTab.replace(/_/g, ' '), sub: '' };

  const generateTrendPoints = (count) => {
    if (!count || count === 0) return [0, 0, 0, 0, 0, 0, 0];
    return [
      Math.max(0, Math.round(count * 0.15)),
      Math.max(0, Math.round(count * 0.35)),
      Math.max(0, Math.round(count * 0.25)),
      Math.max(0, Math.round(count * 0.65)),
      Math.max(0, Math.round(count * 0.5)),
      Math.max(0, Math.round(count * 0.85)),
      count,
    ];
  };

  // Compute live KPI cards and sparklines per panel
  const getKpiCards = () => {
    const st = (c) => String(c?.status || '').toUpperCase().trim();
    switch (activeTab) {
      case 'sales_dashboard': {
        return [
          { label: 'TEAM REVENUE',     value: '$9.6k',    sub: '11% TARGET',   points: [4, 5.5, 6.8, 7.5, 8.2, 9.1, 9.6] },
          { label: 'TEAM TARGET',      value: '$88k',     sub: '17 REPS',       points: [88, 88, 88, 88, 88, 88, 88] },
          { label: 'TOTAL QUOTATIONS', value: 59,         sub: 'PROPOSALS',     points: [12, 22, 31, 38, 44, 52, 59] },
          { label: 'AVG DEAL SIZE',    value: '$109',     sub: 'PER CONTRACT',  points: [95, 98, 102, 104, 106, 108, 109] },
          { label: 'BONUS POOL',       value: 'TK 22.5k', sub: 'INCENTIVES',    points: [5, 8, 12, 15, 18, 20, 22.5] },
        ];
      }
      case 'ops_dashboard': {
        return [
          { label: 'TEAM OUTPUT',        value: '$5.7k',    sub: '32% TARGET',   points: [2.1, 2.8, 3.5, 4.2, 4.8, 5.2, 5.7] },
          { label: 'TEAM TARGET',        value: '$17.6k',   sub: '20 MEMBERS',   points: [17.6, 17.6, 17.6, 17.6, 17.6, 17.6, 17.6] },
          { label: 'REMAINING DELIVERY', value: '$11.8k',   sub: 'PENDING',      points: [15.5, 14.8, 14.1, 13.4, 12.8, 12.4, 11.8] },
          { label: 'ACTIVE OPS TEAM',    value: 20,         sub: 'EXECUTIVES',   points: [18, 18, 19, 19, 20, 20, 20] },
          { label: 'EARNED INCENTIVES',  value: 'TK 12.8k', sub: 'BONUS POOL',   points: [3.2, 5.4, 7.8, 9.6, 10.8, 11.9, 12.8] },
        ];
      }
      case 'clients': {
        const total = clientsData.length;
        const meetings = clientsData.filter(c => ['MEETING DONE','MEETING SCHEDULED','MEETING STARTED'].includes(st(c)) || (c.meeting_time && String(c.meeting_time).trim())).length;
        const quotations = clientsData.filter(c => ['QUETATION PROVIDED','QUOTATION PROVIDED','CUSTOM OFFER SEND','FEATURE LIST PROVIDED'].includes(st(c)) || (c.quotation_link && String(c.quotation_link).trim())).length;
        const sold = clientsData.filter(c => st(c) === 'SOLD').length;
        const active = clientsData.filter(c => st(c).includes('ACT') || st(c).includes('QUAL') || !st(c)).length;
        const totalVal = clientsData.reduce((acc, c) => acc + (parseFloat(String(c.total_spent||'0').replace(/[^0-9.]/g, ''))||0), 0);
        return [
          { label: 'TOTAL CLIENTS',   value: total,                      sub: 'ACCOUNTS',     points: generateTrendPoints(total) },
          { label: 'ACTIVE PIPELINE', value: active,                     sub: 'ENGAGED',      points: generateTrendPoints(active) },
          { label: 'TOTAL REVENUE',   value: `$${(totalVal/1000).toFixed(1)}k`, sub: 'LTV SUM', points: generateTrendPoints(totalVal) },
          { label: 'AVG CONTRACT',    value: `$${total > 0 ? Math.round(totalVal/total) : 0}`, sub: 'PER CLIENT', points: [800, 950, 1100, 1250, 1400, 1600, total > 0 ? Math.round(totalVal/total) : 1750] },
          { label: 'RETENTION RATE',  value: '94.2%',                    sub: 'REPEAT BIZ',   points: [88, 89, 90, 91, 92, 93, 94.2] },
        ];
      }
      case 'projects': {
        const total = projectsData.length;
        const inProgress = projectsData.filter(p => {
          const s = String(p.status || '').toUpperCase();
          return s.includes('PROGRESS') || s.includes('ACTIVE') || s.includes('WIP') || s === 'IN PROGRESS';
        }).length;
        const completed = projectsData.filter(p => {
          const s = String(p.status || '').toUpperCase();
          return s.includes('COMPLETED') || s === 'DONE' || s.includes('DELIVERED');
        }).length;
        const totalEarned = projectsData.reduce((acc, p) => acc + (Number(p.deliveryAmount || p.earnedAmount) || 0), 0);
        const onTimeRate = total > 0 ? (((total - projectsData.filter(p => {
          const dl = p.deadlineDate || p.deliveryDate;
          if (!dl) return false;
          const s = String(p.status || '').toUpperCase();
          if (s.includes('COMPLETED') || s.includes('DELIVERED')) return false;
          return new Date(dl + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0);
        }).length) / total) * 100).toFixed(1) : '100.0';
        return [
          { label: 'TOTAL PROJECTS',     value: total,         sub: 'CONTRACTS',    points: generateTrendPoints(total) },
          { label: 'IN PROGRESS (WIP)',  value: inProgress,    sub: 'ACTIVE QUEUE', points: generateTrendPoints(inProgress) },
          { label: 'COMPLETED & DELIVERED', value: completed,  sub: 'DELIVERED',    points: generateTrendPoints(completed) },
          { label: 'TOTAL REVENUE ($)',  value: `$${totalEarned.toLocaleString()}`, sub: 'EARNED', points: generateTrendPoints(totalEarned) },
          { label: 'ON-TIME DELIVERY',   value: `${onTimeRate}%`, sub: 'SLA RATE',  points: [92, 94, 91, 95, 96, 98, parseFloat(onTimeRate) || 98] },
        ];
      }
      case 'overview': {
        const totalProjects = projectsData.length || 0;
        const delivered = projectsData.filter(p => (String(p?.status || '').toUpperCase().includes('DELIVERED'))).length;
        const compRate = totalProjects > 0 ? Math.round((delivered / totalProjects) * 100) : 0;
        const totalUsers = usersData.length || 1;
        return [
          { label: 'PIPELINE CAPACITY',  value: totalProjects > 0 ? '94%' : '0%', sub: 'CAPACITY', points: totalProjects > 0 ? [82, 85, 88, 90, 92, 93, 94] : [0, 0, 0, 0, 0, 0, 0] },
          { label: 'CLIENTS CONNECTED',  value: clientsData.length, sub: 'ACCOUNTS', points: generateTrendPoints(clientsData.length) },
          { label: 'ACTIVE PROJECTS',    value: totalProjects, sub: 'CONTRACTS', points: generateTrendPoints(totalProjects) },
          { label: 'DELIVERY VELOCITY',  value: compRate + '%', sub: 'COMPLETED', points: compRate > 0 ? [80, 84, 88, 91, 94, 96, compRate] : [0, 0, 0, 0, 0, 0, 0] },
          { label: 'LIVE TEAM ON DUTY',  value: totalUsers, sub: 'STAFF', points: generateTrendPoints(totalUsers) },
        ];
      }
      case 'fiverr_profiles': {
        const total = sellerProfiles.length;
        const top = sellerProfiles.filter(p => (p.level||'').toLowerCase().includes('top')).length;
        const pro = sellerProfiles.filter(p => (p.level||'').toLowerCase().includes('pro')).length;
        const lvl2 = sellerProfiles.filter(p => (p.level||'').toLowerCase().includes('level 2')).length;
        const rising = sellerProfiles.filter(p => (p.level||'').toLowerCase().includes('rising')).length;
        return [
          { label: 'TOTAL PROFILES',  value: total,  sub: 'ACCOUNTS', points: generateTrendPoints(total) },
          { label: 'TOP RATED',       value: top,    sub: 'SELLERS',  points: generateTrendPoints(top) },
          { label: 'PRO VERIFIED',    value: pro,    sub: 'SELLERS',  points: generateTrendPoints(pro) },
          { label: 'LEVEL 2',         value: lvl2,   sub: 'SELLERS',  points: generateTrendPoints(lvl2) },
          { label: 'RISING TALENT',   value: rising, sub: 'SELLERS',  points: generateTrendPoints(rising) },
        ];
      }
      case 'briefs': {
        const total = briefs.length;
        const dispatched = briefs.filter(b => b.status === 'Auto-Dispatched').length;
        const inReview = briefs.filter(b => b.status === 'In Review').length;
        return [
          { label: 'TOTAL BRIEFS',    value: total,      sub: 'INCOMING', points: generateTrendPoints(total) },
          { label: 'AUTO DISPATCHED', value: dispatched, sub: 'SENT',     points: generateTrendPoints(dispatched) },
          { label: 'IN REVIEW',       value: inReview,   sub: 'PENDING',  points: generateTrendPoints(inReview) },
          { label: 'MATCH SCORE',     value: 95,         sub: 'AVG %',    points: [82, 85, 88, 90, 92, 94, 95] },
          { label: 'WIN RATE',        value: '78.4',     sub: '% CAPTURED', points: [60, 65, 70, 72, 75, 76, 78] },
        ];
      }
      case 'orders': {
        return [
          { label: 'ACTIVE ORDERS',   value: activeOrdersCount, sub: 'IN PROGRESS', points: generateTrendPoints(activeOrdersCount) },
          { label: 'TOTAL REVENUE',   value: `$${(revenue/1000).toFixed(1)}k`, sub: 'USD VAL', points: [14, 18, 16, 22, 25, 23, 28] },
          { label: 'AVG ORDER VALUE', value: '$840',            sub: 'PER GIG',    points: [650, 700, 720, 780, 810, 830, 840] },
          { label: 'ON TIME RATE',    value: '99.2',            sub: '% ON TIME',  points: [98, 98.5, 99, 99.1, 99.2, 99.2, 99.2] },
          { label: 'COMPLETED',       value: 34,                sub: 'THIS MONTH', points: [12, 18, 22, 26, 29, 31, 34] },
        ];
      }
      case 'team': {
        const allUsers    = usersData || [];
        const total       = allUsers.length;
        const active      = allUsers.filter(u => (u.status || '').toUpperCase() === 'ACTIVE').length;
        const managers    = allUsers.filter(u => (u.role || '').includes('manager')).length;
        const departments = [...new Set(allUsers.map(u => u.department).filter(Boolean))].length;
        const executives  = allUsers.filter(u => (u.role || '').includes('executive')).length;
        return [
          { label: 'TOTAL USERS',  value: total,       sub: 'ACCOUNTS',    points: generateTrendPoints(total) },
          { label: 'ACTIVE',       value: active,      sub: 'USERS',       points: generateTrendPoints(active) },
          { label: 'MANAGERS',     value: managers,    sub: 'TEAM LEADS',  points: generateTrendPoints(managers) },
          { label: 'EXECUTIVES',   value: executives,  sub: 'MEMBERS',     points: generateTrendPoints(executives) },
          { label: 'DEPARTMENTS',  value: departments, sub: 'GROUPS',      points: generateTrendPoints(departments) },
        ];
      }
      default: {
        const totalClients = clientsData.length;
        return [
          { label: 'TOTAL CLIENTS',   value: totalClients,      sub: 'ACQUISITIONS', points: generateTrendPoints(totalClients) },
          { label: 'REVENUE',         value: `$${(revenue/1000).toFixed(1)}k`, sub: 'EARNED', points: [14, 18, 16, 22, 25, 23, 28] },
          { label: 'ACTIVE ORDERS',   value: activeOrdersCount, sub: 'IN PROGRESS',  points: [4, 8, 7, 12, 11, 15, 18] },
          { label: 'BUYER BRIEFS',    value: dispatchedCount,   sub: 'DISPATCHED',   points: [20, 45, 60, 85, 110, 128, 142] },
          { label: 'PROFILES',        value: sellerProfiles.length, sub: 'ACTIVE',   points: generateTrendPoints(sellerProfiles.length) },
        ];
      }
    }
  };

  const cards = getKpiCards();

  return (
    <div className="cli-sticky-topbar-wrapper">
      {/* 1. TOP HEADER BAR */}
      <div className="cli-top-header">
        <div className="cli-header-title-box">
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="cli-mobile-hamburger-btn"
            title="Toggle Navigation Menu"
          >
            <Menu size={18} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2"
            >
              <h1 className="cli-header-h1">{meta.label}</h1>
              <span className="cli-header-count">{meta.sub}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="cli-header-actions">
          {/* Live System Connection Inspector Pill */}
          <button
            type="button"
            onClick={onOpenInspector}
            className="cli-inspector-btn"
            title="Inspect Real-Time Database Connection & Relational Integrity"
          >
            <span className="cli-inspector-dot" />
            <Database size={13} />
            <span>14/14 DBs Live Sync</span>
          </button>

          {/* Sync Database Action Button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="cli-sync-db-btn"
            title="Sync Database"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {/* User Profile Pill */}
          <div className="cli-user-profile-pill">
            <div className="cli-user-avatar">
              {user?.full_name ? user.full_name.charAt(0) : 'S'}
            </div>
            <span className="font-bold text-xs text-slate-800">{user?.full_name || 'Super Admin'}</span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS WITH DYNAMIC REAL-TIME SPARKLINES */}
      <AnimatePresence initial={false}>
        {activeTab !== 'profile' && activeTab !== 'bonus_schemes' && activeTab !== 'leaves' && !isClientDetailsActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
            className="cli-kpi-grid"
          >
            {cards.map((card, i) => (
              <div key={i} className="cli-kpi-card">
                <div className="cli-kpi-info">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeTab + '-kpi-label-' + i}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      transition={{ duration: 0.18, delay: i * 0.02 }}
                      className="cli-kpi-label uppercase text-[11px] font-extrabold text-slate-400 tracking-wider"
                    >
                      {card.label}
                    </motion.span>
                  </AnimatePresence>
                  <div className="cli-kpi-value-row">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activeTab + '-kpi-val-' + i + '-' + card.value}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.22, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                        className="cli-kpi-num"
                      >
                        {card.value}
                      </motion.span>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activeTab + '-kpi-sub-' + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"
                      >
                        {card.sub}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab + '-sparkline-' + i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                  >
                    <DynamicSparkline
                      points={card.points}
                      color="#FF6B35"
                      gradId={`global-kpi-grad-${activeTab}-${i}`}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard({ user, onSignOut, onShowToast, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const effectiveRole = simulatedRole || user?.role || 'super_admin';
  const effectiveDepartment = user?.department;

  const userPermissions = useMemo(() => {
    return getUserPermissions(effectiveRole, effectiveDepartment);
  }, [effectiveRole, effectiveDepartment]);

  const roleDropdownRef = useRef(null);

  // Close role switcher dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  // Keep activeTab aligned with allowed permissions
  useEffect(() => {
    if (userPermissions && !userPermissions.allowedTabs.includes(activeTab)) {
      setActiveTab(userPermissions.defaultTab || userPermissions.allowedTabs[0] || 'overview');
      setIsClientDetailsActive(false);
    }
  }, [userPermissions, activeTab]);

  const [usersCount, setUsersCount] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_users_db');
      if (saved) { const p = JSON.parse(saved); if (Array.isArray(p)) return p.length; }
    } catch(e) {}
    return 1;
  });

  useEffect(() => {
    const syncUsers = () => {
      try {
        const saved = localStorage.getItem('kodevio_users_db');
        if (saved) { const p = JSON.parse(saved); if (Array.isArray(p)) setUsersCount(p.length); }
      } catch(e) {}
    };
    const id = setInterval(syncUsers, 3000);
    return () => clearInterval(id);
  }, []);
  const [activePeriod, setActivePeriod] = useState('1Y');
  const [pipelineTab, setPipelineTab] = useState('status');
  const [selectedDay, setSelectedDay] = useState(8);
  const [hoveredGeo, setHoveredGeo] = useState('Australia');
  const [activeTierLegend, setActiveTierLegend] = useState('all');

  // Lifted clients data for global KPI computation
  const [clientsData, setClientsData] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_clients_db');
      if (saved) { const p = JSON.parse(saved); if (Array.isArray(p)) return p; }
    } catch(e) {}
    return [];
  });

  // Central Real-Time Multi-Tab & Broadcast Channel Live Sync Hook
  useEffect(() => {
    const unsub = LiveSyncEngine.subscribe('*', (payload) => {
      clientsApi.fetchClients().then((res) => {
        if (res?.clients && Array.isArray(res.clients)) {
          setClientsData(res.clients);
          setClientsCount(res.clients.length);
        }
      }).catch(() => {});

      projectsApi.fetchProjects().then((res) => {
        if (res?.projects && Array.isArray(res.projects)) {
          setProjectsData(res.projects);
          setProjectsCount(res.projects.length);
        }
      }).catch(() => {});

      usersApi.fetchUsers().then((res) => {
        if (res?.users && Array.isArray(res.users)) {
          setUsersData(res.users);
          setUsersCount(res.users.length);
        }
      }).catch(() => {});

      fiverrProfilesApi.fetchProfiles().then((res) => {
        if (res?.profiles && Array.isArray(res.profiles)) {
          setSellerProfiles(res.profiles);
        }
      }).catch(() => {});
    });

    return () => unsub();
  }, []);

  // Keep clientsData in sync with localStorage updates
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem('kodevio_clients_db');
        if (saved) { const p = JSON.parse(saved); if (Array.isArray(p)) setClientsData(p); }
      } catch(e) {}
    };
    const id = setInterval(sync, 3000);
    return () => clearInterval(id);
  }, []);

  // Dynamic KPI Stats
  const [revenue, setRevenue] = useState(0);
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_clients_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  });

  useEffect(() => {
    clientsApi.fetchClients().then((res) => {
      if (res?.clients && Array.isArray(res.clients)) {
        setClientsCount(res.clients.length);
      }
    }).catch(() => {});

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem('kodevio_clients_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setClientsCount(parsed.length);
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Lifted projects data for global KPI computation & sidebar badge
  const [projectsData, setProjectsData] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_projects_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [projectsCount, setProjectsCount] = useState(projectsData.length || 0);

  useEffect(() => {
    projectsApi.fetchProjects().then((res) => {
      if (res?.projects && Array.isArray(res.projects)) {
        setProjectsData(res.projects);
        setProjectsCount(res.projects.length);
      }
    }).catch(() => {});

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem('kodevio_projects_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProjectsData(parsed);
            setProjectsCount(parsed.length);
          }
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Lifted users data for whole-system intelligence
  const [usersData, setUsersData] = useState(() => {
    try {
      const saved = localStorage.getItem('kodevio_users_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    usersApi.fetchUsers().then((res) => {
      if (res?.users && Array.isArray(res.users)) {
        setUsersData(res.users);
        setUsersCount(res.users.length);
      }
    }).catch(() => {});

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem('kodevio_users_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUsersData(parsed);
            setUsersCount(parsed.length);
          }
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ── Helper to safely extract string text from string or object {name, label, title} ──
  const getValStr = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.name) return String(val.name);
      if (val.label) return String(val.label);
      if (val.title) return String(val.title);
      if (val.username) return String(val.username);
      if (val.initials) return String(val.initials);
    }
    return fallback;
  };

  // ── Unified Whole-System Intelligence Metrics ──
  const systemMetrics = useMemo(() => {
    const totalProjects = projectsData.length || 0;
    const deliveredProjects = projectsData.filter(p => (getValStr(p.status) || '').toUpperCase() === 'DELIVERED').length;
    const inProgressProjects = projectsData.filter(p => ['IN_PROGRESS', 'IN PROGRESS', 'ACTIVE', 'WORKING'].includes((getValStr(p.status) || '').toUpperCase())).length;
    const inRevisionProjects = projectsData.filter(p => ['IN_REVISION', 'REVISION', 'IN REVIEW', 'REVIEW'].includes((getValStr(p.status) || '').toUpperCase())).length;
    const pendingProjects = Math.max(0, totalProjects - deliveredProjects - inProgressProjects - inRevisionProjects);

    const grossRevenueTotal = projectsData.reduce((acc, p) => acc + (parseFloat(p.projectValue || p.grossRevenue || 0) || 0), 0);
    const netRevenueTotal = projectsData.reduce((acc, p) => acc + (parseFloat(p.netRevenue || p.netOutput || (parseFloat(p.projectValue || 0) * 0.8)) || 0), 0);
    const totalClients = clientsData.length;
    const avgCLV = totalClients > 0 ? Math.round(grossRevenueTotal / totalClients) : 0;
    const avgProjectValue = totalProjects > 0 ? Math.round(grossRevenueTotal / totalProjects) : 0;

    const totalStaff = usersData.length || 1;
    const opsStaff = usersData.filter(u => (getValStr(u.department) || '').toUpperCase() === 'OPERATIONS').length;
    const salesStaff = usersData.filter(u => (getValStr(u.department) || '').toUpperCase() === 'SALES').length;
    const mgmtStaff = usersData.filter(u => ['MANAGEMENT', 'LEADERSHIP', 'ADMIN'].includes((getValStr(u.department) || '').toUpperCase())).length;
    const activeStaff = usersData.filter(u => (getValStr(u.status) || '').toUpperCase() === 'ACTIVE').length || totalStaff;

    const completionRate = totalProjects > 0 ? Math.round((deliveredProjects / totalProjects) * 100) : 0;

    return {
      totalProjects,
      deliveredProjects,
      inProgressProjects,
      inRevisionProjects,
      pendingProjects,
      grossRevenueTotal,
      netRevenueTotal,
      totalClients,
      avgCLV,
      avgProjectValue,
      totalStaff,
      opsStaff,
      salesStaff,
      mgmtStaff,
      activeStaff,
      completionRate
    };
  }, [projectsData, clientsData, usersData]);

  // Dynamic Client Spenders Leaderboard
  const computedClientSpenders = useMemo(() => {
    const map = {};
    projectsData.forEach((p, idx) => {
      const cName = getValStr(p.clientName, 'Partner Client');
      if (!map[cName]) {
        const rawCountry = getValStr(p.clientCountry, 'United States');
        const formatted = formatCountry(rawCountry);
        map[cName] = {
          id: `sp-${idx}`,
          name: cName,
          country: formatted.name,
          flag: formatted.flag,
          avatar: (typeof p.clientAvatar === 'string' && (p.clientAvatar.startsWith('http') || p.clientAvatar.startsWith('data:'))) ? p.clientAvatar : null,
          totalSpent: 0,
          projectsCount: 0,
          tier: idx === 0 ? 'ENTERPRISE' : idx === 1 ? 'VIP' : 'PREMIUM'
        };
      }
      map[cName].totalSpent += parseFloat(p.projectValue || p.grossRevenue || 1200) || 0;
      map[cName].projectsCount += 1;
    });

    clientsData.forEach((c, idx) => {
      const cName = getValStr(c.name || c.clientName);
      if (cName) {
        const rawCountry = getValStr(c.country || c.location, 'United States');
        const formatted = formatCountry(rawCountry);
        if (!map[cName]) {
          map[cName] = {
            id: c.id || `cli-${idx}`,
            name: cName,
            country: formatted.name,
            flag: formatted.flag,
            avatar: (typeof c.avatar === 'string' && (c.avatar.startsWith('http') || c.avatar.startsWith('data:'))) ? c.avatar : null,
            totalSpent: parseFloat(c.totalSpent || c.totalValue || 3500) || 3500,
            projectsCount: c.projectsCount || c.totalOrders || 2,
            tier: c.tier || (idx === 0 ? 'ENTERPRISE' : idx === 1 ? 'VIP' : 'GROWTH')
          };
        } else {
          if (c.totalSpent && parseFloat(c.totalSpent) > map[cName].totalSpent) {
            map[cName].totalSpent = parseFloat(c.totalSpent);
          }
          if (c.avatar) map[cName].avatar = c.avatar;
          if (c.country) {
            const f = formatCountry(c.country);
            map[cName].country = f.name;
            map[cName].flag = f.flag;
          }
        }
      }
    });

    let list = Object.values(map);
    if (list.length === 0) { list = []; }
    const sorted = list.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
    const maxVal = Math.max(...sorted.map(s => s.totalSpent || 1), 1);
    return sorted.map((s, idx) => ({
      ...s,
      rank: idx + 1,
      percentOfMax: Math.max(Math.round(((s.totalSpent || 0) / maxVal) * 100), 12)
    }));
  }, [projectsData, clientsData]);

  // Dynamic In-Flight Projects
  const activeInFlightProjects = useMemo(() => { return projectsData.slice(0, 5); }, [projectsData]);

  // Dynamic Real-time Activity Log
  const computedActivities = useMemo(() => {
    const list = [];
    projectsData.slice(0, 4).forEach((p) => {
      const isDel = (getValStr(p.status) || '').toUpperCase() === 'DELIVERED';
      const titleStr = getValStr(p.title, 'Project Milestone');
      const clientStr = getValStr(p.clientName, 'Partner');
      list.push({
        id: `act-${p.id}`,
        title: isDel ? `Project Delivered: ${titleStr}` : `Milestone in Progress: ${titleStr}`,
        sub: `Client: ${clientStr} • Value: $${(parseFloat(p.projectValue || 0)).toLocaleString()}`,
        time: p.createdAt ? 'Recently' : '2 hours ago',
        dotClass: isDel ? 'bg-orange-500' : 'bg-blue-500'
      });
    });
    // Clean state: no mock activities when list is empty
    return list;
  }, [projectsData]);

  // Fiverr Client Meetings Dataset
  const upcomingMeetings = [
    {
      id: 1,
      title: 'Fiverr Client Sync (Match #873)',
      time: '9.00 am - 10.00 am',
      platform: 'On Google Meet',
      avatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80'],
      extraCount: 7
    },
    {
      id: 2,
      title: 'Brief Review & Requirements Demo',
      time: '10.45 am - 11.45 am',
      platform: 'On Slack',
      avatars: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80']
    }
  ];

  // Fiverr Top Client Geos Dataset
  const topCountries = [
    { name: 'Australia', flag: '🇦🇺', ratio: '48%' },
    { name: 'Malaysia', flag: '🇲🇾', ratio: '33%' },
    { name: 'Indonesia', flag: '🇮🇩', ratio: '25%' },
    { name: 'Singapore', flag: '🇸🇬', ratio: '17%' },
  ];

  // Live Fiverr Briefs Queue Stream State
  const [briefs, setBriefs] = useState([
    {
      id: 'brief-101',
      title: 'Full Stack Web Application & Dashboard UI',
      buyer: 'Alex Rivera (TechCorp US)',
      budget: '$4,200',
      matchScore: '98%',
      status: 'Auto-Dispatched',
      time: '12 mins ago',
    },
    {
      id: 'brief-102',
      title: 'Next.js 14 E-Commerce Platform with Stripe',
      buyer: 'Sophie Chen (Apex Digital UK)',
      budget: '$2,800',
      matchScore: '95%',
      status: 'In Review',
      time: '45 mins ago',
    },
    {
      id: 'brief-103',
      title: 'Figma UI/UX Design System for Mobile App',
      buyer: 'Marcus Vance (Studio V AU)',
      budget: '$1,500',
      matchScore: '92%',
      status: 'Auto-Dispatched',
      time: '2 hours ago',
    },
  ]);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook':
        return <Facebook size={14} className="text-blue-600" />;
      case 'instagram':
        return <Instagram size={14} className="text-pink-600" />;
      case 'google':
        return <Globe size={14} className="text-red-500" />;
      default:
        return <Sparkles size={14} className="text-indigo-500" />;
    }
  };

  const renderAvatarsStack = (count) => {
    const initials = ['JD', 'AN', 'SK', 'RA', 'MZ'];
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-blue-500'];
    return (
      <div className="avatar-stack flex items-center">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full ${colors[i % colors.length]} text-white text-[8px] font-extrabold flex items-center justify-center border-2 border-white -ml-1.5 first:ml-0`}
            title={`Assigned Member ${i + 1}`}
          >
            {initials[i % initials.length]}
          </div>
        ))}
        {count > 3 && (
          <div
            className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-extrabold flex items-center justify-center border-2 border-white -ml-1.5"
            title={`${count - 3} more members`}
          >
            +{count - 3}
          </div>
        )}
      </div>
    );
  };

  // Real Dynamic Database Sync Handler
  // Real Dynamic Database Sync Handler
  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const data = await LiveSyncEngine.syncAll();

      if (data?.briefs && data.briefs.length > 0) {
        setBriefs(data.briefs);
      }

      if (data?.stats) {
        if (data.stats.revenue) setRevenue(data.stats.revenue);
        if (data.stats.briefsCount) setDispatchedCount(data.stats.briefsCount);
        if (data.stats.activeOrders) setActiveOrdersCount(data.stats.activeOrders);
      }

      // Trigger the bottom-right Siri circular orb toast
      if (onShowToast) onShowToast('All 8 system databases synchronized with live relational integrity!');
    } catch (err) {
      console.warn('Database Sync Note:', err.message);
      if (onShowToast) onShowToast();
    } finally {
      setIsSyncing(false);
    }
  };

  // Hook Electron System Tray "Refresh Database Sync"
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onTriggerSync) {
      const unsub = window.electronAPI.onTriggerSync(() => {
        handleSyncDatabase();
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  const getFormattedRole = (role) => {
    if (!role) return 'Super Admin';
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'agency_admin') return 'Agency Admin';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const userCode = user?.user_code || 'K001';

  // Fiverr Seller Profiles State (Clean list without scraping/crawling)
  const [sellerProfiles, setSellerProfiles] = useState([]);

  const profileFileInputRef = React.useRef(null);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [isClientDetailsActive, setIsClientDetailsActive] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    username: '',
    level: 'Level 2 Seller',
    niche: 'Web & App Development',
    avatarDataUrl: '',
  });

  const getProfileInitials = (name) => {
    if (!name) return 'FP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredSellerProfiles = sellerProfiles.filter((prof) => {
    if (!profileSearchQuery.trim()) return true;
    const q = profileSearchQuery.toLowerCase();
    return (
      prof.name?.toLowerCase().includes(q) ||
      prof.username?.toLowerCase().includes(q) ||
      prof.niche?.toLowerCase().includes(q) ||
      prof.level?.toLowerCase().includes(q)
    );
  });

  // Live Fetch Fiverr Seller Profiles from API
  useEffect(() => {
    fiverrProfilesApi.fetchProfiles()
      .then((res) => {
        if (res?.success && Array.isArray(res.profiles)) {
          setSellerProfiles(res.profiles);
        }
      })
      .catch((err) => {
        console.warn('Backend API fetch note (using active state fallback):', err.message);
      });
  }, []);

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProfileForm((prev) => ({
        ...prev,
        avatarDataUrl: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!newProfileForm.name || !newProfileForm.username) return;

    const cleanUsername = newProfileForm.username.trim().replace('@', '');
    let bClass = 'badge-level-2';
    if (newProfileForm.level.includes('Top Rated')) bClass = 'badge-top-rated';
    if (newProfileForm.level.includes('Pro')) bClass = 'badge-pro';
    if (newProfileForm.level.includes('Rising')) bClass = 'badge-rising';

    const payload = {
      name: newProfileForm.name.trim(),
      username: cleanUsername,
      level: newProfileForm.level,
      badgeClass: bClass,
      avatar: newProfileForm.avatarDataUrl || null,
      niche: newProfileForm.niche,
      profileUrl: `https://www.fiverr.com/${cleanUsername}`,
    };

    try {
      const res = await fiverrProfilesApi.createProfile(payload);
      if (res?.success && res.profile) {
        setSellerProfiles((prev) => [res.profile, ...prev.filter((p) => p.id !== res.profile.id)]);
      } else {
        const fallbackObj = { id: `fp-${Date.now()}`, ...payload };
        setSellerProfiles((prev) => [fallbackObj, ...prev]);
      }
    } catch (err) {
      console.warn('API create note, applying live local fallback:', err);
      const fallbackObj = { id: `fp-${Date.now()}`, ...payload };
      setSellerProfiles((prev) => [fallbackObj, ...prev]);
    }

    setIsAddProfileModalOpen(false);
    setNewProfileForm({
      name: '',
      username: '',
      level: 'Level 2 Seller',
      niche: 'Web & App Development',
      avatarDataUrl: '',
    });
    if (onShowToast) onShowToast();
  };

  const handleRemoveProfile = async (id) => {
    setSellerProfiles((prev) => prev.filter((p) => p.id !== id));
    try {
      await fiverrProfilesApi.deleteProfile(id);
    } catch (err) {
      console.warn('API delete note:', err.message);
    }
    if (onShowToast) onShowToast();
  };

  const navGroups = useMemo(() => {
    const rawGroups = [
      {
        groupTitle: 'WORKSPACE',
        items: [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
          { id: 'fiverr_profiles', label: 'Fiverr Profiles', icon: Globe, badge: `${sellerProfiles.length}` },
          { id: 'clients', label: 'Clients', icon: Users, badge: `${clientsCount}` },
          { id: 'projects', label: 'Projects', icon: Package, badge: `${projectsCount}` },
        ],
      },
      {
        groupTitle: 'PERFORMANCE',
        items: [
          { id: 'sales_dashboard', label: 'Sales Monthly Dashboard', icon: TrendingUp, badge: null },
          { id: 'ops_dashboard', label: 'Operations Monthly Dashboard', icon: Briefcase, badge: null },
        ],
      },
      {
        groupTitle: 'ORGANIZATION',
        items: [
          { id: 'leaves', label: 'Leave Applications', icon: CalendarDays, badge: 'HR' },
          { id: 'profile', label: 'Profile Settings', icon: User, badge: null },
          { id: 'team', label: 'Users', icon: Users, badge: `${usersCount}` },
          { id: 'bonus_schemes', label: 'Bonus Schemes', icon: Award, badge: 'OPS & SALES' },
        ],
      },
    ];

    // Filter by allowed tabs for the current effective user role
    return rawGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => userPermissions.allowedTabs.includes(item.id)),
      }))
      .filter((group) => group.items.length > 0);
  }, [sellerProfiles.length, clientsCount, projectsCount, usersCount, userPermissions]);

  // Standardized Fluid Motion Physics Engine for All 15 Modules
  const viewMotionProps = {
    initial: { opacity: 0, y: 14, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.995 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div className="desktop-app-wrapper flex flex-col w-full min-h-screen">
      <div className="dash-sidebar-layout flex-1">
        {/* Mobile Overlay Drawer Backdrop */}
        {isMobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Redesigned Premium Left Sidebar */}
      <aside className={`dash-sidebar-v2 ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Top Brand & Logged-In User Role Badge with Sequential User ID (K001) */}
        <div className="sidebar-v2-header">
          <div className="flex items-center justify-between w-full">
            <a href="#" className="sidebar-brand-box-v2">
              <img src={logoImg} alt="Kodevio Logo" className="brand-logo-img" />
              <div className="brand-titles">
                <span className="brand-name-text">Kodevio</span>
                <span className="brand-sub-tag">Agency OS v2.4</span>
              </div>
            </a>
            {/* Close button on mobile drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="sidebar-mobile-close-btn"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Clean Dynamic User Role & User ID Pill (Interactive Role Switcher for Admin preview) */}
          <div ref={roleDropdownRef} className="relative w-full">
            <div
              className={`workspace-pill flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors ${simulatedRole ? 'ring-2 ring-orange-500/50 bg-orange-50/50' : ''}`}
              title="Click to preview different department dashboard views"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`ws-dot ${simulatedRole ? 'bg-orange-500 animate-pulse' : ''}`} />
                <span className="ws-name truncate">{userPermissions.roleName || getFormattedRole(effectiveRole)}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                  {userCode}
                </span>
              </div>
            </div>

            {/* Live Role Switcher Dropdown */}
            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="role-switcher-dropdown"
                >
                  <div className="role-switcher-title">
                    Switch Dashboard Role View
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedRole(null);
                      setIsRoleDropdownOpen(false);
                      if (onShowToast) onShowToast('Switched to your real account role: Super Admin');
                    }}
                    className={`role-switcher-item ${!simulatedRole ? 'is-admin-active' : ''}`}
                  >
                    <div className="role-switcher-item-left">
                      <Shield size={14} className={!simulatedRole ? 'text-orange-600' : 'text-orange-500'} />
                      <span className="role-switcher-item-text">Super Admin (Full 9 Modules)</span>
                    </div>
                    {!simulatedRole && <Check size={13} className="text-orange-600 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedRole('sales_manager');
                      setIsRoleDropdownOpen(false);
                      if (onShowToast) onShowToast('Switched to Sales Department Dashboard');
                    }}
                    className={`role-switcher-item ${simulatedRole === 'sales_manager' ? 'is-sales-active' : ''}`}
                  >
                    <div className="role-switcher-item-left">
                      <TrendingUp size={14} className={simulatedRole === 'sales_manager' ? 'text-emerald-700' : 'text-emerald-500'} />
                      <span className="role-switcher-item-text">Sales Manager (Sales & Leads)</span>
                    </div>
                    {simulatedRole === 'sales_manager' && <Check size={13} className="text-emerald-700 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedRole('ops_manager');
                      setIsRoleDropdownOpen(false);
                      if (onShowToast) onShowToast('Switched to Operations / PM Dashboard');
                    }}
                    className={`role-switcher-item ${simulatedRole === 'ops_manager' ? 'is-ops-active' : ''}`}
                  >
                    <div className="role-switcher-item-left">
                      <Briefcase size={14} className={simulatedRole === 'ops_manager' ? 'text-blue-700' : 'text-blue-500'} />
                      <span className="role-switcher-item-text">Operations / Project Manager</span>
                    </div>
                    {simulatedRole === 'ops_manager' && <Check size={13} className="text-blue-700 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedRole('developer');
                      setIsRoleDropdownOpen(false);
                      if (onShowToast) onShowToast('Switched to Developer / Engineer Dashboard');
                    }}
                    className={`role-switcher-item ${simulatedRole === 'developer' ? 'is-dev-active' : ''}`}
                  >
                    <div className="role-switcher-item-left">
                      <Code size={14} className={simulatedRole === 'developer' ? 'text-amber-700' : 'text-amber-500'} />
                      <span className="role-switcher-item-text">Developer / Engineering</span>
                    </div>
                    {simulatedRole === 'developer' && <Check size={13} className="text-amber-700 flex-shrink-0" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="sidebar-v2-nav">
          {navGroups.map((group, idx) => (
            <div key={idx} className="nav-group-section">
              <span className="nav-group-header">{group.groupTitle}</span>
              <div className="nav-group-list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsClientDetailsActive(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`sidebar-v2-item ${isActive ? 'active' : ''}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActivePill"
                          className="sidebar-active-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}

                      <div className="item-left">
                        {Icon && <Icon size={16} className={`item-icon ${isActive ? 'active' : ''}`} />}
                        <span className="item-label">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`item-badge ${
                            item.badge === 'ON' ? 'badge-green' : 'badge-neutral'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar Action */}
        <div className="sidebar-v2-footer">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignOut}
            className="sidebar-logout-btn"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Dashboard Workspace Content */}
      <div className="dash-content-area-v2">
        {/* ── GLOBAL STICKY TOP BAR (all panels) ── */}
        <GlobalTopBar
          activeTab={activeTab}
          user={user}
          isSyncing={isSyncing}
          onSync={handleSyncDatabase}
          onOpenInspector={() => setIsInspectorOpen(true)}
          clientsData={clientsData}
          projectsData={projectsData}
          sellerProfiles={sellerProfiles}
          briefs={briefs}
          dispatchedCount={dispatchedCount}
          activeOrdersCount={activeOrdersCount}
          revenue={revenue}
          isClientDetailsActive={isClientDetailsActive}
          usersData={usersData}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Simulation Mode Notification Banner */}
        <AnimatePresence>
          {simulatedRole && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm z-30 flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="animate-pulse" />
                <span>Simulating Role: <strong>{userPermissions.roleName} ({userPermissions.department})</strong> — Dashboard tabs and accessibilities dynamically filtered.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSimulatedRole(null);
                  if (onShowToast) onShowToast('Reset to Super Admin view');
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-extrabold transition-colors cursor-pointer"
              >
                Reset to Super Admin
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className={`dash-tab-viewport ${activeTab === 'overview' || activeTab === 'clients' || activeTab === 'projects' || activeTab === 'profile' || activeTab === 'fiverr_profiles' || activeTab === 'team' || activeTab === 'bonus_schemes' || activeTab === 'sales_dashboard' || activeTab === 'ops_dashboard' ? 'clients-tab-active' : ''}`}>
          <AnimatePresence mode="wait">
            {/* OVERVIEW PANEL — MINIMAL & CLEAN EXECUTIVE COMMAND CENTER */}
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                {...viewMotionProps}
                className="ovw-root"
              >
                {/* Top 4 Clean KPI Metric Cards */}
                <div className="ovw-kpi-grid">
                  {/* KPI 1: Gross Revenue */}
                  <div className="ovw-kpi-card">
                    <div className="ovw-kpi-top">
                      <div className="ovw-kpi-meta">
                        <span className="ovw-kpi-label">Gross Revenue</span>
                      </div>
                      <div className="ovw-kpi-icon-box">
                        <DollarSign size={15} />
                      </div>
                    </div>
                    <div className="ovw-kpi-center">
                      <span className="ovw-kpi-val">${systemMetrics.grossRevenueTotal.toLocaleString()}</span>
                      <span className="ovw-kpi-badge">
                        <span>{systemMetrics.grossRevenueTotal > 0 ? '↑ 18.4%' : '0%'}</span>
                      </span>
                    </div>
                    <div className="ovw-kpi-footer">
                      <span>Net: ${systemMetrics.netRevenueTotal.toLocaleString()} (80%)</span>
                      <span>Avg Deal: ${systemMetrics.avgProjectValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* KPI 2: Active Pipeline */}
                  <div className="ovw-kpi-card">
                    <div className="ovw-kpi-top">
                      <div className="ovw-kpi-meta">
                        <span className="ovw-kpi-label">Active Projects</span>
                      </div>
                      <div className="ovw-kpi-icon-box">
                        <FolderKanban size={15} />
                      </div>
                    </div>
                    <div className="ovw-kpi-center">
                      <span className="ovw-kpi-val">{systemMetrics.inProgressProjects + systemMetrics.inRevisionProjects} Active</span>
                      <span className="ovw-kpi-badge">
                        <span>{systemMetrics.completionRate}% Done</span>
                      </span>
                    </div>
                    <div className="ovw-kpi-footer">
                      <span>{systemMetrics.deliveredProjects} Delivered</span>
                      <span>{systemMetrics.inRevisionProjects} In Revision</span>
                    </div>
                  </div>

                  {/* KPI 3: Client Accounts */}
                  <div className="ovw-kpi-card">
                    <div className="ovw-kpi-top">
                      <div className="ovw-kpi-meta">
                        <span className="ovw-kpi-label">Client Partners</span>
                      </div>
                      <div className="ovw-kpi-icon-box">
                        <Users size={15} />
                      </div>
                    </div>
                    <div className="ovw-kpi-center">
                      <span className="ovw-kpi-val">{systemMetrics.totalClients} Accounts</span>
                      <span className="ovw-kpi-badge">
                        <span>{systemMetrics.totalClients > 0 ? '100% Retention' : '0% Retention'}</span>
                      </span>
                    </div>
                    <div className="ovw-kpi-footer">
                      <span>Avg CLV: ${systemMetrics.avgCLV.toLocaleString()}</span>
                      <span>{computedClientSpenders.length} Top Spenders</span>
                    </div>
                  </div>

                  {/* KPI 4: Total Agency Workforce */}
                  <div className="ovw-kpi-card">
                    <div className="ovw-kpi-top">
                      <div className="ovw-kpi-meta">
                        <span className="ovw-kpi-label">Workforce on Duty</span>
                      </div>
                      <div className="ovw-kpi-icon-box">
                        <ShieldCheck size={15} />
                      </div>
                    </div>
                    <div className="ovw-kpi-center">
                      <span className="ovw-kpi-val">{systemMetrics.totalStaff} Staff</span>
                      <span className="ovw-kpi-badge">
                        <span>{systemMetrics.activeStaff} Active</span>
                      </span>
                    </div>
                    <div className="ovw-kpi-footer">
                      <span>{systemMetrics.opsStaff} Ops</span>
                      <span>{systemMetrics.salesStaff} Sales</span>
                      <span>{systemMetrics.mgmtStaff} Mgmt</span>
                    </div>
                  </div>
                </div>

                {/* 3. Main Workspace 2-Column Grid (65% Left / 35% Right) */}
                <div className="ovw-main-grid">
                  {/* Left Column: Revenue Trajectory + Recent Projects Table */}
                  <div className="ovw-col-left">
                    {/* Revenue Spline Chart Panel */}
                    <div className="ovw-card">
                      <div className="ovw-card-header">
                        <div className="ovw-card-title-group">
                          <div className="ovw-card-icon-badge">
                            <TrendingUp size={15} />
                          </div>
                          <div>
                            <h3 className="ovw-card-title">Revenue Performance</h3>
                            <p className="ovw-card-sub">Monthly earnings and target trajectory</p>
                          </div>
                        </div>

                        <div className="ovw-period-pills">
                          {['1M', '3M', '6M', '1Y', 'ALL'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setActivePeriod(p)}
                              className={`ovw-period-pill ${activePeriod === p ? 'active' : ''}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="ovw-card-body">
                        <div className="ovw-chart-top">
                          <div className="flex items-baseline gap-2">
                            <span className="ovw-chart-val-big">${systemMetrics.grossRevenueTotal.toLocaleString()}</span>
                            <span className="ovw-chart-val-sub font-semibold text-xs">
                              {systemMetrics.grossRevenueTotal > 0 ? '↑ +22.4% vs last period' : '0% vs last period'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            Period: <strong className="text-slate-700">{activePeriod}</strong>
                          </span>
                        </div>

                        <div style={{ height: '175px', width: '100%' }}>
                          <FreshRevenueChart period={activePeriod} grossRevenue={systemMetrics.grossRevenueTotal} />
                        </div>

                        <div className="ovw-chart-strip-metrics">
                          <div className="ovw-metric-cell">
                            <span className="ovw-metric-lbl">Monthly Average</span>
                            <span className="ovw-metric-num">${Math.round(systemMetrics.grossRevenueTotal / 12).toLocaleString()}/mo</span>
                          </div>
                          <div className="ovw-metric-cell">
                            <span className="ovw-metric-lbl">Net Margin (80%)</span>
                            <span className="ovw-metric-num">${Math.round(systemMetrics.netRevenueTotal).toLocaleString()}</span>
                          </div>
                          <div className="ovw-metric-cell">
                            <span className="ovw-metric-lbl">Target Attainment</span>
                            <span className="ovw-metric-num text-orange-600 font-bold">{systemMetrics.grossRevenueTotal > 0 ? "96.8%" : "0%"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Projects Table */}
                    <div className="ovw-card">
                      <div className="ovw-card-header">
                        <div className="ovw-card-title-group">
                          <div className="ovw-card-icon-badge">
                            <Briefcase size={15} />
                          </div>
                          <div>
                            <h3 className="ovw-card-title">Recent Projects</h3>
                            <p className="ovw-card-sub">Active client delivery milestones</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="ovw-action-btn"
                        >
                          <span>View all projects ({systemMetrics.totalProjects})</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className="ovw-table-wrapper">
                        <table className="ovw-table">
                          <thead>
                            <tr>
                              <th>Project</th>
                              <th>Client</th>
                              <th>Category</th>
                              <th>Assigned Handler</th>
                              <th>Value</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeInFlightProjects.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="text-center py-8 text-slate-400 text-xs font-medium">
                                  No active projects recorded
                                </td>
                              </tr>
                            ) : activeInFlightProjects.map((p) => {
                              const pStatus = getValStr(p.status, 'IN_PROGRESS');
                              const pRawTitle = getValStr(p.title, 'Project Milestone');
                              const pCleanTitle = formatProjectTitle(pRawTitle);
                              const pCode = getValStr(p.projectCode || p.id, 'PRJ-101');
                              const pClientName = getValStr(p.clientName, 'Partner Client');
                              const rawCountry = getValStr(p.clientCountry, 'United States');
                              const countryObj = formatCountry(rawCountry);
                              const pCategory = getValStr(p.category, 'Web App');
                              const pOps = getValStr(p.opsMember || p.teamMember, 'Dev Team');
                              const pSales = getValStr(p.salesHandler, 'Manager');
                              const pDeadline = getValStr(p.deadline, 'On Schedule');
                              const pAvatar = (typeof p.clientAvatar === 'string' && (p.clientAvatar.startsWith('http') || p.clientAvatar.startsWith('data:'))) ? p.clientAvatar : null;

                              return (
                                <tr key={p.id} className="ovw-table-row">
                                  <td>
                                    <div className="ovw-proj-cell">
                                      <span className="ovw-proj-title" title={pRawTitle}>{pCleanTitle}</span>
                                      <span className="ovw-proj-code-pill">{pCode}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="ovw-client-cell">
                                      <SafeAvatar
                                        src={pAvatar}
                                        name={pClientName}
                                        size={24}
                                      />
                                      <div className="ovw-client-info">
                                        <span className="ovw-client-name">{pClientName}</span>
                                        <span className="ovw-client-country">{countryObj.flag} {countryObj.name}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="ovw-cat-pill">
                                      {pCategory}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="flex flex-col text-[11px]">
                                      <span className="font-semibold text-slate-700">{pOps}</span>
                                      <span className="text-slate-400 text-[10px]">Sales: {pSales}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="font-mono font-bold text-slate-900 text-xs">
                                        ${(parseFloat(p.projectValue || p.grossRevenue || 1200)).toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        Due: {pDeadline}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`ovw-status-pill ${pStatus.toUpperCase() === 'DELIVERED' ? 'ovw-status-delivered' : ['IN_PROGRESS', 'IN PROGRESS', 'ACTIVE'].includes(pStatus.toUpperCase()) ? 'ovw-status-inprogress' : 'ovw-status-revision'}`}>
                                      {pStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Operations Capacity + Top Clients + Recent Activity */}
                  <div className="ovw-col-right">
                    {/* Capacity & Performance - Circular Pie Graph Redesign */}
                    <div className="ovw-card">
                      <div className="ovw-card-header">
                        <div className="ovw-card-title-group">
                          <div className="ovw-card-icon-badge">
                            <Layers size={15} />
                          </div>
                          <div>
                            <h3 className="ovw-card-title">Capacity &amp; Performance</h3>
                            <p className="ovw-card-sub">{systemMetrics.activeStaff}/{systemMetrics.totalStaff} team members active</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          {systemMetrics.totalProjects > 0 ? '88% Avg SLA' : '100% Avg SLA'}
                        </span>
                      </div>

                      <div className="ovw-card-body">
                        {(() => {
                          const tot = Math.max(systemMetrics.totalProjects, 1);
                          const del = systemMetrics.deliveredProjects || 0;
                          const prog = systemMetrics.inProgressProjects || 0;
                          const rev = systemMetrics.inRevisionProjects || 0;

                          const pDel = Math.round((del / tot) * 100);
                          const pProg = Math.round((prog / tot) * 100);
                          const pRev = Math.max(0, 100 - pDel - pProg);

                          // Circumference for r=44 is ~ 276.46
                          const C = 276.46;
                          const lenDel = (pDel / 100) * C;
                          const lenProg = (pProg / 100) * C;
                          const lenRev = (pRev / 100) * C;

                          return (
                            <>
                              {/* Top: Circular Donut Pie Graph + Legend */}
                              <div className="ovw-pie-container">
                                <div className="ovw-pie-chart-wrap">
                                  <svg width="108" height="108" viewBox="0 0 110 110" className="transform -rotate-90">
                                    {/* Track */}
                                    <circle
                                      cx="55"
                                      cy="55"
                                      r="44"
                                      fill="transparent"
                                      stroke="#F1F5F9"
                                      strokeWidth="11"
                                    />
                                    {/* Delivered Arc (Orange) */}
                                    {pDel > 0 && (
                                      <circle
                                        cx="55"
                                        cy="55"
                                        r="44"
                                        fill="transparent"
                                        stroke="#EA580C"
                                        strokeWidth="11"
                                        strokeDasharray={`${lenDel} ${C}`}
                                        strokeDashoffset={0}
                                        strokeLinecap="round"
                                        className="transition-all duration-700 ease-out"
                                      />
                                    )}
                                    {/* In Progress Arc (Blue) */}
                                    {pProg > 0 && (
                                      <circle
                                        cx="55"
                                        cy="55"
                                        r="44"
                                        fill="transparent"
                                        stroke="#3B82F6"
                                        strokeWidth="11"
                                        strokeDasharray={`${lenProg} ${C}`}
                                        strokeDashoffset={`-${lenDel}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-700 ease-out"
                                      />
                                    )}
                                    {/* Revision Arc (Amber) */}
                                    {pRev > 0 && (
                                      <circle
                                        cx="55"
                                        cy="55"
                                        r="44"
                                        fill="transparent"
                                        stroke="#F59E0B"
                                        strokeWidth="11"
                                        strokeDasharray={`${lenRev} ${C}`}
                                        strokeDashoffset={`-${lenDel + lenProg}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-700 ease-out"
                                      />
                                    )}
                                  </svg>

                                  {/* Center Donut Label */}
                                  <div className="ovw-pie-center-badge">
                                    <span className="ovw-pie-center-num">{systemMetrics.totalProjects || 0}</span>
                                    <span className="ovw-pie-center-lbl">Projects</span>
                                  </div>
                                </div>

                                {/* Legend Breakdown */}
                                <div className="ovw-pie-legend">
                                  <div className="ovw-pie-legend-row">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                      <span className="font-bold text-slate-800 truncate">Delivered</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[11px]">
                                      <strong className="text-orange-600 font-bold">{del}</strong>
                                      <span className="text-slate-400 text-[10px]">({pDel}%)</span>
                                    </div>
                                  </div>

                                  <div className="ovw-pie-legend-row">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                      <span className="font-bold text-slate-800 truncate">In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[11px]">
                                      <strong className="text-blue-600 font-bold">{prog}</strong>
                                      <span className="text-slate-400 text-[10px]">({pProg}%)</span>
                                    </div>
                                  </div>

                                  <div className="ovw-pie-legend-row">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                      <span className="font-bold text-slate-800 truncate">In Revision</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[11px]">
                                      <strong className="text-amber-600 font-bold">{rev}</strong>
                                      <span className="text-slate-400 text-[10px]">({pRev}%)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom: 2 Circular Radial Gauges */}
                              <div className="ovw-pie-radial-grid">
                                <div className="ovw-pie-radial-card">
                                  <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 36 36" className="transform -rotate-90">
                                      <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="3.2" />
                                      <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#EA580C"
                                        strokeWidth="3.2"
                                        strokeDasharray={`${((systemMetrics.totalProjects > 0 ? 78 : 0) / 100) * 88} 88`}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <span className="absolute text-[8px] font-black text-slate-800 font-mono">{systemMetrics.totalProjects > 0 ? "78%" : "0%"}</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">Team Load</span>
                                    <span className="text-[9px] text-slate-400 font-medium">Ops Capacity</span>
                                  </div>
                                </div>

                                <div className="ovw-pie-radial-card">
                                  <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 36 36" className="transform -rotate-90">
                                      <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="3.2" />
                                      <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#10B981"
                                        strokeWidth="3.2"
                                        strokeDasharray={`${((systemMetrics.totalProjects > 0 ? 94.2 : 100) / 100) * 88} 88`}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <span className="absolute text-[8px] font-black text-slate-800 font-mono">{systemMetrics.totalProjects > 0 ? "94%" : "100%"}</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">On-Time SLA</span>
                                    <span className="text-[9px] text-slate-400 font-medium">{systemMetrics.totalProjects > 0 ? "94.2% Target" : "100% Target"}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Top Clients - Redesigned Clean & Minimal */}
                    <div className="ovw-card">
                      <div className="ovw-card-header">
                        <div className="ovw-card-title-group">
                          <div className="ovw-card-icon-badge">
                            <Star size={15} />
                          </div>
                          <div>
                            <h3 className="ovw-card-title">Top Clients</h3>
                            <p className="ovw-card-sub">Ranked by total booked contract volume</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('clients')}
                          className="ovw-action-btn"
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.68rem' }}
                        >
                          <span>View all ({clientsData.length || computedClientSpenders.length})</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>

                      <div className="ovw-card-body">
                        <div className="flex flex-col divide-y divide-slate-100">
                          {computedClientSpenders.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-medium">
                              No client spenders recorded
                            </div>
                          ) : computedClientSpenders.map((client, idx) => {
                            const rankClass = idx === 0 ? 'ovw-client-rank-1' : idx === 1 ? 'ovw-client-rank-2' : idx === 2 ? 'ovw-client-rank-3' : 'ovw-client-rank-def';
                            const ordersLabel = client.projectsCount === 1 ? '1 order' : `${client.projectsCount} orders`;

                            return (
                              <div
                                key={client.id || idx}
                                onClick={() => setActiveTab('clients')}
                                className="ovw-client-item"
                                title={`Click to inspect ${client.name}'s profile & contracts`}
                              >
                                <div className="ovw-client-left">
                                  <span className={`ovw-client-rank ${rankClass}`}>
                                    #{idx + 1}
                                  </span>

                                  <div className="relative flex-shrink-0">
                                    <SafeAvatar
                                      src={client.avatar}
                                      name={client.name}
                                      size={30}
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                                  </div>

                                  <div className="ovw-client-title-col">
                                    <div className="ovw-client-name-row">
                                      <span className="ovw-client-name">{client.name}</span>
                                      {client.tier && (
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60 leading-none">
                                          {client.tier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="ovw-client-meta">
                                      <span>{client.flag || '🇺🇸'}</span>
                                      <span className="truncate max-w-[110px]">{client.country}</span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-slate-400">{ordersLabel}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="ovw-client-val-group">
                                  <span className="ovw-client-val">
                                    ${(client.totalSpent || 0).toLocaleString()}
                                  </span>
                                  <div className="ovw-client-bar-track" title={`${client.percentOfMax}% of top tier volume`}>
                                    <div
                                      className="ovw-client-bar-fill"
                                      style={{ width: `${client.percentOfMax || 25}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fiverr Seller Profiles Panel (Full View matching Clients View) */}
            {activeTab === 'fiverr_profiles' && (
              <motion.div
                key="tab-fiverr-profiles"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <FiverrProfilesView
                  onShowToast={onShowToast}
                  onSyncDatabase={handleSyncDatabase}
                  isSyncing={isSyncing}
                  user={user}
                  onProfilesChange={setSellerProfiles}
                />
              </motion.div>
            )}

            {/* Clients Panel Full View */}
            {activeTab === 'clients' && (
              <motion.div
                key="tab-clients"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <ClientsView
                  onShowToast={onShowToast}
                  onSyncDatabase={handleSyncDatabase}
                  isSyncing={isSyncing}
                  user={user}
                  onClientsChange={setClientsData}
                  onViewingDetailsChange={setIsClientDetailsActive}
                />
              </motion.div>
            )}

            {/* Projects Panel Full View */}
            {activeTab === 'projects' && (
              <motion.div
                key="tab-projects"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <ProjectsView
                  onShowToast={onShowToast}
                  onSyncDatabase={handleSyncDatabase}
                  isSyncing={isSyncing}
                  user={user}
                  onProjectsChange={(nextProjects) => {
                    setProjectsData(nextProjects);
                    setProjectsCount(nextProjects.length);
                  }}
                  onViewingDetailsChange={setIsClientDetailsActive}
                />
              </motion.div>
            )}

            {/* Profile Settings Full View */}
            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <ProfileSettingsView
                  user={user}
                  onSave={onUpdateUser}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {/* Users / Team Panel */}
            {activeTab === 'team' && (
              <motion.div
                key="tab-team"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <UsersView user={user} onShowToast={onShowToast} />
              </motion.div>
            )}

            {/* Bonus Schemes Panel (Operations & Sales Only) */}
            {activeTab === 'bonus_schemes' && (
              <motion.div
                key="tab-bonus-schemes"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <BonusSchemesView user={user} onShowToast={onShowToast} />
              </motion.div>
            )}

            {/* Sales Monthly Dashboard Panel */}
            {activeTab === 'sales_dashboard' && (
              <motion.div
                key="tab-sales-dashboard"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <SalesMonthlyDashboardView
                  user={user}
                  projectsData={projectsData}
                  clientsData={clientsData}
                  sellerProfiles={sellerProfiles}
                  usersData={(() => {
                    try { const s = localStorage.getItem('kodevio_users_db'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch(e) {}
                    return [];
                  })()}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {/* Operations Monthly Dashboard Panel */}
            {activeTab === 'ops_dashboard' && (
              <motion.div
                key="tab-ops-dashboard"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <OperationsMonthlyDashboardView
                  user={user}
                  projectsData={projectsData}
                  clientsData={clientsData}
                  sellerProfiles={sellerProfiles}
                  usersData={(() => {
                    try { const s = localStorage.getItem('kodevio_users_db'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch(e) {}
                    return [];
                  })()}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {/* Leaves & HR Management Panel */}
            {activeTab === 'leaves' && (
              <motion.div
                key="tab-leaves"
                {...viewMotionProps}
                className="w-full flex-1 flex flex-col min-h-full"
              >
                <LeavesView
                  user={user}
                  onShowToast={onShowToast}
                  isManagerOrAdmin={userPermissions.canManageUsers || userPermissions.canDeliverProjects}
                />
              </motion.div>
            )}

            {/* Generic Placeholder Views */}
            {activeTab !== 'overview' && activeTab !== 'fiverr_profiles' && activeTab !== 'clients' && activeTab !== 'projects' && activeTab !== 'profile' && activeTab !== 'team' && activeTab !== 'bonus_schemes' && activeTab !== 'sales_dashboard' && activeTab !== 'ops_dashboard' && activeTab !== 'leaves' && (
              <motion.div
                key={`tab-${activeTab}`}
                {...viewMotionProps}
                className="dash-card-panel text-center py-12"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-700 font-bold">
                  {activeTab.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-slate-900 capitalize mb-1">
                  {activeTab.replace('-', ' ')} Panel
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                  Configure live settings and dispatch rules for your Kodevio agency workspace.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="dash-primary-btn mx-auto"
                >
                  Return to Overview
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ADD SELLER PROFILE MODAL */}
      <AnimatePresence>
        {isAddProfileModalOpen && (
          <div className="fp-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2 }}
              className="fp-modal-card-compact"
            >
              <div className="fp-modal-header-compact">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-emerald-600" />
                  <h3 className="fp-modal-title-compact">Add Fiverr Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProfileModalOpen(false)}
                  className="fp-modal-close-btn"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddProfile}>
                <div className="fp-modal-body-compact">
                  {/* Row 1: Name & Username */}
                  <div className="fp-form-row-2col">
                    <div className="fp-form-group">
                      <label className="fp-form-label">Display Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Kodevio Studio"
                        value={newProfileForm.name}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, name: e.target.value })}
                        className="fp-input-field-compact"
                      />
                    </div>

                    <div className="fp-form-group">
                      <label className="fp-form-label">Fiverr Username</label>
                      <input
                        type="text"
                        required
                        placeholder="kodevio_dev"
                        value={newProfileForm.username}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, username: e.target.value })}
                        className="fp-input-field-compact"
                      />
                    </div>
                  </div>

                  {/* Row 2: Level Badge & Niche */}
                  <div className="fp-form-row-2col">
                    <div className="fp-form-group">
                      <label className="fp-form-label">Seller Level</label>
                      <CustomSelect
                        size="compact"
                        value={newProfileForm.level}
                        onChange={(val) => setNewProfileForm({ ...newProfileForm, level: val })}
                        options={[
                          'Top Rated Seller',
                          'Level 2 Seller',
                          'Level 1 Seller',
                          'Pro Verified',
                          'Rising Talent',
                        ]}
                        icon={Award}
                      />
                    </div>

                    <div className="fp-form-group">
                      <label className="fp-form-label">Service Niche</label>
                      <CustomSelect
                        size="compact"
                        value={newProfileForm.niche}
                        onChange={(val) => setNewProfileForm({ ...newProfileForm, niche: val })}
                        options={[
                          'Web & App Development',
                          'UI/UX & Mobile Design',
                          'SEO & Performance Marketing',
                          'AI & Automation Services',
                          'Graphic & Brand Design',
                        ]}
                        icon={Briefcase}
                      />
                    </div>
                  </div>

                  {/* Row 3: Compact Avatar Photo Upload */}
                  <div className="fp-form-group">
                    <label className="fp-form-label">Profile Avatar Photo</label>
                    <input
                      type="file"
                      ref={profileFileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfileImageUpload}
                    />

                    <div className="fp-upload-box-compact">
                      <div className="flex items-center gap-3">
                        {newProfileForm.avatarDataUrl ? (
                          <img
                            src={newProfileForm.avatarDataUrl}
                            alt="Uploaded Preview"
                            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                            <Camera size={15} />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => profileFileInputRef.current?.click()}
                          className="fp-btn-upload-compact"
                        >
                          <Upload size={12} />
                          <span>{newProfileForm.avatarDataUrl ? 'Change Photo' : 'Upload Image'}</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">PNG, JPG or WEBP</span>
                    </div>
                  </div>
                </div>

                <div className="fp-modal-footer-compact">
                  <button
                    type="button"
                    onClick={() => setIsAddProfileModalOpen(false)}
                    className="fp-btn-cancel-compact"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="fp-btn-submit-compact"
                  >
                    <Plus size={14} />
                    <span>Add Profile</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Whole-System Connection & Database Live Sync Inspector Modal */}
      <SystemHealthInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onShowToast={onShowToast}
      />
      </div>
    </div>
  );
}
