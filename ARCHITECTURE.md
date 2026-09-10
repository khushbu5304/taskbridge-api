Clients interact with the Project Service through REST APIs.

The Project Controller validates requests and forwards them to the Service layer.

The Service layer applies business rules and interacts with the Repository layer.

Project state changes generate events consumed by the Notification and Audit Service.

The Audit Service stores immutable audit entries.

The Notification Service creates notifications for project stakeholders.

All data access is filtered by organization ID to enforce tenant isolation.

Prisma ORM manages persistence and database access.

This architecture supports maintainability, compliance, scalability and security.
