Migration Runbook: Add `actorIp` to AuditEntry and backfill

Purpose
- Execute the schema migration, safely backfill historical `actorIp` values from `metadata` if desired, and (optionally) recompute hashes with `hashVersion=2`.

Prerequisites
- Get approval from Privacy/Data Protection and Security teams for storing IP addresses.
- Ensure you have a full backup of the production database (snapshot/export).
- Ensure CI artifacts and `prisma generate` are run on the deployment target.

High-level steps
1. Create a release branch and open a PR containing: schema change, repository/service changes, backfill script, tests, and docs. Request privacy/security review.
2. Apply database migration in staging:
   - `npx prisma migrate dev --name add_audit_actor_ip` (or generate SQL and apply in staging DB)
3. Run app in staging and run integration tests.
4. Run backfill dry-run in staging to inspect candidate updates:
   - `npm run backfill-audit -- --dry-run`
5. If dry-run outputs acceptable candidate IPs, run backfill in staging (no hash recompute):
   - `npm run backfill-audit -- --apply`
6. Validate audit entries, verify `actorIp` populated and `hashVersion` set for new rows.
7. If organization approves recomputing historical hashes (highly sensitive): run backfill with `--recompute` and ensure you have documented the operation and signatures.

Production rollout
- Schedule a maintenance window if you plan to recompute hashes.
- Apply migration to production DB (use generated SQL or DB migration tooling used by your org).
- Deploy app changes that write `actorIp` and set `hashVersion`.
- Run backfill in production in dry-run mode first, review results with stakeholders.
- If approved, apply backfill with `--apply` (and `--recompute` only if explicitly authorized).

Rollback plan
- If an error occurs during the migration or backfill:
  - Restore DB from backup snapshot.
  - Revert application changes via rollback release.

Verification checklist
- New audit entries have non-null `hashVersion=2` and include `actorIp` when applicable.
- Historical rows remain unchanged unless you performed authorized recompute; verify signature of migration and preserve an audit record for the backfill run itself.
- Access to `actorIp` is limited by RBAC; confirm logs and access controls.

Audit of the migration
- Create an audit entry capturing the migration run details (operator, timestamp, summary, and whether hashes were recomputed). Store this entry separately or tag it as `migration:backfill`.

Notes
- Prefer HMAC or encryption for IPs if legal requires minimization. Consider storing salted HMAC(ip) instead of raw IP when full IP is not necessary for investigations.
