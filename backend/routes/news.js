const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createNews,
  getAllNews,
  updateNews,
  deleteNews,
} = require('../controllers/newsController');

// Public
router.get('/', getAllNews);

// Admin
router.post('/', protect, authorize('Admin'), createNews);
router.put('/:id', protect, authorize('Admin'), updateNews);
router.delete('/:id', protect, authorize('Admin'), deleteNews);

module.exports = router;
