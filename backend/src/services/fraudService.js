const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Fraud detection service
 * Analyzes booking patterns and assigns a fraud score (0-100)
 */
const detectFraud = async ({ userId, eventId, quantity, amount, ip }) => {
  const flags = [];
  let score = 0;

  try {
    // 1. Check rapid bookings from same user (within last hour)
    const recentBookings = await Booking.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recentBookings > 5) { score += 30; flags.push('rapid_booking_pattern'); }

    // 2. Check multiple bookings for same event
    const sameEventBookings = await Booking.countDocuments({ user: userId, event: eventId });
    if (sameEventBookings > 2) { score += 25; flags.push('repeated_same_event'); }

    // 3. Check high quantity booking
    if (quantity > 8) { score += 20; flags.push('high_quantity'); }

    // 4. Check large transaction amount
    if (amount > 50000) { score += 15; flags.push('large_transaction'); }

    // 5. Check if user account is very new (< 24 hours)
    const user = await User.findById(userId);
    if (user) {
      const accountAge = Date.now() - user.createdAt.getTime();
      if (accountAge < 24 * 60 * 60 * 1000) { score += 20; flags.push('new_account'); }

      // 6. Check if user has no previous successful bookings
      const successfulBookings = await Booking.countDocuments({ user: userId, status: 'confirmed' });
      if (successfulBookings === 0 && amount > 10000) { score += 10; flags.push('no_booking_history'); }
    }

    // 7. Multiple failed payments
    const failedPayments = await Booking.countDocuments({
      user: userId,
      'payment.status': 'failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (failedPayments > 3) { score += 25; flags.push('multiple_failed_payments'); }

    return { score: Math.min(score, 100), flags, isHighRisk: score > 70 };
  } catch (error) {
    return { score: 0, flags: [], isHighRisk: false };
  }
};

module.exports = { detectFraud };
