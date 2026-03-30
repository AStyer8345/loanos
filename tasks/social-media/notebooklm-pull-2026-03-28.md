# NotebookLM Pull Report — 2026-03-28 AM
Active Topic: Week 1 Content Execution — Posts 1–7 (April 6–10, 2026)

---

## What We Already Know

**Platform Strategy (established):**
- LinkedIn: PDF carousel is highest-ROI format (278% more engagement than video, 6x vs. text-only). Carousel uploaded as PDF document — not image series. 3 or fewer hashtags. Captions under 150 characters. Best time: Wed 4pm.
- Instagram: Two modes — Reels for reach/discovery (36% more reach), carousels for engagement (109% more per person reached). 3-second hook rule. DM shares are the #1 algorithm signal. Hashtags deprecated Dec 2024 — keywords in captions matter now. 3–5 hashtags max. Clickable links now supported in Reels captions (2026 update — use for loan app link). Best time: Thu 9am.
- Facebook: Organic reach is 1–2% on business pages. Facebook Groups and Reels bypass this. External links go in first comment or bio — never in caption. Meta now surfacing 50% more Reels. Cross-post from Instagram for efficiency. Best time: Thu 9am.
- Universal: Reply to comments (+30% LinkedIn lift, +21% Instagram lift). Phone-shot vertical video outperforms professional content. 3–5 posts/week consistency over volume. Skipping one week consistently underperforms baseline.

**5-Pillar Content Framework (finalized 2026-03-26/27):**
1. Rate Education — Mon: LinkedIn carousel PDF + Instagram Reel
2. Austin Market Data — Fri: LinkedIn carousel + Instagram carousel + Facebook cross-post
3. Buyer Education — weekly rotation across platforms
4. Realtor Resources — Wed: LinkedIn only (B2B, referral partners)
5. Personal Brand — Wed: Instagram short video + LinkedIn text-only

**30-Day Calendar Skeleton (built 2026-03-27):**
- Covers April 6 – May 5, 2026
- 30 unique post slots: LinkedIn (14), Instagram (13), Facebook (7 cross-posts)
- All 30 posts mapped to a pillar
- 5 high-risk (rate-related) posts identified — require manual compliance check before queue

**Infrastructure confirmed:**
- Publer configured with all 4 platform accounts (LinkedIn, Instagram, Facebook, GBP)
- Publer account IDs in CLAUDE.md and MEMORY.md
- Weekly Social Post n8n workflow (eJG4wckrj6SmSpm1) built but INACTIVE
- GBP + Social Post weekly workflow (V6RhmJpOb7pOzMte) active

---

## Open Questions

1. **Account audit data (primary blocker):** No baseline follower counts, engagement rates, or top-performing posts. Adam has not provided platform analytics or screenshots. Program is proceeding without this data.
2. **Canva brand templates:** Unknown if brand templates exist. Builder must check before first carousel is produced — if none exist, create from scratch using brand colors.
3. **Facebook Group decision:** Should Adam launch "Austin Homebuyers" Facebook Group to bypass 1–2% organic reach, or stick to business page + Reels only?
4. **Publer approval protocol:** Manual review of every draft vs. auto-publish for low-risk content after compliance check?
5. **NMLS# profile audit:** Not confirmed that NMLS# 513013 is currently displayed on all 4 social profiles. Required before any post goes live.
6. **n8n Weekly Social Post workflow:** Still inactive — needs activation + end-to-end test.
7. **Instagram Reels vs. carousel for Rate Education:** Which format generates more DM leads for mortgage content? Unresolved.
8. **LinkedIn native PDF vs. external link:** Native upload confirmed to perform better — no further research needed on this; always use native upload.

---

## Prior Decisions

- **Carousel-first on LinkedIn** (not video-first — algorithm data confirmed 2026-03-26)
- **PDF must be uploaded natively** to LinkedIn — not linked externally
- **No Pillar 3 (Buyer Education) on Facebook** — organic reach too low; groups/Reels only on Facebook
- **Pillar 4 (Realtor Resources) is LinkedIn-only** — B2B content, professional context only
- **Pillar 5 (Personal Brand) leads on Instagram**, secondary on LinkedIn (text-only)
- **Austin market data source:** Unlock MLS (unlockmls.com/stats) — pull every Thursday, publish Friday
- **Proceed with draft pillar framework** — condition met: 2 sessions passed without account audit data (decision made 2026-03-27 AM)
- **Cross-posting Facebook from Instagram** — efficiency play, not standalone strategy
- **No external links in Facebook/Meta captions** — first comment or bio only

---

## Content Insights

- LinkedIn PDF carousels: 12-slide structure — Hook (slide 1) → single insight or 3 bullets per slide (slides 2–10) → TL;DR summary (slide 11) → CTA + NMLS# 513013 (slide 12). Dark background + gold text for financial services.
- Instagram Reels: 3-second hook critical. Design for DM shareability — that's the #1 algorithm trigger. No TikTok watermarks (kills reach). Use keywords in captions, not hashtag stacks.
- Facebook: Local market data (inventory, median price, days on market) outperforms generic content. Phone-shot video outperforms branded. Groups surface content that pages can't.
- Client milestone posts (closings, first home wins) earn highest organic reach on Instagram.
- Replying to comments is the single most untapped lever — needs to be a 5-minute daily habit.
- Authenticity beats production value on every platform in 2026.
- Austin-specific data is a durable competitive advantage — no national LO can replicate it.

---

## Compliance Reference

**NMLS:**
- NMLS# 513013 required on ALL social profiles and bios
- Required on every post involving rates or loan terms (Pillar 1 — Rate Education; any post mentioning specific rates)
- Profiles missing NMLS# are considered incomplete by examiners — enforcement risk

**RESPA:**
- Zero tolerance for "thing of value" in exchange for referrals — no contests, no giveaways for leads
- No de minimis threshold — any prize for a lead is a violation
- Co-marketing with realtors must be distributed to general public — not targeted to specific consumers
- Realtor partner content (Pillar 4) must never imply quid pro quo arrangement

**TILA / APR:**
- Mentioning a specific rate, down payment %, or finance charge = advertisement = APR disclosure required
- Illustrative rates must include disclaimer: "illustrative only, not a live quote"
- "Guaranteed approval" or "best rates guaranteed" language is prohibited

**Equal Housing:**
- Equal Housing Lender logotype or language required on all visual posts where rates appear (Instagram, Facebook visuals)

**FTC / Testimonials:**
- Paid or incentivized testimonials must be disclosed

**Record Retention:**
- Archive all social media business communications for 3 years minimum (FINRA requirement)

**5 HIGH-RISK POSTS in calendar:** All rate-related. Must clear manual compliance check before queuing in Publer.

---

## Briefing for Builder Subagent

### Voice Guide Reminders
- Adam's voice: short punchy sentences, conversational, raw, vulnerable without being soft
- No therapy tone, no inspiration, no fluff
- Challenge weak ideas — don't just validate
- Faith-driven but not preachy
- Business name: "Adam Styer | Mortgage Solutions LP" — never "The Styer Team"
- Write like a human, not a brand account

### Compliance Must-Haves (per post)
- Rate-related posts (Pillar 1 and any post mentioning specific rates): NMLS# 513013 + APR disclosure required
- All visual posts with rates: include "Equal Housing Lender"
- All posts: never "guaranteed approval," never "best rates guaranteed"
- High-risk posts (5 in calendar): flag for manual Reviewer check — do not auto-queue

### Format Specs Per Platform
**LinkedIn:**
- PDF carousel: 12 slides, uploaded natively (not linked)
- Slide 1: bold hook
- Slides 2–10: single insight or 3 bullets per slide
- Slide 11: TL;DR
- Slide 12: CTA + NMLS# 513013
- Visual: dark background, gold text (financial services branding)
- Caption: under 150 characters, mobile-first
- Hashtags: 3 or fewer
- Best day: Wednesday 4pm for Pillar 4; Monday for Pillar 1

**Instagram:**
- Reels (Pillar 1, Pillar 5): hook in first 3 seconds, design for DM shareability
- Carousels (Pillar 2, Pillar 3): engagement format for existing followers
- No TikTok watermarks — kills reach
- Captions use keywords, not hashtag stacks (3–5 hashtags max)
- Include loan app link in Reel caption (clickable as of 2026)
- Best day: Thursday 9am

**Facebook:**
- Cross-post from Instagram — do not create standalone copy
- External links in FIRST COMMENT only — never in caption
- Reels get more surface area than static posts
- Best day: Thursday 9am

### What Week 1 Needs to Produce (Posts 1–7, April 6–10)
Based on the 30-day calendar skeleton already built:
- Post 1 (Mon Apr 6): Rate Education — LinkedIn PDF carousel + Instagram Reel
- Post 2 (Wed Apr 6/8): Realtor Resources — LinkedIn only
- Post 3 (Wed Apr 8): Personal Brand — Instagram video + LinkedIn text
- Post 4 (Fri Apr 10): Austin Market Data — LinkedIn carousel + Instagram carousel + Facebook cross-post
- Remaining slots TBD per calendar skeleton

Builder needs to draft copy and carousel content for each. Pull the calendar skeleton from the specs folder before starting.

### Pitfalls from Prior Sessions
- Facebook link placement is the #1 mistake — external links in captions tank reach. First comment only.
- Do not upload LinkedIn carousels as image series — must be PDF for algorithm to treat as carousel
- Instagram hashtag stacks are dead since Dec 2024 — keywords in caption text matter more
- Don't create standalone Facebook copy — cross-post from Instagram for efficiency
- Rate posts without NMLS# and APR disclosure are a compliance violation — flag, don't skip
- Do not use "The Styer Team" anywhere
