const express = require('express');

function createReportsRoutes(reportsController, authenticateToken, requireRole) {
  const router = express.Router();

  // Download Entry/Exit records as CSV
  router.get('/entries', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { start, end } = req.query;
      const csv = await reportsController.exportEntriesCSV(start, end);
      const fileName = `entries-${start || 'all'}-${end || 'now'}.csv`.replace(/[:T]/g, '-');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to generate report', error: err.message });
    }
  });

  return router;
}

module.exports = { createReportsRoutes };
