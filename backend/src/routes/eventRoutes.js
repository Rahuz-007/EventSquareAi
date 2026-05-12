const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getFeaturedEvents, getEventCategories, getMyEvents, publishEvent } = require('../controllers/eventController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/categories', getEventCategories);
router.get('/my-events', protect, authorize('organizer', 'admin'), getMyEvents);
router.get('/:id', optionalAuth, getEvent);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.patch('/:id/publish', protect, authorize('organizer', 'admin'), publishEvent);

module.exports = router;
