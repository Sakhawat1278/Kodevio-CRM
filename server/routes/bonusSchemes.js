import express from 'express';
import {
  loadBonusSchemesFromDisk,
  saveBonusSchemesToDisk,
  loadUsersFromDisk,
  saveUsersToDisk
} from '../db.js';

const router = express.Router();

// Helper to get fresh data
function getBonusSchemesData() {
  return loadBonusSchemesFromDisk() || { grades: [], employeePayouts: {} };
}

// GET /api/bonus-schemes - Get full schemes data (grades, levels, and live employee payouts)
router.get('/', (req, res) => {
  try {
    const data = getBonusSchemesData();
    const allUsers = loadUsersFromDisk() || [];
    
    // Ensure grades are always sorted by minSalary ascending
    data.grades.sort((a, b) => (a.minSalary || 0) - (b.minSalary || 0));

    // Filter only eligible departments: SALES and OPERATIONS
    const eligibleEmployees = allUsers.filter(u => 
      u.department === 'SALES' || u.department === 'OPERATIONS'
    );

    // Map each employee to their grade and calculate their bonus based on salary ranges
    const employeesWithBonus = eligibleEmployees.map(emp => {
      const salaryNum = parseFloat(String(emp.monthlySalary || '0').replace(/[^0-9.]/g, '')) || 0;
      const deptGrades = data.grades.filter(g => g.department === emp.department);
      
      // Match grade by salary range
      let matchedGrade = deptGrades.find(g => salaryNum >= g.minSalary && salaryNum <= g.maxSalary);
      if (!matchedGrade && deptGrades.length > 0) {
        matchedGrade = deptGrades[0];
      }

      const payoutMeta = data.employeePayouts?.[emp.id] || {
        achievedTarget: 0,
        status: 'PENDING',
        lastUpdated: new Date().toISOString()
      };

      const achievedTarget = payoutMeta.achievedTarget || 0;
      let achievedLevel = 0;
      let bonusEarned = 0;

      if (matchedGrade && matchedGrade.levels && matchedGrade.levels.length > 0) {
        // Sort levels ascending by target
        const sortedLevels = [...matchedGrade.levels].sort((a, b) => a.targetAmount - b.targetAmount);
        for (const lvl of sortedLevels) {
          if (achievedTarget >= lvl.targetAmount) {
            achievedLevel = lvl.level;
            bonusEarned = lvl.bonusAmount;
          }
        }
      }

      return {
        ...emp,
        numericSalary: salaryNum,
        matchedGrade: matchedGrade ? {
          id: matchedGrade.id,
          gradeName: matchedGrade.gradeName,
          gradeNumber: matchedGrade.gradeNumber,
          minSalary: matchedGrade.minSalary,
          maxSalary: matchedGrade.maxSalary,
        } : null,
        achievedTarget,
        achievedLevel,
        bonusEarned,
        totalCompensation: salaryNum + bonusEarned,
        payoutStatus: payoutMeta.status || 'PENDING',
        lastUpdated: payoutMeta.lastUpdated
      };
    });

    return res.json({
      success: true,
      grades: data.grades,
      eligibleEmployees: employeesWithBonus,
      employeePayouts: data.employeePayouts || {}
    });
  } catch (error) {
    console.error('Fetch bonus schemes error:', error);
    res.status(500).json({ error: 'Failed to fetch bonus schemes' });
  }
});

// POST /api/bonus-schemes/grades - Create a new Grade based on salary ranges
router.post('/grades', (req, res) => {
  try {
    const { department, gradeName, minSalary, maxSalary, description, minTarget, minBonus, levels } = req.body;
    if (!department || minSalary === undefined || maxSalary === undefined) {
      return res.status(400).json({ error: 'Department, min salary, and max salary are required.' });
    }

    const data = getBonusSchemesData();
    const deptGrades = data.grades.filter(g => g.department === department);
    const gradeNumber = deptGrades.length + 1;

    const defaultLevels = Array.isArray(levels) && levels.length > 0 ? levels : [
      { level: 1, targetAmount: 1800, bonusAmount: 2200 },
      { level: 2, targetAmount: 2000, bonusAmount: 2500 },
      { level: 3, targetAmount: 2200, bonusAmount: 2800 },
      { level: 4, targetAmount: 2400, bonusAmount: 3100 },
      { level: 5, targetAmount: 2600, bonusAmount: 3400 },
      { level: 6, targetAmount: 2800, bonusAmount: 3700 },
      { level: 7, targetAmount: 3000, bonusAmount: 4000 },
      { level: 8, targetAmount: 3200, bonusAmount: 4300 },
      { level: 9, targetAmount: 3400, bonusAmount: 4600 },
      { level: 10, targetAmount: 3600, bonusAmount: 4900 },
      { level: 11, targetAmount: 3800, bonusAmount: 5200 },
      { level: 12, targetAmount: 4000, bonusAmount: 5500 }
    ];

    const newGrade = {
      id: `grd-${department.toLowerCase()}-${Date.now()}`,
      department,
      gradeNumber,
      gradeName: gradeName || `Grade-${gradeNumber}`,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      minTarget: minTarget !== undefined ? Number(minTarget) : defaultLevels[0].targetAmount,
      minBonus: minBonus !== undefined ? Number(minBonus) : defaultLevels[0].bonusAmount,
      description: description || `Grade for ${department} staff`,
      levels: defaultLevels
    };

    data.grades.push(newGrade);
    data.grades.sort((a, b) => (a.minSalary || 0) - (b.minSalary || 0));
    saveBonusSchemesToDisk(data);

    return res.status(201).json({ success: true, grade: newGrade });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

// PUT /api/bonus-schemes/grades/:id - Update Grade or Levels Configuration
router.put('/grades/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = getBonusSchemesData();
    const gradeIdx = data.grades.findIndex(g => g.id === id);

    if (gradeIdx === -1) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    data.grades[gradeIdx] = {
      ...data.grades[gradeIdx],
      ...req.body,
      minSalary: req.body.minSalary !== undefined ? Number(req.body.minSalary) : data.grades[gradeIdx].minSalary,
      maxSalary: req.body.maxSalary !== undefined ? Number(req.body.maxSalary) : data.grades[gradeIdx].maxSalary,
      minTarget: req.body.minTarget !== undefined ? Number(req.body.minTarget) : data.grades[gradeIdx].minTarget,
      minBonus: req.body.minBonus !== undefined ? Number(req.body.minBonus) : data.grades[gradeIdx].minBonus,
      id
    };

    data.grades.sort((a, b) => (a.minSalary || 0) - (b.minSalary || 0));
    saveBonusSchemesToDisk(data);
    return res.json({ success: true, grade: data.grades[gradeIdx] });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

// DELETE /api/bonus-schemes/grades/:id - Delete a Grade
router.delete('/grades/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = getBonusSchemesData();
    data.grades = data.grades.filter(g => g.id !== id);
    saveBonusSchemesToDisk(data);
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ error: 'Failed to delete grade' });
  }
});

// POST /api/bonus-schemes/payouts/update - Update an employee's achieved target and payout status
router.post('/payouts/update', (req, res) => {
  try {
    const { employeeId, achievedTarget, status } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    const data = getBonusSchemesData();
    if (!data.employeePayouts) data.employeePayouts = {};

    data.employeePayouts[employeeId] = {
      achievedTarget: achievedTarget !== undefined ? Number(achievedTarget) : (data.employeePayouts[employeeId]?.achievedTarget || 0),
      status: status || data.employeePayouts[employeeId]?.status || 'PENDING',
      lastUpdated: new Date().toISOString()
    };

    saveBonusSchemesToDisk(data);
    return res.json({
      success: true,
      employeeId,
      payoutMeta: data.employeePayouts[employeeId]
    });
  } catch (error) {
    console.error('Update employee payout error:', error);
    res.status(500).json({ error: 'Failed to update employee payout' });
  }
});

export default router;
