const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Admin routes
router.post('/', protect, authorize('Admin'), createEvent);
router.put('/:id', protect, authorize('Admin'), updateEvent);
router.delete('/:id', protect, authorize('Admin'), deleteEvent);

module.exports = router;
