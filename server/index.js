import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import syncRoutes from './routes/sync.js';
import fiverrProfilesRoutes from './routes/fiverrProfiles.js';
import clientsRoutes from './routes/clients.js';
import usersRoutes from './routes/users.js';
import bonusSchemesRoutes from './routes/bonusSchemes.js';
import projectsRoutes from './routes/projects.js';
import performanceRoutes from './routes/performance.js';
import briefsRoutes from './routes/briefs.js';
import issuesRoutes from './routes/issues.js';
import meetingsRoutes from './routes/meetings.js';
import payoutsRoutes from './routes/payouts.js';
import aiRulesRoutes from './routes/aiRules.js';
import activityLogsRoutes from './routes/activityLogs.js';
import leavesRoutes from './routes/leaves.js';
import { initDb, isPgConnected, pool, fallbackStore, loadUsersFromDisk, loadProfilesFromDisk, loadClientsFromDisk, loadBonusSchemesFromDisk, loadProjectsFromDisk, loadSalesMonthlyFromDisk, loadOpsMonthlyFromDisk, loadBriefsFromDisk, loadIssuesFromDisk, loadMeetingsFromDisk, loadPayoutsLedgerFromDisk, loadAiRulesFromDisk, loadActivityLogsFromDisk, loadLeavesFromDisk } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON Parsing (increase limit for avatar base64 images)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes (All 15 Database Endpoints)
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bonus-schemes', bonusSchemesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/fiverr-profiles', fiverrProfilesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/briefs', briefsRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/ai-rules', aiRulesRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/db/sync', syncRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Kodevio Agency OS v2.4',
    timestamp: new Date().toISOString(),
    database: isPgConnected ? 'PostgreSQL Active' : 'Dynamic Database Engine Active',
  });
});

// HTML Visual Database Inspector Endpoint
app.get('/api/db/inspect', async (req, res) => {
  try {
    let usersList = [];
    let profilesList = [];
    let fiverrSellerProfilesList = [];
    let clientsList = [];
    let projectsList = [];
    let briefsList = [];
    let ordersList = [];

    let salesMonthlyList = [];
    let opsMonthlyList = [];

    const diskUsers = loadUsersFromDisk();
    const diskProfiles = loadProfilesFromDisk();
    const diskClients = loadClientsFromDisk();
    const diskProjects = loadProjectsFromDisk();
    const diskBonusSchemes = loadBonusSchemesFromDisk() || { grades: [], employeePayouts: {} };
    const diskSalesMonthly = loadSalesMonthlyFromDisk() || {};
    const diskOpsMonthly = loadOpsMonthlyFromDisk() || {};

    // Flatten sales & ops records across months
    Object.keys(diskSalesMonthly).forEach(key => {
      if (Array.isArray(diskSalesMonthly[key])) {
        salesMonthlyList.push(...diskSalesMonthly[key]);
      }
    });

    Object.keys(diskOpsMonthly).forEach(key => {
      if (Array.isArray(diskOpsMonthly[key])) {
        opsMonthlyList.push(...diskOpsMonthly[key]);
      }
    });

    if (isPgConnected) {
      const uRes = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      const pRes = await pool.query(`
        SELECT up.*, u.email as user_email, u.user_code 
        FROM user_profiles up 
        JOIN users u ON up.user_id = u.id
      `);
      const fpRes = await pool.query('SELECT * FROM fiverr_seller_profiles ORDER BY created_at DESC');
      const cRes = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
      let prjRes = { rows: [] };
      try {
        prjRes = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
      } catch (e) {
        // Fallback to disk if table not yet created
      }
      const bRes = await pool.query('SELECT * FROM fiverr_briefs');
      const oRes = await pool.query('SELECT * FROM orders');

      usersList = uRes.rows.length > 0 ? uRes.rows : (diskUsers || []);
      profilesList = pRes.rows;
      fiverrSellerProfilesList = fpRes.rows;
      clientsList = cRes.rows.length > 0 ? cRes.rows : (diskClients || []);
      projectsList = prjRes.rows.length > 0 ? prjRes.rows : (diskProjects || []);
      briefsList = bRes.rows;
      ordersList = oRes.rows;
    } else {
      usersList = diskUsers && diskUsers.length > 0 ? diskUsers : fallbackStore.users.map((u) => ({
        id: u.id,
        userCode: u.user_code || u.id || 'EMP001',
        email: u.email,
        name: u.full_name,
        role: u.role,
        department: 'MANAGEMENT',
        designation: 'Managing Director',
        monthlySalary: '9,500.00',
        status: 'ACTIVE',
        created_at: u.created_at,
      }));

      profilesList = diskProfiles ? Object.values(diskProfiles) : Object.values(fallbackStore.profiles).map((p) => {
        const u = fallbackStore.users.find((user) => user.id === p.user_id);
        return {
          ...p,
          user_code: p.user_code || (u ? u.user_code || u.id : 'EMP001'),
          user_email: u ? u.email : 'admin@kodevio.com',
        };
      });

      fiverrSellerProfilesList = fallbackStore.fiverrProfiles || [];
      clientsList = diskClients && diskClients.length > 0 ? diskClients : fallbackStore.clients || [];
      projectsList = diskProjects && diskProjects.length > 0 ? diskProjects : (fallbackStore.projects || []);
      briefsList = fallbackStore.briefs || [];
      ordersList = fallbackStore.orders || [];
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Kodevio Agency OS - Live Database Inspector</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #F8FAFC; margin: 0; padding: 2rem; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #334155; padding-bottom: 1rem; }
          h1 { font-size: 1.5rem; margin: 0; color: #1DBF73; }
          .badge { font-size: 0.8rem; background: #1E293B; padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid #334155; color: #38BDF8; }
          .section { background: #1E293B; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #334155; }
          h2 { font-size: 1.1rem; margin-top: 0; color: #F1F5F9; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
          th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; vertical-align: middle; }
          th { background: #0F172A; color: #94A3B8; font-weight: 600; }
          tr:hover { background: #334155; }
          .role-badge { background: #065F46; color: #A7F3D0; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
          .kcode-badge { background: #1E1B4B; color: #818CF8; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 0.85rem; border: 1px solid #3730A3; }
          code { background: #0F172A; padding: 0.2rem 0.4rem; border-radius: 4px; color: #F43F5E; }
          .avatar-thumb { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #475569; }
          .avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #F8FAFC; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kodevio Agency OS - Live Database Inspector</h1>
          <span class="badge">Engine: ${isPgConnected ? 'PostgreSQL Active' : 'Dynamic Fallback Store Active'}</span>
        </div>

        <div class="section">
          <h2>👤 User Profiles Table (${profilesList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joined Date</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Status</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              ${
                profilesList.length === 0
                  ? '<tr><td colspan="11">No user profiles found.</td></tr>'
                  : profilesList
                      .map(
                        (p) => `
                <tr>
                  <td>
                    ${
                      p.avatar_url
                        ? `<img src="${p.avatar_url}" class="avatar-thumb" alt="Avatar" />`
                        : `<div class="avatar-placeholder">${p.first_name ? p.first_name.charAt(0) : 'A'}</div>`
                    }
                  </td>
                  <td><span class="kcode-badge">${p.user_code || 'K001'}</span></td>
                  <td><strong>${p.first_name || ''} ${p.last_name || ''}</strong></td>
                  <td><span style="color: #38BDF8;">${p.user_email || 'admin@kodevio.com'}</span></td>
                  <td><span style="color: #818CF8; font-weight: 600;">${p.department || 'Operations'}</span></td>
                  <td><strong>${p.designation || 'CMS Developer'}</strong></td>
                  <td>${p.joined_date || 'April 1, 2026'}</td>
                  <td><strong style="color: #F8FAFC;">${p.base_salary || '22,000 USD'}</strong></td>
                  <td><strong style="color: #10B981;">${p.bonus_balance || '+$4,050 USD'}</strong></td>
                  <td><span class="role-badge" style="background: #065F46; color: #A7F3D0;">${p.employment_status || 'ACTIVE'}</span></td>
                  <td>${new Date(p.updated_at || Date.now()).toLocaleString()}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>👥 Organization Team &amp; Users Table (${usersList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Employee Code</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Monthly Salary</th>
                <th>Status</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              ${
                usersList.length === 0
                  ? '<tr><td colspan="10">No users found.</td></tr>'
                  : usersList
                      .map(
                        (u) => `
                <tr>
                  <td>
                    ${
                      u.avatar
                        ? `<img src="${u.avatar}" class="avatar-thumb" alt="Avatar" />`
                        : `<div class="avatar-placeholder">${u.name ? u.name.charAt(0) : (u.full_name ? u.full_name.charAt(0) : 'U')}</div>`
                    }
                  </td>
                  <td><span class="kcode-badge">${u.userCode || u.user_code || u.id || 'EMP001'}</span></td>
                  <td><strong>${u.name || u.full_name || 'User'}</strong></td>
                  <td><span style="color: #38BDF8;">${u.email}</span></td>
                  <td><span style="color: #818CF8; font-weight: 700;">${u.department || 'MANAGEMENT'}</span></td>
                  <td><strong style="color: #F1F5F9;">${u.designation || 'Specialist'}</strong></td>
                  <td><span class="role-badge" style="background: #1E1B4B; color: #A5B4FC; border: 1px solid #3730A3;">${u.role}</span></td>
                  <td><strong style="color: #10B981;">$${u.monthlySalary || u.base_salary || '0.00'}</strong></td>
                  <td><span class="role-badge" style="background: ${u.status === 'ACTIVE' ? '#065F46' : '#334155'}; color: ${u.status === 'ACTIVE' ? '#A7F3D0' : '#94A3B8'};">${u.status || 'ACTIVE'}</span></td>
                  <td>${u.joinDate || u.joined_date || (u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A')}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🎯 Bonus Schemes &amp; Levels Configuration (${diskBonusSchemes.grades.length} Grades)</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Grade</th>
                <th>Salary Bracket</th>
                <th>Levels Configured</th>
                <th>Target Range (Min &rarr; Max)</th>
                <th>Bonus Range (Min &rarr; Max)</th>
              </tr>
            </thead>
            <tbody>
              ${
                diskBonusSchemes.grades.length === 0
                  ? '<tr><td colspan="6">No bonus scheme grades configured.</td></tr>'
                  : diskBonusSchemes.grades
                      .map(
                        (g) => {
                          const lvls = g.levels || [];
                          const minT = lvls.length > 0 ? lvls[0].targetAmount : 0;
                          const maxT = lvls.length > 0 ? lvls[lvls.length - 1].targetAmount : 0;
                          const minB = lvls.length > 0 ? lvls[0].bonusAmount : 0;
                          const maxB = lvls.length > 0 ? lvls[lvls.length - 1].bonusAmount : 0;
                          return `
                <tr>
                  <td><span class="role-badge" style="background: ${g.department === 'SALES' ? '#065F46' : '#1E1B4B'}; color: ${g.department === 'SALES' ? '#A7F3D0' : '#A5B4FC'}; font-weight: 800;">${g.department}</span></td>
                  <td><strong>${g.gradeName || 'Grade ' + g.gradeNumber}</strong></td>
                  <td><span style="color: #38BDF8; font-weight: 700;">$${g.minSalary.toLocaleString()} &mdash; $${g.maxSalary.toLocaleString()}</span></td>
                  <td><span class="kcode-badge">${lvls.length} Levels</span></td>
                  <td><strong style="color: #F1F5F9;">$${minT.toLocaleString()} &rarr; $${maxT.toLocaleString()}</strong></td>
                  <td><strong style="color: #10B981;">$${minB.toLocaleString()} &rarr; $${maxB.toLocaleString()}</strong></td>
                </tr>
              `;
                        }
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🌐 Fiverr Seller Profiles Table (${fiverrSellerProfilesList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Display Name</th>
                <th>Fiverr Username</th>
                <th>Seller Level</th>
                <th>Niche</th>
                <th>Profile URL</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${
                fiverrSellerProfilesList.length === 0
                  ? '<tr><td colspan="7">No fiverr seller profiles in database.</td></tr>'
                  : fiverrSellerProfilesList
                      .map(
                        (fp) => `
                <tr>
                  <td>
                    ${
                      fp.avatar || fp.avatar_url
                        ? `<img src="${fp.avatar || fp.avatar_url}" class="avatar-thumb" alt="Avatar" />`
                        : `<div class="avatar-placeholder">${fp.name ? fp.name.charAt(0) : 'F'}</div>`
                    }
                  </td>
                  <td><strong>${fp.name}</strong></td>
                  <td><span style="color: #10B981; font-weight: 700;">@${fp.username}</span></td>
                  <td><span class="role-badge" style="background: #312E81; color: #C7D2FE;">${fp.level}</span></td>
                  <td>${fp.niche}</td>
                  <td><a href="${fp.profileUrl || fp.profile_url}" target="_blank" style="color: #38BDF8; text-decoration: none;">${fp.profileUrl || fp.profile_url || 'Link ↗'}</a></td>
                  <td>${new Date(fp.created_at || Date.now()).toLocaleString()}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>💼 Agency Clients Table (${clientsList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Client Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Fiverr Handle</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Source</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${
                clientsList.length === 0
                  ? '<tr><td colspan="11">No clients found in database.</td></tr>'
                  : clientsList
                      .map(
                        (c) => `
                <tr>
                  <td>
                    ${
                      c.avatar_url
                        ? `<img src="${c.avatar_url}" class="avatar-thumb" alt="Avatar" />`
                        : `<div class="avatar-placeholder">${c.name ? c.name.charAt(0) : 'C'}</div>`
                    }
                  </td>
                  <td><strong>${c.name}</strong></td>
                  <td><span style="color: #94A3B8;">${c.company_name || '-'}</span></td>
                  <td><span style="color: #38BDF8;">${c.email}</span></td>
                  <td>${c.phone || '-'}</td>
                  <td><span style="color: #10B981; font-weight: 700;">@${c.fiverr_username || 'n/a'}</span></td>
                  <td><span class="role-badge" style="background: #064E3B; color: #A7F3D0;">${c.status || 'Active Client'}</span></td>
                  <td><strong>${c.total_orders || 1}</strong></td>
                  <td><strong style="color: #10B981;">${c.total_spent || '$0'}</strong></td>
                  <td>${c.source || 'Fiverr Organic'}</td>
                  <td>${new Date(c.created_at || Date.now()).toLocaleString()}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🚀 Agency Projects &amp; Orders Database (${projectsList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Project Title &amp; Details</th>
                <th>Category</th>
                <th>Service Line</th>
                <th>Client Name</th>
                <th>Seller Profile</th>
                <th>Milestone</th>
                <th>Timeline</th>
                <th>Financials</th>
                <th>Sales Lead</th>
                <th>Project Manager</th>
                <th>Dev Team</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              ${
                projectsList.length === 0
                  ? '<tr><td colspan="15">No active projects found in database.</td></tr>'
                  : projectsList
                      .map(
                        (prj) => {
                          const earned = Number(prj.earnedAmount || prj.deliveryAmount || 0);
                          const total = Number(prj.totalAmount || prj.budget || 0);
                          const st = String(prj.status || 'WIP').toUpperCase();
                          let stColor = '#10B981';
                          let stBg = '#065F46';
                          if (st.includes('CANCEL') || st.includes('HOLD')) { stColor = '#F87171'; stBg = '#7F1D1D'; }
                          else if (st.includes('REVISION') || st.includes('ISSUE')) { stColor = '#FBBF24'; stBg = '#78350F'; }
                          else if (st.includes('WIP') || st.includes('PROGRESS')) { stColor = '#60A5FA'; stBg = '#1E3A8A'; }
                          else if (st.includes('NRA')) { stColor = '#C084FC'; stBg = '#581C87'; }

                          const devNames = Array.isArray(prj.devAssignees) 
                            ? prj.devAssignees.map(d => d.name || d.initials || 'Dev').join(', ')
                            : (prj.devAssignee || 'Unassigned');

                          return `
                <tr>
                  <td><span class="kcode-badge">${prj.projectCode || prj.id || 'PRJ'}</span></td>
                  <td>
                    <strong style="color: #F8FAFC; font-size: 0.88rem;">${prj.title || 'Untitled Project'}</strong>
                    ${prj.notes ? `<div style="color: #94A3B8; font-size: 0.74rem; margin-top: 2px;">${prj.notes}</div>` : ''}
                  </td>
                  <td><span class="role-badge" style="background: #1E293B; color: #E2E8F0; border: 1px solid #475569;">${prj.category || 'Web App'}</span></td>
                  <td><span class="role-badge" style="background: #0C4A6E; color: #38BDF8; border: 1px solid #0284C7;">${prj.serviceLine || prj.service || 'Frontend'}</span></td>
                  <td><strong style="color: #F8FAFC;">${prj.clientName || prj.client_name || 'Direct Client'}</strong></td>
                  <td><span style="color: #34D399; font-weight: 700;">${prj.fiverrProfile || prj.fiverr_profile || 'Kodevio'}</span></td>
                  <td><span style="color: #A5B4FC; font-size: 0.78rem;">${prj.milestone || 'Single Milestone'}</span></td>
                  <td>
                    <div style="font-size: 0.78rem; color: #CBD5E1;">${prj.startDate || '-'} &rarr; ${prj.deadlineDate || prj.deliveryDate || '-'}</div>
                  </td>
                  <td>
                    <div><strong style="color: #10B981;">$${earned.toLocaleString()}</strong> <span style="color: #94A3B8; font-size: 0.75rem;">/ $${total.toLocaleString()}</span></div>
                  </td>
                  <td><span style="color: #C084FC; font-weight: 600;">${prj.salesHandler?.name || prj.salesPerson || '-'}</span></td>
                  <td><span style="color: #34D399; font-weight: 600;">${prj.opsHandler?.name || prj.projectManager || '-'}</span></td>
                  <td><span style="color: #60A5FA; font-size: 0.78rem;">${devNames}</span></td>
                  <td><span class="role-badge" style="background: ${stBg}; color: ${stColor}; font-weight: 800;">${st}</span></td>
                  <td><span class="role-badge" style="background: #1E1B4B; color: #C7D2FE;">${prj.priority || 'MEDIUM'}</span></td>
                  <td><span style="font-size: 0.75rem; color: #94A3B8;">${new Date(prj.updatedAt || prj.created_at || Date.now()).toLocaleString()}</span></td>
                </tr>
              `;
                        }
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📊 Sales Monthly Performance Table (${salesMonthlyList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Rep ID</th>
                <th>Sales Representative</th>
                <th>Role &amp; Grade</th>
                <th>Achieved Revenue</th>
                <th>Target Quota</th>
                <th>Attainment %</th>
                <th>Bonus Payout</th>
                <th>Quotes Sent</th>
                <th>Total Quote Value</th>
                <th>Best Quote</th>
              </tr>
            </thead>
            <tbody>
              ${
                salesMonthlyList.length === 0
                  ? '<tr><td colspan="11">No sales monthly performance records found.</td></tr>'
                  : salesMonthlyList
                      .map((s) => {
                        const ach = Number(s.achieved) || 0;
                        const tgt = Number(s.target) || 0;
                        const pct = tgt > 0 ? Math.round((ach / tgt) * 100) : 0;
                        return `
                <tr>
                  <td><span class="role-badge" style="background: #451A03; color: #FDE68A; border: 1px solid #78350F;">${s.month} ${s.year}</span></td>
                  <td><span class="kcode-badge">${s.userId || s.id || 'REP'}</span></td>
                  <td><strong style="color: #F8FAFC;">${s.name}</strong> ${s.isRank1 ? '👑' : ''}</td>
                  <td><span style="color: #94A3B8;">${s.role || 'Sales Rep'} (${s.grade || 'Grade-1'})</span></td>
                  <td><strong style="color: #10B981; font-size: 0.92rem;">$${ach.toLocaleString()}</strong></td>
                  <td><span style="color: #CBD5E1;">$${tgt.toLocaleString()}</span></td>
                  <td><strong style="color: ${pct >= 75 ? '#34D399' : pct >= 25 ? '#FBBF24' : '#F87171'};">${pct}%</strong></td>
                  <td><span class="role-badge" style="background: #78350F; color: #FEF3C7;">${s.bonus || '—'}</span></td>
                  <td><strong style="color: #818CF8;">${s.quotesCount || 0}</strong></td>
                  <td><strong style="color: #C084FC;">$${(Number(s.totalQuoteValue) || 0).toLocaleString()}</strong></td>
                  <td><span style="color: #38BDF8;">$${(Number(s.bestQuote) || 0).toLocaleString()} <span style="font-size: 0.7rem; color: #64748B;">(${s.bestQuoteClient || '—'})</span></span></td>
                </tr>
              `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>⚙️ Operations Monthly Performance Table (${opsMonthlyList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Member ID</th>
                <th>Operations Member</th>
                <th>Role &amp; Level</th>
                <th>Achieved Output</th>
                <th>Target Quota</th>
                <th>Progress %</th>
                <th>Bonus Incentive</th>
                <th>Delivered Jobs</th>
                <th>Top Project Output</th>
              </tr>
            </thead>
            <tbody>
              ${
                opsMonthlyList.length === 0
                  ? '<tr><td colspan="10">No operations monthly performance records found.</td></tr>'
                  : opsMonthlyList
                      .map((o) => {
                        const ach = Number(o.achieved) || 0;
                        const tgt = Number(o.target) || 0;
                        const pct = tgt > 0 ? Math.round((ach / tgt) * 100) : ach > 0 ? 100 : 0;
                        return `
                <tr>
                  <td><span class="role-badge" style="background: #1E1B4B; color: #C7D2FE; border: 1px solid #3730A3;">${o.month} ${o.year}</span></td>
                  <td><span class="kcode-badge">${o.userId || o.id || 'OPS'}</span></td>
                  <td><strong style="color: #F8FAFC;">${o.name}</strong> ${o.isTopOps ? '👑' : ''}</td>
                  <td><span style="color: #94A3B8;">${o.role || 'Operations'} (${o.level || 'LVL 0'})</span></td>
                  <td><strong style="color: #10B981; font-size: 0.92rem;">$${ach.toLocaleString(undefined, { minimumFractionDigits: ach % 1 !== 0 ? 1 : 0 })}</strong></td>
                  <td><span style="color: #CBD5E1;">$${tgt.toLocaleString()}</span></td>
                  <td><strong style="color: ${pct >= 75 ? '#34D399' : pct >= 40 ? '#FBBF24' : pct > 0 ? '#F87171' : '#64748B'};">${pct}%</strong></td>
                  <td><span class="role-badge" style="background: #78350F; color: #FEF3C7;">${o.bonus || '—'}</span></td>
                  <td><strong style="color: #818CF8;">${o.deliveredJobs || 0} Jobs</strong></td>
                  <td><span style="color: #38BDF8;">$${(Number(o.topProjectVal) || 0).toLocaleString()} <span style="font-size: 0.7rem; color: #64748B;">(${o.topProjectName || '—'})</span></span></td>
                </tr>
              `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📄 Fiverr Briefs Table (${briefsList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Buyer</th>
                <th>Title</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                briefsList.length === 0
                  ? '<tr><td colspan="5">No buyer briefs in database.</td></tr>'
                  : briefsList
                      .map(
                        (b) => `
                <tr>
                  <td><code>${b.id}</code></td>
                  <td>${b.buyer_name}</td>
                  <td>${b.title}</td>
                  <td>$${b.budget}</td>
                  <td>${b.status}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📦 Active Orders Table (${ordersList.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Brief ID</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                ordersList.length === 0
                  ? '<tr><td colspan="4">No active orders in database.</td></tr>'
                  : ordersList
                      .map(
                        (o) => `
                <tr>
                  <td><code>${o.id}</code></td>
                  <td><code>${o.brief_id}</code></td>
                  <td>$${o.amount}</td>
                  <td>${o.status}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send(`Database inspection failed: ${error.message}`);
  }
});

// Start Express Server
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 Kodevio Agency OS Backend active at http://localhost:${PORT}`);
  });
}

startServer();
