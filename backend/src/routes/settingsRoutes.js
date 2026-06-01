const express = require('express');

function createSettingsRoutes(settingsController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/maintenance', async (_req, res) => {
    try {
      const state = await settingsController.getMaintenance();
      return res.json(state);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to load maintenance state', error: err.message });
    }
  });

  router.get('/', authenticateToken, requireRole('admin'), async (_req, res) => {
    try {
      const settings = await settingsController.getSettings();
      return res.json(settings);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to load settings', error: err.message });
    }
  });

  router.patch('/maintenance', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const state = await settingsController.updateMaintenance(req.body, req.user);
      return res.json(state);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to update maintenance state', error: err.message });
    }
  });

  router.patch('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const settings = await settingsController.updateSettings(req.body || {}, req.user);
      return res.json(settings);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to update settings', error: err.message });
    }
  });

  return router;
}

module.exports = {
  createSettingsRoutes,
};
