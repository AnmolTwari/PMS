const ParkingPass = require('../models/ParkingPass');
const User = require('../models/User');

function createPassController() {
  async function listPasses(filter = {}, limit = 100) {
    return ParkingPass.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  }

  async function createPass({ userId, passType, vehicleNumber, validFrom, validTo, issuedBy, qrData }) {
    const pass = new ParkingPass({ userId, passType, vehicleNumber, validFrom, validTo, issuedBy, qrData });
    await pass.save();
    return pass.toObject();
  }

  async function revokePass(passId, byUserId) {
    const pass = await ParkingPass.findById(passId);
    if (!pass) throw new Error('Pass not found');
    pass.status = 'revoked';
    await pass.save();
    return pass.toObject();
  }

  async function getUserPasses(userId) {
    return ParkingPass.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  return { listPasses, createPass, revokePass, getUserPasses };
}

module.exports = { createPassController };
