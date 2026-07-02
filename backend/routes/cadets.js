const express = require('express');
const Cadet = require('../models/Cadet');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── GET CADETS (Role-Based Filtering) ───
// MainAdmin → ALL cadets
// BnAdmin → Only cadets in their assigned battalion
// CollegeAdmin → Only cadets in their assigned institute
router.get('/', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    let filter = {};

    // Role-based filtering at database query level
    if (req.user.role === 'BnAdmin') {
      filter.battalion = req.user.assignedBattalion;
    } else if (req.user.role === 'CollegeAdmin') {
      filter.institute = req.user.assignedInstitute;
    }
    // MainAdmin: no filter — gets ALL cadets

    // Optional query params for further filtering
    if (req.query.status) filter.status = req.query.status;
    if (req.query.battalion && req.user.role === 'MainAdmin') filter.battalion = req.query.battalion;
    if (req.query.institute && req.user.role !== 'CollegeAdmin') filter.institute = req.query.institute;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { regimentNo: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [cadets, total] = await Promise.all([
      Cadet.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Cadet.countDocuments(filter)
    ]);

    res.json({
      success: true,
      cadets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Cadets Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET SINGLE CADET ───
router.get('/:id', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    const cadet = await Cadet.findById(req.params.id).select('-password');
    if (!cadet) return res.status(404).json({ success: false, message: 'Cadet not found.' });

    // Check access scope
    if (req.user.role === 'BnAdmin' && cadet.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'CollegeAdmin' && cadet.institute !== req.user.assignedInstitute) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, cadet });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── APPROVE/REJECT CADET ───
router.patch('/:id/status', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const cadet = await Cadet.findById(req.params.id);
    if (!cadet) return res.status(404).json({ success: false, message: 'Cadet not found.' });

    // Check access scope
    if (req.user.role === 'BnAdmin' && cadet.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'CollegeAdmin' && cadet.institute !== req.user.assignedInstitute) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    cadet.status = status;
    cadet.approvedBy = req.user.id;
    cadet.approvedAt = status === 'Approved' ? new Date() : null;
    await cadet.save();

    res.json({ success: true, message: `Cadet ${status.toLowerCase()} successfully.`, cadet });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET CADET STATS (Role-Based) ───
router.get('/stats/overview', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'BnAdmin') filter.battalion = req.user.assignedBattalion;
    if (req.user.role === 'CollegeAdmin') filter.institute = req.user.assignedInstitute;

    const [total, pending, approved, rejected] = await Promise.all([
      Cadet.countDocuments(filter),
      Cadet.countDocuments({ ...filter, status: 'Pending' }),
      Cadet.countDocuments({ ...filter, status: 'Approved' }),
      Cadet.countDocuments({ ...filter, status: 'Rejected' })
    ]);

    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
