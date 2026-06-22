if (!process.env.VERCEL) {
  const dns = require('dns');
  dns.setServers(['1.1.1.1', '1.0.0.1']);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Upload Helper
const uploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("Cloudinary environment variables not set. Using local fallback path.");
      const filename = path.basename(filePath);
      return `/uploads/${filename}`;
    }
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'esports_receipts'
    });
    // Remove local file after successful upload to Cloudinary
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting local file after upload:", err);
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw new Error("Failed to upload image receipt to cloud storage.");
  }
};

const Event = require('./models/Event');
const Registration = require('./models/Registration');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

// Express Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Helper and Middleware
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esports';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false
  });
};

const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware failed:', err);
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
};

app.use(ensureDbConnected);

// Ensure uploads directory exists (use /tmp in serverless environment)
const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


// Admin Passcode Protection Middleware
const requireAdmin = (req, res, next) => {
  const passcode = req.headers['x-admin-passcode'];
  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Access Denied: Invalid admin passcode' });
  }
  next();
};

/* ==========================================================================
   PUBLIC & PLAYER ENDPOINTS
   ========================================================================== */

// 1. Get the current active event
app.get('/api/events/active', async (req, res) => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(404).json({ message: 'No active tournament event found' });
    }
    res.json(activeEvent);
  } catch (err) {
    console.error('Error fetching active event:', err);
    res.status(500).json({ error: 'Failed to retrieve active event' });
  }
});

// 1.5 Get all upcoming events
app.get('/api/events/upcoming', async (req, res) => {
  try {
    const upcomingEvents = await Event.find().sort({ matchStartTime: 1 });
    res.json(upcomingEvents);
  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    res.status(500).json({ error: 'Failed to retrieve upcoming events' });
  }
});

// 2. Register for a tournament (Upload payment screenshot to Cloudinary)
app.post('/api/registrations', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(400).json({ error: 'Registrations are disabled. No active tournament is currently running.' });
    }

    // Check registration deadline
    if (new Date() > new Date(activeEvent.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed for this tournament.' });
    }

    const { registrationType, allCharacterIds, allInGameNames, contactPhoneNumber, whatsappNumber, transactionId } = req.body;
    if (!registrationType || !allCharacterIds || !allInGameNames || !contactPhoneNumber || !whatsappNumber || !transactionId) {
      return res.status(400).json({ error: 'Missing required registration details.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Transfer receipt screenshot image is required.' });
    }

    // Parse character IDs
    let uids = [];
    if (typeof allCharacterIds === 'string') {
      try {
        uids = JSON.parse(allCharacterIds);
      } catch (e) {
        uids = allCharacterIds.split(',').map(uid => uid.trim()).filter(Boolean);
      }
    } else if (Array.isArray(allCharacterIds)) {
      uids = allCharacterIds;
    }

    // Parse In-Game Names
    let igNames = [];
    if (typeof allInGameNames === 'string') {
      try {
        igNames = JSON.parse(allInGameNames);
      } catch (e) {
        igNames = allInGameNames.split(',').map(name => name.trim()).filter(Boolean);
      }
    } else if (Array.isArray(allInGameNames)) {
      igNames = allInGameNames;
    }

    if (uids.length < 1 || igNames.length < 1) {
      return res.status(400).json({ error: 'You must register at least 1 player with Character UID and In-game Name.' });
    }

    if (registrationType === 'Solo' && (uids.length !== 1 || igNames.length !== 1)) {
      return res.status(400).json({ error: 'Solo registrations must contain exactly 1 player.' });
    }

    const trackingUid = uids[0]; // The first entered UID is the tracking index key
    
    // Check if tracking UID has already registered for this active event
    const existing = await Registration.findOne({ 
      eventId: activeEvent._id,
      $or: [
        { trackingUid: trackingUid },
        { allCharacterIds: trackingUid }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: `Character ID ${trackingUid} is already registered (or pending validation) for this tournament.` });
    }

    // Upload to Cloudinary
    const paymentScreenshotUrl = await uploadToCloudinary(req.file.path);

    const newReg = new Registration({
      eventId: activeEvent._id,
      registrationType,
      trackingUid,
      allCharacterIds: uids,
      allInGameNames: igNames,
      contactPhoneNumber,
      whatsappNumber,
      transactionId,
      paymentScreenshot: paymentScreenshotUrl,
      paymentStatus: 'Pending'
    });

    await newReg.save();
    res.status(201).json({ 
      message: 'Registration form received! Access credentials later using searched Character IDs.',
      registration: newReg
    });
  } catch (err) {
    console.error('Error during registration creation:', err);
    res.status(500).json({ error: err.message || 'Failed to submit registration. Please verify details.' });
  }
});

// 3. Dynamic Portal Lookup Engine (GET /api/registrations/portal/:uid)
app.get('/api/registrations/portal/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Find the registration matching either trackingUid, inside allCharacterIds, or direct _id
    let queryConditions = [
      { trackingUid: uid },
      { allCharacterIds: uid }
    ];
    if (mongoose.Types.ObjectId.isValid(uid)) {
      queryConditions.push({ _id: uid });
    }

    const registration = await Registration.findOne({
      $or: queryConditions
    }).populate('eventId');

    if (!registration) {
      return res.status(404).json({ error: 'No registration records found for this PUBG Character ID.' });
    }

    const linkedEvent = registration.eventId;
    if (!linkedEvent) {
      return res.status(404).json({ error: 'No tournament event details found for this registration.' });
    }

    // Build conditional payload response
    const responsePayload = {
      _id: registration._id,
      trackingUid: registration.trackingUid,
      allCharacterIds: registration.allCharacterIds,
      contactPhoneNumber: registration.contactPhoneNumber,
      paymentScreenshot: registration.paymentScreenshot,
      paymentStatus: registration.paymentStatus,
      matchProofScreenshot: registration.matchProofScreenshot,
      createdAt: registration.createdAt,
      event: {
        title: linkedEvent.title,
        soloEntryFee: linkedEvent.soloEntryFee,
        teamEntryFee: linkedEvent.teamEntryFee,
        numberOfDays: linkedEvent.numberOfDays,
        registrationDeadline: linkedEvent.registrationDeadline,
        matchStartTime: linkedEvent.matchStartTime,
        // Expose credentials only if status is Approved AND details have been broadcasted by admin
        roomId: registration.paymentStatus === 'Approved' ? linkedEvent.roomId : '',
        roomPassword: registration.paymentStatus === 'Approved' ? linkedEvent.roomPassword : ''
      }
    };

    res.json(responsePayload);
  } catch (err) {
    console.error('Error searching registration portal:', err);
    res.status(500).json({ error: 'Server lookup engine error.' });
  }
});

// 4. Submit Post-Match Scoreboard Proof (POST /api/registrations/submit-proof)
app.post('/api/registrations/submit-proof', upload.single('matchProofScreenshot'), async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'PUBG Character ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Match proof scoreboard screenshot is required.' });
    }

    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(404).json({ error: 'No active tournament found.' });
    }

    // Strict validation 1: Check if UID belongs to an Approved registration connected to the active event
    const registration = await Registration.findOne({
      eventId: activeEvent._id,
      $or: [
        { trackingUid: uid },
        { allCharacterIds: uid }
      ]
    });

    if (!registration || registration.paymentStatus !== 'Approved') {
      return res.status(403).json({ error: 'Forbidden: Provided Character ID does not belong to an Approved registration for the active tournament.' });
    }

    // Strict validation 2: Check if matchProofScreenshot is already populated
    if (registration.matchProofScreenshot) {
      return res.status(400).json({ error: 'Bad Request: Match proof screenshot has already been submitted for this roster.' });
    }

    // Upload to Cloudinary
    const proofScreenshotUrl = await uploadToCloudinary(req.file.path);
    registration.matchProofScreenshot = proofScreenshotUrl;
    await registration.save();

    res.json({
      message: 'Match scoreboard proof uploaded successfully.',
      registration
    });
  } catch (err) {
    console.error('Error uploading match proof:', err);
    res.status(500).json({ error: err.message || 'Server upload engine error.' });
  }
});

/* ==========================================================================
   ADMIN PROTECTED ENDPOINTS (requireAdmin verification header check)
   ========================================================================== */

// Verify Admin Passcode
app.post('/api/admin/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE) {
    res.json({ success: true, message: 'Passcode verified successfully.' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid passcode entry.' });
  }
});

// Deploy a new tournament event
app.post('/api/admin/events', requireAdmin, async (req, res) => {
  try {
    const { title, soloEntryFee, teamEntryFee, numberOfDays, registrationDeadline, matchStartTime, isActive, status, map, description } = req.body;
    
    if (!title || soloEntryFee === undefined || teamEntryFee === undefined || !registrationDeadline || !matchStartTime) {
      return res.status(400).json({ error: 'Missing tournament parameter entries.' });
    }

    const newEvent = new Event({
      title,
      soloEntryFee: Number(soloEntryFee),
      teamEntryFee: Number(teamEntryFee),
      numberOfDays: numberOfDays !== undefined ? Number(numberOfDays) : 1,
      registrationDeadline: new Date(registrationDeadline),
      matchStartTime: new Date(matchStartTime),
      isActive: isActive !== undefined ? isActive : true,
      status: status || 'active',
      map: map || 'Erangel',
      description: description || ''
    });

    await newEvent.save();

    // If new event is set to active or live, update previous active/live events to upcoming
    if (newEvent.status === 'active') {
      await Event.updateMany(
        { _id: { $ne: newEvent._id } },
        { isActive: false }
      );
      await Event.updateMany(
        { _id: { $ne: newEvent._id }, status: 'active' },
        { status: 'upcoming' }
      );
    } else if (newEvent.status === 'live') {
      await Event.updateMany(
        { _id: { $ne: newEvent._id }, status: 'live' },
        { status: 'upcoming' }
      );
    }

    if (newEvent.isActive) {
      await Event.updateMany(
        { _id: { $ne: newEvent._id } },
        { isActive: false }
      );
    }

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: `Failed to deploy tournament: ${err.message}` });
  }
});

// Edit an existing tournament event
app.put('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, soloEntryFee, teamEntryFee, numberOfDays, registrationDeadline, matchStartTime, isActive, status, map, description } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (title) event.title = title;
    if (soloEntryFee !== undefined) event.soloEntryFee = Number(soloEntryFee);
    if (teamEntryFee !== undefined) event.teamEntryFee = Number(teamEntryFee);
    if (numberOfDays !== undefined) event.numberOfDays = Number(numberOfDays);
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
    if (matchStartTime) event.matchStartTime = new Date(matchStartTime);
    if (isActive !== undefined) event.isActive = isActive;
    if (status) event.status = status;
    if (map) event.map = map;
    if (description !== undefined) event.description = description;

    await event.save();

    // If active status is updated, maintain single active event logic
    if (event.status === 'active') {
      await Event.updateMany(
        { _id: { $ne: event._id } },
        { isActive: false }
      );
      await Event.updateMany(
        { _id: { $ne: event._id }, status: 'active' },
        { status: 'upcoming' }
      );
      event.isActive = true;
      await event.save();
    } else if (event.status === 'live') {
      await Event.updateMany(
        { _id: { $ne: event._id }, status: 'live' },
        { status: 'upcoming' }
      );
    }

    if (event.isActive) {
      await Event.updateMany(
        { _id: { $ne: event._id } },
        { isActive: false }
      );
    }

    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: `Failed to update tournament: ${err.message}` });
  }
});

// Delete a tournament event
app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Delete all registrations connected to this tournament
    await Registration.deleteMany({ eventId: id });

    await Event.deleteOne({ _id: id });
    res.json({ success: true, message: 'Tournament and registered players deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete tournament.' });
  }
});

// Update active event's Room credentials (roomId, roomPassword)
app.put('/api/admin/events/active/lobby', requireAdmin, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(404).json({ error: 'No active event found to broadcast credentials.' });
    }

    activeEvent.roomId = roomId || "";
    activeEvent.roomPassword = roomPassword || "";
    await activeEvent.save();

    res.json({ message: 'Lobby credentials broadcasted successfully.', event: activeEvent });
  } catch (err) {
    console.error('Error updating lobby details:', err);
    res.status(500).json({ error: 'Failed to update lobby room details.' });
  }
});

// Update active event's standings Leaderboard HTML
app.put('/api/admin/events/active/leaderboard', requireAdmin, async (req, res) => {
  try {
    const { leaderboardHtml } = req.body;
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(404).json({ error: 'No active event found to attach leaderboard.' });
    }

    activeEvent.leaderboardHtml = leaderboardHtml || "";
    await activeEvent.save();

    res.json({ message: 'Leaderboard HTML updated successfully.', event: activeEvent });
  } catch (err) {
    console.error('Error updating leaderboard html:', err);
    res.status(500).json({ error: 'Failed to save leaderboard HTML.' });
  }
});

// Fetch pending registrations queue
app.get('/api/admin/registrations/pending', requireAdmin, async (req, res) => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.json([]);
    }

    const pendings = await Registration.find({
      eventId: activeEvent._id,
      paymentStatus: 'Pending'
    }).sort({ createdAt: 1 }); // Chronological order

    res.json(pendings);
  } catch (err) {
    console.error('Error fetching pending registrations:', err);
    res.status(500).json({ error: 'Failed to fetch pending registration validations.' });
  }
});

// Fetch approved registrations list
app.get('/api/admin/registrations/approved', requireAdmin, async (req, res) => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.json([]);
    }

    const approveds = await Registration.find({
      eventId: activeEvent._id,
      paymentStatus: 'Approved'
    }).sort({ createdAt: 1 });

    res.json(approveds);
  } catch (err) {
    console.error('Error fetching approved registrations:', err);
    res.status(500).json({ error: 'Failed to fetch approved registrations list.' });
  }
});

// Approve or Reject registration status
app.put('/api/admin/registrations/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status value.' });
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration record not found.' });
    }

    registration.paymentStatus = status;
    await registration.save();

    res.json({ message: `Registration status updated to ${status} successfully.`, registration });
  } catch (err) {
    console.error('Error updating registration status:', err);
    res.status(500).json({ error: 'Failed to audit registration status.' });
  }
});

// Fetch match proof screenshots
app.get('/api/admin/registrations/proofs', requireAdmin, async (req, res) => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.json([]);
    }

    const proofs = await Registration.find({
      eventId: activeEvent._id,
      matchProofScreenshot: { $ne: "" }
    }).sort({ createdAt: -1 });

    res.json(proofs);
  } catch (err) {
    console.error('Error fetching match proofs:', err);
    res.status(500).json({ error: 'Failed to fetch match proof screens.' });
  }
});

// Start express server only if run directly (e.g. not under Vercel serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Esports server backend running on port ${PORT}`);
  });
}

module.exports = app;
