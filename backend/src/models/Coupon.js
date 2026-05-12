const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: null }, // cap for percentage discounts
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  applicableEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }], // empty = all events
  applicableCategories: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, usedAt: Date }],
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
