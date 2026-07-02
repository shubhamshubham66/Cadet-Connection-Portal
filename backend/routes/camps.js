const express = require('express');
const Camp = require('../models/Camp');
const CampRegistration = require('../models/CampRegistration');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── CREATE CAMP (BN Admin / Main Admin) ───
router.post('/', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const { name, type, location, startDate, endDate, totalSeats, description } = req.body;

    // BN Admin can only create for their battalion
    const battalion = req.user.role === 'BnAdmin' ? req.user.assignedBattalion : req.body.battalion;

    if (!name || !location || !startDate || !endDate || !battalion) {
      return res.status(400).json({ success: false, message: 'Name, location, dates, and battalion are required.' });
    }

    const camp = new Camp({
      name, type, battalion, location, startDate, endDate,
      totalSeats: totalSeats || 100,
      description: description || '',
      createdBy: req.user.id
    });

    await camp.save();
    res.status(201).json({ success: true, message: 'Camp created successfully!', camp });
  } catch (error) {
    console.error('Create Camp Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET CAMPS (Role-based) ───
router.get('/', verifyToken, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'BnAdmin') {
      filter.battalion = req.user.assignedBattalion;
    } else if (req.user.role === 'Cadet') {
      filter.battalion = req.user.battalion;
      filter.status = { $in: ['Upcoming', 'Ongoing'] };
    }
    // MainAdmin sees all

    if (req.query.status) filter.status = req.query.status;

    const camps = await Camp.find(filter).sort({ startDate: -1 });
    res.json({ success: true, camps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── CADET REGISTER FOR CAMP ───
router.post('/:campId/register', verifyToken, requireRole('Cadet'), async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found.' });

    // Check if camp is for cadet's battalion
    if (camp.battalion !== req.user.battalion) {
      return res.status(403).json({ success: false, message: 'This camp is not for your battalion.' });
    }

    // Check if already registered
    const existing = await CampRegistration.findOne({ camp: camp._id, cadet: req.user.id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You are already registered for this camp.' });
    }

    // Check seats
    const regCount = await CampRegistration.countDocuments({ camp: camp._id });
    if (regCount >= camp.totalSeats) {
      return res.status(400).json({ success: false, message: 'Camp is full. No seats available.' });
    }

    // Register
    const registration = new CampRegistration({
      camp: camp._id,
      cadet: req.user.id,
      cadetName: req.user.name,
      cadetMobile: req.body.mobile || '',
      cadetEmail: req.body.email || '',
      cadetRegNo: req.body.regNo || '',
      cadetInstitute: req.body.institute || req.user.institute || '',
      cadetBattalion: req.user.battalion,
      cadetRank: req.body.rank || '',
      cadetWing: req.body.wing || ''
    });

    await registration.save();
    res.status(201).json({ success: true, message: 'Successfully registered for camp!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already registered for this camp.' });
    }
    console.error('Camp Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET CAMP REGISTRATIONS (BN Admin / Main Admin) ───
router.get('/:campId/registrations', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found.' });

    // BN Admin can only see their battalion's camp
    if (req.user.role === 'BnAdmin' && camp.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const registrations = await CampRegistration.find({ camp: camp._id }).sort({ registeredAt: -1 });

    res.json({
      success: true,
      camp: { name: camp.name, battalion: camp.battalion, startDate: camp.startDate, endDate: camp.endDate, totalSeats: camp.totalSeats },
      registrations,
      totalRegistered: registrations.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET CAMP REGISTRATIONS AS CSV (for Excel export) ───
router.get('/:campId/export', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found.' });

    if (req.user.role === 'BnAdmin' && camp.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const registrations = await CampRegistration.find({ camp: camp._id }).sort({ registeredAt: 1 });

    // Generate CSV
    const headers = 'S.No,Name,Rank,Wing,Regiment No,Institute,Battalion,Mobile,Email,Registered Date,Status\n';
    const rows = registrations.map((r, i) => {
      return `${i + 1},"${r.cadetName}","${r.cadetRank || ''}","${r.cadetWing || ''}","${r.cadetRegNo || ''}","${r.cadetInstitute || ''}","${r.cadetBattalion || ''}","${r.cadetMobile || ''}","${r.cadetEmail || ''}","${new Date(r.registeredAt).toLocaleDateString('en-IN')}","${r.status}"`;
    }).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${camp.name.replace(/\s+/g, '_')}_registrations.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE CAMP ───
router.delete('/:campId', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found.' });

    if (req.user.role === 'BnAdmin' && camp.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await CampRegistration.deleteMany({ camp: camp._id });
    await Camp.findByIdAndDelete(camp._id);

    res.json({ success: true, message: 'Camp deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
