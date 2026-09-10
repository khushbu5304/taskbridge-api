const ProjectRepository = require('./project.repository');
const { ProjectCreateSchema, ProjectStatusUpdateSchema } = require('./project.schema');
const { ValidationError } = require('../lib/errors');
const { toDto } = require('./project.model');
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
		// Ensure organization isolation: actor.organizationId must match
		if (actor && actor.organizationId && actor.organizationId !== data.organizationId) {
			throw new ValidationError('organizationId mismatch');
		}
		logger.info('Creating project for org=%s team=%s', data.organizationId, data.teamId);
		const created = await ProjectRepository.create(data);
		return toDto(created);
	},

	async updateStatus(projectId, organizationId, payload) {
		const parsed = ProjectStatusUpdateSchema.safeParse(payload);
		if (!parsed.success) throw new ValidationError('Invalid status payload', parsed.error.errors);
		const { status } = parsed.data;
		logger.info('Update project status id=%s org=%s status=%s', projectId, organizationId, status);
		const before = await ProjectRepository.findById(projectId, organizationId);
		const updated = await ProjectRepository.updateStatus(projectId, organizationId, status);
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

