# PA Funnel Zero-Leads Diagnosis — 2026-04-28 AM

## TL;DR

The "zero contacts with `lead_source='Pre-Approval Funnel'`" finding from 2026-04-27's audit **is NOT a code bug**. It's a **traffic / conversion problem**. The form-write code path is clean end-to-end. The PA funnel form (`get-preapproved.html`) has simply not received real submissions since the `lead-intake.js` cutover on 2026-04-15. Recommendation: stop hunting bugs, start investigating why the page doesn't convert.

---

## What Was Investigated

The 2026-04-27 drip data-integrity audit ended with a flag: `SELECT COUNT(*) FROM contacts WHERE lead_source='Pre-Approval Funnel'` returns 0, despite get-preapproved.html being live since 2026-03-29. This session traced the code path end-to-end and quantified actual form submissions.

## Code Path Audit (Result: CLEAN)

There are TWO PA-funnel form paths on styermortgage.com:

### Path 1: get-preapproved.html → lead-intake.js (ACTIVE since 2026-04-15)
1. `get-preapproved.html` line 539, 564 — form payload includes `tag: 'pre-approval-funnel'` and `lead_source: 'Pre-Approval Funnel'`
2. POST to `/.netlify/functions/lead-intake` (line 554)
3. `netlify/functions/lead-intake.js` line 73 — `const leadSource = body.lead_source ?? "Website";` (preserves 'Pre-Approval Funnel' through nullish coalescing)
4. POSTs to `/api/contacts/web-lead` line 175 — `lead_source: p.leadSource`
5. `src/app/api/contacts/web-lead/route.ts` line 233 — writes `lead_source: lead_source || 'Website'` to contacts row

**Verdict: no bug. The string flows through unchanged.**

### Path 2: prequal.html → script.js → subscribe-lead.js (legacy, kept for rollback)
1. `script.js` line 828 — payload includes `tag: 'prequal-lead'` and `lead_source: 'Pre-Approval Funnel'`
2. POST to `/.netlify/functions/subscribe-lead`
3. `subscribe-lead.js` line 91 — passes `lead_source` to `createLoanosContact()`
4. line 251 — `lead_source: lead_source || "Website"` in body
5. Same web-lead route as Path 1.

**Verdict: no bug.**

## Quantification (Result: ZERO REAL SUBMISSIONS)

Queried Supabase + n8n MCP to count actual form-driven contacts since 2026-03-29:

### Query 1 — lead_source distribution since 2026-03-29
| lead_source | n |
|---|---|
| (null) | 553 |
| Realtor Referral | 10 |
| AEO | 2 |
| Rate Check Form | 1 |
| Website | 1 |
| Claude | 1 |
| AEO: ChatGPT | 1 |
| web lead | 1 |
| **Pre-Approval Funnel** | **0** |

(553 nulls are predominantly Arive sync / pipeline contacts — not web leads; their `referral_type ≠ 'web_lead'`.)

### Query 2 — `referral_type='web_lead'` since 2026-03-29 (i.e., went through web-lead route)
7 total. NONE labeled "Pre-Approval Funnel". Distribution: AEO×3, Claude×1, web lead×1, Website×1, null×1. All look like SEO-agent manual creations or test rows (notes match web-lead-route signature but `source_page` is null on all of them — lead-intake.js sets that field, so absence implies they didn't come through lead-intake.js).

### Query 3 — only contact with TCPA Consent in notes (a get-preapproved.html-specific field)
1 total: **Jung Lee, 2026-04-13** (predates lead-intake.js cutover by 2 days). lead_source = 'AEO' — but checking activity_log shows multiple `contact_updated` actions on 2026-04-16 (within 24h of creation), strongly suggesting the SEO/SEM agent manually updated the lead_source after seeing the lead came from a ChatGPT citation. The contact was real. The lead_source was overwritten.

### Query 4 — n8n PA Lead Notify webhook (`J9Pe24vUi6fpZtdZ`)
**triggerCount = 1** in 32 days (since 2026-03-27 creation). This webhook only fires from `subscribe-lead.js` for `lead_source === 'Pre-Approval Funnel'`. One trigger → one prequal.html submission in a month.

### Query 5 — activity_log `contact_created` events since 2026-03-29
4 total (across all sources). Same picture — the system is creating very few new contacts via any route.

## Conclusion

The PA funnel form has captured **at most one real submission** (Jung Lee, 2026-04-13) since deploy. After the 2026-04-15 lead-intake.js cutover, **zero** real PA-funnel submissions have arrived through `/api/contacts/web-lead`. The 7 web_lead-typed contacts in the period are SEO-agent manual inserts (AEO/Claude/Website lead sources) + 1 wife test row (Britney Jo Styer).

This is a **traffic / page-conversion** issue, not a data-pipeline bug. The TODO entry "INVESTIGATE — ZERO PA-FUNNEL CONTACTS" can be resolved as "investigated, not a code bug; need traffic/conversion analysis instead."

## Why This Matters For GOALS.md

`/Users/adamstyer/Documents/GOALS.md` (week of 2026-04-20) has two relevant priorities:
- "**SEO fixes:** High impressions, low CTR. Audit and rewrite title tags + meta descriptions on the highest-impression pages first."
- "**Conversion:** Make the site work harder. CTAs, trust signals, social proof."

Both apply. The `/get-preapproved` page is the canonical PA funnel page; if it has impressions but no clicks/submissions, the title-tag/meta-description rewrite + CTA audit work is exactly the right intervention.

## Recommendations

### Immediate (no Adam dependency, agent can act)
1. **Resolve ADAM-TODO entry** "🐛 INVESTIGATE — ZERO PA-FUNNEL CONTACTS" — replace with "🔎 ANALYZE — get-preapproved.html traffic + CTR (GSC + GA4)" and reference this report.
2. **No code change needed** in subscribe-lead.js, lead-intake.js, or web-lead route. Code path is fine.

### For next agent session (research, no Adam dependency)
3. **Pull GSC data for /get-preapproved.html** since 2026-04-15 (impressions, clicks, CTR, position). If impressions exist but CTR is low → title/description rewrite work. If impressions are zero → page is unindexed or unranked, separate problem.
4. **Pull GA4 page views for /get-preapproved.html** in the same window. Combine with form-submission count (1) to compute funnel conversion rate. If page views > 50 but submissions < 5, the form/page is the bottleneck. If page views < 10, the page itself isn't getting traffic.

### For next BUILD session (after CRON_SECRET unblocks the drip cron — Adam-blocked)
5. Add lightweight inbound logging to `/api/contacts/web-lead` to make this kind of investigation a single SQL query. Suggested approach: a `web_lead_inbound` activity_log entry written BEFORE the dedup check, capturing `lead_source` + `referral_type` + `source_page` from the raw body. Future "is the funnel firing?" questions answer themselves.

### Cross-cutting (nice-to-have, low priority)
6. The TCPA Consent line in Jung Lee's notes was lost in agent translation — `subscribe-lead.js` (legacy path) was passing `lead_source` correctly but neither route nor function logs the TCPA consent timestamp anywhere queryable. If TCPA defense ever matters, that's a gap. Out of scope today.

## Files Touched This Session
- READ-ONLY investigation. Zero code changes. Zero Supabase mutations. Zero n8n changes.
- Output: this file. Plus session-log update and an ADAM-TODO replacement entry.
