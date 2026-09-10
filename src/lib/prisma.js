const { PrismaClient } = require('@prisma/client');

/**
 * Prisma client singleton.
 * In production set DATABASE_URL and run `prisma migrate` / `prisma generate`.
 */
const prisma = new PrismaClient();

module.exports = prisma;
