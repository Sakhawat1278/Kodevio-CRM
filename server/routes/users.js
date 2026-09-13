import express from 'express';
import bcrypt from 'bcryptjs';
import { pool, isPgConnected, fallbackStore, loadUsersFromDisk, saveUsersToDisk, syncUsersToPerformance } from '../db.js';

const router = express.Router();

// GET /api/users - Fetch all organization users
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query(`
          SELECT u.id, u.user_code as "userCode", u.email, u.full_name as "name", u.role,
                 COALESCE(up.department, u.department, 'MANAGEMENT') as department,
                 COALESCE(up.designation, u.designation, 'Managing Director') as designation,
                 COALESCE(up.phone, u.phone, '') as phone,
                 COALESCE(up.employment_status, u.status, 'ACTIVE') as status,
                 u.allow_login as "allowLogin",
                 up.avatar_url as "avatar",
                 up.joined_date as "joinDate",
                 up.base_salary as "monthlySalary",
                 up.linkedin as "linkedinUrl",
                 up.github as "githubUrl"
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up.user_id
          ORDER BY u.created_at ASC
        `);
        if (result.rows.length > 0) {
          return res.json({ users: result.rows });
        }
      } catch (pgErr) {
        console.warn('PG fetch users error, falling back to disk:', pgErr.message);
      }
    }

    const diskUsers = loadUsersFromDisk();
    if (diskUsers && diskUsers.length > 0) {
      return res.json({ users: diskUsers });
    }

    return res.json({ users: fallbackStore.users || [] });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new organization user
router.post('/', async (req, res) => {
  try {
    const newUser = {
      ...req.body,
      id: req.body.id || `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (isPgConnected) {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password || '123456', 10);
        const userCode = req.body.userCode || `K${Math.floor(100 + Math.random() * 900)}`;
        const userRes = await pool.query(
          `INSERT INTO users (user_code, email, password_hash, full_name, role, department, designation, phone, status, allow_login)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            userCode, req.body.email || `${userCode.toLowerCase()}@kodevio.com`, hashedPassword,
            req.body.name || 'Staff Member', req.body.role || 'employee',
            req.body.department || 'OPERATIONS', req.body.designation || 'Specialist',
            req.body.phone || '', req.body.status || 'ACTIVE', req.body.allowLogin ?? true
          ]
        );

        if (userRes.rows.length > 0) {
          const pgUserId = userRes.rows[0].id;
          await pool.query(
            `INSERT INTO user_profiles (
              user_id, phone, department, designation, joined_date, base_salary, employment_status, avatar_url, linkedin, github
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id) DO NOTHING`,
            [
              pgUserId, req.body.phone || '', req.body.department || 'OPERATIONS', req.body.designation || 'Specialist',
              req.body.joinDate || new Date().toISOString().split('T')[0], req.body.monthlySalary || '0',
              req.body.status || 'ACTIVE', req.body.avatar || '', req.body.linkedinUrl || '', req.body.githubUrl || ''
            ]
          );
        }
      } catch (pgErr) {
        console.warn('PG create user error:', pgErr.message);
      }
    }

    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = [newUser, ...currentUsers.filter(u => u.id !== newUser.id)];
    saveUsersToDisk(updatedUsers);

    // Sync user with performance rosters
    syncUsersToPerformance();

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update existing user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE users SET
            full_name = COALESCE($1, full_name),
            email = COALESCE($2, email),
            role = COALESCE($3, role),
            department = COALESCE($4, department),
            designation = COALESCE($5, designation),
            phone = COALESCE($6, phone),
            status = COALESCE($7, status)
           WHERE id::text = $8 OR user_code = $8`,
          [
            req.body.name, req.body.email, req.body.role,
            req.body.department, req.body.designation, req.body.phone, req.body.status, id
          ]
        );
      } catch (pgErr) {
        console.warn('PG update user error:', pgErr.message);
      }
    }

    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.map(u => u.id === id || u.userCode === id ? { ...u, ...req.body, id } : u);
    saveUsersToDisk(updatedUsers);

    // Sync user with performance rosters
    syncUsersToPerformance();

    const updated = updatedUsers.find(u => u.id === id || u.userCode === id);
    return res.json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete single user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM users WHERE id::text = $1 OR user_code = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete user error:', pgErr.message);
      }
    }

    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.filter(u => u.id !== id && u.userCode !== id);
    saveUsersToDisk(updatedUsers);

    syncUsersToPerformance();

    return res.json({ message: 'User deleted successfully', id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/users/bulk-delete - Delete multiple users
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid user IDs array' });
    }

    if (isPgConnected) {
      try {
        for (const uid of ids) {
          await pool.query('DELETE FROM users WHERE id::text = $1 OR user_code = $1', [uid]);
        }
      } catch (pgErr) {
        console.warn('PG bulk delete error:', pgErr.message);
      }
    }

    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.filter(u => !ids.includes(u.id) && !ids.includes(u.userCode));
    saveUsersToDisk(updatedUsers);

    syncUsersToPerformance();

    return res.json({ message: `${ids.length} users deleted successfully`, deletedIds: ids });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
});

export default router;
