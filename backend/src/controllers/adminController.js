const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get admin overview stats
// @route   GET /api/admin/stats
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalEvents, totalBookings, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  // Monthly revenue for chart
  const monthlyRevenue = await Booking.aggregate([
    { $match: { 'payment.status': 'paid', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Category distribution
  const categoryStats = await Event.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: '$analytics.revenue' } } },
    { $sort: { count: -1 } },
  ]);

  // Recent bookings
  const recentBookings = await Booking.find({ status: 'confirmed' })
    .populate('user', 'name email avatar')
    .populate('event', 'title banner')
    .sort('-createdAt')
    .limit(10)
    .lean();

  // Flagged bookings
  const flaggedBookings = await Booking.countDocuments({ isFlagged: true });

  res.json({
    success: true,
    data: {
      kpis: { totalUsers, totalEvents, totalBookings, totalRevenue, flaggedBookings },
      monthlyRevenue,
      categoryStats,
      recentBookings,
    },
  });
});

// @desc    Get all users (admin)
// @route   GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;
  const query = {};
  if (role) query.role = role;
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(query),
  ]);

  res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// @desc    Toggle user status
// @route   PATCH /api/admin/users/:id/toggle-status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ErrorResponse('User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: { isActive: user.isActive } });
});

// @desc    Get all events (admin)
// @route   GET /api/admin/events
const getAllEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(query).populate('organizer', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(query),
  ]);
  res.json({ success: true, data: events, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// @desc    Get flagged bookings
// @route   GET /api/admin/fraud
const getFlaggedBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ isFlagged: true })
    .populate('user', 'name email')
    .populate('event', 'title')
    .sort('-fraudScore')
    .lean();
  res.json({ success: true, data: bookings });
});

// @desc    Feature/unfeature event
// @route   PATCH /api/admin/events/:id/feature
const toggleFeatureEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ErrorResponse('Event not found', 404);
  event.featured = !event.featured;
  await event.save();
  res.json({ success: true, data: { featured: event.featured } });
});

// @desc    Send broadcast notification
// @route   POST /api/admin/notify
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, role } = req.body;
  const query = role ? { role } : {};
  const users = await User.find(query).select('_id');

  const notifications = users.map(u => ({
    recipient: u._id, type: 'system', title, message,
  }));
  await Notification.insertMany(notifications);

  req.io.emit('broadcast', { title, message });
  res.json({ success: true, message: `Notification sent to ${users.length} users` });
});

// @desc    Revenue analytics
// @route   GET /api/admin/analytics/revenue
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyRevenue = await Booking.aggregate([
    { $match: { 'payment.status': 'paid', createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const topEvents = await Booking.aggregate([
    { $match: { 'payment.status': 'paid', createdAt: { $gte: startDate } } },
    { $group: { _id: '$event', revenue: { $sum: '$totalAmount' }, tickets: { $sum: '$quantity' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
    { $unwind: '$event' },
    { $project: { revenue: 1, tickets: 1, 'event.title': 1, 'event.banner': 1 } },
  ]);

  res.json({ success: true, data: { dailyRevenue, topEvents } });
});

module.exports = { getAdminStats, getAllUsers, toggleUserStatus, getAllEvents, getFlaggedBookings, toggleFeatureEvent, broadcastNotification, getRevenueAnalytics };
