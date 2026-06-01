const EntryExit = require('../models/EntryExit');
const ParkingSlot = require('../models/ParkingSlot');
const VisitorPass = require('../models/VisitorPass');

function createAnalyticsController() {
  async function usageLastNDays(days = 7) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    // aggregate check-ins per day
    const pipelineIn = [
      { $match: { checkInTime: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];

    const pipelineOut = [
      { $match: { checkOutTime: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkOutTime' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];

    const [ins, outs] = await Promise.all([
      EntryExit.aggregate(pipelineIn),
      EntryExit.aggregate(pipelineOut),
    ]);

    // build full days list
    const daysArr = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      daysArr.push(d.toISOString().slice(0, 10));
    }

    const insMap = Object.fromEntries(ins.map((r) => [r._id, r.count]));
    const outsMap = Object.fromEntries(outs.map((r) => [r._id, r.count]));

    const series = daysArr.map((d) => ({ date: d, entries: insMap[d] || 0, exits: outsMap[d] || 0 }));

    return { series };
  }

  async function peakHoursLastNDays(days = 7) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const pipeline = [
      { $match: { checkInTime: { $gte: start } } },
      { $project: { hour: { $hour: '$checkInTime' } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ];

    const rows = await EntryExit.aggregate(pipeline);
    return { topHours: rows.map((r) => ({ hour: r._id, count: r.count })) };
  }

  async function occupancyTrendLastNDays(days = 7) {
    // Approximate occupancy by counting occupied/reserved slots per day snapshot using EntryExit timestamps
    // Simpler approach: return current occupancy and total slots
    const totalSlots = await ParkingSlot.countDocuments();
    const occupied = await ParkingSlot.countDocuments({ $or: [{ status: 'occupied' }, { occupied: true }] });
    return { totalSlots, occupied, occupancyPercent: totalSlots ? Math.round((occupied / totalSlots) * 100) : 0 };
  }

  async function recentVisitorPasses(limit = 10) {
    const rows = await VisitorPass.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return { recent: rows };
  }

  async function departmentStats() {
    const User = require('../models/User');
    const PermanentReservation = require('../models/PermanentReservation');

    // users per department
    const usersAgg = await User.aggregate([
      { $group: { _id: { $ifNull: ['$department', 'Unassigned'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // permanent reservations grouped by user department
    const permAgg = await PermanentReservation.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$user.department', 'Unassigned'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const usersMap = Object.fromEntries(usersAgg.map((r) => [r._id, r.count]));
    const permMap = Object.fromEntries(permAgg.map((r) => [r._id, r.count]));

    const departments = Array.from(new Set([...Object.keys(usersMap), ...Object.keys(permMap)])).map((dept) => ({
      department: dept,
      users: usersMap[dept] || 0,
      permanentReservations: permMap[dept] || 0,
    }));

    return { departments };
  }

  return {
    usageLastNDays,
    peakHoursLastNDays,
    occupancyTrendLastNDays,
    recentVisitorPasses,
    departmentStats,
  };
}

module.exports = { createAnalyticsController };
