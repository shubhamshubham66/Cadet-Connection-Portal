const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllCadets,
  getCadetById,
  updateCadet,
  deleteCadet,
  addAdmin,
  getAllAdmins,
  removeAdmin,
} = require('../controllers/officerController');

router.use(protect, authorize('Admin'));

router.get('/cadets', getAllCadets);
router.get('/cadets/:id', getCadetById);
router.put('/cadets/:id', updateCadet);
router.delete('/cadets/:id', deleteCadet);

router.post('/admins', addAdmin);
router.get('/admins', getAllAdmins);
router.delete('/admins/:id', removeAdmin);

module.exports = router;
