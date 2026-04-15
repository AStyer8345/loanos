# Nurture Email Review — 3 Sequences (18 emails)

**Date:** 2026-04-14
**Purpose:** Adam reviews email copy before Claude wires into n8n + Resend
**Source specs (full copy):**
- PA Welcome — `tasks/lead-gen/specs/2026-03-27-pre-approval-funnel-spec.md` (lines 82-89)
- Rate Watch — `tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md` (lines 118-246)
- DPA Guide — `tasks/lead-gen/specs/2026-04-02-ftb-dpa-funnel-spec.md` (lines 188-452)

---

## Sender identity (applies to all 18 emails)

```
From:     Adam Styer <adam@mail.thestyerteam.com>
Reply-To: adam@thestyerteam.com
Sig:      Adam Styer | NMLS #513013
          Adam Styer | Mortgage Solutions LP
          (512) 956-6010 | styermortgage.com
          5900 Balcones Drive Suite 100 | Austin, TX 78731
```

**⚠️ Spec conflict:** DPA spec (line 172) says `From: adam@styermortgage.com`. You told me you use `adam@thestyerteam.com` and styermortgage.com has no email set up. **Using `adam@mail.thestyerteam.com` for all 18 emails** unless you say otherwise.

---

## Sequence 1: PA Welcome (6 emails, 60 days)

Trigger: tag `pre-approval-funnel` applied

| # | Day | Subject | CTA |
|---|-----|---------|-----|
| 1 | 0 | Your pre-approval request is in — here's what happens next | Calendly |
| 2 | 3 | What "pre-approved" actually means (most buyers get this wrong) | 1003 app |
| 3 | 7 | The 3 things that kill a mortgage approval (and how to avoid them) | Calendly |
| 4 | 14 | Austin market update: what rates look like right now | styermortgage.com/rates |
| 5 | 30 | A buyer just like you closed last month — here's their story | 1003 app |
| 6 | 60 | Still thinking about it? No pressure — but here's what's changed | Calendly |

**⚠️ Concerns flagged:**
- Email 4 links to `styermortgage.com/rates` — **does this page exist?** If not, link goes to homepage or austin-mortgage-rates.html.
- Spec body copy for PA sequence is 2-3 sentence summaries only (in the table). Full email bodies **need to be written** — the Rate Watch and DPA specs have full copy, PA spec does not. I'll expand these into full emails in your voice during the build, but you should know they're not verbatim from your specs.

---

## Sequence 2: Rate Watch (4 emails, 14 days)

Trigger: tag `rate-alert` applied. Full copy exists in spec.

| # | Day | Subject | CTA |
|---|-----|---------|-----|
| 1 | 0 | You're in — here's this week's Austin rates | No CTA (value delivery) |
| 2 | 3 | Why I know rates other brokers don't have access to | No CTA (positioning) |
| 3 | 7 | The 3-question test for "should I lock my rate now?" | Calendly |
| 4 | 14 | Ready to see what rate you'd actually qualify for? | Calendly + 1003 app |

**⚠️ Concern flagged:**
- Email 1 has placeholder rate content: "30-year fixed: Check Freddie Mac PMMS or call me for your scenario." Weak opener for someone who just asked for rates. **Two options:**
  - A) Leave as spec — generic but always accurate
  - B) Replace with live rate from Set Rate webhook (if fresh rate available in Supabase `activity_log`). I can wire this into n8n.

---

## Sequence 3: DPA Guide (8 emails, 52 days)

Trigger: tag `ftb-dpa-guide` applied. Full copy exists in spec.

| # | Day | Subject | CTA |
|---|-----|---------|-----|
| 1 | 0 | Your Austin DPA guide is here (read this first) | **PDF download link** |
| 2 | 2 | The myth that's kept Austin buyers renting for years | PDF re-link |
| 3 | 5 | DPA is not a second payment. Here's what it actually is. | Reply |
| 4 | 10 | How a buyer closed their Austin home with $4,100 out of pocket | Calendly |
| 5 | 17 | Does your credit score qualify for DPA? (Here's the threshold) | Reply |
| 6 | 25 | What's changed in Austin's market (and why FTBs are moving) | Calendly |
| 7 | 38 | It takes 15 minutes. Here's exactly what happens when you get pre-approved. | 1003 app |
| 8 | 52 | Still renting? Let's run your actual numbers for free. | Calendly + 1003 app |

**⚠️ Concerns flagged:**
- **Email 1 links to a PDF that doesn't exist.** You said "please create pdf" — I'll build a draft DPA Guide PDF and drop it in `styerteam-mortgage-site/public/austin-dpa-guide.pdf`. Deploying it to styermortgage.com is part of the build. **Compliance review needed before promoting** — DPA program details (TSAHC, TDHCA, Travis County income limits, forgiveness terms) should be verified against tsahc.org before going live.
- Email 4 tells "Sarah's" story — DPA spec notes this is a composite/illustrative. Current copy says "I want to tell you about a buyer I helped close last year — I'll call her Sarah." This framing is compliant (not attributing a real person) but you may want to swap in a real anonymized story later.
- Email 5 and 8 reference specific income/score thresholds ($167,250, 620, 640). These need annual verification — I'll add a note to review once/year.

---

## Three decisions I need before final build

1. **PA emails need bodies written** — OK for me to expand 2-3 sentence summaries into full emails in your voice (short, punchy, conversational, no fluff)? Or do you want to write them?
2. **Rate Watch Email 1 rate content** — A (leave generic) or B (pull live rate from Set Rate webhook)?
3. **DPA Guide PDF** — I'll draft from the program details in the spec. OK to use "as of April 2026" framing for limits + include the "subject to program availability" disclaimer on every page?

---

## What happens after you review

Once you confirm the 3 decisions above, I finish:
1. Write 6 PA email bodies
2. Build 3 n8n workflows (Rate Watch, PA, DPA)
3. Create Resend n8n credential
4. Modify `subscribe-lead.js` in `styerteam-mortgage-site` to POST to 3 new webhook URLs
5. Create DPA Guide PDF + deploy to styermortgage.com/austin-dpa-guide.pdf
6. Send you a test of each sequence's Email 1 to your inbox
7. Commit both repos, push, watch Vercel + Netlify deploys

**Your time after this review: ~5 minutes** (check 3 test emails, rotate Resend API key).
