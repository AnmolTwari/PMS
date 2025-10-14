const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: Boolean,
  carNumber: String,
  bookingTime: Date,

  // 🆕 Permanent reservation fields
  isPermanent: { type: Boolean, default: false },
  permanentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
