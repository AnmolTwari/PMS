const express = require('express');

function createRecurringRoutes(controller, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/me', authenticateToken, controller.listMine);
  router.post('/', authenticateToken, controller.create);
  router.post('/cancel', authenticateToken, controller.cancel);

  return router;
}

module.exports = { createRecurringRoutes };
