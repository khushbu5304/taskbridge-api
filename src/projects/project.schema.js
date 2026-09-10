const { z } = require('zod');

const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  teamId: z.string().min(1),
  organizationId: z.string().min(1)
});

const ProjectStatusUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'completed', 'archived', 'cancelled']),
  requestId: z.string().optional()
});

module.exports = { ProjectCreateSchema, ProjectStatusUpdateSchema };
