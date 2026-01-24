const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Professional Info
  organization: { type: String },
  role: { type: String },
  experience: { type: String },

  // Arrays for the multi-select tags
  interests: [{ type: String }],
  useCases: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);