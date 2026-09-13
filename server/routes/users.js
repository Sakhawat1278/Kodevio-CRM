import express from 'express';
import bcrypt from 'bcryptjs';
import { pool, isPgConnected, fallbackStore, loadUsersFromDisk, saveUsersToDisk, syncUsersToPerformance } from '../db.js';

const router = express.Router();

// GET /api/users - Fetch all organization users
router.get('/', async (req, res) => {
  try {
    const diskUsers = loadUsersFromDisk();
    if (diskUsers && diskUsers.length > 0) {
      return res.json({ users: diskUsers });
    }

    if (isPgConnected) {
      const result = await pool.query(`
        SELECT u.id, u.user_code as "userCode", u.email, u.full_name as "name", u.role,
               up.phone, up.department, up.designation, up.avatar_url as "avatar",
               up.joined_date as "joinDate", up.base_salary as "monthlySalary",
               up.employment_status as "status", up.linkedin as "linkedinUrl", up.github as "githubUrl"
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        ORDER BY u.created_at ASC
      `);
      return res.json({ users: result.rows });
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
    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.map(u => u.id === id ? { ...u, ...req.body, id } : u);
    saveUsersToDisk(updatedUsers);

    // Sync user with performance rosters
    syncUsersToPerformance();

    const updated = updatedUsers.find(u => u.id === id);
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
    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.filter(u => u.id !== id);
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

    const currentUsers = loadUsersFromDisk() || [];
    const updatedUsers = currentUsers.filter(u => !ids.includes(u.id));
    saveUsersToDisk(updatedUsers);

    syncUsersToPerformance();

    return res.json({ message: `${ids.length} users deleted successfully`, deletedIds: ids });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
});

export default router;
