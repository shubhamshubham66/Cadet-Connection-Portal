const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  cadet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['A', 'B', 'C'],
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  certificateNo: {
    type: String,
    unique: true,
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', ''],
    default: '',
  },
  remarks: {
    type: String,
    default: '',
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);
