# Funnel + Drip Status Snapshot — 2026-04-29 AM

**Session type:** Sequence A — Research (read-only)
**Source:** Live Supabase (uuqedsvjlkeszrbwzizl), live HTTP, repo state
**Carried from:** 2026-04-28 AM "ANALYZE traffic+CTR" follow-up

---

## TL;DR

1. **Pre-Approval Funnel: still zero real submissions.** Every contact created since 2026-04-15 (lead-intake.js cutover) is either (a) a manual CRM addition or (b) an SEO-agent insert. No `lead_source='Pre-Approval Funnel'` rows ever. Yesterday's diagnosis stands: traffic problem, not pipeline bug.
2. **Drip pipeline: still zero sends and zero enrollments.** All 8 campaigns are `status='active'` with full skeleton + body content authored. Cron is plumbed, RPC is fixed, per-org From: address is wired (per Standup 04-29) — but nothing is enrolled, so the cron has nothing to do.
3. **GSC traffic data gap.** The most recent on-disk GSC export is `tasks/seo-sem/gsc/Pages.csv` dated 2026-03-26 — predates the PA funnel deployment (1b3f0be on 2026-03-29). `/get-preapproved.html` does not appear in any of the existing 7 GSC CSVs. Yesterday's queued analysis is **blocked on data**, not effort.
4. **Page is live and reachable.** `https://styermortgage.com/get-preapproved.html` → HTTP 200, 27.4 KB. `site:` query reachable.

---

## 1. Funnel volume — last 14 days

Window: contacts where `created_at >= 2026-04-15` (the lead-intake.js cutover).

| lead_source           | contacts | notes                                                          |
|-----------------------|---------:|----------------------------------------------------------------|
| `null`                | 9        | All manual CRM additions — see breakdown below                 |
| `Rate Check Form`     | 1        | 2026-04-16 — only "real" web form submission in 14 days        |
| `Website`             | 1        | 2026-04-23 — generic source, single contact                    |
| `AEO: ChatGPT`        | 1        | 2026-04-26 — agent-tagged AEO insert                           |
| `Pre-Approval Funnel` | **0**    | **No real PA-funnel form submissions in 14 days.**             |

### The 9 null-source contacts

7 realtors + 2 borrowers. NONE are web-form leads:

- **Realtors** (7): Patrick Birdsong (×2 distinct emails), Chelsea Lumpkin, Meghan Hughes (×2 distinct emails — at Christies + AT Properties), Rocelle Lam (CTT), Diane Myers (CTOT)
- **Borrowers** (2): Vy Nguyen + Kelli Kuenn — both `stage='Pre-Approved'`, `group_tag='Client'`. These are loan-stage contacts (Arive imports / manual CRM entries), not lead captures.

**Conclusion:** zero PA-funnel form fires in 14 days, confirming yesterday's diagnosis for an 8th consecutive day.

---

## 2. Drip pipeline — read-only snapshot

```
total_sends:        0
sends_24h:          0
sends_7d:           0
total_enrollments:  0
active_enrollments: 0
enrollments_7d:     0
```

8 active campaigns, all with full skeleton steps in `drip_steps`:

| campaign                | audience    | step_count | authored_steps |
|-------------------------|-------------|-----------:|---------------:|
| DPA Guide Nurture       | lead        |          8 |              8 |
| Lead — Ghost Referral   | lead        |          4 |              4 |
| Lead — Incomplete App   | lead        |          3 |              3 |
| Lead — Went Quiet       | lead        |          4 |              4 |
| Long-Term Nurture       | lead        |          2 |              2 |
| PA Welcome Nurture      | lead        |          6 |              6 |
| Past Client Retention   | past_client |          6 |              6 |
| Realtor Relationships   | realtor     |          4 |              4 |

**Caveat — content authoring lives in code, not DB.** `drip_steps.skeleton` is the trigger/copy skeleton; the rendered email bodies live in `src/lib/drips/authored-emails.ts` (per CONTEXT.md: "14 authored bodies (6 PA / 8 DPA)" + 2026-04-27 audit's "25 emails across 5 relative_days campaigns"). The 2026-04-27 finding that **Long-Term Nurture, Past Client Retention, and Realtor Relationships have no authored bodies in the code file still holds** — DB skeleton alone is not deliverable content.

**Why the cron is silent:** there are zero enrollments. Even with `CRON_SECRET` set (resolved 2026-04-23) and the RPC fix shipped (2026-04-27), the loop has nothing to iterate over.

---

## 3. GSC traffic data — gap identified

**Most recent on-disk export:** `tasks/seo-sem/gsc/Pages.csv` dated **2026-03-26** (mtime).

**PA funnel pages in that export:** none. `/get-preapproved.html` does not appear in any of:
- Pages.csv (top 19 pages — no /get-preapproved entry)
- Queries.csv (4216 bytes — top queries)
- Devices.csv / Countries.csv / Search appearance.csv (aggregate slices)

**Why:** PA funnel was deployed 2026-03-29 (commit `1b3f0be`); the GSC export pre-dates deployment by 3 days. The page hadn't been indexed when this export was pulled.

**Implication:** the actionable GSC analysis queued from yesterday cannot be performed against existing data. Three paths forward, in order of cost:

1. **(cheapest) Ask Adam to re-export GSC** for last 28 days at `tasks/seo-sem/gsc/Pages.csv` — a 2-minute manual export from Search Console UI.
2. **(medium) Wire GSC API access** via service account → Supabase or local script. Requires Adam to provision a GCP service account + grant GSC site permissions.
3. **(deferred) Wait for SEO/SEM agent's 90-day GSC export** that's already on its blocker list (per CONTEXT.md SEO agent status: "90-day GSC export not yet pulled — blocks Page-2/3 quick-win identification").

Option 3 covers this gap implicitly when the SEO agent unblocks itself. No new Adam ask needed today.

---

## 4. Recommendations for next session

In priority order (all agent-actionable):

1. **Page-level QA on `/get-preapproved.html`** — agent task. Run a synthetic submit (POST to subscribe-lead.js or lead-intake.js with a `__test__` flag) to confirm a real round-trip writes a row with `lead_source='Pre-Approval Funnel'` to `contacts`. Yesterday's diagnosis was code-review-only; an actual end-to-end submission would close the loop.
2. **Realtor Relationships content authoring** — even without Adam's cadence call, the *email bodies* could be drafted speculatively (28 realtors are immediate audience). Spec lives at `tasks/lead-gen/specs/2026-04-26-realtor-relationship-drip-spec.md`; cadence affects scheduling, not body copy.
3. **Defer GSC pull request** until SEO/SEM agent's 90-day export lands, then slice it for `/get-preapproved.html` impressions/CTR.

**Not recommended for an automated session:** manually enrolling a contact in PA Welcome to "prove" the drip loop. That fires a real production email and should be done with Adam's explicit go-ahead (already on his queue in spirit; reflected in Standup's "What's next" #1).

---

## 5. Compliance status

- TCPA: unchanged. No SMS sends since funnel build.
- CAN-SPAM: unchanged. Unsubscribe page (`/unsubscribe`) shipped 2026-04-24.
- NMLS #513013 + Equal Housing: present on PA funnel pages (verified 2026-03-30 post-deploy QA).
- Zero compliance regressions detected this session.

---
*Generated: 2026-04-29 AM session — Master Orchestrator*
