const logger = require('../config/logger');
const ErrorResponse = require('../utils/ErrorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`${err.name}: ${err.message} | URL: ${req.originalUrl} | Method: ${req.method}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ErrorResponse(`Resource not found with id: ${err.value}`, 404);
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ErrorResponse(`${field} already exists`, 400);
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new ErrorResponse('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new ErrorResponse('Token expired', 401);
  // Razorpay errors
  if (err.error?.description) error = new ErrorResponse(err.error.description, 400);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
