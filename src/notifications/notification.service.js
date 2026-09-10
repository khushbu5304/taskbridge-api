const NotificationRepository = require('./notification.repository');
const AuditService = require('../audit/audit.service');
const { ValidationError } = require('../lib/errors');
const logger = require('../lib/logger');

const NotificationService = {
  async createNotification(payload, actor) {
    const { type, recipient, payload: pl, projectId, deliverAfter, idempotencyKey } = payload;
    if (!type || !recipient || !pl) throw new ValidationError('type, recipient and payload are required');
    const data = {
      projectId: projectId || null,
      organizationId: actor.organizationId,
      type,
      recipient,
      payload: pl,
      status: 'pending',
      attempts: 0,
      deliverAfter: deliverAfter ? new Date(deliverAfter) : null
    };
    const created = await NotificationRepository.create(data);
    // audit enqueue
    await AuditService.createAudit({ resourceType: 'Notification', resourceId: created.id, action: 'notify_enqueued', before: null, after: created }, actor);
    logger.info('Enqueued notification %s for org=%s', created.id, actor.organizationId);
    return created;
  },

  async listForUser(userId, actor) {
    // fetch org notifications and filter by recipient.userId
    const all = await NotificationRepository.findByOrganization(actor.organizationId);
    return all.filter(n => {
      try {
        const r = n.recipient;
        return r && r.userId === userId;
      } catch (e) {
        return false;
      }
    });
  },

  async markRead(id, actor) {
    const updated = await NotificationRepository.markRead(id, actor.organizationId);
    await AuditService.createAudit({ resourceType: 'Notification', resourceId: id, action: 'notify_read', before: null, after: updated }, actor);
    return updated;
  }
};

module.exports = NotificationService;
