# NotebookLM Pull Report — 2026-04-05 AM
Active Topic: Week 8 Content Build — Posts 50–56 (Analytics + Optimization + Repost Repurposing)

## What We Already Know

**Platform Performance:**
- LinkedIn PDF carousels dominate with 21.77% median engagement (3× vs. video or images)
- Instagram Reels are the discovery driver — hook must land in first 3 seconds
- Facebook performs best with conversational text + link format
- Phone-shot vertical video outperforms high-production clips (unpolished = authentic)
- Expert commentary on industry news earns 6× more engagement than promotional posts

**Adam's Content Program — Current State:**
- 49 posts approved and in social_drafts (Weeks 4, 6, 7 confirmed; Weeks 1–3 still missing from DB)
- Week 8 is the final week of the initial 30-day build cycle
- Post 46 (PCE/GDP TIMELY) due April 30 — Refresh agent fills on morning of April 30
- Posts 24–25 (FOMC TIMELY) due April 29 — Refresh fills after 2 PM ET decision
- Content repost queue now has 4 new items from April 3–4 website content

**Compliance & Blockers:**
- NMLS# 513013 profile audit still outstanding — this blocks posts going live (Adam action item)
- All posts with specific rates require NMLS# and APR disclosure
- Visual posts require Equal Housing Lender in caption or image

## Open Questions

- Weeks 1–3 (Posts 1–21) still missing from Supabase — rebuild or skip? (Adam has not answered)
- Instagram hashtag spec conflict: pull report says 3-5, reviewer spec says 5-10 — needs resolution
- No platform analytics data available — can't measure what's actually performing (pre-launch)
- Content repost queue items: should any of these be woven into Week 8 or held for Week 9?

## Prior Decisions

- EVERGREEN/TIMELY split: all rate/economic posts are TIMELY templates; education/story/personal = EVERGREEN
- Publer is the scheduling tool — API fires drafts only, never publishes live
- Social_drafts Supabase inserts only work reliably via MCP (curl from agent env has DNS failure)
- No Canva assets can be auto-generated — briefs are written for Adam to execute in Canva
- No actual Publer API calls from agent environment — curl commands written for Adam to run locally

## Content Insights

- Story posts (personal, specific, real numbers) score highest in quality reviews (Post 45 = 9/10)
- Myth-bust format performs well across all platforms for mortgage education
- Hot-take format (<80 words, strong stance) works for LinkedIn and Instagram
- "The Jessica Test": if a template admin could have written it without Adam's real voice, rewrite it
- Austin market data posts are effective but need REAL stats (Unlock MLS) — placeholders kill credibility

## Briefing for Research Subagent

**Already covered — do NOT re-research:**
- Down payment myths and programs (Posts 43–44, 49)
- PCE/GDP context (Post 46)
- VA loan myths (Posts 22–23)
- 2-1 buydown math and realtor resources (Posts 26–28)
- FOMC rate decision context (Posts 24–25)
- Self-employed mortgage (blog post just published — repost queue)
- Condo warrantability (recent content — repost queue)

**Research gaps for today (Week 8 focus):**
- Current rate environment for TIMELY template (rates moved this week after tariff/jobs data)
- Any upcoming economic events in the April 7–11 window
- Analytics/optimization angles: what metrics matter for mortgage LOs on social media
- Any new CFPB or FTC guidance relevant to mortgage social marketing (compliance deep dive optional)

## Architect Guidance for Week 8

**Content pillars to prioritize:**
- Analytics + Optimization (closing out the 30-day cycle)
- Platform-native reposts from content-repost-queue.md (self-employed, condo, Austin market, rate update)
- At least 1 personal/story post (MANDATORY per spec)
- At least 1 hot-take (no CTA, <80 words)
- At least 1 Reel script (Adam on camera)

**Avoid:** Another myth-bust post (already 3 this week in Week 7), another pure education post without story
