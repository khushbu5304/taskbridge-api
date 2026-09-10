const prisma = require('../lib/prisma');
const crypto = require('crypto');

const AuditRepository = {
  async create({ resourceType, resourceId, action, actorId, actorOrgId, actorIp = null, before = null, after = null, metadata = null, hashVersion = 2 }) {
    // canonicalize for hash using explicit hashVersion to allow schema changes without breaking prior entries
    const payload = JSON.stringify({ hashVersion, resourceType, resourceId, action, actorId, actorOrgId, actorIp, before, after, metadata });
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return prisma.auditEntry.create({ data: { resourceType, resourceId, action, actorId, actorOrgId, actorIp, before, after, metadata, hash, hashVersion } });
  },

  async findByProject(projectId, organizationId, { from, to, actions } = {}) {
    const where = { resourceId: projectId, actorOrgId: organizationId };
    if (actions && actions.length) where.action = { in: actions };
    if (from || to) where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(to);
    return prisma.auditEntry.findMany({ where, orderBy: { timestamp: 'desc' } });
  }
};

module.exports = AuditRepository;
