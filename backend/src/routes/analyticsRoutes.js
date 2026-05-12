const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

// Platform-wide analytics
router.get('/platform', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const [totalRevenue, totalBookings, totalUsers, totalEvents, categoryBreakdown, ticketSales] = await Promise.all([
    Booking.aggregate([{ $match: { 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' } } }]),
    Booking.countDocuments({ status: 'confirmed' }),
    User.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    Event.aggregate([{ $group: { _id: '$category', events: { $sum: 1 }, revenue: { $sum: '$analytics.revenue' } } }, { $sort: { revenue: -1 } }]),
    Booking.aggregate([
      { $match: { 'payment.status': 'paid', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$quantity' }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      revenue: totalRevenue[0] || { total: 0, avg: 0 },
      bookings: totalBookings,
      users: totalUsers,
      events: totalEvents,
      categoryBreakdown,
      ticketSales,
    },
  });
}));

// Booking routes (standalone)
router.post('/bookings', protect, asyncHandler(async (req, res) => {
  const booking = await Booking.create({ ...req.body, user: req.user.id });
  res.status(201).json({ success: true, data: booking });
}));

module.exports = router;
