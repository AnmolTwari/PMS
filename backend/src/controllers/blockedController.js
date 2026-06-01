function createBlockedController({ BlockedVehicleModel }) {
  async function check(vehicleNumberRaw) {
    if (!vehicleNumberRaw) return { blocked: false, record: null };

    const normalized = String(vehicleNumberRaw).trim().toUpperCase();
    const now = new Date();
    const record = await BlockedVehicleModel.findOne({
      vehicleNumber: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: 'active',
      $or: [
        { endDate: null },
        { endDate: { $exists: false } },
        { endDate: { $gte: now } },
      ],
    }).lean();

    return { blocked: !!record, record };
  }

  async function list({ page = 1, limit = 50, vehicleNumber, status, from, to } = {}) {
    const query = {};
    if (vehicleNumber) query.vehicleNumber = new RegExp(vehicleNumber, 'i');
    if (status) query.status = status;
    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);

    const skip = (page - 1) * limit;
    let q = BlockedVehicleModel.find(query).populate('issuedBy', 'name username email').sort({ createdAt: -1 });
    if (limit && limit > 0) q = q.skip(skip).limit(limit);
    const rows = await q.lean();
    const total = await BlockedVehicleModel.countDocuments(query);
    return { rows, total };
  }

  async function create(data, user) {
    const rec = new BlockedVehicleModel({ ...data, issuedBy: user?._id });
    await rec.save();
    return rec.toObject();
  }

  async function lift(id, user) {
    const rec = await BlockedVehicleModel.findById(id);
    if (!rec) throw new Error('Blocked vehicle not found');
    rec.status = 'lifted';
    await rec.save();
    return rec.toObject();
  }

  return { check, list, create, lift };
}

module.exports = { createBlockedController };
