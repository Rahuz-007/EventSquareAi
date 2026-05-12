const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get user bookings
router.get('/bookings', protect, asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('event', 'title banner startDate endDate venue category')
    .sort('-createdAt').lean();
  res.json({ success: true, data: bookings });
}));

// Get user notifications
router.get('/notifications', protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id }).sort('-createdAt').limit(50).lean();
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
}));

// Mark notification as read
router.patch('/notifications/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.json({ success: true });
}));

// Mark all as read
router.patch('/notifications/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true });
}));

// Get user wishlist
router.get('/wishlist', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'title banner startDate venue minPrice category');
  res.json({ success: true, data: user.wishlist });
}));

// Toggle wishlist
router.post('/wishlist/:eventId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const eventId = req.params.eventId;
  
  const index = user.wishlist.indexOf(eventId);
  let isWishlisted = false;
  
  if (index > -1) {
    user.wishlist.splice(index, 1);
  } else {
    user.wishlist.push(eventId);
    isWishlisted = true;
  }
  
  await user.save();
  res.json({ success: true, isWishlisted, data: user.wishlist });
}));

module.exports = router;
