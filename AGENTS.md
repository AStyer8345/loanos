Read /Users/adamstyer/Documents/GOALS.md before starting any session. Interactive sessions must serve current goals — if your task conflicts, log it to TODO.md under NEEDS ADAM and stop. Automated/scheduled tasks continue unless GOALS.md explicitly pauses them.

# LoanOS — Codex Instructions

## Deploy Workflow (MANDATORY — follow every time)

Before **every** `git push`:
1. Run `npm run build` in `/Users/adamstyer/Documents/loanos-clone`
2. If it fails — fix all errors, then re-run build until it passes
3. Only push when build is green

After **every** `git push`:
1. Use the Vercel MCP (`list_deployments` then `get_deployment_build_logs`) to watch the deployment
2. If `state: ERROR` — read the logs, fix the code, push again
3. Confirm the deployment reaches `state: READY` before ending the session

**Never leave a session with a failed Vercel deployment.**

## Read First

Before doing any work, read `CONTEXT.md` — it contains the current project status, schema details, and session history.

Before changing code, also read `docs/AI_AGENT_ONBOARDING.md` and `docs/REPO_STRUCTURE.md`.

## Project

- Repo: `/Users/adamstyer/Documents/loanos-clone`
- Framework: Next.js 14 (App Router)
- Database: Supabase (types in `src/lib/database.types.ts`)
- Deployed to: Vercel — team `astyer8345s-projects`, project `loanos`
- Team ID: `team_aJNpxKvLlNTUiDdWTdhX0Vgf`

## Key Rules

- Run `npm run build` before every push — the pre-push git hook enforces this
- TypeScript strict mode is on — no `any` without `eslint-disable` comment
- All Supabase inserts using `Object.fromEntries()` must cast to the correct Insert type via `as unknown as XyzInsert`
- `Json` columns from Supabase must be cast via `unknown` before converting to domain types
- Never commit to `master` branch — always use `main`
