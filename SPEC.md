Overview

Goal: Design a Notification and Audit Service integrated with the existing Project Service to provide reliable notifications and an immutable audit trail for project events.
Primary consumers: Project Service, UI clients, Automation/Integrations.
Deployment assumptions: Node.js service, SQLite for local/dev (see src/lib/db.js), replaceable with PostgreSQL or cloud-managed DB in prod.

Data Models

Project
- id (string, uuid): Primary key.
- name (string, 1-255): Required.
- description (string|null): Optional, max 2000 chars.
- status (string): Enum: `new | in_progress | completed | archived | cancelled`.
- teamId (string): Required.
- createdAt (ISO8601): Required.
- updatedAt (ISO8601): Required.
- Example storage file: src/projects/project.model.js.

AuditEntry
- id (string, uuid): Primary key.
- resourceType (string): e.g., `Project`, `Notification`.
- resourceId (string): ID of affected resource.
- action (string): e.g., `create`, `update`, `delete`, `status_change`, `notify_enqueued`, `notify_sent`, `notify_failed`.
-- actorId (string|null): User or system actor initiating action.
-- actorOrgId (string|null): Organization context (matches JWT `organizationId` claim).
- timestamp (ISO8601): When action occurred (server time).
- before (JSON|null): Snapshot before change (nullable).
- after (JSON|null): Snapshot after change (nullable).
- metadata (JSON|null): Extra details (requestId, ip, correlation).
- hash (string): SHA-256 hex of canonicalized immutable fields for tamper evidence.
- prevHash (string|null): Optional previous entry hash to form a chained ledger.

Notification
- id (string, uuid): Primary key.
- projectId (string|null): Related project if applicable.
- type (string): Enum: `email | slack | webhook | in-app`.
- recipient (JSON): recipient address or channel metadata (e.g., { userId } or { email }).
- payload (JSON): templated message fields.
- status (string): Enum: `pending | sent | failed | cancelled`.
- attempts (integer): retry count.
- lastAttemptAt (ISO8601|null).
- createdAt (ISO8601), updatedAt (ISO8601).
- deliverAfter (ISO8601|null): scheduled delivery time.

API Contracts

- Base path: `/v1`
- Authentication: Bearer JWT with claims: `sub` (userId), `organizationId`, `roles` (array).

1) Project endpoints (Project Service)

- POST /v1/projects
  - Purpose: create a Project.
  - Request body: { name, description?, teamId }
  - Response 201: Project object
  - Side effects: write AuditEntry(action=`create`), publish event `project.created` to event bus.

- PATCH /v1/projects/:projectId/status
  - Purpose: update project status.
  - Request body: { status, requestId? }
  - Response 200: Updated Project
  - Side effects: write AuditEntry(action=`status_change`) with `before` and `after`, publish `project.status_changed`.

2) Notifications API (Notification Service)

- POST /v1/notifications
  - Purpose: enqueue a notification (services or UI call this).
  - Request body:
    {
      projectId?: string,
      type: "email" | "slack" | "webhook" | "in-app",
      recipient: object,
      payload: object,
      deliverAfter?: ISO8601,
      idempotencyKey?: string
    }
  - Response 202: { id, status: "pending", createdAt }
  - Behavior: deduplicate by `idempotencyKey` within a configurable window (e.g., 24 hours).
  - Side effect: write AuditEntry(action=`notify_enqueued`).

- GET /v1/notifications?projectId=&status=&limit=&cursor=
  - Response 200: { data: [Notification], meta: { paging } }

- POST /v1/notifications/:id/retry
  - Response 200: { success: true }
  - Side effect: write AuditEntry(action=`notify_retry`).

3) Audit API (Audit Service)

- GET /v1/audits?resourceType=&resourceId=&actorId=&from=&to=&limit=&cursor=
  - Response 200: { data: [AuditEntry], meta: { paging } }
  - Access rules: only privileged roles see full `before`/`after`; others receive redacted entries.

- POST /v1/audits/verify
  - Purpose: cryptographic verification across a time range.
  - Request: { fromTimestamp, toTimestamp }
  - Response: { ok: boolean, mismatches: [...] }

Request Examples

- Create Project
```
{
  "name": "Alpha",
  "description": "Initial onboarding",
  "teamId": "team-123"
}
```

- Enqueue Notification
```
{
  "projectId": "proj-001",
  "type": "in-app",
  "recipient": { "userId": "user-45" },
  "payload": { "title": "Project created", "body": "Project Alpha created." },
  "idempotencyKey": "evt:proj-001:create"
}
```

- Update Status
```
{
  "status": "in_progress",
  "requestId": "req-789"
}
```

Response Examples

- Project create 201
```
{
  "id": "proj-001",
  "name": "Alpha",
  "description": "Initial onboarding",
  "status": "new",
  "teamId": "team-123",
  "createdAt": "2026-09-10T12:00:00Z",
  "updatedAt": "2026-09-10T12:00:00Z"
}
```

- Notification enqueue 202
```
{
  "id": "notif-abc",
  "status": "pending",
  "createdAt": "2026-09-10T12:01:00Z"
}
```

- Audit query 200 (redacted for standard user)
```
{
  "data": [
    {
      "id": "audit-1",
      "resourceType": "Project",
      "resourceId": "proj-001",
      "action": "create",
      "actorId": "user-45",
      "timestamp": "2026-09-10T12:00:00Z",
      "metadata": { "requestId": "req-789" }
    }
  ],
  "meta": { "paging": { "limit": 50 } }
}
```

Error Responses

- 400 Bad Request: validation failed. Body: `{ code: 'validation_error', message: string, details?: object }`.
- 401 Unauthorized: missing/invalid JWT.
- 403 Forbidden: insufficient role/organization mismatch.
- 404 Not Found: resource not found.
- 409 Conflict: idempotency conflict or unique constraint violation.

Validation Requirements

- Validate all incoming JSON against schemas (recommend `zod` or `joi`).
- IDs: validate UUID format.
- `name`: non-empty string, max 255.
- `description`: optional string, max 2000.
- `status`: must be one of allowed enum values.
- `recipient` and `payload` shapes depend on `type` (e.g., `email` requires `recipient.email`).
- `deliverAfter`: ISO8601 and >= now if provided.
- `idempotencyKey`: max 255 chars; enforce uniqueness window.

Pagination

- Use cursor-based pagination. Each list endpoint returns `meta: { cursor }` for the next page. Avoid offset/limit for large datasets.

Authorization Requirements

- JWT required for all endpoints except public webhook deliveries.

- Role-based access rules:
  - `user`: create projects for their allowed `teamId`, read team projects, enqueue personal notifications.
  - `team-admin`: create/update/delete projects within their team, view redacted audits.
  - `org-admin` / `audit-role`: full audit access including `before`/`after`.
  - `system` (service account): allowed to enqueue notifications and write audits.
- Enforce `organizationId` claim matches resource ownership. Default deny.

Audit Immutability Requirements

- Append-only storage: audit rows must never be updated or deleted by application code.

-- Cryptographic chaining:
  - Compute `hash` over canonicalized JSON fields to ensure deterministic hashing. Example approach:
    1. Produce a canonical JSON string (RFC8785 or equivalent) of the object: `{ id, resourceType, resourceId, action, actorId, actorOrgId, timestamp, before, after, metadata }`.
    2. Compute `hash = SHA256(canonicalJson)` and store as hex.
  - Optionally store `prevHash` to chain entries (tamper-evident ledger). Verification should recompute hashes and compare.

- DB controls: restrict DB user privileges for audit table to insert-only where possible.

- Use WORM or cloud immutability (S3 Object Lock / Azure Blob immutable policies) in production if required by compliance.

- Provide `POST /v1/audits/verify` to validate hashes and detect tampering.

Integration Workflow

- Event flow for `Project` operations:
  1. Client -> POST /v1/projects (Project Service).
  2. Project Service validates and persists `Project`.
  3. Project Service writes AuditEntry(action=`create`) synchronously (or to outbox).
  4. Project Service publishes `project.created` to event bus (Redis/Rabbit/Kafka).
  5. Notification Service subscribes to `project.*` events and enqueues Notification(s) via `/v1/notifications` (idempotent).
  6. Delivery worker processes pending notifications, attempts delivery, updates Notification.status and creates AuditEntry(action=`notify_sent` or `notify_failed`).
  7. Retry policy: exponential backoff, configurable max attempts, final failure audit `notify_failed_final`.

- Transaction patterns:
  - Single DB: persist `Project` + AuditEntry in one transaction.
  - Cross-DB or separate services: use outbox pattern (write outbox row + project in transaction, then background dispatcher publishes and writes audit on publish success).

- Idempotency:
  - Use `idempotencyKey` for incoming API calls.
  - Event consumers must deduplicate by event id.

Observability & Ops

- Metrics: audit inserts/sec, notifications enqueued/sent/failed, event publish latency.

- Structured logs: include `requestId`, `actorId`, `organizationId`.

- Local dev: SQLite (src/lib/db.js). Prod: PostgreSQL with JSONB for `before`/`after` snapshots.

Operational Notes

- Backfill/migrations: provide scripts to compute `hash` and `prevHash` for historical audits.

- Testing: unit tests for model/service, integration tests for event flows, e2e for notification delivery.

Data Retention & Privacy

- Define retention policy for audit and notification payloads. Redact or truncate PII in `before`/`after` where not required for audits.
- Provide a data export and deletion workflow that complies with privacy requests; note that audit entries required for compliance should be preserved or redacted rather than deleted.

Rate Limiting

- Apply rate limits to public and authenticated endpoints. Suggested default: 100 req/min per user for mutation endpoints, configurable via gateway.
- Use `Idempotency-Key` and deduplication to mitigate retries causing duplicated side effects.

Next Steps

- Implement Notification and Audit routes and zod schemas.

- Add role-based middleware and JWT validation.

- Replace SQLite with Postgres in staging/prod and implement DB migration scripts.

References

- Project model implementation: src/projects/project.model.js
- Project service implementation: src/projects/project.service.js


## Copilot Contribution

GitHub Copilot Chat was used to generate the initial draft.

## Human Review

Multi-tenant authorization, audit immutability, data validation and security requirements were refined manually.