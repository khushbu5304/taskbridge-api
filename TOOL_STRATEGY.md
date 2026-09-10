# Tool Strategy

This document lists the AI-assisted tools and when to use them in the development workflow.

1. Copilot Chat — Architecture design
	- Use for high-level architecture, API contracts, and migration planning. Request concrete artifacts (diagrams, spec fragments, data models) and validate results with a human architect.

2. Copilot Chat — Code review
	- Use to surface potential bugs, security issues, and coding-style suggestions. Always verify automated findings locally and include test reproductions for high-risk changes.

3. Copilot Chat — Test generation
	- Use to generate unit and integration test templates (Jest, supertest). Preferred workflow: generate tests, run them, and iterate until passing.

4. Inline Suggestions — DTO and small helper generation
	- Use inline completions for short, low-risk code (DTOs, schema fragments, small helpers). Prefer explicit types and schema validation (zod) for production use.

5. Explain Feature — Understand contractor or legacy code
	- Use to summarize complex functions, explain intent, and generate short examples for maintainers. Cross-check explanations against the source before acting.

6. Refactor Feature — Service remediation
	- Use for scoped refactors (extracting services, renaming, simplifying flows). Make small, test-covered commits; prefer iterative reviews over large automated rewrites.

Security & Disclosure

- Do not include secrets or PII in prompts. Redact sensitive examples before sending to AI tools.
- Document AI-assisted changes in the PR description (see PR_DESCRIPTION.md) and follow the repository's disclosure policy.

Operational guidance

- Treat generated output as a draft: verify with tests and code review.
- Small changes: commit on the feature branch with clear messages. Large changes: open a design PR first.