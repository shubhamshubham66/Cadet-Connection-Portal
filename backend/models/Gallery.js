const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Image title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Camp', 'Parade', 'Event', 'Social Service', 'Sports', 'Other'],
    default: 'Other',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Gallery', gallerySchema);
