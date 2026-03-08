# LoanOS Changelog

## [0.3.0] — 2026-03-08

### Added
- `supabase/migrations/002_documents_metadata.sql` — adds `doc_type` and `uploaded_by` columns to `documents` table
- `src/app/dashboard/upload/page.tsx` — server component: auth-gated, fetches loans, renders UploadForm
- `src/app/dashboard/upload/UploadForm.tsx` — client component: full PDF upload flow
  - Doc type select (Purchase Contract, CD, Pre-Approval Letter, Income, Bank Statements, ID, Other)
  - Existing loan dropdown OR new contact+loan inline creation (first name, last name, loan number)
  - Dashed PDF file picker with name + size preview
  - Uploads to Supabase Storage at `{userId}/{loanId}/{timestamp}_{safeFilename}`
  - Inserts `documents` row + `activity_log` entry
  - Green/red result banner, form resets on success
- Dashboard "Actions" section with Upload Document link

### Manual Steps Required
- Run `002_documents_metadata.sql` in Supabase SQL Editor
- Add Supabase Storage policy: allow authenticated uploads to `{userId}/` prefix in `documents` bucket

---

## [0.2.0] — 2026-03-08

### Added
- `CONTEXT.md` — AI session context file (stack, phase roadmap, env vars, rules, next steps)
- `skills/user/` — 10 user-defined Claude skills cloned from `AStyer8345/adam-styer-skills`
  - content-creator, contract-received, email-best-practices, final-cd-email
  - frontend-design, referral-intro-email, send-rate-update, strategy-advisor
  - weekly-newsletter, weekly-rate-update (+ APR calculations reference)
- `CHANGELOG.md` — this file

### Fixed
- `claude-sonnet-4-6` → `claude-sonnet-4-5-20251022` in `docs/README.md` (×2) and `docs/loanos-system-map.html` (×1)
- devDependencies (`postcss`, etc.) now install correctly — fixed `NODE_ENV=production` blocking dev installs

---

## [0.1.0] — 2026-03-08

### Added
- Next.js 14 app shell (App Router, TypeScript, Tailwind CSS)
- Supabase auth — magic link login (`adam@thestyerteam.com`)
- Protected `/dashboard` route with session middleware
- Supabase Postgres schema — 4 tables: `contacts`, `loans`, `documents`, `activity_log`
- Supabase Storage bucket: `documents`
- Netlify deployment with `@netlify/plugin-nextjs` v5
- `docs/` — `loanos.html` (build tracker) + `loanos-system-map.html` (architecture diagram)
- GitHub repo: `AStyer8345/loanos` on `main`
