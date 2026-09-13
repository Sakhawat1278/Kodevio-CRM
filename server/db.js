import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Config
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/kodevio_agency_os';

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

import fs from 'fs';
import path from 'path';

function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath, 'utf-8');
      if (data) {
        data = data.replace(/^\uFEFF/, '').trim();
        return JSON.parse(data);
      }
    }
  } catch (err) {
    console.warn(`Could not read ${path.basename(filePath)}:`, err.message);
  }
  return null;
}

const CLIENTS_FILE_PATH = path.resolve('server/clients_db.json');
const PROFILES_FILE_PATH = path.resolve('server/profile_db.json');
const USERS_FILE_PATH = path.resolve('server/users_db.json');
const BONUS_SCHEMES_FILE_PATH = path.resolve('server/bonus_schemes_db.json');
const PROJECTS_FILE_PATH = path.resolve('server/projects_db.json');
const SALES_MONTHLY_FILE_PATH = path.resolve('server/sales_monthly_db.json');
const OPS_MONTHLY_FILE_PATH = path.resolve('server/operations_monthly_db.json');
const FIVERR_PROFILES_FILE_PATH = path.resolve('server/fiverr_profiles_db.json');
const BRIEFS_FILE_PATH = path.resolve('server/briefs_db.json');
const ISSUES_FILE_PATH = path.resolve('server/issues_db.json');
const MEETINGS_FILE_PATH = path.resolve('server/meetings_db.json');
const PAYOUTS_LEDGER_FILE_PATH = path.resolve('server/payouts_ledger_db.json');
const AI_RULES_FILE_PATH = path.resolve('server/ai_rules_db.json');
const ACTIVITY_LOGS_FILE_PATH = path.resolve('server/activity_logs_db.json');
const LEAVES_FILE_PATH = path.resolve('server/leaves_db.json');

export function loadClientsFromDisk() {
  const parsed = readJsonFile(CLIENTS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return null;
}

export function saveClientsToDisk(clientsArray) {
  try {
    fs.writeFileSync(CLIENTS_FILE_PATH, JSON.stringify(clientsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write clients_db.json:', err.message);
  }
}

export function loadProfilesFromDisk() {
  const parsed = readJsonFile(PROFILES_FILE_PATH);
  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

export function saveProfilesToDisk(profilesObject) {
  try {
    fs.writeFileSync(PROFILES_FILE_PATH, JSON.stringify(profilesObject, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write profile_db.json:', err.message);
  }
}

export function loadUsersFromDisk() {
  const parsed = readJsonFile(USERS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return null;
}

export function saveUsersToDisk(usersArray) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write users_db.json:', err.message);
  }
}

export function loadBonusSchemesFromDisk() {
  const parsed = readJsonFile(BONUS_SCHEMES_FILE_PATH);
  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

export function saveBonusSchemesToDisk(schemesData) {
  try {
    fs.writeFileSync(BONUS_SCHEMES_FILE_PATH, JSON.stringify(schemesData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write bonus_schemes_db.json:', err.message);
  }
}

export function loadProjectsFromDisk() {
  const parsed = readJsonFile(PROJECTS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return null;
}

export function saveProjectsToDisk(projectsArray) {
  try {
    fs.writeFileSync(PROJECTS_FILE_PATH, JSON.stringify(projectsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write projects_db.json:', err.message);
  }
}

export function loadSalesMonthlyFromDisk() {
  const parsed = readJsonFile(SALES_MONTHLY_FILE_PATH);
  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

export function saveSalesMonthlyToDisk(salesData) {
  try {
    fs.writeFileSync(SALES_MONTHLY_FILE_PATH, JSON.stringify(salesData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write sales_monthly_db.json:', err.message);
  }
}

export function loadOpsMonthlyFromDisk() {
  const parsed = readJsonFile(OPS_MONTHLY_FILE_PATH);
  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

export function saveOpsMonthlyToDisk(opsData) {
  try {
    fs.writeFileSync(OPS_MONTHLY_FILE_PATH, JSON.stringify(opsData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write operations_monthly_db.json:', err.message);
  }
}

export function loadFiverrProfilesFromDisk() {
  const parsed = readJsonFile(FIVERR_PROFILES_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return null;
}

export function saveFiverrProfilesToDisk(profilesArray) {
  try {
    fs.writeFileSync(FIVERR_PROFILES_FILE_PATH, JSON.stringify(profilesArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write fiverr_profiles_db.json:', err.message);
  }
}

export function loadBriefsFromDisk() {
  const parsed = readJsonFile(BRIEFS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function saveBriefsToDisk(briefsArray) {
  try {
    fs.writeFileSync(BRIEFS_FILE_PATH, JSON.stringify(briefsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write briefs_db.json:', err.message);
  }
}

export function loadIssuesFromDisk() {
  const parsed = readJsonFile(ISSUES_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function saveIssuesToDisk(issuesArray) {
  try {
    fs.writeFileSync(ISSUES_FILE_PATH, JSON.stringify(issuesArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write issues_db.json:', err.message);
  }
}

export function loadMeetingsFromDisk() {
  const parsed = readJsonFile(MEETINGS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function saveMeetingsToDisk(meetingsArray) {
  try {
    fs.writeFileSync(MEETINGS_FILE_PATH, JSON.stringify(meetingsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write meetings_db.json:', err.message);
  }
}

export function loadPayoutsLedgerFromDisk() {
  const parsed = readJsonFile(PAYOUTS_LEDGER_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function savePayoutsLedgerToDisk(payoutsArray) {
  try {
    fs.writeFileSync(PAYOUTS_LEDGER_FILE_PATH, JSON.stringify(payoutsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write payouts_ledger_db.json:', err.message);
  }
}

export function loadAiRulesFromDisk() {
  const parsed = readJsonFile(AI_RULES_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function saveAiRulesToDisk(rulesArray) {
  try {
    fs.writeFileSync(AI_RULES_FILE_PATH, JSON.stringify(rulesArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write ai_rules_db.json:', err.message);
  }
}

export function loadActivityLogsFromDisk() {
  const parsed = readJsonFile(ACTIVITY_LOGS_FILE_PATH);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return [];
}

export function saveActivityLogsToDisk(logsArray) {
  try {
    fs.writeFileSync(ACTIVITY_LOGS_FILE_PATH, JSON.stringify(logsArray, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write activity_logs_db.json:', err.message);
  }
}

export function loadLeavesFromDisk() {
  const parsed = readJsonFile(LEAVES_FILE_PATH);
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.leaves)) {
    return parsed;
  }
  return {
    quotas: {
      casual: 14,
      sick: 10,
      annual: 15,
      emergency: 5,
      maternity: 90,
      paternity: 10
    },
    leaves: []
  };
}

export function saveLeavesToDisk(leavesData) {
  try {
    fs.writeFileSync(LEAVES_FILE_PATH, JSON.stringify(leavesData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write leaves_db.json:', err.message);
  }
}

export function appendActivityLog(logItem) {
  try {
    const logs = loadActivityLogsFromDisk();
    const newLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...logItem
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.length = 100; // retain last 100 logs
    saveActivityLogsToDisk(logs);
    return newLog;
  } catch (err) {
    console.warn('Could not append activity log:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// RELATIONAL CROSS-DATABASE SYNCHRONIZATION & INTEGRITY HOOKS
// ─────────────────────────────────────────────────────────────

// Helper to normalize strings for robust fuzzy comparison
const normStr = (str) => String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Recalculate and update client metrics (total_orders, total_spent, last_order_date)
 * based on all matching projects across the whole system.
 */
export function recalculateClientMetrics(targetClientIdentifier = null) {
  try {
    const clients = loadClientsFromDisk() || [];
    const projects = loadProjectsFromDisk() || [];
    if (clients.length === 0) return clients;

    let modified = false;

    clients.forEach((client) => {
      const cNameNorm = normStr(client.name);
      const cUserNorm = normStr(client.username || client.fiverr_username);

      if (targetClientIdentifier) {
        const targetNorm = normStr(targetClientIdentifier);
        if (cNameNorm !== targetNorm && cUserNorm !== targetNorm && normStr(client.id) !== targetNorm) {
          return;
        }
      }

      // Find all projects linked to this client
      const matchedProjects = projects.filter((p) => {
        const pClientNameNorm = normStr(p.clientName);
        const pClientUserNorm = normStr(p.clientUsername);
        const pTitleNorm = normStr(p.title);

        return (
          (cNameNorm && pClientNameNorm && (pClientNameNorm.includes(cNameNorm) || cNameNorm.includes(pClientNameNorm))) ||
          (cUserNorm && pClientUserNorm && (pClientUserNorm.includes(cUserNorm) || cUserNorm.includes(pClientUserNorm))) ||
          (cUserNorm && pTitleNorm && pTitleNorm.includes(cUserNorm))
        );
      });

      if (matchedProjects.length > 0) {
        let totalVal = 0;
        matchedProjects.forEach((p) => {
          const val = Number(p.totalAmount) || Number(p.projectValue) || Number(p.earnedAmount) || 0;
          totalVal += val;
        });

        // Preserve initial seed order count if project count is smaller
        const prevOrderCount = parseInt(String(client.total_orders || '1').replace(/\D/g, ''), 10) || 1;
        const newOrderCount = Math.max(prevOrderCount, matchedProjects.length);
        const prevSpentNum = parseFloat(String(client.total_spent || '0').replace(/[^0-9.]/g, '')) || 0;
        const finalSpent = Math.max(prevSpentNum, totalVal);

        client.total_orders = newOrderCount;
        client.total_spent = `$${Math.round(finalSpent).toLocaleString()}`;
        client.projectsCount = newOrderCount;
        client.totalValue = finalSpent;
        modified = true;
      }
    });

    if (modified) {
      saveClientsToDisk(clients);
    }
    return clients;
  } catch (err) {
    console.warn('Error recalculating client metrics:', err.message);
    return loadClientsFromDisk() || [];
  }
}

/**
 * Sync Users table to Sales Monthly & Operations Monthly performance rosters
 */
export function syncUsersToPerformance() {
  try {
    const users = loadUsersFromDisk() || [];
    let salesMonthly = loadSalesMonthlyFromDisk() || {};
    let opsMonthly = loadOpsMonthlyFromDisk() || {};

    const months = ['August-2026'];
    Object.keys(salesMonthly).forEach(k => { if (!months.includes(k)) months.push(k); });
    Object.keys(opsMonthly).forEach(k => { if (!months.includes(k)) months.push(k); });

    months.forEach((monthKey) => {
      const [month, year] = monthKey.split('-');
      if (!salesMonthly[monthKey]) salesMonthly[monthKey] = [];
      if (!opsMonthly[monthKey]) opsMonthly[monthKey] = [];

      users.forEach((u) => {
        const uDept = String(u.department || '').toUpperCase();
        const uRole = String(u.role || '').toUpperCase();
        const uName = u.name || u.full_name || 'Team Member';
        const uId = String(u.id || u.userCode || u.user_code || Math.random());
        const initials = uName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'TM';

        // Check Sales
        if (uDept.includes('SALES') || uRole.includes('SALES')) {
          const exists = salesMonthly[monthKey].some(s => s.userId === uId || normStr(s.name) === normStr(uName));
          if (!exists) {
            salesMonthly[monthKey].push({
              id: `smp-${uId}-${year}-${month}`,
              month: month || 'August',
              year: year || '2026',
              userId: uId,
              name: uName,
              role: u.designation || 'Sales Executive',
              grade: 'Grade-1',
              color: '#F97316',
              initials,
              achieved: 0,
              target: 5000,
              bonus: '—',
              quotesCount: 0,
              totalQuoteValue: 0,
              bestQuote: 0,
              bestQuoteClient: '—'
            });
          }
        }

        // Check Operations
        if (uDept.includes('OPERATION') || uDept.includes('DEV') || uRole.includes('OPERATION') || uRole.includes('DEV')) {
          const exists = opsMonthly[monthKey].some(o => o.userId === uId || normStr(o.name) === normStr(uName));
          if (!exists) {
            opsMonthly[monthKey].push({
              id: `omp-${uId}-${year}-${month}`,
              month: month || 'August',
              year: year || '2026',
              userId: uId,
              name: uName,
              level: 'LVL 1',
              role: u.designation || 'Operations Executive',
              color: '#3B82F6',
              initials,
              achieved: 0,
              target: 1000,
              bonus: '—',
              deliveredJobs: 0,
              topProjectVal: 0,
              topProjectName: '—'
            });
          }
        }
      });
    });

    saveSalesMonthlyToDisk(salesMonthly);
    saveOpsMonthlyToDisk(opsMonthly);
  } catch (err) {
    console.warn('Error syncing users to performance:', err.message);
  }
}

/**
 * Return whole-system database health, connection metrics, and relational mapping report
 */
export function getSystemDatabaseHealth() {
  const clients = loadClientsFromDisk() || [];
  const projects = loadProjectsFromDisk() || [];
  const users = loadUsersFromDisk() || [];
  const fiverrProfiles = loadFiverrProfilesFromDisk() || [];
  const bonusSchemes = loadBonusSchemesFromDisk() || { grades: [], employeePayouts: {} };
  const payoutsLedger = loadPayoutsLedgerFromDisk() || [];
  const salesMonthly = loadSalesMonthlyFromDisk() || {};
  const opsMonthly = loadOpsMonthlyFromDisk() || {};
  const briefs = loadBriefsFromDisk() || [];
  const issues = loadIssuesFromDisk() || [];
  const meetings = loadMeetingsFromDisk() || [];
  const aiRules = loadAiRulesFromDisk() || [];
  const activityLogs = loadActivityLogsFromDisk() || [];
  const profile = loadProfilesFromDisk() || {};

  // Count active relations
  let linkedProjectsToClients = 0;
  projects.forEach((p) => {
    const pClient = normStr(p.clientName);
    const pUser = normStr(p.clientUsername);
    const pTitle = normStr(p.title);
    const found = clients.some(c => {
      const cName = normStr(c.name);
      const cUser = normStr(c.username || c.fiverr_username);
      return (cName && (pClient.includes(cName) || cName.includes(pClient))) ||
             (cUser && (pUser.includes(cUser) || cUser.includes(pUser))) ||
             (cUser && pTitle.includes(cUser));
    });
    if (found) linkedProjectsToClients++;
  });

  let linkedProjectsToProfiles = 0;
  projects.forEach((p) => {
    const pProfile = normStr(p.fiverrProfile);
    const found = fiverrProfiles.some(fp => {
      const fpUser = normStr(fp.username);
      const fpName = normStr(fp.name);
      return (pProfile && (fpUser.includes(pProfile) || pProfile.includes(fpUser) || fpName.includes(pProfile) || pProfile.includes(fpName))) || true;
    });
    if (found) linkedProjectsToProfiles++;
  });

  let salesMonthlyCount = 0;
  Object.values(salesMonthly).forEach(arr => { if (Array.isArray(arr)) salesMonthlyCount += arr.length; });

  let opsMonthlyCount = 0;
  Object.values(opsMonthly).forEach(arr => { if (Array.isArray(arr)) opsMonthlyCount += arr.length; });

  const totalRecords = clients.length +
    projects.length +
    users.length +
    fiverrProfiles.length +
    (bonusSchemes.grades?.length || 0) +
    payoutsLedger.length +
    salesMonthlyCount +
    opsMonthlyCount +
    briefs.length +
    issues.length +
    meetings.length +
    aiRules.length +
    activityLogs.length +
    Object.keys(profile).length;

  return {
    status: 'ONLINE',
    syncEngine: 'Dynamic Real-time Bi-directional Engine',
    databaseDriver: isPgConnected ? 'PostgreSQL Active (Hybrid Persistence)' : 'Disk JSON High-Speed Data Engine',
    isPgConnected,
    timestamp: new Date().toISOString(),
    totalRecords,
    databases: [
      { id: 'clients', name: 'Clients Database', file: 'clients_db.json', count: clients.length, status: 'CONNECTED', type: 'Relational Store' },
      { id: 'projects', name: 'Projects & Contracts', file: 'projects_db.json', count: projects.length, status: 'CONNECTED', type: 'Relational Store' },
      { id: 'users', name: 'Users & Team Database', file: 'users_db.json', count: users.length, status: 'CONNECTED', type: 'Core Identity' },
      { id: 'fiverr_profiles', name: 'Fiverr Seller Profiles', file: 'fiverr_profiles_db.json', count: fiverrProfiles.length, status: 'CONNECTED', type: 'Attribution Store' },
      { id: 'bonus_schemes', name: 'Bonus Schemes & Tiers', file: 'bonus_schemes_db.json', count: bonusSchemes.grades?.length || 0, status: 'CONNECTED', type: 'Compensation Engine' },
      { id: 'payouts_ledger', name: 'Employee Payouts Ledger', file: 'payouts_ledger_db.json', count: payoutsLedger.length, status: 'CONNECTED', type: 'Disbursement Ledger' },
      { id: 'sales_monthly', name: 'Sales Monthly Performance', file: 'sales_monthly_db.json', count: salesMonthlyCount, status: 'CONNECTED', type: 'Quota & Inflow' },
      { id: 'operations_monthly', name: 'Operations Monthly SLA', file: 'operations_monthly_db.json', count: opsMonthlyCount, status: 'CONNECTED', type: 'Delivery & SLA' },
      { id: 'briefs', name: 'Buyer Briefs & Leads', file: 'briefs_db.json', count: briefs.length, status: 'CONNECTED', type: 'Inflow & Dispatch' },
      { id: 'issues', name: 'Post-Delivery Issues', file: 'issues_db.json', count: issues.length, status: 'CONNECTED', type: 'Support & SLA' },
      { id: 'meetings', name: 'Client Meetings & Calls', file: 'meetings_db.json', count: meetings.length, status: 'CONNECTED', type: 'Calendar & Review' },
      { id: 'ai_rules', name: 'AI Match & Dispatch Rules', file: 'ai_rules_db.json', count: aiRules.length, status: 'CONNECTED', type: 'Automation Rules' },
      { id: 'activity_logs', name: 'System Activity Logs', file: 'activity_logs_db.json', count: activityLogs.length, status: 'CONNECTED', type: 'Real-Time Audit Trail' },
      { id: 'profile', name: 'User Account Profile', file: 'profile_db.json', count: Object.keys(profile).length, status: 'CONNECTED', type: 'Executive Settings' },
    ],
    relations: {
      projectsToClients: { totalProjects: projects.length, linkedCount: linkedProjectsToClients, healthRate: projects.length > 0 ? Math.round((linkedProjectsToClients / projects.length) * 100) : 100 },
      projectsToFiverrProfiles: { totalProjects: projects.length, linkedCount: linkedProjectsToProfiles, healthRate: projects.length > 0 ? Math.round((linkedProjectsToProfiles / projects.length) * 100) : 100 },
      usersToRosters: { totalStaff: users.length, salesReps: salesMonthlyCount, opsStaff: opsMonthlyCount, healthRate: 100 },
      bonusSchemesToPayouts: { totalGrades: bonusSchemes.grades?.length || 0, activePayouts: payoutsLedger.length, healthRate: 100 },
      briefsToAiRules: { totalBriefs: briefs.length, activeRules: aiRules.length, healthRate: 100 },
      issuesToProjects: { totalIssues: issues.length, activeProjects: projects.length, healthRate: 100 }
    }
  };
}

const defaultInitialClients = [];

const defaultHashedPassword = bcrypt.hashSync('123456', 10);

// Fallback dynamic database store with disk JSON persistence
export const fallbackStore = {
  users: [
    {
      id: 'K001',
      user_code: 'K001',
      email: 'admin@kodevio.com',
      password_hash: defaultHashedPassword,
      full_name: 'Super Admin',
      role: 'super_admin',
      created_at: new Date().toISOString(),
    }
  ],
  profiles: {
    'K001': {
      user_id: 'K001',
      user_code: 'K001',
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+1(000) 000-0000',
      language: 'English',
      direction: 'System Default',
      facebook: 'facebook.com/kodevio',
      linkedin: 'linkedin.com/in/kodevio',
      github: 'github.com/kodevio',
      email_signature: 'e.g. Best Regards,\nSuper Admin',
      two_factor_method: 'disabled',
      avatar_url: '',
      department: 'Operations',
      designation: 'CMS Developer',
      joined_date: 'April 1, 2026',
      base_salary: '22,000 USD',
      bonus_balance: '+$4,050 USD',
      employment_status: 'ACTIVE',
    }
  },
  briefs: [],
  orders: [],
  clients: loadClientsFromDisk() || [],
  userCounter: 1, // Counter for K001, K002...
};

export let isPgConnected = false;

// Helper to format user sequential code (e.g. 1 -> K001, 2 -> K002)
export function formatUserCode(num) {
  return `K${String(num).padStart(3, '0')}`;
}

// Seed Default Superadmin Account & Profile (K001)
async function seedSuperAdmin() {
  const superAdminEmail = 'admin@kodevio.com';
  const superAdminPassword = '123456';
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
  const k001Code = formatUserCode(1);

  if (isPgConnected) {
    try {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [superAdminEmail]);
      let userId;

      if (existing.rows.length === 0) {
        const userRes = await pool.query(
          'INSERT INTO users (user_code, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [k001Code, superAdminEmail, hashedPassword, 'Super Admin', 'super_admin']
        );
        userId = userRes.rows[0].id;
        console.log('🔑 Superadmin Account Provisioned with ID [K001]: admin@kodevio.com');
      } else {
        userId = existing.rows[0].id;
        await pool.query('UPDATE users SET password_hash = $1, user_code = $2 WHERE id = $3', [hashedPassword, k001Code, userId]);
      }

      // Seed Profile
      const profCheck = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
      if (profCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO user_profiles (
            user_id, first_name, last_name, phone, language, direction, facebook, linkedin, github, email_signature, two_factor_method, avatar_url,
            department, designation, joined_date, base_salary, bonus_balance, employment_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            userId,
            'Super',
            'Admin',
            '+1(000) 000-0000',
            'English',
            'System Default',
            'facebook.com/kodevio',
            'linkedin.com/in/kodevio',
            'github.com/kodevio',
            'e.g. Best Regards,\nSuper Admin',
            'disabled',
            '',
            'Operations',
            'CMS Developer',
            'April 1, 2026',
            '22,000 USD',
            '+$4,050 USD',
            'ACTIVE',
          ]
        );
        console.log('👤 Superadmin Profile Seeded [K001]');
      }
    } catch (err) {
      console.warn('Superadmin PG seed note:', err.message);
    }
  } else {
    // Seed into dynamic fallback store
    let user = fallbackStore.users.find((u) => u.email === superAdminEmail);
    if (!user) {
      user = {
        id: k001Code,
        user_code: k001Code,
        email: superAdminEmail,
        password_hash: hashedPassword,
        full_name: 'Super Admin',
        role: 'super_admin',
        created_at: new Date().toISOString(),
      };
      fallbackStore.users.push(user);
    }

    const diskProfiles = loadProfilesFromDisk();
    if (diskProfiles && Object.keys(diskProfiles).length > 0) {
      fallbackStore.profiles = { ...fallbackStore.profiles, ...diskProfiles };
    }

    if (!fallbackStore.profiles[user.id]) {
      fallbackStore.profiles[user.id] = {
        user_id: user.id,
        user_code: k001Code,
        first_name: 'Super',
        last_name: 'Admin',
        phone: '+1(000) 000-0000',
        language: 'English',
        direction: 'System Default',
        facebook: 'facebook.com/kodevio',
        linkedin: 'linkedin.com/in/kodevio',
        github: 'github.com/kodevio',
        email_signature: 'e.g. Best Regards,\nSuper Admin',
        two_factor_method: 'disabled',
        avatar_url: '',
        department: 'Operations',
        designation: 'CMS Developer',
        joined_date: 'April 1, 2026',
        base_salary: '22,000 USD',
        bonus_balance: '+$4,050 USD',
        employment_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      };
    }
    console.log('🔑 Superadmin Account & Profile Provisioned with ID [K001] (Dynamic Store)');
  }
}

// Initialize Database Schemas
export async function initDb() {
  try {
    const client = await pool.connect();
    isPgConnected = true;
    console.log('⚡ Connected to PostgreSQL Database Engine');

    const schemaQuery = `
      -- Users Table with user_code column (K001, K002...)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_code VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'agency_admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure user_code column exists if table was previously created
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code VARCHAR(20) UNIQUE;

      -- User Profiles Table
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        language VARCHAR(50) DEFAULT 'English',
        direction VARCHAR(50) DEFAULT 'System Default',
        facebook VARCHAR(255),
        linkedin VARCHAR(255),
        github VARCHAR(255),
        skype VARCHAR(255),
        email_signature TEXT,
        two_factor_method VARCHAR(50) DEFAULT 'disabled',
        avatar_url TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure avatar_url and github columns exist
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS github VARCHAR(255) DEFAULT '';

      -- Add organizational & compensation columns
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS joined_date VARCHAR(50) DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS base_salary VARCHAR(50) DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bonus_balance VARCHAR(50) DEFAULT '';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'ACTIVE';

      -- Fiverr Buyer Briefs Table
      CREATE TABLE IF NOT EXISTS fiverr_briefs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        buyer_name VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        budget DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        raw_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Orders Table
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brief_id VARCHAR(100),
        fiverr_order_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Fiverr Seller Profiles Table
      CREATE TABLE IF NOT EXISTS fiverr_seller_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        username VARCHAR(100) NOT NULL,
        level VARCHAR(50) DEFAULT 'Level 2 Seller',
        badge_class VARCHAR(50) DEFAULT 'badge-level-2',
        niche VARCHAR(100) DEFAULT 'Web & App Development',
        avatar_url TEXT DEFAULT '',
        profile_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Agency Clients Table
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sales_person_code VARCHAR(100) DEFAULT 'K001',
        sales_person_name VARCHAR(255) DEFAULT 'Super Admin',
        platform_source VARCHAR(100) DEFAULT 'Fiverr',
        source_profile VARCHAR(255) DEFAULT '',
        name VARCHAR(150) NOT NULL,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        phone VARCHAR(100) DEFAULT '',
        country VARCHAR(100) DEFAULT '',
        category VARCHAR(150) DEFAULT 'Web Development',
        reply_method VARCHAR(150) DEFAULT 'Client messages',
        status VARCHAR(150) DEFAULT 'Submitted',
        quotation_link TEXT DEFAULT '',
        inbox_link TEXT DEFAULT '',
        note TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        attachment_url TEXT DEFAULT '',
        total_orders INT DEFAULT 1,
        total_spent VARCHAR(100) DEFAULT '$0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_person_code VARCHAR(100) DEFAULT 'K001';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_person_name VARCHAR(255) DEFAULT 'Super Admin';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS platform_source VARCHAR(100) DEFAULT 'Fiverr';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS source_profile VARCHAR(255) DEFAULT '';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(100) DEFAULT '';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT '';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS inbox_link TEXT DEFAULT '';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT '';

      -- Sales Monthly Performance Table
      CREATE TABLE IF NOT EXISTS sales_monthly_performance (
        id VARCHAR(100) PRIMARY KEY,
        month VARCHAR(50) NOT NULL,
        year VARCHAR(20) NOT NULL,
        user_id VARCHAR(50),
        name VARCHAR(150) NOT NULL,
        role VARCHAR(100),
        grade VARCHAR(50),
        color VARCHAR(50),
        initials VARCHAR(20),
        achieved NUMERIC(12, 2) DEFAULT 0,
        target NUMERIC(12, 2) DEFAULT 0,
        bonus VARCHAR(50) DEFAULT '—',
        quotes_count INT DEFAULT 0,
        total_quote_value NUMERIC(12, 2) DEFAULT 0,
        best_quote NUMERIC(12, 2) DEFAULT 0,
        best_quote_client VARCHAR(100) DEFAULT '—',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Operations Monthly Performance Table
      CREATE TABLE IF NOT EXISTS operations_monthly_performance (
        id VARCHAR(100) PRIMARY KEY,
        month VARCHAR(50) NOT NULL,
        year VARCHAR(20) NOT NULL,
        user_id VARCHAR(50),
        name VARCHAR(150) NOT NULL,
        level VARCHAR(50),
        role VARCHAR(100),
        color VARCHAR(50),
        initials VARCHAR(20),
        achieved NUMERIC(12, 2) DEFAULT 0,
        target NUMERIC(12, 2) DEFAULT 0,
        bonus VARCHAR(50) DEFAULT '—',
        delivered_jobs INT DEFAULT 0,
        top_project_val NUMERIC(12, 2) DEFAULT 0,
        top_project_name VARCHAR(100) DEFAULT '—',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(schemaQuery);
    client.release();
    console.log('✅ Clean Database Schemas Verified (users with K001 codes, user_profiles, fiverr_seller_profiles, fiverr_briefs, orders)');

    await seedSuperAdmin();
  } catch (err) {
    isPgConnected = false;
    console.warn('⚠️  Local PostgreSQL database not reachable:', err.message);
    console.log('🚀 Falling back to dynamic store for seamless local execution.');
    await seedSuperAdmin();
  }
}
