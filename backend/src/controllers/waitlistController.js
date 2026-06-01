const WaitlistEntry = require('../models/WaitlistEntry');
const { emitParkingUpdate } = require('../services/realtime');

function createWaitlistController() {
  async function join(req, res) {
    try {
      const { areaName, vehicleNumber } = req.body;
      if (!areaName) return res.status(400).json({ message: 'areaName required' });

      const existing = await WaitlistEntry.findOne({ userId: req.user.id, areaName });
      if (existing) return res.status(409).json({ message: 'Already on waitlist for this area' });

      const entry = await WaitlistEntry.create({ userId: req.user.id, vehicleNumber, areaName });
      emitParkingUpdate({ type: 'waitlist:joined', area: areaName });
      return res.status(201).json({ entry });
    } catch (err) {
      console.error('waitlist join error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function leave(req, res) {
    try {
      const { areaName } = req.body;
      if (!areaName) return res.status(400).json({ message: 'areaName required' });

      await WaitlistEntry.deleteOne({ userId: req.user.id, areaName });
      emitParkingUpdate({ type: 'waitlist:left', area: areaName });
      return res.json({ ok: true });
    } catch (err) {
      console.error('waitlist leave error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function myEntries(req, res) {
    try {
      const entries = await WaitlistEntry.find({ userId: req.user.id }).sort({ requestedAt: 1 }).lean();
      return res.json({ entries });
    } catch (err) {
      console.error('waitlist myEntries error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function listForArea(req, res) {
    try {
      const { areaName } = req.query;
      if (!areaName) return res.status(400).json({ message: 'areaName required' });
      const list = await WaitlistEntry.find({ areaName }).sort({ requestedAt: 1 }).limit(100).populate('userId', 'name email');
      return res.json({ list });
    } catch (err) {
      console.error('waitlist listForArea error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return { join, leave, myEntries, listForArea };
}

module.exports = { createWaitlistController };
