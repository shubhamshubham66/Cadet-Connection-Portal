const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadImage,
  getAllImages,
  deleteImage,
} = require('../controllers/galleryController');

// Public
router.get('/', getAllImages);

// Admin
router.post('/', protect, authorize('Admin'), upload.single('image'), uploadImage);
router.delete('/:id', protect, authorize('Admin'), deleteImage);

module.exports = router;
