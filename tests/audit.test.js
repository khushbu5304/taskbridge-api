jest.mock('../src/lib/prisma', () => ({
  auditEntry: { create: jest.fn(), findMany: jest.fn() }
}));

const prisma = require('../src/lib/prisma');
const AuditRepository = require('../src/audit/audit.repository');

describe('AuditRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates audit with deterministic hash for same content', async () => {
    prisma.auditEntry.create.mockResolvedValue({ id: 'x' });
    const args = { resourceType: 'Project', resourceId: 'p1', action: 'status_change', actorId: 'u1', actorOrgId: 'org1', before: { status: 'new' }, after: { status: 'done' }, metadata: { requestId: 'r1' } };
    await AuditRepository.create(args);
    await AuditRepository.create(args);
    expect(prisma.auditEntry.create).toHaveBeenCalledTimes(2);
    const hash1 = prisma.auditEntry.create.mock.calls[0][0].data.hash;
    const hash2 = prisma.auditEntry.create.mock.calls[1][0].data.hash;
    expect(hash1).toBeTruthy();
    expect(hash1).toEqual(hash2);
    // new canonicalization includes hashVersion
    const hv1 = prisma.auditEntry.create.mock.calls[0][0].data.hashVersion;
    const hv2 = prisma.auditEntry.create.mock.calls[1][0].data.hashVersion;
    expect(hv1).toBe(2);
    expect(hv1).toEqual(hv2);
  });

  test('stores actorIp and hashVersion when provided', async () => {
    prisma.auditEntry.create.mockResolvedValue({ id: 'y' });
    const args = { resourceType: 'Project', resourceId: 'p2', action: 'status_change', actorId: 'u2', actorOrgId: 'org2', actorIp: '10.0.0.1' };
    await AuditRepository.create(args);
    expect(prisma.auditEntry.create).toHaveBeenCalledTimes(1);
    const data = prisma.auditEntry.create.mock.calls[0][0].data;
    expect(data.actorIp).toBe('10.0.0.1');
    expect(data.hashVersion).toBe(2);
  });

  test('query by date range and event types builds correct where clause', async () => {
    prisma.auditEntry.findMany.mockResolvedValue([]);
    const from = '2026-09-01T00:00:00Z';
    const to = '2026-09-10T23:59:59Z';
    const actions = ['create', 'status_change'];
    await AuditRepository.findByProject('proj-1', 'org-1', { from, to, actions });
    expect(prisma.auditEntry.findMany).toHaveBeenCalledTimes(1);
    const where = prisma.auditEntry.findMany.mock.calls[0][0].where;
    expect(where.resourceId).toBe('proj-1');
    expect(where.actorOrgId).toBe('org-1');
    expect(where.action).toEqual({ in: actions });
    expect(where.timestamp).toBeDefined();
    expect(where.timestamp.gte instanceof Date).toBe(true);
    expect(where.timestamp.lte instanceof Date).toBe(true);
  });

  test('does not expose update/delete methods (immutability)', () => {
    expect(typeof AuditRepository.update).toBe('undefined');
    expect(typeof AuditRepository.delete).toBe('undefined');
  });
});
