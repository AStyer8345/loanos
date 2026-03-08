---
name: contract-received
description: >
  Extracts all key fields from an executed purchase contract and generates three outputs:
  (1) A professional reply-all email to transaction parties (buyer's agent, listing agent, title, TCs)
  acknowledging contract receipt and confirming loan details,
  (2) A separate borrower welcome email introducing Adam and setting expectations,
  (3) An Arive data entry checklist with all extracted fields organized by section.
  Use this skill whenever Adam says "contract received", "new contract", "got a contract",
  uploads a purchase contract PDF, or forwards a contract email and wants to kick off the loan process.
  Trigger on any phrase like: "contract received — [name]", "new contract for [address]",
  "process this contract", "kick off [name] file", or when Adam uploads a TREC contract.
---
# Contract Received Skill
## Overview
Triggered by: Executed purchase contract PDF + request to process
Output: 3 deliverables — (1) Party reply email draft, (2) Borrower welcome email draft, (3) Arive checklist
Method: Outlook drafts via Zapier (microsoft_outlook_create_draft_email)
Executor: Adam reviews all drafts in Outlook before sending
---
## Step 1: Extract Fields from Contract
Read the attached contract PDF and extract ALL of the following. If a field cannot be found, **do not guess** — flag it in the checklist and leave the placeholder in the email.
### Parties
| Field | Where to Find It |
|---|---|
| Buyer Name(s) | Page 1 – Paragraph 1 (Buyer) |
| Buyer Email(s) | Page 8 – Paragraph 21 (Notices to Buyer) |
| Seller Name(s) | Page 1 – Paragraph 1 (Seller) |
| Seller Email(s) | Page 8 – Paragraph 21 (Notices to Seller) |
| Buyer's Agent Name | Page 10 – Broker Information (Selling Associate) |
| Buyer's Agent Email | Page 10 – Broker Information |
| Buyer's Agent Phone | Page 10 – Broker Information |
| Buyer's Agent Brokerage | Page 10 – Broker Information |
| Listing Agent Name | Page 10 – Broker Information (Listing Associate) |
| Listing Agent Email | Page 10 – Broker Information |
| Listing Agent Phone | Page 10 – Broker Information |
| Listing Agent Brokerage | Page 10 – Broker Information (Team Name or Firm) |
### Property & Deal
| Field | Where to Find It |
|---|---|
| Property Address | Page 1 – Paragraph 2 |
| City, State, Zip | Page 1 – Paragraph 2 |
| County | Page 1 – Paragraph 2 |
| Legal Description | Page 1 – Paragraph 2A (Lot, Block, Addition) |
| Sales Price | Page 1 – Paragraph 3C |
| Cash at Closing | Page 1 – Paragraph 3A |
| Loan Amount (Financing) | Page 1 – Paragraph 3B |
| Earnest Money | Page 2 – Paragraph 5A |
| Option Fee | Page 2 – Paragraph 5A |
| Option Period (days) | Page 2 – Paragraph 5B |
| Effective Date | Page 9 – Execution section |
| Closing Date | Page 5 – Paragraph 9A |
### Title & Escrow
| Field | Where to Find It |
|---|---|
| Title Company Name | Page 2 – Paragraph 6A |
| Title Company Address | Page 2 – Paragraph 5A (escrow agent address) |
| Title Contact Name | From forwarded email if available, otherwise flag |
| Title Contact Email | From forwarded email if available, otherwise flag |
| Title Contact Phone | From forwarded email if available, otherwise flag |
### Loan-Relevant Terms
| Field | Where to Find It |
|---|---|
| Seller Concessions | Page 6 – Paragraph 12(2) or 12(1)(c) |
| HOA (Yes/No) | Page 3 – Paragraph 6E(2) |
| Home Warranty Amount | Page 5 – Paragraph 7H |
| Property Condition | Page 5 – Paragraph 7D (As-Is or repairs) |
| Survey Provided | Page 3 – Paragraph 6C |
| Special Provisions | Page 6 – Paragraph 11 |
### Calculated Fields
| Field | Calculation |
|---|---|
| Option Period Expiration | Effective Date + Option Period days |
| Down Payment % | (Cash at Closing / Sales Price) × 100, rounded |
| Estimated LTV | (Loan Amount / Sales Price) × 100, rounded |
---
## Step 2: Generate Party Reply Email
This email replies to the transaction parties: buyer's agent, listing agent, title company, and any TCs on the original email.
Use the Zapier Microsoft Outlook Create Draft Email tool.
**CRITICAL — Tool Usage Rules (same as other skills):**
- Pass body parameter as null
- Pass subject parameter as null
- Pass bodyFormat parameter as null
- Put ALL content (To, CC, Subject, Body Format, and full HTML body) inside the instructions parameter only
**Recipients:**
- TO: Buyer's Agent email
- CC: Listing Agent email, Title Contact email (if available)
- If Adam mentions TCs or other parties from the forwarded email, add them to CC
**Subject:** `Under Contract – [PROPERTY ADDRESS] | [BUYER NAME(S)]`
### HTML Email Template — Party Reply
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;">
<p>Hey team,</p>
<p>Thanks for getting this over — excited to work on this one together. I've reviewed the contract and wanted to confirm the key details on my end and lay out next steps from the lending side.</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">DEAL SUMMARY</p>
<hr style="border: 1px solid #cccccc;">
<p>
Property: <strong>[PROPERTY ADDRESS]</strong><br>
Buyer(s): <strong>[BUYER NAME(S)]</strong><br>
Sales Price: <strong>$[SALES PRICE]</strong><br>
Loan Amount: <strong>$[LOAN AMOUNT]</strong><br>
Down Payment: <strong>~[DOWN PAYMENT %]%</strong><br>
Earnest Money: <strong>$[EARNEST MONEY]</strong><br>
Option Fee: <strong>$[OPTION FEE]</strong><br>
Option Period Expires: <strong>[OPTION EXPIRATION DATE]</strong><br>
Closing Date: <strong>[CLOSING DATE]</strong><br>
Seller Concessions: <strong>$[SELLER CONCESSIONS]</strong><br>
Title Company: <strong>[TITLE COMPANY NAME]</strong>
</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">NEXT STEPS FROM LENDING</p>
<hr style="border: 1px solid #cccccc;">
<ol style="padding-left: 20px;">
<li>Loan registered and disclosures issued</li>
<li>Rate locked</li>
<li>File submitted to processing and underwriting</li>
<li>Appraisal ordered once we have initial approval</li>
<li>Clear to close targeted ahead of [CLOSING DATE]</li>
</ol>
<p>I'll keep everyone in the loop on milestone updates as we move through the process. If anything changes on the contract side, please let me know right away so we can stay aligned.</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">TRANSACTION PARTIES</p>
<hr style="border: 1px solid #cccccc;">
<p>
Buyer(s): [BUYER NAME(S)]<br>
Seller(s): [SELLER NAME(S)]<br>
Buyer's Agent: [BA NAME] — [BA BROKERAGE]<br>
Listing Agent: [LA NAME] — [LA BROKERAGE]<br>
Title: [TITLE COMPANY NAME] — [TITLE CONTACT NAME]<br>
Lender: Adam Styer — Mortgage Solutions LP
</p>
<p>Let me know if I'm missing anyone or if any of the above needs correcting. Let's get this closed.</p>
<p>
Adam Styer<br>
Senior Loan Officer | Mortgage Solutions LP<br>
NMLS# 513013<br>
(512) 956-6010<br>
adam@thestyerteam.com
</p>
</body>
</html>
```
---
## Step 3: Generate Borrower Welcome Email
This is a SEPARATE email draft sent to the borrower(s) only.
**Recipients:**
- TO: All buyer email addresses from contract
**Subject:** `Welcome – Your Loan for [PROPERTY ADDRESS] | Adam Styer`
### HTML Email Template — Borrower Welcome
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;">
<p>Hi [BUYER FIRST NAME(S)],</p>
<p>Congratulations on getting under contract on [PROPERTY ADDRESS] — that's a big deal and I'm glad to be working with you on the financing side.</p>
<p>I wanted to reach out personally to introduce myself and walk you through what happens next so there are no surprises.</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">WHAT HAPPENS FROM HERE</p>
<hr style="border: 1px solid #cccccc;">
<ol style="padding-left: 20px;">
<li><strong>Document Collection</strong> — If we need any additional documents from you, you can upload them directly through your loan portal below. The faster we get everything in, the faster we move.</li>
<li><strong>Processing & Underwriting</strong> — Once everything is submitted, our team reviews and works toward an initial approval.</li>
<li><strong>Appraisal</strong> — We'll order the appraisal once we have approval. This confirms the home's value for the lender.</li>
<li><strong>Clear to Close</strong> — Once all conditions are met, we issue the clear to close and you'll receive your final closing numbers.</li>
<li><strong>Closing Day</strong> — Currently scheduled for <strong>[CLOSING DATE]</strong>. You sign, you fund, you get the keys.</li>
</ol>
<p><a href="https://mslp.my1003app.com/513013/register?time=1767737197980" style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Loan Portal — Upload Documents</a></p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">IMPORTANT — PROTECT YOUR APPROVAL</p>
<hr style="border: 1px solid #cccccc;">
<p>From now until you have your keys in hand, please avoid the following:</p>
<ul style="padding-left: 20px;">
<li>Do not open any new credit accounts or make large purchases</li>
<li>Do not move or transfer large sums of money between accounts</li>
<li>Do not change jobs or employment status</li>
<li>Do not co-sign on anything</li>
<li>Do not miss any payments on existing accounts</li>
</ul>
<p>Any of these can delay or jeopardize your closing. When in doubt, call me first.</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">YOUR DEAL AT A GLANCE</p>
<hr style="border: 1px solid #cccccc;">
<p>
Property: <strong>[PROPERTY ADDRESS]</strong><br>
Sales Price: <strong>$[SALES PRICE]</strong><br>
Target Closing: <strong>[CLOSING DATE]</strong><br>
Your Agent: <strong>[BA NAME]</strong>
</p>
<hr style="border: 1px solid #cccccc;">
<p style="font-weight: bold; font-size: 15px;">HOW TO REACH ME</p>
<hr style="border: 1px solid #cccccc;">
<p>I'm available by call, text, or email. If something comes up or you have a question at any point in this process — reach out. That's what I'm here for.</p>
<p>
<strong>Call or text:</strong> <a href="tel:5129566010">(512) 956-6010</a><br>
<strong>Email:</strong> adam@thestyerteam.com<br>
<strong>Schedule a call:</strong> <a href="https://calendly.com/adamstyer/15minutes">Book Time on My Calendar</a>
</p>
<p>Looking forward to getting this done for you.</p>
<p>
Adam Styer<br>
Senior Loan Officer | Mortgage Solutions LP<br>
NMLS# 513013<br>
(512) 956-6010<br>
adam@thestyerteam.com
</p>
</body>
</html>
```
**Hardcoded links — do not change:**
- Loan Application: https://mslp.my1003app.com/513013/register?time=1767737197980
- Calendar: https://calendly.com/adamstyer/15minutes
- Phone: 512-956-6010
- Email: adam@thestyerteam.com
- NMLS: 513013
---
## Step 4: Output Arive Data Entry Checklist
After generating both email drafts, display this checklist in chat for Adam to work from when entering the loan into Arive.
```
================================================================
ARIVE DATA ENTRY CHECKLIST — [BUYER NAME(S)]
[PROPERTY ADDRESS]
================================================================
BORROWER INFORMATION
 [ ] Borrower 1: [BUYER 1 FULL NAME]
 [ ] Borrower 1 Email: [BUYER 1 EMAIL]
 [ ] Borrower 2: [BUYER 2 FULL NAME] (if applicable)
 [ ] Borrower 2 Email: [BUYER 2 EMAIL] (if applicable)
PROPERTY INFORMATION
 [ ] Property Address: [FULL ADDRESS WITH ZIP]
 [ ] County: [COUNTY]
 [ ] Property Type: Single Family / 1-4 Family (per contract form)
 [ ] Occupancy: Primary Residence (confirm with borrower)
LOAN INFORMATION
 [ ] Sales Price: $[SALES PRICE]
 [ ] Loan Amount: $[LOAN AMOUNT]
 [ ] Down Payment: $[CASH AT CLOSING] (~[DOWN PAYMENT %]%)
 [ ] Loan Purpose: Purchase
 [ ] Loan Type: [Conventional/FHA/VA/USDA — from Third Party Financing Addendum if attached]
KEY DATES
 [ ] Effective Date: [EFFECTIVE DATE]
 [ ] Option Expiration: [OPTION EXPIRATION DATE]
 [ ] Closing Date: [CLOSING DATE]
 [ ] Contract Date: [EFFECTIVE DATE]
TRANSACTION PARTIES — Input in Arive Contacts
 [ ] Buyer's Agent: [BA NAME]
     Email: [BA EMAIL]
     Phone: [BA PHONE]
     Brokerage: [BA BROKERAGE]
 [ ] Listing Agent: [LA NAME]
     Email: [LA EMAIL]
     Phone: [LA PHONE]
     Brokerage: [LA BROKERAGE]
 [ ] Title Company: [TITLE COMPANY NAME]
     Address: [TITLE ADDRESS]
     Contact: [TITLE CONTACT NAME]
     Email: [TITLE CONTACT EMAIL]
     Phone: [TITLE CONTACT PHONE]
 [ ] Seller(s): [SELLER NAME(S)]
FINANCIAL DETAILS
 [ ] Earnest Money: $[EARNEST MONEY]
 [ ] Option Fee: $[OPTION FEE]
 [ ] Seller Concessions: $[SELLER CONCESSIONS]
 [ ] Home Warranty: $[HOME WARRANTY AMOUNT]
 [ ] HOA: [YES/NO]
OTHER NOTES
 [ ] Property Condition: [AS-IS / REPAIRS]
 [ ] Special Provisions: [SPECIAL PROVISIONS TEXT]
 [ ] Survey: [PROVIDED / NOT PROVIDED]
SALESFORCE / JUNGO (via Arive sync)
 [ ] Borrower contact(s) created — Account: Database, Group: Client, Stage: Lead
 [ ] Lead Source: Realtor Referral (set to [BA NAME])
 [ ] Realtor contact verified — Account: Realtor Database
 [ ] Loan record linked to contacts
================================================================
```
---
## Step 5: Pre-Send Checklist
After all outputs are generated, display this final checklist:
```
PRE-SEND CHECKLIST — [BUYER NAME(S)] | [PROPERTY ADDRESS]
PARTY REPLY EMAIL
 [ ] Verify all recipient emails are correct
 [ ] Confirm deal summary numbers match contract
 [ ] Add any TCs or additional parties from original email to CC
 [ ] Review and send from Outlook
BORROWER WELCOME EMAIL
 [ ] Verify borrower email(s): [EMAILS]
 [ ] Confirm closing date is correct
 [ ] Confirm buyer's agent name
 [ ] Review and send from Outlook
ARIVE ENTRY
 [ ] All borrower info entered
 [ ] All property info entered
 [ ] All loan details entered
 [ ] All transaction parties added
 [ ] Key dates set
 [ ] Milestone notifications active
FIELDS EXTRACTED:
 ✅ or ⚠️ MISSING — [list each field with status]
Drafts saved to Outlook as: adam@thestyerteam.com
```
---
## Rules Summary
- **Recipients — Party Reply:** BA, LA, title, TCs. Never include buyers or sellers.
- **Recipients — Borrower Welcome:** Buyer email(s) only. Never include agents or sellers.
- **Tone — Party Reply:** Professional peer-to-peer. Confident, organized, brief.
- **Tone — Borrower Welcome:** Warm, authoritative, educational. Not salesy.
- **Missing fields:** Flag in checklist. Leave `[PLACEHOLDER]` in email. Do not guess.
- **Links:** Hardcoded. Never change without Adam's instruction.
- **Draft method:** Zapier Outlook tool only. body/subject/bodyFormat params = null. Everything in instructions.
- **Draft recipient:** Both drafts go to adam@thestyerteam.com first. Adam swaps recipients before sending.
- **Financing Addendum:** If Third Party Financing Addendum is attached, extract loan type (Conv/FHA/VA/USDA), interest rate, and loan term if available.
- **Salesforce defaults:** Borrower contacts → Account: Database, Group: Client, Stage: Lead. Realtor contacts → Account: Realtor Database.
- **Option expiration:** Always calculate from Effective Date + Option Period days. Flag weekends/holidays.