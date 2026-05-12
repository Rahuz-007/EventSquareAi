const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 150 },
  body: { type: String, maxlength: 2000 },
  aspects: {
    venue: { type: Number, min: 1, max: 5 },
    organization: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    experience: { type: Number, min: 1, max: 5 },
  },
  helpfulVotes: { type: Number, default: 0 },
  votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  organizerReply: {
    message: String,
    repliedAt: Date,
  },
  isVerified: { type: Boolean, default: false }, // verified purchase
  isHidden: { type: Boolean, default: false },
  photos: [String],
}, { timestamps: true });

reviewSchema.index({ event: 1, user: 1 }, { unique: true });
reviewSchema.index({ event: 1, rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
