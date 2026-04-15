# LoanOS Pool — Proposed Entries (Lane 2 Landing Zone)

This file holds pool entries proposed by the Architect subagent's CHANGELOG hook reader (Lane 2).
Adam reviews entries here, corrects voice, and manually promotes approved ones into `loanos-pool.md`.

Format for each proposed entry matches the schema in `loanos-pool.md`.

---

## Proposed Entry PROPOSED-01 — I Know Exactly Where Every Dollar Goes

**Source:** CHANGELOG [8.2.0] — 2026-04-05 — Share Page Cash to Close Breakdown
**Proposed by:** Architect Lane 2 — 2026-04-06

Arc Phase: 1B In Motion
Audience Tag: Realtor + Borrower
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: whiteboard_photo
CTA: none

### The Hook
My borrowers can now see exactly where every dollar goes before they sign.

### The Vulnerability Angle
I used to dread the question "where did all these fees come from?" Not because I didn't know — because walking someone through a settlement statement in real time, with anxiety running high, is brutal. I'd explain it every time and still feel like they weren't getting it. I built something to fix that.

### The Authority Angle
LoanOS now has a Cash to Close breakdown on the share page. Down payment, closing costs broken into three buckets (lender fees, third-party, prepaids), seller credits, lender credits, points — waterfall-style, right there in front of the borrower. Every dollar labeled. No black box. Realtors who've seen it have told me this is the thing their buyers screenshot and send to their parents.

### The Beats
1. The question I used to dread: "Where did all these fees come from?"
2. I'd explain it every time. High anxiety, deal stress, lots of numbers. It rarely landed clean.
3. So I built a breakdown right into my share page. Every fee. Every credit. Waterfall-style.
4. My borrowers can see exactly how we got to their cash-to-close number before I say a word.
5. The question I used to dread? I haven't heard it once since I launched this.

### Visual Notes
Whiteboard photo: hand-drawn version of the cash-to-close waterfall — a simple box labeled "Cash to Close" at the bottom, with arrows pointing down from "Down Payment", "Closing Costs", "Points" and arrows pointing up from "Seller Credits", "Lender Credits". Raw sketch, not clean.

### Status
proposed

---

## Proposed Entry PROPOSED-02 — I Spent Sunday Fixing a Bug Where My AI Called Someone "Smith He We"

**Source:** CHANGELOG [8.1.6] — 2026-04-05 — Chatbot UX quick-add name parsing fix
**Proposed by:** Architect Lane 2 — 2026-04-06

Arc Phase: 1A Foundation
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: none

### The Hook
My quick-add AI was extracting names wrong. If you said "Add John Smith, he wants to buy in Austin" — it would set the last name to "Smith He We."

### The Vulnerability Angle
I built a tool to speed up contact creation. You talk to it like a real person and it extracts the name, phone, email, intent. Clean, fast, no friction. Except the AI kept adding the pronoun to the last name. "Smith He." "Rodriguez She." One time it came back as "Johnson He We." I caught it before any client emails went out, but barely. The tool I built to make me look sharp almost made me look like I don't know my own contacts.

### The Authority Angle
I fixed the prompt. Added explicit stop rules: stop at punctuation, commas, pronouns. Tested it with 15 variations. Now it parses clean. But here's the thing — I wouldn't know to look for that bug in an off-the-shelf CRM. I'd just have "Smith He We" in my database forever, blaming the software. When you build your own tools, you find things you'd never find otherwise. That's the price and the privilege.

### The Beats
1. My AI called a client "Smith He We." Last name: He We.
2. The quick-add feature was supposed to save me time. It was extracting pronouns as part of the name.
3. I caught it. Fixed the prompt. Tested 15 variations.
4. Here's the thing — I wouldn't have found that in a third-party CRM. It would've just been wrong forever.
5. Building your own tools means you find things no vendor would ever tell you about. That's both the problem and the point.

### Visual Notes
Slide 1: selfie_thinking.jpg with overlay "My AI called a borrower 'Smith He We'." Slides 2-4: beats. Slide 5: "When you build your own tools, you find things no vendor would ever tell you."
NOTE: Requires selfie_thinking.jpg — blocked until selfies uploaded (BLOCKER-LOANOS-001). Can build with whiteboard_photo as fallback if needed.

### Status
proposed

---

---

## Proposed Entry PROPOSED-03 — My Phone Shows Me Every Message I've Ever Sent a Borrower

**Source:** CHANGELOG 2026-04-09 PM — iMessage workflow fix + unified contact activity feed
**Proposed by:** Architect Lane 2 — 2026-04-09

Arc Phase: 1C Automations
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: none

### The Hook
I opened a contact record this morning and saw the last 12 messages we'd ever exchanged. Every text. Every call note. Every email. All there.

### The Vulnerability Angle
I used to run my borrower relationships out of a combination of my head, my phone's message history, and a spiral notebook. If a past client texted me two years later asking about refinancing, I had no idea what we'd talked about the last time they thought about buying. I just winged it. That's not a trust-building move.

### The Authority Angle
LoanOS now pulls iMessages, emails, call logs, and notes into a single unified activity feed per contact. Every conversation, every document request, every milestone — one timeline. Before I pick up the phone or reply to a text, I already know the full context of the relationship. The iMessage integration alone pulled in 126 prior conversations. Relationships that used to live in my pocket now live in the system.

### The Beats
1. I opened a contact record and saw the last 12 messages we'd ever exchanged. Every text. Every call.
2. I used to run borrower relationships out of my head, my phone, and a spiral notebook.
3. If a past client texted me about refinancing two years later, I'd have to wing it.
4. LoanOS now pulls iMessages, emails, calls, and notes into one timeline per contact.
5. 126 prior conversations synced on the first run. Relationships that lived in my pocket now live in the system.

### Visual Notes
Slide 1: selfie_neutral.jpg with overlay "My phone shows me every message I've ever sent a borrower." Slides 2-5: beats. Slide 6: "Relationships that lived in my pocket now live in the system."
NOTE: Requires selfie_neutral.jpg — blocked until selfies uploaded (BLOCKER-LOANOS-001).

### Status
proposed

---

## Proposed Entry PROPOSED-04 — I'm Watching Rates for 644 People Who Don't Even Know It

**Source:** CHANGELOG 2026-04-09 AM — Refi Watch Sequence A (Rate Drop Alert) built
**Proposed by:** Architect Lane 2 — 2026-04-09

Arc Phase: 1C Automations
Audience Tag: LO
Primary Platform: LinkedIn
Cross-post: Facebook
Visual Format: selfie_carousel
CTA: DM_loanos

### The Hook
I have 644 past clients. An automation runs every morning checking if their rate is worth refinancing. I wrote zero of those checks.

### The Vulnerability Angle
After you close a loan, most of your relationship just... fades. You don't know if their rate ever becomes a target again. You don't know if they've moved, if they've bought another property, if they're thinking about refinancing. You move on to the next deal. I don't like that model. But there was no system that watched for me — until I built one.

### The Authority Angle
LoanOS Refi Watch monitors my past client database daily. Threshold: if current market rates drop below 6% AND a borrower's locked rate was ≥6.75%, the system fires a personalized rate drop alert to that client. With a calculated savings estimate. Automatically. The clients who feel like I disappeared after closing? I didn't disappear. I just automated the watching.

### The Beats
1. I have 644 past clients. I wrote zero of the daily rate checks happening right now.
2. After a loan closes, the relationship usually fades. No system was watching for them.
3. I built one. LoanOS Refi Watch runs every morning. Threshold: current rate < 6%, their rate ≥ 6.75%.
4. When that combination hits, a personalized savings estimate goes out. Automatically.
5. My past clients don't know an algorithm is watching for them every morning. But one is.
6. DM me the word LOANOS and I'll show you how I built it.

### Visual Notes
Slide 1: selfie_thinking.jpg with overlay "An automation checks rates for 644 people every morning. I wrote none of those checks." Slides 2-5: beats. Slide 6: CTA beat.
NOTE: Requires selfie_thinking.jpg — blocked until selfies uploaded (BLOCKER-LOANOS-001).

### Status
proposed


---
## PROPOSED-03 — Scenario Naming (1B In Motion)
Proposed: 2026-04-12 AM (Lane 2 CHANGELOG detection)
Source: CHANGELOG.md — "2026-04-11 AM — Scenarios: Scenario Naming Affordance"
Arc Phase: 1B — In Motion (showing LoanOS working in Adam's hands)
The Hook: "My clients were getting confused when I showed them three loan options. Same rates, same loan, just presented differently. I fixed it by naming them."
The Beats:
  1. Before: Three tabs labeled "Option A, Option B, Option C" — means nothing to a buyer.
  2. The fix: Adam can now rename each scenario directly in the dashboard. "Conservative 30yr." "Seller Buydown 2-1." "Investment Hold."
  3. Names carry to the borrower share page and the printed PDF — so they're talking about the same thing I'm talking about.
  4. Takes 5 seconds. Reduces the confusion call I used to get after every share.
The Vulnerability Angle: Small feature. Took me two weeks to get it built. Sounds dumb. Changed how every conversation goes.
The Authority Angle: Tools that match how humans think beat tools that make humans think like tools.
Visual Format: screenshot_deferred (needs demo environment: READY)
Visual Notes: Screenshot of the LoanOS scenario panel with 3 named scenarios visible — "Conservative 30yr", "Seller Buydown 2-1", "FHA Low-Down"
CTA: DM_loanos
Status: proposed (needs Adam review)
Pool Entry ID: PROPOSED-03
