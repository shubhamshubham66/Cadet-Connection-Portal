const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const Camp = require('../models/Camp');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');

// @desc    Get cadet profile
// @route   GET /api/cadets/profile
// @access  Private (Cadet)
exports.getProfile = async (req, res, next) => {
  try {
    const cadet = await User.findById(req.user._id);
    res.json({ success: true, data: cadet });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cadet profile
// @route   PUT /api/cadets/profile
// @access  Private (Cadet)
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'address', 'bloodGroup'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle photo update
    if (req.file) {
      // Delete old photo
      const oldUser = await User.findById(req.user._id);
      if (oldUser.photoPublicId) {
        await deleteFromCloudinary(oldUser.photoPublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'cadet-portal/photos');
      updates.photo = result.url;
      updates.photoPublicId = result.public_id;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cadet attendance
// @route   GET /api/cadets/attendance
// @access  Private (Cadet)
exports.getMyAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ cadet: req.user._id })
      .sort({ date: -1 })
      .limit(100);

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        records: attendance,
        stats: { total, present, absent: total - present, percentage },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cadet certificates
// @route   GET /api/cadets/certificates
// @access  Private (Cadet)
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ cadet: req.user._id })
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

// @desc    Get camps (available + registered)
// @route   GET /api/cadets/camps
// @access  Private (Cadet)
exports.getMyCamps = async (req, res, next) => {
  try {
    const registeredCamps = await Camp.find({ registeredCadets: req.user._id }).sort({ startDate: -1 });
    const availableCamps = await Camp.find({
      status: 'Upcoming',
      registeredCadets: { $ne: req.user._id },
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      data: { registered: registeredCamps, available: availableCamps },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for a camp
// @route   POST /api/cadets/camps/:campId/register
// @access  Private (Cadet)
exports.registerForCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.campId);

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    if (camp.status !== 'Upcoming') {
      return res.status(400).json({ success: false, message: 'Camp registration is closed' });
    }

    if (camp.registeredCadets.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already registered for this camp' });
    }

    if (camp.registeredCadets.length >= camp.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Camp is full' });
    }

    camp.registeredCadets.push(req.user._id);
    await camp.save();

    res.json({ success: true, message: 'Successfully registered for camp' });
  } catch (error) {
    next(error);
  }
};
