const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  cadet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Present',
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  college: {
    type: String,
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ cadet: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
