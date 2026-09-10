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

function toDto(prismaProject) {
  if (!prismaProject) return null;
  return {
    id: prismaProject.id,
    name: prismaProject.name,
    description: prismaProject.description,
    status: prismaProject.status,
    teamId: prismaProject.teamId,
    organizationId: prismaProject.organizationId,
    createdAt: prismaProject.createdAt.toISOString(),
    updatedAt: prismaProject.updatedAt.toISOString()
  };
}

module.exports = { toDto };
