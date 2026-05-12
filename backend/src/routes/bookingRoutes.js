const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');

router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user.id };
  if (status) query.status = status;
  const bookings = await Booking.find(query)
    .populate('event', 'title banner startDate venue category')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();
  const total = await Booking.countDocuments(query);
  res.json({ success: true, data: bookings, pagination: { total, page: Number(page) } });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('event', 'title banner startDate endDate venue organizer')
    .populate('user', 'name email');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Not authorized' });
  res.json({ success: true, data: booking });
}));

module.exports = router;
