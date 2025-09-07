const { constants } = require("../utils/constants");

// Custom error handler middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = constants.VALIDATION_ERROR;
    message = "Validation Error: " + err.message;
  } else if (err.name === "CastError") {
    statusCode = constants.NOT_FOUND;
    message = "Resource not found";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = constants.UNAUTHORIZED;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = constants.UNAUTHORIZED;
    message = "Token expired";
  } else if (err.code === "23505") { // PostgreSQL unique violation
    statusCode = constants.CONFLICT;
    message = "Resource already exists";
  } else if (err.code === "23503") { // PostgreSQL foreign key violation
    statusCode = constants.VALIDATION_ERROR;
    message = "Referenced resource does not exist";
  }

  // Log error in production
  if (process.env.NODE_ENV === "production") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { 
      stack: err.stack,
      error: err 
    }),
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

module.exports = errorHandler;
