const express = require('express');

function createHistoryRoutes(controller, authenticateToken, requireRole) {
  const router = express.Router();

  // User: get own history (past N days)
  router.get('/me', authenticateToken, controller.getMyHistory);

  // Admin: search vehicle
  router.get('/search', authenticateToken, requireRole(['admin','superadmin','security']), controller.searchVehicle);

  // (Further admin endpoints can be added here for searching vehicle history)

  return router;
}

module.exports = { createHistoryRoutes };
