const router = require('express').Router();
const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// --- Middleware to verify JWT and get User ID ---
const verifyToken = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Adds { id: "..." } to the request object
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// --- GET ALL DEVICES (For the logged-in user) ---
router.get('/', verifyToken, async (req, res) => {
  try {
    // Find devices where userId matches the token's user ID
    const devices = await Device.find({ userId: req.user.id });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ADD NEW DEVICE ---
router.post('/', verifyToken, async (req, res) => {
  const { 
    name, domain, facility, location, sourceType, 
    endpoint, healthRules, repairLogging 
  } = req.body;

  // Generate a unique Device ID (e.g., DH-XXXXX)
  const generatedId = `DH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const device = new Device({
    userId: req.user.id,
    name,
    deviceId: generatedId, // Assigned by backend
    domain,
    facility,
    location,
    sourceType,
    endpoint,
    healthRules,
    repairLogging
  });

  try {
    const savedDevice = await device.save();
    res.send(savedDevice);
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;