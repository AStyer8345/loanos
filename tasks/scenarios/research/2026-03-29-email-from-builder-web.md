# Web Research — Email from Builder
Date: 2026-03-29 (PM)
Topic: Sending scenario share links to borrowers directly from the LoanOS Scenarios tab

## Sources

### 1. Resend — Send Emails with Next.js
URL: https://resend.com/docs/send-with-nextjs
Summary: Official Resend docs for Next.js App Router integration. Covers API route setup, Resend Node.js SDK (`npm install resend`), sending from Server Actions or Route Handlers with `resend.emails.send()`. React Email templates compile to HTML. No n8n needed — direct API call from a Next.js Route Handler.

### 2. Mortgage Maker — Features
URL: https://mortgagemaker.ai/mortgage-maker-mortgage-presentation-features/
Summary: Mortgage Maker sends presentations via shareable link + email with engagement tracking (knows when borrower views, edits, saves). Borrowers see mobile-optimized digital presentation, not a PDF attachment. Key competitive insight: MC/Mortgage Maker track borrower opens — LoanOS should confirm delivery and optionally log view events to activity_log.

### 3. Sequenzy — How to Send Emails in Next.js (2026)
URL: https://www.sequenzy.com/blog/send-emails-nextjs
Summary: 2026 guide confirming Resend + React Email is the standard pattern for Next.js transactional email. Server Action or Route Handler calls `resend.emails.send()` with a React Email template. Highlights: domain verification required in Resend dashboard, FROM address must use verified domain (thestyerteam.com or styermortgage.com).

## Key Insights for Implementation

**Pattern:**
- New Route Handler: `POST /api/scenarios/send-email`
- Accepts: `{ scenarioId, shareToken, borrowerEmail, borrowerName, loName }`
- Looks up share token in Supabase (or passes it from client state)
- Calls `resend.emails.send()` with React Email template
- Logs send event to `activity_log`

**Competitive gap to close:** Mortgage Maker tracks when borrower opens the presentation. LoanOS should at minimum log the send event and ideally track when the share page is first loaded.

**Domain concern:** FROM address needs verified domain. LoanOS uses adam@thestyerteam.com or adam@styermortgage.com — confirm RESEND_API_KEY and domain verification in Vercel env before building.

**No n8n needed:** This is a first-party feature, not a workflow trigger. Direct Resend call from API route is cleaner and faster.
