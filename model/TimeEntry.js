const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  login: { type: String, required: true },
  logout: { type: String, default: '' },
  pause: { type: String, default: '00:00' },
  unavailable: { type: String, default: '00:00' },
  totalAvailable: { type: String, default: '00:00' },
  status: { type: String, enum: ['active', 'complete'], default: 'active' },
  pauseStart: { type: String, default: null },
  unavailableStart: { type: String, default: null }
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);