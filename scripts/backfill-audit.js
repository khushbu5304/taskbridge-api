#!/usr/bin/env node
/**
 * Backfill utility for AuditEntry actorIp and optional hash recompute.
 *
 * Usage:
 *   node scripts/backfill-audit.js --dry-run            (default)
 *   node scripts/backfill-audit.js --apply              (apply updates)
 *   node scripts/backfill-audit.js --apply --recompute  (apply and recompute v2 hash)
 *
 * NOTE: Recomputing historical hashes mutates the audit chain and is discouraged
 * unless you have an approved operational process. This script supports dry-run
 * mode to inspect changes before applying.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const argv = require('minimist')(process.argv.slice(2));
const DRY = !argv.apply;
const RECOMPUTE = !!argv.recompute;

async function recomputeHash(entry, hashVersion = 2) {
  const payload = JSON.stringify({ hashVersion, resourceType: entry.resourceType, resourceId: entry.resourceId, action: entry.action, actorId: entry.actorId, actorOrgId: entry.actorOrgId, actorIp: entry.actorIp || null, before: entry.before || null, after: entry.after || null, metadata: entry.metadata || null });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function run() {
  console.log(`Backfill audit: dry=${DRY} recompute=${RECOMPUTE}`);
  const entries = await prisma.auditEntry.findMany({ where: { actorIp: null } });
  console.log(`Found ${entries.length} audit entries with null actorIp`);

  for (const e of entries) {
    // try to extract possible IP from metadata.path ip fields
    let candidateIp = null;
    try {
      const m = e.metadata || {};
      if (m && typeof m === 'object') {
        candidateIp = m.actorIp || m.ip || m.requestIp || null;
      }
    } catch (err) {
      candidateIp = null;
    }

    if (!candidateIp) {
      console.log(`- ${e.id}: no candidate IP`);
      continue;
    }

    const update = { actorIp: candidateIp };
    if (RECOMPUTE) {
      update.hashVersion = 2;
      update.hash = await recomputeHash({ ...e, actorIp: candidateIp }, 2);
    }

    console.log(`- ${e.id}: candidateIp=${candidateIp} updates=${JSON.stringify(update)}`);
    if (!DRY) {
      await prisma.auditEntry.update({ where: { id: e.id }, data: update });
    }
  }

  console.log('Done');
  await prisma.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
