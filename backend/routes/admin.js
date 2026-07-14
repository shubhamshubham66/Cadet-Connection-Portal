const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const PreApprovedCadet = require('../models/PreApprovedCadet');
const Cadet = require('../models/Cadet');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Multer memory storage setup for bulk Excel uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ─── 1. DOWNLOAD TEMPLATE ───
router.get('/preapproved/template', verifyToken, requireRole('MainAdmin', 'BnAdmin'), (req, res) => {
  try {
    const data = [
      { 'Name': 'Rahul Das', 'Regimental Number': 'NCC/NER/TR/24/10001' },
      { 'Name': 'Priya Sharma', 'Regimental Number': 'NCC/NER/TR/24/10002' },
      { 'Name': 'Amit Deb', 'Regimental Number': 'NCC/NER/TR/24/10003' }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.book_append_sheet(wb, ws, 'Pre-Approval Template');

    // Auto-adjust column widths for readability
    const max_len = [{wch: 25}, {wch: 30}];
    ws['!cols'] = max_len;

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=cadet_pre_approval_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Template Download Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template.' });
  }
});

// ─── 2. BULK UPLOAD EXCEL/CSV ───
router.post('/preapproved/upload', verifyToken, requireRole('MainAdmin', 'BnAdmin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file.' });
    }

    // Read workbook from memory buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty.' });
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // Track duplicates within the same batch upload
    const batchRegNumbers = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Row number in Excel sheet (including header)

      // Normalize headers: find values for 'name' and 'regimental number'
      let nameVal = '';
      let regNoVal = '';

      for (const key of Object.keys(row)) {
        const normalizedKey = key.trim().toLowerCase();
        if (['name', 'fullname', 'full name', 'cadet name'].includes(normalizedKey)) {
          nameVal = row[key];
        }
        if (['regimental number', 'regimentalnumber', 'regiment no', 'regNo', 'regimentno', 'regimental_number', 'regiment number'].includes(normalizedKey)) {
          regNoVal = row[key];
        }
      }

      // Check missing columns
      if (!nameVal || !regNoVal) {
        skipped++;
        errors.push({ row: rowNum, reason: 'Missing Name or Regimental Number column values.' });
        continue;
      }

      const name = String(nameVal).trim();
      const regNo = String(regNoVal).trim().toUpperCase();

      // Check format/empty values
      if (!name || !regNo) {
        skipped++;
        errors.push({ row: rowNum, reason: 'Empty Name or Regimental Number value.' });
        continue;
      }

      // Check duplicate in same batch
      if (batchRegNumbers.has(regNo)) {
        skipped++;
        errors.push({ row: rowNum, cadet: `${name} (${regNo})`, reason: 'Duplicate regimental number in the uploaded batch.' });
        continue;
      }

      // Add to batch set
      batchRegNumbers.add(regNo);

      try {
        // Check duplicate in database
        const dbExists = await PreApprovedCadet.findOne({ regimentalNumber: regNo });
        if (dbExists) {
          skipped++;
          errors.push({ row: rowNum, cadet: `${name} (${regNo})`, reason: 'Already exists in the pre-approval list.' });
          continue;
        }

        // Insert pre-approved cadet
        const newPreApproved = new PreApprovedCadet({
          name: name,
          regimentalNumber: regNo,
          uploadedBy: req.user.id
        });
        await newPreApproved.save();
        inserted++;
      } catch (rowErr) {
        skipped++;
        errors.push({ row: rowNum, cadet: `${name} (${regNo})`, reason: rowErr.message });
      }
    }

    res.json({
      success: true,
      summary: {
        totalRows: rows.length,
        inserted: inserted,
        skipped: skipped,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Pre-approval upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk upload processing.' });
  }
});

// ─── ADD SINGLE PRE-APPROVED CADET (MANUAL) ───
router.post('/preapproved', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const { name, regimentalNumber } = req.body;
    if (!name || !regimentalNumber) {
      return res.status(400).json({ success: false, message: 'Name and Regimental Number are required.' });
    }

    const regNo = regimentalNumber.trim().toUpperCase();

    // Check if duplicate
    const exists = await PreApprovedCadet.findOne({ regimentalNumber: regNo });
    if (exists) {
      return res.status(409).json({ success: false, message: 'This regimental number is already pre-approved.' });
    }

    const newPreApproved = new PreApprovedCadet({
      name: name.trim(),
      regimentalNumber: regNo,
      uploadedBy: req.user.id
    });

    await newPreApproved.save();
    res.status(201).json({ success: true, message: 'Cadet pre-approved successfully.', cadet: newPreApproved });
  } catch (error) {
    console.error('Add single pre-approved cadet error:', error);
    res.status(500).json({ success: false, message: 'Server error adding pre-approved cadet.' });
  }
});

// ─── 3. LIST PRE-APPROVED CADETS (PAGINATED) ───
router.get('/preapproved', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { regimentalNumber: searchRegex }
      ];
    }
    
    const [list, total] = await Promise.all([
      PreApprovedCadet.find(filter)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PreApprovedCadet.countDocuments(filter)
    ]);

    res.json({
      success: true,
      list,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List pre-approved cadets error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pre-approved cadets.' });
  }
});

// ─── 4. LIST REGISTERED CADETS (PAGINATED, FILTERED) ───
router.get('/cadets', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    let filter = {};

    // Role-based scope filtering
    if (req.user.role === 'BnAdmin') {
      filter.battalion = req.user.assignedBattalion;
    } else if (req.user.role === 'CollegeAdmin') {
      filter.institute = req.user.assignedInstitute;
    }

    // Additional filters
    if (req.query.battalion && req.user.role === 'MainAdmin') {
      filter.battalion = req.query.battalion;
    }
    if (req.query.institute && req.user.role !== 'CollegeAdmin') {
      filter.institute = req.query.institute;
    }
    if (req.query.rank) {
      filter.rank = req.query.rank;
    }

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { regimentNo: searchRegex },
        { regimentalNumber: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [cadets, total] = await Promise.all([
      Cadet.find(filter)
        .select('-password')
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limit),
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
    console.error('Admin Registered Cadets Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching registered cadets.' });
  }
});

// ─── 5. SINGLE REGISTERED CADET DETAILS ───
router.get('/cadets/:id', verifyToken, requireRole('MainAdmin', 'BnAdmin', 'CollegeAdmin'), async (req, res) => {
  try {
    const cadet = await Cadet.findById(req.params.id).select('-password');
    if (!cadet) {
      return res.status(404).json({ success: false, message: 'Cadet not found.' });
    }

    // Check scope permissions
    if (req.user.role === 'BnAdmin' && cadet.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied. Cadet belongs to another battalion.' });
    }
    if (req.user.role === 'CollegeAdmin' && cadet.institute !== req.user.assignedInstitute) {
      return res.status(403).json({ success: false, message: 'Access denied. Cadet belongs to another institute.' });
    }

    res.json({ success: true, cadet });
  } catch (error) {
    console.error('Fetch Single Cadet Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cadet profile.' });
  }
});

module.exports = router;
