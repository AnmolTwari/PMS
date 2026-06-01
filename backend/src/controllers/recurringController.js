const RecurringReservation = require('../models/RecurringReservation');
const ParkingSlot = require('../models/ParkingSlot');

function createRecurringController() {
  async function listMine(req, res) {
    try {
      const list = await RecurringReservation.find({ userId: req.user.id, active: true }).lean();
      return res.json({ list });
    } catch (err) {
      console.error('recurring listMine error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function create(req, res) {
    try {
      const { areaName, slotId, activeDays, startTime, endTime, note } = req.body;
      if (!areaName || !activeDays || !startTime || !endTime) return res.status(400).json({ message: 'Missing fields' });

      // If slotId provided ensure exists
      if (slotId) {
        const slot = await ParkingSlot.findById(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
      }

      const rec = await RecurringReservation.create({ userId: req.user.id, areaName, slotId, activeDays, startTime, endTime, note });
      return res.status(201).json({ rec });
    } catch (err) {
      console.error('recurring create error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function cancel(req, res) {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ message: 'id required' });

      const rec = await RecurringReservation.findById(id);
      if (!rec) return res.status(404).json({ message: 'Recurring reservation not found' });
      if (rec.userId.toString() !== req.user.id && !['admin','superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });

      rec.active = false;
      await rec.save();
      return res.json({ ok: true });
    } catch (err) {
      console.error('recurring cancel error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return { listMine, create, cancel };
}

module.exports = { createRecurringController };
