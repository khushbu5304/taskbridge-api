const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');

/**
 * Simple JWT auth middleware.
 * Expects Authorization: Bearer <token>
 * Attaches `req.user = { sub, organizationId, roles }` if valid.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret);
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = forwardedFor ? String(forwardedFor).split(',')[0].trim() : (req.socket && req.socket.remoteAddress) || req.ip || null;
    req.user = {
      sub: payload.sub,
      organizationId: payload.organizationId,
      roles: payload.roles || [],
      ip
    };
    next();
  } catch (err) {
    logger.warn('JWT verify failed: %s', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authMiddleware;
