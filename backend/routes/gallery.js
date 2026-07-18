const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

// @route   GET /api/gallery
// @desc    Get all gallery images
// @access  Public
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, count: images.length, data: images });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/gallery
// @desc    Add a new gallery image
// @access  Public (Should be private in production)
router.post('/', async (req, res) => {
  try {
    const { title, category, imageUrl } = req.body;

    if (!title || !category || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Please provide title, category, and imageUrl' });
    }

    const newImage = await Gallery.create({
      title,
      category,
      imageUrl
    });

    res.status(201).json({ success: true, data: newImage });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete a gallery image
// @access  Public (Should be private in production)
router.delete('/:id', async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await image.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
