const express = require('express');

function createBlockedRoutes(blockedController, authenticateToken, requireRole) {
  const router = express.Router();

  const formatDateTime = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  router.get('/check', async (req, res) => {
    try {
      const vehicleNumber = req.query.vehicleNumber || req.query.vehicle || '';
      const result = await blockedController.check(vehicleNumber);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to check blocked vehicle', error: err.message });
    }
  });

  router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const { vehicleNumber, status, from, to } = req.query;
      const data = await blockedController.list({ page, limit, vehicleNumber, status, from, to });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to list blocked vehicles', error: err.message });
    }
  });

  router.get('/export', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { vehicleNumber, status, from, to } = req.query;
      // request all matching rows (limit = 0 means no pagination)
      const data = await blockedController.list({ page: 1, limit: 0, vehicleNumber, status, from, to });

      const header = ['vehicleNumber', 'reason', 'startDate', 'endDate', 'status', 'issuedBy', 'createdAt'];
      const rows = data.rows.map(r => {
        const issuedByName = typeof r.issuedBy === 'object'
          ? (r.issuedBy?.name || r.issuedBy?.username || r.issuedBy?.email || '')
          : (r.issuedBy || '');

        return [
          r.vehicleNumber || '',
          r.reason || '',
          formatDateTime(r.startDate),
          formatDateTime(r.endDate),
          r.status || '',
          issuedByName,
          formatDateTime(r.createdAt),
        ];
      });

      const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
      const csv = header.join(',') + '\n' + rows.map(r => r.map(esc).join(',')).join('\n');
      res.setHeader('Content-Disposition', 'attachment; filename="blocked_vehicles.csv"');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to export blocked vehicles', error: err.message });
    }
  });

  router.post('/block', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const user = req.user;
      const rec = await blockedController.create(req.body, user);
      return res.status(201).json(rec);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to block vehicle', error: err.message });
    }
  });

  router.post('/:id/lift', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const rec = await blockedController.lift(req.params.id, req.user);
      return res.json(rec);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to lift block', error: err.message });
    }
  });

  return router;
}

module.exports = { createBlockedRoutes };
