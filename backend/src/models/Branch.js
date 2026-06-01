const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  code: { type: String, unique: true, sparse: true },
  address: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
