---
name: weekly-newsletter
description: >
  Generate Adam Styer's content + teaser emails for his mortgage business. This skill
  creates website landing page content (borrower + realtor versions) and simple teaser
  emails that drive traffic to the website. Use this skill whenever Adam mentions
  "newsletter", "weekly email", "send out an email", "realtor email", "borrower email",
  "write this week's email", "content for the site", "send something out about [topic]",
  or anything about creating recurring content for his mortgage database. Even casual
  mentions like "I need to send something out about [topic]" should trigger this skill.
  Always use it for any recurring email/content creation for Adam's mortgage business.
---

# Content + Teaser Email Generator

Adam's content system works in two parts:

1. **Full article content** lives on his website (thestyerteam.com)
2. **Short teaser emails** go out through Jungo with a link to the full article

This eliminates HTML formatting headaches, drives website traffic (retargeting pixels
fire), and keeps emails simple enough that Jungo can't mess them up.

Adam sends to two audiences, so everything is produced in pairs:
- **Borrower version** — past clients, prospects, sphere
- **Realtor version** — referral partners, agents (includes AI tools section)

## Workflow

1. Adam gives you a topic, angle, or talking point
2. Generate the full article content for BOTH landing pages (see Writing Guide)
3. Generate the AI Tools section for the realtor version
4. Generate teaser emails for BOTH audiences (see Teaser Email Guide)
5. Save all four outputs to the outputs directory
6. Provide computer:// links and subject lines

Do NOT ask clarifying questions unless the topic is genuinely ambiguous. Adam wants speed.

## Output Files

Each run produces four files:

| File | Purpose |
|------|---------|
| `content-borrower-YYYY-MM-DD.html` | Full article HTML for borrower landing page |
| `content-realtor-YYYY-MM-DD.html` | Full article HTML for realtor landing page (includes AI tools) |
| `teaser-borrower-YYYY-MM-DD.txt` | Plain text teaser email for Jungo (borrowers) |
| `teaser-realtor-YYYY-MM-DD.txt` | Plain text teaser email for Jungo (realtors) |

Use today's actual date in filenames.

## Website Content Format

Adam's site has `<!-- START CONTENT -->` and `<!-- END CONTENT -->` markers in his
landing page template. The content files contain ONLY the HTML that goes between
those markers. Do not include `<html>`, `<head>`, `<body>`, or any page scaffolding —
just the article content itself.

Use inline styles on every element. No CSS classes, no `<style>` blocks. The content
must look right when pasted into the existing page template.

### Content HTML Structure

```html
<h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 26px; font-weight: 700; line-height: 1.3;">
  Article Headline Here
</h2>

<p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
  February 19, 2026 · 4 min read
</p>

<p style="margin: 0 0 18px 0; color: #334155; font-size: 16px; line-height: 1.7;">
  Paragraph text here. Keep paragraphs to 2-3 sentences max. People skim.
</p>

<p style="margin: 0 0 18px 0; color: #334155; font-size: 16px; line-height: 1.7;">
  <strong>Bold for emphasis</strong> when needed. Use sparingly.
</p>
```

For callout boxes or key stats:

```html
<div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
    Key stat or takeaway here.
  </p>
</div>
```

### AI Tools Section (Realtor Version Only)

This section appears at the end of the realtor content, after the main article.
It positions Adam as forward-thinking and gives realtors genuinely useful AI content.

Include BOTH:

**1. A ready-to-use AI prompt** — Something a realtor can copy/paste into ChatGPT or
Claude right now. Practical, specific to real estate. Examples: write a listing
description from bullet points, draft a follow-up email to a cold buyer, create a
neighborhood guide, summarize a home inspection report for a client.

**2. A quick AI tool tip** — A specific tool or use case, 2-3 sentences. Not "AI is
cool" — something actionable that saves them time this week.

Format the AI section with a visual separator:

```html
<div style="border-top: 2px solid #e2e8f0; margin: 35px 0 25px 0;"></div>

<h3 style="margin: 0 0 5px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
  AI Playbook
</h3>
<p style="margin: 0 0 18px 0; color: #64748b; font-size: 14px;">
  Tools and prompts to save you time this week
</p>

<p style="margin: 0 0 10px 0; color: #334155; font-size: 15px; font-weight: 600;">
  Prompt of the Week
</p>

<div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #1e40af; font-family: 'Courier New', monospace; margin: 0 0 20px 0;">
  [PROMPT TEXT - something they can copy/paste into ChatGPT or Claude]
</div>

<p style="margin: 0 0 10px 0; color: #334155; font-size: 15px; font-weight: 600;">
  Tool Tip
</p>
<p style="margin: 0 0 0 0; color: #334155; font-size: 15px; line-height: 1.6;">
  [2-3 sentence tip about a specific AI tool]
</p>
```

The vibe: Adam is ahead of the curve, sharing the playbook. Don't be preachy about
AI. Be practical. "Here's something that'll save you an hour."

## Teaser Email Guide

The teaser emails go through Jungo. They must be dead simple — almost plain text.
This is the whole point of the system: no HTML formatting headaches.

### Format

```
[2-3 compelling sentences that hook the reader and make them want more]

Read the full breakdown here: [LINK]

— Adam
```

That's it. No images, no buttons, no HTML tables, no styling. Just a human-sounding
note with a link. Think of how you'd text a friend about an article you read.

The `[LINK]` placeholder is where Adam will paste his actual URL.

### Teaser Writing Rules

- **2-3 sentences max** before the link. Not a summary — a hook.
- Create an information gap. Make them curious about what's on the other side.
- Don't give away the punchline. If the article explains why rates dropped, the teaser
  should hint at it without explaining it.
- Write it like Adam talks — direct, confident, a little casual.
- No subject line in the teaser body — subject lines go separately (see below).

**Good teaser examples:**
- "Something happened with rates this week that most people missed. If you've been on the fence about refinancing, you'll want to see the numbers I'm looking at."
- "Got three calls this week from agents whose buyers lost deals over the same mistake. I broke down exactly what went wrong and how to avoid it."
- "The spring market data just came in and it's not what anyone expected. I pulled together what it actually means for pricing right now."

**Bad teaser examples (don't write these):**
- "Check out my latest article about mortgage rates!" (boring, no hook)
- "In this week's update, I cover rates, inventory, and tips for buyers." (table of contents)
- "Rates dropped to 6.5% this week which means..." (giving away the content)

## Writing Guide

### Adam's Voice

Adam is direct, warm, confident, and real. He sounds like a smart friend who happens
to know mortgages inside and out. He educates without being condescending and builds
trust through clarity, not sales pressure.

**Never use these phrases** — they make Adam sound like a template:
- "In today's market..."
- "As your trusted advisor..."
- "Don't hesitate to reach out!"
- "Act now!"
- "In these uncertain times..."
- "Whether you're a first-time buyer or seasoned investor..."
- Any sentence starting with "As a mortgage professional..."

**Good examples of Adam's voice:**
- "Here's the thing most people don't realize about rates..."
- "I had three clients this week ask me the same question, so let me break it down."
- "This is the kind of thing that sounds complicated but actually isn't."
- "If you're sitting on the fence, here's what I'd want you to know."

### Borrower Version

The reader is a past client, current prospect, or someone in Adam's sphere. They may
or may not need a mortgage right now — but Adam wants to stay top-of-mind as THE
mortgage person they trust.

- **Tone**: Educational, personal, like a note from someone who genuinely wants to help
- **Angle**: What does Adam's topic mean for THEM — their home, money, family's future
- **Length**: 300-500 words of body content. Short paragraphs (2-3 sentences each).
- **Structure**: Hook → Insight → What it means for them → Soft CTA
- **Sign-off**: Natural, not pushy. "If any of this applies to your situation, I'm always happy to run the numbers."

### Realtor Version

The reader is a real estate agent — a current or potential referral partner. They care
about closing deals, looking smart to their clients, and having a reliable mortgage partner.

- **Tone**: Peer-to-peer, strategic, collaborative
- **Angle**: Reframe Adam's topic through the lens of their business and their clients
- **Tone shift**: Less educational, more "here's intel you can use"
- **Length**: 300-500 words of main content, plus the AI Tools section
- **Structure**: Market context → What it means for their clients → How Adam can help → Partnership CTA
- **Sign-off**: Collaborative. "Let me know if you want me to run scenarios for any of your buyers."

## Subject Lines

Generate a subject line for EACH teaser email. Present them alongside the file links.

- Under 50 characters
- Curiosity-driven, not clickbait
- Borrower subject: speaks to their life/money/home
- Realtor subject: speaks to their business/deals/clients

## Log to Marketing History

After all four output files are saved, log the newsletter to the LoanOS History tab so cadence badges stay current.

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
    "activity": "Weekly newsletter — <topic summary>",
    "channel": "Newsletter",
    "notes": "<borrower subject line>",
    "tracker": "borrower-nl"
  }'
```

Replace `<topic summary>` with 3-5 words describing the content and `<notes>` with the borrower subject line. The `tracker` field updates the cadence badge on the History tab.

If the curl fails, report the error but don't block — the output files are already saved.

---

## Quality Check

Before delivering, verify:
- Both website content pieces are 300-500 words (realtor longer with AI section)
- Both teaser emails are 2-3 sentences + link placeholder
- Subject lines under 50 characters
- No generic mortgage marketing clichés
- Content sounds like Adam, not a template
- AI Tools section present in realtor version with both a prompt AND a tool tip
- All four files saved with computer:// links provided
- Teaser emails contain `[LINK]` placeholder
