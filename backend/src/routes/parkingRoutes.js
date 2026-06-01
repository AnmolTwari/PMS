const express = require('express');

function createParkingRoutes(parkingController, authenticateToken, requireRole, buildUserDashboard) {
  const router = express.Router();

  router.get('/available', authenticateToken, parkingController.listAvailableSlots);
  router.get('/map', authenticateToken, parkingController.getMap);
  router.get('/bookings/upcoming', authenticateToken, parkingController.getUpcomingReservations);
  router.post('/bookings/cancel', authenticateToken, parkingController.cancelBooking);
  router.post('/assign', authenticateToken, requireRole('admin'), parkingController.assignSlot);
  router.post('/book', authenticateToken, requireRole('user'), parkingController.bookSlot);
  router.post('/release', authenticateToken, parkingController.releaseSlot);
  router.post('/permanent', authenticateToken, requireRole('user'), parkingController.createPermanentReservation);
  router.post('/permanent/admin', authenticateToken, requireRole('admin'), parkingController.createPermanentReservationForUser);
  router.get('/permanent/me', authenticateToken, requireRole('user'), parkingController.getCurrentPermanentReservation);
  router.patch('/:slotId/status', authenticateToken, requireRole('admin'), parkingController.updateSlotStatus);
  router.get('/status', authenticateToken, requireRole('user'), async (req, res) => {
    return parkingController.getUserStatus(req, res, buildUserDashboard);
  });

  return router;
}

module.exports = {
  createParkingRoutes,
};