const express = require('express');
const Battalion = require('../models/Battalion');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET all battalions (public - for registration dropdown)
router.get('/', async (req, res) => {
  try {
    const battalions = await Battalion.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, battalions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST create battalion (MainAdmin only)
router.post('/', verifyToken, requireRole('MainAdmin'), async (req, res) => {
  try {
    const battalion = new Battalion(req.body);
    await battalion.save();
    res.status(201).json({ success: true, message: 'Battalion created.', battalion });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Battalion already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
