# LoanOS

Mortgage intelligence platform for loan officers. CRM, automation hub, AI assistant.

**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · Vercel

---

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in all values

npm install --include=dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.local.example` for all required variables. Key ones:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `ANTHROPIC_API_KEY` | Claude API |
| `LOANOS_AGENT_SECRET` | Agent/webhook route auth |
| `AZURE_CLIENT_ID` / `SECRET` / `TENANT_ID` | Outlook OAuth |
| `PII_ENCRYPTION_KEY` | AES-256-GCM for activity log PII |

Set all in Vercel → Settings → Environment Variables for production.

## Deploy

Auto-deploys on `git push origin main` via Vercel.

```bash
npm run build   # Always run before pushing
git push origin main
```

## Docs

- `CONTEXT.md` — Current project state (read first every session)
- `CHANGELOG.md` — What changed and when
- `DECISIONS.md` — Architecture decisions with reasoning
- `TODO.md` — Prioritized open work
- `ARCHITECTURE.md` — Technical reference (stack, schema, API routes)
- `RENOVATION-PLAN.md` — Master plan for UI simplification
- `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` — Product feature truth
