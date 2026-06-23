const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  issueCertificate,
  getAllCertificates,
  deleteCertificate,
} = require('../controllers/certificateController');

router.use(protect, authorize('Admin'));

router.post('/', issueCertificate);
router.get('/', getAllCertificates);
router.delete('/:id', deleteCertificate);

module.exports = router;
