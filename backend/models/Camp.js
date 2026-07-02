const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Camp name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['ATC', 'CATC', 'NIC', 'TSC', 'RDC', 'SSB', 'Advance', 'Basic', 'Other'],
    default: 'ATC'
  },
  battalion: {
    type: String,
    required: [true, 'Battalion is required'],
    index: true
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  totalSeats: {
    type: Number,
    default: 100
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

campSchema.index({ battalion: 1, status: 1 });

module.exports = mongoose.model('Camp', campSchema);
