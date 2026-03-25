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

ACTIVE: Content System Build
  Infrastructure exists. Now build the actual content engine.
  1. [ ] Audit current account performance — follower count, avg engagement, last 30 posts per platform
  2. [ ] Identify top 5 performing posts of all time (by engagement) per platform
  3. [ ] Test Weekly Social Post workflow (eJG4wckrj6SmSpm1) end-to-end — activate and verify Publer draft appears
  4. [ ] Define 5 content pillars based on what's working (rate education, market updates, client wins, personal brand, realtor resources)
  5. [ ] Write voice guide with 3 example posts per pillar that match Adam's style

---

QUEUE (build in sequence):
- 30-Day Content Calendar
    Write 30 posts (10 LinkedIn, 10 Instagram, 10 Facebook/GBP). One per day.
    Each post: copy ready to publish, Canva image prompt (if visual), compliance check.
    Schedule all 30 as Publer drafts via API.
- LinkedIn Optimization
    Profile optimization, connection request strategy, best time to post,
    hashtag strategy, post format testing (text-only vs. carousel).
- Instagram Strategy
    Reels vs. static posts, story cadence, bio + link-in-bio setup,
    repurpose from LinkedIn posts automatically.
- Automation + Repurposing
    Auto-repurpose LinkedIn posts to Instagram/Facebook via n8n.
    RSS-to-social for rate updates. New blog post → social announcement.
- Analytics Loop
    Weekly performance report. A/B test frameworks for post formats.
    Engagement response templates. Follower growth tracking.

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
