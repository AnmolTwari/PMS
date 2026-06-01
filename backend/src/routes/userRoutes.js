const express = require('express');

function createUserRoutes(userController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/', authenticateToken, requireRole('admin'), userController.list);
  router.delete('/:id', authenticateToken, requireRole('admin'), userController.remove);

  return router;
}

module.exports = { createUserRoutes };
