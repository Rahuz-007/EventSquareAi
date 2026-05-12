const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, default: () => `EVS-${uuidv4().split('-')[0].toUpperCase()}`, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketTier: {
    tierId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
  },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'checked-in'],
    default: 'pending',
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    method: String,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paidAt: Date,
  },
  tickets: [{
    ticketNumber: { type: String, default: () => `TKT-${uuidv4().split('-')[0].toUpperCase()}` },
    qrCode: String,
    isCheckedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendeeName: String,
    attendeeEmail: String,
  }],
  couponCode: String,
  discount: { type: Number, default: 0 },
  originalAmount: Number,
  fraudScore: { type: Number, default: 0 },
  fraudFlags: [String],
  isFlagged: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  ipAddress: String,
  userAgent: String,
  cancelledAt: Date,
  cancelReason: String,
  refundAmount: { type: Number, default: 0 },
  refundedAt: Date,
}, { timestamps: true });

bookingSchema.index({ user: 1, event: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'payment.razorpayOrderId': 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
