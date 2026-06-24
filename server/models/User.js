const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, required: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  recoveryPasswordHash: { type: String, required: true },
  recoverySalt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
