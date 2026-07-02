const express = require('express');
const { upload, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Upload single image (profile photo)
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    res.json({
      success: true,
      message: 'Photo uploaded successfully.',
      url: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
});

// Delete image
router.delete('/photo/:publicId', async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'Photo deleted.', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;
