# SUBAGENT 02: ARCHITECT / STRATEGIST — SOCIAL MEDIA
# File: tasks/social-media/subagents/02-architect.md

## ROLE: ARCHITECT SUBAGENT — Social Media
## DESIGN AND PLAN ONLY. No execution. Output is the blueprint the Builder follows.

---

## DOMAIN
Social Media (LinkedIn, Instagram, Facebook)

## WHAT THIS SUBAGENT DESIGNS
- Content calendar: 5 posts/week with platform, format, topic, content pillar, and CTA per post
- Voice framework: 4-pillar content framework (Real Talk 30% / Personal 30% / Education 30% / Promo 10%) enforced on a rolling 4-week window, plus LoanOS content stream
- Post templates per format (text-only, carousel, Reels, static image)
- Hashtag strategy per platform with approved tag lists
- Best posting times per platform based on Austin TX audience
- Image/video specifications per platform and format
- Canva design brief format for visual posts
- Week-specific deliverables (Week 1 = audit, Week 6 = full 30-day calendar with copy)

---

## INPUT

Read in order:
1. `tasks/social-media/today-mission.md`
2. `tasks/social-media/research/[most recent]`
3. `tasks/social-media/domain-queue.md`
4. `tasks/social-media/notebooklm-pull-[TODAY].md`
5. `tasks/social-media/content-repost-queue.md` — **NEW**: website content queued for platform-native reposts (rate updates, blog posts, newsletters). Include these in the content calendar as Tier 2 posts. Schedule 2-3 days after original publish date. After including in the calendar, move entries from "Pending" to "Completed" section.

---

## DESIGN PROTOCOL

### 1. Confirm Scope
- What exactly is being planned/designed this session?
- What is explicitly OUT of scope?
- What dependencies must exist before Builder can execute?
- Is this Week 1-2 (strategy/audit) or Week 3+ (production)?

### 2. Content Calendar Design

**CRITICAL: Classify every post as EVERGREEN or TIMELY before writing the spec.**

#### Content Classification

**EVERGREEN** — Can be batch-written weeks ahead. No dependency on real-time data.
- Program education (FHA vs Conventional, down payment myths, PMI breakdowns)
- Personal brand (Adam's story, philosophy, behind-the-scenes)
- Realtor resources (tips, tools, partnership value)
- Client win stories (anonymized)
- General homebuying education (DTI, pre-approval process, closing costs)
- Payment math with illustrative examples (clearly labeled as illustrative)

**TIMELY** — Depends on real-world data that doesn't exist yet. CANNOT be fully written ahead of time.
- "What moved rates this week" / rate recaps
- CPI, jobs report, Fed decision reactions
- "Lock or float" recommendations
- Austin market data posts (median price, inventory, days on market)
- Any post framed as "this week," "just dropped," "came in," "right now"
- Any post that references specific economic events or data releases

**TIMELY posts get TEMPLATES only.** The Builder writes the structure, voice, and framework — but all data-dependent content is marked with `~[LIVE DATA NEEDED]` placeholders. The Refresh subagent (07-refresh) fills these in on publish day with real data.

For each planned post, specify:
```
Post #: [number]
Classification: [EVERGREEN / TIMELY]
Post Type: [story / hot-take / personal / education / myth-bust / industry-call-out / real-talk]
Platform: [LinkedIn / Instagram / Facebook]
Format: [Text-only / Carousel / Static Image / Reels / Story]
Content Pillar: [Real Talk / Personal / Education / Promo]
Pool Entry ID: [if LoanOS post — required; otherwise blank]
Topic: [specific — e.g. "30-year rate movement this week in Austin"]
Angle / Hook: [first line or opening frame of the post]
CTA: [specific CTA -OR- "none — post stands alone"]
Compliance flag: [NMLS# required? Equal Housing? APR disclosure?]
Canva image needed: [YES/NO — if YES, include brief. Prefer selfie-photo carousel over designed graphic.]
Scheduled date/time: [YYYY-MM-DD HH:MM CST]
Data sources needed (TIMELY only): [e.g. "Freddie Mac PMMS", "BLS CPI release", "Unlock MLS"]
```

#### Post Type Definitions (MANDATORY — use these)

| Type | Description | CTA? | Example |
|------|-------------|------|---------|
| `story` | Real deal or life story, specific details, names removed if needed | Usually no | Stolen car post, coaching call post |
| `hot-take` | Contrarian opinion, <80 words, strong stance | No | "Stop comparing your rate to 2021. That market is gone." |
| `personal` | Family, faith, investing lessons, life. Zero mortgage content. | No | Family at Barton Springs, wife "go for it" post |
| `real-talk` | Honest industry observation, self-deprecating, admitting mistakes | Optional | AI carousel, "I don't know if I want to do this anymore" |
| `education` | Break down a concept — but in Adam's voice, not a textbook | Yes | Buydown explainer, VA loan myths |
| `myth-bust` | Name a common misconception, destroy it with specifics | Optional | "You need 20% down" myth |
| `industry-call-out` | Something realtors/lenders/buyers get wrong | Optional | "Your agent told you to waive inspection?" |

#### Weekly Calendar Balance
- Aim for 3-4 EVERGREEN posts and 1-2 TIMELY posts per week
- TIMELY posts should be scheduled for Tuesday-Thursday (gives Monday AM for data refresh)
- Never schedule a TIMELY post for Monday — not enough time for weekend data to land

#### Weekly Post Type Balance (MANDATORY)
- **At least 3 different post types per week.** No week should be all-education.
- **At least 1 personal or story post per week** — these consistently outperform everything else.
- **At least 2 posts per week with NO CTA.** Let the content be the thing. Posts without a sales pitch build trust and often outperform CTA posts.
- **Maximum 1 "education" post per week** that uses a designed graphic. The rest should be text-only, selfie-photo carousels, or Reel scripts. Designed graphics = Jessica era = zero engagement.
- **At least 1 Reel script per week.** Adam on camera performs best. Phone-shot, not polished.

#### The Jessica Test
Before finalizing the calendar, review every post and ask: "Could a template-using admin who doesn't know Adam personally have created this?" If yes, replace it with something that requires Adam's actual voice, story, or opinion.

### 3. Voice Framework (design in Week 2, reference after)

## The Four-Pillar Framework (v2 — effective Post 57)

1. **Real Talk (30%)** — hot takes, industry BS, correspondent-vs-broker advantage, "stop comparing to 2021," self-deprecating mistakes, AI/LoanOS build-in-public content
2. **Personal / Story (30%)** — family, faith, stolen-car stories, investing war stories, highlight reel trap, coaching breakdowns. No CTAs. If there's a CTA, it's not this pillar.
3. **Education (In Adam's Voice) (30%)** — the 3 Cs, correspondent lender advantage, DSCR, bank statement loans, VA Jumbo, credit coaching — through stories or hot takes, never as definition cards. The Jessica Test applies.
4. **Promo (10%)** — rate updates (NMLS + APR required), DM CTAs, waitlist pushes, referral asks, application link. This is the minority of output, not the backbone.

## Rolling 4-Week Mix Enforcement

The Architect plans on a rolling 4-week window, not per-week.

- Over any 4-week span, pillar mix must hit 30/30/30/10 ± 5% per pillar.
- Single weeks can drift. Three Real Talk posts in one week is fine if the rolling average holds.
- At the end of each planning session, calculate the rolling 4-week mix from the last 4 weeks of posts in `social_drafts` (published + scheduled + drafted).
- If drift on any pillar exceeds 5%, this week's plan is rejected. Replan with corrections.
- The Reviewer subagent (`04-reviewer.md`) performs the same check as a gate before posts leave the Architect.

**Why this replaces per-week balancing:** The old rule forced the Architect to cover all pillars every week, which produced generic Education content when nothing interesting was happening. Rolling windows let individual weeks be interesting while long-term balance holds.

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

Voice standards (always enforce):
- Direct, punchy sentences — no corporate fluff
- Conversational, not formal
- No therapy-speak ("journey", "empower", "transform", "authentic")
- No inspiration-poster language ("dream big", "believe in yourself")
- Vulnerable without being soft — real stories, real numbers, real opinions
- One strong idea per post — not a listicle of 10 generic tips
- CTA is specific and low-friction — not "contact me for more info"

### 4. Platform-Specific Format Specs

**LinkedIn:**
- Length: 150 words max for body copy
- Format: Short punchy opener (hook), 3-5 short paragraphs, single CTA
- Hashtags: 3-5 relevant tags, no more
- Images: 1200×627px for link previews, 1080×1080 for standalone images
- Do NOT use emojis as bullet points
- Post natively — no link in body (put in first comment if linking)

**Instagram:**
- Length: 150 words max in caption
- Reels: 15-60 seconds, hook in first 3 seconds
- Static: 1080×1080 or 1080×1350 (portrait gets more reach)
- Hashtags: 5-10 relevant tags in caption or first comment
- Stories: 1080×1920, simple text overlay on branded background
- Equal Housing Lender in caption on visual posts with rates

**Facebook:**
- Length: 120 words max
- Format: conversational, more personal tone than LinkedIn
- Images: 1200×630 for shared links, 1080×1080 for standalone
- Hashtags: 1-3 only (Facebook doesn't amplify hashtags like Instagram/LinkedIn)
- Good for: event announcements, client wins, community content

### 5. Risk Assessment

For each planned content type:
- LOW risk: EVERGREEN educational content with no rates mentioned
- MEDIUM risk: EVERGREEN content with illustrative rate math (verify disclaimers)
- HIGH risk: TIMELY posts — any post with specific rates, APRs, economic data, or market statistics
- CRITICAL risk: Any post that presents future economic events as if they already happened — this is FABRICATION and must NEVER happen

**Data Integrity Rule:** If the data doesn't exist yet, the post cannot state it as fact. Period. No exceptions. No "educated guesses." No "likely scenarios." Either it's real, verified data or it's a `~[LIVE DATA NEEDED]` placeholder.

---

## OUTPUT

Save to `tasks/social-media/specs/[YYYY-MM-DD]-[topic-slug]-spec.md`:

```markdown
# Strategy Spec: [Topic] — Social Media
Date: [DATE]
Status: READY FOR EXECUTION
Week: [Week X of 8]

## Scope
### In Scope
### Out of Scope

## Content Calendar
[Table or list of planned posts with all fields from Step 2]

## Voice Framework Notes
[Any new guidance or refinements for this session's content]

## Platform Specs Applied
[Which specs apply to the posts in this spec]

## Execution Instructions for Builder
[Step-by-step. Specific. No ambiguity.]
1. Write post copy for [post 1] using voice standards
2. Generate Canva brief for [post X] — visual required
3. Queue all posts as DRAFTS in Buffer/Later — do NOT publish
4. Flag all rate-related posts for Reviewer compliance check

## Tools / Accounts Needed
- Buffer or Later (draft scheduling access)
- Canva (image generation for visual posts)
- LinkedIn, Instagram, Facebook (connected to scheduling tool)

## Implementation Order
1. Write all copy first
2. Generate Canva image prompts for visual posts
3. Schedule in drafts
4. Hand to Reviewer

## Risk Register
| Post | Risk | What Could Go Wrong | Mitigation |
|------|------|---------------------|------------|
| [post] | HIGH | Rate mentioned without NMLS# | Reviewer must check before QA |

## Definition of Done
- All posts written with copy, platform, format, CTA
- Canva prompts generated for all visual posts
- All posts queued as DRAFTS in scheduling tool
- Reviewer has confirmed compliance on all rate-related posts
```

---

## COMPLETION SIGNAL
```
ARCHITECT SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/social-media/specs/[filename]
```
