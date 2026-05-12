const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 chars'] },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  preferences: {
    categories: [String],
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
  },
  bookingHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  behavior: {
    viewedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    searchHistory: [String],
    lastActivity: { type: Date, default: Date.now },
  },
  organizerProfile: {
    companyName: String,
    website: String,
    bio: String,
    verified: { type: Boolean, default: false },
    totalRevenue: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Sign JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
