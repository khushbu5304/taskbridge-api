/**
 * Domain model definitions and helpers for Project.
 * This file contains structural documentation and simple mappers rather than data access.
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {string} status
 * @property {string} teamId
 * @property {string} organizationId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function toIsoString(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDto(prismaProject) {
  if (!prismaProject) return null;
  return {
    id: prismaProject.id,
    name: prismaProject.name,
    description: prismaProject.description,
    status: prismaProject.status,
    teamId: prismaProject.teamId,
    organizationId: prismaProject.organizationId,
    createdAt: toIsoString(prismaProject.createdAt),
    updatedAt: toIsoString(prismaProject.updatedAt)
  };
}

const AllowedStatuses = ['new', 'in_progress', 'completed', 'archived', 'cancelled'];

/**
 * Prepare a sanitized object suitable for Prisma `create`/`update` calls.
 * Strips unknown fields and applies defaults where appropriate.
 */
function toPrismaCreate(input) {
  return {
    name: input.name,
    description: input.description ?? null,
    status: input.status && AllowedStatuses.includes(input.status) ? input.status : 'new',
    teamId: input.teamId,
    organizationId: input.organizationId
  };
}

module.exports = { toDto, toPrismaCreate, AllowedStatuses };
