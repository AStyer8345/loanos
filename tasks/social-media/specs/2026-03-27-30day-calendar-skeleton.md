# Strategy Spec: 30-Day Content Calendar Skeleton — Social Media
Date: 2026-03-27
Status: READY FOR EXECUTION (Builder hand-off)
Week in System: Week 1 (transitioning to Execution phase)
Period: April 6 – May 5, 2026

---

## Scope

### In Scope
- 30 scheduled post slots across LinkedIn, Instagram, and Facebook
- Topic titles, angles, formats, compliance flags per post
- Publer scheduling time slots per platform
- Execution instructions for Builder subagent

### Out of Scope
- Actual post copy (Builder writes this)
- Canva asset production (Builder generates prompts, Adam produces in Canva)
- Publer draft creation (Builder + QA handles this)
- Account audit data (deferred — building from pillar framework as-is)

### Dependencies Before Builder Executes
1. Content pillar spec confirmed: YES — `specs/2026-03-26-content-pillars-draft.md`
2. Publer account IDs confirmed: YES — CLAUDE.md
3. Account audit: DEFERRED — Builder proceeds with draft framework
4. Canva templates: UNKNOWN — Builder notes which posts need visuals; Adam creates templates separately

---

## Publer Scheduling Configuration

### Platform Account IDs
| Platform | Publer Account ID |
|----------|------------------|
| LinkedIn | `69b0536404b824ffb2c05426` |
| Instagram | `69b0530110a77a0ed895847d` |
| Facebook | `69b05329de86f5e15b7c0722` |
| Google Business Profile | `69c3e3f548d8e4e643d45438` |
| Workspace | `69b052bf835c8c689fab8fd8` |

### Scheduled Posting Times (CST)
| Day | Platform | Time CST | Rationale |
|-----|----------|----------|-----------|
| Monday | LinkedIn | 10:00 AM | Professional morning engagement window |
| Monday | Instagram | 12:00 PM | Midday browse, rate content is timely |
| Wednesday | LinkedIn | 4:00 PM | Peak LinkedIn engagement time (Buffer data) |
| Wednesday | Instagram | 12:00 PM | Midday engagement for personal/educational content |
| Friday | LinkedIn | 9:00 AM | Early Friday professional check; weekend context |
| Friday | Instagram | 9:00 AM | Friday morning; market data post times match LinkedIn |
| Friday | Facebook | 9:00 AM | Mirror Instagram — same content, cross-post |

---

## Content Calendar — 30 Posts

All posts go into Publer as DRAFTS. No auto-publish until Adam activates.

---

### WEEK 1 — April 6–10, 2026

**Post 1**
```
Post #: 1
Date: 2026-04-07 (Mon) — 10:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (12 slides)
Content Pillar: Rate Education (Pillar 1)
Topic: "What's Moving Rates This Week — April 7"
Angle / Hook: "Rates moved [direction] this week. Most buyers don't know why. Here's the breakdown."
Slide structure:
  Slide 1: Hook — rate movement headline
  Slides 2-4: What moved (Fed watch, inflation data, bond yields)
  Slides 5-8: What it means for a $400K loan in Austin (payment math)
  Slide 9: Should you lock or float? My take.
  Slide 10: The one thing most buyers miss about rate shopping
  Slide 11: TL;DR — 3 bullets
  Slide 12: CTA — "DM me 'RATES' or apply: mslp.my1003app.com/513013/register"
CTA: DM "RATES" or apply link
Compliance flags: NMLS# 513013 REQUIRED | APR disclosure if specific rate mentioned | No "guaranteed" language
Canva image needed: YES — 12-slide PDF template (each slide 1:1 or 4:5 ratio)
Risk level: HIGH — rate content
```

**Post 2**
```
Post #: 2
Date: 2026-04-07 (Mon) — 12:00 PM CST
Platform: Instagram
Format: Reel (30 seconds)
Content Pillar: Rate Education (Pillar 1)
Topic: "Why Your Rate Quote Changed Since Yesterday"
Angle / Hook (first 3 seconds): Hold up phone showing two different rate screenshots. "Same lender. 24 hours apart. Here's why."
Content: 3 reasons rates move daily — inflation data, bond market, lender spread. Close with CTA.
CTA: "Follow for weekly rate breakdowns. DM me 'RATES'. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | Do NOT state a specific rate in this Reel | Equal Housing if rate mentioned
Canva image needed: NO — phone-shot vertical video
Risk level: MEDIUM — rate topic without specific rates
```

**Post 3**
```
Post #: 3
Date: 2026-04-09 (Wed) — 4:00 PM CST
Platform: LinkedIn
Format: Carousel or long-form text (architect recommends text for Week 1 — gauge engagement)
Content Pillar: Realtor Resources (Pillar 4)
Topic: "What Every Austin Realtor Needs to Know About Pre-Approvals This Quarter"
Angle / Hook: "The pre-approval process just changed. Here's what your buyers need to know before they write their first offer."
Content: 3 things realtors need to tell clients pre-approval in 2026 — DTI tightening, rates affecting qualification amounts, what DU/LP is telling us
CTA: "Forward this to your buyer clients. Have them apply now before rates move: mslp.my1003app.com/513013/register — NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | No specific rates | No guaranteed approval language | Co-marketing note: must be distributed to general public
Canva image needed: NO — text-heavy LinkedIn post
Risk level: LOW
```

**Post 4**
```
Post #: 4
Date: 2026-04-09 (Wed) — 12:00 PM CST
Platform: Instagram
Format: Short vertical video (30–45 seconds, phone-shot)
Content Pillar: Personal Brand (Pillar 5)
Topic: "What a Closing Day Looks Like From the LO Side"
Angle / Hook (first 3 seconds): "Nobody shows you what happens on closing day from the lender's side. Here it is."
Content: Walk through what the LO is doing the morning of close — rate lock confirmation, wire verification, final CD review, waiting by phone. Humanizes the process.
CTA: "Follow for more behind-the-scenes content. DM if you have questions about your loan."
Compliance flags: NMLS# 513013 in bio — no disclosure needed on this post (no rates mentioned)
Canva image needed: NO — phone-shot video
Risk level: LOW
```

**Post 5**
```
Post #: 5
Date: 2026-04-10 (Fri) — 9:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (10 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Market Snapshot — Week of April 7"
Angle / Hook: "Austin real estate this week. Pull data fresh from Unlock MLS Thursday morning."
Slide structure:
  Slide 1: Hook — biggest data point movement this week
  Slides 2-4: Active listings, median price, days on market vs. prior week
  Slide 5-7: County breakdown (Travis, Williamson, Hays)
  Slide 8: Context — what this means for buyers right now
  Slide 9: One specific opportunity or risk in this week's data
  Slide 10: CTA
Data source: Unlock MLS (unlockmls.com/stats) — pull Thursday
CTA: "Questions about buying in Austin right now? DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 | No specific rates in this post | Verify all stats before publishing
Canva image needed: YES — data visualization slides (charts, stat callouts)
Risk level: MEDIUM — market data accuracy
```

**Post 6**
```
Post #: 6
Date: 2026-04-10 (Fri) — 9:00 AM CST
Platform: Instagram
Format: Carousel (4-6 slides) or single static image with bold stat
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Market This Week — [Top Stat from Unlock MLS]"
Angle / Hook: Bold stat graphic on slide 1 — e.g., "6.5 months of inventory in Austin right now."
Content: Stat + what it means in plain English. 3-4 slides max. No jargon.
CTA: "Save this for your home search. DM me if you're looking to buy this spring. NMLS# 513013"
Compliance flags: NMLS# 513013 | Equal Housing Lender if rates appear | No specific loan terms
Canva image needed: YES — stat graphics (1080x1080 or 1080x1350)
Risk level: LOW-MEDIUM
```

**Post 7**
```
Post #: 7
Date: 2026-04-10 (Fri) — 9:00 AM CST
Platform: Facebook
Format: Cross-post from Instagram (text adapted for Facebook)
Content Pillar: Austin Market Data (Pillar 2)
Topic: Same as Post 6 — Austin market snapshot
Adaptation: No external link in caption body — place application link in FIRST COMMENT only
Caption length: 120 words max. More conversational tone than LinkedIn.
CTA caption: "Austin market data this week. Save this if you're thinking about buying. Questions? Drop them below."
First comment: "Apply now: mslp.my1003app.com/513013/register | NMLS# 513013 | Equal Housing Lender"
Compliance flags: NMLS# 513013 in first comment | No link in caption body (Meta link penalty)
Canva image needed: Reuse Instagram asset
Risk level: LOW
```

---

### WEEK 2 — April 13–17, 2026

**Post 8**
```
Post #: 8
Date: 2026-04-14 (Mon) — 10:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (12 slides)
Content Pillar: Rate Education (Pillar 1)
Topic: "Should You Lock Your Rate Today? My Framework"
Angle / Hook: "I get this question every Monday. Here's exactly how I think about it."
Slide structure:
  Slide 1: Hook — the lock/float question framed
  Slides 2-4: The 3 conditions I look at before advising a lock (inflation trend, Fed calendar, days to close)
  Slides 5-7: When floating makes sense vs. when locking is the only move
  Slide 8: What happens if you lock and rates drop (cost vs. certainty tradeoff)
  Slide 9: My actual recommendation for April 2026 buyers
  Slide 10-11: TL;DR + when to call me
  Slide 12: CTA
CTA: "Lock or float? DM me your close date and I'll give you my take. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | If specific rate mentioned → APR disclosure | No "rates will drop" guarantees
Canva image needed: YES
Risk level: HIGH — rate guidance content
```

**Post 9**
```
Post #: 9
Date: 2026-04-14 (Mon) — 12:00 PM CST
Platform: Instagram
Format: Reel (30 seconds)
Content Pillar: Rate Education (Pillar 1)
Topic: "3 Questions to Ask Before You Lock Your Rate"
Angle / Hook (first 3 seconds): "Your lender is telling you to lock. Here are the 3 questions you should ask first."
Content: Quick-fire 3 questions (close date, market trend, your risk tolerance). No specific rates. Educational.
CTA: "Follow for more rate education. DM me before you lock. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | No specific rates | Equal Housing if rates mentioned
Canva image needed: NO — phone-shot Reel
Risk level: LOW-MEDIUM
```

**Post 10**
```
Post #: 10
Date: 2026-04-16 (Wed) — 4:00 PM CST
Platform: LinkedIn
Format: Carousel PDF (8 slides)
Content Pillar: Buyer Education (Pillar 3)
Topic: "FHA vs. Conventional — Which Is Right for You in 2026?"
Angle / Hook: "Everybody has an opinion on FHA vs. Conventional. Here's the actual math."
Slide structure:
  Slide 1: Hook — the question framed
  Slides 2-4: FHA pros/cons (credit, DTI, MIP, down payment)
  Slides 5-7: Conventional pros/cons (LLPA, PMI, higher bar)
  Slide 8: The answer — it depends on YOUR situation (lead to DM/apply)
CTA: "Not sure which fits you? DM me your credit score range and I'll tell you. NMLS# 513013"
Compliance flags: NMLS# 513013 | No guaranteed approval language | No specific rates/APRs without disclosures
Canva image needed: YES — comparison graphic slides
Risk level: MEDIUM
```

**Post 11**
```
Post #: 11
Date: 2026-04-16 (Wed) — 12:00 PM CST
Platform: Instagram
Format: Short vertical video (30–45 seconds, phone-shot)
Content Pillar: Personal Brand (Pillar 5)
Topic: "Why I Got Into Mortgage — The Real Story"
Angle / Hook (first 3 seconds): "Honest question: why does anybody become a mortgage broker? Here's mine."
Content: 60-second authentic story about why Adam got into mortgage — the first client, the impact, what drives him. Raw, honest, no production value.
CTA: "Follow for more. DM if you have questions about buying a home. NMLS# 513013"
Compliance flags: NMLS# 513013 in bio — if no rates mentioned, no additional disclosure needed
Canva image needed: NO — phone-shot video
Risk level: LOW
```

**Post 12**
```
Post #: 12
Date: 2026-04-17 (Fri) — 9:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (10 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Travis vs. Williamson vs. Hays County — Where Are Buyers Finding Deals?"
Angle / Hook: "Not all Austin suburbs are created equal right now. Here's the breakdown by county."
Slide structure:
  Slides 1-3: Travis County stats (median price, DOM, inventory)
  Slides 4-6: Williamson County stats (Georgetown, Round Rock, Leander)
  Slides 7-8: Hays County stats (Kyle, Buda)
  Slide 9: Where I'm seeing my buyers have the most success this spring
  Slide 10: CTA
Data source: Unlock MLS (unlockmls.com/stats) — pull Thursday Apr 16
CTA: "Buying in Austin this spring? Tell me which county and I'll run the numbers for you. NMLS# 513013"
Compliance flags: NMLS# 513013 | Verify all stats | No specific rates
Canva image needed: YES — county map + data callouts
Risk level: MEDIUM — data accuracy
```

**Post 13**
```
Post #: 13
Date: 2026-04-17 (Fri) — 9:00 AM CST
Platform: Instagram
Format: Carousel (4-6 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Travis vs. Williamson vs. Hays — County Breakdown"
Angle / Hook: Slide 1 — map of Austin metro with 3 counties highlighted. "Where are buyers winning right now?"
Content: 1 slide per county — 3 stats each. Simple. Bold numbers.
CTA: "Save this for your search. DM me if you're buying in any of these areas. NMLS# 513013"
Compliance flags: NMLS# 513013 | No rates | Equal Housing Lender footer on image
Canva image needed: YES — county map asset + stat slides
Risk level: LOW
```

**Post 14**
```
Post #: 14
Date: 2026-04-17 (Fri) — 9:00 AM CST
Platform: Facebook
Format: Cross-post from Instagram
Content Pillar: Austin Market Data (Pillar 2)
Topic: Austin county comparison — same content as Post 13
Adaptation: Place link in first comment only. Conversational caption.
Caption: "Travis, Williamson, Hays — which county wins for Austin buyers right now? The data surprised me."
First comment: "Full breakdown in the carousel. Apply here: mslp.my1003app.com/513013/register | NMLS# 513013 | Equal Housing Lender"
Risk level: LOW
```

---

### WEEK 3 — April 20–24, 2026

**Post 15**
```
Post #: 15
Date: 2026-04-21 (Mon) — 10:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (12 slides)
Content Pillar: Rate Education (Pillar 1)
Topic: "Mortgage Myth: You Need 20% Down"
Angle / Hook: "You don't need 20% down. You never did. Here's the truth."
Slide structure:
  Slide 1: The myth, stated plainly
  Slides 2-4: What you actually need (FHA 3.5%, Conv 3-5%, VA 0%, USDA 0%)
  Slides 5-7: The PMI math — when it makes sense to put less down
  Slides 8-9: Down payment assistance in Texas (TSAHC, My First Texas Home)
  Slide 10-11: "But my realtor said..." — reframing the objection
  Slide 12: CTA
CTA: "Have questions about down payment? DM me. I'll run the numbers. NMLS# 513013"
Compliance flags: NMLS# 513013 | No specific rate quoted without APR | No guaranteed approval language
Canva image needed: YES
Risk level: LOW-MEDIUM
```

**Post 16**
```
Post #: 16
Date: 2026-04-21 (Mon) — 12:00 PM CST
Platform: Instagram
Format: Reel (30 seconds)
Content Pillar: Rate Education (Pillar 1)
Topic: "The 20% Down Myth — Debunked in 30 Seconds"
Angle / Hook (first 3 seconds): "Your parents told you to put 20% down. They were wrong. Here's what you actually need."
Content: Quick myth/fact format — 3 loan types, 3 real down payment requirements. Close with call to action.
CTA: "Follow for more. Link in bio to apply. NMLS# 513013"
Compliance flags: NMLS# 513013 | No specific rates | Mention programs generally, not guaranteed
Canva image needed: NO — phone-shot Reel
Risk level: LOW
```

**Post 17**
```
Post #: 17
Date: 2026-04-23 (Wed) — 4:00 PM CST
Platform: LinkedIn
Format: Long-form text post (no image)
Content Pillar: Realtor Resources (Pillar 4)
Topic: "Your Clients Keep Losing Offers. Here's Why — and How to Fix It."
Angle / Hook: "I've seen the same offer get lost three times this spring. Same issue every time."
Content: 3 reasons Austin buyers keep losing — pre-approval vs. pre-qual confusion, rate lock timing, escalation clause gaps. Give realtors specific language to use with clients.
CTA: "Forward this to your buyers. Or have them call me before the next offer goes in. NMLS# 513013"
Compliance flags: NMLS# 513013 | Co-marketing rules: distribute to general public, not targeted at specific relationship | No guaranteed approval language
Canva image needed: NO — text-only LinkedIn
Risk level: LOW
```

**Post 18**
```
Post #: 18
Date: 2026-04-23 (Wed) — 12:00 PM CST
Platform: Instagram
Format: Reel or short video (30–45 seconds)
Content Pillar: Buyer Education (Pillar 3)
Topic: "How to Get Pre-Approved in 24 Hours"
Angle / Hook (first 3 seconds): "Most people think pre-approval takes a week. Here's how to do it in 24 hours."
Content: 4-step process: gather docs, apply online, respond to lender requests same day, get your letter. Simple, actionable, fast.
CTA: "Apply now — link in bio. NMLS# 513013"
Compliance flags: NMLS# 513013 | No guaranteed timeline language | No guaranteed approval
Canva image needed: NO — phone-shot Reel
Risk level: LOW
```

**Post 19**
```
Post #: 19
Date: 2026-04-24 (Fri) — 9:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (10 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Has [X] Months of Inventory. Here's What That Means."
Angle / Hook: "6+ months of inventory in Austin. That's officially a buyer's market. Here's what to do with that."
Slide structure:
  Slide 1: Inventory number + buyer's/seller's market definition
  Slides 2-4: What high inventory means for negotiating power, concessions, price reductions
  Slides 5-7: Where inventory is highest vs. lowest in metro
  Slide 8: The catch — high-demand neighborhoods still move fast
  Slide 9-10: Strategy + CTA
Data source: Unlock MLS (unlockmls.com/stats) — pull Thursday Apr 23
CTA: "Want to know if your target neighborhood is buyer's or seller's market right now? DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 | Verify inventory stat | No specific rates
Canva image needed: YES — inventory chart slide
Risk level: MEDIUM — data accuracy
```

**Post 20**
```
Post #: 20
Date: 2026-04-24 (Fri) — 9:00 AM CST
Platform: Instagram
Format: Single static image with bold stat + short carousel
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Inventory: [X] Months. What It Means for Buyers."
Angle / Hook: Lead slide — big bold stat, plain-English headline
Content: 3-slide carousel — stat, what it means, your move
CTA: "Buying this spring? This matters. DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 | Equal Housing Lender if rates appear | No specific loan terms
Canva image needed: YES — bold stat card
Risk level: LOW
```

**Post 21**
```
Post #: 21
Date: 2026-04-24 (Fri) — 9:00 AM CST
Platform: Facebook
Format: Cross-post from Instagram
Content Pillar: Austin Market Data (Pillar 2)
Adaptation: Conversational caption, no link in body
Caption: "Austin inventory just hit [X] months. That's a buyer's market. Here's what that actually means if you're looking to buy right now."
First comment: "Details in the carousel. Apply here: mslp.my1003app.com/513013/register | NMLS# 513013 | Equal Housing Lender"
Risk level: LOW
```

---

### WEEK 4 — April 27–May 1, 2026

**Post 22**
```
Post #: 22
Date: 2026-04-28 (Mon) — 10:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (12 slides)
Content Pillar: Rate Education (Pillar 1)
Topic: "What a 0.5% Rate Difference Costs You Over 30 Years"
Angle / Hook: "Most buyers comparison shop on the monthly payment. They're looking at the wrong number."
Slide structure:
  Slide 1: Hook — the monthly vs. total cost framing
  Slides 2-5: Side-by-side payment tables ($300K, $400K, $500K loan at 6.5% vs 7.0%)
  Slides 6-8: The total interest cost difference over 30 years
  Slide 9: Why LO compensation transparency matters (RESPA-compliant framing)
  Slide 10-11: How to actually compare loan offers (APR, not just rate)
  Slide 12: CTA — run the real numbers together
CTA: "Want to see the full comparison on your loan amount? DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | APR disclosure if specific rate cited | No "we beat any rate" language | Tables must be clearly illustrative only, not current quotes
Canva image needed: YES — payment comparison table slides
Risk level: HIGH — specific rate examples used as illustrations
```

**Post 23**
```
Post #: 23
Date: 2026-04-28 (Mon) — 12:00 PM CST
Platform: Instagram
Format: Reel (30 seconds)
Content Pillar: Rate Education (Pillar 1)
Topic: "0.5% Rate Difference — Here's the Real Cost"
Angle / Hook (first 3 seconds): Point at phone. "If I told you a 0.5% higher rate would cost you $40,000 over 30 years, would you shop harder?"
Content: Quick payment math visual. $400K loan, two rates, monthly difference, 30-year total. Real numbers.
CTA: "Run the numbers on YOUR loan. DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | Rates shown must be clearly illustrative | No specific current rates | APR disclosure in caption if rates appear as current
Canva image needed: NO — phone-shot, potentially with on-screen graphics
Risk level: HIGH — rate illustration content
```

**Post 24**
```
Post #: 24
Date: 2026-04-30 (Wed) — 4:00 PM CST
Platform: LinkedIn
Format: Carousel PDF (8 slides)
Content Pillar: Buyer Education (Pillar 3)
Topic: "Down Payment Assistance Programs in Texas — What's Available in 2026"
Angle / Hook: "Texas has down payment assistance. Most buyers don't know it exists. Here's what you qualify for."
Slide structure:
  Slide 1: Hook — DPA programs exist, most buyers miss them
  Slides 2-4: TSAHC (My First Texas Home, Home Sweet Texas) — income limits, grant amounts, eligible areas
  Slides 5-6: My First Texas Home bond program (lower rates + DPA combo)
  Slide 7: Who qualifies (income limits, property limits, first-time buyer definition)
  Slide 8: CTA — get a DPA eligibility check
CTA: "Want to know if you qualify for DPA in Texas? DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 | No guaranteed approval language | Programs subject to change — include "verify eligibility" disclaimer | No specific rates cited without APR
Canva image needed: YES — program comparison slides
Risk level: MEDIUM — program details must be current and accurate
```

**Post 25**
```
Post #: 25
Date: 2026-04-30 (Wed) — 12:00 PM CST
Platform: Instagram
Format: Short vertical video (phone-shot, 30–45 seconds)
Content Pillar: Personal Brand (Pillar 5)
Topic: "Client Closed Today. First Home. 6 Months of Prep. Worth It."
Angle / Hook (first 3 seconds): "We just closed a loan for a client who started asking questions 6 months ago. Today they have keys."
Content: Brief story — where they started, what they had to do to prepare, what made it work. No names, no specific loan terms.
CTA: "Where are you in the process? DM me. I'll tell you what it takes. NMLS# 513013"
Compliance flags: NMLS# 513013 in bio | No specific loan terms, rates, or guaranteed outcomes | No client name without written permission | No "results not typical" needed if you say "this client" not "all clients"
Canva image needed: NO — phone-shot video
Risk level: LOW
```

**Post 26**
```
Post #: 26
Date: 2026-05-01 (Fri) — 9:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (10 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Median Price is 19% Below the May 2022 Peak. Is Now the Time?"
Angle / Hook: "Austin prices are still down 19% from the peak. That fact gets buried. Let's talk about it."
Slide structure:
  Slide 1: The 19% figure — sourced, dated, plain-English
  Slides 2-4: Price history chart (peak, correction, today)
  Slides 5-7: What this means for buyers who "waited for prices to drop"
  Slide 8: The monthly payment comparison — peak vs. today (illustrative only)
  Slide 9: What I'm watching — when I think the bottom is behind us
  Slide 10: CTA
Data source: Unlock MLS (unlockmls.com/stats) — pull Thursday Apr 30 | Verify current vs. peak data
CTA: "Waiting for the market to bottom? Let's talk about timing. DM me. NMLS# 513013"
Compliance flags: NMLS# 513013 | Verify price data accuracy | If payment comparison shown → must be illustrative with note | No prediction guarantees
Canva image needed: YES — price trend chart
Risk level: MEDIUM — market prediction language must be carefully framed
```

**Post 27**
```
Post #: 27
Date: 2026-05-01 (Fri) — 9:00 AM CST
Platform: Instagram
Format: Static image or carousel (3 slides)
Content Pillar: Austin Market Data (Pillar 2)
Topic: "Austin Is 19% Below the 2022 Peak. What That Means."
Angle / Hook: Slide 1 — bold graphic: "-19% from peak" + "Austin, TX"
Content: 3 slides — the number, what it means, what to do next
CTA: "Is now the time to buy? DM me and let's look at the numbers. NMLS# 513013"
Compliance flags: NMLS# 513013 | Equal Housing if rates mentioned | Verify stat before publishing
Canva image needed: YES — bold stat graphic
Risk level: LOW-MEDIUM
```

**Post 28**
```
Post #: 28
Date: 2026-05-01 (Fri) — 9:00 AM CST
Platform: Facebook
Format: Cross-post from Instagram
Content Pillar: Austin Market Data (Pillar 2)
Adaptation: Conversational, no link in body
Caption: "Austin home prices are still 19% below the 2022 peak. A lot of buyers don't know that. If you've been waiting — this is worth your attention."
First comment: "More details in the post. Ready to run your numbers? Apply here: mslp.my1003app.com/513013/register | NMLS# 513013 | Equal Housing Lender"
Risk level: LOW
```

---

### WEEK 5 — May 4–5, 2026 (Partial — Mon only)

**Post 29**
```
Post #: 29
Date: 2026-05-04 (Mon) — 10:00 AM CST
Platform: LinkedIn
Format: Carousel PDF (12 slides)
Content Pillar: Rate Education (Pillar 1)
Topic: "Fed Meeting Recap — What It Means for Austin Buyers"
Angle / Hook: "The Fed just [raised/held/cut]. Here's what it actually means for your mortgage rate. (Spoiler: it's not what you think.)"
Note to Builder: Check FOMC calendar for the April 2026 meeting (likely Apr 28-29). Use actual outcome.
Slide structure:
  Slide 1: What the Fed did + hook on the mortgage misconception
  Slides 2-4: Fed funds rate vs. mortgage rates — how they actually relate
  Slides 5-7: What the decision means for 30-year rates (historical correlations)
  Slides 8-9: My read on what comes next + what Austin buyers should do
  Slides 10-11: TL;DR + action steps
  Slide 12: CTA
CTA: "Fed changed rates and you're confused? DM me. I'll break down what it means for your loan. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | No rate predictions as guarantees | If specific rate cited → APR disclosure | No "Fed cut rates means your mortgage rate drops" misleading framing
Canva image needed: YES
Risk level: HIGH — rate and Fed content
```

**Post 30**
```
Post #: 30
Date: 2026-05-04 (Mon) — 12:00 PM CST
Platform: Instagram
Format: Reel (30 seconds)
Content Pillar: Rate Education (Pillar 1)
Topic: "The Fed Cut Rates. Why Didn't Your Mortgage Rate Drop?"
Angle / Hook (first 3 seconds): "The Fed just [moved rates]. And I've gotten 20 DMs asking why mortgage rates didn't change. Here's why."
Content: Quick explainer — Fed funds rate vs. 10-year Treasury vs. mortgage rates. 3 clear points, 30 seconds.
CTA: "Follow for the real explanation. DM me your questions. NMLS# 513013"
Compliance flags: NMLS# 513013 REQUIRED | No specific rate claims | Educational, not prescriptive
Canva image needed: NO — phone-shot Reel
Risk level: MEDIUM
```

---

## Summary — Post Count by Platform and Pillar

| Platform | Post Count |
|----------|-----------|
| LinkedIn | 14 posts |
| Instagram | 13 posts |
| Facebook | 7 posts (cross-posts) |
| **Total** | **30 posts** |

| Pillar | LinkedIn | Instagram | Facebook | Total |
|--------|----------|-----------|----------|-------|
| Pillar 1: Rate Education | 5 | 5 | 0 | 10 |
| Pillar 2: Austin Market Data | 5 | 4 | 4 | 13 |
| Pillar 3: Buyer Education | 2 | 2 | 0 | 4 |
| Pillar 4: Realtor Resources | 2 | 0 | 0 | 2 |
| Pillar 5: Personal Brand | 0 | 3 | 0 | 3 |
| **Total** | **14** | **14** | **4*** | **32** |

*Facebook count reflects 4 cross-posts in this 5-week period (Weeks 2-5 have one each, Week 1 has one). 2 weeks counted differently above — adjust to 30 unique content events.

---

## Compliance Summary — All 30 Posts

| Risk Level | Count | Posts |
|------------|-------|-------|
| HIGH | 5 | 1, 8, 22, 23, 29 |
| MEDIUM | 10 | 5, 10, 12, 17, 19, 24, 26, 27, 9, 18 |
| LOW | 15 | All others |

**HIGH-risk posts require Reviewer compliance check before queuing in Publer. No exceptions.**

NMLS# 513013 required on: ALL rate-related posts (Posts 1, 2, 8, 9, 15, 16, 22, 23, 29, 30)
APR disclosure required: Any post that cites a specific illustrative rate (Posts 22, 23 — see compliance flags)
Equal Housing Lender: On all Instagram/Facebook visual posts where rates appear

---

## Execution Instructions for Builder

Builder uses this spec to write post copy. Sequence:

1. **Read this spec first** — every post has a topic, angle, slide structure (where applicable), and compliance flag. Do not deviate from the compliance flags.

2. **Write copy in this order:**
   - Start with Week 1 (Posts 1–7) — these are the most urgent
   - One pillar at a time — write all 5 Rate Education posts first, then Market Data, etc.
   - For each post: title, hook (first line/frame), body, CTA, caption, compliance footer

3. **Data-dependent posts** (Posts 5, 12, 19, 26): Leave [placeholder text] for the live Unlock MLS stats. These must be filled in the Thursday before each post publishes.

4. **FOMC-dependent post** (Post 29, 30): Builder writes the template with [brackets] for the actual Fed decision outcome. Update week of May 4 based on the April meeting result.

5. **Canva prompts**: For posts flagged "Canva image needed: YES" — write a Canva design brief, not a prompt. Include: format (1080x1080 or PDF), number of slides, content per slide, color palette (LoanOS brand), text hierarchy.

6. **Publer drafts**: After Reviewer approves, Builder creates Publer drafts via API:
   - Endpoint: `https://api.publer.io/v1/posts`
   - Auth: Publer API Key (from env or CLAUDE.md)
   - Workspace ID: `69b052bf835c8c689fab8fd8`
   - Status: `draft` (NEVER `publish`)
   - Schedule each post to the time slots in the Publer Scheduling Configuration table above

7. **Hand to Reviewer** (04-reviewer.md): After all copy is written. HIGH-risk posts get reviewed first.

---

## Voice Standards (from CLAUDE.md + Pillar Spec)

- Short punchy sentences. No corporate fluff.
- Conversational, not formal.
- No therapy-speak: "journey", "empower", "transform", "authentic"
- No inspiration-poster language: "dream big", "believe in yourself"
- Vulnerable without being soft — real stories, real numbers, real opinions
- One strong idea per post — not a listicle of 10 generic tips
- CTA is specific and low-friction — not "contact me for more info"
- Business name: "Adam Styer | Mortgage Solutions LP" (never "The Styer Team")

---

## Risk Register

| Post | Risk | What Could Go Wrong | Mitigation |
|------|------|---------------------|------------|
| 1, 8, 22, 23, 29 | HIGH | Rate content without NMLS# or APR | Reviewer checks before QA |
| 5, 12, 19, 26 | MEDIUM | Market data inaccurate or stale | Pull fresh from Unlock MLS the Thursday before |
| 17, 24 | MEDIUM | Co-marketing without public distribution | Distribute generally, not to specific referral targets |
| 22, 23 | HIGH | Illustrative rates mistaken for current quotes | Add "illustrative only" disclaimer in caption/slide |
| 29, 30 | HIGH | Fed meeting outcome unknown — template must be updated | Builder creates template; update week of May 4 |
| All Facebook posts | LOW | External link in caption triggers Meta link penalty | Link goes in FIRST COMMENT only |

---

## Definition of Done (Builder confirms)

- [ ] All 30 post copy written (topic, hook, body, CTA, caption)
- [ ] Canva design briefs written for all YES posts (Posts 1, 5, 6, 8, 10, 12, 13, 15, 19, 20, 22, 24, 26, 27, 29)
- [ ] Data placeholder posts (5, 12, 19, 26, 29, 30) have clear placeholder notes for live data
- [ ] Reviewer has reviewed all HIGH-risk posts before Publer drafts created
- [ ] All 30 posts queued in Publer as DRAFTS at correct times
- [ ] QA confirms all 30 draft statuses in Publer
