const express = require('express');

function createDashboardRoutes(dashboardController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
    const branchCode = req.query.branchCode || 'MAIN';
    return res.json(await dashboardController.buildAdminDashboard(branchCode));
  });

  router.get('/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const stats = await dashboardController.buildAdminStats(req.query.branchCode || 'MAIN');
      return res.json(stats);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to compute stats', error: err.message });
    }
  });

  router.get('/user', authenticateToken, requireRole('user'), async (req, res) => {
    const User = require('../models/User');
    const user = req.user?.id ? await User.findById(req.user.id) : null;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(await dashboardController.buildUserDashboard(user));
  });

  return router;
}

module.exports = {
  createDashboardRoutes,
};