const Certificate = require('../models/Certificate');
const User = require('../models/User');

// @desc    Issue certificate
// @route   POST /api/certificates
// @access  Private (Admin)
exports.issueCertificate = async (req, res, next) => {
  try {
    const { cadetId, type, grade, remarks } = req.body;

    const cadet = await User.findById(cadetId);
    if (!cadet || cadet.role !== 'Cadet') {
      return res.status(404).json({ success: false, message: 'Cadet not found' });
    }

    // Generate certificate number
    const count = await Certificate.countDocuments();
    const certificateNo = `NCC/NER/TR/CERT/${type}/${String(count + 1).padStart(4, '0')}`;

    const certificate = await Certificate.create({
      cadet: cadetId,
      type,
      grade,
      remarks,
      certificateNo,
      issuedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private (Admin)
exports.getAllCertificates = async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) query.type = type;

    const certificates = await Certificate.find(query)
      .populate('cadet', 'name regNo college')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
exports.deleteCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, message: 'Certificate deleted' });
  } catch (error) {
    next(error);
  }
};
