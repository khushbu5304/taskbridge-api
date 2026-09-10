## Review Notes

Purpose: capture review checklist and decisions for PRs on this repo.

## Checklist

- [ ] Description explains the change and motivation
- [ ] Security implications considered (auth, tenancy, secrets)
- [ ] Tests added or updated
- [ ] Relevant docs updated (`README.md`, `SPEC.md`)
- [ ] Migrations or schema changes reviewed

## Reviewer Guidance

- Confirm `organizationId` is enforced for all tenant-scoped queries.
- Verify audit logging in `src/audit` for sensitive operations.

Add specific notes here when you review a PR.
