# LoanOS Agent Instructions

`AGENTS.md` is the authoritative instruction file for AI-assisted work in this repository. These rules are tool-neutral and apply whether the work is performed through ChatGPT, Codex, Claude, or another coding agent.

## Read first

1. `CONTEXT.md` — current project state and active constraints.
2. `docs/AI_AGENT_ONBOARDING.md` — safe workflow and known repo hazards.
3. `docs/REPO_STRUCTURE.md` — ownership map for code, integrations, docs, and historical work.
4. `TODO.md` — active work and items requiring Adam's decision.

When a local `GOALS.md` is available, use it as additional prioritization context. Do not assume a specific absolute path or fail solely because that local file is unavailable.

## Project

- Framework: Next.js 14 App Router.
- Database: Supabase; generated types live in `src/lib/database.types.ts`.
- Hosting: Vercel project `loanos` under team `astyer8345s-projects`.
- Default branch: `main`. Never commit to `master`.

## Change rules

- Inspect `git status -sb` before editing and do not absorb unrelated worktree changes.
- Prefer existing patterns over new dependencies or abstractions.
- Keep tenant isolation and organization scoping intact.
- TypeScript strict mode is enabled. Avoid `any` unless narrowly justified with an explanatory suppression.
- Supabase `Json` values must pass through `unknown` before conversion to domain types.
- Inserts assembled with `Object.fromEntries()` must be cast to the appropriate generated Insert type.
- Treat routes, workflows, and integrations as production surfaces. Identify callers, authentication, environment variables, and scheduled dependencies before changing them.

## Verification and deployment

Before pushing code changes:

1. Run the smallest relevant tests or checks.
2. Run `npm run build` from the repository root.
3. Fix build failures before pushing.

After pushing:

1. Verify the Vercel deployment using available tooling or the GitHub/Vercel status check.
2. If deployment fails, inspect the logs and correct the failure.
3. Do not represent work as complete while the associated deployment is known to be failing.

Documentation-only changes still require a reasonable validation of links, file paths, and internal consistency.

## Documentation ownership

- `AGENTS.md`: durable agent operating rules.
- `CONTEXT.md`: concise current state; replace stale information rather than accumulating session transcripts.
- `README.md`: human-facing setup and project orientation.
- `ARCHITECTURE.md`: durable technical architecture.
- `DECISIONS.md`: material decisions and rationale.
- `CHANGELOG.md`: chronological record.
- `TODO.md`: active work, not historical logs.
- `tasks/`, `audits/`, and `_audit/`: treat as historical or working material unless explicitly identified as current.

When documents disagree, verify against the current code and update or label the stale document. Do not preserve contradictory startup documentation merely for history.