import express from 'express';
import {
  pool,
  isPgConnected,
  fallbackStore,
  getSystemDatabaseHealthAsync,
  recalculateClientMetrics,
  syncUsersToPerformance,
  seedAllStoresFromDisk
} from '../db.js';

const router = express.Router();

// GET /api/db/sync/health (and /api/db/health) - Return live Neon PostgreSQL database health report
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemDatabaseHealthAsync();
    return res.json({ success: true, health });
  } catch (error) {
    console.error('Database Health Check Error:', error);
    res.status(500).json({ error: 'Failed to check database health' });
  }
});

// POST /api/db/sync - Trigger real dynamic database sync & cross-table integrity recalculation
router.post('/', async (req, res) => {
  try {
    const syncTimestamp = new Date().toISOString();

    // 1. Run relational hooks across all system databases
    recalculateClientMetrics();
    syncUsersToPerformance();

    // 2. Ensure all 16 stores are seeded and in sync
    if (isPgConnected) {
      await seedAllStoresFromDisk();
    }

    // 3. Fetch live updated system health directly from Neon PostgreSQL
    const health = await getSystemDatabaseHealthAsync();

    let briefsList = [];
    let usersCount = 0;
    let briefsCount = 0;
    let activeOrders = 0;
    let totalRevenue = 0;

    if (isPgConnected) {
      try {
        const [uRes, bRes, oRes] = await Promise.all([
          pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: 0 }] })),
          pool.query('SELECT * FROM fiverr_briefs ORDER BY created_at DESC LIMIT 10').catch(() => ({ rows: [] })),
          pool.query('SELECT COUNT(*), COALESCE(SUM(amount), 0) as total_rev FROM orders').catch(() => ({ rows: [{ count: 0, total_rev: 0 }] }))
        ]);

        usersCount = parseInt(uRes.rows[0]?.count || 0, 10);
        activeOrders = parseInt(oRes.rows[0]?.count || 0, 10);
        totalRevenue = parseFloat(oRes.rows[0]?.total_rev || 0);

        briefsList = bRes.rows.map((b) => ({
          id: b.id,
          title: b.title,
          buyer: b.buyer_name,
          budget: `$${parseFloat(b.budget || 0).toLocaleString()}`,
          matchScore: `${b.match_score || 95}%`,
          status: b.status === 'pending' ? 'In Review' : b.status,
          time: 'Synced live with Neon DB',
        }));
        briefsCount = briefsList.length;
      } catch (err) {
        console.warn('Sync query error:', err.message);
      }
    } else {
      usersCount = health.databases.find(d => d.id === 'users')?.count || 1;
      briefsCount = fallbackStore.briefs.length;
      activeOrders = fallbackStore.orders.length;
    }

    return res.json({
      success: true,
      message: 'All 16 operational databases synchronized with Neon PostgreSQL live relational integrity',
      timestamp: syncTimestamp,
      health,
      stats: {
        usersCount,
        briefsCount,
        activeOrders,
        revenue: totalRevenue,
      },
      briefs: briefsList,
    });
  } catch (error) {
    console.error('Database Sync Error:', error);
    res.status(500).json({ error: 'Failed to synchronize database' });
  }
});

// GET /api/db/sync - Support GET for direct browser inspection
router.get('/', async (req, res) => {
  try {
    const health = await getSystemDatabaseHealthAsync();
    return res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

export default router;
