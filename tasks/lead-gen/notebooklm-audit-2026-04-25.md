# NotebookLM Staleness Audit — 2026-04-25

## Sources Removed (4)

| Source ID | Filename / Title | Age | Reason |
|-----------|------------------|-----|--------|
| 6471ba3d | notebooklm-audit-2026-04-24.md | 1 day | Superseded by today's audit (rotation rule) |
| a37decd1 | CONTEXT.md (Apr 24 version) | 1+ day | LoanOS CONTEXT.md was edited 2026-04-25 21:29 (drip reliability fix — `referred_by` merge tag + Ghost Referral guard, commit 8bc9827, Vercel READY). Replaced with Apr 25 copy. |
| 2e4b82de | 2026-03-28-rate-alert-funnel-spec.md | 28 days | Set Rate webhook (3iXImUkjgMitpJKt) now fully repaired and in production; Validate Rate bug fixed (per CONTEXT.md late-3 Apr 16). Funnel spec superseded by live implementation. |
| 3c5d9e05 | 2026-04-06-lo-waitlist-spec.md | 19 days | LO waitlist is Phase 4 future state (LoanOS licensed to other LOs); not an active build. Trim to enforce 50-cap. |

## Sources Added (4)

| New Source ID | Title | Type |
|---------------|-------|------|
| d2c7479e | CONTEXT.md (Apr 25 21:29 — drip reliability fix `referred_by` + Ghost Referral guard) | foundational refresh |
| 29f64c5f | notebooklm-audit-2026-04-25.md (this file) | session audit |
| 49f3233c | 2026-04-25-tcpa-sms-one-to-one-consent-web.md | research summary |
| 99dd8905 | Navigating the perils of lead generation — scotsmanguide.com | web — TCPA one-to-one consent rule |

## Sources Confirmed Current

| Source | Status |
|--------|--------|
| domain-queue.md, lessons.md | CURRENT — foundational, never remove |
| Scotsman Guide articles (10) | CURRENT — primary mortgage industry intel |
| Mailchimp guides (7) | CURRENT — drip + nurture authoritative |
| Reg Z, CAN-SPAM, HUD, TDHCA | CURRENT — regulatory foundational |
| Funnel specs (FTB-DPA, refi-watch, lead-scoring, hot-lead-notification, realtor-referral) | CURRENT — most active in production or near-build |
| 2026-04-24-imessage-speed-to-lead.md | CURRENT — directly informs upcoming Sendblue build |
| Lead-scoring research + spec | CURRENT — system live in prod since Apr 19 |

## Final Notebook State

- **Count:** 50 / 50 (cap enforced)
- **Net change:** −4 deletions / +4 additions
- **Today's session work:** Drip reliability fix shipped (commit 8bc9827, Vercel `dpl_9xAt549WG9oHkZ9B1DhMgfSXXyKs` READY) — `referred_by` merge tag now resolves from `contacts.referred_by`; Ghost Referral skips send + advances enrollment when referrer missing.
- **Web research direction:** TCPA one-to-one consent rule (in effect April 11, 2026) — critical compliance gate ahead of Sendblue iMessage build.

## Notes

- Today's site / product work was internal LoanOS code (drip pipeline reliability). No new spec or build-report file in `tasks/lead-gen/specs/` or `tasks/lead-gen/build-reports/`.
- New TCPA research file added so the Lead Gen notebook has authoritative regulatory grounding for the upcoming SMS workstream — fills a gap noted in prior sessions.
