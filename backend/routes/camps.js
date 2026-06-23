const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCamp,
  getAllCamps,
  getCampById,
  updateCamp,
  deleteCamp,
} = require('../controllers/campController');

// Public routes
router.get('/', getAllCamps);
router.get('/:id', getCampById);

// Admin routes
router.post('/', protect, authorize('Admin'), createCamp);
router.put('/:id', protect, authorize('Admin'), updateCamp);
router.delete('/:id', protect, authorize('Admin'), deleteCamp);

module.exports = router;
