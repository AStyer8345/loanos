# LoanOS — AI Context File
> Read this at the start of every session before doing anything.
> Update this file whenever something significant changes.

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer.
Built for personal production use first. Licensed to other LOs in Phase 4.
Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Repo

https://github.com/AStyer8345/loanos
Branch: main
Deploy: Netlify (not Vercel)

## Current Status

Phase 1 complete as of March 8, 2026.
- Supabase connected
- Auth: email/password (adam@thestyerteam.com) — switched from magic link
- 4 tables live: contacts, loans, documents, activity_log
- Supabase Storage bucket: `documents` (must be lowercase — case-sensitive)
- PDF upload end-to-end verified: Storage → documents row → activity_log
- Next.js 14 deploying to Netlify (deploy fixes applied)
- /docs folder: loanos.html (build tracker), loanos-system-map.html (system map)

## Tech Stack

- Frontend: Next.js 14
- Hosting: Netlify
- Database: Supabase (Postgres)
- Auth: Supabase email/password
- File Storage: Supabase Storage (bucket: documents)
- Automation: n8n (replacing Zapier)
- AI: Claude API (Anthropic)
- Email: Outlook via n8n
- Marketing Email: Mailchimp
- LOS: Arive (webhook integration planned)
- Billing: Stripe (Phase 4)

## What's Already Live (separate repo: styer-mortgage-site on Netlify)

These tools are working and must NOT be broken during LoanOS build:
- Marketing Command Center (MCC) — full weekly cadence dashboard
- Content Dashboard — newsletter + realtor content generator
- Newsletter Generator — Claude API writes drafts, Mailchimp sends
- Rate Update Publisher — generates rate page, pushes to GitHub, Mailchimp
- Social Poster — auto-posts to LinkedIn + Facebook
- Dispatch Webhook — /.netlify/functions/dispatch (Bearer DISPATCH_SECRET)
- Storage: Netlify Blobs (key: mcc-state/current) — migrate to Supabase later

## Environment Variables

### loanos repo (Netlify — add as you build)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

### styer-mortgage-site repo (Netlify — already set)
- ANTHROPIC_API_KEY
- DISPATCH_SECRET
- MCC_PASS
- GITHUB_TOKEN
- GITHUB_REPO (points at styer-mortgage-site — update when migrating)
- MAILCHIMP_API_KEY
- MAILCHIMP_SERVER_PREFIX
- MAILCHIMP_BORROWER_LIST_ID
- MAILCHIMP_REALTOR_LIST_ID
- LINKEDIN_ACCESS_TOKEN (expires ~60 days — needs n8n refresh workflow)
- LINKEDIN_REFRESH_TOKEN
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET
- LINKEDIN_PERSON_URN
- FACEBOOK_PAGE_ACCESS_TOKEN
- FACEBOOK_PAGE_ID

## Migration Plan

- Phase 1-2: Keep all Netlify tools live. Build LoanOS fresh on Supabase.
- Phase 2-3: Migrate tools one at a time. Netlify Blobs → Supabase. Netlify Functions → n8n.
- Phase 4: All tools inside LoanOS. Netlify retired or kept for public pages only.

## Phase Roadmap

- Phase 1 (NOW): Foundation — Supabase schema, auth, PDF upload, basic dashboard
- Phase 2: Automation — n8n workflows, contract/CD/pre-approval extraction, Outlook drafts
- Phase 3: Calculator Suite — 6 calculators replacing Mortgage Coach, Claude narratives
- Phase 4: SaaS — multi-tenant RLS, Stripe billing, white-label, license to LOs

## Calculator Suite (Phase 3 — replaces Mortgage Coach)

1. Loan Scenario Comparator
2. Refi Analyzer
3. Rent vs. Buy
4. Total Cost of Homeownership
5. Max Purchase Price
6. Buy Now vs. Wait

Key differentiator: Claude API generates plain-English narrative per scenario.
Output: branded PDF or shareable link integrated with Supabase loan records.

## Key Decisions Made

- Zapier → replaced by n8n
- Jungo → replaced by LoanOS CRM
- Mortgage Coach → replaced by calculator suite
- Netlify Blobs → migrating to Supabase
- Vercel → NOT used, Netlify only
- Build for yourself first, license to LOs in Phase 4

## What To Build Next

Phase 1 complete. Next: Phase 2 — Automation
- n8n workflow: extract data from contract / CD / pre-approval PDFs
- Auto-draft Outlook emails on key events
- Arive webhook integration (planned)

## Phase 1 Complete (as of 2026-03-08)

- Supabase schema: contacts, loans, documents, activity_log
- Supabase Storage bucket: documents
- Auth: email/password (switched from magic link — adam@thestyerteam.com)
- /dashboard: live with table row counts + quick actions
- /dashboard/upload: PDF upload form — end-to-end verified
  - Select doc type (7 options)
  - Attach to existing loan OR create new contact+loan inline
  - Stores in Supabase Storage: {userId}/{loanId}/{timestamp}_{filename}
  - Inserts documents row + activity_log entry
- Migration 002: added doc_type + uploaded_by columns to documents table
- Storage bucket `documents` must exist (lowercase) with RLS policies set
- Netlify build fixes: mkdir -p public/docs, contacts type array fix, loanLabel array index fix

## Skills

User-defined Claude skills live at `/skills/user/`. Each subdirectory is one skill with a `SKILL.md` defining its behavior. Skills are sourced from the `AStyer8345/adam-styer-skills` GitHub repo.

## Docs

- Build tracker: /docs/loanos.html
- System map: /docs/loanos-system-map.html
- This file: /CONTEXT.md
- Changelog: /CHANGELOG.md

## Rules For AI Sessions

- Always read this file before starting
- Always update this file when something significant changes
- Always update CHANGELOG.md at end of session
- At end of every session: update CONTEXT.md and push to main with everything changed that session
- Never break styer-mortgage-site tools
- Never use Vercel
- Ask Adam before making architectural decisions not covered here
