import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Globe,
  Trash2,
  Upload,
  Calendar,
  Download,
  Paperclip,
  FileText,
  User,
  MessageSquare,
  Tag,
  Briefcase,
  Info,
  Settings,
  Bell,
  Filter,
  ArrowUpDown,
  Grid,
  List,
  MoreHorizontal,
  Edit2,
  UserCheck,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  Clock,
  UserPlus,
  CheckCircle2,
  CheckCircle,
  Award,
  Video,
  Save,
  RotateCcw,
  Users,
  FolderKanban
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import CustomTimePicker from './common/CustomTimePicker';
import ClientDetailsView from './ClientDetailsView';
import { clientsApi, fiverrProfilesApi } from '../api/client';
import { LiveSyncEngine } from '../services/liveSyncEngine';

export const CLIENT_STATUS_OPTIONS = [
  'SUBMITTED',
  'REPLIED',
  'SOLD',
  'NEED TO CHECK',
  'MEETING DONE',
  'QUETATION PROVIDED',
  'COMPLETED PROJECT',
  'CUSTOM OFFER SEND',
  'FEATURE LIST PROVIDED',
  'MEETING SCHEDULED',
  'MEETING STARTED',
  'EXISTING WORK',
  'FOLLOWUP',
];

// Fully Dynamic Interactive Sparkline Component
function DynamicSparkline({ points = [], color = '#FF6B35', gradId = 'grad1' }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const data = points && points.length >= 2 ? points : [5, 12, 18, 14, 26, 22, 34];

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

export default function ClientsView({ onShowToast, onSyncDatabase, isSyncing, user, onClientsChange, onViewingDetailsChange }) {
  const [clients, setClientsRaw] = useState([]);
  const setClients = (val) => {
    const next = typeof val === 'function' ? val(clients) : val;
    setClientsRaw(next);
    if (onClientsChange) onClientsChange(next);
  };
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Toolbar & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterProfile, setFilterProfile] = useState('All Fiverr Profiles');
  const [filterSalesExec, setFilterSalesExec] = useState('All Sales Execs');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Meeting Modal State
  const [meetingModalClientId, setMeetingModalClientId] = useState(null);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('14:30');

  // Dedicated Client Details Panel State
  const [viewingClient, setViewingClient] = useState(null);
  const [deleteModalClient, setDeleteModalClient] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    if (onViewingDetailsChange) {
      onViewingDetailsChange(Boolean(viewingClient));
    }
  }, [viewingClient, onViewingDetailsChange]);

  const handleSaveClientFromPanel = async (updatedClient) => {
    if (!updatedClient || !updatedClient.id) return;
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? { ...updatedClient } : c))
    );
    setViewingClient(updatedClient);
    if (onShowToast) onShowToast();

    try {
      await clientsApi.updateClient(updatedClient.id, updatedClient);
    } catch (err) {
      console.warn('Background save client note:', err.message);
    }
  };

  const attachmentInputRef = useRef(null);

  const handleUpdateClientStatus = (id, newStatus) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (onShowToast) onShowToast();
    clientsApi.updateClient(id, { status: newStatus }).catch((err) => {
      console.warn('Background update status note:', err.message);
    });
  };

  const handleSaveMeetingSchedule = (clientId) => {
    const formatted = `${meetingDate} ${meetingTime}`;
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, meeting_time: formatted, status: 'MEETING SCHEDULED' }
          : c
      )
    );
    setMeetingModalClientId(null);
    if (onShowToast) onShowToast();
    clientsApi.updateClient(clientId, { meeting_time: formatted, status: 'MEETING SCHEDULED' }).catch((err) => {
      console.warn('Background save meeting note:', err.message);
    });
  };

  const handleSetMeetingNow = (clientId) => {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formattedTime = `NOW (${formatted})`;
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, meeting_time: formattedTime, status: 'MEETING SCHEDULED' }
          : c
      )
    );
    setMeetingModalClientId(null);
    if (onShowToast) onShowToast();
    clientsApi.updateClient(clientId, { meeting_time: formattedTime, status: 'MEETING SCHEDULED' }).catch((err) => {
      console.warn('Background set meeting now note:', err.message);
    });
  };

  const handleMarkMeetingDone = (clientId) => {
    // Clear the schedule — meeting is completed, no pending schedule needed
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, meeting_time: '', status: 'MEETING DONE' }
          : c
      )
    );
    setMeetingModalClientId(null);
    if (onShowToast) onShowToast();
    clientsApi.updateClient(clientId, { meeting_time: '', status: 'MEETING DONE' }).catch((err) => {
      console.warn('Background mark meeting done note:', err.message);
    });
  };

  const handleOpenMeetingModal = (cli) => {
    setMeetingModalClientId(cli.id);
    if (cli.meeting_time) {
      const parts = cli.meeting_time.split(' ');
      if (parts[0] && parts[0].includes('-')) setMeetingDate(parts[0]);
      if (parts[1] && parts[1].includes(':')) setMeetingTime(parts[1]);
    }
  };

  const handleClearMeetingSchedule = (clientId) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, meeting_time: null } : c))
    );
    setMeetingModalClientId(null);
    if (onShowToast) onShowToast();
    clientsApi.updateClient(clientId, { meeting_time: null }).catch((err) => {
      console.warn('Background clear meeting schedule note:', err.message);
    });
  };

  // Add Client Form State
  const [newClientForm, setNewClientForm] = useState({
    sales_person_code: '100028',
    sales_person_name: 'Sakhawat Hossain Sohan',
    platform_source: 'Fiverr',
    source_profile: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    country: '',
    category: 'Web Development',
    reply_method: 'Client messages',
    status: 'HOT',
    quotation_link: '',
    inbox_link: '',
    note: '',
    avatar_url: '',
    attachment_name: '',
  });

const INITIAL_DEFAULT_CLIENTS = [];

  // Load clients and profiles on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, pData] = await Promise.all([
        clientsApi.fetchClients().catch(() => ({ clients: [] })),
        fiverrProfilesApi.fetchProfiles().catch(() => ({ profiles: [] })),
      ]);
      if (cData?.clients && cData.clients.length > 0) {
        setClients(cData.clients);
      } else {
        setClients([]);
      }
      if (pData?.profiles) {
        setSellerProfiles(pData.profiles);
        if (pData.profiles.length > 0 && !newClientForm.source_profile) {
          setNewClientForm((prev) => ({
            ...prev,
            source_profile: pData.profiles[0].name || pData.profiles[0].username,
          }));
        }
      }
    } catch (err) {
      console.warn('Backend load data note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const importInputRef = useRef(null);

  const handleExportCSV = () => {
    if (clients.length === 0) return;
    const headers = [
      'ID', 'Name', 'Fiverr Username', 'Email', 'Company', 'Country', 'Category',
      'Sales Executive', 'Source Profile', 'Status', 'Meeting Schedule', 'Inbox Link',
      'Quotation Link', 'Notes', 'Created At'
    ];
    const rows = clients.map((c) => [
      c.id, c.name, c.username, c.email, c.company_name, c.country, c.category,
      c.sales_person_name, c.source_profile, c.status, c.meeting_time || '', c.inbox_link || '',
      c.quotation_link || '', `"${(c.note || '').replace(/"/g, '""')}"`, c.created_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clients_database_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast();
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedList = [];
      if (file.name.endsWith('.json')) {
        importedList = JSON.parse(text);
      } else {
        const lines = text.split('\n').filter(Boolean);
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        importedList = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
          return {
            id: obj.id || `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: obj.name || obj.customer || 'Imported Client',
            username: obj.username || obj.fiverr_username || 'imported_user',
            email: obj.email || '',
            company_name: obj.company || obj.company_name || '',
            country: obj.country || 'UNITED STATES',
            category: obj.category || 'Web Development',
            sales_person_name: obj.sales_executive || obj.sales_person_name || 'Sakhawat Hossain Sohan',
            source_profile: obj.source_profile || obj.profile || 'Kodevio Studio',
            status: obj.status || 'HOT',
            meeting_time: obj.meeting_schedule || obj.meeting_time || null,
            inbox_link: obj.inbox_link || '',
            quotation_link: obj.quotation_link || '',
            note: obj.notes || obj.note || '',
            created_at: new Date().toISOString()
          };
        });
      }

      if (Array.isArray(importedList) && importedList.length > 0) {
        setClients((prev) => [...importedList, ...prev]);
        for (const item of importedList) {
          await clientsApi.createClient(item).catch(() => {});
        }
        if (onShowToast) onShowToast();
      }
    } catch (err) {
      console.error('Import file error:', err);
    }
  };

  useEffect(() => {
    // 1. Instantly load from localStorage for zero page-reload latency
    const savedLocal = localStorage.getItem('kodevio_clients_db');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
        }
      } catch (err) {}
    }

    loadData();

    // 6-second real-time database synchronization polling loop
    const syncInterval = setInterval(() => {
      clientsApi
        .fetchClients()
        .then((cData) => {
          if (cData?.clients && cData.clients.length > 0) {
            setClients(cData.clients);
            localStorage.setItem('kodevio_clients_db', JSON.stringify(cData.clients));
          }
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(syncInterval);
  }, []);

  // 2. Save to localStorage on every state update & broadcast dynamic live sync
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('kodevio_clients_db', JSON.stringify(clients));
      LiveSyncEngine.broadcast('clients', clients);
    }
  }, [clients]);

  // Filter clients by Toolbar Dropdowns, Date Range, and Search
  const filteredClients = clients.filter((cli) => {
    // 1. Status Filter
    if (filterStatus && filterStatus !== 'All Statuses' && filterStatus.trim() && cli.status !== filterStatus) return false;

    // 2. Fiverr Profile Filter
    if (filterProfile && filterProfile !== 'All Fiverr Profiles' && filterProfile.trim() && cli.source_profile !== filterProfile) return false;

    // 3. Sales Exec Filter
    if (filterSalesExec && filterSalesExec !== 'All Sales Execs' && filterSalesExec.trim() && cli.sales_person_name !== filterSalesExec) return false;

    // 4. Date Range Filter
    if (cli.created_at) {
      const cliTime = new Date(cli.created_at).getTime();
      if (filterStartDate) {
        const startTime = new Date(filterStartDate).getTime();
        if (cliTime < startTime) return false;
      }
      if (filterEndDate) {
        const endTime = new Date(filterEndDate).setHours(23, 59, 59, 999);
        if (cliTime > endTime) return false;
      }
    }

    // 5. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (cli.name && cli.name.toLowerCase().includes(q)) ||
      (cli.username && cli.username.toLowerCase().includes(q)) ||
      (cli.email && cli.email.toLowerCase().includes(q)) ||
      (cli.company_name && cli.company_name.toLowerCase().includes(q)) ||
      (cli.source_profile && cli.source_profile.toLowerCase().includes(q)) ||
      (cli.sales_person_name && cli.sales_person_name.toLowerCase().includes(q))
    );
  });

  // Normalized Robust Metric Evaluation Helpers
  const isMeetingCompleted = (c) => {
    if (!c) return false;
    const st = String(c.status || '').toUpperCase().trim();
    const hasTime = Boolean(c.meeting_time && String(c.meeting_time).trim());
    return (
      st === 'MEETING DONE' ||
      st === 'MEETING COMPLETED' ||
      st === 'MEETING SCHEDULED' ||
      st === 'MEETING STARTED' ||
      hasTime
    );
  };

  const isQuotationProvided = (c) => {
    if (!c) return false;
    const st = String(c.status || '').toUpperCase().trim();
    const hasQuote = Boolean(c.quotation_link && String(c.quotation_link).trim());
    return (
      st === 'QUETATION PROVIDED' ||
      st === 'QUOTATION PROVIDED' ||
      st === 'CUSTOM OFFER SEND' ||
      st === 'FEATURE LIST PROVIDED' ||
      hasQuote
    );
  };

  const isConversionSuccessful = (c) => {
    if (!c) return false;
    const st = String(c.status || '').toUpperCase().trim();
    // Only count SOLD as a successful conversion
    return st === 'SOLD';
  };

  // Dynamic Sparkline Data Generators based on live dataset
  const generateTrendPoints = (filterFn) => {
    const list = filteredClients.filter(filterFn);
    const count = list.length;
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

  const totalClientsPoints = generateTrendPoints(() => true);
  const meetingsPoints = generateTrendPoints(isMeetingCompleted);
  const quotationsPoints = generateTrendPoints(isQuotationProvided);
  const conversionsPoints = generateTrendPoints(isConversionSuccessful);
  const velocityPoints = generateTrendPoints(isConversionSuccessful);

  // Dynamic calculated KPI metrics
  const meetingCount = filteredClients.filter(isMeetingCompleted).length;
  const quotationCount = filteredClients.filter(isQuotationProvided).length;
  // Conversion = only SOLD status clients
  const conversionCount = filteredClients.filter(isConversionSuccessful).length;
  // Close rate = SOLD ÷ total clients × 100%
  const velocityRate = filteredClients.length > 0
    ? ((conversionCount / filteredClients.length) * 100).toFixed(1)
    : '0.0';

  // Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredClients.map((c) => c.id));
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
    // Open system confirmation modal instead of browser native dialog
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    for (const id of selectedIds) {
      try {
        await clientsApi.deleteClient(id);
      } catch (err) {
        console.warn('Delete client note:', err.message);
      }
    }
    setClients(clients.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    if (onShowToast) onShowToast();
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setNewClientForm((prev) => ({ ...prev, attachment_name: file.name }));
    }
  };

  const handleAddClientSubmit = async (e) => {
    e.preventDefault();
    if (!newClientForm.name || !newClientForm.username) return;

    try {
      const res = await clientsApi.createClient(newClientForm);
      if (res?.client) {
        setClients([res.client, ...clients]);
      } else {
        const fallbackClient = {
          id: `cli-${Date.now()}`,
          ...newClientForm,
          created_at: new Date().toISOString(),
        };
        setClients([fallbackClient, ...clients]);
      }

      setIsAddFormOpen(false);
      setNewClientForm({
        sales_person_code: '100028',
        sales_person_name: 'Sakhawat Hossain Sohan',
        platform_source: 'Fiverr',
        source_profile: sellerProfiles.length > 0 ? (sellerProfiles[0].name || sellerProfiles[0].username) : '',
        name: '',
        username: '',
        email: '',
        phone: '',
        country: '',
        category: 'Web Development',
        reply_method: 'Client messages',
        status: 'HOT',
        quotation_link: '',
        inbox_link: '',
        note: '',
        avatar_url: '',
        attachment_name: '',
      });
      if (onShowToast) onShowToast();
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await clientsApi.deleteClient(id);
      setClients(clients.filter((c) => c.id !== id));
      if (onShowToast) onShowToast();
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  const sourceProfileOptions = sellerProfiles.length > 0
    ? sellerProfiles.map((p) => ({ value: p.name || p.username, label: p.name || p.username }))
    : [
        { value: 'Kodevio Software Studio', label: 'Kodevio Software Studio' },
        { value: 'Apex UX & Product Design', label: 'Apex UX & Product Design' },
        { value: 'Kodevio SEO & Growth Lab', label: 'Kodevio SEO & Growth Lab' },
        { value: 'Vance Automation Squad', label: 'Vance Automation Squad' },
      ];

  // Helper score renderer matching exact score bar design
  const renderScoreBar = (scoreVal = 8) => {
    const bars = [];
    for (let i = 1; i <= 10; i++) {
      let color = '#E4E7EC';
      if (i <= scoreVal) {
        if (scoreVal >= 8) color = '#12B76A';
        else if (scoreVal >= 5) color = '#F79009';
        else color = '#F04438';
      }
      bars.push(<div key={i} className="cli-score-segment" style={{ background: color }} />);
    }
    return (
      <div className="cli-score-bar-container">
        <div className="cli-score-bars">{bars}</div>
        <span className="cli-score-badge-text">{scoreVal}/10</span>
      </div>
    );
  };
  return (
    <div className="w-full flex-1 flex flex-col min-h-full">
      <AnimatePresence mode="wait">
        {viewingClient ? (
          <ClientDetailsView
            key={`client-details-${viewingClient.id}`}
            client={viewingClient}
            user={user}
            sellerProfiles={sellerProfiles}
            onBack={() => setViewingClient(null)}
            onSave={handleSaveClientFromPanel}
            onDelete={(cliToDelete) => {
              setViewingClient(null);
              setDeleteModalClient(cliToDelete);
            }}
            onShowToast={onShowToast}
            onUpdateStatus={(id, newStatus) => {
              handleUpdateClientStatus(id, newStatus);
              if (viewingClient && viewingClient.id === id) {
                setViewingClient((prev) => ({ ...prev, status: newStatus }));
              }
            }}
          />
        ) : (
          <motion.div
            key="clients-table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="cli-fullwidth-container"
          >
            {/* ── 1. UNIFIED CLIENTS TOOLBAR & CONTROLS (Identical to Projects Panel) ── */}
            <div className="prj-toolbar-card">
              <div className="prj-toolbar-top-row">
                {/* Left: Search Box + Inline Filters + Date Pickers + Reset */}
                <div className="prj-toolbar-left-group">
                  {/* Search */}
                  <div className="prj-search-box">
                    <Search size={13} className="prj-search-icon" />
                    <input
                      type="text"
                      placeholder="Search clients..."
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

                  {/* Status Filter */}
                  <div className="prj-filter-item" style={{ width: '135px' }}>
                    <CustomSelect
                      value={filterStatus}
                      onChange={(val) => setFilterStatus(val)}
                      options={['All Statuses', ...CLIENT_STATUS_OPTIONS]}
                      placeholder="All Statuses"
                    />
                  </div>

                  {/* Fiverr Profile Filter */}
                  <div className="prj-filter-item" style={{ width: '160px' }}>
                    <CustomSelect
                      value={filterProfile}
                      onChange={(val) => setFilterProfile(val)}
                      options={['All Fiverr Profiles', ...sourceProfileOptions.map((p) => p.label)]}
                      placeholder="All Fiverr Profiles"
                    />
                  </div>

                  {/* Sales Executive / Asset Owner Filter */}
                  <div className="prj-filter-item" style={{ width: '155px' }}>
                    <CustomSelect
                      value={filterSalesExec}
                      onChange={(val) => setFilterSalesExec(val)}
                      options={['All Sales Execs', 'Sakhawat Hossain Sohan', 'MD Motiur Rahman Emon', 'Super Admin']}
                      placeholder="All Sales Execs"
                    />
                  </div>

                  {/* Date Picker (From) */}
                  <div className="prj-filter-item">
                    <CustomDatePicker
                      label="From"
                      value={filterStartDate}
                      onChange={(val) => setFilterStartDate(val)}
                      placeholder="Start Date"
                    />
                  </div>

                  {/* Date Picker (To) */}
                  <div className="prj-filter-item">
                    <CustomDatePicker
                      label="To"
                      value={filterEndDate}
                      onChange={(val) => setFilterEndDate(val)}
                      placeholder="End Date"
                    />
                  </div>
                </div>

                {/* Right: Actions (Import, Export, + Add Lead) */}
                <div className="prj-toolbar-right-group">
                  <div className="prj-actions-row">
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".csv, .json"
                      onChange={handleImportFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => importInputRef.current && importInputRef.current.click()}
                      className="prj-btn-secondary"
                      title="Import Clients from CSV or JSON file"
                    >
                      <UploadCloud size={12} />
                      <span>Import</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="prj-btn-secondary"
                      title="Export Clients Database as CSV"
                    >
                      <DownloadCloud size={12} />
                      <span>Export</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                      className="prj-btn-primary"
                      title="Add New Client / Lead"
                    >
                      {isAddFormOpen ? <X size={13} /> : <Plus size={13} />}
                      <span>{isAddFormOpen ? 'Close' : 'Add Lead'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

      {/* POPUP MODAL WITH DARK TRANSPARENT BACKGROUND (NOT BLURRED) */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddFormOpen(false);
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
                  <div className="cli-modal-avatar-circle">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      Add New Client Lead
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Fill in customer information, quotation, and acquisition details
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="cli-panel-close-btn"
                  title="Close Form"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleAddClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Section 1: Client Identity & Account */}
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <User size={14} className="text-slate-600" />
                    <span>Client Identity & Account</span>
                  </h4>
                  <div className="cli-form-grid-3col">
                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Customer Name</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newClientForm.name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                        placeholder="Full Name"
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
                          value={newClientForm.username}
                          onChange={(e) => setNewClientForm({ ...newClientForm, username: e.target.value })}
                          placeholder="client_username"
                          className="cli-input cli-input-prefixed font-mono text-emerald-700 font-bold"
                        />
                      </div>
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        value={newClientForm.email}
                        onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                        placeholder="client@company.com"
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Company Name</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.company_name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, company_name: e.target.value })}
                        placeholder="Company Ltd"
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Country / Region</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.country}
                        onChange={(e) => setNewClientForm({ ...newClientForm, country: e.target.value })}
                        placeholder="UNITED STATES"
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Category</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.category}
                        onChange={(e) => setNewClientForm({ ...newClientForm, category: e.target.value })}
                        placeholder="Web Development"
                        className="cli-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Sales & Acquisition */}
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <UserCheck size={14} className="text-slate-600" />
                    <span>Sales & Acquisition</span>
                  </h4>
                  <div className="cli-form-grid-3col">
                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Sales Executive</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.sales_person_name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, sales_person_name: e.target.value })}
                        placeholder="Sales Executive"
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Fiverr Source Profile</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newClientForm.source_profile}
                        onChange={(val) => setNewClientForm({ ...newClientForm, source_profile: val })}
                        options={sourceProfileOptions.map((p) => p.label)}
                        placeholder="Select Seller Profile"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Status</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newClientForm.status}
                        onChange={(val) => setNewClientForm({ ...newClientForm, status: val })}
                        options={CLIENT_STATUS_OPTIONS}
                        placeholder="Select Status"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Reply Method</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newClientForm.reply_method}
                        onChange={(val) => setNewClientForm({ ...newClientForm, reply_method: val })}
                        options={['Client messages', 'Buyer brief', 'Direct order', 'Custom offer']}
                        placeholder="Select Method"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Platform Source</span>
                      </label>
                      <CustomSelect
                        size="compact"
                        value={newClientForm.platform_source}
                        onChange={(val) => setNewClientForm({ ...newClientForm, platform_source: val })}
                        options={['Fiverr', 'Upwork', 'Direct Website', 'LinkedIn']}
                        placeholder="Select Platform"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Phone / Whatsapp</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.phone}
                        onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="cli-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Quick Links & Attachments */}
                <div className="cli-details-section">
                  <h4 className="cli-details-section-header">
                    <Globe size={14} className="text-slate-600" />
                    <span>Quick Links &amp; Attachments</span>
                  </h4>
                  <div className="cli-form-grid-3col">
                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Fiverr Inbox Link</span>
                        <span className="cli-label-req">(Required)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newClientForm.inbox_link}
                        onChange={(e) => setNewClientForm({ ...newClientForm, inbox_link: e.target.value })}
                        placeholder="https://fiverr.com/inbox/..."
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Quotation Offer Link</span>
                      </label>
                      <input
                        type="text"
                        value={newClientForm.quotation_link}
                        onChange={(e) => setNewClientForm({ ...newClientForm, quotation_link: e.target.value })}
                        placeholder="https://fiverr.com/offers/..."
                        className="cli-input"
                      />
                    </div>

                    <div className="cli-field-group">
                      <label className="cli-field-label">
                        <span>Attachment Upload</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0 0.75rem', height: '34px',
                        background: '#FFFFFF', border: '1.5px dashed #CBD5E1',
                        borderRadius: '7px', cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 700,
                        color: newClientForm.attachment_name ? '#1E293B' : '#94A3B8',
                        overflow: 'hidden', whiteSpace: 'nowrap'
                      }}>
                        <Upload size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {newClientForm.attachment_name || 'Upload PDF / Doc'}
                        </span>
                        {newClientForm.attachment_name && (
                          <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 800, flexShrink: 0 }}>✓</span>
                        )}
                        <input type="file" onChange={handleAttachmentChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 4: Client Notes / Briefing */}
                <div className="cli-details-section-orange">
                  <h4 className="cli-details-section-header-orange">
                    <FileText size={14} className="text-orange-600" />
                    <span>Client Notes / Briefing</span>
                  </h4>
                  <textarea
                    rows={5}
                    value={newClientForm.note}
                    onChange={(e) => setNewClientForm({ ...newClientForm, note: e.target.value })}
                    placeholder="Enter client notes, project requirements or acquisition briefing details..."
                    className="cli-textarea"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="fp-btn-cancel-compact"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cli-btn-add-lead">
                    <Plus size={14} />
                    <span>Save Lead</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FULL WIDTH CLEAN TABLE CLONE */}
      <div className="w-full overflow-x-auto">
        <table className="cli-clone-table">
          <thead>
            <tr>
              <th className="cli-clone-th w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </th>
              <th className="cli-clone-th">CLIENT IDENTITY</th>
              <th className="cli-clone-th">STATUS</th>
              <th className="cli-clone-th">INBOX</th>
              <th className="cli-clone-th">REGION</th>
              <th className="cli-clone-th">FIVERR PROFILE</th>
              <th className="cli-clone-th">SALES EXECUTIVE</th>
              <th className="cli-clone-th">MEETING SCHEDULE</th>
              <th className="cli-clone-th">CLIENT NOTES</th>
              <th className="cli-clone-th">DATE ADDED</th>
              <th className="cli-clone-th text-right">ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="cli-clone-td text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
                    <span>Loading Client Accounts...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan="11" className="prj-empty-table-cell">
                  <div className="prj-empty-inner">
                    <FolderKanban size={34} className="prj-empty-icon" />
                    <h3 className="prj-empty-title">No clients found</h3>
                    <p className="prj-empty-desc">
                      {searchQuery || (filterStatus && filterStatus !== 'All Statuses') || (filterProfile && filterProfile !== 'All Fiverr Profiles') || (filterSalesExec && filterSalesExec !== 'All Sales Execs') || filterStartDate || filterEndDate
                        ? 'No client accounts matched your active search filters. Try clearing filters.'
                        : 'There are no client accounts in your workspace. Click "+ Add Lead" to create a new client.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredClients.map((cli) => {
                const isSelected = selectedIds.includes(cli.id);
                const formattedDate = cli.created_at
                  ? new Date(cli.created_at).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '8/15/2026';

                return (
                  <tr key={cli.id} className={`cli-clone-tr ${isSelected ? 'is-selected' : ''}`}>
                    <td className="cli-clone-td">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(cli.id)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    {/* 1. CLIENT IDENTITY (Name on TOP, @username handle directly UNDERNEATH) */}
                    <td className="cli-clone-td">
                      <div
                        onClick={() => setViewingClient(cli)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}
                        title={`View ${cli.name || cli.username} in Details Panel`}
                      >
                        <span className="font-extrabold text-slate-900 text-sm leading-tight block hover:text-emerald-600 transition-colors">
                          {cli.name || cli.username || cli.fiverr_username}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 block leading-tight">
                          @{cli.username || cli.fiverr_username || (cli.name ? cli.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'client_handle')}
                        </span>
                      </div>
                    </td>

                    {/* 2. STATUS (Inline Dropdown Update) */}
                    <td className="cli-clone-td">
                      <div className="min-w-[150px]">
                        <CustomSelect
                          size="compact"
                          value={cli.status || 'SUBMITTED'}
                          onChange={(newStatus) => handleUpdateClientStatus(cli.id, newStatus)}
                          options={CLIENT_STATUS_OPTIONS}
                          placeholder="Status"
                        />
                      </div>
                    </td>

                    {/* 3. INBOX */}
                    <td className="cli-clone-td">
                      <a
                        href={cli.inbox_link || 'https://fiverr.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cli-inbox-pill-btn"
                      >
                        <Globe size={13} />
                        <span>INBOX LINK</span>
                      </a>
                    </td>

                    {/* 4. REGION */}
                    <td className="cli-clone-td">
                      <span className="font-extrabold text-slate-900 text-xs uppercase">
                        {cli.country || 'UNITED STATES'}
                      </span>
                    </td>

                    {/* 5. FIVERR PROFILE (Profile Name on TOP, Category directly UNDERNEATH) */}
                    <td className="cli-clone-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="font-extrabold text-slate-900 text-xs uppercase block leading-tight">
                          {cli.source_profile || 'Kodevio Studio'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                          {cli.category || 'Web Development'}
                        </span>
                      </div>
                    </td>

                    {/* 6. SALES EXECUTIVE (Avatar Image + Name) */}
                    <td className="cli-clone-td">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            cli.sales_person_name?.includes('Motiur')
                              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80'
                              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80'
                          }
                          alt="Sales Exec"
                          style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', maxWidth: '22px', maxHeight: '22px', borderRadius: '50%', objectFit: 'cover' }}
                          className="border border-slate-200 flex-shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          {cli.sales_person_name || 'MD Motiur Rahman Emon'}
                        </span>
                      </div>
                    </td>

                    {/* 7. MEETING SCHEDULE (Interactive Scheduler) */}
                    <td className="cli-clone-td">
                      {cli.meeting_time ? (
                        <div
                          onClick={() => handleOpenMeetingModal(cli)}
                          className="cli-meeting-scheduled-btn"
                          title="Click to edit or reschedule meeting"
                        >
                          <Calendar size={12} className="cli-meeting-icon" />
                          <span>{cli.meeting_time}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearMeetingSchedule(cli.id);
                            }}
                            className="cli-meeting-clear-btn"
                            title="Clear Meeting Schedule"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenMeetingModal(cli)}
                          className="cli-set-meeting-btn"
                        >
                          Set Meeting
                        </button>
                      )}
                    </td>

                    {/* 8. CLIENT NOTES */}
                    <td className="cli-clone-td">
                      <span className="text-xs font-semibold text-slate-400">
                        {cli.note ? cli.note.slice(0, 30) : 'NONE'}
                      </span>
                    </td>

                    {/* 9. DATE ADDED */}
                    <td className="cli-clone-td">
                      <span className="text-xs font-bold text-slate-700">
                        {formattedDate}
                      </span>
                    </td>

                    {/* 10. ACTIONS */}
                    <td className="cli-clone-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingClient(cli)}
                          className="cli-view-btn"
                          title="View Client in Details Panel"
                        >
                          VIEW
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModalClient(cli)}
                          className="cli-act-btn delete-btn"
                          title="Delete Client Account"
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

      {/* MEETING SCHEDULER POPUP MODAL */}
      <AnimatePresence>
        {meetingModalClientId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMeetingModalClientId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-meeting-modal-card"
            >
              {/* Redesigned Clean Modal Top Bar */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div className="cli-modal-icon-badge">
                    <Calendar size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Schedule Meeting</h3>
                    <p className="cli-modal-sub-text">Pick date & time or launch an instant meeting</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMeetingModalClientId(null)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close Modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* 2-Column Date & Time Grid */}
                <div className="cli-meeting-grid-2col">
                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <Calendar size={13} className="text-slate-600" />
                      <span>Meeting Date</span>
                    </label>
                    <CustomDatePicker
                      value={meetingDate}
                      onChange={(val) => setMeetingDate(val)}
                      placeholder="Select Date"
                    />
                  </div>

                  <div className="cli-field-group">
                    <label className="cli-field-label">
                      <Clock size={13} className="text-slate-600" />
                      <span>Meeting Time</span>
                    </label>
                    <CustomTimePicker
                      value={meetingTime}
                      onChange={(val) => setMeetingTime(val)}
                      placeholder="Select Time"
                    />
                  </div>
                </div>

                {/* Instant Meeting Action Box */}
                <div className="cli-instant-banner-box">
                  <div>
                    <span className="cli-instant-banner-title">Instant Schedule</span>
                    <span className="cli-instant-banner-sub">Set meeting date & time to right now</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSetMeetingNow(meetingModalClientId)}
                    className="cli-instant-act-btn"
                  >
                    <Video size={13} />
                    <span>Set Now</span>
                  </button>
                </div>

                {/* Mark Meeting Done Action Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534' }}>Meeting Status: Completed</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803D' }}>Mark meeting as DONE and update client status instantly</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkMeetingDone(meetingModalClientId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Meeting Done</span>
                  </button>
                </div>

                {/* Footer Action Buttons */}
                <div className="cli-form-footer pt-3 border-t border-slate-100 mt-1 flex items-center justify-between">
                  <div>
                    {meetingModalClientId && clients.find((c) => c.id === meetingModalClientId)?.meeting_time && (
                      <button
                        type="button"
                        onClick={() => handleClearMeetingSchedule(meetingModalClientId)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: '#FEF2F2',
                          border: '1px solid #FCA5A5',
                          borderRadius: '6px',
                          color: '#DC2626',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title="Clear current meeting schedule"
                      >
                        <Trash2 size={13} />
                        <span>Clear Schedule</span>
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setMeetingModalClientId(null)}
                      className="fp-btn-cancel-compact"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveMeetingSchedule(meetingModalClientId)}
                      className="cli-btn-add-lead"
                    >
                      Confirm Meeting
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION POPUP MODAL */}
      <AnimatePresence>
        {deleteModalClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="cli-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteModalClient(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cli-small-modal-card"
            >
              {/* Header — matches meeting modal design */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div className="cli-modal-icon-badge" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete Client Account?</h3>
                    <p className="cli-modal-sub-text">
                      {deleteModalClient.name || deleteModalClient.username} &mdash; this cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalClient(null)}
                  className="cli-modal-close-btn-redesigned"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  You are about to permanently delete <strong style={{ color: '#991B1B' }}>{deleteModalClient.name || deleteModalClient.username}</strong> (@{deleteModalClient.username}). All associated data will be lost.
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalClient(null)}
                  className="fp-btn-cancel-compact"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeleteClient(deleteModalClient.id);
                    setDeleteModalClient(null);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', background: '#DC2626', color: '#FFFFFF',
                    border: 'none', borderRadius: '7px', fontSize: '0.8rem',
                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
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

      {/* 6. FLOATING DARK SELECTION BAR */}
      {selectedIds.length > 0 && (
        <div className="cli-floating-selection-bar">
          <span className="font-bold whitespace-nowrap flex-shrink-0">Selected: {selectedIds.length}</span>
          <span className="text-slate-600 flex-shrink-0">|</span>

          <button type="button" onClick={handleBulkDelete} className="cli-floating-item-btn text-red-400 hover:text-red-300">
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

      {/* BULK DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
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
              {/* Header — matches meeting modal design */}
              <div className="cli-modal-header-redesigned">
                <div className="cli-modal-header-left">
                  <div className="cli-modal-icon-badge" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <Trash2 size={20} />
                  </div>
                  <div className="cli-modal-header-titles">
                    <h3 className="cli-modal-title-text">Delete {selectedIds.length} Lead{selectedIds.length > 1 ? 's' : ''}?</h3>
                    <p className="cli-modal-sub-text">Selected leads will be permanently removed</p>
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

              {/* Body */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
                  You are about to permanently delete <strong style={{ color: '#991B1B' }}>{selectedIds.length} selected lead{selectedIds.length > 1 ? 's' : ''}</strong>. All associated data will be lost and this action cannot be undone.
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
                  onClick={handleConfirmBulkDelete}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', background: '#DC2626', color: '#FFFFFF',
                    border: 'none', borderRadius: '7px', fontSize: '0.8rem',
                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
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
    </div>
  );
}
