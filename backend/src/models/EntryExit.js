const mongoose = require('mongoose');

const EntryExitSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  durationMinutes: { type: Number },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('EntryExit', EntryExitSchema);
