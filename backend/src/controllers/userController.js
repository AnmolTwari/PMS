const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const PermanentReservation = require('../models/PermanentReservation');
const WaitlistEntry = require('../models/WaitlistEntry');
const Notification = require('../models/Notification');
const EntryExit = require('../models/EntryExit');

function clearSlotState(slot) {
  slot.status = 'available';
  slot.occupied = false;
  slot.carNumber = null;
  slot.bookingTime = null;
  slot.bookingDate = null;
  slot.bookingSlotTime = null;
  slot.bookingMode = 'auto';
  slot.bookingUserId = null;
  slot.isPermanent = false;
  slot.permanentUserId = null;
}

function createUserController() {
  async function list(req, res) {
    try {
      const { branchCode, q } = req.query;
      const query = {};

      if (branchCode) query.branchCode = branchCode;
      if (q) {
        const regex = new RegExp(String(q).trim(), 'i');
        query.$or = [
          { name: regex },
          { username: regex },
          { email: regex },
          { employeeId: regex },
          { mobile: regex },
          { branchName: regex },
        ];
      }

      const users = await User.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ users });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to list users', error: err.message });
    }
  }

  async function remove(req, res) {
    try {
      const { id } = req.params;
      const actor = await User.findById(req.user.id);
      const target = await User.findById(id);

      if (!target) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (actor && String(actor._id) === String(target._id)) {
        return res.status(400).json({ message: 'You cannot delete your own account while signed in' });
      }

      if (target.role === 'superAdmin') {
        return res.status(403).json({ message: 'Super admin accounts cannot be deleted from here' });
      }

      const slots = await ParkingSlot.find({ $or: [{ bookingUserId: target._id }, { permanentUserId: target._id }, { carNumber: target.vehicleNo }, { carNumber: target.defaultVehicleNo }] });
      for (const slot of slots) {
        clearSlotState(slot);
        await slot.save();
      }

      await PermanentReservation.deleteMany({ userId: target._id });
      await WaitlistEntry.deleteMany({ userId: target._id });
      await Notification.deleteMany({ userId: target._id });
      await EntryExit.updateMany({ userId: target._id }, { $set: { userId: null } });

      await User.deleteOne({ _id: target._id });

      return res.json({ message: 'User deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
  }

  return { list, remove };
}

module.exports = { createUserController };
