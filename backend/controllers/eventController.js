const Event = require('../models/Event');

// @desc    Create event
// @route   POST /api/events
// @access  Private (Admin)
exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const { category, upcoming } = req.query;
    let query = {};
    if (category) query.category = category;
    if (upcoming === 'true') query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};
