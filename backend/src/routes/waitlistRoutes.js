const express = require('express');

function createWaitlistRoutes(controller, authenticateToken, requireRole) {
  const router = express.Router();

  router.post('/join', authenticateToken, controller.join);
  router.post('/leave', authenticateToken, controller.leave);
  router.get('/me', authenticateToken, controller.myEntries);
  router.get('/area', authenticateToken, requireRole(['admin','superadmin']), controller.listForArea);

  return router;
}

module.exports = { createWaitlistRoutes };
