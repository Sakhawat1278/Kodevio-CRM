import { pool, isPgConnected, fallbackStore } from './db.js';

async function viewDatabase() {
  console.log('\n======================================================');
  console.log('   🔍 KODEVIO LIMITED AGENCY OS - DATABASE INSPECTOR   ');
  console.log('======================================================\n');

  if (isPgConnected) {
    try {
      console.log('⚡ Active Engine: PostgreSQL (localhost:5432/kodevio_agency_os)\n');

      const users = await pool.query('SELECT id, email, full_name, role, created_at FROM users;');
      console.log('--- 👤 USERS TABLE ---');
      console.table(users.rows);

      const briefs = await pool.query('SELECT * FROM fiverr_briefs;');
      console.log('\n--- 📋 FIVERR BRIEFS TABLE ---');
      console.table(briefs.rows);

      const orders = await pool.query('SELECT * FROM orders;');
      console.log('\n--- 📦 ORDERS TABLE ---');
      console.table(orders.rows);
    } catch (err) {
      console.error('Database query error:', err.message);
    } finally {
      await pool.end();
    }
  } else {
    console.log('⚡ Active Engine: Dynamic Local Store (Memory/File Mode)\n');

    console.log('--- 👤 USERS TABLE ---');
    console.table(fallbackStore.users);

    console.log('\n--- 📋 FIVERR BRIEFS TABLE ---');
    console.table(fallbackStore.briefs);

    console.log('\n--- 📦 ORDERS TABLE ---');
    console.table(fallbackStore.orders);
  }

  console.log('\n======================================================\n');
}

viewDatabase();
