const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const sendEmail = require('../services/emailService');
const { generateQRCode } = require('../services/qrService');
const { detectFraud } = require('../services/fraudService');

// Lazy Razorpay init — prevents crash if keys not set
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || keyId.includes('xxx') || !keySecret || keySecret.includes('xxx')) {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};


// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { eventId, tierId, quantity, couponCode } = req.body;

  const event = await Event.findById(eventId);
  if (!event || event.status !== 'published') throw new ErrorResponse('Event not available', 404);

  const tier = event.ticketTiers.id(tierId);
  if (!tier) throw new ErrorResponse('Ticket tier not found', 404);

  const available = tier.quantity - tier.sold;
  if (available < quantity) throw new ErrorResponse(`Only ${available} tickets remaining`, 400);

  // Check per-user limit
  const existingBookings = await Booking.countDocuments({
    user: req.user.id, event: eventId, status: { $in: ['confirmed', 'pending'] },
  });
  if (existingBookings + quantity > tier.maxPerUser) {
    throw new ErrorResponse(`Maximum ${tier.maxPerUser} tickets per user`, 400);
  }

  const originalTotalAmount = tier.price * quantity;
  let totalAmount = originalTotalAmount;
  let discount = 0;
  let appliedCoupon = null;

  // Handle Coupon
  if (couponCode && originalTotalAmount > 0) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      validUntil: { $gt: new Date() },
    });

    if (coupon) {
      if (coupon.minOrderAmount > 0 && originalTotalAmount < coupon.minOrderAmount) {
        throw new ErrorResponse(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new ErrorResponse('Coupon usage limit reached', 400);
      }
      if (coupon.applicableEvents.length > 0 && !coupon.applicableEvents.includes(eventId)) {
        throw new ErrorResponse('Coupon is not applicable for this event', 400);
      }
      if (coupon.applicableCategories.length > 0 && !coupon.applicableCategories.includes(event.category)) {
        throw new ErrorResponse('Coupon is not applicable for this event category', 400);
      }

      const userUsages = coupon.usedBy.filter(u => u.user.toString() === req.user.id);
      if (userUsages.length >= coupon.perUserLimit) {
        throw new ErrorResponse('You have reached the maximum usage limit for this coupon', 400);
      }

      appliedCoupon = coupon;
      if (coupon.discountType === 'percentage') {
        const potentialDiscount = (originalTotalAmount * coupon.discountValue) / 100;
        discount = coupon.maxDiscount ? Math.min(potentialDiscount, coupon.maxDiscount) : potentialDiscount;
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, originalTotalAmount);
      totalAmount = originalTotalAmount - discount;
    } else {
      throw new ErrorResponse('Invalid or expired coupon', 400);
    }
  }

  const amountInPaise = totalAmount * 100;

  // Fraud detection
  const fraudResult = await detectFraud({ userId: req.user.id, eventId, quantity, amount: totalAmount, ip: req.ip });

  if (fraudResult.score > 80) {
    throw new ErrorResponse('Transaction flagged for security review. Contact support.', 403);
  }

  // Handle FREE tickets
  if (totalAmount === 0) {
    const booking = await Booking.create({
      user: req.user.id,
      event: eventId,
      ticketTier: { tierId, name: tier.name, price: 0 },
      quantity,
      totalAmount: 0,
      originalAmount: originalTotalAmount,
      discount,
      couponCode: appliedCoupon?.code,
      status: 'confirmed',
      'payment.status': 'paid',
      'payment.paidAt': new Date(),
      fraudScore: fraudResult.score,
      fraudFlags: fraudResult.flags,
      isFlagged: fraudResult.score > 50,
      ipAddress: req.ip,
    });
    
    // Update event sold count
    await Event.findOneAndUpdate(
      { _id: eventId, 'ticketTiers._id': tierId },
      { $inc: { 'ticketTiers.$.sold': quantity, totalSold: quantity } }
    );
    await User.findByIdAndUpdate(req.user.id, { $push: { bookingHistory: booking._id } });
    
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usedBy.push({ user: req.user.id, usedAt: new Date() });
      await appliedCoupon.save();
    }
    
    return res.json({
      success: true,
      data: { bookingId: booking._id, amount: 0, free: true, eventTitle: event.title, tierName: tier.name },
    });
  }

  // Create Razorpay order for paid tickets
  const razorpay = getRazorpay();
  let razorpayOrderId;
  
  if (!razorpay) {
    // Demo Mode bypass
    razorpayOrderId = `demo_order_${Date.now()}`;
  } else {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `evs_${Date.now()}`,
      notes: { eventId: eventId.toString(), userId: req.user.id.toString(), tierId: tierId.toString() },
    });
    razorpayOrderId = razorpayOrder.id;
  }

  // Create pending booking
  const booking = await Booking.create({
    user: req.user.id,
    event: eventId,
    ticketTier: { tierId, name: tier.name, price: tier.price },
    quantity,
    totalAmount,
    originalAmount: originalTotalAmount,
    discount,
    couponCode: appliedCoupon?.code,
    'payment.razorpayOrderId': razorpayOrderId,
    fraudScore: fraudResult.score,
    fraudFlags: fraudResult.flags,
    isFlagged: fraudResult.score > 50,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({
    success: true,
    data: {
      orderId: razorpayOrderId,
      bookingId: booking._id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'demo_key',
      eventTitle: event.title,
      tierName: tier.name,
    },
  });
});

// @desc    Verify payment and confirm booking
// @route   POST /api/payments/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  // Verify signature
  if (!razorpay_order_id.startsWith('demo_order_')) {
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    if (expectedSignature !== razorpay_signature) throw new ErrorResponse('Payment verification failed', 400);
  }

  const booking = await Booking.findById(bookingId).populate('event user');
  if (!booking) throw new ErrorResponse('Booking not found', 404);

  // Update booking
  booking.status = 'confirmed';
  booking.payment.razorpayPaymentId = razorpay_payment_id;
  booking.payment.razorpaySignature = razorpay_signature;
  booking.payment.status = 'paid';
  booking.payment.paidAt = new Date();

  // Generate QR codes for each ticket
  for (let i = 0; i < booking.quantity; i++) {
    const ticketData = {
      bookingId: booking.bookingId,
      ticketNumber: booking.tickets[i]?.ticketNumber || `TKT-${Date.now()}-${i}`,
      event: booking.event._id,
      attendee: booking.user.name,
    };
    const qrCode = await generateQRCode(JSON.stringify(ticketData));
    if (booking.tickets[i]) {
      booking.tickets[i].qrCode = qrCode;
      booking.tickets[i].attendeeName = booking.user.name;
      booking.tickets[i].attendeeEmail = booking.user.email;
    } else {
      booking.tickets.push({ qrCode, attendeeName: booking.user.name, attendeeEmail: booking.user.email });
    }
  }

  await booking.save();

  // Update event sold count
  await Event.findOneAndUpdate(
    { _id: booking.event._id, 'ticketTiers._id': booking.ticketTier.tierId },
    { $inc: { 'ticketTiers.$.sold': booking.quantity, totalSold: booking.quantity, 'analytics.revenue': booking.totalAmount } }
  );

  // Record coupon usage on successful payment
  if (booking.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: booking.couponCode },
      { 
        $inc: { usedCount: 1 },
        $push: { usedBy: { user: booking.user._id, usedAt: new Date() } }
      }
    );
  }

  // Update user booking history
  await User.findByIdAndUpdate(booking.user._id, { $push: { bookingHistory: booking._id } });

  // Send confirmation email
  try {
    await sendEmail({
      email: booking.user.email,
      subject: `Booking Confirmed - ${booking.event.title}`,
      template: 'bookingConfirmation',
      data: { booking, event: booking.event, user: booking.user },
    });
    booking.emailSent = true;
    await booking.save();
  } catch (err) { console.error('Email send failed:', err.message); }

  // Create notification
  await Notification.create({
    recipient: booking.user._id,
    type: 'booking_confirmed',
    title: 'Booking Confirmed!',
    message: `Your booking for ${booking.event.title} is confirmed. Booking ID: ${booking.bookingId}`,
    data: { bookingId: booking._id },
  });

  // Socket notification
  req.io.to(booking.user._id.toString()).emit('booking_confirmed', { booking: booking.bookingId });

  res.json({ success: true, data: { booking, message: 'Payment verified & booking confirmed!' } });
});

// @desc    Get payment history
// @route   GET /api/payments/history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id, 'payment.status': 'paid' })
    .populate('event', 'title banner startDate venue')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, data: bookings });
});

// @desc    Process refund
// @route   POST /api/payments/refund/:bookingId
const processRefund = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ErrorResponse('Booking not found', 404);
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') throw new ErrorResponse('Not authorized', 403);
  if (booking.payment.status !== 'paid') throw new ErrorResponse('Booking not eligible for refund', 400);

  // Razorpay refund
  const rzp = getRazorpay();
  if (!rzp) throw new ErrorResponse('Payment gateway not configured', 503);
  const refund = await rzp.payments.refund(booking.payment.razorpayPaymentId, {
    amount: booking.totalAmount * 100,
    speed: 'normal',
    notes: { reason: req.body.reason || 'User requested refund' },
  });

  booking.status = 'refunded';
  booking.payment.status = 'refunded';
  booking.refundAmount = booking.totalAmount;
  booking.refundedAt = new Date();
  booking.cancelReason = req.body.reason;
  await booking.save();

  // Restore ticket count
  await Event.findOneAndUpdate(
    { _id: booking.event, 'ticketTiers._id': booking.ticketTier.tierId },
    { $inc: { 'ticketTiers.$.sold': -booking.quantity, totalSold: -booking.quantity } }
  );

  res.json({ success: true, data: { refundId: refund.id, message: 'Refund processed successfully' } });
});

// @desc    Get Razorpay key
// @route   GET /api/payments/key
const getRazorpayKey = asyncHandler(async (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// @desc    Validate Coupon
// @route   POST /api/payments/validate-coupon
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, eventId, totalAmount } = req.body;

  if (!code) throw new ErrorResponse('Coupon code is required', 400);

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validUntil: { $gt: new Date() },
  });

  if (!coupon) throw new ErrorResponse('Invalid or expired coupon', 400);

  if (coupon.minOrderAmount > 0 && totalAmount < coupon.minOrderAmount) {
    throw new ErrorResponse(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ErrorResponse('Coupon usage limit reached', 400);
  }
  
  if (eventId) {
    const event = await Event.findById(eventId);
    if (!event) throw new ErrorResponse('Event not found', 404);
    
    if (coupon.applicableEvents.length > 0 && !coupon.applicableEvents.includes(eventId)) {
      throw new ErrorResponse('Coupon is not applicable for this event', 400);
    }
    if (coupon.applicableCategories.length > 0 && !coupon.applicableCategories.includes(event.category)) {
      throw new ErrorResponse('Coupon is not applicable for this event category', 400);
    }
  }

  const userUsages = coupon.usedBy.filter(u => u.user.toString() === req.user.id);
  if (userUsages.length >= coupon.perUserLimit) {
    throw new ErrorResponse('You have reached the maximum usage limit for this coupon', 400);
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    const potentialDiscount = (totalAmount * coupon.discountValue) / 100;
    discount = coupon.maxDiscount ? Math.min(potentialDiscount, coupon.maxDiscount) : potentialDiscount;
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, totalAmount);

  res.json({ success: true, data: { discount, finalAmount: totalAmount - discount, code: coupon.code } });
});

module.exports = { createOrder, verifyPayment, getPaymentHistory, processRefund, getRazorpayKey, validateCoupon };
