// // models/Slot.js

// const mongoose = require('mongoose');

// const slotSchema = new mongoose.Schema({
//   slotNumber: Number,
//   occupied: Boolean,
//   carNumber: String,
//   parkingArea: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea' },
//   history: {
//     type: [
//       {
//         action: String,
//         carNumber: String,
//         time: { type: Date, default: Date.now }
//       }
//     ],
//     default: []
//   }
// });

// module.exports = mongoose.model('Slot', slotSchema);


const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: { type: Boolean, default: false },
  carNumber: { type: String, default: null },
});

module.exports = mongoose.model('Slot', slotSchema);
