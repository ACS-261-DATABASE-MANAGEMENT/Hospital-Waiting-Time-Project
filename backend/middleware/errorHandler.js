// backend/middleware/errorHandler.js
// Global Express error handler

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
