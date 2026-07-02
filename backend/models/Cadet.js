const mongoose = require('mongoose');

const cadetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  rank: {
    type: String,
    required: [true, 'Rank is required'],
    enum: ['Cadet', 'LCPL', 'CPL', 'SGT', 'UO', 'SUO']
  },
  wing: {
    type: String,
    required: [true, 'Wing is required'],
    enum: ['SD', 'SW', 'JD', 'JW']
  },
  regimentNo: {
    type: String,
    required: [true, 'Regiment number is required'],
    trim: true
  },
  battalion: {
    type: String,
    required: [true, 'Battalion is required'],
    trim: true,
    index: true
  },
  institute: {
    type: String,
    required: [true, 'Institute is required'],
    trim: true,
    index: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^\d{10}$/, 'Mobile must be 10 digits']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  photo: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for role-based queries
cadetSchema.index({ battalion: 1, status: 1 });
cadetSchema.index({ institute: 1, status: 1 });
cadetSchema.index({ battalion: 1, institute: 1 });

module.exports = mongoose.model('Cadet', cadetSchema);
