import express from 'express';
import {
  pool,
  isPgConnected,
  loadProjectsFromDisk,
  saveProjectsToDisk,
  recalculateClientMetrics,
  syncUsersToPerformance
} from '../db.js';

const router = express.Router();

function mapProjectRow(r) {
  return {
    id: r.id,
    projectCode: r.project_code,
    title: r.title,
    category: r.category,
    service: r.service,
    clientName: r.client_name,
    clientUsername: r.client_username,
    fiverrProfile: r.fiverr_profile,
    milestone: r.milestone,
    status: r.status,
    priority: r.priority,
    startDate: r.start_date,
    deadlineDate: r.deadline_date,
    earnedAmount: Number(r.earned_amount) || 0,
    totalAmount: Number(r.total_amount) || 0,
    salesHandler: typeof r.sales_handler === 'string' ? JSON.parse(r.sales_handler) : (r.sales_handler || {}),
    opsHandler: typeof r.ops_handler === 'string' ? JSON.parse(r.ops_handler) : (r.ops_handler || {}),
    devAssignees: typeof r.dev_assignees === 'string' ? JSON.parse(r.dev_assignees) : (r.dev_assignees || []),
    postDeliveryIssue: r.post_delivery_issue || 'NONE',
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Helper to get initial projects
function getInitialProjects() {
  const disk = loadProjectsFromDisk();
  if (disk && Array.isArray(disk) && disk.length > 0) {
    return disk;
  }
  return [];
}

let memoryProjects = getInitialProjects();

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    if (isPgConnected) {
      try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        if (result.rows.length > 0) {
          const liveProjects = result.rows.map(mapProjectRow);
          memoryProjects = liveProjects;
          saveProjectsToDisk(liveProjects);
          return res.json({
            success: true,
            projects: liveProjects,
            total: liveProjects.length,
          });
        }
      } catch (pgErr) {
        console.warn('PG fetch projects error, falling back to disk:', pgErr.message);
      }
    }

    const disk = loadProjectsFromDisk();
    if (disk && Array.isArray(disk)) {
      memoryProjects = disk;
    }
    return res.json({
      success: true,
      projects: memoryProjects,
      total: memoryProjects.length,
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create new project with cross-table relational sync
router.post('/', async (req, res) => {
  try {
    const {
      title,
      projectCode,
      category,
      service,
      clientName,
      clientUsername,
      fiverrProfile,
      milestone,
      status,
      priority,
      startDate,
      deadlineDate,
      earnedAmount,
      totalAmount,
      salesHandler,
      opsHandler,
      devAssignees,
      postDeliveryIssue,
      notes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const nextIdNum = memoryProjects.length > 0 
      ? Math.max(...memoryProjects.map(p => {
          const num = parseInt(String(p.id).replace('PRJ-', ''), 10);
          return isNaN(num) ? 100 : num;
        })) + 1
      : 101;

    const newProject = {
      id: req.body.id || `PRJ-${nextIdNum}`,
      projectCode: projectCode || `${(category || 'APP').toUpperCase()} - ${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: title.trim().toUpperCase(),
      category: (category || 'APP').toUpperCase(),
      service: (service || 'FRONTEND').toUpperCase(),
      clientName: clientName || 'UNKNOWN',
      clientUsername: clientUsername || (clientName ? clientName.toLowerCase().replace(/\s+/g, '') : 'client'),
      fiverrProfile: (fiverrProfile || 'APP_CIVIC').toUpperCase(),
      milestone: (milestone || 'SINGLE').toUpperCase(),
      status: (status || 'WIP').toUpperCase(),
      priority: (priority || 'MEDIUM').toUpperCase(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      deadlineDate: deadlineDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      earnedAmount: Number(earnedAmount) || 0,
      totalAmount: Number(totalAmount) || (Number(earnedAmount) ? Number(earnedAmount) * 1.25 : 250),
      salesHandler: salesHandler || { name: 'SHUVO', initials: 'SA', color: '#A855F7' },
      opsHandler: opsHandler || { name: 'SHAMS', initials: 'SR', color: '#10B981' },
      devAssignees: Array.isArray(devAssignees) && devAssignees.length > 0
        ? devAssignees
        : [{ name: 'MIR', initials: 'MT', color: '#3B82F6' }],
      postDeliveryIssue: postDeliveryIssue || 'NONE',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    memoryProjects.unshift(newProject);
    saveProjectsToDisk(memoryProjects);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO projects (
            id, project_code, title, category, service, client_name, client_username, fiverr_profile,
            milestone, status, priority, start_date, deadline_date, earned_amount, total_amount,
            sales_handler, ops_handler, dev_assignees, post_delivery_issue, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO UPDATE SET
            project_code = EXCLUDED.project_code,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            service = EXCLUDED.service,
            client_name = EXCLUDED.client_name,
            client_username = EXCLUDED.client_username,
            fiverr_profile = EXCLUDED.fiverr_profile,
            milestone = EXCLUDED.milestone,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority,
            start_date = EXCLUDED.start_date,
            deadline_date = EXCLUDED.deadline_date,
            earned_amount = EXCLUDED.earned_amount,
            total_amount = EXCLUDED.total_amount,
            sales_handler = EXCLUDED.sales_handler,
            ops_handler = EXCLUDED.ops_handler,
            dev_assignees = EXCLUDED.dev_assignees,
            post_delivery_issue = EXCLUDED.post_delivery_issue,
            notes = EXCLUDED.notes,
            updated_at = NOW()`,
          [
            newProject.id,
            newProject.projectCode,
            newProject.title,
            newProject.category,
            newProject.service,
            newProject.clientName,
            newProject.clientUsername,
            newProject.fiverrProfile,
            newProject.milestone,
            newProject.status,
            newProject.priority,
            newProject.startDate,
            newProject.deadlineDate,
            newProject.earnedAmount,
            newProject.totalAmount,
            JSON.stringify(newProject.salesHandler),
            JSON.stringify(newProject.opsHandler),
            JSON.stringify(newProject.devAssignees),
            newProject.postDeliveryIssue,
            newProject.notes,
            newProject.createdAt,
            newProject.createdAt,
          ]
        );
      } catch (pgErr) {
        console.warn('PG insert project error:', pgErr.message);
      }
    }

    // Dynamic Relational Live Sync: Recalculate client spent & orders and sync rosters
    recalculateClientMetrics(newProject.clientName || newProject.clientUsername);
    syncUsersToPerformance();

    return res.status(201).json({
      success: true,
      project: newProject,
    });
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project with cross-table relational sync
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disk = loadProjectsFromDisk() || memoryProjects;
    const idx = disk.findIndex(p => p.id === id);

    const current = idx !== -1 ? disk[idx] : { id };
    const updated = {
      ...current,
      ...req.body,
      id, // prevent ID change
      updatedAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      disk[idx] = updated;
    } else {
      disk.unshift(updated);
    }
    memoryProjects = disk;
    saveProjectsToDisk(disk);

    if (isPgConnected) {
      try {
        await pool.query(
          `UPDATE projects SET
            project_code = COALESCE($2, project_code),
            title = COALESCE($3, title),
            category = COALESCE($4, category),
            service = COALESCE($5, service),
            client_name = COALESCE($6, client_name),
            client_username = COALESCE($7, client_username),
            fiverr_profile = COALESCE($8, fiverr_profile),
            milestone = COALESCE($9, milestone),
            status = COALESCE($10, status),
            priority = COALESCE($11, priority),
            start_date = COALESCE($12, start_date),
            deadline_date = COALESCE($13, deadline_date),
            earned_amount = COALESCE($14, earned_amount),
            total_amount = COALESCE($15, total_amount),
            sales_handler = COALESCE($16, sales_handler),
            ops_handler = COALESCE($17, ops_handler),
            dev_assignees = COALESCE($18, dev_assignees),
            post_delivery_issue = COALESCE($19, post_delivery_issue),
            notes = COALESCE($20, notes),
            updated_at = NOW()
          WHERE id = $1`,
          [
            id,
            updated.projectCode,
            updated.title,
            updated.category,
            updated.service,
            updated.clientName,
            updated.clientUsername,
            updated.fiverrProfile,
            updated.milestone,
            updated.status,
            updated.priority,
            updated.startDate || null,
            updated.deadlineDate || null,
            updated.earnedAmount,
            updated.totalAmount,
            updated.salesHandler ? JSON.stringify(updated.salesHandler) : null,
            updated.opsHandler ? JSON.stringify(updated.opsHandler) : null,
            updated.devAssignees ? JSON.stringify(updated.devAssignees) : null,
            updated.postDeliveryIssue,
            updated.notes,
          ]
        );
      } catch (pgErr) {
        console.warn('PG update project error:', pgErr.message);
      }
    }

    // Dynamic Relational Live Sync: Update client metrics and performance rosters
    recalculateClientMetrics(updated.clientName || updated.clientUsername);
    syncUsersToPerformance();

    return res.json({
      success: true,
      project: updated,
    });
  } catch (err) {
    console.error('Error updating project:', err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete single project with cross-table relational sync
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disk = loadProjectsFromDisk() || memoryProjects;
    const target = disk.find(p => p.id === id);
    const filtered = disk.filter(p => p.id !== id);

    memoryProjects = filtered;
    saveProjectsToDisk(filtered);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      } catch (pgErr) {
        console.warn('PG delete project error:', pgErr.message);
      }
    }

    if (target) {
      recalculateClientMetrics(target.clientName || target.clientUsername);
    }
    syncUsersToPerformance();

    return res.json({
      success: true,
      message: 'Project deleted successfully',
      id,
    });
  } catch (err) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/bulk-delete - Delete multiple projects
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No project IDs provided' });
    }

    const disk = loadProjectsFromDisk() || memoryProjects;
    const idSet = new Set(ids);
    const filtered = disk.filter(p => !idSet.has(p.id));

    memoryProjects = filtered;
    saveProjectsToDisk(filtered);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM projects WHERE id = ANY($1)', [ids]);
      } catch (pgErr) {
        console.warn('PG bulk delete projects error:', pgErr.message);
      }
    }

    recalculateClientMetrics();
    syncUsersToPerformance();

    return res.json({
      success: true,
      deletedCount: disk.length - filtered.length,
    });
  } catch (err) {
    console.error('Error bulk deleting projects:', err);
    return res.status(500).json({ error: 'Failed to bulk delete projects' });
  }
});

export default router;
