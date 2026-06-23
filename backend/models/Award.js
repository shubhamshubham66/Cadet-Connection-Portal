const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  cadet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Award title is required'],
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Best Cadet', 'Drill', 'Shooting', 'Sports', 'Social Service', 'Other'],
    default: 'Other',
  },
  awardDate: {
    type: Date,
    default: Date.now,
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Award', awardSchema);
