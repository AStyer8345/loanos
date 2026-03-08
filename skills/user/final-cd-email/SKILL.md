---
name: final-cd-email
description: >
  Generates and sends a fully populated Final Closing Disclosure (CD) email draft to Outlook via Zapier.
  Use this skill whenever Adam says "Final CD email" or "CD email" or attaches a Closing Disclosure PDF and asks to draft the closing email.
  Extracts 10 fields from the CD, populates the hardcoded HTML template, sends the draft to adam@thestyerteam.com via Outlook Drafts (Zapier), and outputs a pre-send checklist.
  Trigger on any phrase like: "Final CD email — [name]", "send CD email", "draft closing email", "CD is done, send the email".
---

# Final CD Email Skill

## Overview

Triggered by: `"Final CD email — [borrower name]"` + attached Closing Disclosure PDF  
Output: HTML email draft → Outlook Drafts via Zapier (to: adam@thestyerteam.com as placeholder)  
Executor: Adam only

---

## Step 1: Extract Fields from CD

Read the attached CD PDF and extract the following. If a field cannot be found, **do not guess** — flag it in the checklist below and leave the placeholder in the email.

| Field | Where to Find It |
|---|---|
| Borrower First Name | Page 1 – Borrower section |
| Cash to Close | Page 1 – Costs at Closing |
| Closing Date | Page 1 – Closing Information |
| Monthly Payment (P&I) | Page 1 – Loan Terms |
| First Payment Due | **Calculate:** closing month + 2 (e.g., closes March 15 → First payment May 1) |
| Property Address | Page 1 – Property (for post-signing section ONLY — never use as signing location) |
| Title Company Name | Page 1 – Settlement Agent |
| Title Contact Name | Page 5 – Contact Information |
| Title Phone | Page 5 – Contact Information |
| Title Email | Page 5 – Contact Information |

**Signing location rule:** NEVER use the property address or any CD address as the signing location. Always replace with: *"Please confirm signing location with your realtor."*

---

## Step 2: Populate and Send HTML Email via Zapier

Use the Zapier Microsoft Outlook Create Draft Email tool with the following:

- **To:** adam@thestyerteam.com *(placeholder — Adam swaps to borrower before sending)*
- **Subject:** `Your Final Closing Numbers – Action Required Before [CLOSING DATE]`
- **Body Format:** HTML
- **Body:** Full HTML template below with all fields substituted

### HTML Email Template

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;">

<p>Hi [BORROWER FIRST NAME],</p>

<p>Great news — your Closing Disclosure is finalized. Here's everything you need to know before your closing on [CLOSING DATE].</p>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">FINAL NUMBERS</p>
<hr style="border: 1px solid #cccccc;">
<p>
Cash to Close: <strong>$[CASH TO CLOSE]</strong><br>
Closing Date: <strong>[CLOSING DATE]</strong><br>
First Payment Due: <strong>[FIRST PAYMENT DATE]</strong><br>
Monthly Payment (P&amp;I): <strong>$[MONTHLY PAYMENT]</strong>
</p>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">WIRE INSTRUCTIONS — READ THIS</p>
<hr style="border: 1px solid #cccccc;">
<p>Funds must be sent via wire transfer. Wire is strongly preferred by the title company and ensures same-day funding. If wire is not possible, a cashier's check made payable to the title company is acceptable — contact us first before going that route.</p>

<p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">⚠️ <strong>WIRE FRAUD WARNING:</strong> Wire fraud is common in real estate transactions. Before sending any wire, call the title company directly using the number below to verbally confirm the instructions. Do not rely solely on emailed wire instructions — even if they appear to come from us or the title company.</p>

<p>
Title Company: <strong>[TITLE COMPANY NAME]</strong><br>
Contact: <strong>[TITLE CONTACT NAME]</strong><br>
Phone: <strong>[TITLE PHONE]</strong><br>
Email: <strong>[TITLE EMAIL]</strong>
</p>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">CLOSING DETAILS</p>
<hr style="border: 1px solid #cccccc;">
<p>
Date: <strong>[CLOSING DATE]</strong><br>
Location: <strong>[TITLE COMPANY NAME]</strong><br>
<em>Please confirm signing location with your realtor.</em>
</p>
<p><strong>What to bring:</strong></p>
<ul>
<li>Government-issued photo ID</li>
<li>Proof of wire confirmation (or cashier's check if applicable)</li>
<li>Any documents we've requested</li>
</ul>
<p>Plan for approximately <strong>45–60 minutes</strong>.</p>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">WHAT HAPPENS AFTER SIGNING</p>
<hr style="border: 1px solid #cccccc;">
<ul>
<li>Keys are released after funding — not immediately after signing</li>
<li>Funding typically occurs same day or next business day</li>
<li>Your first mortgage payment is due <strong>[FIRST PAYMENT DATE]</strong></li>
<li>Property: <strong>[PROPERTY ADDRESS]</strong></li>
</ul>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">BEFORE YOU CLOSE — CRITICAL</p>
<hr style="border: 1px solid #cccccc;">
<p>You're in the final stretch. Please avoid the following until after you have your keys:</p>
<ul>
<li>❌ Do not open any new credit accounts or make large purchases</li>
<li>❌ Do not move or transfer large sums of money between accounts</li>
<li>❌ Do not change jobs or employment status</li>
<li>❌ Do not miss any payments on existing accounts</li>
</ul>
<p>Any one of these can delay or derail your closing. We're too close.</p>

<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">ONE LAST THING</p>
<hr style="border: 1px solid #cccccc;">
<p>It has been a pleasure working with you on this. If you feel we earned it, a quick review goes a long way for a small business like ours:</p>
<ul>
<li><a href="https://share.google/ddpwv31jI2oqzN5Ia">Leave a Google Review</a></li>
<li><a href="https://www.zillow.com/lender-profile/adamstyer/">Leave a Zillow Review</a></li>
</ul>
<p>And if anyone in your life is buying, selling, or refinancing, I'd love the opportunity to help them the same way.</p>
<p>Any questions before closing, call or text me directly.</p>

<p>
Adam Styer<br>
Mortgage Banker | The Styer Team<br>
(512) 956-6010<br>
adam@thestyerteam.com<br>
NMLS# 513013
</p>

</body>
</html>
```

**Hardcoded links — do not change:**
- Google Review: https://share.google/ddpwv31jI2oqzN5Ia
- Zillow Review: https://www.zillow.com/lender-profile/adamstyer/

---

## Step 3: Output Pre-Send Checklist

After sending the draft, display this checklist in chat. Mark any fields that were missing from the CD with ⚠️:

```
PRE-SEND CHECKLIST — [BORROWER NAME]

 [ ] Swap TO address: adam@thestyerteam.com → borrower's actual email
 [ ] Confirm signing location with realtor — update if needed
 [ ] Verify cash to close matches final wire amount
 [ ] Confirm first payment date: closing month + 2

FIELDS EXTRACTED:
 ✅ or ⚠️ MISSING — Borrower First Name
 ✅ or ⚠️ MISSING — Cash to Close
 ✅ or ⚠️ MISSING — Closing Date
 ✅ or ⚠️ MISSING — Monthly Payment (P&I)
 ✅ or ⚠️ MISSING — First Payment Date (calculated)
 ✅ or ⚠️ MISSING — Property Address
 ✅ or ⚠️ MISSING — Title Company Name
 ✅ or ⚠️ MISSING — Title Contact Name
 ✅ or ⚠️ MISSING — Title Phone
 ✅ or ⚠️ MISSING — Title Email

Draft saved to Outlook Drafts as: adam@thestyerteam.com
```

---

## Rules Summary

- **Signing location:** Never populate from CD. Always use: *"Please confirm signing location with your realtor."*
- **First payment:** Always closing month + 2, formatted as `[Month] 1, [Year]`
- **Missing fields:** Flag in checklist. Leave `[PLACEHOLDER]` in email. Do not guess.
- **Review links:** Hardcoded. Never change.
- **Draft recipient:** Always adam@thestyerteam.com. Never the borrower directly.
