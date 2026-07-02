const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    required: true,
    enum: ['MainAdmin', 'BnAdmin', 'CollegeAdmin'],
    index: true
  },
  // For BnAdmin — which battalion they manage
  assignedBattalion: {
    type: String,
    default: null,
    index: true
  },
  // For CollegeAdmin — which institute they manage
  assignedInstitute: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
