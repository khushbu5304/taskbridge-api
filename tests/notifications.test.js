jest.mock('../src/lib/prisma', () => ({
  notification: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() }
}));

jest.mock('../src/notifications/notification.repository');
jest.mock('../src/audit/audit.service');

const NotificationRepository = jest.requireMock('../src/notifications/notification.repository');
const AuditService = jest.requireMock('../src/audit/audit.service');
const NotificationService = require('../src/notifications/notification.service');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dispatch to all team members enqueues notifications and audits', async () => {
    const actor = { organizationId: 'org-1', sub: 'system' };
    const recipients = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];

    NotificationRepository.create.mockImplementation(async (data) => ({ id: `n-${Math.random()}`, ...data }));
    AuditService.createAudit.mockImplementation(async (payload) => ({ id: `a-${Math.random()}`, ...payload }));

    // simulate dispatch to each team member by calling createNotification per recipient
    await Promise.all(recipients.map(r => NotificationService.createNotification({ type: 'in-app', recipient: r, payload: { title: 'Hi' }, projectId: 'proj-1' }, actor)));

    expect(NotificationRepository.create).toHaveBeenCalledTimes(recipients.length);
    expect(AuditService.createAudit).toHaveBeenCalledTimes(recipients.length);

    // each created notification should include actor's organizationId
    for (const call of NotificationRepository.create.mock.calls) {
      const arg = call[0];
      expect(arg.organizationId).toBe(actor.organizationId);
      expect(arg.status).toBe('pending');
    }
  });
});
