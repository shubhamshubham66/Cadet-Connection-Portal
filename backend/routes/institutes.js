const express = require('express');
const Institute = require('../models/Institute');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET all institutes (public - for registration dropdown)
router.get('/', async (req, res) => {
  try {
    let filter = { status: 'active' };
    if (req.query.battalion) filter.battalion = req.query.battalion;
    const institutes = await Institute.find(filter).sort({ name: 1 });
    res.json({ success: true, institutes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST create institute (MainAdmin or BnAdmin)
router.post('/', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    // BnAdmin can only create for their battalion
    if (req.user.role === 'BnAdmin') {
      req.body.battalion = req.user.assignedBattalion;
    }
    const institute = new Institute(req.body);
    await institute.save();
    res.status(201).json({ success: true, message: 'Institute created.', institute });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Institute already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
