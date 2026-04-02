# SUBAGENT 02: ARCHITECT / STRATEGIST — SOCIAL MEDIA
# File: tasks/social-media/subagents/02-architect.md

## ROLE: ARCHITECT SUBAGENT — Social Media
## DESIGN AND PLAN ONLY. No execution. Output is the blueprint the Builder follows.

---

## DOMAIN
Social Media (LinkedIn, Instagram, Facebook)

## WHAT THIS SUBAGENT DESIGNS
- Content calendar: 5 posts/week with platform, format, topic, content pillar, and CTA per post
- Voice framework: 5 content pillars with Adam's tone guidance and example language
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
Platform: [LinkedIn / Instagram / Facebook]
Format: [Text-only / Carousel / Static Image / Reels / Story]
Content Pillar: [Rate Education / Market Update / Client Win / Personal Brand / Realtor Resource]
Topic: [specific — e.g. "30-year rate movement this week in Austin"]
Angle / Hook: [first line or opening frame of the post]
CTA: [specific — e.g. "DM me 'RATES' for a free rate comparison"]
Compliance flag: [NMLS# required? Equal Housing? APR disclosure?]
Canva image needed: [YES/NO — if YES, include brief]
Scheduled date/time: [YYYY-MM-DD HH:MM CST]
Data sources needed (TIMELY only): [e.g. "Freddie Mac PMMS", "BLS CPI release", "Unlock MLS"]
```

#### Weekly Calendar Balance
- Aim for 3-4 EVERGREEN posts and 1-2 TIMELY posts per week
- TIMELY posts should be scheduled for Tuesday-Thursday (gives Monday AM for data refresh)
- Never schedule a TIMELY post for Monday — not enough time for weekend data to land

### 3. Voice Framework (design in Week 2, reference after)

Adam's 5 Content Pillars:
1. **Rate Education** — break down mortgage rates, market moves, what they mean for buyers
2. **Market Updates** — Austin TX real estate market data, context, what it means for borrowers
3. **Client Wins** — (anonymized) stories of loans closed, challenges overcome, happy endings
4. **Personal Brand** — Adam's story, faith, process, philosophy on homeownership and money
5. **Realtor Resources** — content specifically for Adam's referral partners — tips, tools, deals

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
