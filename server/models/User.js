const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  recoveryPasswordHash: { type: String, required: true },
  recoverySalt: { type: String, required: true },
  hashVersion: { type: Number, default: 0 }, // 0 = legacy 1k PBKDF2, 1 = 600k PBKDF2
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
