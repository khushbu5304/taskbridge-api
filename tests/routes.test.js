jest.mock('../src/middleware/auth', () => {
  return (req, res, next) => {
    req.user = {
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['user'],
      ip: '203.0.113.7'
    };
    next();
  };
});

jest.mock('../src/controllers/projects.controller', () => {
  const express = require('express');
  return express.Router();
});

jest.mock('../src/notifications/notification.service', () => ({
  createNotification: jest.fn(),
  listForUser: jest.fn(),
  markRead: jest.fn()
}));

jest.mock('../src/audit/audit.service', () => ({
  createAudit: jest.fn(),
  queryByProject: jest.fn()
}));

const request = require('supertest');
const app = require('../src/index');
const NotificationService = require('../src/notifications/notification.service');
const AuditService = require('../src/audit/audit.service');

describe('Notification and audit routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /v1/notifications creates a notification', async () => {
    NotificationService.createNotification.mockResolvedValue({ id: 'n-1', type: 'in-app' });

    const res = await request(app)
      .post('/v1/notifications')
      .send({ type: 'in-app', recipient: { userId: 'u-1' }, payload: { title: 'Hello' } })
      .expect(202);

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'in-app' }),
      expect.objectContaining({ organizationId: 'org-1', sub: 'user-1' })
    );
    expect(res.body).toEqual({ id: 'n-1', type: 'in-app' });
  });

  test('GET /v1/notifications/:userId lists notifications for the user', async () => {
    NotificationService.listForUser.mockResolvedValue([{ id: 'n-1', recipient: { userId: 'u-1' } }]);

    const res = await request(app)
      .get('/v1/notifications/u-1')
      .expect(200);

    expect(NotificationService.listForUser).toHaveBeenCalledWith('u-1', expect.objectContaining({ sub: 'user-1', organizationId: 'org-1' }));
    expect(res.body).toEqual({ data: [{ id: 'n-1', recipient: { userId: 'u-1' } }] });
  });

  test('PATCH /v1/notifications/:id/read marks a notification as read', async () => {
    NotificationService.markRead.mockResolvedValue({ id: 'n-1', isRead: true });

    const res = await request(app)
      .patch('/v1/notifications/n-1/read')
      .expect(200);

    expect(NotificationService.markRead).toHaveBeenCalledWith('n-1', expect.objectContaining({ sub: 'user-1' }));
    expect(res.body).toEqual({ id: 'n-1', isRead: true });
  });

  test('POST /v1/audit creates an audit entry', async () => {
    AuditService.createAudit.mockResolvedValue({ id: 'a-1', action: 'status_change' });

    const res = await request(app)
      .post('/v1/audit')
      .send({ resourceType: 'Project', resourceId: 'p-1', action: 'status_change' })
      .expect(201);

    expect(AuditService.createAudit).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: 'Project', resourceId: 'p-1', action: 'status_change' }),
      expect.objectContaining({ sub: 'user-1', organizationId: 'org-1' })
    );
    expect(res.body).toEqual({ id: 'a-1', action: 'status_change' });
  });

  test('GET /v1/audit/:projectId filters by event types and date range', async () => {
    AuditService.queryByProject.mockResolvedValue([{ id: 'a-1' }]);

    const res = await request(app)
      .get('/v1/audit/p-1?from=2026-09-01T00:00:00Z&to=2026-09-10T00:00:00Z&eventType=create,status_change')
      .expect(200);

    expect(AuditService.queryByProject).toHaveBeenCalledWith('p-1', 'org-1', {
      from: '2026-09-01T00:00:00Z',
      to: '2026-09-10T00:00:00Z',
      actions: ['create', 'status_change']
    });
    expect(res.body).toEqual({ data: [{ id: 'a-1' }] });
  });
});
