const mongoose = require('mongoose');

const preApprovedCadetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  regimentalNumber: {
    type: String,
    required: [true, 'Regimental number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  battalion: {
    type: String,
    trim: true,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PreApprovedCadet', preApprovedCadetSchema);
