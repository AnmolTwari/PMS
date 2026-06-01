const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  branchName: { type: String, default: 'Main Branch', index: true },
  branchCode: { type: String, default: 'MAIN', index: true },
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'disabled', 'maintenance'],
    default: 'available',
  },
  occupied: { type: Boolean, default: false },
  carNumber: String,
  bookingTime: Date,
  bookingDate: String,
  bookingSlotTime: String,
  bookingMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  bookingUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPermanent: { type: Boolean, default: false },
  permanentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

parkingSlotSchema.index({ parkingAreaId: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ branchCode: 1, parkingAreaId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);