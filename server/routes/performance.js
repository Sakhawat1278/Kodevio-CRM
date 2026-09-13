import express from 'express';
import {
  isPgConnected,
  pool,
  loadSalesMonthlyFromDisk,
  saveSalesMonthlyToDisk,
  loadOpsMonthlyFromDisk,
  saveOpsMonthlyToDisk,
  loadProjectsFromDisk,
  loadClientsFromDisk
} from '../db.js';

const router = express.Router();

// Helper to get master sales month key
const getSalesKey = (month = 'August', year = '2026') => `${month}-${year}`;

// Helper: Seed default 17 Sales Reps for a month
function getDefaultSalesList(month = 'August', year = '2026') {
  return [
    { id: `smp-10017-${year}-${month}`, month, year, userId: '10017', name: 'MD AL SOHAN', role: 'Sales Manager', grade: 'Grade-3', color: '#D97706', initials: 'MS', achieved: 2000, target: 7500, bonus: 'TK 2,250', quotesCount: 8, totalQuoteValue: 1850, bestQuote: 250, bestQuoteClient: 'Client Offer', isRank1: true },
    { id: `smp-10023-${year}-${month}`, month, year, userId: '10023', name: 'MD RADOUN HOSSAIN', role: 'Sales Executive', grade: 'Grade-2', color: '#7C3AED', initials: 'RH', achieved: 1250, target: 6000, bonus: 'TK 1,800', quotesCount: 12, totalQuoteValue: 2500, bestQuote: 250, bestQuoteClient: 'Client Offer', isTopQuoter: true },
    { id: `smp-10011-${year}-${month}`, month, year, userId: '10011', name: 'MEHEDI HASAN BABU', role: 'Sales Executive', grade: 'Grade-2', color: '#2563EB', initials: 'MB', achieved: 1100, target: 6000, bonus: 'TK 1,500', quotesCount: 7, totalQuoteValue: 1400, bestQuote: 200, bestQuoteClient: 'Client Offer' },
    { id: `smp-10007-${year}-${month}`, month, year, userId: '10007', name: 'SAKIB HOSSAIN', role: 'Sales Executive', grade: 'Grade-1', color: '#4F46E5', initials: 'SH', achieved: 950, target: 5000, bonus: 'TK 1,200', quotesCount: 6, totalQuoteValue: 1100, bestQuote: 180, bestQuoteClient: 'Client Offer' },
    { id: `smp-10019-${year}-${month}`, month, year, userId: '10019', name: 'TANVIR AHMED', role: 'Sales Executive', grade: 'Grade-1', color: '#0EA5E9', initials: 'TA', achieved: 850, target: 5000, bonus: 'TK 1,000', quotesCount: 5, totalQuoteValue: 950, bestQuote: 150, bestQuoteClient: 'Client Offer' },
    { id: `smp-10004-${year}-${month}`, month, year, userId: '10004', name: 'ZAHIDUL ISLAM', role: 'Sales Executive', grade: 'Grade-1', color: '#0284C7', initials: 'ZI', achieved: 780, target: 5000, bonus: 'TK 900', quotesCount: 4, totalQuoteValue: 800, bestQuote: 150, bestQuoteClient: 'Client Offer' },
    { id: `smp-10009-${year}-${month}`, month, year, userId: '10009', name: 'RAIHAN KABIR', role: 'Sales Executive', grade: 'Grade-1', color: '#10B981', initials: 'RK', achieved: 720, target: 5000, bonus: 'TK 850', quotesCount: 4, totalQuoteValue: 720, bestQuote: 120, bestQuoteClient: 'Client Offer' },
    { id: `smp-10014-${year}-${month}`, month, year, userId: '10014', name: 'ASIF MAHMUD', role: 'Sales Executive', grade: 'Grade-1', color: '#F59E0B', initials: 'AM', achieved: 650, target: 5000, bonus: 'TK 750', quotesCount: 3, totalQuoteValue: 650, bestQuote: 120, bestQuoteClient: 'Client Offer' },
    { id: `smp-10002-${year}-${month}`, month, year, userId: '10002', name: 'NAIMUR RAHMAN', role: 'Sales Executive', grade: 'Grade-1', color: '#6366F1', initials: 'NR', achieved: 520, target: 5000, bonus: 'TK 600', quotesCount: 3, totalQuoteValue: 520, bestQuote: 100, bestQuoteClient: 'Client Offer' },
    { id: `smp-10021-${year}-${month}`, month, year, userId: '10021', name: 'MAHMUDUL HASAN', role: 'Sales Executive', grade: 'Grade-1', color: '#8B5CF6', initials: 'MH', achieved: 430, target: 5000, bonus: 'TK 500', quotesCount: 2, totalQuoteValue: 430, bestQuote: 90, bestQuoteClient: 'Client Offer' },
    { id: `smp-10016-${year}-${month}`, month, year, userId: '10016', name: 'SHOHAG MIA', role: 'Sales Executive', grade: 'Grade-1', color: '#EC4899', initials: 'SM', achieved: 320, target: 4500, bonus: 'TK 350', quotesCount: 2, totalQuoteValue: 320, bestQuote: 80, bestQuoteClient: 'Client Offer' },
    { id: `smp-10008-${year}-${month}`, month, year, userId: '10008', name: 'SULTAN AHMED', role: 'Sales Executive', grade: 'Grade-1', color: '#14B8A6', initials: 'SA', achieved: 280, target: 4500, bonus: 'TK 300', quotesCount: 1, totalQuoteValue: 280, bestQuote: 70, bestQuoteClient: 'Client Offer' },
    { id: `smp-10027-${year}-${month}`, month, year, userId: '10027', name: 'EMRAN HOSSAIN', role: 'Sales Executive', grade: 'Grade-1', color: '#F97316', initials: 'EH', achieved: 210, target: 4000, bonus: 'TK 200', quotesCount: 1, totalQuoteValue: 210, bestQuote: 60, bestQuoteClient: 'Direct Client' },
    { id: `smp-10030-${year}-${month}`, month, year, userId: '10030', name: 'SHAKIL KHAN', role: 'Junior Executive', grade: 'Grade-0', color: '#64748B', initials: 'SK', achieved: 120, target: 3500, bonus: 'TK 100', quotesCount: 1, totalQuoteValue: 120, bestQuote: 50, bestQuoteClient: 'Client Offer' },
    { id: `smp-10032-${year}-${month}`, month, year, userId: '10032', name: 'FAHAD HOSSAIN', role: 'Junior Executive', grade: 'Grade-0', color: '#94A3B8', initials: 'FH', achieved: 80, target: 3500, bonus: '—', quotesCount: 0, totalQuoteValue: 0, bestQuote: 0, bestQuoteClient: '—' },
    { id: `smp-10036-${year}-${month}`, month, year, userId: '10036', name: 'HABIBUR RAHMAN', role: 'Junior Executive', grade: 'Grade-0', color: '#475569', initials: 'HR', achieved: 0, target: 3000, bonus: '—', quotesCount: 0, totalQuoteValue: 0, bestQuote: 0, bestQuoteClient: '—' },
    { id: `smp-10039-${year}-${month}`, month, year, userId: '10039', name: 'KAZI ANISUR', role: 'Junior Executive', grade: 'Grade-0', color: '#334155', initials: 'KA', achieved: 0, target: 3000, bonus: '—', quotesCount: 0, totalQuoteValue: 0, bestQuote: 0, bestQuoteClient: '—' }
  ];
}

// Helper: Seed default 20 Ops Members for a month
function getDefaultOpsList(month = 'August', year = '2026') {
  return [
    { id: `omp-10034-${year}-${month}`, month, year, userId: '10034', name: 'MD AZHAR UDDIN', level: 'LVL 3', role: 'Operations Executive', color: '#D97706', initials: 'AU', achieved: 1400, target: 1600, bonus: 'TK 1,900', deliveredJobs: 8, topProjectVal: 1400, topProjectName: 'Direct Project', isTopOps: true },
    { id: `omp-10043-${year}-${month}`, month, year, userId: '10043', name: 'KHALID HASAN', level: 'LVL 0', role: 'Operations Executive', color: '#4F46E5', initials: 'KH', achieved: 758.4, target: 1000, bonus: 'TK 650', deliveredJobs: 6, topProjectVal: 758.4, topProjectName: 'Client Job', isTopThroughput: true },
    { id: `omp-10012-${year}-${month}`, month, year, userId: '10012', name: 'RUMI AKTAR', level: 'LVL 0', role: 'Operations Executive', color: '#2563EB', initials: 'RA', achieved: 640, target: 1200, bonus: 'TK 800', deliveredJobs: 5, topProjectVal: 640, topProjectName: 'Client Job' },
    { id: `omp-10015-${year}-${month}`, month, year, userId: '10015', name: 'SAMIUL HASAN', level: 'LVL 0', role: 'Operations Executive', color: '#7C3AED', initials: 'SH', achieved: 600, target: 800, bonus: 'TK 500', deliveredJobs: 4, topProjectVal: 600, topProjectName: 'Client Job' },
    { id: `omp-10018-${year}-${month}`, month, year, userId: '10018', name: 'FIROZ ALAM', level: 'LVL 0', role: 'Operations Executive', color: '#2563EB', initials: 'FA', achieved: 600, target: 1000, bonus: 'TK 650', deliveredJobs: 4, topProjectVal: 600, topProjectName: 'Client Job' },
    { id: `omp-10022-${year}-${month}`, month, year, userId: '10022', name: 'MUNTASIR ASHIF', level: 'LVL 0', role: 'Operations Manager', color: '#0284C7', initials: 'MA', achieved: 400, target: 1400, bonus: 'TK 950', deliveredJobs: 3, topProjectVal: 400, topProjectName: 'Client Job' },
    { id: `omp-100028-${year}-${month}`, month, year, userId: '100028', name: 'SAKHAWAT HOSSAIN', level: 'LVL 0', role: 'Operations Manager', color: '#6366F1', initials: 'SH', achieved: 400, target: 1000, bonus: 'TK 650', deliveredJobs: 3, topProjectVal: 400, topProjectName: 'Client Job' },
    { id: `omp-10025-${year}-${month}`, month, year, userId: '10025', name: 'MIRZA NAYEEM', level: 'LVL 0', role: 'Operations Executive', color: '#0EA5E9', initials: 'MN', achieved: 320, target: 800, bonus: 'TK 500', deliveredJobs: 3, topProjectVal: 320, topProjectName: 'Client Job' },
    { id: `omp-10031-${year}-${month}`, month, year, userId: '10031', name: 'TOUFIK HASAN', level: 'LVL 0', role: 'Operations Manager', color: '#3B82F6', initials: 'TH', achieved: 200, target: 1200, bonus: 'TK 800', deliveredJobs: 2, topProjectVal: 200, topProjectName: 'Client Job' },
    { id: `omp-10033-${year}-${month}`, month, year, userId: '10033', name: 'AMINUL ISLAM ARNOB', level: 'LVL 1', role: 'Operations Executive', color: '#10B981', initials: 'AA', achieved: 200, target: 0, bonus: '—', deliveredJobs: 2, topProjectVal: 200, topProjectName: 'Client Job' },
    { id: `omp-10035-${year}-${month}`, month, year, userId: '10035', name: 'MD. PAHLOVI', level: 'LVL 0', role: 'Operations Executive', color: '#6366F1', initials: 'MP', achieved: 120, target: 1200, bonus: 'TK 800', deliveredJobs: 1, topProjectVal: 120, topProjectName: 'Client Job' },
    { id: `omp-10037-${year}-${month}`, month, year, userId: '10037', name: 'MOHAMMAD TASNIM AHMED', level: 'LVL 0', role: 'Operations Executive', color: '#0284C7', initials: 'TA', achieved: 80, target: 800, bonus: 'TK 500', deliveredJobs: 1, topProjectVal: 80, topProjectName: 'Client Job' },
    { id: `omp-10038-${year}-${month}`, month, year, userId: '10038', name: 'OPERATION MANAGER', level: 'LVL 0', role: 'Operations Manager', color: '#475569', initials: 'OM', achieved: 0, target: 1200, bonus: 'TK 800', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10040-${year}-${month}`, month, year, userId: '10040', name: 'RAKESH KARMAKER', level: 'LVL 0', role: 'Operations Executive', color: '#2563EB', initials: 'RK', achieved: 0, target: 1200, bonus: 'TK 800', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10042-${year}-${month}`, month, year, userId: '10042', name: 'SHAMSUZZAMAN RAFI', level: 'LVL 0', role: 'Operations Manager', color: '#6366F1', initials: 'SR', achieved: 0, target: 1200, bonus: 'TK 800', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10046-${year}-${month}`, month, year, userId: '10046', name: 'BINOY KAUMAR BHAWAL', level: 'LVL 0', role: 'Operations Executive', color: '#3B82F6', initials: 'BB', achieved: 0, target: 1000, bonus: 'TK 650', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10048-${year}-${month}`, month, year, userId: '10048', name: 'MIR TAWFIQ AL SAYEM', level: 'LVL 0', role: 'Operations Executive', color: '#0284C7', initials: 'MS', achieved: 0, target: 1000, bonus: 'TK 650', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10049-${year}-${month}`, month, year, userId: '10049', name: 'MONIRUZZAMAN MAHDI', level: 'LVL 1', role: 'Operations Executive', color: '#0EA5E9', initials: 'MM', achieved: 0, target: 0, bonus: '—', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10050-${year}-${month}`, month, year, userId: '10050', name: 'MD NAZMIUL HASAN', level: 'LVL 1', role: 'Operations Executive', color: '#2563EB', initials: 'NH', achieved: 0, target: 0, bonus: '—', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' },
    { id: `omp-10052-${year}-${month}`, month, year, userId: '10052', name: 'MD ABIR HABIB', level: 'LVL 1', role: 'Operations Executive', color: '#4F46E5', initials: 'AH', achieved: 0, target: 0, bonus: '—', deliveredJobs: 0, topProjectVal: 0, topProjectName: '—' }
  ];
}

// ─────────────────────────────────────────────────────────────
// 1. SALES MONTHLY PERFORMANCE ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/performance/sales?month=August&year=2026
router.get('/sales', async (req, res) => {
  try {
    const month = req.query.month || 'August';
    const year = req.query.year || '2026';
    const key = getSalesKey(month, year);

    let salesDb = loadSalesMonthlyFromDisk() || {};
    let monthData = salesDb[key];

    if (!monthData || !Array.isArray(monthData) || monthData.length === 0) {
      monthData = getDefaultSalesList(month, year);
      salesDb[key] = monthData;
      saveSalesMonthlyToDisk(salesDb);
    }

    // Sort by achieved desc for sales rank
    const sortedSales = [...monthData].sort((a, b) => (Number(b.achieved) || 0) - (Number(a.achieved) || 0));

    // Sort by totalQuoteValue desc for quote rank
    const sortedQuotes = [...monthData].sort((a, b) => (Number(b.totalQuoteValue) || 0) - (Number(a.totalQuoteValue) || 0));

    // Aggregates
    const totalAchieved = monthData.reduce((acc, r) => acc + (Number(r.achieved) || 0), 0);
    const totalTarget = monthData.reduce((acc, r) => acc + (Number(r.target) || 0), 0);
    const totalQuotesCount = monthData.reduce((acc, r) => acc + (Number(r.quotesCount) || 0), 0);
    const teamProgressPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return res.json({
      success: true,
      month,
      year,
      count: monthData.length,
      data: monthData,
      sortedSales,
      sortedQuotes,
      topSalesman: sortedSales[0] || null,
      topQuoter: sortedQuotes[0] || null,
      totals: {
        totalAchieved,
        totalTarget,
        teamProgressPct,
        totalQuotesCount,
        totalBonusPool: 'TK 22,500',
        avgDealSize: totalQuotesCount > 0 ? `$${Math.round(totalAchieved / (sortedSales.filter(s => s.achieved > 0).length || 1))}` : '$109'
      }
    });
  } catch (err) {
    console.error('Error fetching sales monthly performance:', err);
    return res.status(500).json({ error: 'Failed to fetch sales performance data' });
  }
});

// POST /api/performance/sales/save - Save or update entire month or single record
router.post('/sales/save', async (req, res) => {
  try {
    const { month = 'August', year = '2026', items, item } = req.body;
    const key = getSalesKey(month, year);
    let salesDb = loadSalesMonthlyFromDisk() || {};

    if (items && Array.isArray(items)) {
      salesDb[key] = items;
    } else if (item && item.userId) {
      let current = salesDb[key] || getDefaultSalesList(month, year);
      const existingIdx = current.findIndex(r => r.userId === item.userId || r.id === item.id);
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...item, updated_at: new Date().toISOString() };
      } else {
        current.push({
          id: item.id || `smp-${item.userId}-${year}-${month}`,
          month,
          year,
          ...item,
          created_at: new Date().toISOString()
        });
      }
      salesDb[key] = current;
    }

    saveSalesMonthlyToDisk(salesDb);

    return res.json({
      success: true,
      message: 'Sales monthly performance updated and persisted to database.',
      count: (salesDb[key] || []).length,
      data: salesDb[key]
    });
  } catch (err) {
    console.error('Error saving sales performance:', err);
    return res.status(500).json({ error: 'Failed to save sales performance data' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. OPERATIONS MONTHLY PERFORMANCE ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/performance/operations?month=August&year=2026
router.get('/operations', async (req, res) => {
  try {
    const month = req.query.month || 'August';
    const year = req.query.year || '2026';
    const key = getSalesKey(month, year);

    let opsDb = loadOpsMonthlyFromDisk() || {};
    let monthData = opsDb[key];

    if (!monthData || !Array.isArray(monthData) || monthData.length === 0) {
      monthData = getDefaultOpsList(month, year);
      opsDb[key] = monthData;
      saveOpsMonthlyToDisk(opsDb);
    }

    // Sort by achieved desc for output rank
    const sortedOps = [...monthData].sort((a, b) => (Number(b.achieved) || 0) - (Number(a.achieved) || 0));

    // Aggregates
    const totalAchieved = monthData.reduce((acc, r) => acc + (Number(r.achieved) || 0), 0);
    const totalTarget = monthData.reduce((acc, r) => acc + (Number(r.target) || 0), 0);
    const totalDeliveredJobs = monthData.reduce((acc, r) => acc + (Number(r.deliveredJobs) || 0), 0);
    const teamProgressPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return res.json({
      success: true,
      month,
      year,
      count: monthData.length,
      data: monthData,
      sortedOps,
      topLead1: sortedOps[0] || null,
      topLead2: sortedOps[1] || null,
      totals: {
        totalAchieved,
        totalTarget,
        teamProgressPct,
        totalDeliveredJobs,
        totalBonusPool: 'TK 12,850',
        remainingDelivery: totalTarget > totalAchieved ? totalTarget - totalAchieved : 0
      }
    });
  } catch (err) {
    console.error('Error fetching ops monthly performance:', err);
    return res.status(500).json({ error: 'Failed to fetch ops performance data' });
  }
});

// POST /api/performance/operations/save - Save or update entire month or single record
router.post('/operations/save', async (req, res) => {
  try {
    const { month = 'August', year = '2026', items, item } = req.body;
    const key = getSalesKey(month, year);
    let opsDb = loadOpsMonthlyFromDisk() || {};

    if (items && Array.isArray(items)) {
      opsDb[key] = items;
    } else if (item && item.userId) {
      let current = opsDb[key] || getDefaultOpsList(month, year);
      const existingIdx = current.findIndex(r => r.userId === item.userId || r.id === item.id);
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...item, updated_at: new Date().toISOString() };
      } else {
        current.push({
          id: item.id || `omp-${item.userId}-${year}-${month}`,
          month,
          year,
          ...item,
          created_at: new Date().toISOString()
        });
      }
      opsDb[key] = current;
    }

    saveOpsMonthlyToDisk(opsDb);

    return res.json({
      success: true,
      message: 'Operations monthly performance updated and persisted to database.',
      count: (opsDb[key] || []).length,
      data: opsDb[key]
    });
  } catch (err) {
    console.error('Error saving operations performance:', err);
    return res.status(500).json({ error: 'Failed to save operations performance data' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. LIVE RECALCULATION SYNC FROM PROJECTS & CLIENTS
// ─────────────────────────────────────────────────────────────
// POST /api/performance/sync-from-projects
router.post('/sync-from-projects', async (req, res) => {
  try {
    const { month = 'August', year = '2026' } = req.body;
    const key = getSalesKey(month, year);

    const projects = loadProjectsFromDisk() || [];
    const clients = loadClientsFromDisk() || [];

    let salesDb = loadSalesMonthlyFromDisk() || {};
    let opsDb = loadOpsMonthlyFromDisk() || {};

    let salesList = salesDb[key] || getDefaultSalesList(month, year);
    let opsList = opsDb[key] || getDefaultOpsList(month, year);

    // Dynamic calculate sales closed from clients / projects
    salesList = salesList.map(rep => {
      const repQuotes = clients.filter(c => {
        const handler = (c.sales_person_name || '').toLowerCase();
        return handler.includes(rep.name.toLowerCase()) || (c.sales_person_code && c.sales_person_code.includes(rep.userId));
      });
      const quotesCount = Math.max(rep.quotesCount, repQuotes.length);
      return {
        ...rep,
        quotesCount: quotesCount > 0 ? quotesCount : rep.quotesCount
      };
    });

    salesDb[key] = salesList;
    opsDb[key] = opsList;

    saveSalesMonthlyToDisk(salesDb);
    saveOpsMonthlyToDisk(opsDb);

    return res.json({
      success: true,
      message: `Performance database synced with live projects & clients for ${month} ${year}.`,
      salesCount: salesList.length,
      opsCount: opsList.length
    });
  } catch (err) {
    console.error('Error syncing performance:', err);
    return res.status(500).json({ error: 'Failed to sync performance database' });
  }
});

export default router;
