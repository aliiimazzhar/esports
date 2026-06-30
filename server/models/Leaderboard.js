const mongoose = require('mongoose');

const squadPlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uid: { type: String, required: true },
  kills: { type: Number, default: 0 }
});

const teamEntrySchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  teamNumber: { type: Number, required: true },
  teamName: { type: String, required: true },
  players: [squadPlayerSchema], // array of players (e.g. 4 for squad)
  kills: { type: Number, default: 0 },
  placementPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 }
});

const leaderboardSchema = new mongoose.Schema({
  tournamentName: { type: String, required: true },
  dayNumber: { type: Number, required: true },
  type: { type: String, enum: ['Solo', 'Squad'], default: 'Squad' },
  teams: [teamEntrySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
