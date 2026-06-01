const express = require('express');

function createSecurityRoutes(securityController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/logs', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const from = req.query.from;
      const to = req.query.to;
      const data = await securityController.list({ page, limit, from, to });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to list logs', error: err.message });
    }
  });

  return router;
}

module.exports = { createSecurityRoutes };
