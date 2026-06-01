const express = require('express');

function createAuthRoutes(authController, authenticateToken) {
  const router = express.Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/logout', authenticateToken, authController.logout);
  router.get('/me', authController.me);

  return router;
}

module.exports = {
  createAuthRoutes,
};