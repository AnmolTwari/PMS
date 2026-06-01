const mongoose = require('mongoose');

const RecurringReservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  areaName: { type: String, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
  activeDays: [{ type: String }], // e.g., ['Monday','Tuesday']
  startTime: { type: String, required: true }, // '09:00'
  endTime: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  note: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RecurringReservation', RecurringReservationSchema);
