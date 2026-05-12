const Booking = require('../models/Booking');
const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get organizer dashboard stats
// @route   GET /api/organizer/stats
const getOrganizerStats = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).select('_id analytics totalSold status');
  const eventIds = events.map(e => e._id);

  const [totalBookings, revenueAgg, upcomingEvents, completedEvents] = await Promise.all([
    Booking.countDocuments({ event: { $in: eventIds }, status: 'confirmed' }),
    Booking.aggregate([
      { $match: { event: { $in: eventIds }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Event.countDocuments({ organizer: req.user.id, status: 'published', startDate: { $gte: new Date() } }),
    Event.countDocuments({ organizer: req.user.id, status: 'completed' }),
  ]);

  // Revenue by event
  const eventRevenue = await Booking.aggregate([
    { $match: { event: { $in: eventIds }, 'payment.status': 'paid' } },
    { $group: { _id: '$event', revenue: { $sum: '$totalAmount' }, tickets: { $sum: '$quantity' } } },
    { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
    { $unwind: '$event' },
    { $project: { revenue: 1, tickets: 1, 'event.title': 1, 'event.startDate': 1, 'event.status': 1 } },
    { $sort: { revenue: -1 } },
  ]);

  // Monthly revenue
  const monthlyRevenue = await Booking.aggregate([
    { $match: { event: { $in: eventIds }, 'payment.status': 'paid', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    data: {
      kpis: {
        totalEvents: events.length,
        totalBookings,
        totalRevenue: revenueAgg[0]?.total || 0,
        upcomingEvents,
        completedEvents,
      },
      eventRevenue,
      monthlyRevenue,
    },
  });
});

// @desc    Get attendees for an event
// @route   GET /api/organizer/events/:eventId/attendees
const getEventAttendees = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ErrorResponse('Event not found', 404);
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') throw new ErrorResponse('Not authorized', 403);

  const { page = 1, limit = 50, status } = req.query;
  const query = { event: req.params.eventId };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('user', 'name email phone avatar')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await Booking.countDocuments(query);
  res.json({ success: true, data: bookings, pagination: { total, page: Number(page) } });
});

// @desc    Check-in attendee
// @route   POST /api/organizer/checkin
const checkInAttendee = asyncHandler(async (req, res) => {
  const { qrData } = req.body;
  let parsedData;

  try {
    parsedData = JSON.parse(qrData);
  } catch {
    throw new ErrorResponse('Invalid QR code', 400);
  }

  const booking = await Booking.findOne({ bookingId: parsedData.bookingId }).populate('event user');
  if (!booking) throw new ErrorResponse('Booking not found', 404);
  if (booking.status !== 'confirmed') throw new ErrorResponse(`Booking is ${booking.status}`, 400);

  // Verify organizer owns the event
  if (booking.event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Not authorized for this event', 403);

  const ticket = booking.tickets.find(t => t.ticketNumber === parsedData.ticketNumber);
  if (!ticket) throw new ErrorResponse('Ticket not found', 404);
  if (ticket.isCheckedIn) throw new ErrorResponse('Ticket already checked in', 400);

  ticket.isCheckedIn = true;
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = req.user.id;
  booking.status = 'checked-in';
  await booking.save();

  // Real-time check-in broadcast
  req.io.to(booking.event._id.toString()).emit('attendee_checked_in', {
    bookingId: booking.bookingId,
    attendee: booking.user.name,
    time: new Date(),
  });

  res.json({ success: true, data: { booking, attendee: booking.user.name, event: booking.event.title } });
});

// @desc    Get check-in stats
// @route   GET /api/organizer/events/:eventId/checkin-stats
const getCheckinStats = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ErrorResponse('Event not found', 404);

  const stats = await Booking.aggregate([
    { $match: { event: event._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const checkinTimeline = await Booking.aggregate([
    { $match: { event: event._id, status: 'checked-in' } },
    { $group: { _id: { $dateToString: { format: '%H:%M', date: { $arrayElemAt: ['$tickets.checkedInAt', 0] } } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { stats, checkinTimeline, totalCapacity: event.totalCapacity, totalSold: event.totalSold } });
});

module.exports = { getOrganizerStats, getEventAttendees, checkInAttendee, getCheckinStats };
