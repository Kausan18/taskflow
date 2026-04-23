'use strict';

/**
 * Express 5 error-handling middleware.
 * All errors thrown or passed to next(err) land here.
 */
function errorHandler(err, req, res, _next) {
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Don't leak stack traces in production
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method} ${req.path}]`, err);
  } else if (status >= 500) {
    console.error(`[500] ${req.method} ${req.path}:`, err.message);
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };