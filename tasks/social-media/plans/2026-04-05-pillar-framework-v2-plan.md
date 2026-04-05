# Pillar Framework v2 + LoanOS Stream — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the social-media agent's content pillar framework around the voice guide tone dial (30/30/30/10) and launch a LoanOS/AI content stream (2 posts/week) inside Real Talk, with a populated evergreen pool, modified subagents, cross-agent dependencies in place, and a first-run gate cleared.

**Architecture:** Four-pillar content framework enforced on a rolling 4-week window, replacing single-week mix balancing. LoanOS content rides as a named stream inside Real Talk, driven by an evergreen pool (`loanos-pool.md`) plus an opportunistic CHANGELOG.md hook reader that proposes new entries for Adam to promote. Every LoanOS post references a pool entry ID — no pool entry, no post (data-integrity gate). Visual-format rules default to selfie carousels with graduation to live screenshots when the LoanOS demo environment lands (sub-project #1). System changes are markdown-only (prompt edits + new content files). Cross-agent dependencies (LO waitlist, `/loanos` landing page, GBP webhook theme branch) are delegated to the agents that own those domains.

**Tech Stack:** Markdown prompt files, Supabase (`social_drafts` table — existing schema), n8n (`gbp-social-post` webhook — existing), styermortgage.com (HTML — existing), Mailchimp (existing), Publer (existing). No new infrastructure.

**Source spec:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` — read this before starting any task.

---

## Parallelization Map

Tasks are organized into three lanes that can run concurrently. Within a lane, tasks are ordered. Across lanes, only the merge point (Phase 4) blocks on all three.

| Lane | Owner Suggestion | Tasks |
|---|---|---|
| **Lane A — Content** (pool draft + Adam review cycle) | Main Claude + Adam review | Tasks 1, 2, 3 |
| **Lane B — System** (subagent prompt modifications) | Subagent delegation (fresh subagent per file) | Tasks 4, 5, 6, 7, 8, 9 |
| **Lane C — Dependencies** (waitlist, /loanos page, n8n, gbp-optimization) | Codex for n8n webhook; subagent delegates for others | Tasks 10, 11, 12, 13 |
| **Phase 4 — Merge** (first-run gate) | Main Claude | Tasks 14, 15 |

**Worker tags used below:**
- `[main]` — main Claude instance
- `[subagent]` — dispatch a fresh subagent via Task tool
- `[codex]` — delegate to Codex via the `codex:codex-rescue` agent (good for independent tasks with clear acceptance criteria)
- `[adam]` — Adam-action required, cannot be delegated

---

## Phase 0 — Setup

### Task 1: Supersede the old pillar draft and update domain-queue

**Worker:** `[main]`
**Files:**
- Modify: `tasks/social-media/specs/2026-03-26-content-pillars-draft.md` (header only)
- Modify: `tasks/social-media/domain-queue.md` (add next focus)

- [ ] **Step 1: Add SUPERSEDED header to the old pillar draft**

Edit the top of `tasks/social-media/specs/2026-03-26-content-pillars-draft.md`. Change the existing `Status:` line to:

```markdown
Status: SUPERSEDED by `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` on 2026-04-05
```

Do NOT delete any other content in the file. It stays as historical record.

- [ ] **Step 2: Read the current domain-queue**

Read `tasks/social-media/domain-queue.md` to understand the current format.

- [ ] **Step 3: Append the new focus entry**

Append to `tasks/social-media/domain-queue.md`:

```markdown
## 2026-04-05 — LoanOS Stream Launch (Phase 1A)

Focus: Launch the new 4-pillar framework (30/30/30/10) and the LoanOS content stream inside Real Talk.
Spec: `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md`
Plan: `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md`
Applies to: Post 57 onward (clean break — Posts 50-56 unchanged)
First-run gate: 6 Phase 1A pool entries ready + selfies uploaded + /loanos landing page live
```

- [ ] **Step 4: Verify both files saved**

Run:
```bash
head -5 /Users/adamstyer/Documents/loanos-clone/tasks/social-media/specs/2026-03-26-content-pillars-draft.md
tail -10 /Users/adamstyer/Documents/loanos-clone/tasks/social-media/domain-queue.md
```
Expected: superseded header visible on old draft; new focus entry visible at bottom of domain-queue.

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/specs/2026-03-26-content-pillars-draft.md tasks/social-media/domain-queue.md
git commit -m "Mark pillar draft superseded; queue LoanOS stream launch focus"
```

---

## Phase 1 — Content (Lane A)

### Task 2: Create the LoanOS pool file with 6 Phase 1A entries (draft)

**Worker:** `[main]` (I have the full context from the brainstorming session; drafting directly is more accurate than delegating to a subagent with a handoff brief)
**Files:**
- Create: `tasks/social-media/loanos-pool.md`
- Create: `tasks/social-media/loanos-pool-proposed.md` (empty, placeholder for Lane 2)

- [ ] **Step 1: Create empty pool-proposed file**

Create `tasks/social-media/loanos-pool-proposed.md` with:

```markdown
# LoanOS Pool — Proposed Entries (Lane 2 Landing Zone)

This file holds pool entries proposed by the Architect subagent's CHANGELOG hook reader (Lane 2).
Adam reviews entries here, corrects voice, and manually promotes approved ones into `loanos-pool.md`.

Format for each proposed entry matches the schema in `loanos-pool.md`.

---

_No proposed entries yet._
```

- [ ] **Step 2: Create loanos-pool.md with header and schema reference**

Create `tasks/social-media/loanos-pool.md` with:

```markdown
# LoanOS Content Pool

**Purpose:** Evergreen story pool for the LoanOS/AI content stream (2 posts/week inside Real Talk pillar).
**Spec:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` (see Section 5 for arc, Section 6 for schema, Section 11 for compliance)
**Architect rule:** NEVER write a LoanOS post without a pool entry. Pick 2/week from `status: ready` entries respecting arc-phase ordering.

## Arc Phases
- **1A — Foundation:** What LoanOS is (dashboard, loans, contacts, why Adam built it himself)
- **1B — In Motion:** Loan scenarios running through the system (day-in-the-life)
- **1C — Automations:** n8n workflows, agents, manual tasks replaced
- **1D — Transfer of Value:** The weapon handoff — LO-targeted CTAs

## Closing Positioning (the sentence every entry leads toward)
> "I made this a weapon for myself, and now I'm giving other people the weapon I created."

---

## Phase 1A — Foundation Entries

(Entries below — Adam to review, correct voice, kill any that don't land.)

```

- [ ] **Step 3: Draft Entry 1A-01 — "Why I Built My Own CRM"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-01 — Why I Built My Own CRM

Arc Phase: 1A Foundation
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: none

### The Hook
Every CRM I tried was built for someone else. So I built my own. Over a weekend. With AI.

### The Vulnerability Angle
I spent years paying for CRMs that didn't fit how I actually work. Jungo. Salesforce. Each one required me to change my process to fit the tool. I kept telling myself the next one would be the right one. It never was.

### The Authority Angle
I've closed 1,000+ loans in my career. I know exactly how a file should flow from lead to CTC. None of the tools on the market understood that flow. So I built something that does. LoanOS handles my pipeline, my contacts, my automations, and my communications — in my language, on my terms.

### The Beats
1. Every CRM I tried made me fit the tool. Not the other way around.
2. I spent years thinking the next one would finally click.
3. Over a weekend, I sat down and started building my own.
4. 1,000+ closed loans told me exactly what the software needed to do. The software needed to listen.
5. I call it LoanOS. It's not a product yet. It's a weapon I built for myself.

### Visual Notes
Slide 1: selfie_neutral.jpg with text overlay "I built my own CRM." Slides 2-5: plain text slides with each beat on a dark background, one beat per slide. Slide 6: closing line alone, "I built a weapon for myself."

### Status
ready
```

- [ ] **Step 4: Draft Entry 1A-02 — "The Dashboard That Actually Works"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-02 — The Dashboard That Actually Works

Arc Phase: 1A Foundation
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Instagram
Visual Format: whiteboard_photo
CTA: none

### The Hook
Most LO dashboards are graveyards. Mine isn't.

### The Vulnerability Angle
I used to open my CRM dashboard every morning and immediately close it. Too many numbers. Too many tabs. Nothing that told me what mattered today. I'd end up running my day from my email inbox and a spiral notebook like it was 2008.

### The Authority Angle
LoanOS has one dashboard. It shows me three things: loans in motion, leads that need me, and what automations ran overnight. That's it. Everything else is one click away. The discipline of showing less made me faster, not slower.

### The Beats
1. Most LO dashboards are graveyards. Mine was one for years.
2. The problem wasn't the data — it was having too much data and no hierarchy.
3. I redesigned mine around one question: "What has to happen today?"
4. Three things: live loans, hot leads, overnight automations. Nothing else on the main screen.
5. I was running my business from a spiral notebook before. Now I run it from one screen.

### Visual Notes
Whiteboard photo: hand-drawn sketch of a dashboard showing three boxes labeled "Live Loans", "Hot Leads", "Overnight Automations" with arrows pointing to a single "Today's Actions" box. Keep it raw. Adam draws this on a real whiteboard or notebook, snaps a photo.

### Status
ready
```

- [ ] **Step 5: Draft Entry 1A-03 — "Contact Records That Think"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-03 — Contact Records That Think

Arc Phase: 1A Foundation
Audience Tag: Realtor
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: none

### The Hook
My contact records know more about my borrowers than my borrowers do.

### The Vulnerability Angle
I used to lose deals because I forgot things. A birthday. A referral partner's kid's name. A previous preapproval that expired. The human brain isn't built for the volume of context a mortgage relationship requires, and pretending otherwise made me look careless with people I actually cared about.

### The Authority Angle
In LoanOS, every contact record is a living file. Every call, every email, every text, every application, every referral source — all linked, searchable, summarized by AI before I pick up the phone. When I call a realtor, I know what we talked about last time. When a past client texts me in 2028, I remember everything from 2026.

### The Beats
1. I used to lose deals because I forgot things.
2. Not the deal terms — the human stuff. Kids' names. Last conversation. Why they trust me.
3. Human memory isn't built for this. Pretending otherwise made me look careless.
4. In LoanOS, every contact record is a living file. AI summarizes the relationship before every call.
5. I don't forget anymore. And people notice.

### Visual Notes
Slide 1: selfie_thinking.jpg with overlay "My contact records know more than I do." Slides 2-5: plain text beats. Slide 6: "I don't forget anymore. And people notice."

### Status
ready
```

- [ ] **Step 6: Draft Entry 1A-04 — "Why I Didn't Buy Software"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-04 — Why I Didn't Buy Software

Arc Phase: 1A Foundation
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: (none — LinkedIn only, B2B audience)
Visual Format: selfie_carousel
CTA: none

### The Hook
Every LO software vendor tells you the same lie: "we built this for people like you."

### The Vulnerability Angle
I bought into that lie for years. Three different CRMs. A marketing automation tool. A pipeline tracker. A separate app for client communications. Each one was "built for loan officers." None of them talked to each other. I was paying four vendors to duplicate data and then doing the integration myself in my head.

### The Authority Angle
The dirty secret of LO software is that it's built for LO *managers*, not LO practitioners. Managers care about reporting dashboards for upper management. Practitioners care about closing deals without drowning. Those are different products. I stopped paying vendors and built my own — one system, one source of truth, designed by someone who still originates.

### The Beats
1. Every LO software vendor tells you the same lie.
2. I believed it for years. Bought four different tools. None of them talked to each other.
3. Here's the dirty secret: LO software is built for managers, not practitioners.
4. Managers want reports. Practitioners want to close deals without drowning.
5. I stopped paying vendors and built my own.

### Visual Notes
Slide 1: selfie_neutral.jpg with overlay "LO software is built for managers, not practitioners." Slides 2-5: beats. Slide 6: "I built mine for me. The practitioner. The one closing deals."

### Status
ready
```

- [ ] **Step 7: Draft Entry 1A-05 — "Jessica → Janie → Claude"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-05 — Jessica → Janie → Claude

Arc Phase: 1A Foundation
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: none

### The Hook
I replaced my admin with AI. And then I had to replace the AI with my instincts again.

### The Vulnerability Angle
I had an admin named Jessica. Good person, posted generic LO content, couldn't scale with me. I let her go in January 2025 thinking AI would do her job better. It did — until it didn't. I caught myself running client messages through AI before sending them and realized I'd outsourced my own voice. Deals slowed. Clients went quiet. I was using the tool wrong.

### The Authority Angle
Janie is my processor now. Real human. Handles every file from disclosures to funding. AI handles the parts humans shouldn't have to — scheduling, templated emails, data entry, reminders, research. The split isn't "humans vs AI." It's "what belongs to a person vs what belongs to a system." I had to burn myself on getting that wrong before I figured it out.

### The Beats
1. I replaced my admin with AI. Then I had to replace the AI with my own instincts.
2. Jessica was my admin. Good person. Template-era content. Couldn't scale.
3. I let her go in January 2025 thinking AI would just do her job better.
4. It did — until I started outsourcing my voice too. Deals slowed. Clients went quiet.
5. Janie is my processor now. Real human. AI handles the parts humans shouldn't have to. The split isn't humans vs AI. It's what belongs to a person vs what belongs to a system.

### Visual Notes
Slide 1: selfie_thinking.jpg with overlay "I replaced my admin with AI. Then I had to replace the AI with my own instincts." Slides 2-5: beats. Slide 6: "It's not humans vs AI. It's what belongs to a person vs what belongs to a system."

### Status
ready
```

- [ ] **Step 8: Draft Entry 1A-06 — "The Loans Module"**

Append to `loanos-pool.md`:

```markdown
## Entry 1A-06 — The Loans Module

Arc Phase: 1A Foundation
Audience Tag: Realtor
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: whiteboard_photo
CTA: none

### The Hook
Every loan has a status, a timeline, and 47 things that can go wrong. My software shows me all of them at once.

### The Vulnerability Angle
I've missed things before. A document that didn't get requested. An appraisal deadline I forgot. A rate lock that was about to expire. Every time it happened I told myself I'd build a better system. For years I just told myself that and kept missing things.

### The Authority Angle
LoanOS has a Loans module that treats every file like a living organism. Status. Milestone. What's due from whom. What's blocking. What just got cleared. I can look at any file and know exactly where it is, what it needs, and who's sitting on it. When I call a realtor with an update, I don't say "let me check" — I already know.

### The Beats
1. Every loan has a status, a timeline, and 47 things that can go wrong.
2. I used to miss things. Not because I didn't care — because I was carrying too much in my head.
3. I built a Loans module that treats every file like a living organism.
4. Status, milestone, who's blocking, what just cleared.
5. When a realtor calls me for an update, I don't say "let me check." I already know.

### Visual Notes
Whiteboard photo: hand-drawn flow of a loan file from "Lead" → "PA Issued" → "Under Contract" → "Disclosures" → "Conditional Approval" → "Clear to Close" → "Funded", with little notes under each stage showing "what can go wrong here". Raw, messy, real.

### Status
ready
```

- [ ] **Step 9: Verify pool file renders and has 6 entries**

Run:
```bash
grep -c "^## Entry 1A-" /Users/adamstyer/Documents/loanos-clone/tasks/social-media/loanos-pool.md
```
Expected: `6`

- [ ] **Step 10: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/loanos-pool.md tasks/social-media/loanos-pool-proposed.md
git commit -m "Add LoanOS content pool with 6 Phase 1A draft entries"
```

---

### Task 3: Adam reviews Phase 1A pool entries and corrects voice

**Worker:** `[adam]` — cannot be delegated. This is the only task in Lane A that blocks further Lane A work.
**Files:**
- Modify: `tasks/social-media/loanos-pool.md` (corrections in place)

- [ ] **Step 1: Adam reads all 6 entries in `loanos-pool.md`**

Read each entry's hook, vulnerability angle, authority angle, and beats. Ask: "Would I actually say this out loud at a backyard BBQ in Austin?" (the Jessica Test from the voice guide).

- [ ] **Step 2: Adam corrects voice on any entry that doesn't land**

For each entry, one of three actions:
- **Keep** — leave the entry as-is
- **Edit** — rewrite beats in Adam's actual voice
- **Kill** — flip `Status: ready` to `Status: killed`. Do not delete the entry; killed entries stay as historical record of rejected drafts.

- [ ] **Step 3: Adam confirms minimum 6 entries still at `Status: ready`**

If Adam kills more than 0 entries, the first-run gate requires at least 6 ready entries, so the pool needs replacement drafts before Task 14 (first-run gate check). Adam messages Claude: "I killed N entries, draft N replacements" and Claude re-runs Task 2's drafting pattern for the replacements.

- [ ] **Step 4: Adam commits corrections**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/loanos-pool.md
git commit -m "Adam voice corrections on Phase 1A pool entries"
```

---

## Phase 2 — Subagent Modifications (Lane B)

Each task in this lane modifies one subagent prompt file. These are independent edits — any order works, and all can run in parallel via subagent delegation.

### Task 4: Update 02-architect.md — new pillar framework + LoanOS two-lane reader

**Worker:** `[subagent]` — dispatch a fresh subagent with this task + the spec + the current `02-architect.md` as context
**Files:**
- Modify: `tasks/social-media/subagents/02-architect.md`

- [ ] **Step 1: Read the current `02-architect.md` end to end**

- [ ] **Step 2: Identify the section that defines the 5-pillar planning logic**

Find the section where the Architect decides which pillar each post falls under and the mix-enforcement logic (probably titled "Content Planning" or "Pillar Selection" or similar).

- [ ] **Step 3: Replace the pillar list with the new 4-pillar framework**

New pillar list (verbatim from spec Section 4):

```markdown
## The Four-Pillar Framework (v2 — effective Post 57)

1. **Real Talk (30%)** — hot takes, industry BS, correspondent-vs-broker advantage, "stop comparing to 2021," self-deprecating mistakes, AI/LoanOS build-in-public content
2. **Personal / Story (30%)** — family, faith, stolen-car stories, investing war stories, highlight reel trap, coaching breakdowns. No CTAs. If there's a CTA, it's not this pillar.
3. **Education (In Adam's Voice) (30%)** — the 3 Cs, correspondent lender advantage, DSCR, bank statement loans, VA Jumbo, credit coaching — through stories or hot takes, never as definition cards. The Jessica Test applies.
4. **Promo (10%)** — rate updates (NMLS + APR required), DM CTAs, waitlist pushes, referral asks, application link. This is the minority of output, not the backbone.
```

- [ ] **Step 4: Replace single-week mix balancing with rolling 4-week window rule**

Add this section right after the pillar list:

```markdown
## Rolling 4-Week Mix Enforcement

The Architect plans on a rolling 4-week window, not per-week.

- Over any 4-week span, pillar mix must hit 30/30/30/10 ± 5% per pillar.
- Single weeks can drift. Three Real Talk posts in one week is fine if the rolling average holds.
- At the end of each planning session, calculate the rolling 4-week mix from the last 4 weeks of posts in `social_drafts` (published + scheduled + drafted).
- If drift on any pillar exceeds 5%, this week's plan is rejected. Replan with corrections.
- The Reviewer subagent (`04-reviewer.md`) performs the same check as a gate before posts leave the Architect.

**Why this replaces per-week balancing:** The old rule forced the Architect to cover all pillars every week, which produced generic Education content when nothing interesting was happening. Rolling windows let individual weeks be interesting while long-term balance holds.
```

- [ ] **Step 5: Add the LoanOS two-lane reader section**

Add this section after the pillar framework:

```markdown
## LoanOS Content Stream (inside Real Talk pillar)

**Cadence:** 2 LoanOS posts per week. Roughly 40% of Real Talk output, 12% of total feed.

**Positioning hook:** "I made this a weapon for myself, and now I'm giving other people the weapon I created." Every LoanOS post should be readable as one step toward that sentence.

### Lane 1 — Evergreen Pool Reader (default, always running)

1. Read `tasks/social-media/loanos-pool.md`
2. Select the next 2 entries with `Status: ready`, respecting arc-phase ordering:
   - Do not run two entries from the same arc phase back-to-back if another phase has `ready` entries
   - Prefer moving through phases in order (1A → 1B → 1C → 1D) across the quarter
3. For each selected entry, hand the entry (all fields) to the Builder subagent as a strict template.
4. After Builder writes a draft, Architect tags the draft with `pool_entry_id: <entry-id>` in the `social_drafts` row.

### Lane 2 — CHANGELOG Hook Reader (opportunistic)

1. Read `/Users/adamstyer/Documents/loanos-clone/CHANGELOG.md` for entries dated within the last 7 days.
2. For any entry matching keywords (`automation`, `workflow`, `dashboard`, `sync`, `AI`, `agent`, `n8n`, `supabase`, `pipeline`, `CRM`), generate a proposed new pool entry matching the schema in `loanos-pool.md`.
3. Append the proposed entry to `tasks/social-media/loanos-pool-proposed.md` — NOT to `loanos-pool.md`.
4. Adam reviews `loanos-pool-proposed.md` manually and promotes approved entries.
5. Lane 2 never writes posts directly. It only proposes pool entries.

### Critical Data Integrity Rule

The Architect NEVER writes a LoanOS post without a pool entry. No pool entry → no post. If Lane 1 has no ready entries this week, the Architect logs a BLOCKER in `tasks/social-media/BLOCKERS.md` stating "LoanOS pool exhausted — needs replenishment" and runs the rest of the pillar framework without the LoanOS stream that week.
```

- [ ] **Step 6: Verify the file still parses cleanly**

Read the updated file end-to-end. Confirm no broken sections, no half-deleted paragraphs, and the new sections integrate cleanly with the existing structure.

- [ ] **Step 7: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/subagents/02-architect.md
git commit -m "Architect: 4-pillar framework + rolling 4-week mix + LoanOS two-lane reader"
```

---

### Task 5: Update 03-builder.md — pool-entry-driven template

**Worker:** `[subagent]`
**Files:**
- Modify: `tasks/social-media/subagents/03-builder.md`

- [ ] **Step 1: Read the current `03-builder.md` end to end**

- [ ] **Step 2: Find the section that describes how Builder writes a post**

Probably titled "Writing Posts" or "Post Composition" or similar.

- [ ] **Step 3: Add a dedicated LoanOS stream section**

Add this section after the general post-writing logic:

```markdown
## LoanOS Stream Posts (special handling)

When the Architect hands you a post with `stream: loanos`, you do NOT write freely. You assemble the post from the pool entry fields verbatim.

### Mapping pool entry to post

| Pool entry field | Post use |
|---|---|
| `The Hook` | Caption opening line (first sentence of post body) |
| `The Beats` (numbered list) | Carousel slide text, one beat per slide |
| `The Vulnerability Angle` + `The Authority Angle` | These inform the TONE of each beat's expansion, but are not written verbatim into the post — they're voice checks |
| `Visual Format` | Determines the image/media type — DO NOT override |
| `Visual Notes` | Literal instructions to the image slot — include verbatim in the draft so Adam knows what to upload at publish |
| `CTA` | If `none`, post ends with the last beat verbatim. No "DM me" appended. If `DM_loanos`, add CTA line verbatim: "DM me the word LOANOS and I'll show you what I built." |

### Hard rules for LoanOS stream

- No text-only posts. If `Visual Format` is missing, abort and log a BLOCKER.
- No added CTAs. Only the CTA specified in the pool entry.
- Include `pool_entry_id: <entry-id>` as a field on the `social_drafts` row.
- Every beat becomes one carousel slide. Do not compress beats into longer paragraphs.
- Keep the Hook as the caption lead. Do not rewrite it for "flow."
- If `Visual Format: screenshot_deferred` AND `loanos-clone/CONTEXT.md` does NOT contain the line `Demo environment: READY`, skip this entry and select the next available one. Do not write the post.
```

- [ ] **Step 4: Verify the file still parses cleanly**

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/subagents/03-builder.md
git commit -m "Builder: LoanOS stream pool-entry-driven template"
```

---

### Task 6: Update 03b-quality.md — Jessica Test + visual format check

**Worker:** `[subagent]`
**Files:**
- Modify: `tasks/social-media/subagents/03b-quality.md`

- [ ] **Step 1: Read the current `03b-quality.md`**

- [ ] **Step 2: Find the scoring rubric section**

- [ ] **Step 3: Add Jessica Test as an explicit scoring input**

Add to the scoring rubric:

```markdown
### Jessica Test (2 points of the total score)

Ask: "Could this post have been made by a template-using admin who doesn't know Adam personally?"

- **0 points:** Yes, it reads like a template. Kill the post or rewrite before scoring.
- **1 point:** Partial — has some Adam voice, but still has template-era elements (definition cards, "Did You Know?" framing, generic listicle structure).
- **2 points:** No — this is unmistakably Adam. Has his cadence, his specifics, his vulnerability, his hot takes.

A post below 2 points on this rubric cannot exceed a 6/10 total score. Adam's guide explicitly names template content as the thing he hates. Hold the line.
```

- [ ] **Step 4: Add Visual Format check for LoanOS stream**

Add this section:

```markdown
### LoanOS Stream Visual Format Check

For any post with `stream: loanos`:

1. Verify the `social_drafts` row has a `visual_format` field set to one of: `selfie_carousel`, `whiteboard_photo`, `hand_drawn_diagram`, `screenshot_deferred`.
2. If the value is `screenshot_deferred`, verify `/Users/adamstyer/Documents/loanos-clone/CONTEXT.md` contains the literal line `Demo environment: READY`. If not, fail the post and instruct Builder to select a different pool entry.
3. If `visual_format` is missing or blank on a LoanOS post, the post fails quality with a hard fail (not a score deduction — kill it).

Text-only LoanOS posts are BLOCKED at this stage. Always.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/subagents/03b-quality.md
git commit -m "Quality: Jessica Test scoring + LoanOS visual format check"
```

---

### Task 7: Update 04-reviewer.md — pool entry ref check, rolling mix check, CTA alignment, LoanOS compliance

**Worker:** `[subagent]`
**Files:**
- Modify: `tasks/social-media/subagents/04-reviewer.md`

- [ ] **Step 1: Read the current `04-reviewer.md`**

- [ ] **Step 2: Find the compliance checklist section**

- [ ] **Step 3: Add the LoanOS stream checks**

Add this section to the compliance checklist:

```markdown
### LoanOS Stream Checks

For any post with `stream: loanos`, verify ALL of the following. Any failure = post rejected.

1. **Pool entry reference present.** The `social_drafts` row has a non-empty `pool_entry_id` field.
2. **Pool entry exists.** Open `tasks/social-media/loanos-pool.md` and confirm the referenced entry ID is present in the file.
3. **Pool entry status is `ready`.** If the referenced entry is `published`, `killed`, or `drafted`, reject the post — the Architect grabbed a stale entry.
4. **NMLS# rule:**
   - If the post mentions rates, loan products, pricing, qualification, or APR — NMLS #513013 must be present.
   - If the post is pure build-in-public (architecture, automations, "why I built this") with NO rate/loan/qualification mention, NMLS# is NOT required.
5. **No borrower PII.** Scan the post body for patterns like `[FirstName] [LastName] — $[amount]` or similar. Any real-name + dollar-amount combination = reject.
6. **No guarantee language.** "I can get you approved," "guaranteed," "will close in X days" — all blocked, even when framed around LoanOS features.
7. **No licensing promises.** For posts tagged Audience: LO, reject any language promising when LoanOS opens to other LOs (e.g., "launching Q3"). Allowed: "DM me about it," "building a waitlist."
8. **CTA alignment.** The CTA in the post must match the `CTA` field on the referenced pool entry. If pool entry says `none`, post must not end with a CTA.
```

- [ ] **Step 4: Add the rolling 4-week mix check**

Add this section:

```markdown
### Rolling 4-Week Pillar Mix Check

Before approving this week's batch of posts:

1. Query `social_drafts` for all posts (published + scheduled + drafted) dated within the last 28 days including this batch.
2. Count by pillar: Real Talk, Personal/Story, Education, Promo.
3. Calculate percentage of each pillar across the 28-day window.
4. Verify each pillar is within 30/30/30/10 ± 5%.
5. If any pillar is more than 5% off target, reject this week's plan and instruct the Architect to rebalance.

Single-week drift is fine. Rolling 28-day drift is not.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/subagents/04-reviewer.md
git commit -m "Reviewer: LoanOS stream compliance + rolling 4-week mix gate"
```

---

### Task 8: Update 00-notebooklm.md — include LoanOS pool state in push/pull

**Worker:** `[subagent]`
**Files:**
- Modify: `tasks/social-media/subagents/00-notebooklm.md`

- [ ] **Step 1: Read the current `00-notebooklm.md`**

- [ ] **Step 2: Find the PUSH section (where it writes notes to NotebookLM)**

- [ ] **Step 3: Add LoanOS pool state to PUSH content**

Add this block to the PUSH content template:

```markdown
## LoanOS Pool State (as of this session)

- Total entries: [count from `grep -c "^## Entry" tasks/social-media/loanos-pool.md`]
- Ready: [count of `Status: ready` entries]
- Drafted: [count of `Status: drafted`]
- Scheduled: [count of `Status: scheduled`]
- Published: [count of `Status: published`]
- Killed: [count of `Status: killed`]

## Arc Phase Progress
- 1A Foundation: [ready count] / [total 1A entries]
- 1B In Motion: [ready count] / [total 1B entries]
- 1C Automations: [ready count] / [total 1C entries]
- 1D Transfer of Value: [ready count] / [total 1D entries]

## Proposed Entries (Lane 2, awaiting Adam review)
[List any entries in `loanos-pool-proposed.md`]
```

- [ ] **Step 4: Find the PULL section**

- [ ] **Step 5: Add LoanOS pool state awareness to PULL**

Add to PULL context load: "After pulling, read `tasks/social-media/loanos-pool.md` to load current pool state into working memory for the Architect."

- [ ] **Step 6: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/subagents/00-notebooklm.md
git commit -m "NotebookLM: track LoanOS pool state in push/pull"
```

---

### Task 9: Promote voice guide from DRAFT to ACTIVE + add LoanOS stream section

**Worker:** `[main]` (small edit, not worth delegating)
**Files:**
- Modify: `tasks/social-media/adam-voice-and-workflow.md`

- [ ] **Step 1: Change status in header**

Change the header line from:
```
# STATUS: DRAFT — Adam needs to review and correct everything in this document.
```
to:
```
# STATUS: ACTIVE — promoted 2026-04-05 as part of pillar framework v2 launch.
```

- [ ] **Step 2: Add LoanOS stream section**

Append at the end of the file (before any existing final section):

```markdown
---

## LoanOS / AI Content Stream

A named content thread that lives primarily inside the Real Talk pillar. 2 posts per week. Driven by an evergreen pool (`tasks/social-media/loanos-pool.md`) plus opportunistic CHANGELOG.md reading. Every post has a photo or video — NEVER text-only.

**Core positioning (the closing beat every post leads toward):**
> "I made this a weapon for myself, and now I'm giving other people the weapon I created."

**Narrative arc (Phase 1):**
- 1A Foundation — What LoanOS is (dashboard, loans, contacts, why Adam built it himself)
- 1B In Motion — Loan scenarios running through the system
- 1C Automations — n8n workflows, agents, manual tasks replaced
- 1D Transfer of Value — LO-targeted waitlist CTAs

**Audience CTAs:**
- LO → DM for waitlist
- Realtor → no CTA, positioning only
- Borrower → no CTA, trust signal
- Builder → no CTA, LinkedIn personal brand

Full spec: `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md`
```

- [ ] **Step 3: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/adam-voice-and-workflow.md
git commit -m "Voice guide: promote to ACTIVE; add LoanOS stream section"
```

---

## Phase 3 — Cross-Agent Dependencies (Lane C)

### Task 10: Brief lead-gen agent on LO waitlist capture page

**Worker:** `[main]` (just a domain-queue write — fast)
**Files:**
- Modify: `tasks/lead-gen/domain-queue.md`

- [ ] **Step 1: Read current `tasks/lead-gen/domain-queue.md`**

- [ ] **Step 2: Append new focus entry**

Append:

```markdown
## 2026-04-05 — LO Waitlist Capture (LoanOS stream dependency)

**Priority:** HIGH — blocks first-run gate for LoanOS content stream
**Spec reference:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 9.2 + Section 13
**Goal:** Build a minimum-viable LO waitlist capture page + Mailchimp list + n8n intake workflow

**Deliverables:**
1. Simple landing page on styermortgage.com (path: `/loanos-waitlist` or similar) with:
   - Headline: "Building software loan officers actually want. Get on the waitlist."
   - Form fields: first name, last name, email, NMLS# (optional), company
   - Single CTA button: "Join the waitlist"
   - No fluff. No pricing. No feature list. Raw.
2. New Mailchimp list: "LoanOS Waitlist"
3. n8n workflow: form submit → Mailchimp add → Supabase log → notification to Adam
4. Form URL gets added to the Audience: LO pool entries in `loanos-pool.md` as the CTA target

**Copy approval required from Adam before deploy.** Draft the copy, commit to repo, request Adam review.

**Blocks:** LoanOS first-run gate in `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md` Task 14
```

- [ ] **Step 3: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/lead-gen/domain-queue.md
git commit -m "Lead-gen queue: LO waitlist capture dependency for LoanOS stream"
```

---

### Task 11: Brief seo-sem + content-weekly agents on /loanos landing page

**Worker:** `[main]`
**Files:**
- Modify: `tasks/seo-sem/backlog.md`

- [ ] **Step 1: Read current `tasks/seo-sem/backlog.md`**

- [ ] **Step 2: Append new focus entry**

Append:

```markdown
## 2026-04-05 — /loanos Landing Page (LoanOS stream dependency)

**Priority:** HIGH — blocks first-run gate for LoanOS content stream
**Spec reference:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 9.2 + Section 13
**Goal:** Build a long-form "What LoanOS is and why I built it" page on styermortgage.com

**Deliverables:**
1. New page at `styermortgage.com/loanos` (or `/ai`)
2. Content: long-form explainer matching Adam's voice (consult `tasks/social-media/adam-voice-and-workflow.md`). Not a feature list. A story:
   - Why Adam built it (the Jessica → Janie → Claude arc)
   - What it does (dashboard, loans, contacts, automations — plain English)
   - Who it's for (mostly "me", but hints at the waitlist)
   - Call to action: waitlist signup (route to the form built in `tasks/lead-gen/domain-queue.md` entry)
3. SEO metadata: title, description, schema
4. Link from main nav OR footer (Adam decision)

**Copy approval required from Adam before deploy.** Use Adam's voice guide strictly. Apply the Jessica Test — if any section sounds corporate, rewrite.

**Template decision needed from Adam:** Does the page use the existing styermortgage.com template or get a custom layout?

**Blocks:** LoanOS first-run gate in `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md` Task 14
```

- [ ] **Step 3: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/seo-sem/backlog.md
git commit -m "SEO-SEM backlog: /loanos landing page for LoanOS stream"
```

---

### Task 12: Delegate n8n GBP webhook theme branch to Codex

**Worker:** `[codex]` — this is a self-contained n8n workflow modification with clear acceptance criteria. Codex is good at exactly this kind of thing. Delegate via the `codex:codex-rescue` agent.
**Files:**
- No repo files modified. n8n workflow modified via MCP.

- [ ] **Step 1: Identify the webhook-owning workflow**

Use `mcp__n8n-mcp__search_workflows` to find the workflow that handles the `gbp-social-post` webhook path. Likely candidates from the MEMORY catalog: `Weekly GBP + Social Post` (`V6RhmJpOb7pOzMte`) OR a standalone webhook workflow not yet catalogued. The Codex agent will identify and confirm.

- [ ] **Step 2: Codex task brief**

Dispatch `codex:codex-rescue` with this brief:

> **Task:** Add a new `theme` branch to the n8n workflow that handles the `/gbp-social-post` webhook. Current themes adapt Gemini prompts for rate updates, blog posts, and newsletters. Add a new theme value `loanos-build` that branches to a prompt template for LoanOS build-in-public content (builder/operator tone, NOT mortgage tone).
>
> **New prompt template for theme=`loanos-build`:**
> "Adapt this post for [platform]. Voice: Adam Styer is a loan officer who builds his own software. He's self-deprecating but technically sharp. He talks about LoanOS (his custom CRM) and automations he's built. Audience: other loan officers, realtors, and builders. NEVER add mortgage sales language. NEVER add rate data. NEVER add NMLS# unless explicitly present in the source post. Keep the original hook. Keep the tone raw and builder-focused."
>
> **Image handling:** For theme=`loanos-build`, do NOT call Imagen. Use the image provided in the webhook payload directly (Adam's selfie or whiteboard photo).
>
> **Acceptance:**
> 1. Workflow accepts `{theme: "loanos-build", gbp_post: "...", image_url: "..."}` payload
> 2. Gemini uses the new prompt template, not the mortgage template
> 3. Imagen is skipped for this theme
> 4. Publer receives the platform-adapted content + the direct image URL
> 5. Test by firing the webhook with a sample loanos-build payload and verify the Publer draft looks correct
>
> **Coordination:** Read `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 10 for context. Report back with: (a) the workflow ID you modified, (b) the webhook test result, (c) any blockers.

- [ ] **Step 3: Verify Codex output**

When Codex returns, verify:
- Workflow ID reported matches a real workflow in the n8n instance
- Webhook test succeeded (Codex should show the Publer draft output)
- Update `/Users/adamstyer/.claude/projects/-Users-adamstyer-Documents/memory/MEMORY.md` n8n workflow table with any new workflow ID or a note about the `loanos-build` theme branch being added

- [ ] **Step 4: Commit the MEMORY update (no repo commit — n8n is external)**

The repo isn't affected. If MEMORY was updated, that's already written to the `.claude/projects` path.

---

### Task 13: Update gbp-optimization scheduled task to include LoanOS posts

**Worker:** `[subagent]` — dispatch fresh subagent to find the gbp-optimization task prompt and update it
**Files:**
- Location to be identified (scheduled task prompt, not a full agent directory — see spec Section 9.2)

- [ ] **Step 1: Find the gbp-optimization task prompt**

Use `mcp__scheduled-tasks__list_scheduled_tasks` to find the task with name/ID matching `gbp-optimization` and retrieve its prompt.

- [ ] **Step 2: Read the current prompt**

- [ ] **Step 3: Add LoanOS content selection rule**

Add this section to the prompt:

```markdown
## LoanOS Content Inclusion (weekly)

When selecting this week's GBP content mix:

1. Query `social_drafts` for LoanOS-stream posts (field: `stream = loanos`) published in the last 7 days.
2. Identify any that had above-average engagement (likes, comments, shares) on LinkedIn or Instagram.
3. Include 1-2 of the best-performing ones in the weekly GBP post rotation alongside rate/market content.
4. Use the `loanos-build` theme when firing these to the `/gbp-social-post` webhook (see spec Section 10).
5. If no LoanOS posts are available or none performed above baseline, skip — do not force LoanOS content.

This gives local search users (people Googling "Austin mortgage") exposure to Adam's LoanOS positioning without diluting the primary GBP content (rates + local Austin market).
```

- [ ] **Step 4: Update the scheduled task via MCP**

Use `mcp__scheduled-tasks__update_scheduled_task` with the modified prompt.

- [ ] **Step 5: Verify via read-back**

Use `mcp__scheduled-tasks__list_scheduled_tasks` again and confirm the new section is present in the prompt.

- [ ] **Step 6: Log the change**

Append to `tasks/social-media/session-log.md`:
```markdown
## 2026-04-05 — gbp-optimization task prompt updated

Added LoanOS content inclusion rule. Weekly task will now include 1-2 top-performing LoanOS posts in GBP rotation when available. Uses `loanos-build` theme on the webhook.
```

- [ ] **Step 7: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/session-log.md
git commit -m "Log gbp-optimization task update for LoanOS content inclusion"
```

---

## Phase 4 — First-Run Gate and Launch

### Task 14: First-run gate check

**Worker:** `[main]`
**Files:**
- Read only: multiple files across the repo

- [ ] **Step 1: Gate check 1 — pool entries**

Run:
```bash
grep -A1 "^## Entry 1A-" /Users/adamstyer/Documents/loanos-clone/tasks/social-media/loanos-pool.md | grep "Status: ready" | wc -l
```
Expected: `>= 6`

If fewer than 6, log blocker in `tasks/social-media/BLOCKERS.md`:
```markdown
## 2026-04-05 — BLOCKED: LoanOS first-run gate — insufficient pool entries

Needed: 6 Phase 1A entries with Status: ready
Current: [actual count]
Action: Adam needs to either (a) un-kill entries, (b) draft replacements for killed entries via Task 2 pattern
```

- [ ] **Step 2: Gate check 2 — selfie inventory**

Run:
```bash
ls /Users/adamstyer/Documents/loanos-clone/tasks/social-media/assets/selfies/ 2>/dev/null | wc -l
```
Expected: `>= 2`

If fewer than 2, log blocker:
```markdown
## 2026-04-05 — BLOCKED: LoanOS first-run gate — missing selfie inventory

Needed: 2-3 selfies in tasks/social-media/assets/selfies/
Current: [actual count]
Action: Adam needs to shoot selfies per spec Section 8.1:
1. Neutral desk shot (laptop visible, screen unreadable)
2. Thinking/looking-away shot
3. Optional: outdoor/coffee shop shot
```

- [ ] **Step 3: Gate check 3 — /loanos landing page**

Check if `styermortgage.com/loanos` (or `/ai`) is deployed. This is a manual check unless there's a deployment tracking file. Ask Adam directly OR check whatever tracking mechanism the seo-sem agent uses for deployed pages.

If not deployed, log blocker:
```markdown
## 2026-04-05 — BLOCKED: LoanOS first-run gate — landing page not deployed

Needed: /loanos or /ai page live on styermortgage.com with waitlist form
Current: Not deployed (confirmed with Adam / tracking file)
Action: seo-sem agent per Task 11 brief
```

- [ ] **Step 4: Gate check summary**

Write a summary to `tasks/social-media/session-log.md`:
```markdown
## 2026-04-05 — First-Run Gate Check Results

| Gate | Required | Actual | Status |
|---|---|---|---|
| Pool entries (1A ready) | >= 6 | [count] | [PASS/FAIL] |
| Selfie inventory | >= 2 | [count] | [PASS/FAIL] |
| /loanos landing page | deployed | [status] | [PASS/FAIL] |

Overall: [LAUNCH APPROVED / BLOCKED pending above]
```

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/session-log.md tasks/social-media/BLOCKERS.md
git commit -m "First-run gate check for LoanOS stream launch"
```

---

### Task 15: Launch — trigger the first Architect run under new framework

**Worker:** `[main]` + Adam confirmation
**Files:**
- Reads: all of the above

- [ ] **Step 1: Confirm all three gates PASS in Task 14 session-log entry**

If any gate is FAIL, STOP. Do not proceed. Return to the blocker resolution path.

- [ ] **Step 2: Adam confirms launch**

Adam explicitly types "launch" or equivalent. No auto-launch. This is a human-in-the-loop checkpoint because the first run produces content that will be drafted to `social_drafts` and is visible in the dashboard.

- [ ] **Step 3: Trigger the next social-media-am run**

Either (a) wait for the next scheduled 2 AM run, or (b) manually invoke:
```bash
cd ~/Documents/loanos-clone && cat tasks/social-media/master-agent.md | claude --dangerously-skip-permissions
```

- [ ] **Step 4: Monitor the first run's output**

After the session completes, verify:
- Architect planned posts under the new 4-pillar framework (check `today-mission.md`)
- At least 1 LoanOS post was planned for the week (Lane 1 selection from pool)
- Reviewer approved the plan (rolling 4-week mix check passed or was skipped due to insufficient history)
- Builder wrote the LoanOS post with a `pool_entry_id` reference
- Post landed in `social_drafts` table

- [ ] **Step 5: Log the launch**

Append to `tasks/social-media/session-log.md`:
```markdown
## 2026-04-05 — LoanOS Stream LAUNCHED

First run under pillar framework v2 completed.

Posts planned: [count by pillar]
LoanOS posts drafted: [count]
Pool entries consumed: [list entry IDs]
Reviewer verdict: [approved / rejected]
Any blockers raised: [none / list]

Next: monitor first 4 weeks of rolling mix; assess whether pool needs replenishment after Phase 1A exhausts.
```

- [ ] **Step 6: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add tasks/social-media/session-log.md
git commit -m "LoanOS stream launch — first run under pillar framework v2"
```

---

## Adam Action Checklist (Gates You Own)

These cannot be delegated. The plan blocks on them.

- [ ] Review 6 Phase 1A pool entries (Task 3) — correct voice, kill bad ones, confirm 6 still at `ready`
- [ ] Shoot 2-3 selfies (neutral desk, thinking/looking-away, optional outdoor) and upload to `tasks/social-media/assets/selfies/` (Task 14 gate 2)
- [ ] Approve `/loanos` landing page copy when seo-sem drafts it (Task 11)
- [ ] Approve LO waitlist capture form copy when lead-gen drafts it (Task 10)
- [ ] Decide: does the `/loanos` page use existing styermortgage.com template or custom? (Task 11)
- [ ] Confirm launch in Task 15 Step 2

---

## Spec Coverage Check (self-review against the spec)

| Spec Section | Task(s) | Coverage |
|---|---|---|
| §4 Four-pillar framework + rolling mix | Task 4 (Architect), Task 7 (Reviewer) | ✓ |
| §5 LoanOS stream cadence + arc | Task 4 (two-lane), Task 5 (Builder template), Task 9 (voice guide) | ✓ |
| §6 Pool file + entry schema | Task 2 (pool creation + 6 entries) | ✓ |
| §7 Two-lane input model | Task 4 (both lanes in Architect), Task 2 (Lane 2 file) | ✓ |
| §8 Visual format rules | Task 5 (Builder rule), Task 6 (Quality check) | ✓ |
| §9.1 Social media agent files | Tasks 4, 5, 6, 7, 8, 9, 1 | ✓ |
| §9.2 Cross-agent dependencies | Tasks 10, 11, 13 | ✓ |
| §10 GBP webhook theme branch | Task 12 (Codex) | ✓ |
| §11 LoanOS compliance rules | Task 7 (Reviewer) | ✓ |
| §12 Migration (clean break Post 57) | Task 1 (supersede old draft) | ✓ |
| §13 First-run gate | Task 14 | ✓ |
| §14 Success metrics | Not a task — ongoing measurement via Reporter subagent existing flow | Deferred (measurement, not build) |
| §15 Adam action items | Adam Action Checklist above | ✓ |

All build items covered. Success metrics tracking is existing Reporter flow — no new task needed.
