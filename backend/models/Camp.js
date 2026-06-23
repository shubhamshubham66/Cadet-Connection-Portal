const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Camp name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['ATC', 'CATC', 'NIC', 'TSC', 'RDC', 'Other'],
    default: 'ATC',
  },
  location: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  maxParticipants: {
    type: Number,
    default: 100,
  },
  registeredCadets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Camp', campSchema);
