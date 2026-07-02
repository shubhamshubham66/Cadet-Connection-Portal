const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Cadet = require('../models/Cadet');
const Admin = require('../models/Admin');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── CADET REGISTRATION ───
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('rank').isIn(['Cadet', 'LCPL', 'CPL', 'SGT', 'UO', 'SUO']).withMessage('Invalid rank'),
  body('wing').isIn(['SD', 'SW', 'JD', 'JW']).withMessage('Invalid wing'),
  body('regimentNo').trim().notEmpty().withMessage('Regiment number is required'),
  body('battalion').trim().notEmpty().withMessage('Battalion is required'),
  body('institute').trim().notEmpty().withMessage('Institute is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, rank, wing, regimentNo, battalion, institute, mobile, email, password, dob, gender, photo } = req.body;

    // Check if already registered
    const existingCadet = await Cadet.findOne({ $or: [{ email }, { mobile }] });
    if (existingCadet) {
      return res.status(409).json({ success: false, message: 'Email or mobile already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create cadet
    const cadet = new Cadet({
      name, rank, wing, regimentNo, battalion, institute,
      mobile, email, password: hashedPassword,
      dob, gender, photo: photo || null,
      status: 'Pending'
    });

    await cadet.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      cadetId: cadet._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email or mobile already exists.' });
    }
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── CADET LOGIN ───
router.post('/cadet-login', [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { identifier, password } = req.body;

    // Find cadet by email or mobile
    const cadet = await Cadet.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }]
    });

    if (!cadet) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, cadet.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check status
    if (cadet.status === 'Rejected') {
      return res.status(403).json({ success: false, message: 'Your registration was rejected. Contact admin.' });
    }

    // Generate token
    const token = jwt.sign(
      { id: cadet._id, role: 'Cadet', name: cadet.name, battalion: cadet.battalion, institute: cadet.institute },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: cadet._id,
        name: cadet.name,
        role: 'Cadet',
        battalion: cadet.battalion,
        institute: cadet.institute,
        status: cadet.status,
        rank: cadet.rank,
        wing: cadet.wing
      }
    });
  } catch (error) {
    console.error('Cadet Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── ADMIN LOGIN ───
router.post('/admin-login', [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { identifier, password } = req.body;

    // Find admin by email or mobile
    const admin = await Admin.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }]
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (admin.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        name: admin.name,
        assignedBattalion: admin.assignedBattalion,
        assignedInstitute: admin.assignedInstitute
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
        assignedBattalion: admin.assignedBattalion,
        assignedInstitute: admin.assignedInstitute
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET CURRENT USER ───
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'Cadet') {
      const cadet = await Cadet.findById(req.user.id).select('-password');
      if (!cadet) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user: cadet });
    } else {
      const admin = await Admin.findById(req.user.id).select('-password');
      if (!admin) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user: admin });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
