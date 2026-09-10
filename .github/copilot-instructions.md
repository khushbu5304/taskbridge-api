# GitHub Copilot Instructions — Node.js multi-tenant B2B SaaS

Purpose: Provide clear, machine-actionable guidance for Copilot suggestions used in a multi-tenant B2B SaaS built with Node.js, Express, Prisma and a layered architecture.

Technology stack
- **Primary:** `Node.js`, `Express`, `Prisma` (PostgreSQL recommended).
- **Language:** `TypeScript` (preferred). If `JavaScript` is used, follow equivalent typing and validation patterns.
- **Validation:** `zod` or `joi` for DTOs and schema validation.
- **Logging:** `pino` (structured JSON) or equivalent.
- **Testing:** `Jest`, `ts-jest`, `supertest` for API/integration tests.
- **Docs:** `OpenAPI (Swagger)` for API surface; `mkdocs` or `docs` folder for design docs.

Coding standards
- **Formatting:** `Prettier` config enforced on commit/CI.
- **Linting:** `ESLint` with TypeScript rules; treat warnings as actionable, enforce in CI.
- **Types:** Prefer explicit types for public interfaces and DTOs; avoid `any`.
- **Naming:** `camelCase` for variables, `PascalCase` for classes/types, `kebab-case` for files if not using index files.
- **Files:** One top-level exported concept per file (controller, service, repository).

Repository pattern & layered architecture
- **Layers:** `controllers` (HTTP adapters) -> `services` (business logic) -> `repositories` (data access/Prisma) -> `models/dtos`.
- **Repository responsibilities:** perform Prisma queries, map database models to domain objects, and accept `transaction`/`prismaClient` injected for testability.
- **Service responsibilities:** orchestrate domain logic, enforce business rules, call repositories, and emit domain events where appropriate.
- **Controller responsibilities:** parse/validate requests, call services, format responses, and map errors to HTTP codes.
- **Folder example:**
  - `src/controllers/`  
  - `src/services/`  
  - `src/repositories/`  
  - `src/models/` (DTOs, types)  
  - `src/middleware/`  
  - `src/lib/` (logging, telemetry, prisma client wrapper)

Input validation requirements
- **DTO-first:** Define request/response DTOs with `zod` and use them at controller boundaries.
- **Sanitize & coerce:** Coerce types where safe (e.g., numeric strings -> numbers) and reject malformed payloads with `400` and structured error body.
- **Size limits:** Enforce max payload sizes and per-field length limits.
- **Strictness:** Reject unknown fields unless explicitly allowed.

Structured logging
- **Format:** JSON logs with fields: `timestamp`, `level`, `service`, `message`, `requestId`, `traceId`, `userId`, `organizationId`, `meta`.
- **Correlation:** Generate and propagate `requestId` and `traceId` via middleware; include in responses as `X-Request-Id` header.
- **Log levels:** `trace|debug|info|warn|error|fatal` and use semantic messages.
- **Sensitive data:** Never log secrets, credentials, or full PII. Use redaction helpers in the logger.

API design rules
- **Versioning:** Use URI versioning: `/v1/...` and plan migration path for `/v2/...`.
- **Status codes:** Follow RFC semantics: `200`/`201`/`204`, `400` for validation, `401` auth, `403` authorization, `404` not found, `409` conflict, `422` business validation.
- **Pagination & filtering:** Use cursor-based pagination where possible; support `limit`/`cursor` and sorting parameters.
- **Consistency:** All list endpoints return `{ data: [], meta: { paging } }`.
- **Errors:** Return structured error payloads: `{ code, message, details? }` and include `requestId`.
- **Idempotency:** Support idempotency for mutating endpoints using `Idempotency-Key` header for critical operations.

Organization-based authorization (multi-tenancy)
- **Tenant identifier:** All data models must include `organizationId` (or `tenantId`) as a required column.
- **Auth token:** JWTs must contain `sub` (userId) and `organizationId` claims; services must validate `organizationId` against the requested resource.
- **Enforcement:** Implement middleware that attaches `organizationId` to request context and a Prisma middleware or repository-level guard that adds `where: { organizationId }` to queries.
- **Row-level security:** For PostgreSQL, prefer database RLS policies in addition to app-layer checks for defense-in-depth.
- **Cross-tenant ops:** Explicit admin endpoints that operate across organizations must require elevated claims and separate audit logging.

Security controls
- **Transport & storage:** TLS everywhere; encrypt sensitive fields at rest when required.
- **Secrets:** Use environment variables + secret manager (Azure Key Vault/AWS Secrets Manager); do not check secrets into VCS.
- **Headers:** Use `helmet` for secure HTTP headers; configure strict CORS policy.
- **Input protection:** Use parameterized queries (Prisma is safe by default) and validate/sanitize inputs.
- **Auth & passwords:** Use `OAuth2`/OIDC where possible. Hash passwords with `argon2` or `bcrypt` and enforce strong policies.
- **Rate-limiting & brute force:** Apply global and route-level rate limits; protect auth endpoints.
- **Dependency hygiene:** Monitor vulnerabilities and pin major deps; run `npm audit` in CI.

Audit logging
- **What to log:** Immutable audit records for create/update/delete and critical read operations: `actorId`, `actorOrgId`, `action`, `resourceType`, `resourceId`, `timestamp`, `before`, `after`, `requestId`, `ip`.
- **Storage:** Write to append-only store or separate `audit_logs` table; consider streaming to a SIEM/log store (e.g., Splunk, ELK, or managed logging).
- **Retention & export:** Define retention policy and export controls; support export for compliance requests.

Testing expectations
- **Unit tests:** Services and repositories should have unit tests mocking external dependencies.
- **Integration tests:** API tests using `supertest` against a disposable test database (Prisma migrations + seed). Prefer an in-memory or ephemeral Postgres for CI.
- **E2E tests:** Critical user flows covered; run nightly against a staging environment.
- **Test data:** Use deterministic fixtures and factories; isolate tests and run migrations in setup/teardown.
- **Coverage:** Aim for at least `80%` coverage on services and repositories; CI should fail on major regressions.

Documentation standards
- **API:** Maintain an up-to-date OpenAPI spec and serve Swagger UI at `/docs` in non-production environments.
- **README:** Repo-level `README.md` must include setup, env vars, dev commands, testing, and deploy steps.
- **Architecture docs:** Keep high-level architecture, tenancy model, and data flows in `ARCHITECTURE.md`.
- **Code docs:** Public modules, interfaces, and complex business rules must have JSDoc/TSDoc comments.
- **CHANGELOG:** Use `Keep a Changelog` style and update on release.

Copilot guidance (how to assist)
- When suggesting code, prefer explicit, type-safe implementations using `TypeScript` DTOs and `zod` validation at the controller boundary.
- Suggest repository methods that accept `context` (with `organizationId` and `prisma` client) and return typed domain objects.
- Recommend tests for any non-trivial code path and include minimal examples for `jest` + `supertest`.
- For security-sensitive areas, include comments about threat considerations (e.g., verify `organizationId` on reads/writes).

Maintenance
- Add CI checks for lint, typecheck, tests, and OpenAPI validity.  
- Run dependency scans and secret scanning on PRs.
