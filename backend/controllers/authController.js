const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { uploadToCloudinary } = require('../utils/uploadToCloudinary');

// @desc    Register a new cadet
// @route   POST /api/auth/register
// @access  Public
exports.registerCadet = async (req, res, next) => {
  try {
    const { name, email, mobile, password, regNo, battalion, college, dob, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or mobile already registered' });
    }

    // Upload photo to Cloudinary if provided
    let photo = '';
    let photoPublicId = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'cadet-portal/photos');
      photo = result.url;
      photoPublicId = result.public_id;
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'Cadet',
      regNo,
      battalion,
      college,
      dob,
      gender,
      photo,
      photoPublicId,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        college: user.college,
        photo: user.photo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (Cadet or Admin)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile and password' });
    }

    // Find user by email or mobile
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        college: user.college,
        photo: user.photo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.json({ success: true, message: 'Password updated', token });
  } catch (error) {
    next(error);
  }
};
