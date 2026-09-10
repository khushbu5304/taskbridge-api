jest.mock('../src/lib/prisma', () => ({
  project: { findFirst: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn() },
  notification: { updateMany: jest.fn() }
}));

const prisma = require('../src/lib/prisma');
const ProjectRepository = require('../src/projects/project.repository');
const NotificationRepository = require('../src/notifications/notification.repository');
const { NotFoundError } = require('../src/lib/errors');

describe('Tenant isolation and unauthorized access', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ProjectRepository.findById throws NotFoundError on org mismatch', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(ProjectRepository.findById('proj-1', 'org-x')).rejects.toThrow(NotFoundError);
  });

  test('NotificationRepository.markRead throws NotFoundError when org mismatch', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });
    await expect(NotificationRepository.markRead('notif-1', 'org-x')).rejects.toThrow(NotFoundError);
  });
});
