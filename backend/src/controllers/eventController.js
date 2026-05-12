const Event = require('../models/Event');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { uploadImage } = require('../services/uploadService');

// @desc    Get all events (with search & filter)
// @route   GET /api/events
const getEvents = asyncHandler(async (req, res) => {
  const {
    search, category, city, minPrice, maxPrice,
    startDate, endDate, page = 1, limit = 12,
    sort = '-createdAt', featured, status = 'published',
  } = req.query;

  const query = { status };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query['venue.city'] = new RegExp(city, 'i');
  if (featured === 'true') query.featured = true;
  if (minPrice || maxPrice) {
    query.minPrice = {};
    if (minPrice) query.minPrice.$gte = Number(minPrice);
    if (maxPrice) query.maxPrice = { $lte: Number(maxPrice) };
  }
  if (startDate) query.startDate = { $gte: new Date(startDate) };
  if (endDate) query.endDate = { $lte: new Date(endDate) };

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(query).populate('organizer', 'name avatar organizerProfile').sort(sort).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: events,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

// @desc    Get single event
// @route   GET /api/events/:id
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name avatar email organizerProfile');
  if (!event) throw new ErrorResponse('Event not found', 404);

  // Increment views
  await Event.findByIdAndUpdate(req.params.id, { $inc: { views: 1, 'analytics.pageViews': 1 } });

  // Check availability
  const availability = event.ticketTiers.map(tier => ({
    tierId: tier._id,
    name: tier.name,
    price: tier.price,
    available: tier.quantity - tier.sold,
    sold: tier.sold,
  }));

  res.json({ success: true, data: { ...event.toObject(), availability } });
});

// @desc    Create event
// @route   POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  req.body.organizer = req.user.id;
  const event = await Event.create(req.body);

  // Notify via socket
  req.io.emit('new_event', { event: { _id: event._id, title: event.title, category: event.category } });

  res.status(201).json({ success: true, data: event });
});

// @desc    Update event
// @route   PUT /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);
  if (!event) throw new ErrorResponse('Event not found', 404);

  // Authorization
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Not authorized to update this event', 403);

  event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: event });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ErrorResponse('Event not found', 404);

  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Not authorized', 403);

  if (event.totalSold > 0) throw new ErrorResponse('Cannot delete event with existing bookings. Cancel it instead.', 400);

  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted' });
});

// @desc    Get featured events
// @route   GET /api/events/featured
const getFeaturedEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ featured: true, status: 'published' })
    .populate('organizer', 'name avatar')
    .sort('-startDate')
    .limit(6)
    .lean();
  res.json({ success: true, data: events });
});

// @desc    Get event categories with counts
// @route   GET /api/events/categories
const getEventCategories = asyncHandler(async (req, res) => {
  const categories = await Event.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: categories });
});

// @desc    Get organizer events
// @route   GET /api/events/my-events
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).sort('-createdAt').lean();
  res.json({ success: true, data: events });
});

// @desc    Publish event
// @route   PATCH /api/events/:id/publish
const publishEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ErrorResponse('Event not found', 404);
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Not authorized', 403);

  event.status = 'published';
  await event.save();
  res.json({ success: true, data: event });
});

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getFeaturedEvents, getEventCategories, getMyEvents, publishEvent };
