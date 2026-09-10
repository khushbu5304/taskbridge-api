const logger = require('../lib/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error: %o', err);
  const status = err.status || 500;
  const payload = { code: err.code || 'internal_error', message: err.message };
  if (err.details) payload.details = err.details;
  res.status(status).json(payload);
}

module.exports = errorHandler;
