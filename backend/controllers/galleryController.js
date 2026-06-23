const Gallery = require('../models/Gallery');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');

// @desc    Upload gallery image
// @route   POST /api/gallery
// @access  Private (Admin)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'cadet-portal/gallery');

    const image = await Gallery.create({
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      category: req.body.category || 'Other',
      imageUrl: result.url,
      publicId: result.public_id,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
exports.getAllImages = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;

    const images = await Gallery.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await deleteFromCloudinary(image.publicId);
    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
};
