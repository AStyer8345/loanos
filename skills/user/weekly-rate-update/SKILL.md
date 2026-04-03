---
name: weekly-rate-update
description: >
  Generate Adam Styer's weekly rate update for real estate agents — a text message version,
  website landing page content with the full rate table and market commentary, and a simple
  teaser email that drives agents to the website. Use this skill whenever Adam mentions
  "rate update", "rate text", "weekly rates", "send rates out", "rate sheet", "what are rates",
  or anything about sending current mortgage rate information to his agent partners. Even
  casual mentions like "rates moved this week, let me send something out" or "here are this
  week's rates" should trigger this skill. Always use it when Adam provides mortgage rate data
  and wants to distribute it to real estate agents.
---

# Weekly Rate Update Generator

Adam's rate update system has three outputs:

1. **Text message** — short, punchy, rates + blurb. Agents need this on their phone for
   quick reference during buyer conversations. This stays as a standalone text.
2. **Website content** — the full rate table with market commentary, formatted for Adam's
   website. This is what the teaser email links to.
3. **Teaser email** — simple plain text email that goes through Jungo. A hook about what's
   happening with rates + a link to the full breakdown on the website.

The text message gives agents the numbers. The website gives them the context. The teaser
email drives them to the website (retargeting pixels fire, SEO value, professional presentation
without HTML email headaches).

## Workflow

1. Adam provides this week's rates (just the rate percentages)
2. Calculate APR for each product using the formulas in `references/apr-calculations.md`
3. Search the web for this week's mortgage rate news and movement (Mortgage News Daily, Freddie Mac, Fed commentary)
4. Generate the text message version
5. Generate the website content (rate table + expanded market commentary)
6. Generate the teaser email
7. Save all three outputs to the outputs folder
8. Provide computer:// links to all files

Do NOT ask clarifying questions unless rates are genuinely missing or ambiguous. Adam wants speed.

## Rate Input Format

Adam will typically provide rates in a loose format like:
- "Conv 30 5.875, 15yr 5.25, Jumbo 6.125, VA 5.375, FHA 5.375, FHA ARM 4.75"
- Or he may type them out more formally
- He may include some but not all products — only include what he provides
- He may or may not include the national 30-year average — if he doesn't, look it up via web search (Freddie Mac PMMS, released Thursdays)

The standard product lineup (adjust if Adam provides different products):
- 30-yr Fixed Conventional (Primary)
- 15-yr Fixed
- 30-yr Jumbo
- VA 30-yr
- FHA 30-yr
- FHA 5-yr ARM

## APR Calculation

Read `references/apr-calculations.md` for the detailed APR calculation methodology and
assumptions for each loan product.

The key principle: APR reflects the true annual cost including fees spread over the loan
term. Each product type has different fee structures that affect the APR differently.

## Market Research

Before writing the blurb, do a quick web search for:
- This week's mortgage rate movement (up/down/flat vs last week)
- Any Fed commentary or economic data releases affecting rates
- Freddie Mac Primary Mortgage Market Survey (released Thursdays)
- Any significant housing or economic news

Keep research fast — 1-2 searches max. Use this to write an informed market blurb that
sounds like Adam, not like a news article.

## Output 1: Text Message

The text message is the quick-reference version agents keep on their phone. It stays
self-contained — no links needed since agents want to glance at numbers mid-conversation.

Follow this exact structure:

```
National 30-Year Average: [X.XX]%

Conventional:
30-yr fixed (Primary): [rate]% | [APR]%
15-yr Fixed: [rate]% | [APR]%
30-yr Jumbo: [rate]% | [APR]%
VA 30yr: [rate]% | [APR]%
FHA 30-yr: [rate]% | [APR]%
FHA 5 yr ARM: [rate]% | [APR]%
(Based on 740 credit, 20% down for Conventional primary | no discount points or origination fees)

[2-3 sentence market blurb]
```

### Text Blurb Writing Guide

Tone: direct, confident, authoritative. Adam is the expert these agents trust for rate
intelligence. No fluff, no hedging. Say what's happening and what it means for their buyers.

Think: "texting a colleague who relies on your take."

Good examples:
- "Rates pulled back slightly this week after softer jobs data. If you have buyers on the fence, this is a window worth moving on before next week's CPI print."
- "MBS sold off hard after hot inflation numbers. Expect rates to stay elevated through month-end. Good time to set buyer expectations on where we're likely landing."
- "Quiet week on rates — holding steady in the mid-5s on conventional. Housing inventory is ticking up which is the bigger story right now. More options for your buyers."

Bad examples (never write like this):
- "Rates are always changing so it's important to stay informed!" (generic, says nothing)
- "The Federal Reserve continues to monitor economic indicators..." (press release tone)
- "Great news for homebuyers! Rates are looking fantastic!" (salesy, not how Adam talks)

## Output 2: Website Content

This is the full rate update that lives on Adam's website. His site has `<!-- START CONTENT -->`
and `<!-- END CONTENT -->` markers — generate ONLY the HTML content that goes between those
markers. No `<html>`, `<head>`, `<body>` scaffolding.

Use inline styles on every element. No CSS classes, no `<style>` blocks.

### Website Content Structure

The website version includes everything the text has plus more depth:

```html
<h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 26px; font-weight: 700; line-height: 1.3;">
  Weekly Rate Update
</h2>

<p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px;">
  [Date] · Adam Styer, NMLS# 1591282
</p>

<!-- National Average Callout -->
<div style="background: #f0f5fa; border-left: 4px solid #1a3a5c; padding: 16px 20px; margin: 0 0 25px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">National 30-Year Average</p>
  <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1a3a5c;">[X.XX]%</p>
</div>

<!-- Rate Table -->
<table style="width: 100%; border-collapse: collapse; margin: 0 0 25px 0;">
  <tr>
    <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a3a5c;">Product</td>
    <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a3a5c; text-align: center;">Rate</td>
    <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a3a5c; text-align: center;">APR</td>
  </tr>
  <!-- One row per product -->
  <tr>
    <td style="padding: 12px; font-size: 15px; color: #334155; border-bottom: 1px solid #e5e5e5;">[Product Name]</td>
    <td style="padding: 12px; font-size: 15px; color: #334155; border-bottom: 1px solid #e5e5e5; text-align: center; font-weight: 600;">[Rate]%</td>
    <td style="padding: 12px; font-size: 15px; color: #334155; border-bottom: 1px solid #e5e5e5; text-align: center;">[APR]%</td>
  </tr>
</table>

<p style="margin: 0 0 25px 0; font-size: 11px; color: #999; font-style: italic;">
  [Assumptions: 740 credit, 20% down for Conventional primary, no discount points or origination fees]
</p>

<!-- Market Commentary - expanded version -->
<div style="border-top: 2px solid #e2e8f0; margin: 10px 0 25px 0;"></div>

<h3 style="margin: 0 0 15px 0; color: #1a3a5c; font-size: 18px; font-weight: 700;">
  This Week in Rates
</h3>

<!-- 2-3 short paragraphs of market commentary -->
<p style="margin: 0 0 18px 0; color: #334155; font-size: 16px; line-height: 1.7;">
  [Paragraph 1: What happened this week with rates and why]
</p>
<p style="margin: 0 0 18px 0; color: #334155; font-size: 16px; line-height: 1.7;">
  [Paragraph 2: What's coming next week that could move rates]
</p>
<p style="margin: 0 0 18px 0; color: #334155; font-size: 16px; line-height: 1.7;">
  [Paragraph 3: What this means for their business right now]
</p>
```

### Market Commentary (Website Version)

The website gets more depth than the text blurb. 2-3 short paragraphs covering:
1. **What happened** — be specific. Cite data, Fed actions, MBS movement.
2. **What's coming** — economic calendar, Fed speakers, auctions next week.
3. **What to do** — actionable takeaway for agents and their buyer conversations.

Still Adam's voice. Still short paragraphs. Agents skim even on a website.

## Output 3: Teaser Email

The teaser email goes through Jungo. Dead simple — almost plain text. Same approach as
the newsletter teasers.

### Format

```
[2-3 sentences that tell agents rates are out and give them a reason to click]

This week's full rate breakdown + market intel: [LINK]

— Adam
```

The `[LINK]` placeholder is where Adam pastes his actual URL.

### Teaser Writing Rules

- **2-3 sentences max.** Agents are busy. Don't summarize — create a reason to click.
- Include a rate data point or market hook that makes them want the full picture.
- The text message gives them the numbers. The teaser email sells the CONTEXT — the
  "why" behind the numbers, which lives on the website.

**Good teaser examples:**
- "Rates shifted this week and the direction might surprise you. I broke down what's driving it and what it means for your pipeline next month."
- "Got some numbers back that are worth a second look — especially if you have buyers in the jumbo space. Full breakdown + what's coming next week."
- "Two things happened this week that are going to affect buyer conversations for the next 30 days. Here's my take with this week's rate sheet."

**Bad teaser examples:**
- "Here are this week's rates!" (no hook)
- "Rates are 5.875% on conventional this week." (just gave away the content)

## Output Files

Save to the outputs folder:

1. `rate-update-text-YYYY-MM-DD.txt` — text message, ready to paste into group text
2. `rate-update-content-YYYY-MM-DD.html` — website content for between the START/END CONTENT markers
3. `rate-update-teaser-YYYY-MM-DD.txt` — teaser email for Jungo

Use today's actual date. Always provide computer:// links to all files plus a subject
line for the teaser email (under 50 characters).

## Step 9: Log to Marketing History

After all output files are saved, log the rate update to the LoanOS History tab so cadence badges stay current.

Read the secret from `.env.local`:
```bash
AGENT_SECRET=$(grep LOANOS_AGENT_SECRET /Users/adamstyer/Documents/loanos-clone/.env.local | cut -d'"' -f2)
```

Then log:
```bash
curl -s -X POST https://loanos-self.vercel.app/api/marketing/log \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $AGENT_SECRET" \
  -d '{
    "activity": "Rate update generated — <date>",
    "channel": "Rate Update",
    "notes": "<first 120 chars of rates summary>",
    "tracker": "rate-update"
  }'
```

Replace `<date>` with today's formatted date (e.g. "Apr 3, 2026") and `<notes>` with a compact summary of the rates. The `tracker` field updates the cadence badge on the History tab.

If the curl fails, report the error but don't block — the output files are already saved.

---

## Important Notes

- Rate formatting: show rates as X.XXX% (3 decimal places) for both rate and APR
- If Adam provides the national average, use it. If not, search for the latest number.
- The text message needs to work on a phone screen — keep line breaks clean
- Website content uses inline styles only — no CSS classes, no `<style>` blocks
- Speed matters. Don't overthink. Get it out fast and clean.
- If Adam mentions something specific for the blurb (e.g., "mention the jobs report"), lead with that.
