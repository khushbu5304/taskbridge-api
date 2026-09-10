Create PR with migration + backfill changes

Suggested branch name:
- `feature/add-audit-actorip-backfill`

Suggested local steps
```bash
git checkout -b feature/add-audit-actorip-backfill
git add prisma/schema.prisma src/audit/*.js scripts/backfill-audit.js IMPACT_ANALYSIS.md MIGRATION_RUNBOOK.md tests/*.test.js
git commit -m "feat(audit): add actorIp and hashVersion (v2); backfill script and docs"
git push --set-upstream origin feature/add-audit-actorip-backfill
```

Open PR (GitHub CLI recommended):
```bash
gh pr create --title "feat(audit): add actorIp + backfill (hashVersion=2)" --body "See IMPACT_ANALYSIS.md and MIGRATION_RUNBOOK.md for details. Includes schema change, audit repo/service updates, backfill utility, tests, and docs." --reviewer @your-privacy-team --assignee @your-self
```

PR checklist (include in description)
- [ ] Privacy approval (Data Protection)
- [ ] Security review (sensitive data handling)
- [ ] DB migration SQL reviewed
- [ ] Backfill dry-run executed in staging
- [ ] Integration tests pass in staging
- [ ] Rollout and rollback plan included in `MIGRATION_RUNBOOK.md`

If you cannot use `gh`, open the PR via the GitHub web UI and paste the same title/body.
