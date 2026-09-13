import express from 'express';
import { pool, isPgConnected, fallbackStore, loadFiverrProfilesFromDisk, saveFiverrProfilesToDisk } from '../db.js';

const router = express.Router();

// Helper to get initial profiles
function getDiskProfiles() {
  const disk = loadFiverrProfilesFromDisk();
  if (disk && Array.isArray(disk) && disk.length > 0) {
    return disk;
  }
  return fallbackStore.fiverrProfiles || [];
}

// GET /api/fiverr-profiles - List all seller profiles
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM fiverr_seller_profiles ORDER BY created_at DESC');
        if (result.rows.length > 0) {
          const profiles = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            username: row.username,
            level: row.level,
            badgeClass: row.badge_class,
            niche: row.niche,
            avatar: row.avatar_url,
            profileUrl: row.profile_url,
            status: row.status || 'ACTIVE',
            created_at: row.created_at,
          }));
          saveFiverrProfilesToDisk(profiles);
          return res.json({ success: true, profiles });
        }
      } catch (pgErr) {
        console.warn('PG fetch profiles error, falling back to disk:', pgErr.message);
      }
    }
    const diskProfiles = getDiskProfiles();
    return res.json({ success: true, profiles: diskProfiles });
  } catch (err) {
    console.error('Fetch Fiverr profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch Fiverr seller profiles', details: err.message });
  }
});

// POST /api/fiverr-profiles - Create a new seller profile
router.post('/', async (req, res) => {
  try {
    const { name, username, level, badgeClass, niche, avatar, profileUrl, status } = req.body;
    if (!name || !username) {
      return res.status(400).json({ error: 'Display Name and Fiverr Username are required' });
    }

    const cleanUsername = username.trim().replace('@', '');
    const finalProfileUrl = profileUrl || `https://www.fiverr.com/${cleanUsername}`;

    const created = {
      id: req.body.id || `fp-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      level: level || 'Level 2 Seller',
      badgeClass: badgeClass || 'badge-level-2',
      niche: niche || 'Web & App Development',
      avatar: avatar || null,
      profileUrl: finalProfileUrl,
      status: status || 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    const diskProfiles = getDiskProfiles();
    diskProfiles.unshift(created);
    saveFiverrProfilesToDisk(diskProfiles);

    if (isPgConnected) {
      try {
        const query = `
          INSERT INTO fiverr_seller_profiles (id, name, username, level, badge_class, niche, avatar_url, profile_url, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            username = EXCLUDED.username,
            level = EXCLUDED.level,
            badge_class = EXCLUDED.badge_class,
            niche = EXCLUDED.niche,
            avatar_url = EXCLUDED.avatar_url,
            profile_url = EXCLUDED.profile_url,
            status = EXCLUDED.status
        `;
        const values = [
          created.id,
          created.name,
          created.username,
          created.level,
          created.badgeClass,
          created.niche,
          created.avatar || '',
          created.profileUrl,
          created.status,
          created.created_at,
        ];
        await pool.query(query, values);
      } catch (e) {
        console.warn('PG insert fiverr profile error:', e.message);
      }
    }

    return res.json({ success: true, profile: created });
  } catch (err) {
    console.error('Create Fiverr profile error:', err);
    res.status(500).json({ error: 'Failed to create Fiverr seller profile', details: err.message });
  }
});

// DELETE /api/fiverr-profiles/:id - Delete a seller profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let diskProfiles = getDiskProfiles();
    diskProfiles = diskProfiles.filter((p) => p.id !== id);
    saveFiverrProfilesToDisk(diskProfiles);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM fiverr_seller_profiles WHERE id = $1', [id]);
      } catch (e) {
        console.warn('PG delete fiverr profile error:', e.message);
      }
    }
    return res.json({ success: true, message: 'Profile deleted' });
  } catch (err) {
    console.error('Delete Fiverr profile error:', err);
    res.status(500).json({ error: 'Failed to delete Fiverr seller profile', details: err.message });
  }
});

// PUT /api/fiverr-profiles/:id - Update a seller profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let diskProfiles = getDiskProfiles();
    const idx = diskProfiles.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    const existing = diskProfiles[idx];
    const updated = {
      ...existing,
      ...req.body,
      id,
    };
    diskProfiles[idx] = updated;
    saveFiverrProfilesToDisk(diskProfiles);

    if (isPgConnected) {
      try {
        const query = `
          UPDATE fiverr_seller_profiles
          SET name = COALESCE($1, name),
              username = COALESCE($2, username),
              level = COALESCE($3, level),
              badge_class = COALESCE($4, badge_class),
              niche = COALESCE($5, niche),
              avatar_url = COALESCE($6, avatar_url),
              profile_url = COALESCE($7, profile_url),
              status = COALESCE($8, status)
          WHERE id = $9
        `;
        const values = [updated.name, updated.username, updated.level, updated.badgeClass, updated.niche, updated.avatar, updated.profileUrl, updated.status, id];
        await pool.query(query, values);
      } catch (e) {
        console.warn('PG update fiverr profile error:', e.message);
      }
    }

    return res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Update Fiverr profile error:', err);
    res.status(500).json({ error: 'Failed to update Fiverr seller profile', details: err.message });
  }
});

export default router;

