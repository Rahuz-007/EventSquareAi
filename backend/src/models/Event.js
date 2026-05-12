const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  sold: { type: Number, default: 0 },
  description: String,
  perks: [String],
  maxPerUser: { type: Number, default: 5 },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title required'], trim: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: [true, 'Description required'], maxlength: 5000 },
  shortDescription: { type: String, maxlength: 300 },
  category: {
    type: String,
    enum: ['music', 'tech', 'sports', 'art', 'food', 'business', 'health', 'education', 'comedy', 'other'],
    required: true,
  },
  tags: [String],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    coordinates: { lat: Number, lng: Number },
    isOnline: { type: Boolean, default: false },
    onlineLink: String,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  ticketTiers: [ticketTierSchema],
  totalCapacity: { type: Number, required: true },
  totalSold: { type: Number, default: 0 },
  banner: { type: String, default: '' },
  images: [String],
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed', 'paused'], default: 'draft' },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 0 },
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  views: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  analytics: {
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  aiEmbedding: [Number],
  refundPolicy: { type: String, enum: ['no-refund', '24h', '48h', '7d', 'flexible'], default: '24h' },
  ageRestriction: { type: Number, default: 0 },
  allowWaitlist: { type: Boolean, default: false },
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Generate slug
eventSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  if (this.ticketTiers && this.ticketTiers.length > 0) {
    const prices = this.ticketTiers.map(t => t.price);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.totalCapacity = this.ticketTiers.reduce((sum, t) => sum + t.quantity, 0);
    this.isFree = this.minPrice === 0;
  }
  next();
});

eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);
