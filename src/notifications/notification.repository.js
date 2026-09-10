const prisma = require('../lib/prisma');
const { NotFoundError } = require('../lib/errors');

const NotificationRepository = {
  async create(data) {
    return prisma.notification.create({ data });
  },

  async findByOrganization(organizationId) {
    return prisma.notification.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  },

  async findById(id, organizationId) {
    const n = await prisma.notification.findFirst({ where: { id, organizationId } });
    if (!n) throw new NotFoundError('Notification not found');
    return n;
  },

  async markRead(id, organizationId) {
    const now = new Date();
    const n = await prisma.notification.updateMany({ where: { id, organizationId }, data: { isRead: true, readAt: now } });
    if (n.count === 0) throw new NotFoundError('Notification not found');
    return prisma.notification.findUnique({ where: { id } });
  }
};

module.exports = NotificationRepository;
