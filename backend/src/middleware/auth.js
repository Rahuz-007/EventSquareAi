const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');

// Protect routes - JWT authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new ErrorResponse('Not authorized to access this route', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) throw new ErrorResponse('User not found', 401);
    if (!req.user.isActive) throw new ErrorResponse('Account deactivated', 403);
    next();
  } catch (err) {
    throw new ErrorResponse('Not authorized, token invalid', 401);
  }
});

// Role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ErrorResponse(`Role '${req.user.role}' is not authorized for this route`, 403));
  }
  next();
};

// Optional auth (attach user if token present, don't fail if not)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {}
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
