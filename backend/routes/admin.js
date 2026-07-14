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
    let inserted = 0;
    let skipped = 0;
    const errors = [];
    const batchRegNumbers = new Set();
    let totalRowsScanned = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Row number in this sheet
        totalRowsScanned++;

        // Normalize headers: strip all spaces, punctuation, and casing
        let nameVal = '';
        let regNoVal = '';

        for (const key of Object.keys(row)) {
          const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (['name', 'fullname', 'cadetname', 'names'].includes(normalizedKey)) {
            nameVal = row[key];
          }
          if (['regimentalnumber', 'regimentno', 'regno', 'regnumber', 'regnum', 'regimentalno'].includes(normalizedKey)) {
            regNoVal = row[key];
          }
        }

        // Check missing columns
        if (!nameVal || !regNoVal) {
          skipped++;
          if (nameVal || regNoVal) {
            errors.push({ row: rowNum, reason: `[Sheet: ${sheetName}] Missing Name or Regimental Number values.` });
          }
          continue;
        }

        const name = String(nameVal).trim();
        const regNo = String(regNoVal).trim().toUpperCase();

        if (!name || !regNo) {
          skipped++;
          errors.push({ row: rowNum, reason: `[Sheet: ${sheetName}] Empty Name or Regimental Number value.` });
          continue;
        }

        if (batchRegNumbers.has(regNo)) {
          skipped++;
          errors.push({ row: rowNum, cadet: `${name} (${regNo})`, reason: `[Sheet: ${sheetName}] Duplicate regimental number in the uploaded batch.` });
          continue;
        }

        batchRegNumbers.add(regNo);

        try {
          const dbExists = await PreApprovedCadet.findOne({ regimentalNumber: regNo });
          if (dbExists) {
            // Update the existing pre-approved record so it floats to the top of the list
            dbExists.name = name;
            dbExists.uploadedAt = new Date();
            dbExists.uploadedBy = req.user.id;
            await dbExists.save();
            inserted++;
            continue;
          }

          const newPreApproved = new PreApprovedCadet({
            name: name,
            regimentalNumber: regNo,
            uploadedBy: req.user.id
          });
          await newPreApproved.save();
          inserted++;
        } catch (rowErr) {
          skipped++;
          errors.push({ row: rowNum, cadet: `${name} (${regNo})`, reason: `[Sheet: ${sheetName}] ${rowErr.message}` });
        }
      }
    }

    if (totalRowsScanned === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded workbook contains no data rows.' });
    }

    res.json({
      success: true,
      summary: {
        totalRows: totalRowsScanned,
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
      // Update details and save so it floats to the top of the list
      exists.name = name.trim();
      exists.uploadedAt = new Date();
      exists.uploadedBy = req.user.id;
      await exists.save();
      return res.status(200).json({ success: true, message: 'Cadet pre-approval updated successfully.', cadet: exists });
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
        .sort({ updatedAt: -1 })
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
