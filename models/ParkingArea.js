const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: Number,
  occupied: Boolean,
  carNumber: String,
  history: [Object]
});

const parkingAreaSchema = new mongoose.Schema({
  name: String,
  slots: [slotSchema]
});

module.exports = mongoose.model('ParkingArea', parkingAreaSchema);