# Social Media Pillar Framework v2 — with LoanOS/AI Content Stream

**Date:** 2026-04-05
**Status:** APPROVED — ready for implementation plan
**Author:** Brainstorming session with Adam Styer
**Supersedes:** `tasks/social-media/specs/2026-03-26-content-pillars-draft.md`
**Applies to:** Post 57 onward (clean break — Posts 50-56 unchanged)

---

## 1. Why This Exists

The current 5-pillar framework (`2026-03-26-content-pillars-draft.md`) predates the voice guide update (`adam-voice-and-workflow.md`, 2026-03-29) and contradicts it directly. The old pillars map ~80% of output to Education, which the voice guide explicitly flags as "the problem." The Architect subagent has been faithfully executing a stale spec, producing generic content that fails the Jessica Test.

Separately, Adam wants to begin marketing LoanOS and his AI work as a content thread — positioning for (in priority order) other loan officers, realtors, borrowers, and the AI builder community. The LoanOS story isn't missing from his voice — his voice guide already quotes him talking about it (Example B, the AI carousel that performed well). It's missing from the pillar framework that operationalizes his voice.

Both problems are the same problem. This spec fixes them together.

## 2. Scope

### In Scope
- New 4-pillar framework mirroring the voice guide tone dial (30/30/30/10)
- Rolling 4-week mix enforcement (replaces single-week mix balancing)
- LoanOS/AI content stream inside Real Talk pillar (2 posts/week)
- LoanOS evergreen pool structure and location
- Two-lane input model (pool always-on + CHANGELOG hook reader)
- Visual format rules for LoanOS stream (Phase 1, pre-demo-env)
- File changes across social-media agent subagents
- Cross-agent dependencies (lead-gen, seo-sem/content-weekly, gbp-optimization)
- GBP webhook theme branching for LoanOS content
- Compliance rules specific to LoanOS stream
- Migration plan (clean break at Post 57)
- First-run gate for launching the LoanOS stream
- Success metrics

### Out of Scope
- Posts 50-56 rewrite (leave as-is; Adam may delete individually from dashboard)
- Weeks 1-3 rebuild (formally killed)
- Video production workflow (separate sub-project, deferred)
- LoanOS demo environment (separate sub-project #1)
- Populating the full 20-30 entry pool (happens during implementation — this spec defines structure only)
- Building the LO waitlist capture page (dependency, routed to lead-gen agent)
- Building the `/loanos` landing page on styermortgage.com (dependency, routed to seo-sem / content-weekly)

## 3. Audience CTAs (Locked)

| Audience | Priority | Primary CTA |
|---|---|---|
| Loan Officers | 1 | DM Adam about LoanOS → waitlist capture |
| Realtors | 2 | No explicit CTA — positioning only (send deals because Adam is the most advanced LO they know) |
| Borrowers | 3 | No explicit CTA — trust signal only |
| AI Builder community | 4 | No CTA — personal brand signal, LinkedIn-only |

Every LoanOS pool entry gets exactly one primary audience tag. CTA is fixed at the pool-entry level, not guessed at post-writing time. This prevents CTA drift (every post defaulting to "DM me," which exhausts the LO audience).

## 4. The New Four-Pillar Framework

| # | Pillar | Target % | What it is | What it is NOT |
|---|---|---|---|---|
| 1 | **Real Talk** | 30% | Hot takes, industry BS, correspondent-vs-broker, "stop comparing to 2021," self-deprecating mistakes, AI/LoanOS build-in-public | Safe opinions, rate summaries, generic commentary |
| 2 | **Personal / Story** | 30% | Family, faith, stolen car-type stories, investing war stories (foundation flips, wrap mortgages, triple-net), highlight reel trap, coaching-call breakdowns | Mortgage pitches with a personal wrapper. If there's a CTA, it's not this pillar. |
| 3 | **Education (In Adam's Voice)** | 30% | The 3 Cs, correspondent lender advantage, DSCR, bank statement loans, VA Jumbo nuances, credit coaching — told through stories or hot takes | Definition cards, "Did You Know?" graphics, listicles — anything that fails the Jessica Test |
| 4 | **Promo** | 10% | Rate updates (NMLS + APR disclosures), DM CTAs, waitlist pushes, referral asks, application link | The default. Minority, not backbone. |

**Enforcement:** Rolling 4-week window. Over any 4-week span, mix must hit 30/30/30/10 ± 5% per pillar. Single weeks can drift. The Reviewer subagent checks rolling mix at the end of each session. If drift exceeds 5% on any pillar, the week's plan fails review and the Architect rebalances.

**Why rolling windows:** The old single-week balancing forced generic Education content when nothing interesting was happening that week. Rolling windows let individual weeks be interesting while long-term balance holds.

## 5. LoanOS/AI Content Stream

### 5.1 Placement
Content stream inside Real Talk pillar. Not a pillar. Approximately 40% of Real Talk output, ~12% of total feed.

### 5.2 Cadence
2 LoanOS posts per week, consistent.

### 5.3 Core Positioning (Closing Beat of the Arc)
> "I made this a weapon for myself, and now I'm giving other people the weapon I created."

Every post in the stream should be readable as one step toward this sentence. If a post doesn't fit the arc, it's not a LoanOS post.

### 5.4 Narrative Arc (Phase 1 Pool Structure)

| Phase | Focus | Target entries |
|---|---|---|
| **1A — Foundation** | What LoanOS is. Dashboard. Loans module. Contact Records. Why each exists. Why Adam built it himself instead of buying software. | 6-8 |
| **1B — In Motion** | Loan scenarios running through the system. Day-in-the-life framing. How a refi moves application → CTC inside LoanOS. | 5-7 |
| **1C — Automations** | The n8n workflows. The agents. "I fired Jessica and hired Claude." Specific manual tasks the system replaced. Arive → Supabase sync story. | 6-8 |
| **1D — Transfer of Value** | The weapon handoff. "Here's what this could do for your pipeline." LO-targeted posts with DM/waitlist CTAs. | 4-6 |

**Total Phase 1 pool target:** 20-30 entries (~3-4 months of stream content at 2/week).

## 6. The LoanOS Pool File

**Location:** `tasks/social-media/loanos-pool.md`

**Rationale for location:** Lives inside the social-media agent's working directory. The Architect subagent reads it as part of its Step 1 context load, same pattern as `domain-queue.md` and `session-log.md`. No new plumbing.

### 6.1 Pool Entry Structure

Every entry has these exact fields:

```markdown
## Entry [ID] — [Short title]

Arc Phase: [1A Foundation | 1B In Motion | 1C Automations | 1D Transfer of Value]
Audience Tag: [LO | Realtor | Borrower | Builder]
Primary Platform: [LinkedIn | Instagram | Facebook]
Cross-post: [list of secondary platforms]
Visual Format: [selfie_carousel | whiteboard_photo | hand_drawn_diagram | screenshot_deferred]
CTA: [none | DM_loanos | waitlist | application_link]

### The Hook
[One sentence. The opening beat. What stops the scroll.]

### The Vulnerability Angle
[What's the self-deprecating / honest / "I got this wrong" part? If there isn't one, this entry fails the voice check.]

### The Authority Angle
[What makes Adam look like he knows what he's doing? Specific technical detail, a number, or a comparison to how other LOs do it.]

### The Beats
1. [Beat 1 — usually the hook expanded]
2. [Beat 2 — the vulnerability / honesty moment]
3. [Beat 3 — the turn, what was learned or built]
4. [Beat 4 — the authority / "and here's why this matters"]
5. [Beat 5 — the close. Often no CTA, just a landing line.]

### Visual Notes
[What the selfie/diagram/photo needs to contain. If screenshot_deferred, note what screen is needed once demo env is ready.]

### Status
[ready | drafted | scheduled | published | killed]
```

### 6.2 Pool Lifecycle

1. Entry created (first draft in implementation plan, Adam corrects and extends)
2. Architect picks 2 entries per week from `status: ready` entries, respecting arc-phase ordering (don't run two 1A entries back-to-back if 1B is also ready)
3. Builder writes the post using the entry as a strict template — beats become slides, hook becomes caption lead
4. Post gets written to `social_drafts` table with `pool_entry_id` referencing the entry
5. Adam edits and publishes from LoanOS Marketing → Social dashboard
6. On publish, agent flips entry to `status: published` to prevent repeats
7. Adam can manually flip any entry to `status: killed`

## 7. Two-Lane Input Model

### Lane 1 — Evergreen Pool (default, always running)
- Architect reads `loanos-pool.md`
- Picks next 2 entries by arc phase order, respecting balance
- This lane alone sustains the stream indefinitely once the pool is populated

### Lane 2 — CHANGELOG Hook Reader (opportunistic)
- Architect reads `/Users/adamstyer/Documents/loanos-clone/CHANGELOG.md` for entries dated within the last 7 days
- For any shipped feature matching a keyword list (`automation`, `workflow`, `dashboard`, `sync`, `AI`, `agent`, `n8n`, `supabase`, `pipeline`, `CRM`), Architect generates a **proposed new pool entry** — not a post directly
- Proposed entry is written to `tasks/social-media/loanos-pool-proposed.md` for Adam's review
- Adam promotes proposed entries to `loanos-pool.md` manually
- If Lane 2 is silent any given week, Lane 1 keeps going

### 7.1 Critical Constraint — Data Integrity Gate

**The Architect NEVER writes a LoanOS post without a pool entry.** No entry, no post. This is how the "NEVER FABRICATE DATA" rule applies to this stream. The Reviewer subagent enforces: every post with `stream: loanos` must reference a pool entry ID, and the pool entry must exist and be in `status: ready` at write time.

## 8. Visual Format Rules (Phase 1)

Hard rule: every LoanOS post has a photo or video. Text-only is killed for this stream.

| Format | % of stream | When to use | Production |
|---|---|---|---|
| `selfie_carousel` | ~65% | Default. Story-driven posts. Matches the proven format from Example B (AI carousel). | Adam shoots 1-2 selfies once, reuses across dozens of posts. Canva-style text slides generated by Builder. |
| `whiteboard_photo` | ~20% | Architecture, workflow logic, "here's how the automation fires" posts | Adam snaps a photo of a real whiteboard or notebook sketch. Fresh per post. |
| `hand_drawn_diagram` | ~10% | Conceptual posts — "here's the mental model" | iPad sketch, napkin photo, whatever. Raw is the point. |
| `screenshot_deferred` | ~5% | Posts that ONLY work with a real screen | Entry stays in pool with `status: ready` but Architect skips it until sub-project #1 (demo env) ships. |

### 8.1 Selfie Inventory (Adam deliverable)

Adam shoots 2-3 selfies for the pool:
1. Neutral desk shot (Adam at computer, laptop visible but screen unreadable)
2. Thinking/looking-away shot (good for vulnerability-angle posts)
3. Optional: outdoor/coffee shop shot (good for Personal/Story crossover posts)

**Storage location:** `tasks/social-media/assets/selfies/` (new directory). Builder references by filename in draft posts. Adam drops the image into the post at publish time from the dashboard.

### 8.2 Whiteboard Posts
No inventory — the whiteboard content IS the post. Builder provides the exact drawing prompt in the post draft (e.g., "whiteboard shows: Arive → n8n → Supabase flow with arrows"). Adam draws, snaps, uploads at publish.

### 8.3 Graduation Trigger (Screenshot Unlock)
When sub-project #1 (demo environment) lands and `loanos-clone/CONTEXT.md` contains the line `Demo environment: READY`, Architect unlocks `screenshot_deferred` entries and begins using them in rotation. Until then, those entries sleep in the pool.

## 9. System Changes — Files Modified

### 9.1 Social Media Agent Files

| File | Change |
|---|---|
| `tasks/social-media/adam-voice-and-workflow.md` | Promote from DRAFT to ACTIVE. Add LoanOS stream section referencing pool + narrative arc. |
| `tasks/social-media/specs/2026-03-26-content-pillars-draft.md` | Mark SUPERSEDED. Add pointer to this spec. Do not delete — historical record. |
| `tasks/social-media/loanos-pool.md` | **NEW.** The 20-30 entry pool, Phases 1A-1D. |
| `tasks/social-media/loanos-pool-proposed.md` | **NEW.** Lane 2 landing zone for CHANGELOG-sourced proposals. Empty at start. |
| `tasks/social-media/assets/selfies/` | **NEW directory.** Holds Adam's selfie inventory. |
| `tasks/social-media/subagents/02-architect.md` | Replace 5-pillar planning logic with 4-pillar + rolling 4-week mix + LoanOS two-lane reader. Add arc-phase ordering for pool entry selection. |
| `tasks/social-media/subagents/03-builder.md` | Add pool-entry-driven template. When writing a post with `stream: loanos`, Builder uses pool entry fields as strict template. |
| `tasks/social-media/subagents/03b-quality.md` | Add Jessica Test as explicit score input. Add Visual Format check (no text-only for LoanOS stream). |
| `tasks/social-media/subagents/04-reviewer.md` | Add pool-entry-reference check. Add rolling 4-week mix check. Add audience-CTA alignment check. Add LoanOS-stream compliance rules. |
| `tasks/social-media/subagents/00-notebooklm.md` | Include LoanOS pool state in push/pull. |
| `tasks/social-media/domain-queue.md` | Add "LoanOS stream — Phase 1 pool population and initial run" as next focus after Week 8 wraps. |

### 9.2 Cross-Agent Dependencies

| Agent | Change | Rationale |
|---|---|---|
| `loanos-enterprise-am` | No code changes. Relies on existing end-of-session rule (update CHANGELOG.md). Document this dependency in the spec. | CHANGELOG feeds Lane 2. |
| `lead-gen-am/pm` | Add to `tasks/lead-gen/domain-queue.md`: Build LO waitlist capture page + Mailchimp list + n8n intake workflow. | "DM me about LoanOS" needs a destination when volume grows. |
| `seo-sem-am/pm` + `styer-content-weekly` | Add to their backlogs: Create `/loanos` or `/ai` long-form page on styermortgage.com. "What LoanOS is and why I built it." | CTA link target. |
| `gbp-optimization` (Sundays) | Update the `gbp-optimization` scheduled task prompt (exact location identified during implementation — not a full agent directory, runs as a single scheduled task). When selecting weekly GBP content, include recent high-performing LoanOS stream posts alongside rate/market content. | Local search exposure for positioning. |
| `loanos-crm-am/pm` | No changes. | Not content-related. |
| `styer-site-daily` | No changes beyond the backlog addition above. | Daily conversion optimization doesn't need stream awareness. |

## 10. Distribution Pipeline Changes

GBP webhook: `https://styer.app.n8n.cloud/webhook/gbp-social-post`

**One change:** Add new valid `theme` value: `loanos-build`. social-media-am fires this theme for LoanOS stream posts. Inside the n8n workflow, the theme branches the Gemini prompt so it adapts for the LoanOS voice (builder/operator tone) rather than the mortgage voice.

**Implementation note:** Modify the existing webhook workflow — do NOT create a new webhook. Add a theme switch that branches prompt templates. The exact n8n workflow that handles `/gbp-social-post` is not in the MEMORY workflow table under that name — identify the owning workflow during implementation by querying n8n MCP directly (likely lives inside `Weekly GBP + Social Post` or a dedicated webhook workflow not yet catalogued).

**Image handling:** For LoanOS posts, Imagen does NOT regenerate images. Adam's selfie / whiteboard photo IS the image. Publer schedule uses the image field from the post draft directly.

**Step 1B website scanner:** No changes. LoanOS content does not live in a website directory. LoanOS posts flow through `social_drafts` → dashboard → publish, not through the website scanner path.

## 11. Compliance Rules for LoanOS Stream

Reviewer subagent enforces on any post with `stream: loanos`:

| Rule | Reason |
|---|---|
| NMLS# 513013 required if post mentions rates, loan products, pricing, or qualification | Standard compliance. |
| NMLS# NOT required for pure build-in-public content (architecture, automations, "why I built this") with no rate/loan/qualification mention | Avoids boilerplate on non-mortgage posts. |
| No borrower names, real addresses, or real loan amounts — ever | Privacy + compliance. Reviewer kills any post containing a name paired with a dollar amount. |
| No "I can get you approved" / "guaranteed" language, even when talking about LoanOS features | RESPA/Reg Z — outcome-guarantee implications are blocked. |
| LO-audience posts cannot promise licensing timelines or product availability | Adam doesn't know when/if LoanOS opens to other LOs. Posts can say "DM me" and "building a waitlist" but not "launching Q3." |
| Pool entry reference required | `pool_entry_id` field on every LoanOS `social_drafts` row. Reviewer confirms referenced entry exists and is `status: ready`. Missing → kill. |

## 12. Migration Plan (Clean Break at Post 57)

1. **Posts 50-56 (Week 8, April 27 – May 6):** Unchanged. Already reviewed and scheduled. Adam may delete individually from dashboard.
2. **Weeks 1-3 rebuild:** Formally killed. Remove the "Adam decision pending" open item from the old pillar draft. No retroactive rebuilds.
3. **Post 57 onward:** First post under the new 4-pillar framework. Architect uses this spec as source of truth. Old draft is SUPERSEDED and ignored.
4. **LoanOS stream first post:** First week of the new framework. Pool must be populated to at least 6 Phase 1A entries before launch.

## 13. First-Run Gate

Before the Architect runs the new framework for the first time, all three must be true:

1. `loanos-pool.md` contains **≥6 ready entries in Phase 1A**
2. Adam's 2-3 selfies uploaded to `tasks/social-media/assets/selfies/`
3. `/loanos` or `/ai` landing page exists on styermortgage.com (can be minimum viable — even a single page with email capture)

If any are missing, the Architect runs the new pillar framework **without** the LoanOS stream that week, logs a BLOCKER in `tasks/social-media/BLOCKERS.md`, and proceeds. The rest of the pillar framework runs normally. Only the LoanOS stream waits.

## 14. Success Metrics

Tracked weekly in session log, rolled up monthly.

| Metric | Target (first 90 days) | Why |
|---|---|---|
| Rolling 4-week pillar mix | 30/30/30/10 ± 5% | Proves the framework is holding |
| LoanOS stream post count | ~8 posts/month | Proves cadence is real |
| LO-audience DMs / waitlist signups | 5-10 | Proves positioning is landing on primary audience |
| LoanOS post engagement vs. account average | At or above baseline | Stream not dragging the feed |
| Posts killed at Reviewer for Jessica Test failures | Trending down week over week | Architect internalizing voice |

**Explicit non-metrics:** Follower count, impressions, reach. Vanity metrics that don't map to the four audience goals. Not optimizing for them.

## 15. Open Items (Adam Actions Required)

These are prerequisites for first-run. Written here as a clear checklist so they don't get lost.

- [ ] Shoot 2-3 selfies (neutral desk, thinking/looking-away, optional outdoor) and upload to `tasks/social-media/assets/selfies/`
- [ ] Review the Phase 1A pool entries when drafted during implementation (correct voice, kill bad ones, add missing beats)
- [ ] Approve the `/loanos` or `/ai` landing page copy when seo-sem / content-weekly drafts it
- [ ] Approve the LO waitlist capture form copy when lead-gen drafts it
- [ ] Decide: does the `/loanos` page use the existing styermortgage.com template or get a custom layout?

## 16. What Happens After This Spec Is Approved

This spec defines the framework. It does not populate the pool, modify subagent files, or build dependencies. That's the implementation plan, which comes next via the `writing-plans` skill.

The implementation plan will break into:
- Phase 0: Spec commit and cross-agent dependency briefs
- Phase 1: Pool population (first pass — 6-8 Phase 1A entries draft for Adam review)
- Phase 2: Subagent file modifications (02-architect, 03-builder, 03b-quality, 04-reviewer, 00-notebooklm)
- Phase 3: Dependency coordination (lead-gen waitlist, /loanos landing page, GBP theme branch)
- Phase 4: First-run gate check and launch
- Phase 5: Week 1 post-launch review and adjustment

---

**End of spec.**
