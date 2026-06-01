const express = require('express');

function createPasswordRoutes(passwordController) {
  const router = express.Router();

  router.post('/forgot', passwordController.forgotPassword);
  router.post('/forgot-otp', passwordController.forgotPasswordOtp);
  router.post('/reset-otp', passwordController.resetPasswordOtp);
  router.post('/reset', passwordController.resetPassword);

  return router;
}

module.exports = {
  createPasswordRoutes,
};