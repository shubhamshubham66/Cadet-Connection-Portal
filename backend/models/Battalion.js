const mongoose = require('mongoose');

const battalionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Battalion name is required'],
    unique: true,
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  wing: {
    type: String,
    enum: ['Army', 'Navy', 'Air Force'],
    default: 'Army'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  coName: { type: String, default: null },
  coEmail: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Battalion', battalionSchema);
