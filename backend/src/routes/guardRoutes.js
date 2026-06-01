const express = require('express');

function createGuardRoutes(controller, authenticateToken, requireRole) {
  const router = express.Router();

  // Check-in: security can check in a vehicle based on booking or vehicle number
  router.post('/checkin', authenticateToken, requireRole(['security','admin','superadmin']), controller.checkIn);

  // Check-out: mark an entry as checked out and free slot
  router.post('/checkout', authenticateToken, requireRole(['security','admin','superadmin']), controller.checkOut);

  // Generate QR for a booking/slot
  router.post('/qr', authenticateToken, requireRole(['security','admin','superadmin']), controller.generateQR);

  // Create visitor pass (generate QR and reserve a slot)
  router.post('/visitor', authenticateToken, requireRole(['employee','admin','superadmin']), controller.createVisitorPass);

  return router;
}

module.exports = { createGuardRoutes };
