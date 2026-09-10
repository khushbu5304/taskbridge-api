# Prompt 1

Prompt:
Generate a `Project` model and a `ProjectService` with methods to create a project, update project status, list/get projects by team, and delete a project. Persist data using the project's database (Prisma/Postgres).

Feature Used:
GitHub Copilot Chat

Technique:
Baseline Prompting

Purpose:
Simulate inherited AI-generated contractor code.

# Prompt 2

Prompt:
Act as a senior solution architect and produce a concise technical specification for the requested feature, including high-level architecture, data model changes, migration impact, and testing strategy.

Feature Used:
GitHub Copilot Chat

Technique:
Role-Based Prompting

Purpose:
Generate technical specification before implementation.

## Prompt 3

Prompt:
Produce a production-ready architecture for the `ProjectService` that includes API contracts, error handling, observability requirements, and performance considerations.

Feature Used:
GitHub Copilot Chat

Technique:
Specificity + Constraint Prompting

Purpose:
Generate production-ready Project Service architecture.

## Prompt 4

Prompt:
Design `Notification` and `Audit` services: data models, APIs, tenancy enforcement (`organizationId`), and audit immutability guarantees.

Feature Used:
GitHub Copilot Chat

Technique:
Role-Based + Specificity

Purpose:
Generate Notification and Audit Services.

## Prompt 5

Prompt:
Decompose the feature into required tests and produce a prioritized list of unit, integration, and end-to-end tests needed to assert correctness and backward compatibility.

Feature Used:
GitHub Copilot Chat

Technique:
Decomposition

Purpose:
Generate assessment-required test coverage.

## Prompt 6

Prompt:
Analyze a sprint's set of changes and produce an impact document describing affected services, migration steps, rollout plan, and manual verification steps for QA.

Feature Used:
GitHub Copilot Chat

Technique:
Analysis Prompting

Purpose:
Document sprint change impact before implementation.