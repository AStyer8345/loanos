# Lead-Gen Pile Re-Alignment vs Refreshed GOALS (Week of 2026-05-18)

**Session:** 2026-05-18 AM lead-gen-am
**Mode:** Sequence A — Re-prioritization decision document (NOT a new spec; no new funnel/audit/brief authored)
**Trigger:** PM 05-17 NotebookLM-nightly session and AM 05-17 lead-gen-am session both forward-hinted: "AM 05-18 lead-gen-am should re-evaluate the 10-item [LEAD-GEN] pile against the NEW GOALS direction (complicated income + wholesale pricing + new company transition); retire / re-prioritize specs that no longer align."
**Purpose:** Triage every open [LEAD-GEN] ADAM-TODO line against the Week-of-2026-05-18 GOALS direction. Each item gets a verdict (KEEP / RECONCILE / DEFER / RETIRE / CLOSE) so Adam's review queue can shrink from "13+ items, all roughly equal priority" to a small ranked short-list.

---

## Refreshed GOALS — Lead-Gen-Relevant Excerpts

**North Star:** Close loans. Build the pipeline. Land cleanly at the new company.

**This Week's Priorities (Lead-Gen-relevant):**
1. **Pipeline / outbound** — "Work the active pipeline. Every borrower, every file, every week. Lead response same business day. Outbound to past realtors, past clients. Bring in new files."
2. **Positioning Shift** — "Reposition styermortgage.com around 'complicated income' — self-employed, 1099, bank statement, asset depletion, DSCR, jumbo. Second leg: wholesale pricing — 40+ lenders, often beats bank quotes on conventional files too. No more '21-day close' claim. No more performance-metric marketing. Specialist positioning. Story-driven."
3. **New Company Transition** — "Pre-audit cleanup of styermortgage.com so the new company's compliance review passes on first read. Phase A items from the 2026-05-17 audit: testimonials, rate widget, superlatives, EHL/NMLS coverage, GLBA privacy rewrite. Phase B (name swap) executes once new company name is locked."

**What I'm NOT Doing (Lead-Gen-relevant):**
- No LoanOS product work. No LoanOS marketing.
- No Client Ops build-out.
- No new advertising spend that doesn't directly bring loans in this month.
- No new content on the site beyond the repositioning + compliance fixes.

**Phase A site audit** (reference: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/audits/2026-05-17-full-site-seo-aeo-conversion-audit.md`) supersedes much of the 2026-05-01..05-13 audit/PR work — it covers the same pages from a positioning-aware angle.

---

## Pile Inventory + Verdicts

12 [LEAD-GEN] items spanning 2026-04-15 → 2026-05-14, plus a few older standing items. Verdicts below are recommendations; Adam can override any of them in one line.

### TIER 1 — KEEP (directly serves new GOALS direction)

| # | Item (date / one-liner) | New-GOALS hook | Verdict | Next step |
|---|------------------------|----------------|---------|-----------|
| 1 | **2026-05-14 ⭐ Realtor Relationships Drip — Phase-1 Activation Spec** (`tasks/lead-gen/specs/2026-05-14-realtor-relationships-activation-spec.md`) | Priority 1 — "Outbound to past realtors. Bring in new files." Pool B = 158 distinct realtors with at least 1 linked closed loan. | **KEEP — TOP OF QUEUE** | 3 decisions ~5 min → Builder ships ~60 min. Highest-leverage single Adam unblock in the pile; only one in Tier 1 that creates outbound motion this week. |
| 2 | **2026-05-09 PR-4 Cross-page Brand + Footer-Address PR** | Phase A compliance — EHL/NMLS coverage + address consistency (about.html LocalBusiness vs index.html MortgageBroker mismatch is the highest-trafficked compliance fail). | **KEEP — RECONCILE INTO PHASE A** | Merge PR-4 line-items into the Phase A compliance bundle that 2026-05-17 audit already maps. Don't ship PR-4 alone; ship the merged Phase A bundle. |
| 3 | **2026-05-06 PR-1 Compliance Closeout PR** | Phase A compliance — "21-day close" claim removal, superlatives cleanup, NMLS#513013 footer audit. | **KEEP — RECONCILE INTO PHASE A** | Same as PR-4. Both PR-1 and PR-4 are compliance-PR scaffolds that pre-date the 2026-05-17 audit; the audit is now the authoritative source-of-truth. Merge → single Phase A bundle. |
| 4 | **2026-04-27 ❓ Long-Term Nurture + Past Client Retention (drip authoring)** | Priority 1 — "Outbound to past clients." Past Client Retention drip already exists in Supabase as `status='active'` campaign with 0 authored email content; anyone enrolled gets silently terminated by the safety guard. | **KEEP — re-prioritize on Past Client Retention half** (Long-Term Nurture half is for new leads — defer with the new-lead pile). | Author 4 Past-Client-Retention email bodies through new positioning lens (complicated-income angle + wholesale-pricing message). ~2hr Builder once Adam authorizes copy direction. |
| 5 | **2026-04-15 🔒 Calendly HMAC** | Security hardening on existing pipeline endpoint. Cost-free, positioning-independent, prevents spoofed booking webhooks. | **KEEP — freebie** | Adam: paste Calendly signing key from Calendly → Integrations → Webhooks → Signing Key into n8n credential. ~5 min Adam + ~10 min Builder to wire HMAC verify node into `PBu2Zt0YpiLHeqbL`. |

### TIER 2 — RECONCILE (overlap with 2026-05-17 audit; merge rather than ship separately)

| # | Item | Why reconcile | Verdict |
|---|------|---------------|---------|
| 6 | **2026-05-10 PR-5 Final Light-Pass PR** | Polish PR on existing pages. Some items still apply post-repositioning; others assume the old "Apply Now"/"Get Pre-Approved" CTA architecture that the 2026-05-17 audit retires in favor of "scenario review" CTAs. | **RECONCILE** — cherry-pick only items that survive new positioning; fold survivors into the Phase A bundle. |
| 7 | **2026-05-08 PR-3 Thank-you Conversion PR** + 2026-05-05 /thank-you.html audit | Thank-you flow changes if site shifts from application-first to scenario-review CTAs (audit recommends this explicitly). | **RECONCILE** — defer PR-3 until homepage/products positioning locks, then re-derive thank-you variants from the new CTA architecture. |
| 8 | **2026-05-04 Homepage Forms Audit** (Quick Quote + Quick Contact) | 2026-05-17 audit recommends homepage hero/products page restructure around complicated-income pillar. Form findings (TCPA + conversion) survive; copy findings do not. | **RECONCILE** — extract TCPA findings (compliance, survive any positioning) into Phase A; defer copy findings until homepage positioning locks. |
| 9 | **2026-05-01 /get-preapproved.html audit** + 2026-04-28 /get-preapproved traffic+CTR analysis | 2026-05-17 audit recommends scenario-review CTA for complex borrowers; `/get-preapproved` may survive but with very different framing. PA funnel has 0 submissions in 23+ days — the bottleneck is upstream of `/api/contacts/web-lead`, not the page itself. | **RECONCILE** — re-audit `/get-preapproved` through the new positioning lens before shipping any of the original 20 findings. Most compliance findings survive; most conversion-copy findings do not. |

### TIER 3 — DEFER (channel/funnel may not survive new positioning)

| # | Item | Why defer | Re-evaluate when |
|---|------|-----------|------------------|
| 10 | **2026-05-13 /refinance-quote.html audit** | Refinance is not in the "complicated income + wholesale pricing" new pillars. May survive only as a specialist-refinance angle (HELOC/cash-out for self-employed, DSCR refi, etc.). | After repositioning copy locks. |
| 11 | **2026-05-02 /rate-alert.html audit** + 2026-04-15 Set Rate weekly | Rate widget is on the 2026-05-17 Phase A retirement list. Rate Alert funnel zero captures in 30+ days. | After Phase A rate-widget disposition lands. |
| 12 | **2026-05-12 iMessage Comparison Brief** + 2026-04-24 Sendblue Speed-to-Lead | New outbound channel + new tooling cost + TCPA prereq. GOALS says "no new advertising spend that doesn't bring loans this month." iMessage is technically inbound-response, not advertising — but it is also not a Week-of-05-18 priority. Realtor Relationships drip is the cheaper, faster outbound motion to validate first. | After Realtor Relationships Phase-1 produces ≥1 engagement reply (≥30% open + ≥3% reply across first 50 sends per 05-14 spec). |
| 13 | **2026-04-15 🎯 Lead Scoring** | Cross-cutting infrastructure — useful once pipeline volume justifies. Currently 0 captures on 5 of 6 named funnels (only AEO is producing ~1 capture/6 days). | After Phase A compliance lands + repositioning copy ships + ≥10 captures/month on owned channels. |

### TIER 4 — RETIRE / CLOSE (superseded or paused-by-GOALS)

| # | Item | Why retire | Verdict |
|---|------|-----------|---------|
| 14 | **2026-05-07 PR-2 Conversion Consolidation PR** | "Apply Now" → "Scenario Review" CTA architecture in the 2026-05-17 audit supersedes the original PR-2 conversion-consolidation premise. | **RETIRE** — close as superseded; relevant findings absorbed into Phase A. |
| 15 | **2026-04-27 ❓ Realtor Relationships Drip (cadence question)** | Re-framed by 2026-05-14 Phase-1 spec which discovered the real blocker (`annual_date` + `condition` triggers have no evaluator) and proposed quarterly `relative_days` cadence as Phase-1. | **CLOSE as superseded by 2026-05-14 spec.** |
| 16 | **2026-04-27 🚨 CRON_SECRET (LoanOS drip cron)** | GOALS pauses "LoanOS product work." Drip cron is LoanOS-internal infrastructure. | **DEFER (LoanOS paused).** The Realtor Relationships Phase-1 spec is the only drip path GOALS still authorizes; if it ships, CRON_SECRET becomes load-bearing again — re-surface then. |
| 17 | **2026-04-27 ❓ Long-Term Nurture half** (separate from Past Client Retention) | Long-Term Nurture targets new leads, not past clients. New-lead pipeline is paused-by-GOALS (no advertising spend, no new content) until repositioning + compliance land. | **DEFER** until repositioning copy locks + Phase A ships. |

---

## Adam's New Short-List (replaces the 13-item pile)

If Adam wants to clear lead-gen blockers efficiently this week, the new ordered list is:

1. **3 decisions on Realtor Relationships Phase-1** (~5 min, sensible defaults — read `tasks/lead-gen/specs/2026-05-14-realtor-relationships-activation-spec.md` § 5). Highest-leverage single unblock; creates outbound motion to 158 realtors this week. Aligns with "outbound to past realtors" GOALS priority.
2. **Calendly HMAC signing key paste** (~5 min). Freebie, positioning-independent.
3. **Phase A compliance bundle authorize** (single bundled "ship it" — merges PR-1, PR-4, parts of PR-5, parts of Homepage Forms TCPA findings — all sourced from the 2026-05-17 audit). Aligns with "new company compliance review" GOALS priority.
4. **Past Client Retention drip — copy direction decision** (~10 min). Should Past Client Retention emails lead with complicated-income story-pivot, wholesale-pricing message, or both? Once Adam picks, Builder authors 4 email bodies and Adam reviews.
5. **`notebooklm login`** from terminal (~1 min). Unblocks 17 wall-clock days of NotebookLM PUSH backlog.

Everything else in Tier 2 (RECONCILE) and Tier 3 (DEFER) waits until either repositioning copy locks or Phase A ships. Tier 4 (RETIRE) requires no further Adam action.

---

## What This Memo Is NOT

- **NOT a new spec.** No new funnel design, no new audit, no new brief. This is a re-prioritization decision document.
- **NOT a unilateral retirement.** Tier 4 items don't disappear from ADAM-TODO until Adam acks the verdict. The triage is a recommendation, not an action.
- **NOT a contradiction of the 05-15/05-16/05-17 restraint rule.** Restraint was conditioned on a stale-GOALS context that no longer holds. The PM 05-17 NotebookLM-nightly session and AM 05-17 lead-gen-am session both explicitly forward-hinted "AM 05-18 should re-evaluate the pile against new direction" — that's exactly what this is.

## Verification (read-only, this session)

- `GOALS.md` re-read: Week of 2026-05-18 / Last updated 2026-05-18 / lead-gen-am still in "Keep running" list — confirmed.
- 2026-05-17 site audit re-read: 18 complex/niche pages exist; "21-day" claims survive in 7+ high-visibility places; "Apply Now" appears 176 times; testimonials need verification — confirmed.
- NotebookLM CLI re-probed at 03:45 CDT: same `Authentication expired or invalid` WebLiteSignIn redirect — 17th wall-clock day blocked, 37 sub-sessions blocked counting this AM lead-gen-am.
- 2026-05-14 Realtor Relationships Phase-1 activation spec: re-read § 5 (3 decisions, defaults) — spec still untouched, Pool B count = 158 distinct realtors (last verified AM 05-17 SELECT query, baseline 12+ consecutive identical).

## Recommended Next-Session Behavior

- **If Adam acks any Tier 4 RETIRE/CLOSE verdict** → flip those ADAM-TODO lines `[ ]` → `[x]` in the same session (zero downstream Builder work). Ratio repair: 4 lines flipped at once.
- **If Adam authorizes Realtor Relationships Phase-1** → switch to Builder-readiness check (env vars, Supabase UPDATE migration draft, merge-tag resolver extension in `src/app/api/drip/run/route.ts`).
- **If Adam approves Phase A bundle direction** → SEO/SEM PM and styer-site-daily pick up the bundle authoring; lead-gen-am supports with funnel-specific compliance copy.
- **If Adam authorizes nothing again** → next session is read-only verification (drip baselines unchanged, NotebookLM auth still expired, ratio holds). Do not author another triage memo or spec.
