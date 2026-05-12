const express = require('express');
const router = express.Router();
const { getAdminStats, getAllUsers, toggleUserStatus, getAllEvents, getFlaggedBookings, toggleFeatureEvent, broadcastNotification, getRevenueAnalytics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/events', getAllEvents);
router.patch('/events/:id/feature', toggleFeatureEvent);
router.get('/fraud', getFlaggedBookings);
router.post('/notify', broadcastNotification);
router.get('/analytics/revenue', getRevenueAnalytics);

module.exports = router;
