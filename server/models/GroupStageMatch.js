const mongoose = require('mongoose');

const groupStageMatchSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  matchNumber: { type: Number, required: true },
  dayNumber: { type: Number, required: true, default: 1 },
  matchDate: { type: Date, required: true, default: Date.now },
  matchup: { type: String, required: true },
  map: { type: String, enum: ['Erangel', 'Miramar', 'Rondo'], required: true },
  roomId: { type: String, default: "" },
  roomPassword: { type: String, default: "" },
  scores: [{
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    teamName: { type: String, required: true },
    kills: { type: Number, default: 0 },
    placement: { type: Number, default: 16 }
  }],
  isPlayed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupStageMatch', groupStageMatchSchema);
