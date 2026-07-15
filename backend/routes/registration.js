const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const PreApprovedCadet = require('../models/PreApprovedCadet');
const OtpVerification = require('../models/OtpVerification');
const Cadet = require('../models/Cadet');
const { generateAndUploadIdCard } = require('../utils/idCardGenerator');

const router = express.Router();

// Transporter for NodeMailer (falls back to console log if details are not provided)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ─── 1. VERIFY ELIGIBILITY ───
router.post('/verify-eligibility', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('regimentalNumber').trim().notEmpty().withMessage('Regimental number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, regimentalNumber } = req.body;
    const formattedRegNo = regimentalNumber.trim().toUpperCase();

    // Check if pre-approved
    const preApproved = await PreApprovedCadet.findOne({ regimentalNumber: formattedRegNo });
    if (!preApproved) {
      return res.status(404).json({ success: false, message: 'No matching record found. Contact your BN CO.' });
    }

    // Check case-insensitive match on name
    if (preApproved.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(404).json({ success: false, message: 'Name does not match our pre-approved records. Contact your BN CO.' });
    }

    // Check if already registered
    if (preApproved.isRegistered) {
      return res.status(409).json({ success: false, message: 'This cadet is already registered.' });
    }

    // Emit temporary eligibility token (15 mins)
    const eligibilityToken = jwt.sign(
      { regimentalNumber: preApproved.regimentalNumber, name: preApproved.name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Eligibility verified! You may proceed with registration.',
      eligibilityToken,
      name: preApproved.name,
      regimentalNumber: preApproved.regimentalNumber
    });
  } catch (error) {
    console.error('Verify Eligibility Error:', error);
    res.status(500).json({ success: false, message: 'Server error during eligibility check.' });
  }
});

// ─── 2. SEND OTP ───
router.post('/send-otp', [
  body('identifier').trim().notEmpty().withMessage('Identifier is required'),
  body('purpose').isIn(['mobile', 'email']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { identifier, purpose } = req.body;

    // Rate Limiting Check: 1 request per 60 seconds
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await OtpVerification.findOne({
      identifier,
      purpose,
      createdAt: { $gte: oneMinAgo }
    });
    if (recentOtp) {
      return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting another OTP.' });
    }

    // Rate Limiting Check: Max 5 requests per day (24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await OtpVerification.countDocuments({
      identifier,
      purpose,
      createdAt: { $gte: twentyFourHoursAgo }
    });
    if (dailyCount >= 5) {
      return res.status(429).json({ success: false, message: 'Daily OTP limit exceeded. Please try again in 24 hours.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to DB
    const newOtp = new OtpVerification({
      identifier,
      otp,
      purpose,
      expiresAt
    });
    await newOtp.save();

    // Send / Simulate OTP
    if (purpose === 'email') {
      if (transporter) {
        await transporter.sendMail({
          from: `"NCC Portal" <${process.env.SMTP_USER}>`,
          to: identifier,
          subject: 'NCC Registration Email Verification OTP',
          text: `Your OTP for Cadet Connection Portal registration is: ${otp}. It will expire in 10 minutes.`,
          html: `<p>Your OTP for Cadet Connection Portal registration is: <strong>${otp}</strong>.</p><p>This OTP will expire in 10 minutes.</p>`
        });
        console.log(`Email OTP sent to ${identifier}`);
      } else {
        // Simulated email sending log
        console.log(`\n===========================================`);
        console.log(`[SIMULATED EMAIL OTP] To: ${identifier}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`===========================================\n`);
      }
    } else if (purpose === 'mobile') {
      // Simulated SMS sending log
      console.log(`\n===========================================`);
      console.log(`[SIMULATED SMS OTP] To: ${identifier}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`===========================================\n`);
    }

    res.json({
      success: true,
      message: `OTP sent successfully to your ${purpose === 'email' ? 'email address' : 'mobile number'}. (Demo: Check logs for code)`
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// ─── 3. VERIFY OTP ───
router.post('/verify-otp', [
  body('identifier').trim().notEmpty().withMessage('Identifier is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('purpose').isIn(['mobile', 'email']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { identifier, otp, purpose } = req.body;

    let otpDoc = await OtpVerification.findOne({ identifier, purpose, otp });
    if (!otpDoc) {
      // Demo/simulation backdoor for testing without server logs access
      if (otp === '123456' || otp === '111111') {
        otpDoc = new OtpVerification({
          identifier,
          otp,
          purpose,
          isVerified: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await otpDoc.save();
      } else {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }
    } else {
      // Set verified flag and extend TTL to allow completion of registration (15 mins)
      otpDoc.isVerified = true;
      otpDoc.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await otpDoc.save();
    }

    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

// ─── 4. FULL CADET REGISTER ───
router.post('/register', [
  body('eligibilityToken').notEmpty().withMessage('Eligibility token is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('rank').trim().notEmpty().withMessage('Rank is required'),
  body('wing').isIn(['SD', 'SW', 'JD', 'JW']).withMessage('Invalid wing'),
  body('battalion').trim().notEmpty().withMessage('Battalion name is required'),
  body('institute').trim().notEmpty().withMessage('Institute name is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const {
      eligibilityToken, mobile, email, password, rank, wing,
      battalion, institute, dob, gender, photo
    } = req.body;

    // 1. Verify eligibility token
    let decoded;
    try {
      decoded = jwt.verify(eligibilityToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired eligibility token.' });
    }

    const regNo = decoded.regimentalNumber;

    // Double check pre-approval registration state
    const preApproved = await PreApprovedCadet.findOne({ regimentalNumber: regNo });
    if (!preApproved || preApproved.isRegistered) {
      return res.status(409).json({ success: false, message: 'Registration not allowed or already registered.' });
    }

    // 2. Validate OTPs are marked verified in the database
    const mobileVerified = await OtpVerification.findOne({ identifier: mobile, purpose: 'mobile', isVerified: true });
    const emailVerified = await OtpVerification.findOne({ identifier: email, purpose: 'email', isVerified: true });
    if (!mobileVerified || !emailVerified) {
      return res.status(400).json({ success: false, message: 'Please verify both mobile and email via OTP before registering.' });
    }

    // Check if Cadet already exists (in case registration hit multiple times)
    const existingCadet = await Cadet.findOne({ $or: [{ email }, { mobile }, { regimentNo: regNo }, { regimentalNumber: regNo }] });
    if (existingCadet) {
      return res.status(409).json({ success: false, message: 'An account with this email, mobile or regimental number is already registered.' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Cadet document
    const newCadet = new Cadet({
      name: decoded.name,
      rank,
      wing,
      regimentNo: regNo,
      regimentalNumber: regNo,
      battalion,
      institute,
      mobile,
      email,
      password: hashedPassword,
      dob,
      gender,
      photo: photo || null,
      isMobileVerified: true,
      isEmailVerified: true,
      status: 'Approved' // Automatic approval since they matched pre-approved list
    });

    await newCadet.save();

    // 5. Generate and Upload Digital ID Card
    let idCardUrl = null;
    try {
      idCardUrl = await generateAndUploadIdCard(newCadet);
      newCadet.digitalIdCardUrl = idCardUrl;
      await newCadet.save();
    } catch (idErr) {
      console.error('ID Card Generation Failed:', idErr);
    }

    // 6. Update PreApprovedCadet status
    preApproved.isRegistered = true;
    await preApproved.save();

    // 7. Clear temporary OTP verification documents
    await OtpVerification.deleteMany({ identifier: { $in: [mobile, email] } });

    // 8. Issue JWT for auto-login
    const token = jwt.sign(
      { id: newCadet._id, role: 'Cadet', name: newCadet.name, battalion: newCadet.battalion, institute: newCadet.institute },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration and verification successful! Welcome to the portal.',
      token,
      user: {
        id: newCadet._id,
        name: newCadet.name,
        role: 'Cadet',
        battalion: newCadet.battalion,
        institute: newCadet.institute,
        status: newCadet.status,
        rank: newCadet.rank,
        wing: newCadet.wing,
        digitalIdCardUrl: newCadet.digitalIdCardUrl
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

module.exports = router;
