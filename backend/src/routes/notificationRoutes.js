const express = require('express');

function createNotificationRoutes(controller, authenticateToken) {
  const router = express.Router();
  router.get('/', authenticateToken, controller.listMine);
  router.post('/:id/read', authenticateToken, controller.markRead);
  return router;
}

module.exports = { createNotificationRoutes };
