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
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');

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
const User = require('./models/User');
const Leaderboard = require('./models/Leaderboard');
const crypto = require('crypto');

/* ==========================================================================
   SECURITY UTILITIES
   ========================================================================== */

// FIX 5: Regex injection escape utility
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// FIX 2: PBKDF2 hashing — supports two iteration counts for migration
const HASH_ITERATIONS_LEGACY = 1000;
const HASH_ITERATIONS_CURRENT = 600000;

function hashPassword(password, salt, iterations = HASH_ITERATIONS_CURRENT) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// FIX 3: JWT token utilities
const JWT_SECRET = process.env.JWT_SECRET || 'esports_jwt_fallback_secret_change_in_production';

function generateToken(uid) {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

// FIX 4: Restricted CORS
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) or from allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Admin-Passcode', 'Authorization']
}));
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

/* ==========================================================================
   MIDDLEWARE: Admin Passcode + User Auth
   ========================================================================== */

// Admin Passcode Protection Middleware
const requireAdmin = (req, res, next) => {
  const passcode = req.headers['x-admin-passcode'];
  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Access Denied: Invalid admin passcode' });
  }
  next();
};

// FIX 3: User JWT Auth Middleware
const requireUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Valid session token required.' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
  }
  req.userUid = decoded.uid;
  next();
};

/* ==========================================================================
   FIX 1: RATE LIMITERS
   ========================================================================== */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many account registrations. Please try again in 15 minutes.' }
});

const adminPasscodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin passcode attempts. Please try again in 15 minutes.' }
});

const registrationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration submissions. Please try again later.' }
});

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

// 1.2 Get dynamic leaderboard for the active event
app.get('/api/events/active/leaderboard', async (req, res) => {
  try {
    // FIX 10: Use status field instead of isActive alone
    const activeEvent = await Event.findOne({ status: { $in: ['active', 'live'] } });
    if (!activeEvent) {
      return res.status(404).json({ error: 'No active tournament found.' });
    }

    let registrations = await Registration.find({
      eventId: activeEvent._id,
      paymentStatus: 'Approved'
    });

    // Custom sorting: rank (asc) first, then points/kills (desc)
    registrations.sort((a, b) => {
      const rankA = a.rank;
      const rankB = b.rank;
      const hasRankA = rankA !== null && rankA !== undefined;
      const hasRankB = rankB !== null && rankB !== undefined;

      if (hasRankA && !hasRankB) return -1;
      if (!hasRankA && hasRankB) return 1;
      if (hasRankA && hasRankB) {
        if (rankA !== rankB) return rankA - rankB;
      }

      if (activeEvent.type === 'Squad') {
        const sumKillsA = (a.playerKills || []).reduce((sum, k) => sum + (k || 0), 0);
        const sumKillsB = (b.playerKills || []).reduce((sum, k) => sum + (k || 0), 0);
        return sumKillsB - sumKillsA;
      } else {
        return (b.points || 0) - (a.points || 0);
      }
    });

    res.json({
      event: activeEvent,
      standings: registrations
    });
  } catch (err) {
    console.error('Error fetching dynamic leaderboard:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard data.' });
  }
});

// 1.5 Get all events (upcoming, active, live, ended)
app.get('/api/events/upcoming', async (req, res) => {
  try {
    const upcomingEvents = await Event.find().sort({ matchStartTime: 1 });
    res.json(upcomingEvents);
  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    res.status(500).json({ error: 'Failed to retrieve upcoming events' });
  }
});

// 1.6 Get tournament report (any event by ID)
app.get('/api/events/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const registrations = await Registration.find({
      eventId: id,
      paymentStatus: 'Approved'
    });

    registrations.sort((a, b) => {
      const rankA = a.rank;
      const rankB = b.rank;
      const hasRankA = rankA !== null && rankA !== undefined;
      const hasRankB = rankB !== null && rankB !== undefined;

      if (hasRankA && !hasRankB) return -1;
      if (!hasRankA && hasRankB) return 1;
      if (hasRankA && hasRankB) {
        if (rankA !== rankB) return rankA - rankB;
      }

      if (event.type === 'Squad') {
        const sumKillsA = (a.playerKills || []).reduce((sum, k) => sum + (k || 0), 0);
        const sumKillsB = (b.playerKills || []).reduce((sum, k) => sum + (k || 0), 0);
        if (sumKillsB !== sumKillsA) return sumKillsB - sumKillsA;
      }
      return (b.points || 0) - (a.points || 0);
    });

    const winner = registrations.length > 0 ? registrations[0] : null;
    const totalPlayersCount = registrations.reduce((sum, reg) => sum + (reg.allCharacterIds ? reg.allCharacterIds.length : 0), 0);

    res.json({
      event,
      winner,
      totalPlayersCount,
      registrations
    });
  } catch (err) {
    console.error('Error fetching tournament report:', err);
    res.status(500).json({ error: 'Failed to retrieve tournament report' });
  }
});

// 2. Register for a tournament (Upload payment screenshot to Cloudinary)
// FIX 8: Accepts optional eventId to target a specific tournament
app.post('/api/registrations', registrationLimiter, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    let targetEvent;

    if (req.body.eventId) {
      // Player specified which tournament to register for
      targetEvent = await Event.findById(req.body.eventId);
      if (!targetEvent) {
        return res.status(404).json({ error: 'Tournament not found.' });
      }
      if (targetEvent.status === 'ended' || targetEvent.status === 'live') {
        return res.status(400).json({ error: 'Registrations are closed for this tournament.' });
      }
    } else {
      // Fallback: target the currently active event
      targetEvent = await Event.findOne({ isActive: true });
      if (!targetEvent) {
        return res.status(400).json({ error: 'Registrations are disabled. No active tournament is currently running.' });
      }
    }

    // Check registration deadline
    if (new Date() > new Date(targetEvent.registrationDeadline)) {
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

    // Validate roster sizes based on registration type and tournament type
    if (targetEvent.type === 'Solo') {
      if (registrationType !== 'Solo' || uids.length !== 1 || igNames.length !== 1) {
        return res.status(400).json({ error: 'Solo tournaments only support individual (Solo) registrations.' });
      }
    } else if (targetEvent.type === 'Squad') {
      if (registrationType === 'Team' && (uids.length !== 4 || igNames.length !== 4)) {
        return res.status(400).json({ error: 'Squad registrations must contain exactly 4 players.' });
      }
      if (registrationType === 'Solo' && (uids.length !== 1 || igNames.length !== 1)) {
        return res.status(400).json({ error: 'Solo registrations must contain exactly 1 player.' });
      }
    }

    // Enforce max registration limit of 100 players total across all approved/pending rosters
    const activeRegistrations = await Registration.find({
      eventId: targetEvent._id,
      paymentStatus: { $ne: 'Rejected' }
    });

    let totalPlayersCount = 0;
    for (const reg of activeRegistrations) {
      totalPlayersCount += reg.allCharacterIds.length;
    }

    if (totalPlayersCount + uids.length > 100) {
      return res.status(400).json({ error: `Registration limit reached. Maximum players allowed is 100. Current total registered is ${totalPlayersCount} players.` });
    }

    // FIX 5: Validate UIDs using escaped regex to prevent injection
    for (const uid of uids) {
      const userExists = await User.findOne({ uid: { $regex: new RegExp(`^${escapeRegex(uid.trim())}$`, 'i') } });
      if (!userExists) {
        return res.status(400).json({ error: `Character UID "${uid}" must create an account / sign up on the site first.` });
      }
    }

    const trackingUid = uids[0];
    
    // Check if any of the UIDs have already registered for this event
    const existing = await Registration.findOne({ 
      eventId: targetEvent._id,
      $or: [
        { trackingUid: { $in: uids } },
        { allCharacterIds: { $in: uids } }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: `One or more Character UIDs in this roster are already registered (or pending validation) for this tournament.` });
    }

    // Upload to Cloudinary
    const paymentScreenshotUrl = await uploadToCloudinary(req.file.path);

    const newReg = new Registration({
      eventId: targetEvent._id,
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

// 3.5 Get all registrations for a user (GET /api/registrations/user/:uid)
app.get('/api/registrations/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const registrations = await Registration.find({
      $or: [
        { trackingUid: uid },
        { allCharacterIds: uid }
      ]
    }).populate('eventId');
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching user registrations:', err);
    res.status(500).json({ error: 'Server lookup error.' });
  }
});

// 4. Submit Post-Match Scoreboard Proof
// FIX 9: Accepts registrationId directly — no longer requires active event
app.post('/api/registrations/submit-proof', requireUser, upload.single('matchProofScreenshot'), async (req, res) => {
  try {
    const { registrationId } = req.body;
    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Match proof scoreboard screenshot is required.' });
    }

    // Find the registration by ID
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration record not found.' });
    }

    // Verify the authenticated user owns this registration
    if (!registration.allCharacterIds.includes(req.userUid) && registration.trackingUid !== req.userUid) {
      return res.status(403).json({ error: 'Forbidden: This registration does not belong to your account.' });
    }

    if (registration.paymentStatus !== 'Approved') {
      return res.status(403).json({ error: 'Forbidden: Only Approved registrations can submit match proof.' });
    }

    // Prevent duplicate submission
    if (registration.matchProofScreenshot) {
      return res.status(400).json({ error: 'Match proof screenshot has already been submitted for this roster.' });
    }

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
app.post('/api/admin/verify-passcode', adminPasscodeLimiter, (req, res) => {
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
    const { title, soloEntryFee, teamEntryFee, numberOfDays, registrationDeadline, matchStartTime, isActive, status, map, description, type } = req.body;
    
    if (!title || soloEntryFee === undefined || teamEntryFee === undefined || !registrationDeadline || !matchStartTime) {
      return res.status(400).json({ error: 'Missing tournament parameter entries.' });
    }

    const newStatus = status || 'active';
    // FIX 10: Sync isActive from status
    const newIsActive = newStatus === 'active' || newStatus === 'live';

    const newEvent = new Event({
      title,
      soloEntryFee: Number(soloEntryFee),
      teamEntryFee: Number(teamEntryFee),
      numberOfDays: numberOfDays !== undefined ? Number(numberOfDays) : 1,
      registrationDeadline: new Date(registrationDeadline),
      matchStartTime: new Date(matchStartTime),
      isActive: isActive !== undefined ? isActive : newIsActive,
      status: newStatus,
      map: map || 'Erangel',
      type: type || 'Squad',
      description: description || ''
    });

    await newEvent.save();

    // If new event is active or live, demote others
    if (newEvent.isActive) {
      await Event.updateMany(
        { _id: { $ne: newEvent._id } },
        { isActive: false }
      );
    }
    if (newEvent.status === 'active') {
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
    const { title, soloEntryFee, teamEntryFee, numberOfDays, registrationDeadline, matchStartTime, isActive, status, map, description, type } = req.body;

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
    if (status) event.status = status;
    if (map) event.map = map;
    if (type) event.type = type;
    if (description !== undefined) event.description = description;

    // FIX 10: Auto-sync isActive from status
    if (status) {
      if (status === 'active' || status === 'live') {
        event.isActive = true;
      } else {
        // ended or upcoming: mark as not active
        event.isActive = false;
      }
    } else if (isActive !== undefined) {
      event.isActive = isActive;
    }

    await event.save();

    // Maintain single-active-event invariant
    if (event.isActive) {
      await Event.updateMany(
        { _id: { $ne: event._id } },
        { isActive: false }
      );
    }
    if (event.status === 'active') {
      await Event.updateMany(
        { _id: { $ne: event._id }, status: 'active' },
        { status: 'upcoming' }
      );
    } else if (event.status === 'live') {
      await Event.updateMany(
        { _id: { $ne: event._id }, status: 'live' },
        { status: 'upcoming' }
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
// FIX 7: Sanitize HTML to prevent stored XSS
app.put('/api/admin/events/active/leaderboard', requireAdmin, async (req, res) => {
  try {
    const { leaderboardHtml } = req.body;
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      return res.status(404).json({ error: 'No active event found to attach leaderboard.' });
    }

    const sanitized = sanitizeHtml(leaderboardHtml || '', {
      allowedTags: ['b', 'i', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'span', 'h1', 'h2', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      allowedAttributes: {
        'span': ['style'],
        'p': ['style'],
        'td': ['style'],
        'th': ['style']
      }
    });

    activeEvent.leaderboardHtml = sanitized;
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
    }).sort({ createdAt: 1 });

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
    const { status } = req.body;

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

// Allot position (rank) and points/kills for registration results
app.put('/api/admin/registrations/:id/results', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rank, points, playerKills } = req.body;

    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration record not found.' });
    }

    registration.rank = rank ? Number(rank) : null;
    if (points !== undefined) {
      registration.points = Number(points);
    }
    if (playerKills !== undefined && Array.isArray(playerKills)) {
      registration.playerKills = playerKills.map(Number);
    }
    await registration.save();

    res.json({ message: 'Roster results updated successfully.', registration });
  } catch (err) {
    console.error('Error updating results:', err);
    res.status(500).json({ error: 'Failed to update rank and points results.' });
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

/* ==========================================================================
   USER AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Sign Up Route
// FIX 1 (rate limit) + FIX 6 (password strength)
app.post('/api/auth/signup', signupLimiter, async (req, res) => {
  try {
    const { uid, phoneNumber, password, recoveryPassword } = req.body;
    if (!uid || !phoneNumber || !password || !recoveryPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // FIX 6: Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const trimmedUid = uid.trim();
    const trimmedPhone = phoneNumber.trim();

    // FIX 5: Use escaped regex for UID lookup
    const existingUser = await User.findOne({ uid: { $regex: new RegExp(`^${escapeRegex(trimmedUid)}$`, 'i') } });
    if (existingUser) {
      return res.status(400).json({ error: 'Character UID is already registered.' });
    }

    // FIX 2: Hash with 600k iterations + track hashVersion
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt, HASH_ITERATIONS_CURRENT);

    const recoverySalt = generateSalt();
    const recoveryPasswordHash = hashPassword(recoveryPassword.trim().toLowerCase(), recoverySalt, HASH_ITERATIONS_CURRENT);

    const newUser = new User({
      uid: trimmedUid,
      phoneNumber: trimmedPhone,
      passwordHash,
      salt,
      recoveryPasswordHash,
      recoverySalt,
      hashVersion: 1  // Current version = 600k iterations
    });

    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        uid: newUser.uid,
        phoneNumber: newUser.phoneNumber
      }
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// Sign In Route
// FIX 1 (rate limit) + FIX 2 (gradual migration) + FIX 3 (JWT token)
app.post('/api/auth/signin', authLimiter, async (req, res) => {
  try {
    const { uidOrPhone, password } = req.body;
    if (!uidOrPhone || !password) {
      return res.status(400).json({ error: 'UID/Phone and password are required.' });
    }

    const searchKey = uidOrPhone.trim();
    // FIX 5: Escaped regex for UID lookup
    const user = await User.findOne({
      $or: [
        { uid: { $regex: new RegExp(`^${escapeRegex(searchKey)}$`, 'i') } },
        { phoneNumber: searchKey }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid UID/Phone or Password.' });
    }

    // FIX 2: Gradual migration — check using correct iteration count per hashVersion
    const userIterations = user.hashVersion === 1 ? HASH_ITERATIONS_CURRENT : HASH_ITERATIONS_LEGACY;
    const computedHash = hashPassword(password, user.salt, userIterations);

    if (computedHash !== user.passwordHash) {
      return res.status(400).json({ error: 'Invalid UID/Phone or Password.' });
    }

    // FIX 2: If legacy hash, transparently migrate to 600k iterations
    if (user.hashVersion !== 1) {
      const newSalt = generateSalt();
      user.salt = newSalt;
      user.passwordHash = hashPassword(password, newSalt, HASH_ITERATIONS_CURRENT);
      user.hashVersion = 1;
      await user.save();
      console.log(`[Migration] Re-hashed password for user: ${user.uid}`);
    }

    // FIX 3: Issue a proper JWT token
    const token = generateToken(user.uid);

    res.json({
      message: 'Signed in successfully!',
      token,
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (err) {
    console.error('Error during signin:', err);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
});

// Recover Password Route
app.post('/api/auth/recover', authLimiter, async (req, res) => {
  try {
    const { uid, phoneNumber, recoveryPassword, newPassword } = req.body;
    if (!uid || !phoneNumber || !recoveryPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // FIX 6: Password strength on recovery too
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const trimmedUid = uid.trim();
    const trimmedPhone = phoneNumber.trim();

    // FIX 5: Escaped regex
    const user = await User.findOne({
      uid: { $regex: new RegExp(`^${escapeRegex(trimmedUid)}$`, 'i') },
      phoneNumber: trimmedPhone
    });

    if (!user) {
      return res.status(404).json({ error: 'No user matches this UID and Phone Number combination.' });
    }

    // Check recovery password using correct iteration count
    const recoveryIterations = user.hashVersion === 1 ? HASH_ITERATIONS_CURRENT : HASH_ITERATIONS_LEGACY;
    const computedRecoveryHash = hashPassword(recoveryPassword.trim().toLowerCase(), user.recoverySalt, recoveryIterations);
    if (computedRecoveryHash !== user.recoveryPasswordHash) {
      return res.status(400).json({ error: 'Incorrect recovery password phrase.' });
    }

    // FIX 2: Update to 600k iterations on recovery
    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt, HASH_ITERATIONS_CURRENT);
    user.hashVersion = 1;

    await user.save();

    res.json({ message: 'Password reset successful! You can now sign in with your new password.' });
  } catch (err) {
    console.error('Error during password recovery:', err);
    res.status(500).json({ error: 'Failed to recover password.' });
  }
});

/* ==========================================================================
   INDEPENDENT LEADERBOARD ENDPOINTS
   ========================================================================== */

// Get all custom leaderboard entries
app.get('/api/leaderboard', async (req, res) => {
  try {
    const list = await Leaderboard.find({}).sort({ rank: 1, points: -1 });
    res.json(list);
  } catch (err) {
    console.error('Error fetching custom leaderboard:', err);
    res.status(500).json({ error: 'Failed to retrieve custom leaderboard.' });
  }
});

// Add custom leaderboard entry (admin)
app.post('/api/admin/leaderboard', requireAdmin, async (req, res) => {
  try {
    const { rank, name, details, kills, points } = req.body;
    if (rank === undefined || !name) {
      return res.status(400).json({ error: 'Missing required leaderboard parameters.' });
    }
    const entry = new Leaderboard({
      rank: Number(rank),
      name,
      details: details || "",
      kills: kills !== undefined ? Number(kills) : 0,
      points: points !== undefined ? Number(points) : 0
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error creating leaderboard entry:', err);
    res.status(500).json({ error: 'Failed to create leaderboard entry.' });
  }
});

// Update custom leaderboard entry (admin)
app.put('/api/admin/leaderboard/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rank, name, details, kills, points } = req.body;
    const entry = await Leaderboard.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found.' });
    }
    if (rank !== undefined) entry.rank = Number(rank);
    if (name) entry.name = name;
    if (details !== undefined) entry.details = details;
    if (kills !== undefined) entry.kills = Number(kills);
    if (points !== undefined) entry.points = Number(points);
    
    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error('Error updating leaderboard entry:', err);
    res.status(500).json({ error: 'Failed to update leaderboard entry.' });
  }
});

// Delete custom leaderboard entry (admin)
app.delete('/api/admin/leaderboard/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Leaderboard.deleteOne({ _id: id });
    res.json({ success: true, message: 'Leaderboard entry deleted.' });
  } catch (err) {
    console.error('Error deleting leaderboard entry:', err);
    res.status(500).json({ error: 'Failed to delete leaderboard entry.' });
  }
});

// Clear all custom leaderboard entries (admin)
app.delete('/api/admin/leaderboard', requireAdmin, async (req, res) => {
  try {
    await Leaderboard.deleteMany({});
    res.json({ success: true, message: 'All custom leaderboard entries cleared.' });
  } catch (err) {
    console.error('Error clearing leaderboard:', err);
    res.status(500).json({ error: 'Failed to clear leaderboard entries.' });
  }
});

// Fetch all signed-in/signed-up users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'uid phoneNumber createdAt hashVersion').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch signed-in users.' });
  }
});

// Delete a user account (admin)
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await User.deleteOne({ _id: id });
    res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

/* ==========================================================================
   FIX 11: GLOBAL EXPRESS ERROR HANDLER
   ========================================================================== */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start express server only if run directly (e.g. not under Vercel serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Esports server backend running on port ${PORT}`);
  });
}

module.exports = app;
