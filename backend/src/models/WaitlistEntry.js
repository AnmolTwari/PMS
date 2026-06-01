const mongoose = require('mongoose');

const WaitlistEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNumber: { type: String },
  areaName: { type: String },
  requestedAt: { type: Date, default: Date.now },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('WaitlistEntry', WaitlistEntrySchema);
