DOMAIN: Social Media
NOTEBOOK: LoanOS Social Media
PLATFORMS: LinkedIn, Instagram, Facebook, Google Business Profile
GOAL: 5 posts/week across all platforms, zero manual input from Adam
SCHEDULING TOOL: Publer (API key + account IDs in CLAUDE.md)

---

CURRENT STATE (as of 2026-03-25):

INFRASTRUCTURE ALREADY SET UP:
  ✅ Publer configured — workspace + all 4 platform accounts (LinkedIn, Facebook, Instagram, GBP)
  ✅ Weekly GBP + Social Post workflow (V6RhmJpOb7pOzMte) — ACTIVE, webhook: gbp-social-post
  ⚡ Weekly Social Post n8n workflow (eJG4wckrj6SmSpm1) — fixed, inactive (needs activation)
  Publer account IDs: see CLAUDE.md

UNKNOWN / NEEDS AUDIT:
  - Current posting cadence on each platform (how often is Adam actually posting?)
  - Which content themes are getting engagement vs. falling flat
  - Current follower counts + growth trend
  - Whether the weekly social post workflow has ever been tested end-to-end

---

ACTIVE: Fresh Content — Week of April 1-7
  System has been reset. All prior drafts deleted. Agent prompts rewritten with EVERGREEN/TIMELY split.
  Run Sequence D (Full Cycle) to generate this week's content.
  1. [x] Content pillars defined (rate education, market updates, client wins, personal brand, realtor resources)
  2. [x] Voice guide exists in Supabase
  3. [ ] Generate 5 posts for April 1-7 (aim for 3-4 EVERGREEN, 1-2 TIMELY templates)
  4. [ ] TIMELY posts should have ~[LIVE DATA NEEDED] placeholders — refresh subagent fills them
  5. [ ] All posts through quality + reviewer + QA pipeline

---

QUEUE (build in sequence):
- 30-Day Content Calendar
    Write 30 posts (10 LinkedIn, 10 Instagram, 10 Facebook/GBP). One per day.
    Each post: copy ready to publish, Canva image prompt (if visual), compliance check.
    Schedule all 30 as Publer drafts via API.
    **NEW**: Include platform-native reposts from content-repost-queue.md in the calendar.
- LinkedIn Optimization
    Profile optimization, connection request strategy, best time to post,
    hashtag strategy, post format testing (text-only vs. carousel).
- Instagram Strategy
    Reels vs. static posts, story cadence, bio + link-in-bio setup,
    repurpose from LinkedIn posts automatically.
- Automation + Repurposing (PARTIALLY DONE — see below)
    Auto-repurpose LinkedIn posts to Instagram/Facebook via n8n.
    RSS-to-social for rate updates. New blog post → social announcement.
- Analytics Loop
    Weekly performance report. A/B test frameworks for post formats.
    Engagement response templates. Follower growth tracking.

---

CONTENT DISTRIBUTION SYSTEM (added 2026-04-01):

Two-tier approach for website content → social:

  TIER 1 — IMMEDIATE (same day, automated):
    Step 1B in master-agent.md detects new rate pages, blog posts, newsletter pages.
    Fires GBP webhook → n8n workflow → Gemini adapts → Imagen image → Publer posts to all 4 platforms.
    Same content, adapted tone per platform. Good for freshness signal.
    Tracker: tasks/social-media/gbp-content-tracker.md

  TIER 2 — PLATFORM-NATIVE (2-3 days later, higher quality):
    Step 1B also queues content to tasks/social-media/content-repost-queue.md.
    Architect picks these up during next planning session.
    Builder creates proper platform-native posts: LinkedIn carousels, IG Reels, FB engagement posts.
    These go through the full quality + reviewer pipeline before publishing.

  Result: Every piece of content Adam creates gets distributed twice — once fast, once deep.

---

COMPLETED:
- Publer configured with all platform accounts ✅
- GBP + Social Post weekly workflow active ✅
- Weekly Social Post n8n workflow built (needs activation) ✅

---

COMPLIANCE REQUIREMENTS:
- NMLS# 513013 required on all rate-related posts
- No guaranteed approval language
- APR disclosure if specific rate mentioned
- Equal Housing Lender on visual posts
- FTC: disclose if client testimonial is paid/incentivized
- Scheduling tool: Publer — DRAFTS only, never publish live from agent

---

## 2026-04-05 — LoanOS Stream Launch (Phase 1A)

Focus: Launch the new 4-pillar framework (30/30/30/10) and the LoanOS content stream inside Real Talk.
Spec: `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md`
Plan: `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md`
Applies to: Post 57 onward (clean break — Posts 50-56 unchanged)
First-run gate: 6 Phase 1A pool entries ready + selfies uploaded + /loanos landing page live
