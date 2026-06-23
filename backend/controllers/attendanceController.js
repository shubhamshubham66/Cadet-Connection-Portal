const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance (bulk)
// @route   POST /api/attendance/mark
// @access  Private (Admin)
exports.markAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;
    // records: [{ cadetId, status, remarks }]

    if (!date || !records || !records.length) {
      return res.status(400).json({ success: false, message: 'Date and records are required' });
    }

    const results = [];
    for (const record of records) {
      const cadet = await User.findById(record.cadetId);
      if (!cadet) continue;

      const attendance = await Attendance.findOneAndUpdate(
        { cadet: record.cadetId, date: new Date(date) },
        {
          cadet: record.cadetId,
          date: new Date(date),
          status: record.status || 'Present',
          markedBy: req.user._id,
          college: cadet.college,
          remarks: record.remarks || '',
        },
        { upsert: true, new: true }
      );
      results.push(attendance);
    }

    res.json({
      success: true,
      message: `Attendance marked for ${results.length} cadets`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Private (Admin)
exports.getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { college } = req.query;

    let query = { date: new Date(date) };
    if (college) query.college = new RegExp(college, 'i');

    const records = await Attendance.find(query)
      .populate('cadet', 'name regNo college')
      .sort({ college: 1 });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance report for a cadet
// @route   GET /api/attendance/cadet/:cadetId
// @access  Private (Admin)
exports.getCadetAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ cadet: req.params.cadetId })
      .sort({ date: -1 })
      .limit(200);

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;

    res.json({
      success: true,
      data: {
        records,
        stats: { total, present, absent: total - present, percentage: total ? Math.round((present / total) * 100) : 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance summary (all colleges)
// @route   GET /api/attendance/summary
// @access  Private (Admin)
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$college',
          totalRecords: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
      {
        $project: {
          college: '$_id',
          totalRecords: 1,
          presentCount: 1,
          percentage: {
            $cond: [{ $gt: ['$totalRecords', 0] }, { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalRecords'] }, 100] }, 0] }, 0],
          },
        },
      },
      { $sort: { college: 1 } },
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
