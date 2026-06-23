const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  getMyAttendance,
  getMyCertificates,
  getMyCamps,
  registerForCamp,
} = require('../controllers/cadetController');

router.use(protect, authorize('Cadet'));

router.get('/profile', getProfile);
router.put('/profile', upload.single('photo'), updateProfile);
router.get('/attendance', getMyAttendance);
router.get('/certificates', getMyCertificates);
router.get('/camps', getMyCamps);
router.post('/camps/:campId/register', registerForCamp);

module.exports = router;
