const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const PermanentReservation = require('../models/PermanentReservation');
const { groupSlotsByArea, getVehicleNumbers, serializeUser } = require('../utils/parking');

function buildStatusData(slots) {
  const statusData = {};

  slots.forEach((slot) => {
    const status = slot.status || (slot.occupied ? 'occupied' : 'available');

    if (!statusData[slot.areaName]) {
      statusData[slot.areaName] = {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        disabled: 0,
        maintenance: 0,
      };
    }

    statusData[slot.areaName].total += 1;
    if (statusData[slot.areaName][status] !== undefined) {
      statusData[slot.areaName][status] += 1;
    }
  });

  return statusData;
}

function createDashboardController() {
  async function buildAdminDashboard(branchCode = 'MAIN') {
    const [users, slots, reservations] = await Promise.all([
      User.find({ branchCode }).sort({ createdAt: -1 }),
      ParkingSlot.find({ branchCode }).sort({ parkingAreaId: 1, slotNumber: 1 }),
      PermanentReservation.find({ branchCode }).sort({ createdAt: -1 }),
    ]);

    const statusData = buildStatusData(slots);

    return {
      users: users.map(serializeUser),
      slots,
      reservations,
      slotsByArea: groupSlotsByArea(slots),
      statusData,
    };
  }

  async function buildAdminStats(branchCode = 'MAIN') {
    const EntryExit = require('../models/EntryExit');
    const VisitorPass = require('../models/VisitorPass');
    const WaitlistEntry = require('../models/WaitlistEntry');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      totalUsers,
      totalSlots,
      slotsByStatusAgg,
      totalPermanentReservations,
      activeVisitorPasses,
      todaysEntries,
      todaysExits,
      waitlistCount,
    ] = await Promise.all([
      User.countDocuments({ branchCode }),
      ParkingSlot.countDocuments({ branchCode }),
      ParkingSlot.aggregate([
        { $match: { branchCode } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PermanentReservation.countDocuments({ branchCode }),
      VisitorPass.countDocuments({ status: 'active', branchCode }),
      EntryExit.countDocuments({ checkInTime: { $gte: startOfDay, $lt: endOfDay } }),
      EntryExit.countDocuments({ checkOutTime: { $gte: startOfDay, $lt: endOfDay } }),
      WaitlistEntry.countDocuments(),
    ]);

    const slotsByStatus = slotsByStatusAgg.reduce((acc, cur) => {
      acc[cur._id || 'unknown'] = cur.count;
      return acc;
    }, {});

    return {
      totalUsers,
      totalSlots,
      slotsByStatus,
      totalPermanentReservations,
      activeVisitorPasses,
      todaysEntries,
      todaysExits,
      waitlistCount,
    };
  }

  async function buildUserDashboard(user) {
    const branchCode = user?.branchCode || 'MAIN';
    const [slots, permanentReservation] = await Promise.all([
      ParkingSlot.find({ branchCode }).sort({ parkingAreaId: 1, slotNumber: 1 }),
      PermanentReservation.findOne({ userId: user._id, branchCode }).populate('slotId'),
    ]);

    const vehicleNumbers = getVehicleNumbers(user);
    const bookedSlot = vehicleNumbers.length
      ? await ParkingSlot.findOne({
          carNumber: { $in: vehicleNumbers },
          status: { $in: ['occupied', 'reserved'] },
        })
      : null;
    const statusData = buildStatusData(slots);

    Object.keys(statusData).forEach((area) => {
      const areaData = statusData[area];
      areaData.occupancy = Math.round(((areaData.occupied + areaData.reserved) / areaData.total) * 100);
    });

    return {
      profile: serializeUser(user),
      slots,
      slotsByArea: groupSlotsByArea(slots),
      bookedSlot: bookedSlot ? bookedSlot.toObject() : null,
      statusData,
      vehicles: serializeUser(user)?.vehicles || [],
      permanentReservation: permanentReservation
        ? {
            id: permanentReservation._id,
            areaName: permanentReservation.areaName,
            slotNumber: permanentReservation.slotNumber,
            activeDays: permanentReservation.activeDays,
            startTime: permanentReservation.startTime,
            endTime: permanentReservation.endTime,
            slotId: permanentReservation.slotId,
          }
        : null,
    };
  }

  return {
    buildAdminDashboard,
    buildAdminStats,
    buildUserDashboard,
  };
}

module.exports = {
  createDashboardController,
};