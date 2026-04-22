const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(". ");
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = `Invalid ID format: ${err.value}`;
    statusCode = 400;
  }

  // Multer file size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File too large. Maximum size is 5MB.";
    statusCode = 400;
  }

  // Joi validation error (if validate.middleware doesn't handle it, or for custom throw)
  if (err.isJoi) {
    message = err.details.map((d) => d.message).join(", ");
    statusCode = 400;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Error:", err);
  }

  res.status(statusCode).json({ success: false, message, ...(process.env.NODE_ENV === "development" && { stack: err.stack }) });
};

module.exports = errorHandler;