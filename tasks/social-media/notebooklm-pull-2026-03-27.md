# NotebookLM Pull Report — 2026-03-27 AM
Active Topic: Content Calendar Architecture (Sequence B — Strategy)

## What We Already Know

**Platform Strategy (established):**
- LinkedIn: PDF carousel is highest-ROI format (278% more engagement than video, 6x vs. text-only). Focus on niche expertise, quality connections over followers. 3 or fewer hashtags. Best time: Wed 4pm.
- Instagram: Two modes — Reels for reach/discovery (36% more reach), carousels for engagement (109% more per person reached). 3-second hook rule. DM shares are the #1 algorithm signal. Hashtags deprecated Dec 2024 — keywords in captions matter now. Best time: Thu 9am.
- Facebook: Organic reach is 1-2%. Facebook Groups and Reels bypass this. Never put external links in captions (place in first comment or bio). Meta now surfacing 50% more Reels. Best time: Thu 9am.
- Universal: Reply to comments (+30% LinkedIn lift, +42% Threads lift). Phone-shot vertical video outperforms professional content. 3-5 posts/week consistency over volume. Accounts that skip a week consistently underperform their baseline.

**5-Pillar Content Framework (drafted 2026-03-26):**
1. Rate Education — Mon: LinkedIn carousel PDF + Instagram Reel
2. Austin Market Data — Fri: LinkedIn carousel + Instagram carousel + Facebook cross-post
3. Buyer Education — weekly rotation across platforms
4. Realtor Resources — Wed: LinkedIn only (B2B, referral partners)
5. Personal Brand — Wed: Instagram short video + LinkedIn text-only

**Compliance anchors (non-negotiable):**
- NMLS# 513013 on ALL profiles and any rate-related post
- APR disclosure if specific rate mentioned
- No guaranteed approval language
- Equal Housing Lender on visual posts
- RESPA: no referral-based giveaways

**Infrastructure:**
- Publer configured with all 4 platform accounts
- Publer account IDs in CLAUDE.md
- Weekly Social Post n8n workflow (eJG4wckrj6SmSpm1) built but inactive (needs activation + test)
- GBP + Social Post weekly workflow (V6RhmJpOb7pOzMte) active

## Open Questions

1. **Account audit data**: Still no baseline follower counts, engagement rates, or top performing posts — blocked pending Adam sharing analytics. Content pillar draft will proceed as-is.
2. **Canva templates**: Unknown if brand templates exist. Will defer to builder when first post is written.
3. **Facebook Group**: Decision deferred — should Adam create "Austin Homebuyers" group or use business page only?
4. **Publer approval workflow**: Does Adam want to manually review every draft or activate auto-publish after compliance review?
5. **NMLS# audit**: Have not confirmed it's on all profiles — flagged as required before first post goes live.
6. **Weekly Social Post workflow**: Activation and end-to-end test deferred.

## Prior Decisions

- **Carousel-first on LinkedIn** (not video-first — algorithm data updated 2026-03-26)
- **No Pillar 3 (Buyer Education) on Facebook** — organic reach too low; groups/Reels only on Facebook
- **Pillar 4 (Realtor Resources) is LinkedIn-only** — B2B content, professional context only
- **Pillar 5 (Personal Brand) leads on Instagram**, secondary on LinkedIn (text-only)
- **Austin market data source**: Unlock MLS (unlockmls.com/stats) — pull every Thursday, publish Friday
- **Account audit condition**: Proceed with draft pillar framework after 2 sessions pass without receiving audit data — condition now met (AM session 2026-03-27)

## Content Insights

- PDF carousels are the priority LinkedIn format. "12 slides: hook → data → insight → TL;DR → CTA" structure confirmed.
- Instagram Reels: Hook in 3 seconds, drive DM shares, use keywords not hashtags (since Dec 2024 deprecation).
- Facebook: First comment for links, Groups for reach, Reels to surface content.
- Replying to comments is the most untapped lever for all platforms — needs to be built into Adam's daily 5-minute routine.
- Mortgage LO authenticity angle beats production value — phone-shot content outperforms branded content.
- Austin-specific data (inventory levels, median price, days on market) gives content local authority no national LO can replicate.

## Briefing for Research Subagent

**DO NOT re-research** (already established):
- Platform algorithm mechanics for LinkedIn, Instagram, Facebook
- Content pillar framework (5 pillars defined)
- Carousel specs (12-slide LinkedIn, carousel engagement data)
- Hashtag strategy (3 or fewer on LinkedIn; keywords replace hashtags on Instagram)
- Austin market data sources (Unlock MLS, Team Price)
- Optimal posting times
- RESPA/compliance requirements

**Gaps if Research subagent runs today:**
- Publer scheduling API — how to create a draft via API call (needed for Builder)
- Canva template creation workflow for PDF carousels — what's the fastest path?
- LinkedIn native document upload vs. external PDF link — which performs better and why?
- Instagram carousel vs. Reel for the Rate Education pillar — data on which format generates more DMs for mortgage content

**NOTE:** Research subagent is optional today. Primary mission is Architect (02) — 30-day calendar skeleton. Research can run if time permits and gaps are worth filling before calendar is built.
