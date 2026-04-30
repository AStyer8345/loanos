## Mission Brief — 2026-04-30 AM

### Domain
Lead Generation

### Focus Area
Realtor Relationships drip email body drafts (autonomous, copy-only) + drip cron read-only verification

### Session Type
[ ] Research + Planning (Sequence A)
[x] Strategy / Architecture (Sequence B — Author drafts)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Why This Mission

8 days running of "PA funnel zero leads" status snapshots. Pattern is established and already surfaced to Adam. Continuing daily snapshots is busywork.

GOALS.md week priority: "Drip campaigns — not working the way they should. Spend time this week fixing so Scott and I can both use them. Critical for beta utility."

Two of the three skeleton-only campaigns (Long-Term Nurture, Past Client Retention) are archive-vs-author Adam-blocked. The third — **Realtor Relationships** — is different: the campaign already exists in Supabase as `ef52ed56-8a22-4d15-9f12-a1796ccf17b6` with 4 active steps. The Adam-blocked piece is **cadence + activation criteria** (which days, which trigger). The **email copy itself is not Adam-blocked** — agent can draft it speculatively. When Adam returns the cadence decision, builder can wire the 4 emails immediately without an authoring loop.

### Objectives
1. Author 4 Realtor Relationships email body drafts using Adam's voice (`tasks/social-media/adam-voice-and-workflow.md`). One per existing campaign step. Mortgage-broker-to-realtor-partner tone — not realtor-to-buyer. Each email: subject, preview text, full body, CTA. NMLS #513013 + Equal Housing Lender disclosure.
2. Read-only Supabase verification: has the drip cron fired since per-org From: address shipped (commit `4ac0812`)? Query drip_sends + drip_enrollments + the 4 Realtor Relationships steps to confirm step structure matches what we're authoring against.
3. Output: `tasks/lead-gen/drafts/2026-04-30-realtor-relationships-email-bodies.md` — 4 emails in append-to-`authored-emails.ts`-ready format.

### Definition of Done
- 4 email bodies written, voice-aligned, compliance-aligned, in a single drafts file.
- Drip cron status confirmed via Supabase (1-line answer in session-log: fired or not since 2026-04-29 13:00 UTC).
- ADAM-TODO refresh: cadence-decision item still open; copy-blocked piece now closes (drafts ready when Adam decides).

### Resources / Files in Scope
- READ: `tasks/social-media/adam-voice-and-workflow.md` (voice guide)
- READ: `src/lib/drip/authored-emails.ts` (existing drip body format reference)
- READ: Supabase `drip_campaigns` (Realtor Relationships steps detail) + `drip_sends` + `drip_enrollments` (cron health)
- WRITE: `tasks/lead-gen/drafts/2026-04-30-realtor-relationships-email-bodies.md` (NEW)
- TOUCH: `tasks/lead-gen/session-log.md`, `CONTEXT.md` (3-field block), `CHANGELOG.md`, `TODO.md`, `ADAM-TODO.md`

### HIGH RISK Items
- None. No DB writes. No code commits. No outbound email. Drafts file only.
- Drafts must be flagged "DRAFT — pending Adam cadence decision" so they're not mistakenly wired into the campaign without approval.

### Compliance Checklist (apply to each email body)
- [ ] NMLS #513013 in footer
- [ ] Equal Housing Lender disclosure in footer
- [ ] Physical address: 5900 Balcones Drive, Suite 100, Austin TX 78731
- [ ] Unsubscribe merge tag `{{unsubscribe_url}}`
- [ ] No guaranteed-approval language
- [ ] No fair-lending protected-class targeting
- [ ] Voice = Adam's authoritative-without-arrogance tone, mortgage-broker-to-realtor-partner

### Sequence
B (Strategy) — light architect role, no builder/QA/reviewer needed because output is project-files-only drafts that go through Adam approval before any builder action. Reporter still runs at end.
