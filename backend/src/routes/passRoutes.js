const express = require('express');

function createPassRoutes(passController, authenticateToken, requireRole) {
  const router = express.Router();

  // Admin: list all passes
  router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const rows = await passController.listPasses({}, 500);
      return res.json({ rows });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // User: list own passes
  router.get('/mine', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const rows = await passController.getUserPasses(userId);
      return res.json({ rows });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Admin: create a pass for a user
  router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { userId, passType, vehicleNumber, validFrom, validTo } = req.body;
      const issuedBy = req.user.id;
      const pass = await passController.createPass({ userId, passType, vehicleNumber, validFrom, validTo, issuedBy });
      return res.json(pass);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Admin: revoke
  router.post('/:id/revoke', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const pass = await passController.revokePass(req.params.id, req.user.id);
      return res.json(pass);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = { createPassRoutes };
