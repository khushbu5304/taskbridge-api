const ProjectRepository = require('./project.repository');
const { ProjectCreateSchema, ProjectStatusUpdateSchema } = require('./project.schema');
const { ValidationError } = require('../lib/errors');
const { toDto, toPrismaCreate } = require('./project.model');
const logger = require('../lib/logger');

/**
 * Service layer for Project business logic.
 * Methods enforce validation and organization isolation.
 */
const ProjectService = {
	async createProject(payload, actor) {
		const parsed = ProjectCreateSchema.safeParse(payload);
		if (!parsed.success) throw new ValidationError('Invalid project payload', parsed.error.errors);
		const data = parsed.data;
		// sanitize/shape for ORM
		const prismaData = toPrismaCreate(data);
		// Ensure organization isolation: actor.organizationId must match
		if (actor && actor.organizationId && actor.organizationId !== prismaData.organizationId) {
			throw new ValidationError('organizationId mismatch');
		}
		logger.info('Creating project for org=%s team=%s actor=%s', prismaData.organizationId, prismaData.teamId, actor && (actor.sub || actor.id));
		const created = await ProjectRepository.create(prismaData);
		return toDto(created);
	},

	async updateStatus(projectId, organizationId, payload, actor) {
		const parsed = ProjectStatusUpdateSchema.safeParse(payload);
		if (!parsed.success) throw new ValidationError('Invalid status payload', parsed.error.errors);
		const { status } = parsed.data;
		logger.info('Update project status id=%s org=%s status=%s', projectId, organizationId, status);

		const before = await ProjectRepository.findById(projectId, organizationId);
		if (!before) {
			throw new ValidationError('Project not found');
		}

		// Ensure organization isolation
		if (before.organizationId && organizationId && before.organizationId !== organizationId) {
			throw new ValidationError('organizationId mismatch');
		}

		// No-op when status is unchanged
		if (before.status === status) {
			logger.info('Project status unchanged id=%s org=%s status=%s', projectId, organizationId, status);
			return { before: toDto(before), after: toDto(before) };
		}

		const updated = await ProjectRepository.updateStatus(projectId, organizationId, status);

		// Audit log the change including actor if available
		const actorId = actor && (actor.id || actor.sub) ? (actor.id || actor.sub) : 'system';
		logger.info('Project status changed id=%s org=%s from=%s to=%s actor=%s', projectId, organizationId, before.status, status, actorId);

		return { before: toDto(before), after: toDto(updated) };
	},

	async getByTeam(teamId, organizationId) {
		const rows = await ProjectRepository.findByTeam(teamId, organizationId);
		return rows.map(toDto);
	},

	async deleteProject(projectId, organizationId) {
		await ProjectRepository.delete(projectId, organizationId);
		return { success: true };
	}
};

module.exports = ProjectService;

