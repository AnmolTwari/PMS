const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  vehicleNo: { type: String, unique: true, sparse: true, required: false },
  defaultVehicleNo: { type: String, default: null },
  vehicles: {
    type: [
      {
        number: { type: String, required: true },
        type: { type: String, enum: ['Car', 'Bike', 'EV'], default: 'Car' },
        model: { type: String, default: '' },
        color: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  role: { type: String, enum: ['superAdmin', 'admin', 'securityGuard', 'employee', 'student', 'visitor'], default: 'visitor' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetOtp: String,
  resetOtpExpires: Date,
  department: { type: String },
  branchName: { type: String, default: 'Main Branch' },
  branchCode: { type: String, default: 'MAIN' },
  assignedSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    default: null,
  },
  isLoggedIn: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);