const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: Boolean,
  carNumber: String,
  bookingTime: Date,
}, { timestamps: true }); // ← This adds createdAt and updatedAt


module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
