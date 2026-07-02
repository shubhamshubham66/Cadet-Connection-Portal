const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institute name is required'],
    unique: true,
    trim: true
  },
  battalion: {
    type: String,
    required: [true, 'Battalion is required'],
    trim: true,
    index: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['College', 'School', 'University', 'Polytechnic', 'Other'],
    default: 'College'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Institute', instituteSchema);
