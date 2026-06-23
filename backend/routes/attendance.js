const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance,
  getAttendanceByDate,
  getCadetAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');

router.use(protect, authorize('Admin'));

router.post('/mark', markAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/cadet/:cadetId', getCadetAttendance);
router.get('/summary', getAttendanceSummary);

module.exports = router;
