const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlockedVehicleSchema = new Schema({
  vehicleNumber: { type: String, required: true, index: true },
  reason: { type: String },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'lifted'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('BlockedVehicle', BlockedVehicleSchema);
