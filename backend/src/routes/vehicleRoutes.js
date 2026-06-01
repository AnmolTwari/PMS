const express = require('express');

function createVehicleRoutes(vehicleController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/me', authenticateToken, requireRole('user'), vehicleController.listMyVehicles);
  router.post('/', authenticateToken, requireRole('user'), vehicleController.addVehicle);
  router.patch('/default', authenticateToken, requireRole('user'), vehicleController.setDefaultVehicle);
  router.delete('/:number', authenticateToken, requireRole('user'), vehicleController.removeVehicle);

  return router;
}

module.exports = {
  createVehicleRoutes,
};