const EntryExit = require('../models/EntryExit');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

function createHistoryController() {
  // Get user's entry/exit history (default last 30 days)
  async function getMyHistory(req, res) {
    try {
      const days = Number(req.query.days) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const entries = await EntryExit.find({
        $or: [ { userId: req.user.id }, { vehicleNumber: { $exists: true } } ],
        createdAt: { $gte: since },
      }).sort({ createdAt: -1 }).limit(100).lean();

      // populate slot info
      const slotIds = entries.filter(e => e.slotId).map(e => e.slotId);
      const slots = slotIds.length ? await ParkingSlot.find({ _id: { $in: slotIds } }, 'slotNumber areaName').lean() : [];
      const slotMap = new Map(slots.map(s => [s._id.toString(), s]));

      const result = entries.map(e => ({
        id: e._id,
        vehicleNumber: e.vehicleNumber,
        userId: e.userId,
        slot: e.slotId ? slotMap.get(e.slotId.toString()) || null : null,
        checkInTime: e.checkInTime,
        checkOutTime: e.checkOutTime,
        durationMinutes: e.durationMinutes,
        date: e.createdAt,
      }));

      return res.json({ entries: result });
    } catch (err) {
      console.error('getMyHistory error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Admin: search by vehicle number to find user, slot, status, last entry
  async function searchVehicle(req, res) {
    try {
      const { vehicle } = req.query;
      if (!vehicle) return res.status(400).json({ message: 'vehicle query required' });

      const v = vehicle.trim().toUpperCase();

      const slot = await ParkingSlot.findOne({ carNumber: new RegExp(`^${v}$`, 'i') });
      const lastEntry = await EntryExit.findOne({ vehicleNumber: new RegExp(`^${v}$`, 'i') }).sort({ createdAt: -1 }).lean();

      // try find user by vehicle in vehicles array or vehicleNo/defaultVehicleNo
      const user = await User.findOne({
        $or: [
          { vehicleNo: new RegExp(`^${v}$`, 'i') },
          { defaultVehicleNo: new RegExp(`^${v}$`, 'i') },
          { 'vehicles.number': new RegExp(`^${v}$`, 'i') },
        ],
      }, 'name email employeeId role');

      return res.json({ vehicle: v, user, slot: slot ? { id: slot._id, area: slot.areaName, slotNumber: slot.slotNumber, status: slot.status } : null, lastEntry });
    } catch (err) {
      console.error('searchVehicle error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return { getMyHistory, searchVehicle };
}

module.exports = { createHistoryController };
