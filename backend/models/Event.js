const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    default: '',
  },
  venue: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Parade', 'Social Service', 'Sports', 'Cultural', 'Training', 'Other'],
    default: 'Other',
  },
  image: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);
