const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  name: { type: String, required: true },
  details: { type: String, default: "" }, // e.g. PUBG Character UIDs or Squad names
  kills: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
