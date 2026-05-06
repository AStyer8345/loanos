# Realtor Relationships Drip — Email Body Drafts

**Status:** DRAFT — pending Adam cadence/activation decision (per ADAM-TODO 2026-04-27)
**Campaign ID:** `ef52ed56-8a22-4d15-9f12-a1796ccf17b6`
**Audience:** `realtor`
**Authored:** 2026-04-30 AM (autonomous, scheduled task)
**Voice source:** `tasks/social-media/adam-voice-and-workflow.md` § "REALTOR RELATIONSHIPS" + § "VOICE AND TONE"

## Why drafts now

Cadence is Adam-blocked (ADAM-TODO 2026-04-27 #2). Copy is not. Authoring drafts speculatively so when Adam returns the cadence decision, builder can wire the 4 emails into `src/lib/drip/authored-emails.ts` immediately without an authoring loop.

## Format

These mirror the existing `authored-emails.ts` pattern: each step has `subject` + `plain` body with `{{var}}` merge tags. CAN-SPAM footer, NMLS disclosure, and Equal Housing Lender mark are added by `renderDripHtml()` wrapper — not inline here.

## Merge-tag dependencies

These drafts assume the following contact-record merge tags exist or will be added:

| Tag | Source | Schema status |
|---|---|---|
| `{{first_name}}` | `contacts.first_name` | ✅ exists |
| `{{transaction_address}}` | last closed deal property address | ⚠️ TBD — query `loans` table for `realtor_id = contact.id` ORDER BY closing_date LIMIT 1 |
| `{{transaction_buyer_name}}` | last closed deal borrower full name | ⚠️ TBD — same query |
| `{{deal_count}}` | total closed deals with this realtor | ⚠️ TBD — `SELECT COUNT(*) FROM loans WHERE realtor_id = contact.id AND stage = 'funded'` |
| `{{first_deal_date}}` | first closed deal date (used as anniversary) | ⚠️ TBD — already needed by existing `trigger_config.date_field` |

**Builder note:** before wiring these, confirm the 4 merge tags are resolved in the drip render pipeline. If not, builder needs to extend `renderDripHtml()` (or whatever resolves merge tags for realtor audience) to look up the realtor's closed-deal context.

---

## Step 1 — Deal Anniversary

**Trigger:** `annual_date` on `first_deal_date`
**Tone:** quiet_confidence
**Skeleton (existing):** "One year since our first closed deal together. Reference the specific transaction. Express genuine appreciation for the partnership. Keep it professional and peer-level."

```ts
1: {
  subject: "One year ago — our first closing",
  plain: `Hi {{first_name}},

One year ago today, we closed {{transaction_address}} for {{transaction_buyer_name}}.

That was the start of this. Wanted to say thanks.

The mortgage side of any deal can go a lot of different ways. The fact that you trusted me with that one — and the ones since — isn't something I take for granted.

If you've got buyers in motion right now or anyone you want me to look at, just reply. If not, no need.

Adam`,
},
```

---

## Step 2 — Milestone Celebration

**Trigger:** `condition` on `deals_milestone: 5` (fires when realtor's closed-deal count crosses 5, then 10, 15…)
**Tone:** quiet_confidence
**Skeleton (existing):** "We just hit [X] closed loans together. Celebrate the milestone. Reference the partnership growth. This is a big deal — make it feel like one."

```ts
2: {
  subject: "{{deal_count}} closings in — that's not nothing",
  plain: `Hi {{first_name}},

{{deal_count}} closed loans together.

Most realtor-LO partnerships fizzle out before they hit five. Most never hit ten.

A lot of this business runs on inertia and convenience. The fact that you keep sending deals my way means something different is happening — and I want you to know I see it.

I'll keep doing my part: same-day pre-approvals, weekly updates, no surprises at the closing table.

If there's anything you wish I did differently, I want to hear it. The relationship is the asset.

Adam`,
},
```

---

## Step 3 — Co-Marketing Offer

**Trigger:** `relative_days` after enrollment, `days: 180`
**Tone:** quiet_confidence
**Skeleton (existing):** "Offer to create something useful for them — open house flyer with both our info, social media content for their listings, or a buyer guide they can share. Make it about making THEM look good."

```ts
3: {
  subject: "Want me to make you something?",
  plain: `Hi {{first_name}},

Quick offer.

If you've got a listing, an open house coming up, or a buyer who needs a primer — I can put together a piece with both our names on it. No charge, no expectation.

Three things I can build:

A co-branded open house flyer for a specific listing — payment scenarios at current rates, what a buyer needs to bring to the table.

A "what to bring to your first meeting with a lender" guide your buyers can keep — your contact info on it, mine on it, branded clean.

A 60-second video answering whatever question your buyers ask you most. I'll script it, shoot it on my phone, send it over for you to post.

Just reply with which one is useful. I'll handle the rest.

Adam`,
},
```

---

## Step 4 — Holiday (Thanksgiving)

**Trigger:** `annual_date` on `holiday_thanksgiving`
**Tone:** quiet_confidence
**Skeleton (existing):** "Warm holiday message. Reference the working relationship. Express gratitude for their trust and partnership. No business ask."

```ts
4: {
  subject: "Thanksgiving",
  plain: `Hi {{first_name}},

No pitch, no ask.

This is the second-most stressful season in our line of work, and most clients only see the smooth version. You and I both know what it actually takes.

I'm grateful you trust me with your buyers. I don't take that for granted.

Hope you and your family get a real day to slow down.

Adam`,
},
```

---

## Compliance Notes

- All four bodies avoid:
  - Specific rate quotes (no APR disclosure required)
  - Guaranteed-approval language
  - Protected-class targeting
  - "Pricing is locked" / "dream home" / "seamless process" (banned phrases per voice guide)
- NMLS #513013 + Equal Housing Lender + physical address (5900 Balcones Drive, Suite 100, Austin TX 78731) + `{{unsubscribe_url}}` are added by `renderDripHtml()` template wrapper — same pattern as existing PA Welcome / DPA Guide / Ghost Referral / Incomplete App / Went Quiet emails.
- Tone is peer-to-peer (LO ↔ realtor), not LO ↔ borrower. Each email assumes the realtor is a working partner who's already sent at least one deal.

## Voice-guide alignment

- ✅ Short, punchy sentences
- ✅ Confident but not arrogant
- ✅ "I treat every client like a family member" undertone, applied to realtor partners
- ✅ Step 4 (Holiday) ends without a CTA — voice guide explicitly says "Not every post needs a CTA. Some posts should just end."
- ✅ Step 1 references a specific transaction (per voice guide: "Real stories beat generic examples every time")
- ✅ No "Styer Team" anywhere — only Adam's first name signs
- ✅ Step 3 makes the realtor the hero, never the LO ("Make it about making THEM look good")
- ⚠️ Voice-vs-content edge: "correspondent lender" is Adam's positioning vs. brokers/banks. None of these 4 emails surface that — peer-to-peer with someone already sending deals doesn't need that framing. Builder/Adam: confirm OK.

## Open questions for Adam (cadence layer — not copy)

These are the same 2 questions from ADAM-TODO 2026-04-27 #2 — copy work doesn't unblock them:

(a) **Cadence triggers:** When should each step fire relative to a referral closing?
   - Step 1 (annual_date `first_deal_date`) — assumes `first_deal_date` is populated; what populates it? Builder needs to add a backfill query or auto-populate on first funded loan with `realtor_id` set.
   - Step 2 (condition `deals_milestone: 5`) — when count crosses 5. Should it also fire at 10, 15, 25? Or just once at 5?
   - Step 3 (relative_days 180) — relative to what? Enrollment date? Last closed deal? Adam pick.
   - Step 4 (annual_date `holiday_thanksgiving`) — fires once a year on Thanksgiving. Need US holiday calendar lookup logic in trigger pipeline.

(b) **Activation criteria — who gets enrolled?**
   - 28 realtors with `referral_ytd_count > 0` (per 2026-04-27 audit) is the candidate pool.
   - Should enrollment be: 1st referral submitted, 1st referral closed, manual flip on contact-detail page, or all 28 batch-enrolled at activation?

## Filed under

- `tasks/lead-gen/drafts/2026-04-30-realtor-relationships-email-bodies.md` (this file)
- Reference: ADAM-TODO 2026-04-27 #2 (Realtor Relationships activation criteria + cadence)
- Reference: `tasks/lead-gen/audits/2026-04-27-drip-data-integrity-audit.md`
- Reference: `tasks/social-media/adam-voice-and-workflow.md` § "REALTOR RELATIONSHIPS"
