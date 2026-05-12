const express = require('express');
const router = express.Router();
const { getRecommendations, getTrending, trackBehavior, getAIAnalytics } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.get('/recommendations', protect, getRecommendations);
router.get('/trending', getTrending);
router.post('/track', protect, trackBehavior);
router.get('/analytics', protect, authorize('admin'), getAIAnalytics);

module.exports = router;
