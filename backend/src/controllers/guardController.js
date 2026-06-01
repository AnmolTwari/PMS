const EntryExit = require('../models/EntryExit');
const VisitorPass = require('../models/VisitorPass');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const { normalizeVehicleNumber } = require('../utils/parking');
const { emitParkingUpdate, emitEvent } = require('../services/realtime');
const notification = require('../services/notification');
const qrcode = require('qrcode');

function createGuardController({ blockedController } = {}) {
  async function checkIn(req, res) {
    try {
      const { vehicleNumber: rawVehicle, userName, bookingId } = req.body;
      if (!rawVehicle && !bookingId) return res.status(400).json({ message: 'vehicleNumber or bookingId required' });

      const requestedVehicleNumber = rawVehicle ? normalizeVehicleNumber(rawVehicle) : undefined;

      let user = null;
      if (userName) {
        user = await User.findOne({ name: new RegExp(`^${userName}$`, 'i') });
      }

      let slot = null;
      if (bookingId) {
        slot = await ParkingSlot.findById(bookingId);
      } else {
        // try to find a slot reserved/assigned for this vehicle
        slot = await ParkingSlot.findOne({ vehicleNo: requestedVehicleNumber }) || await ParkingSlot.findOne({ bookingUserId: req.body.userId });
      }

      const slotVehicleNumber = slot?.vehicleNo ? normalizeVehicleNumber(slot.vehicleNo) : undefined;
      const effectiveVehicleNumber = requestedVehicleNumber || slotVehicleNumber;

      if (effectiveVehicleNumber && blockedController?.check) {
        const blocked = await blockedController.check(effectiveVehicleNumber);
        if (blocked.blocked) {
          return res.status(403).json({
            message: 'Vehicle is blocked and cannot be checked in',
            blocked: true,
            blockedRecord: blocked.record,
          });
        }
      }

      const entry = new EntryExit({ vehicleNumber: effectiveVehicleNumber, userId: user?._id, bookingId: slot?._id, slotId: slot?._id, checkInTime: new Date() });
      await entry.save();

      if (slot) {
        slot.status = 'occupied';
        await slot.save();
        emitParkingUpdate();
        emitEvent('entry:checked-in', { entry: entry.toObject(), slot: slot.toObject() });
        try {
          const targetUser = slot.bookingUserId || entry.userId;
          if (targetUser) notification.sendPush(targetUser, { type: 'entry:checked-in', entry: entry.toObject(), slot: slot.toObject() });
          if (user?.email) notification.sendEmail(user.email, 'Vehicle checked in', `Vehicle ${entry.vehicleNumber} checked in at ${new Date().toLocaleString()}`);
        } catch (err) {
          console.error('notification error (checkIn)', err);
        }
      }

      return res.json({ ok: true, entry });
    } catch (err) {
      console.error('checkIn error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function checkOut(req, res) {
    try {
      const { entryId } = req.body;
      if (!entryId) return res.status(400).json({ message: 'entryId required' });

      const entry = await EntryExit.findById(entryId);
      if (!entry) return res.status(404).json({ message: 'Entry not found' });

      entry.checkOutTime = new Date();
      const durationMs = entry.checkOutTime - (entry.checkInTime || entry.createdAt);
      entry.durationMinutes = Math.round(durationMs / 60000);
      await entry.save();

      if (entry.slotId) {
        const slot = await ParkingSlot.findById(entry.slotId);
        if (slot) {
          slot.status = 'available';
          slot.bookingDate = null;
          slot.bookingSlotTime = null;
          slot.bookingUserId = null;
          await slot.save();
          emitParkingUpdate();
          emitEvent('entry:checked-out', { entry: entry.toObject(), slot: slot.toObject() });
          try {
            const targetUser = slot.bookingUserId || entry.userId;
            if (targetUser) notification.sendPush(targetUser, { type: 'entry:checked-out', entry: entry.toObject(), slot: slot.toObject() });
            if (user?.email) notification.sendEmail(user.email, 'Vehicle checked out', `Vehicle ${entry.vehicleNumber} checked out at ${new Date().toLocaleString()}`);
          } catch (err) {
            console.error('notification error (checkOut)', err);
          }
        }
      }

      return res.json({ ok: true, entry });
    } catch (err) {
      console.error('checkOut error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function generateQR(req, res) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) return res.status(400).json({ message: 'bookingId required' });

      const slot = await ParkingSlot.findById(bookingId).populate('bookingUserId');
      if (!slot) return res.status(404).json({ message: 'Booking/slot not found' });

      const payload = {
        bookingId: slot._id.toString(),
        vehicleNumber: slot.vehicleNo || null,
        slotNumber: slot.slotNumber,
        area: slot.parkingAreaId,
        issuedAt: new Date().toISOString(),
      };

      const dataUrl = await qrcode.toDataURL(JSON.stringify(payload));
      return res.json({ ok: true, payload, qr: dataUrl });
    } catch (err) {
      console.error('generateQR error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function createVisitorPass(req, res) {
    try {
      const { visitorName, vehicleNumber: rawVehicle, date, time } = req.body;
      if (!visitorName || !rawVehicle || !date || !time) return res.status(400).json({ message: 'Missing fields' });

      const vehicleNumber = normalizeVehicleNumber(rawVehicle);

      // pick first available slot
      const slot = await ParkingSlot.findOne({ status: 'available' });
      if (!slot) return res.status(400).json({ message: 'No slots available' });

      slot.status = 'reserved';
      slot.bookingDate = date;
      slot.bookingSlotTime = time;
      slot.bookingMode = 'visitor';
      await slot.save();
      emitParkingUpdate();
      emitEvent('visitor:created', { pass: { slotId: slot._id.toString(), slotNumber: slot.slotNumber, area: slot.parkingAreaId }, date, time });
      try {
        const creatorId = req.user?.id;
        if (creatorId) notification.sendPush(creatorId, { type: 'visitor:created', slot: slot.toObject(), date, time });
      } catch (err) {
        console.error('notification error (createVisitorPass)', err);
      }

      const payload = { visitorName, vehicleNumber, date, time, slotId: slot._id.toString(), slotNumber: slot.slotNumber, area: slot.parkingAreaId };
      const qrData = await qrcode.toDataURL(JSON.stringify(payload));

      const pass = new VisitorPass({ visitorName, vehicleNumber, date, time, slotId: slot._id, qrData, createdBy: req.user?._id });
      await pass.save();

      return res.json({ ok: true, pass });
    } catch (err) {
      console.error('createVisitorPass error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return { checkIn, checkOut, generateQR, createVisitorPass };
}

module.exports = { createGuardController };
