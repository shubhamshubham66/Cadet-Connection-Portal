const express = require('express');
const router = express.Router();
const { registerCadet, login, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', upload.single('photo'), registerCadet);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
