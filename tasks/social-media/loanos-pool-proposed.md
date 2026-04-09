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
