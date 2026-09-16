let prisma = null;

function clone(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map((item) => clone(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
}

function makeFallbackStore() {
  const state = {
    projects: [],
    auditEntries: [],
    notifications: []
  };

  const toComparable = (value) => (value && typeof value === 'object' ? JSON.stringify(value) : String(value));

  const project = {
    async create({ data }) {
      const row = { ...data, id: data.id || `proj-${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), updatedAt: new Date() };
      state.projects.push(row);
      return clone(row);
    },
    async findFirst({ where }) {
      const row = state.projects.find((entry) => Object.entries(where || {}).every(([key, value]) => entry[key] === value));
      return row ? clone(row) : null;
    },
    async findMany({ where = {}, orderBy }) {
      const rows = state.projects.filter((entry) => Object.entries(where).every(([key, value]) => {
        if (key === 'teamId' || key === 'organizationId' || key === 'id') return entry[key] === value;
        if (key === 'status') return entry[key] === value;
        return true;
      }));

      if (orderBy && orderBy.createdAt === 'desc') {
        rows.sort((a, b) => b.createdAt - a.createdAt);
      }
      return rows.map((row) => clone(row));
    },
    async updateMany({ where, data }) {
      let matched = 0;
      state.projects = state.projects.map((entry) => {
        if (Object.entries(where || {}).every(([key, value]) => entry[key] === value)) {
          matched += 1;
          return { ...entry, ...data, updatedAt: new Date() };
        }
        return entry;
      });
      return { count: matched };
    },
    async deleteMany({ where }) {
      const before = state.projects.length;
      state.projects = state.projects.filter((entry) => !Object.entries(where || {}).every(([key, value]) => entry[key] === value));
      return { count: before - state.projects.length };
    }
  };

  const auditEntry = {
    async create({ data }) {
      const now = new Date();
      const row = { ...data, id: data.id || `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`, timestamp: data.timestamp || now, hash: data.hash || 'fallback-hash' };
      state.auditEntries.push(row);
      return clone(row);
    },
    async findMany({ where = {}, orderBy }) {
      const rows = state.auditEntries.filter((entry) => {
        if (where.resourceId && entry.resourceId !== where.resourceId) return false;
        if (where.actorOrgId && entry.actorOrgId !== where.actorOrgId) return false;
        if (where.action && where.action.in && !where.action.in.includes(entry.action)) return false;
        if (where.timestamp) {
          if (where.timestamp.gte && new Date(entry.timestamp) < new Date(where.timestamp.gte)) return false;
          if (where.timestamp.lte && new Date(entry.timestamp) > new Date(where.timestamp.lte)) return false;
        }
        return true;
      });

      if (orderBy && orderBy.timestamp === 'desc') {
        rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return rows.map((row) => clone(row));
    }
  };

  const notification = {
    async create({ data }) {
      const row = { ...data, id: data.id || `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), updatedAt: new Date() };
      state.notifications.push(row);
      return clone(row);
    },
    async findMany({ where = {}, orderBy }) {
      const rows = state.notifications.filter((entry) => Object.entries(where).every(([key, value]) => entry[key] === value));
      if (orderBy && orderBy.createdAt === 'desc') {
        rows.sort((a, b) => b.createdAt - a.createdAt);
      }
      return rows.map((row) => clone(row));
    },
    async findFirst({ where }) {
      const row = state.notifications.find((entry) => Object.entries(where || {}).every(([key, value]) => entry[key] === value));
      return row ? clone(row) : null;
    },
    async findUnique({ where }) {
      const row = state.notifications.find((entry) => entry.id === where.id);
      return row ? clone(row) : null;
    },
    async updateMany({ where, data }) {
      let matched = 0;
      state.notifications = state.notifications.map((entry) => {
        if (Object.entries(where || {}).every(([key, value]) => entry[key] === value)) {
          matched += 1;
          return { ...entry, ...data, updatedAt: new Date() };
        }
        return entry;
      });
      return { count: matched };
    }
  };

  return { project, auditEntry, notification };
}

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  prisma = makeFallbackStore();
}

module.exports = prisma;
