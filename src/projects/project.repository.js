const prisma = require('../lib/prisma');
const { NotFoundError } = require('../lib/errors');

/**
 * Repository encapsulating Prisma data access for `Project`.
 * All methods require `organizationId` for multi-tenant isolation.
 */
const ProjectRepository = {
  async create(data) {
    return prisma.project.create({ data });
  },

  async findById(id, organizationId) {
    const p = await prisma.project.findFirst({ where: { id, organizationId } });
    if (!p) throw new NotFoundError('Project not found');
    return p;
  },

  async findByTeam(teamId, organizationId) {
    return prisma.project.findMany({ where: { teamId, organizationId }, orderBy: { createdAt: 'desc' } });
  },

  async updateStatus(id, organizationId, status) {
    // ensure project belongs to organization
    const p = await prisma.project.updateMany({ where: { id, organizationId }, data: { status } });
    if (p.count === 0) throw new NotFoundError('Project not found');
    return this.findById(id, organizationId);
  },

  async delete(id, organizationId) {
    const res = await prisma.project.deleteMany({ where: { id, organizationId } });
    if (res.count === 0) throw new NotFoundError('Project not found');
    return true;
  }
};

module.exports = ProjectRepository;
