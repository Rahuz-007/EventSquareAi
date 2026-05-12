const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory, processRefund, getRazorpayKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/key', protect, getRazorpayKey);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);
router.post('/refund/:bookingId', protect, processRefund);
router.post('/validate-coupon', protect, require('../controllers/paymentController').validateCoupon);

module.exports = router;
