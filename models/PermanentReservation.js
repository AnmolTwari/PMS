const mongoose = require('mongoose');

const permanentReservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  areaName: {
    type: String,
    required: true
  },
  slotNumber: {
    type: Number,
    required: true
  },
  activeDays: {
    type: [String], // ['Monday', 'Tuesday', ...]
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  startTime: {
    type: String, // Format: "09:00"
    default: "09:00"
  },
  endTime: {
    type: String, // Format: "18:00"
    default: "18:00"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PermanentReservation', permanentReservationSchema);
