import express from 'express';
import bcrypt from 'bcryptjs';
import { pool, isPgConnected, fallbackStore, saveProfilesToDisk, loadProfilesFromDisk } from '../db.js';

const router = express.Router();

// GET /api/profile/me - Fetch authenticated user profile details
router.get('/me', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'admin@kodevio.com';

    if (isPgConnected) {
      const userRes = await pool.query('SELECT id, user_code, email, full_name, role FROM users WHERE email = $1', [userEmail]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userRes.rows[0];
      const profRes = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
      const profile = profRes.rows[0] || {};

      return res.json({
        user: {
          id: user.id,
          user_code: user.user_code || 'K001',
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        profile: {
          user_code: user.user_code || 'K001',
          first_name: profile.first_name !== undefined ? profile.first_name : (user.full_name ? user.full_name.split(' ')[0] : 'Super'),
          last_name: profile.last_name !== undefined ? profile.last_name : (user.full_name && user.full_name.split(' ').length > 1 ? user.full_name.split(' ').slice(1).join(' ') : 'Admin'),
          avatar_url: profile.avatar_url || '',
          phone: profile.phone || '',
          language: profile.language || 'English',
          facebook: profile.facebook || '',
          linkedin: profile.linkedin || '',
          github: profile.github || '',
          department: profile.department || '',
          designation: profile.designation || '',
          joined_date: profile.joined_date || '',
          base_salary: profile.base_salary || '',
          bonus_balance: profile.bonus_balance || '',
          employment_status: profile.employment_status || 'ACTIVE',
        },
      });
    } else {
      let user = fallbackStore.users.find((u) => u.email === userEmail);
      if (!user) {
        user = fallbackStore.users[0];
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let profile = fallbackStore.profiles[user.id];
      if (!profile) {
        profile = {
          user_id: user.id,
          user_code: user.user_code || user.id || 'K001',
          first_name: user.full_name ? user.full_name.split(' ')[0] : 'Super',
          last_name: user.full_name && user.full_name.split(' ').length > 1 ? user.full_name.split(' ').slice(1).join(' ') : 'Admin',
          avatar_url: '',
          phone: '+1(000) 000-0000',
          language: 'English',
          facebook: 'facebook.com/kodevio',
          linkedin: 'linkedin.com/in/kodevio',
          github: 'github.com/username',
        };
        fallbackStore.profiles[user.id] = profile;
      }

      return res.json({
        user: {
          id: user.id,
          user_code: user.user_code || user.id || 'K001',
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        profile: {
          ...profile,
          user_code: user.user_code || user.id || 'K001',
          department: profile.department || '',
          designation: profile.designation || '',
          joined_date: profile.joined_date || '',
          base_salary: profile.base_salary || '',
          bonus_balance: profile.bonus_balance || '',
          employment_status: profile.employment_status || 'ACTIVE',
        },
      });
    }
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/profile/me - Update authenticated user profile details
router.put('/me', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'admin@kodevio.com';
    const {
      first_name,
      last_name,
      email,
      phone,
      language,
      facebook,
      linkedin,
      github,
      avatar_url,
      new_password,
      department,
      designation,
      joined_date,
      base_salary,
      bonus_balance,
      employment_status,
    } = req.body;

    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Super Admin';
    const updatedEmail = email || userEmail;

    if (isPgConnected) {
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userRes.rows[0];

      // Update Users table details
      if (new_password) {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(
          'UPDATE users SET email = $1, full_name = $2, password_hash = $3 WHERE id = $4',
          [updatedEmail, fullName, hashedPassword, user.id]
        );
      } else {
        await pool.query(
          'UPDATE users SET email = $1, full_name = $2 WHERE id = $3',
          [updatedEmail, fullName, user.id]
        );
      }

      // Upsert User Profile in PostgreSQL
      await pool.query(
        `INSERT INTO user_profiles (
          user_id, first_name, last_name, phone, language, facebook, linkedin, github, avatar_url,
          department, designation, joined_date, base_salary, bonus_balance, employment_status, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          language = EXCLUDED.language,
          facebook = EXCLUDED.facebook,
          linkedin = EXCLUDED.linkedin,
          github = EXCLUDED.github,
          avatar_url = EXCLUDED.avatar_url,
          department = EXCLUDED.department,
          designation = EXCLUDED.designation,
          joined_date = EXCLUDED.joined_date,
          base_salary = EXCLUDED.base_salary,
          bonus_balance = EXCLUDED.bonus_balance,
          employment_status = EXCLUDED.employment_status,
          updated_at = CURRENT_TIMESTAMP`,
        [
          user.id,
          first_name,
          last_name,
          phone,
          language,
          facebook,
          linkedin,
          github,
          avatar_url || '',
          department || '',
          designation || '',
          joined_date || '',
          base_salary || '',
          bonus_balance || '',
          employment_status || 'ACTIVE',
        ]
      );

      saveProfilesToDisk({
        [user.id]: {
          user_id: user.id,
          user_code: user.user_code || 'K001',
          first_name,
          last_name,
          phone,
          language,
          facebook,
          linkedin,
          github,
          avatar_url: avatar_url || '',
          department: department || '',
          designation: designation || '',
          joined_date: joined_date || '',
          base_salary: base_salary || '',
          bonus_balance: bonus_balance || '',
          employment_status: employment_status || 'ACTIVE',
        }
      });

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          user_code: user.user_code || 'K001',
          email: updatedEmail,
          full_name: fullName,
          role: user.role,
          avatar_url: avatar_url || '',
        },
        profile: {
          user_code: user.user_code || 'K001',
          first_name,
          last_name,
          phone,
          language,
          facebook,
          linkedin,
          github,
          avatar_url: avatar_url || '',
          department: department || '',
          designation: designation || '',
          joined_date: joined_date || '',
          base_salary: base_salary || '',
          bonus_balance: bonus_balance || '',
          employment_status: employment_status || 'ACTIVE',
        },
      });
    } else {
      let user = fallbackStore.users.find((u) => u.email === userEmail);
      if (!user) {
        user = fallbackStore.users[0];
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.email = updatedEmail;
      user.full_name = fullName;
      if (new_password) {
        user.password_hash = await bcrypt.hash(new_password, 10);
      }

      const updatedProfile = {
        user_id: user.id,
        user_code: user.user_code || user.id || 'K001',
        first_name: first_name !== undefined ? first_name : 'Super',
        last_name: last_name !== undefined ? last_name : 'Admin',
        phone: phone !== undefined ? phone : '',
        language: language !== undefined ? language : 'English',
        facebook: facebook !== undefined ? facebook : '',
        linkedin: linkedin !== undefined ? linkedin : '',
        github: github !== undefined ? github : '',
        avatar_url: avatar_url !== undefined ? avatar_url : '',
        department: department !== undefined ? department : '',
        designation: designation !== undefined ? designation : '',
        joined_date: joined_date !== undefined ? joined_date : '',
        base_salary: base_salary !== undefined ? base_salary : '',
        bonus_balance: bonus_balance !== undefined ? bonus_balance : '',
        employment_status: employment_status !== undefined ? employment_status : 'ACTIVE',
        updated_at: new Date().toISOString(),
      };

      fallbackStore.profiles[user.id] = updatedProfile;
      saveProfilesToDisk(fallbackStore.profiles);

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          user_code: user.user_code || user.id || 'K001',
          email: updatedEmail,
          full_name: fullName,
          role: user.role,
          avatar_url: updatedProfile.avatar_url,
        },
        profile: updatedProfile,
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
