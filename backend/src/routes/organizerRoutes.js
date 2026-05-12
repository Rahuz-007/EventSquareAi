const express = require('express');
const router = express.Router();
const { getOrganizerStats, getEventAttendees, checkInAttendee, getCheckinStats } = require('../controllers/organizerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('organizer', 'admin'));

router.get('/stats', getOrganizerStats);
router.get('/events/:eventId/attendees', getEventAttendees);
router.post('/checkin', checkInAttendee);
router.get('/events/:eventId/checkin-stats', getCheckinStats);

module.exports = router;
