const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  vehicleNo: { type: String, unique: true, required: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetPasswordToken: String,
  reserPasswordExpires: Date,

  assignedSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
