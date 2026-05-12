const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['booking_confirmed', 'booking_cancelled', 'event_reminder', 'payment_success', 'payment_failed',
      'event_update', 'check_in', 'new_event', 'refund', 'fraud_alert', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  channels: { email: { type: Boolean, default: false }, push: { type: Boolean, default: false }, inApp: { type: Boolean, default: true } },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
