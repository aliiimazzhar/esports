const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  soloEntryFee: { type: Number, required: true },
  teamEntryFee: { type: Number, required: true },
  numberOfDays: { type: Number, default: 1 },
  roomId: { type: String, default: "" },
  roomPassword: { type: String, default: "" },
  isActive: { type: Boolean, default: true }, // Setting a new event to true flags all others to false
  status: { type: String, enum: ['upcoming', 'active', 'live', 'ended'], default: 'active' },
  map: { type: String, enum: ['Erangel', 'Livik', 'Miramar', 'Rondo', 'Sanhok'], default: 'Erangel' },
  type: { type: String, enum: ['Solo', 'Squad'], default: 'Squad' },
  description: { type: String, default: "" },
  
  // Precise Date & Time Settings
  registrationDeadline: { type: Date, required: true },
  matchStartTime: { type: Date, required: true },
  
  leaderboardHtml: { type: String, default: "" }, // Raw HTML/Markdown container for pasting manual rankings
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
