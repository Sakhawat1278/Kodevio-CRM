import express from 'express';
import bcrypt from 'bcryptjs';
import { pool, isPgConnected, fallbackStore, formatUserCode } from '../db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (isPgConnected) {
      const userRes = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = userRes.rows[0];
      let isMatch = false;
      if (user.password_hash) {
        if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, user.password_hash);
        } else {
          isMatch = password === user.password_hash;
        }
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const profRes = await pool.query('SELECT avatar_url FROM user_profiles WHERE user_id = $1', [user.id]);
      const avatar_url = profRes.rows.length > 0 ? profRes.rows[0].avatar_url : '';

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          user_code: user.user_code || 'K001',
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url,
        },
      });
    } else {
      const user = fallbackStore.users.find((u) => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const prof = fallbackStore.profiles[user.id] || {};

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          user_code: user.user_code || user.id || 'K001',
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: prof.avatar_url || '',
        },
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isPgConnected) {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const countRes = await pool.query('SELECT COUNT(*) FROM users');
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      const userCode = formatUserCode(nextNum);

      const userRes = await pool.query(
        'INSERT INTO users (user_code, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_code, email, full_name, role',
        [userCode, email, hashedPassword, full_name, role || 'agency_admin']
      );

      const newUser = userRes.rows[0];

      // Create empty user profile record
      await pool.query(
        'INSERT INTO user_profiles (user_id, first_name, last_name, avatar_url) VALUES ($1, $2, $3, $4)',
        [
          newUser.id,
          full_name.split(' ')[0],
          full_name.split(' ').slice(1).join(' ') || '',
          '',
        ]
      );

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser.id,
          user_code: newUser.user_code,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
        },
      });
    } else {
      const existing = fallbackStore.users.find((u) => u.email === email);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const nextNum = fallbackStore.users.length + 1;
      const userCode = formatUserCode(nextNum);

      const newUser = {
        id: userCode,
        user_code: userCode,
        email,
        password_hash: hashedPassword,
        full_name,
        role: role || 'agency_admin',
        created_at: new Date().toISOString(),
      };

      fallbackStore.users.push(newUser);
      fallbackStore.profiles[userCode] = {
        user_id: userCode,
        user_code: userCode,
        first_name: full_name.split(' ')[0],
        last_name: full_name.split(' ').slice(1).join(' ') || '',
        phone: '',
        language: 'English',
        facebook: '',
        linkedin: '',
        github: '',
        avatar_url: '',
        updated_at: new Date().toISOString(),
      };

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser.id,
          user_code: newUser.user_code,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
        },
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server registration error' });
  }
});

export default router;
