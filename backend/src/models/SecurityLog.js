const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String },
  ip: { type: String },
  method: { type: String },
  path: { type: String },
  status: { type: Number },
  body: { type: mongoose.Schema.Types.Mixed },
  meta: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);
