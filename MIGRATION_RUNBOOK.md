Migration Runbook: Add `actorIp` to AuditEntry and backfill

Purpose
- Execute the schema migration, safely backfill historical `actorIp` values from `metadata` when authorized, and (optionally) recompute hashes with `hashVersion=2` in a controlled, auditable way.

Scope & Impact
- Affects the `audit` table schema and any services that read/write audit entries.
- May be sensitive: storing IP addresses has privacy implications and requires approvals and audit controls.

Prerequisites
- Get formal approval from Privacy/Data Protection and Security teams for storing IP addresses and for any historical recompute of hashes.
- Capture a full, tested backup of production (snapshot/export) and validate restore on a staging instance.
- Verify CI artifacts build successfully and run `prisma generate` on the target environment.
- Ensure runbook owners and on-call contacts are notified and available during the rollout window.

Stakeholders / Contacts
- Privacy/Data Protection: @your-privacy-team
- Security: @your-security-team
- DB Admin / SRE: ops@example.com
- Release owner / approver: the PR author and release manager

Estimated duration
- Schema migration (apply SQL): minutes (depends on DB).
- Backfill (dry-run + apply): depends on historical data size — plan for hours for large datasets; use chunking and throttling.

High-level steps
1. Create a release branch and open a PR containing: schema change, repository/service changes, backfill script, tests, and docs. Request privacy/security review and include `PR_DESCRIPTION.md` details.
2. Apply database migration in staging:
   - Generate SQL with `npx prisma migrate dev --name add_audit_actor_ip` or `prisma migrate diff` and apply to staging DB.
3. Run the app in staging, execute full integration tests and smoke tests.
4. Run backfill dry-run in staging to inspect candidate updates:
   ```powershell
   npm run backfill-audit -- --dry-run --batch-size=1000
   ```
5. Review dry-run output and sample rows; validate `actorIp` candidates, performance, and side effects.
6. If dry-run is acceptable, run backfill in staging (no hash recompute):
   ```powershell
   npm run backfill-audit -- --apply --batch-size=1000
   ```
7. Validate audit entries in staging: sample counts, `actorIp` populated, `hashVersion` for new writes.
8. Only after explicit authorization from Privacy/Security, consider recomputing historical hashes. This is high risk and requires documented approval and a maintenance window.

Backfill guidance (production-safe)
- Always run a dry-run first and review the candidate mapping between `metadata` and `actorIp`.
- Use chunking and a configurable `BATCH_SIZE` to limit transaction sizes and resource usage.
- Throttle work to avoid overloading the DB (sleep between batches or use worker concurrency limits).
- Make backfill idempotent: record progress (last processed id or cursor) so runs can resume without duplication.
- Prefer running backfill from a job worker with monitored logs and metrics rather than a one-shot monolith.
- Avoid recomputing historical hashes unless explicitly approved; if recomputing, write a separate audit record for the recompute operation and maintain original values in an append-only changelog if required.

Example commands
```powershell
# Dry-run (staging or prod read-only)
npm run backfill-audit -- --dry-run --batch-size=1000

# Apply backfill (staging or prod write) — ensure permission and approvals
npm run backfill-audit -- --apply --batch-size=1000

# Recompute historical hashes (DANGEROUS — require approval and maintenance window)
npm run backfill-audit -- --apply --recompute --batch-size=500
```

Production rollout
- Schedule a maintenance window if recomputing hashes or if the backfill may impact DB performance.
- Apply migration to production DB using generated SQL or your org's migration tooling.
- Deploy app changes that write `actorIp` and set `hashVersion` for new audit writes.
- Run backfill in production in dry-run mode first, review results with stakeholders and a sample of rows.
- If approved, run apply backfill with `--apply` (and `--recompute` only if explicitly authorized).

Verification & monitoring
- Verify row counts before/after:
  - Count rows with null vs non-null `actorIp`:
    ```sql
    SELECT COUNT(*) FROM audit WHERE actorIp IS NULL;
    SELECT COUNT(*) FROM audit WHERE actorIp IS NOT NULL;
    ```
- Verify `hashVersion` distribution:
    ```sql
    SELECT hashVersion, COUNT(*) FROM audit GROUP BY hashVersion;
    ```
- Sample affected rows and confirm `actorIp` accuracy; compare `metadata` -> `actorIp` mapping for a sample set.
- Monitor DB CPU, IO, and replication lag during backfill; abort or throttle if thresholds exceeded.
- Emit metrics and logs for backfill progress (batches processed, errors, time per batch).

Rollback plan
- If an error occurs during migration or backfill:
  - If an immediate operational issue, stop the backfill job and abort further batches.
  - If data corruption or unacceptable outcome, restore DB from the validated backup snapshot.
  - Revert application changes via rollback release if required.

Post-migration audit
- Create an audit entry capturing the migration run details (operator, timestamp, summary, parameters used, and whether hashes were recomputed). Tag this entry as `migration:backfill` and store it as a first-class audit record.

Security & Privacy notes
- Prefer hashing (salted HMAC) or encryption for IPs if legal requires minimization. When storing raw IPs, restrict access by RBAC and record access for auditing.
- Log only the minimal metadata needed for the backfill run; redact PII from logs.

Operational checklist
- [ ] Privacy & Security approvals obtained
- [ ] Backup snapshot validated and restore tested
- [ ] Staging dry-run completed and validated
- [ ] Maintenance window scheduled (if needed)
- [ ] On-call and stakeholders available during rollout
- [ ] Metrics and alerts configured for backfill
- [ ] Post-migration verification performed and recorded

Notes
- Consider a two-phase approach: first add `actorIp` column and populate only for new rows, then run backfill as a separate, auditable job.
- If legal/privacy prevents storing raw IPs, compute and store `hmac_sha256(salt, ip)` and maintain a secure key rotation plan.
