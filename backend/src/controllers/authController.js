const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const sendEmail = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ErrorResponse('Email already registered', 400);

  const allowedRoles = ['user', 'organizer'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  const user = await User.create({ name, email, password, role: userRole });

  // Create welcome notification
  await Notification.create({
    recipient: user._id,
    type: 'system',
    title: 'Welcome to EventSphere AI!',
    message: 'Your account has been created. Explore amazing events near you!',
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ErrorResponse('Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ErrorResponse('Invalid credentials', 401);
  if (!user.isActive) throw new ErrorResponse('Account deactivated. Contact support.', 403);

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new ErrorResponse('Invalid credentials', 401);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('bookingHistory', 'bookingId status totalAmount');
  res.json({ success: true, data: user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, preferences } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, avatar, preferences },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) throw new ErrorResponse('Current password incorrect', 401);
  user.password = newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ErrorResponse('No user with that email', 404);

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    email: user.email,
    subject: 'Password Reset - EventSphere AI',
    template: 'resetPassword',
    data: { name: user.name, resetUrl },
  });

  res.json({ success: true, message: 'Password reset email sent' });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) throw new ErrorResponse('Invalid or expired reset token', 400);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// @desc    Logout
// @route   POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, logout };
