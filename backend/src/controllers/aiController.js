const axios = require('axios');
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get AI event recommendations
// @route   GET /api/ai/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  const userBookings = await Booking.find({ user: req.user.id }).populate('event', 'category tags').lean();

  // Build user preference profile
  const categoryFreq = {};
  const tagFreq = {};
  userBookings.forEach(b => {
    if (b.event) {
      categoryFreq[b.event.category] = (categoryFreq[b.event.category] || 0) + 1;
      (b.event.tags || []).forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; });
    }
  });

  // Add viewed events
  (user.behavior?.viewedEvents || []).forEach(eId => {
    // Track view behavior
  });

  // Top preferred categories and tags
  const topCategories = Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

  // Query recommended events
  const bookedEventIds = userBookings.map(b => b.event?._id).filter(Boolean);
  const query = {
    status: 'published',
    _id: { $nin: bookedEventIds },
    startDate: { $gte: new Date() },
  };

  let recommendedEvents;
  if (topCategories.length > 0) {
    // Preference-based
    recommendedEvents = await Event.find({ ...query, $or: [{ category: { $in: topCategories } }, { tags: { $in: topTags } }] })
      .populate('organizer', 'name avatar')
      .sort('-views -rating.average')
      .limit(8)
      .lean();
  }

  if (!recommendedEvents || recommendedEvents.length < 4) {
    // Fallback: trending events
    recommendedEvents = await Event.find(query)
      .populate('organizer', 'name avatar')
      .sort('-views -totalSold -rating.average')
      .limit(8)
      .lean();
  }

  // Try AI service for enhanced recommendations
  try {
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/recommend`, {
      user_id: req.user.id,
      categories: topCategories,
      tags: topTags,
      event_ids: recommendedEvents.map(e => e._id.toString()),
    }, { timeout: 3000 });

    if (aiResponse.data?.reranked) {
      // Reorder based on AI scores
      const scoreMap = {};
      aiResponse.data.reranked.forEach(r => { scoreMap[r.event_id] = r.score; });
      recommendedEvents.sort((a, b) => (scoreMap[b._id.toString()] || 0) - (scoreMap[a._id.toString()] || 0));
    }
  } catch (err) {
    // AI service unavailable, use base recommendations
  }

  res.json({ success: true, data: recommendedEvents, meta: { basedOn: topCategories } });
});

// @desc    Get trending events
// @route   GET /api/ai/trending
const getTrending = asyncHandler(async (req, res) => {
  const events = await Event.find({ status: 'published', startDate: { $gte: new Date() } })
    .populate('organizer', 'name avatar')
    .sort('-views -totalSold')
    .limit(6)
    .lean();
  res.json({ success: true, data: events });
});

// @desc    Track user behavior
// @route   POST /api/ai/track
const trackBehavior = asyncHandler(async (req, res) => {
  const { eventId, action } = req.body;
  if (action === 'view' && eventId) {
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { 'behavior.viewedEvents': eventId },
      $set: { 'behavior.lastActivity': new Date() },
    });
  }
  if (action === 'search' && req.body.query) {
    await User.findByIdAndUpdate(req.user.id, {
      $push: { 'behavior.searchHistory': { $each: [req.body.query], $slice: -20 } },
    });
  }
  res.json({ success: true });
});

// @desc    Get AI analytics for admin
// @route   GET /api/ai/analytics
const getAIAnalytics = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${process.env.AI_SERVICE_URL}/analytics`, { timeout: 5000 });
    res.json({ success: true, data: response.data });
  } catch (err) {
    // Return mock analytics if AI service is down
    res.json({ success: true, data: { fraudDetection: { totalFlagged: await Booking.countDocuments({ isFlagged: true }) }, status: 'AI service unavailable' } });
  }
});

module.exports = { getRecommendations, getTrending, trackBehavior, getAIAnalytics };
