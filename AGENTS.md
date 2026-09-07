# housing project instructions

## Working tree and scope

- Treat the current working tree as the source of truth. At the start of every task, run `git status --short` and inspect the relevant `git diff` before editing.
- Preserve all existing uncommitted changes. Never revert, reset, checkout, overwrite, or reformat unrelated files without explicit user approval.
- Start with the files directly related to the request; do not scan the entire repository unless the task requires it.
- Reuse existing components, hooks, services, repositories, API clients, and established patterns before adding new ones. Do not perform unrelated refactors.

## Model routing and token-saving rules

- Follow [docs/ai-token-harness.md](docs/ai-token-harness.md) for model/effort routing and token-saving rules. Do not duplicate its content here.

## Project references

- Use [docs/4-project-principle.md](docs/4-project-principle.md) for architecture, layer boundaries, naming, security, and test standards.
- Use [docs/1-domain-definition.md](docs/1-domain-definition.md), [docs/2-prd.md](docs/2-prd.md), and [docs/3-user-scenario.md](docs/3-user-scenario.md) for domain rules and acceptance scenarios.
- Use [docs/7-execution-plan.md](docs/7-execution-plan.md) for planned work, [backend/swagger/swagger.json](backend/swagger/swagger.json) for the implemented API contract, and [docs/9-style-guide.md](docs/9-style-guide.md) for UI work.
- For remodeling work, read [docs/remodeling/implementation-plan.md](docs/remodeling/implementation-plan.md) before changing related code.

## Backend and data rules

- Preserve the documented layers: routes -> controllers -> services -> repositories -> db. Keep raw SQL and parameter binding in repositories.
- Region filtering is a backend responsibility: the final result returned by an API must enforce the requested and configured region constraints server-side. Never rely solely on frontend filtering.
- Keep credentials in environment variables. Never print, read for display, commit, or hardcode `.env` values, API keys, tokens, connection strings, or other secrets.

## Verification and processes

- Run the narrowest relevant tests first, then the applicable lint/type checks and browser verification for the changed scope. Follow the coverage and command guidance in `docs/4-project-principle.md`.
- Before browser verification against port 3000, check whether a stale development server owns the port (including its process and working directory). Restart only the server started for this task when a restart is necessary.
- Do not terminate unrelated processes. Do not kill a process merely because it occupies a familiar development port.
- For frontend behavior or visual changes, verify the affected flow in a browser and inspect browser console errors.
