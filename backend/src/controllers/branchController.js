const Branch = require('../models/Branch');

function createBranchController() {
  async function list() {
    const branches = await Branch.find({}).sort({ isDefault: -1, name: 1 }).lean();
    return { branches };
  }

  async function create(data) {
    const name = String(data?.name || '').trim();
    if (!name) throw new Error('Branch name is required');

    const code = String(data?.code || name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const address = String(data?.address || '').trim();
    const existing = await Branch.findOne({ $or: [{ name: new RegExp(`^${name}$`, 'i') }, { code }] }).lean();
    if (existing) throw new Error('Branch already exists');

    const branch = await Branch.create({ name, code, address, isDefault: false, isActive: true });
    return branch.toObject();
  }

  async function getDefault() {
    const branch = await Branch.findOne({ isDefault: true }).lean();
    return branch || null;
  }

  return { list, create, getDefault };
}

module.exports = { createBranchController };
