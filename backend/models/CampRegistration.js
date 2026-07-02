const mongoose = require('mongoose');

const campRegistrationSchema = new mongoose.Schema({
  camp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true,
    index: true
  },
  cadet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cadet',
    required: true
  },
  cadetName: { type: String, required: true },
  cadetMobile: { type: String },
  cadetEmail: { type: String },
  cadetRegNo: { type: String },
  cadetInstitute: { type: String },
  cadetBattalion: { type: String, index: true },
  cadetRank: { type: String },
  cadetWing: { type: String },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Registered', 'Confirmed', 'Cancelled'],
    default: 'Registered'
  }
}, {
  timestamps: true
});

// Prevent duplicate registration
campRegistrationSchema.index({ camp: 1, cadet: 1 }, { unique: true });

module.exports = mongoose.model('CampRegistration', campRegistrationSchema);
