const mongoose = require('mongoose');

const ParkingPassSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  passType: { type: String, enum: ['student', 'employee'], default: 'employee' },
  vehicleNumber: { type: String, required: true },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  status: { type: String, enum: ['active','revoked','expired'], default: 'active' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qrData: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ParkingPass', ParkingPassSchema);
