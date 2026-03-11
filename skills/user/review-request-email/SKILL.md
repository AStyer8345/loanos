---
name: review-request-email
description: >
  Drafts and sends a post-closing review request email to a borrower via Outlook (Zapier).
  Adam provides the borrower's name and email address — Claude populates the hardcoded HTML
  template and creates an Outlook draft for Adam to review and send.
  Use this skill whenever Adam says "send review email", "review request for [name]",
  "ask [name] for a review", "request a review from [name]", "send [name] the review email",
  "closing is done — send the review email", "review request email", "post-closing email",
  "[name] closed — send review request", or any variation of asking a closed borrower for
  a Google or Zillow review. Even casual mentions like "[name] funded, shoot them the review
  ask" should trigger this skill.
---

# Review Request Email Skill

## Overview

Adam provides borrower name + email → Claude populates HTML email template → sends Outlook draft to adam@thestyerteam.com via Zapier → Adam swaps "To" to borrower and sends.

Email asks borrower for a Google review and a Zillow review. Tone: personal, warm, grateful — not automated-sounding.

---

## Step 1 — Collect Required Fields

Adam must provide:

| Field | Description | Example |
|---|---|---|
| FIRST_NAME | Borrower's first name only | Sarah |
| BORROWER_EMAIL | Borrower's email address | sarah@email.com |

**If either field is missing**, ask Adam before proceeding. Do not guess or leave blank.

---

## Step 2 — Draft Email via Outlook (Zapier)

Call `microsoft_outlook_create_draft_email` with this exact pattern:

- `body`: null
- `subject`: null
- `bodyFormat`: null
- `instructions`: ALL content — subject, recipient, body format, and full HTML body — goes here as a single string
- `output_hint`: "confirmation the draft was created with subject line and recipient"

**The HTML body must be flattened to a single line with no line breaks inside the instructions string.**

### Subject Line
```
[FIRST_NAME], thank you — one small ask 🙏
```

### HTML Email Template

Replace `[FIRST_NAME]` and `[BORROWER_EMAIL]` with provided values. Flatten to single line when passing to Zapier.

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background-color:#1E2761;padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Adam Styer | Mortgage Solutions LP</h1>
            <p style="color:#a8b8d8;margin:6px 0 0 0;font-size:14px;">Senior Loan Officer | NMLS# 513013</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 30px 40px;">
            <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 16px 0;">
              Hey [FIRST_NAME],
            </p>
            <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 16px 0;">
              Congratulations again on closing — it was genuinely a pleasure working with you.
            </p>
            <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 16px 0;">
              I have one small ask. If you felt taken care of through this process, would you mind leaving a quick review? It takes less than two minutes and it means more than you know — it's how families like yours find me.
            </p>

            <!-- Review Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;">
                        <a href="https://g.page/r/CZhfpP-YD5O-EBM/review" style="display:inline-block;background-color:#1E2761;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">⭐ Leave a Google Review</a>
                      </td>
                      <td>
                        <a href="https://www.zillow.com/lender-profile/adamstyer/" style="display:inline-block;background-color:#C9A84C;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">🏡 Leave a Zillow Review</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 16px 0;">
              And if anything ever comes up down the road — a rate question, a refi, helping a friend buy — I'm always just a text or call away.
            </p>
            <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 8px 0;">
              Thanks again. Enjoy the new place.
            </p>
          </td>
        </tr>

        <!-- Signature -->
        <tr>
          <td style="padding:0 40px 40px 40px;border-top:1px solid #eeeeee;">
            <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="padding-right:16px;vertical-align:top;">
                  <img src="https://styermortgage.com/assets/headshot.jpg" width="50" height="50" style="border-radius:50%;display:block;" alt="Adam Styer" />
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0;font-size:16px;font-weight:700;color:#1E2761;">Adam Styer</p>
                  <p style="margin:2px 0;font-size:13px;color:#666666;">Senior Loan Officer | Mortgage Solutions LP</p>
                  <p style="margin:2px 0;font-size:13px;color:#666666;">NMLS# 513013</p>
                  <p style="margin:2px 0;font-size:13px;"><a href="tel:5129566010" style="color:#1E2761;text-decoration:none;">(512) 956-6010</a></p>
                  <p style="margin:2px 0;font-size:13px;"><a href="mailto:adam@thestyerteam.com" style="color:#1E2761;text-decoration:none;">adam@thestyerteam.com</a></p>
                  <p style="margin:6px 0 0 0;font-size:13px;"><a href="https://styermortgage.com" style="color:#1E2761;text-decoration:none;">styermortgage.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
```

---

## Step 3 — Pre-Send Checklist

After creating the draft, output this checklist exactly:

```
PRE-SEND CHECKLIST — Review Request Email
==========================================

BEFORE SENDING:
[ ] Open draft in Outlook
[ ] Change "To" from adam@thestyerteam.com → [BORROWER_EMAIL]
[ ] Confirm borrower first name is correct in subject and body
[ ] Review tone — warm, personal, not automated
[ ] Send day after closing (not same day)

FIELDS USED:
• Borrower: [FIRST_NAME]
• Email: [BORROWER_EMAIL]
• Google Review Link: https://g.page/r/CZhfpP-YD5O-EBM/review
• Zillow Review Link: https://www.zillow.com/lender-profile/adamstyer/
```

---

## Rules Summary

1. **Draft recipient is always adam@thestyerteam.com** — Adam swaps to borrower before sending
2. **body, subject, bodyFormat must always be null** — all content goes inside `instructions` only
3. **HTML must be flattened to a single line** inside the instructions string — no literal newlines
4. **Never modify hardcoded values**: Google review link, Zillow link, phone, email, NMLS#, website
5. **If FIRST_NAME or BORROWER_EMAIL is missing** — ask Adam before creating the draft
6. **Send timing**: Day after closing — remind Adam in checklist
