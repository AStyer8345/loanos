# NotebookLM Pull Report — 2026-04-04 AM
Active Topic: Week 6 Content Build — Rate update distribution, TIMELY refresh check, new content cycle

## What We Already Know

**Platform priorities:**
- LinkedIn is highest-ROI platform for LO (realtor audience + buyer audience). PDF carousels earn 278% more engagement than video. Expert commentary earns 6x more than promotional posts.
- Instagram: Reels for discovery (36% more reach), carousels for engagement (109% more per person reached). Clickable link overlays in Reels captions now available.
- Facebook: Native images perform best. Hyper-local content and visual checklists win. Organic page reach still 1-2% — use Reels and Groups to bypass.
- Universal: Reply to comments (30% LinkedIn lift, 42% Threads lift). Keyword-rich captions now better than hashtag stacking. Link-in-first-comment protocol.

**Compliance rules (hardcoded):**
- NMLS# 513013 on all rate-related content
- No specific rates without APR disclosure — directional language only in most posts
- Equal Housing Lender on visual posts
- Instagram hashtag limit officially 3-5 per post in 2026

**Content database status:**
- Week 5 + Liberation Day: 7 posts (29–35) confirmed in social_drafts, status=draft
- Posts 24–25: FOMC TIMELY templates, due April 29 — placeholders unfilled (correct state)
- Posts 1–21 (Weeks 1–3): Still missing from database — decision deferred to Adam
- Post 30 (Liberation Day Instagram): Scheduled April 4, 9 AM CDT — today. No placeholders. Rate data confirmed accurate (6.25% real-time, Apr 3 PM verification)

## Open Questions

1. **Weeks 1–21 decision**: Rebuild or skip? Full copy exists in build reports. Agent can insert via MCP if Adam confirms.
2. **NMLS# profile audit**: Still outstanding on all 4 platforms. Blocks all posts going live.
3. **Canva assets**: Posts 30, 31, 34 need visuals. Adam has design briefs.
4. **Post 32 Reel**: Adam needs to film (self-employed hook, 30 sec).
5. **PCE/GDP April 30**: No template drafted yet for second TIMELY event that week. Open for Week 6 Architect to address.
6. **VA content social proof**: Anonymous veteran borrower story — Adam hasn't confirmed availability.

## Prior Decisions

- EVERGREEN/TIMELY classification system: active and working
- Directional language only (no specific rates in posts) unless APR disclosure included
- All posts to social_drafts via MCP SQL insert — curl to Supabase REST API DNS fails from agent env
- Publer direct upload also DNS fails — Adam runs curl commands from local terminal for scheduling
- No live posting from agent — ever
- Liberation Day tariff content: approved angle, data confirmed accurate as of April 3 PM

## Content Insights

- Liberation Day tariff posts (29–30) have strong narrative hook (counterintuitive angle: tariffs → rates DROP)
- Self-employed mortgage content (Post 31 carousel, Post 32 Reel) is high-relevance for Austin market
- Condo content (queued for Week 6 via repost queue) is underserved topic — warrantable vs non-warrantable angle is unique
- Rate snapshot posts (Instagram static) earn high saves when visual is strong — Canva brief needed

## Briefing for Research Subagent

Already established — do NOT re-research:
- Instagram hashtag strategy (settled: 3-5 per post, keyword-rich captions)
- LinkedIn carousel structure (settled: 12 slides, bold hook, data-driven)
- Compliance rules (settled: NMLS#, EHL, APR requirements)
- Liberation Day tariff rate narrative (researched Apr 2–3, confirmed accurate)

**Research gaps to focus on for Week 6:**
1. Austin housing market data — April 2026 spring market stats (inventory, median price, DOM) — for market update post
2. Current buyer sentiment / affordability data — fresh stats for Week 6 buyer education post
3. Self-employed mortgage qualification nuances — what are the top mistakes self-employed buyers make? (supplements Post 31 carousel, extends the series)
4. Condo financing red flags / HOA audit checklist — supports the condo repost queue entry

---

## PM Session Addendum — 2026-04-04 PM
Active Topic: Week 7 Content Build (Posts 43–49, April 20–24, 2026)

### Additional Context From NotebookLM
- Down payment myths are the #1 buyer blocker in Austin — "20% required" myth still prevalent
- PCE/GDP April 30 TIMELY template is still unbuilt — high opportunity for Week 7
- "Waiting for 4% rates" buyer hesitation angle is untouched and high-potential
- Buyer concession/seller-pay strategy is strong realtor-facing content for current market
- Week 6 average quality 7.6/10, all approved — system is performing well

### Briefing for Week 7 Research
Do NOT re-research: Austin market stats (April 1 data still current), Liberation Day tariff, LinkedIn algorithm, condo financing (just built)

**Week 7 research focus:**
1. Down payment program specs: FHA 3.5%, conventional 3–5%, VA 0% — confirm current minimums
2. PCE/GDP April 30: what does it measure, why does it matter for mortgage rates?
3. Any April 4 afternoon rate movement (tariff court ruling impact)
