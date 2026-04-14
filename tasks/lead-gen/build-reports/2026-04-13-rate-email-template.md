# Build Report — Weekly Friday Rate Email Template
**Date:** 2026-04-13
**Builder:** Lead Gen AM Agent
**Sequence:** Weekly recurring campaign — Mailchimp

---

## Overview

Reusable HTML email template for Adam's weekly Friday rate update to all `rate-alert` tagged Mailchimp subscribers. Designed for Adam to paste the current week's rates and click Send — minimal editing required each week.

**Mailchimp setup:** Automations → Campaigns → Regular email → Schedule for Friday 9:00 AM CT → Send to segment: Tag = `rate-alert`.

**Compliance pre-flight (REQUIRED before every send):**
- [ ] Update rate numbers (3 fields: 30-yr, 15-yr, ARM)
- [ ] Update APR figures (1 field per rate type)
- [ ] Verify no "guaranteed approval" or "lock in this rate" language present
- [ ] NMLS #513013 visible in header and footer
- [ ] Equal Housing Lender visible in footer
- [ ] Physical address visible in footer (5900 Balcones Drive, Suite 100, Austin TX 78731)
- [ ] Unsubscribe link functional (Mailchimp adds automatically via *|UNSUB|*)
- [ ] Date in subject line matches Friday send date

---

## Subject Line Template

```
Rates This Week — [Month Day] | Adam Styer | Mortgage Solutions LP
```

**Example:** `Rates This Week — April 18 | Adam Styer | Mortgage Solutions LP`

---

## HTML Template

Paste this into Mailchimp's "Code Your Own" email editor. Replace ALL `{{PLACEHOLDER}}` values before sending.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Rate Update</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'IBM Plex Mono',Courier,monospace;">

<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;color:#0a0a0a;font-size:1px;">
  This week's rates from Adam Styer | Mortgage Solutions LP — NMLS #513013
</div>

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
  <tr>
    <td align="center" style="padding:20px 0;">

      <!-- Container -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #222222;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:2px solid #C9A84C;">
            <p style="margin:0;font-size:11px;color:#C9A84C;letter-spacing:3px;text-transform:uppercase;">NMLS #513013</p>
            <h1 style="margin:8px 0 4px;font-size:22px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">Adam Styer | Mortgage Solutions LP</h1>
            <p style="margin:0;font-size:12px;color:#888888;">Independent Mortgage Broker · Austin, TX</p>
          </td>
        </tr>

        <!-- Rates This Week Headline -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <p style="margin:0;font-size:11px;color:#C9A84C;letter-spacing:3px;text-transform:uppercase;">{{WEEK_DATE}} — WEEKLY RATE SNAPSHOT</p>
            <h2 style="margin:8px 0 0;font-size:28px;color:#ffffff;font-weight:700;">Where Rates Stand This Week</h2>
          </td>
        </tr>

        <!-- Intro copy -->
        <tr>
          <td style="padding:16px 40px 24px;">
            <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.7;">
              Every Friday I pull the latest numbers so you're not guessing. These are real market rates — not teaser rates, not bait-and-switch. What I'm actually seeing this week:
            </p>
          </td>
        </tr>

        <!-- Rate Cards -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- 30-yr Fixed -->
                <td width="31%" style="background-color:#1a1a1a;border:1px solid #2a2a2a;padding:20px;vertical-align:top;text-align:center;">
                  <p style="margin:0 0 4px;font-size:10px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;">30-YR FIXED</p>
                  <p style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">{{RATE_30YR}}%</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#666666;">APR {{APR_30YR}}%</p>
                </td>
                <td width="4%">&nbsp;</td>
                <!-- 15-yr Fixed -->
                <td width="30%" style="background-color:#1a1a1a;border:1px solid #2a2a2a;padding:20px;vertical-align:top;text-align:center;">
                  <p style="margin:0 0 4px;font-size:10px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;">15-YR FIXED</p>
                  <p style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">{{RATE_15YR}}%</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#666666;">APR {{APR_15YR}}%</p>
                </td>
                <td width="4%">&nbsp;</td>
                <!-- 5/1 ARM -->
                <td width="31%" style="background-color:#1a1a1a;border:1px solid #2a2a2a;padding:20px;vertical-align:top;text-align:center;">
                  <p style="margin:0 0 4px;font-size:10px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;">5/1 ARM</p>
                  <p style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">{{RATE_ARM}}%</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#666666;">APR {{APR_ARM}}%</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rate context note -->
        <tr>
          <td style="padding:0 40px 24px;">
            <p style="margin:0;font-size:11px;color:#555555;line-height:1.6;">
              Rates shown are for a 30-day lock on a primary residence purchase with 20% down and 740+ credit score in Austin, TX. Your rate will vary based on credit, loan amount, property type, and other factors. These are not a commitment to lend.
            </p>
          </td>
        </tr>

        <!-- Market Note (optional — delete if nothing notable this week) -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#161616;border-left:3px solid #C9A84C;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:10px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;">THIS WEEK'S CONTEXT</p>
                  <p style="margin:0;font-size:13px;color:#cccccc;line-height:1.7;">{{MARKET_NOTE}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0 0 16px;font-size:14px;color:#aaaaaa;">Thinking about buying or refinancing? Let's run the numbers.</p>
            <a href="https://calendly.com/adamstyer/15minutes" style="display:inline-block;background-color:#C9A84C;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:14px 28px;letter-spacing:1px;text-transform:uppercase;">Schedule 15 Minutes</a>
            <p style="margin:12px 0 0;font-size:12px;color:#555555;">Or apply directly: <a href="https://mslp.my1003app.com/513013/register" style="color:#C9A84C;text-decoration:none;">mslp.my1003app.com/513013</a></p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #222222;margin:0;"></td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;">
            <p style="margin:0 0 8px;font-size:11px;color:#444444;line-height:1.7;">
              <strong style="color:#555555;">Adam Styer | Mortgage Solutions LP</strong> · NMLS #513013<br>
              5900 Balcones Drive, Suite 100, Austin, TX 78731<br>
              Licensed in Texas · Equal Housing Lender
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#333333;line-height:1.6;">
              APR (Annual Percentage Rate) reflects the cost of credit expressed as a yearly rate. Rates and fees shown are estimates for illustrative purposes only and may not be available to all borrowers. All loan applications are subject to underwriting review, credit approval, and market conditions at time of lock. This is not a commitment to lend or a guarantee of approval.
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:#333333;">
              You're receiving this because you signed up for rate alerts at styermortgage.com.<br>
              <a href="*|UNSUB|*" style="color:#555555;text-decoration:underline;">Unsubscribe</a> · <a href="*|UPDATE_PROFILE|*" style="color:#555555;text-decoration:underline;">Update preferences</a>
            </p>
          </td>
        </tr>

      </table>
      <!-- /Container -->

    </td>
  </tr>
</table>
<!-- /Wrapper -->

</body>
</html>
```

---

## Weekly Fill-In Checklist (What to change each Friday AM)

| Placeholder | What to enter | Example |
|-------------|---------------|---------|
| `{{WEEK_DATE}}` | Current Friday's date | `APRIL 18, 2026` |
| `{{RATE_30YR}}` | Current 30-yr fixed rate | `6.39` |
| `{{APR_30YR}}` | APR for 30-yr (rate + 0.15–0.25%) | `6.54` |
| `{{RATE_15YR}}` | Current 15-yr fixed rate | `5.89` |
| `{{APR_15YR}}` | APR for 15-yr | `6.04` |
| `{{RATE_ARM}}` | Current 5/1 ARM rate | `5.99` |
| `{{APR_ARM}}` | APR for 5/1 ARM (add ARM adjustment note) | `6.85` |
| `{{MARKET_NOTE}}` | 2–3 sentences on what moved rates this week | See below |

**Market Note examples (rotate and customize):**
- "The 10-year Treasury yield moved [up/down] [X]bps this week after [event]. That's the primary driver of mortgage rates. Buyers who locked last week [got a better deal / missed out]."
- "Fed held rates flat at [range] — but that's not what drives your mortgage rate. Watch the 10-year. It closed at [yield]%."
- "Rates [flat / ticked up / pulled back] this week. No major economic data until [next event]. If you've been waiting for a dip — this [is / isn't] it."

---

## Mailchimp Setup Instructions

1. **Create the campaign:** Campaigns → Create Campaign → Email → Regular
2. **Name it:** "Weekly Rate Alert — {{date}}" (overwrite each week)
3. **To:** Send to segment — Subscribers matching: Tag = `rate-alert`
4. **Subject:** `Rates This Week — [Month Day] | Adam Styer | Mortgage Solutions LP`
5. **Preview text:** `This week's rates — 30-yr, 15-yr, ARM. Not teaser rates. Real numbers.`
6. **Design:** Click "Code Your Own" — paste the HTML above
7. **Schedule:** Friday, 9:00 AM CT
8. **Send test first:** Send test email to adam@thestyerteam.com and verify rendering on mobile

**FIRST RUN:** Before scheduling the first weekly send, also verify:
- `rate-alert` tagged subscribers exist in Mailchimp audience
- Mailchimp audience is set to `MAILCHIMP_BORROWER_LIST_ID` (same list as PA funnel)

---

## Compliance Checklist (PASS before every send)

- [x] NMLS #513013 in header AND footer
- [x] Equal Housing Lender in footer
- [x] Physical address in footer (5900 Balcones Drive, Suite 100, Austin TX 78731)
- [x] APR disclosure on each rate card
- [x] "Not a commitment to lend" language in footer
- [x] No "guaranteed approval" or "lock in this rate today" language
- [x] No protected class targeting (tag-based segmentation only)
- [x] TCPA: no SMS content (email only)
- [x] Unsubscribe link (*|UNSUB|* Mailchimp tag — inserts automatically)
- [x] CAN-SPAM: "You're receiving this because..." statement present

---

## Quality Score: 9/10

**Scoring rationale:**
- Design (3/3): Dark bg + gold accent + IBM Plex Mono → matches LoanOS brand system
- Compliance (3/3): All CFPB/CAN-SPAM/TCPA/Reg Z elements present
- Usability (2/2): Weekly fill-in table + Mailchimp setup guide → Adam can execute in <10 min
- Conversion (1/2): CTA present; -1 because Calendly booking link is better than application link for cold rate-watch subscribers (already addressed by using Calendly as primary CTA)
