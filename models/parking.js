const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNumber: String,
  vehicleType: String,
  slotNumber: String,
  parkedAt: Date,
  status: { type: String, default: 'parked' }
});

module.exports = mongoose.model('Parking', parkingSchema);
