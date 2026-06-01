const express = require('express');

function createAnalyticsRoutes(analyticsController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/usage', authenticateToken, requireRole('admin'), async (req, res) => {
    const days = parseInt(req.query.days || '7', 10);
    try {
      const data = await analyticsController.usageLastNDays(days);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to compute usage', error: err.message });
    }
  });

  router.get('/peak-hours', authenticateToken, requireRole('admin'), async (req, res) => {
    const days = parseInt(req.query.days || '7', 10);
    try {
      const data = await analyticsController.peakHoursLastNDays(days);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to compute peak hours', error: err.message });
    }
  });

  router.get('/occupancy', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const data = await analyticsController.occupancyTrendLastNDays();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to compute occupancy', error: err.message });
    }
  });

  router.get('/departments', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const data = await analyticsController.departmentStats();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to compute departments', error: err.message });
    }
  });

  router.get('/visitors/recent', authenticateToken, requireRole('admin'), async (req, res) => {
    const limit = parseInt(req.query.limit || '10', 10);
    try {
      const data = await analyticsController.recentVisitorPasses(limit);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch recent visitor passes', error: err.message });
    }
  });

  return router;
}

module.exports = { createAnalyticsRoutes };
