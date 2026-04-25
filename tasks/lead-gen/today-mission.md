## Mission Brief — 2026-04-25 AM

### Domain
Lead Generation

### Focus Area
Drip reliability — fix `referred_by` merge tag in Ghost Referral campaign (deferred from 2026-04-24)

### Session Type
[x] Execute / Build (Sequence C)

### Why This Today
GOALS.md priority: "Drip campaigns — not working the way they should. Spend time this week fixing so Scott and I can both use them. Critical for beta utility." Adam-blocked items (CRON_SECRET in Vercel, Sendblue API key, TCPA form language, PR #4 merge) cannot be advanced this session. Of the deferred items in 2026-04-24's session-log, the `referred_by` merge tag fix is the highest-value, smallest-scope, fully-actionable item that improves drip quality for Scott beta launch.

### Objectives
1. Fetch `contacts.referred_by` in the drip cron's per-row contact lookup
2. Pass it into the merge-vars object so `{{referred_by}}` resolves correctly in Ghost Referral emails (subject + body)
3. Add a data-integrity guard: if the campaign is GHOST_REFERRAL and `referred_by` is null/empty, skip the send (do not deliver a broken email like "got your name from") — log skipped, advance enrollment

### Definition of Done
- `src/app/api/drip/run/route.ts` reads `referred_by` from contacts, passes into renderer
- Guard added for Ghost Referral with missing referred_by (skips send, advances enrollment)
- `npm run build` green
- Commit pushed to `feat/tenant-scoping-hardening` (current working branch per session-log)
- Vercel deployment reaches READY state
- Session-log + CONTEXT.md updated

### Resources / Files in Scope
- `src/app/api/drip/run/route.ts` — modify (add referred_by select, guard, merge var)
- `src/lib/drip/authored-emails.ts` — read only (Ghost Referral campaign ID lives here)
- `src/lib/database.types.ts` — read only (confirm `referred_by` is `string | null` on `contacts`)

### HIGH RISK Items
- Drip cron is in production and authenticated (CRON_SECRET pending in Vercel — but the route deploys regardless; it just returns 401 until the secret is set). Must not break the existing PA Welcome / DPA Guide / Incomplete App / Went Quiet flows.
- The guard must NOT advance the enrollment past the entire campaign — it should advance to the next step like a normal send. Otherwise we silently kill the entire campaign for a contact missing one merge var.

### Scope Cuts (NOT this session)
- Realtor Relationship drip sequence (day 3/10/30) — separate build, requires new Supabase campaign + step rows
- Sendblue iMessage scaffolding — Adam-blocked on TCPA + API key
- Date-field / condition-trigger drip scheduler — separate scope
- PA / DPA / Incomplete App / Went Quiet email copy edits — out of scope, working as designed
