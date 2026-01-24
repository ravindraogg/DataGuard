const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  // --- Link to the User who owns this device ---
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // --- A) Identity ---
  name: { type: String, required: true },
  deviceId: { type: String, required: true, unique: true },
  domain: { 
    type: String, 
    enum: ['energy', 'industrial', 'agriculture', 'healthcare', 'smarthome', 'other'],
    required: true 
  },

  // --- B) Status (Default to operational) ---
  status: { 
    type: String, 
    enum: ['operational', 'warning', 'critical', 'offline'], 
    default: 'operational' 
  },
  confidence: { type: Number, default: 100 },
  lastActive: { type: Date, default: Date.now },

  // --- C) Location & Context ---
  facility: { type: String },
  zone: { type: String },
  location: { type: String }, // Manual override (e.g. "City/Floor")

  // --- D) Connectivity (How we fetch data) ---
  sourceType: { 
    type: String, 
    enum: ['http', 'mqtt', 'websocket'], 
    default: 'http' 
  },
  endpoint: { type: String }, // URL or Topic
  authKey: { type: String }, // Optional API Key

  // --- E) Health & Repair Rules ---
  // Storing as a flexible Map because keys depend on the sensor (e.g., "temp": "0-100")
  healthRules: { 
    type: Map, 
    of: String 
  },
  repairLogging: { type: Boolean, default: true },
  notifyRepairs: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);