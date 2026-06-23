const Camp = require('../models/Camp');

// @desc    Create camp
// @route   POST /api/camps
// @access  Private (Admin)
exports.createCamp = async (req, res, next) => {
  try {
    const camp = await Camp.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: camp });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all camps
// @route   GET /api/camps
// @access  Public
exports.getAllCamps = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const camps = await Camp.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });

    res.json({ success: true, data: camps });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single camp
// @route   GET /api/camps/:id
// @access  Public
exports.getCampById = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('registeredCadets', 'name regNo college')
      .populate('createdBy', 'name');

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    res.json({ success: true, data: camp });
  } catch (error) {
    next(error);
  }
};

// @desc    Update camp
// @route   PUT /api/camps/:id
// @access  Private (Admin)
exports.updateCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    res.json({ success: true, data: camp });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete camp
// @route   DELETE /api/camps/:id
// @access  Private (Admin)
exports.deleteCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findByIdAndDelete(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }
    res.json({ success: true, message: 'Camp deleted' });
  } catch (error) {
    next(error);
  }
};
