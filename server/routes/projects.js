import express from 'express';
import { loadProjectsFromDisk, saveProjectsToDisk, recalculateClientMetrics, syncUsersToPerformance } from '../db.js';

const router = express.Router();

// Helper to get initial projects
function getInitialProjects() {
  const disk = loadProjectsFromDisk();
  if (disk && Array.isArray(disk) && disk.length > 0) {
    return disk;
  }
  return [];
}

// In-memory fallback / cache synchronized with disk
let memoryProjects = getInitialProjects();

// GET /api/projects - List all projects
router.get('/', (req, res) => {
  try {
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
router.post('/', (req, res) => {
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
      id: `PRJ-${nextIdNum}`,
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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const disk = loadProjectsFromDisk() || memoryProjects;
    const idx = disk.findIndex(p => p.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const current = disk[idx];
    const updated = {
      ...current,
      ...req.body,
      id: current.id, // prevent ID change
      updatedAt: new Date().toISOString(),
    };

    disk[idx] = updated;
    memoryProjects = disk;
    saveProjectsToDisk(disk);

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
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const disk = loadProjectsFromDisk() || memoryProjects;
    const target = disk.find(p => p.id === id);
    const filtered = disk.filter(p => p.id !== id);

    if (filtered.length === disk.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    memoryProjects = filtered;
    saveProjectsToDisk(filtered);

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
router.post('/bulk-delete', (req, res) => {
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
