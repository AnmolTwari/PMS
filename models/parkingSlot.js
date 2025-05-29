const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: { type: Boolean, default: false },
  carNumber: { type: String, default: null }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
