const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registrationType: { type: String, enum: ['Solo', 'Team'], required: true },
  trackingUid: { type: String, required: true }, // The first UID entered (acts as primary key)
  allCharacterIds: [{ type: String, required: true }], // Stores all UIDs
  allInGameNames: [{ type: String, required: true }], // Stores IG Names corresponding to UIDs
  contactPhoneNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentScreenshot: { type: String, required: true }, // Cloudinary URL
  paymentStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  matchProofScreenshot: { type: String, default: "" }, // Uploaded post-match by the player
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);
