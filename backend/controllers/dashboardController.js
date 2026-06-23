const User = require('../models/User');
const Camp = require('../models/Camp');
const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');
const News = require('../models/News');
const Event = require('../models/Event');

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalCadets = await User.countDocuments({ role: 'Cadet' });
    const activeCamps = await Camp.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } });
    const totalCertificates = await Certificate.countDocuments();
    const totalNews = await News.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Get colleges count (distinct)
    const colleges = await User.distinct('college', { role: 'Cadet' });

    // Attendance this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAttendance = await Attendance.find({ date: { $gte: weekAgo } });
    const weekPresent = weekAttendance.filter(a => a.status === 'Present').length;
    const weekTotal = weekAttendance.length;
    const weekPercentage = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalCadets,
        totalColleges: colleges.length,
        activeCamps,
        totalCertificates,
        totalNews,
        totalEvents,
        weekAttendance: weekPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};
