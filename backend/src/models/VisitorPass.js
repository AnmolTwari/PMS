const mongoose = require('mongoose');

const VisitorPassSchema = new mongoose.Schema({
  visitorName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
  qrData: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active','used','expired','cancelled'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('VisitorPass', VisitorPassSchema);
