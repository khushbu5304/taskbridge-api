const AuditRepository = require('./audit.repository');
const { ValidationError } = require('../lib/errors');
const logger = require('../lib/logger');

const AuditService = {
  async createAudit(payload, actor) {
    const { resourceType, resourceId, action, before = null, after = null, metadata = null } = payload;
    if (!resourceType || !resourceId || !action) throw new ValidationError('resourceType, resourceId and action are required');
    const actorId = actor && actor.sub ? actor.sub : payload.actorId || null;
    const actorOrgId = actor && actor.organizationId ? actor.organizationId : payload.actorOrgId || null;
    // prefer actor.ip (populated by middleware) but allow payload override
    const actorIp = (actor && actor.ip) ? actor.ip : payload.actorIp || null;
    logger.info('Create audit entry %s on %s by org=%s', action, resourceId, actorOrgId);
    // bump hashVersion when canonicalization changes (2 = includes actorIp)
    return AuditRepository.create({ resourceType, resourceId, action, actorId, actorOrgId, actorIp, before, after, metadata, hashVersion: 2 });
  },

  async queryByProject(projectId, organizationId, opts) {
    return AuditRepository.findByProject(projectId, organizationId, opts);
  }
};

module.exports = AuditService;
