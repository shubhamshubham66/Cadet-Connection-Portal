const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Get all cadets (with filters)
// @route   GET /api/officers/cadets
// @access  Private (Admin)
exports.getAllCadets = async (req, res, next) => {
  try {
    const { college, battalion, search, page = 1, limit = 50 } = req.query;

    let query = { role: 'Cadet' };

    if (college) query.college = new RegExp(college, 'i');
    if (battalion) query.battalion = new RegExp(battalion, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { regNo: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const cadets = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: cadets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single cadet by ID
// @route   GET /api/officers/cadets/:id
// @access  Private (Admin)
exports.getCadetById = async (req, res, next) => {
  try {
    const cadet = await User.findById(req.params.id).select('-password');
    if (!cadet || cadet.role !== 'Cadet') {
      return res.status(404).json({ success: false, message: 'Cadet not found' });
    }
    res.json({ success: true, data: cadet });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cadet details (by admin)
// @route   PUT /api/officers/cadets/:id
// @access  Private (Admin)
exports.updateCadet = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'mobile', 'regNo', 'battalion', 'college', 'dob', 'gender', 'wing', 'enrollmentYear', 'bloodGroup', 'address', 'isActive'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Cadet not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete cadet
// @route   DELETE /api/officers/cadets/:id
// @access  Private (Admin)
exports.deleteCadet = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Cadet') {
      return res.status(404).json({ success: false, message: 'Cadet not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cadet deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new admin
// @route   POST /api/officers/admins
// @access  Private (Admin)
exports.addAdmin = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or mobile already exists' });
    }

    const admin = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'Admin',
    });

    res.status(201).json({
      success: true,
      message: 'Admin added successfully',
      data: { id: admin._id, name: admin.name, email: admin.email, mobile: admin.mobile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins
// @route   GET /api/officers/admins
// @access  Private (Admin)
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'Admin' }).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove admin
// @route   DELETE /api/officers/admins/:id
// @access  Private (Admin)
exports.removeAdmin = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    }

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin removed' });
  } catch (error) {
    next(error);
  }
};
