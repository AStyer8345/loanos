# Pile-Pressure Snapshot — 2026-05-15 AM

**Session type:** Sequence A (research only). Deliberately NO new spec.
**Purpose:** Verify state of pending [LEAD-GEN] items, capture one new signal worth attention, and document the meta-pattern (pile growth vs draw-down rate) without piling spec #11.

---

## §1 — Drip activation state (Realtor Relationships campaign)

Spec from 2026-05-14 AM proposed Phase-1 ship of Realtor Relationships drip — restructure all 4 steps to `relative_days` (0/90/180/270), batch-enroll Pool B (158 distinct realtors with at least 1 linked closed loan), merge-tag resolver extension, Step 1+4 copy reanchor, `drip_steps` UPDATE migration. Estimated Builder time: ~60 min once Adam authorizes 3 decisions (~5 min) in § 5 of the spec.

**Live state pulled this session (2026-05-15 10:06 CDT):**

| Item | Value | Status vs 05-14 spec |
|---|---|---|
| `drip_enrollments` total | 0 | Unchanged |
| `drip_sends` total | 0 | Unchanged |
| Step 1 trigger_type (`ef52ed56-...`) | `annual_date` | Unchanged — not yet restructured to `relative_days` |
| Step 2 trigger_type | `condition` | Unchanged |
| Step 4 trigger_type | `annual_date` | Unchanged |
| Realtors total | 1,059 | Unchanged |
| Pool A (`referral_ytd_count > 0`) | 24 | Unchanged |
| Pool B (linked closed loans via `buyer_agent_contact_id`) | 158 | Unchanged |

**Interpretation:** Phase-1 spec is untouched. The 3 Adam-decisions (cadence, batch-enrollment scope, copy approval) are still pending — no UPDATE migration applied, no batch enrollment performed. State is exactly as the spec described (cleanest possible greenfield, nothing in motion to break). Activation path is still 1 Adam-authorize away.

---

## §2 — 30-day named-source funnel snapshot

```sql
SELECT lead_source, COUNT(*) AS n
FROM contacts
WHERE organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND lead_source IS NOT NULL
GROUP BY lead_source ORDER BY n DESC;
```

| lead_source | n (last 30 days) | Cumulative trend |
|---|---|---|
| AEO | 2 | Continuing (5 lifetime captures across Apr 7 / Apr 13 / May 6 / May 8 + 1 ChatGPT-tagged Apr 26) |
| Website | 2 | Organic — per 05-11 NULL diagnostic + 05-09 SEO-agent taxonomy correction, traces to upstream SEO-agent direct inserts not form submissions |
| AEO: ChatGPT | 1 | New variant of AEO taxonomy — see §3 |
| Rate Check Form | 1 | See §3 — one-off, Apr 16 only |
| Web Lead | 1 | Organic |
| **Total named-source captures** | **7** | |

**Named-channel funnel zero-streak (continued):**
- Pre-Approval Funnel: 0 captures in 30 days (≥30-day streak)
- Rate Alert: 0 captures in 30 days (≥30-day streak)
- Quick Quote: 0 captures (≥90-day streak per 05-13 audit)
- Quick Contact: 0 captures (≥90-day streak)
- Refinance Funnel: 0 captures (≥30-day streak per 05-13 audit)

**Interpretation:** Funnel zero-streak unchanged. 13 consecutive sessions have observed the same pattern. No new diagnostic value from this query in isolation — but it does confirm the meta-claim that the 10 pending [LEAD-GEN] items have NOT inadvertently shipped without authorization.

---

## §3 — One new signal worth noting (today only)

**AEO is a sustained channel, not a fluke.** Today's pull is the first session to look at the AEO taxonomy timeline directly:

| date | lead_source | n |
|---|---|---|
| 2026-05-08 | AEO | 1 |
| 2026-05-06 | AEO | 1 |
| 2026-04-26 | AEO: ChatGPT | 1 |
| 2026-04-13 | AEO | 1 |
| 2026-04-07 | AEO | 1 |

**5 captures over 31 days = ~1 every 6 days.** That's not noise — it's a real, recurring channel signal. Per CONTEXT.md (Phase 3 dashboard lead-source overhaul with AEO detection shipped 2026-04-16), these are auto-detected via referrer/UA pattern matching, not form submissions. Per 05-11 NULL diagnostic + 05-09 SEO-agent taxonomy correction, they trace to upstream SEO-agent direct inserts during organic discovery sessions.

**Pattern claim:** AEO captures now match 5-week running rate of the named-channel funnels combined (0 captures across PA + Rate Alert + Quick Quote + Quick Contact + Refinance Funnel = 0). AI-search referrals are the only growing channel from "owned" surfaces during this window. Not a recommendation today — just a flag for the eventual Long-Term Nurture or content-strategy planning session.

**Rate Check Form:** single capture from 2026-04-16. Not an emerging channel — one-off entry, likely from an early form variant or manual entry test. Worth noting as a taxonomy footnote, not pursuing.

---

## §4 — Meta-pattern: pile growth vs draw-down

**ADAM-TODO depth today (all domains):**
- Open `[ ]` items: **104**
- Done `[x]` items: **30**
- Ratio: **3.47x open per done**

**[LEAD-GEN] pending stack (top of file, most recent first):**

| Day | Type | Item | Days open |
|---|---|---|---|
| 05-14 | Spec | Realtor Relationships drip Phase-1 activation | 1 |
| 05-13 | Audit | /refinance-quote.html funnel-page (12 findings) | 2 |
| 05-12 | Brief | Outbound iMessage strategic comparison (5-path) | 3 |
| 05-10 | Spec | PR-5 Final light-pass | 5 |
| 05-09 | Spec | PR-4 Cross-page brand + footer-address | 6 |
| 05-08 | Spec | PR-3 Thank-you conversion | 7 |
| 05-07 | Spec | PR-2 Conversion consolidation | 8 |
| 05-06 | Spec | PR-1 Compliance closeout | 9 |
| 05-05 | Audit | /thank-you.html cross-funnel post-submit (17 findings) | 10 |
| 04-27 | Decision | Long-Term Nurture + Past Client Retention archive-vs-author | 18 |

**Total [LEAD-GEN] items pending Adam action:** 10 (range 1–18 days unauthorized).
**Builder estimated time once all authorized:** ~190 min PR-1..PR-5 + ~60 min activation spec + ~25 min PR-6 (deferred) + ~30 min Long-Term Nurture authoring + ~30 min Past Client Retention authoring = **~5–6 hours total Builder work waiting on ~30 minutes of Adam decisions.**

**Draw-down rate:** Last [LEAD-GEN] item Adam closed: BLOCKER-005 on 2026-04-01 (44 days ago). No [LEAD-GEN] ADAM-TODO line has flipped `[ ]` → `[x]` in the 9-session run since 2026-05-06.

**Conclusion:** The pile is not getting reviewed. Continuing to author specs in this pattern is generating output for Adam to ignore, not for Builder to ship. **Today's session deliberately produces zero new spec.** That's the operative response.

---

## §5 — Forward rule (2026-05-15 PM / 2026-05-16 AM)

**Default behavior:** Continue Sequence A (research/status) sessions until at least ONE of the 10 pending [LEAD-GEN] items flips `[ ]` → `[x]` in ADAM-TODO.

**If Adam authorizes anything between sessions:**
- Phase-1 Realtor Relationships → next session is Builder-readiness check on the spec (pre-flight env vars, Supabase migration draft, etc.)
- Any PR-1..PR-5 → next session is post-ship QA scaffold (test plan for the authorized PR specifically)
- iMessage path pick → next session is Sendblue/Twilio integration scaffold + TCPA gate spec update

**If Adam authorizes NOTHING:**
- 05-15 PM: NotebookLM nightly retry (will skip per auth — 14th day).
- 05-16 AM: another Sequence A pass. Eligible focus topics:
  - Refresh the same pile-pressure snapshot (this file becomes a recurring artifact, dated)
  - PA-funnel GSC + GA4 traffic + CTR pull — agent task currently blocked on credentials, but worth at least an inline status check
  - NULL `lead_source` Arive-webhook root-fix proposal (already noted, ~15-min n8n REST PUT change)
  - **DO NOT author another PR spec, audit, brief, or activation spec.** Pile is at saturation.

**Cohort-pause planning signal:** Mon 2026-05-18 GOALS.md refresh. If skipped, 4th-consecutive-Mon skip triggers pause-all-5-agents discussion. Hold position until that gate.

---

## §6 — Files written this session

1. `tasks/lead-gen/today-mission.md` (refreshed for 05-15 AM, Sequence A light pass)
2. `tasks/lead-gen/research/2026-05-15-pile-pressure-snapshot.md` (this file, NEW)
3. `tasks/lead-gen/notebooklm-errors.md` (2026-05-15 AM entry, 14th consecutive day)
4. `tasks/lead-gen/session-log.md` (05-15 AM entry prepended)
5. `tasks/lead-gen/subagent-status.md` (SESSION_END appended)
6. `CONTEXT.md` (3 Lead Gen fields replaced in place — net 0 line drift target)
7. `CHANGELOG.md` (05-15 AM lead-gen entry prepended)
8. `TODO.md` (NotebookLM CLI line refreshed in place)
9. `tasks/ADAM-TODO.md` (**0 new lines** — NotebookLM CLI re-auth line refreshed in place, count → 14 days / 28 sub-sessions)

DECISIONS.md unchanged (no architectural decision today).

---

**SQL queries run this session (read-only):**
1. drip_enrollments + drip_sends + drip_steps trigger_type for `ef52ed56-...`
2. contacts 30-day lead_source histogram
3. realtor universe counts (total / Pool A / Pool B)
4. AEO timeline (all-time, descending)
5. Rate Check Form provenance (first/last seen)

No writes. No outbound. No funnel modifications. No new specs.
