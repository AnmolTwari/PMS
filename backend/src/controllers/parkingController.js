const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const PermanentReservation = require('../models/PermanentReservation');
const { getVehicleNumbers, normalizeVehicleNumber, isSameBooking, isTimeBetween, dayNameFromDate } = require('../utils/parking');
const { emitParkingUpdate } = require('../services/realtime');
const notification = require('../services/notification');

function setSlotStatus(slot, status) {
  slot.status = status;
  slot.occupied = status === 'occupied' || status === 'reserved';
  if (status === 'available' || status === 'disabled' || status === 'maintenance') {
    slot.carNumber = null;
    slot.bookingTime = null;
    slot.bookingDate = null;
    slot.bookingSlotTime = null;
    slot.bookingMode = 'auto';
    slot.bookingUserId = null;
    slot.isPermanent = false;
    slot.permanentUserId = null;
  }
}

function createParkingController() {
  async function listAvailableSlots(_req, res) {
    const slots = await ParkingSlot.find({ status: 'available' }).sort({ parkingAreaId: 1, slotNumber: 1 });
    return res.json({ slots });
  }

  async function assignSlot(req, res) {
    const { area, slotNumber, employeeId } = req.body;

    if (!area || !slotNumber || !employeeId) {
      return res.status(400).json({ message: 'Area, slot number and employee ID are required' });
    }

    const slot = await ParkingSlot.findOne({ areaName: area, slotNumber: Number(slotNumber) });
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.status !== 'available') {
      return res.status(409).json({ message: 'Slot is already occupied' });
    }

    const vehicleNo = `CAR-${employeeId}`.toUpperCase();
    const user = await User.findOne({ employeeId });

    setSlotStatus(slot, 'occupied');
    slot.carNumber = vehicleNo;
    slot.bookingTime = new Date();
    await slot.save();

    if (user) {
      user.vehicleNo = vehicleNo;
      user.defaultVehicleNo = vehicleNo;
      if (!user.vehicles?.length) {
        user.vehicles = [{ number: vehicleNo, type: 'Car', model: '', color: '', isDefault: true }];
      }
      await user.save();
    }

    emitParkingUpdate({ type: 'slot-assigned', slot: slot.toObject() });
    return res.json({ message: 'Slot assigned successfully', vehicleNo, slot: slot.toObject() });
  }

  async function bookSlot(req, res) {
    const { area, slotId, vehicleNo, bookingDate, bookingTime, bookingMode = 'auto' } = req.body;
    const user = await User.findById(req.user.id);
    const availableVehicleNumbers = getVehicleNumbers(user);
    const selectedVehicleNo = normalizeVehicleNumber(vehicleNo || user?.defaultVehicleNo || user?.vehicleNo || availableVehicleNumbers[0] || '');

    if (!selectedVehicleNo) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!availableVehicleNumbers.includes(selectedVehicleNo)) {
      return res.status(400).json({ message: 'Please add this vehicle to your profile first' });
    }

    // Require date/time for bookings
    if (!bookingDate || !bookingTime) {
      return res.status(400).json({ message: 'Booking date and time are required' });
    }

    // Check if user already has a booking at the same date/time
    const userConflict = availableVehicleNumbers.length
      ? await ParkingSlot.findOne({
          carNumber: { $in: availableVehicleNumbers },
          status: { $in: ['occupied', 'reserved'] },
          bookingDate: bookingDate,
          bookingSlotTime: bookingTime,
        })
      : null;

    if (userConflict) {
      return res.status(409).json({ message: 'You already have a booking at the selected date/time' });
    }

    let slot = null;
    if (bookingMode === 'manual') {
      if (!slotId) {
        return res.status(400).json({ message: 'Please select a slot' });
      }

      slot = await ParkingSlot.findById(slotId);
      if (!slot || slot.status !== 'available') {
        return res.status(409).json({ message: 'Slot not available' });
      }
      // Check for existing booking conflict on this slot
      if (slot.bookingDate && slot.bookingSlotTime && isSameBooking(slot.bookingDate, slot.bookingSlotTime, bookingDate, bookingTime)) {
        return res.status(409).json({ message: 'Selected slot is already booked for this date/time' });
      }
      // Check for permanent reservations that overlap
      const dayName = dayNameFromDate(bookingDate);
      const permanent = await PermanentReservation.findOne({ slotId: slot._id });
      if (permanent && Array.isArray(permanent.activeDays) && permanent.activeDays.includes(dayName)) {
        if (isTimeBetween(bookingTime, permanent.startTime, permanent.endTime)) {
          return res.status(409).json({ message: 'Selected slot is reserved permanently during this time' });
        }
      }
    } else {
      if (!area) {
        return res.status(400).json({ message: 'Area is required for auto assignment' });
      }

      // Find first available slot in area that has no conflicting booking or permanent reservation for the requested date/time
      const candidates = await ParkingSlot.find({ areaName: area, status: 'available' }).sort({ slotNumber: 1 });
      const dayName = dayNameFromDate(bookingDate);
      let found = null;
      for (const candidate of candidates) {
        // skip if same-date/time booking already exists on candidate
        if (candidate.bookingDate && candidate.bookingSlotTime && isSameBooking(candidate.bookingDate, candidate.bookingSlotTime, bookingDate, bookingTime)) {
          continue;
        }

        // check permanent reservations for this slot
        const permanent = await PermanentReservation.findOne({ slotId: candidate._id });
        if (permanent && Array.isArray(permanent.activeDays) && permanent.activeDays.includes(dayName)) {
          if (isTimeBetween(bookingTime, permanent.startTime, permanent.endTime)) {
            continue;
          }
        }

        found = candidate;
        break;
      }

      if (!found) {
        return res.status(404).json({ message: 'No available slots in this area for the selected date/time' });
      }

      slot = found;
    }

    // Final safety check: ensure no other slot holds this vehicle at same date/time
    const vehicleConflict = await ParkingSlot.findOne({
      carNumber: selectedVehicleNo,
      status: { $in: ['occupied', 'reserved'] },
      bookingDate: bookingDate,
      bookingSlotTime: bookingTime,
    });

    if (vehicleConflict) {
      return res.status(409).json({ message: 'This vehicle already has a booking at the selected date/time' });
    }

    setSlotStatus(slot, 'reserved');
    slot.carNumber = selectedVehicleNo;
    slot.bookingTime = new Date();
    slot.bookingDate = bookingDate;
    slot.bookingSlotTime = bookingTime;
    slot.bookingMode = bookingMode;
    slot.bookingUserId = user._id;
    await slot.save();

    await user.save();

    emitParkingUpdate({ type: 'slot-booked', slot: slot.toObject() });
    try {
      if (user?.email) notification.sendEmail(user.email, 'Parking booked', `Your parking slot ${slot.areaName} #${slot.slotNumber} is reserved for ${bookingDate} at ${bookingTime}.`);
      notification.sendPush(user._id, { type: 'booking:created', slot: slot.toObject() });
    } catch (err) {
      console.error('notification error (bookSlot)', err);
    }
    return res.json({ message: 'Parking slot reserved', slot: slot.toObject() });
  }

  async function releaseSlot(req, res) {
    const { vehicleNo } = req.body;
    const currentUser = await User.findById(req.user.id);
    const lookupVehicleNo = normalizeVehicleNumber(vehicleNo || currentUser?.defaultVehicleNo || currentUser?.vehicleNo || '');

    if (!lookupVehicleNo) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const slot = await ParkingSlot.findOne({ carNumber: new RegExp(`^${lookupVehicleNo}$`, 'i') });
    if (!slot) {
      return res.status(404).json({ message: 'No slot found for this vehicle number' });
    }

    if (slot.isPermanent && slot.permanentUserId) {
      await PermanentReservation.deleteOne({ slotId: slot._id });
    }

    setSlotStatus(slot, 'available');
    await slot.save();

    emitParkingUpdate({ type: 'slot-released', slot: slot.toObject() });
    try {
      if (currentUser?.email) notification.sendEmail(currentUser.email, 'Parking released', `Your parking slot ${slot.areaName} #${slot.slotNumber} has been released.`);
      notification.sendPush(currentUser._id, { type: 'slot:released', slot: slot.toObject() });
    } catch (err) {
      console.error('notification error (releaseSlot)', err);
    }
    return res.json({ message: 'Slot released successfully' });
  }

  async function createPermanentReservation(req, res) {
    const { preferredArea, startTime = '09:00', endTime = '18:00', activeDays } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingReservation = await PermanentReservation.findOne({ userId: user._id });
    if (existingReservation) {
      return res.status(409).json({ message: 'You already have a permanent reservation' });
    }

    const slot = await ParkingSlot.findOne({
      areaName: preferredArea,
      status: 'available',
      isPermanent: false,
      permanentUserId: null,
    });

    if (!slot) {
      return res.status(404).json({ message: 'No available permanent slots in this area' });
    }

    // Check for any existing bookings that would conflict with requested permanent window
    const conflicting = await ParkingSlot.findOne({
      _id: slot._id,
      status: { $in: ['occupied', 'reserved'] },
      bookingDate: { $ne: null },
    });

    if (conflicting) {
      // inspect whether any of those bookings fall on requested active days and inside the time window
      const dayNames = Array.isArray(activeDays) && activeDays.length ? activeDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      // if the slot has a bookingDate/bookingSlotTime, check per booking
      const existingBookings = await ParkingSlot.find({ _id: slot._id, bookingDate: { $ne: null } });
      for (const b of existingBookings) {
        const dayName = dayNameFromDate(b.bookingDate);
        if (dayNames.includes(dayName) && isTimeBetween(b.bookingSlotTime, startTime, endTime)) {
          return res.status(409).json({ message: 'Existing bookings conflict with requested permanent reservation window' });
        }
      }
    }

    slot.isPermanent = true;
    slot.permanentUserId = user._id;
    setSlotStatus(slot, 'reserved');
    slot.bookingUserId = user._id;
    slot.bookingTime = new Date();
    await slot.save();

    const reservation = await PermanentReservation.create({
      userId: user._id,
      slotId: slot._id,
      areaName: slot.areaName,
      slotNumber: slot.slotNumber,
      activeDays: Array.isArray(activeDays) && activeDays.length ? activeDays : undefined,
      startTime,
      endTime,
    });

    emitParkingUpdate({ type: 'permanent-reserved', slot: slot.toObject() });
    try {
      if (user?.email) notification.sendEmail(user.email, 'Permanent slot reserved', `Permanent parking reserved: ${slot.areaName} #${slot.slotNumber}`);
      notification.sendPush(user._id, { type: 'permanent:created', reservation });
    } catch (err) {
      console.error('notification error (createPermanentReservation)', err);
    }
    return res.status(201).json({ message: 'Permanent slot reserved', reservation });
  }

  // Admin: create permanent reservation for a specific user
  async function createPermanentReservationForUser(req, res) {
    const { userId, preferredArea, startTime = '09:00', endTime = '18:00', activeDays } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    const existingReservation = await PermanentReservation.findOne({ userId: targetUser._id });
    if (existingReservation) {
      return res.status(409).json({ message: 'User already has a permanent reservation' });
    }

    const slot = await ParkingSlot.findOne({
      areaName: preferredArea,
      status: 'available',
      isPermanent: false,
      permanentUserId: null,
    });

    if (!slot) {
      return res.status(404).json({ message: 'No available permanent slots in this area' });
    }

    const conflicting = await ParkingSlot.findOne({ _id: slot._id, bookingDate: { $ne: null } });
    if (conflicting) {
      const dayNames = Array.isArray(activeDays) && activeDays.length ? activeDays : ['Monday','Tuesday','Wednesday','Thursday','Friday'];
      const existingBookings = await ParkingSlot.find({ _id: slot._id, bookingDate: { $ne: null } });
      for (const b of existingBookings) {
        const dayName = dayNameFromDate(b.bookingDate);
        if (dayNames.includes(dayName) && isTimeBetween(b.bookingSlotTime, startTime, endTime)) {
          return res.status(409).json({ message: 'Existing bookings conflict with requested permanent reservation window' });
        }
      }
    }

    slot.isPermanent = true;
    slot.permanentUserId = targetUser._id;
    setSlotStatus(slot, 'reserved');
    slot.bookingUserId = targetUser._id;
    slot.bookingTime = new Date();
    await slot.save();

    const reservation = await PermanentReservation.create({
      userId: targetUser._id,
      slotId: slot._id,
      areaName: slot.areaName,
      slotNumber: slot.slotNumber,
      activeDays: Array.isArray(activeDays) && activeDays.length ? activeDays : undefined,
      startTime,
      endTime,
    });

    emitParkingUpdate({ type: 'permanent-reserved', slot: slot.toObject() });
    try {
      if (targetUser?.email) notification.sendEmail(targetUser.email, 'Permanent slot reserved', `An admin reserved permanent parking for you: ${slot.areaName} #${slot.slotNumber}`);
      notification.sendPush(targetUser._id, { type: 'permanent:created', reservation });
    } catch (err) {
      console.error('notification error (createPermanentReservationForUser)', err);
    }
    return res.status(201).json({ message: 'Permanent slot reserved for user', reservation });
  }

  async function updateSlotStatus(req, res) {
    const { slotId } = req.params;
    const { status } = req.body;

    if (!['available', 'occupied', 'reserved', 'disabled', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (status === 'available') {
      slot.isPermanent = false;
      slot.permanentUserId = null;
    }

    setSlotStatus(slot, status);
    await slot.save();

    emitParkingUpdate({ type: 'slot-status-updated', slot: slot.toObject() });
    return res.json({ message: 'Slot status updated', slot: slot.toObject() });
  }

  async function getCurrentPermanentReservation(req, res) {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reservation = await PermanentReservation.findOne({ userId: user._id }).populate('slotId');
    return res.json({ reservation });
  }

  async function getUserStatus(req, res, buildUserDashboard) {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dashboard = await buildUserDashboard(user);
    return res.json({ statusData: dashboard.statusData });
  }

  async function getMap(_req, res) {
    // Return slots grouped by area with counts per status and lightweight slot list
    const slots = await ParkingSlot.find({}, 'areaName slotNumber status slotNumber carNumber bookingDate bookingSlotTime').sort({ parkingAreaId: 1, slotNumber: 1 });

    const map = {};
    for (const s of slots) {
      const area = s.areaName || s.parkingAreaId || 'Area';
      if (!map[area]) map[area] = { area, counts: { available: 0, occupied: 0, reserved: 0, disabled: 0, maintenance: 0 }, slots: [] };
      map[area].counts[s.status] = (map[area].counts[s.status] || 0) + 1;
      map[area].slots.push({ id: s._id, slotNumber: s.slotNumber, status: s.status, vehicle: s.carNumber || null, bookingDate: s.bookingDate || null, bookingSlotTime: s.bookingSlotTime || null });
    }

    const areas = Object.values(map);
    return res.json({ areas });
  }

  // Get upcoming reservations for the current user (default next 7 days)
  async function getUpcomingReservations(req, res) {
    try {
      const days = Number(req.query.days) || 7;
      const from = new Date();
      from.setHours(0,0,0,0);
      const to = new Date(from);
      to.setDate(to.getDate() + days);

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const vehicleNumbers = getVehicleNumbers(user);

      const bookings = await ParkingSlot.find({
        status: { $in: ['reserved','occupied'] },
        bookingDate: { $gte: from.toISOString().split('T')[0], $lte: to.toISOString().split('T')[0] },
        $or: [ { bookingUserId: user._id }, { carNumber: { $in: vehicleNumbers } } ],
      }).sort({ bookingDate: 1, bookingSlotTime: 1 }).lean();

      const grouped = {};
      for (const b of bookings) {
        const d = b.bookingDate || 'unknown';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push({ id: b._id, area: b.areaName, slotNumber: b.slotNumber, status: b.status, bookingSlotTime: b.bookingSlotTime, bookingMode: b.bookingMode });
      }

      return res.json({ from: from.toISOString(), to: to.toISOString(), bookings: grouped });
    } catch (err) {
      console.error('getUpcomingReservations error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Cancel a booking by slotId or bookingId (user or admin)
  async function cancelBooking(req, res) {
    try {
      const { slotId, bookingId } = req.body;
      if (!slotId && !bookingId) return res.status(400).json({ message: 'slotId or bookingId required' });

      const slot = slotId ? await ParkingSlot.findById(slotId) : await ParkingSlot.findById(bookingId);
      if (!slot) return res.status(404).json({ message: 'Booking/slot not found' });

      const reqUser = await User.findById(req.user.id);
      const isOwner = slot.bookingUserId && slot.bookingUserId.toString() === reqUser._id.toString();
      const isAdmin = ['admin','superadmin'].includes(reqUser.role);
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized to cancel this booking' });

      const previousOwner = slot.bookingUserId;
      if (slot.isPermanent) {
        await PermanentReservation.deleteOne({ slotId: slot._id });
      }

      setSlotStatus(slot, 'available');
      slot.carNumber = null;
      slot.bookingDate = null;
      slot.bookingSlotTime = null;
      slot.bookingUserId = null;
      slot.bookingMode = 'auto';
      await slot.save();

      emitParkingUpdate({ type: 'booking-cancelled', slot: slot.toObject() });
      try {
        if (previousOwner) notification.sendPush(previousOwner, { type: 'booking:cancelled', slot: slot.toObject() });
      } catch (err) {
        console.error('notification error (cancelBooking)', err);
      }
      return res.json({ message: 'Booking cancelled', slot: slot.toObject() });
    } catch (err) {
      console.error('cancelBooking error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return {
    listAvailableSlots,
    assignSlot,
    bookSlot,
    releaseSlot,
    createPermanentReservation,
    createPermanentReservationForUser,
    getCurrentPermanentReservation,
    getUserStatus,
    updateSlotStatus,
    getMap,
    getUpcomingReservations,
    cancelBooking,
  };
}

module.exports = {
  createParkingController,
};