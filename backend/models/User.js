const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    minlength: 10,
    maxlength: 10,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 4,
    select: false,
  },
  role: {
    type: String,
    enum: ['Cadet', 'Admin'],
    default: 'Cadet',
  },
  // Cadet-specific fields
  regNo: {
    type: String,
    trim: true,
  },
  battalion: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  photo: {
    type: String, // Cloudinary URL
    default: '',
  },
  photoPublicId: {
    type: String,
    default: '',
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  wing: {
    type: String,
    enum: ['Army', 'Navy', 'Air Force', ''],
    default: '',
  },
  enrollmentYear: {
    type: Number,
  },
  bloodGroup: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
