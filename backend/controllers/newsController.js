const News = require('../models/News');

// @desc    Create news
// @route   POST /api/news
// @access  Private (Admin)
exports.createNews = async (req, res, next) => {
  try {
    const news = await News.create({
      ...req.body,
      postedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all news
// @route   GET /api/news
// @access  Public
exports.getAllNews = async (req, res, next) => {
  try {
    const news = await News.find()
      .populate('postedBy', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Private (Admin)
exports.updateNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Private (Admin)
exports.deleteNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, message: 'News deleted' });
  } catch (error) {
    next(error);
  }
};
