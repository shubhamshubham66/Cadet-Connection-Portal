const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cadet = require('../models/Cadet');
const Settings = require('../models/Settings');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// ═══════════════════════════════════════════
// CADET PAYMENT ENDPOINTS
// ═══════════════════════════════════════════

// ─── GET PAYMENT STATUS (for logged-in cadet) ───
router.get('/my-status', verifyToken, requireRole('Cadet'), async (req, res) => {
  try {
    const cadet = await Cadet.findById(req.user.id).select(
      'registrationFeePaid registrationFeeAmount razorpayPaymentId paidAt'
    );
    if (!cadet) {
      return res.status(404).json({ success: false, message: 'Cadet not found.' });
    }

    // Get fee amount: per-cadet override > global default
    const feeAmount = cadet.registrationFeeAmount || await Settings.getValue('defaultRegistrationFee', 0);

    res.json({
      success: true,
      payment: {
        isPaid: cadet.registrationFeePaid,
        amount: feeAmount,
        paymentId: cadet.razorpayPaymentId || null,
        paidAt: cadet.paidAt || null
      }
    });
  } catch (error) {
    console.error('Get Payment Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── CREATE RAZORPAY ORDER (for logged-in cadet) ───
router.post('/create-order', verifyToken, requireRole('Cadet'), async (req, res) => {
  try {
    const cadet = await Cadet.findById(req.user.id);
    if (!cadet) {
      return res.status(404).json({ success: false, message: 'Cadet not found.' });
    }

    if (cadet.registrationFeePaid) {
      return res.status(400).json({ success: false, message: 'Registration fee already paid.' });
    }

    // Get fee amount: per-cadet override > global default
    const feeAmount = cadet.registrationFeeAmount || await Settings.getValue('defaultRegistrationFee', 0);

    if (!feeAmount || feeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Fee amount not configured. Contact admin.' });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(feeAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `ccp_${cadet._id}_${Date.now()}`,
      notes: {
        cadetId: cadet._id.toString(),
        cadetName: cadet.name,
        regimentNo: cadet.regimentNo,
        battalion: cadet.battalion
      }
    });

    // Save order ID to cadet record
    cadet.razorpayOrderId = order.id;
    await cadet.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      cadet: {
        name: cadet.name,
        email: cadet.email,
        mobile: cadet.mobile
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// ─── VERIFY PAYMENT (Razorpay signature verification) ───
router.post('/verify-payment', verifyToken, requireRole('Cadet'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Find cadet by order ID and verify ownership
    const cadet = await Cadet.findOne({
      _id: req.user.id,
      razorpayOrderId: razorpay_order_id
    });

    if (!cadet) {
      return res.status(404).json({ success: false, message: 'Order not found for this cadet.' });
    }

    if (cadet.registrationFeePaid) {
      return res.status(400).json({ success: false, message: 'Payment already recorded.' });
    }

    // Update cadet payment fields
    cadet.registrationFeePaid = true;
    cadet.razorpayPaymentId = razorpay_payment_id;
    cadet.razorpaySignature = razorpay_signature;
    cadet.paidAt = new Date();

    // If no per-cadet amount was set, record the global default at time of payment
    if (!cadet.registrationFeeAmount) {
      cadet.registrationFeeAmount = await Settings.getValue('defaultRegistrationFee', 0);
    }

    await cadet.save();

    res.json({
      success: true,
      message: 'Payment verified and recorded successfully.',
      payment: {
        isPaid: true,
        paymentId: razorpay_payment_id,
        amount: cadet.registrationFeeAmount,
        paidAt: cadet.paidAt
      }
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// ═══════════════════════════════════════════
// ADMIN: GLOBAL FEE SETTINGS
// ═══════════════════════════════════════════

// ─── GET GLOBAL FEE SETTING ───
router.get('/settings/fee', verifyToken, requireRole('MainAdmin'), async (req, res) => {
  try {
    const fee = await Settings.getValue('defaultRegistrationFee', 0);
    res.json({ success: true, defaultRegistrationFee: fee });
  } catch (error) {
    console.error('Get Fee Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── UPDATE GLOBAL FEE SETTING ───
router.put('/settings/fee', verifyToken, requireRole('MainAdmin'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Valid fee amount is required (>= 0).' });
    }

    await Settings.setValue(
      'defaultRegistrationFee',
      Number(amount),
      req.user.id,
      'Default registration fee amount for all cadets (in INR)'
    );

    res.json({ success: true, message: 'Default registration fee updated.', amount: Number(amount) });
  } catch (error) {
    console.error('Update Fee Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PER-CADET FEE OVERRIDE ───
router.patch('/cadet/:cadetId/fee-override', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Valid fee amount is required (>= 0).' });
    }

    const cadet = await Cadet.findById(req.params.cadetId);
    if (!cadet) {
      return res.status(404).json({ success: false, message: 'Cadet not found.' });
    }

    // BnAdmin can only override for their own battalion
    if (req.user.role === 'BnAdmin' && cadet.battalion !== req.user.assignedBattalion) {
      return res.status(403).json({ success: false, message: 'Access denied. Cadet is not in your battalion.' });
    }

    cadet.registrationFeeAmount = Number(amount);
    await cadet.save();

    res.json({
      success: true,
      message: `Fee override set to ₹${amount} for ${cadet.name}.`,
      cadet: {
        id: cadet._id,
        name: cadet.name,
        registrationFeeAmount: cadet.registrationFeeAmount
      }
    });
  } catch (error) {
    console.error('Fee Override Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════
// ADMIN: PAYMENT VISIBILITY (Battalion-Isolated)
// ═══════════════════════════════════════════

// ─── BN ADMIN: Payment status for own battalion cadets ───
// ─── MAIN ADMIN: All cadets with optional battalion filter ───
router.get('/admin/payments', verifyToken, requireRole('MainAdmin', 'BnAdmin'), async (req, res) => {
  try {
    let filter = {};

    // BnAdmin: strictly isolated to own battalion
    if (req.user.role === 'BnAdmin') {
      filter.battalion = req.user.assignedBattalion;
    }

    // MainAdmin: optional battalion filter from query
    if (req.user.role === 'MainAdmin' && req.query.battalion) {
      filter.battalion = req.query.battalion;
    }

    // Optional status filter
    if (req.query.paymentStatus === 'paid') {
      filter.registrationFeePaid = true;
    } else if (req.query.paymentStatus === 'unpaid') {
      filter.registrationFeePaid = { $ne: true };
    }

    // Search by name/regimentNo
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { regimentNo: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [cadets, total] = await Promise.all([
      Cadet.find(filter)
        .select('name regimentNo battalion institute registrationFeePaid registrationFeeAmount razorpayPaymentId paidAt')
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Cadet.countDocuments(filter)
    ]);

    // Summary stats
    const summaryFilter = { ...filter };
    delete summaryFilter.registrationFeePaid; // Remove payment filter for total summary
    delete summaryFilter.$or; // Remove search filter for summary

    // Rebuild battalion filter only
    const bnFilter = {};
    if (req.user.role === 'BnAdmin') bnFilter.battalion = req.user.assignedBattalion;
    if (req.user.role === 'MainAdmin' && req.query.battalion) bnFilter.battalion = req.query.battalion;

    const [totalCadets, paidCount, totalCollected] = await Promise.all([
      Cadet.countDocuments(bnFilter),
      Cadet.countDocuments({ ...bnFilter, registrationFeePaid: true }),
      Cadet.aggregate([
        { $match: { ...bnFilter, registrationFeePaid: true } },
        { $group: { _id: null, total: { $sum: '$registrationFeeAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      cadets,
      summary: {
        totalCadets,
        paidCount,
        unpaidCount: totalCadets - paidCount,
        totalCollected: totalCollected[0]?.total || 0
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Admin Payments Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── MAIN ADMIN: Battalion-wise payment summary (all 22 battalions) ───
router.get('/admin/payments/summary', verifyToken, requireRole('MainAdmin'), async (req, res) => {
  try {
    const summary = await Cadet.aggregate([
      {
        $group: {
          _id: '$battalion',
          totalCadets: { $sum: 1 },
          paidCount: { $sum: { $cond: ['$registrationFeePaid', 1, 0] } },
          totalCollected: { $sum: { $cond: ['$registrationFeePaid', '$registrationFeeAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Grand totals
    const grandTotal = summary.reduce((acc, bn) => ({
      totalCadets: acc.totalCadets + bn.totalCadets,
      paidCount: acc.paidCount + bn.paidCount,
      totalCollected: acc.totalCollected + bn.totalCollected
    }), { totalCadets: 0, paidCount: 0, totalCollected: 0 });

    res.json({
      success: true,
      battalions: summary.map(bn => ({
        battalion: bn._id,
        totalCadets: bn.totalCadets,
        paidCount: bn.paidCount,
        unpaidCount: bn.totalCadets - bn.paidCount,
        totalCollected: bn.totalCollected
      })),
      grandTotal: {
        ...grandTotal,
        unpaidCount: grandTotal.totalCadets - grandTotal.paidCount
      }
    });
  } catch (error) {
    console.error('Payment Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
