---
name: referral-intro-email
description: >
  Generates a personalized referral introduction email to a new buyer lead and sends an Outlook draft via Zapier.
  Use this skill whenever Adam provides a new referral lead and wants to send an intro email.
  Extracts lead details (name, referral source, target area, price range, timeline) and populates
  the hardcoded HTML template, then creates an Outlook draft for Adam to review and send.
  Trigger on any phrase like: "send referral intro email", "draft intro to [name]", "email the referral from [agent]",
  "add them as a contact and send an email", or when Adam creates a new lead contact and asks to email them.
---

# Referral Intro Email Skill

## Overview

Triggered by: New referral lead added + request to email them  
Output: Outlook draft created via Zapier (microsoft_outlook_create_draft_email)  
Executor: Adam reviews draft in Outlook and sends

---

## Step 1: Extract Lead Details

Gather the following from context (conversation, screenshots, CRM entry, or Adam's notes). If a field is missing, flag it and use the fallback shown.

| Field | Source | Fallback |
|---|---|---|
| Buyer First Name | Contact info / screenshot | "[Name]" |
| Referring Agent Name | Adam's message or CRM | "[Referral Source]" |
| Referring Agent first name only | Parse from full name | "[Agent]" |
| Target Area / Neighborhood | Adam's message | "the area you're targeting" |
| Price Range | Adam's message | omit line |
| Timeline | Adam's message | "the coming months" |
| Buyer Email | Contact info | flag as missing |

---

## Step 2: Build HTML Email Body

Substitute all [PLACEHOLDERS] with extracted values. Do not change the tone, structure, or Adam's voice.

HTML TEMPLATE:
<p>Hi [BUYER FIRST NAME],</p>

<p>My name is Adam Styer and [AGENT FIRST NAME] shared your information with me and said you were wanting to get pre-approved for a purchase [TIMELINE] in [TARGET AREA]. I've known [AGENT FIRST NAME] for a good while now — great agent and great person. You're in good hands with [them/her/him].</p>

<p>I'd be happy to walk you through the pre-approval process and give you an overview of how we work. Feel free to call me directly at <a href="tel:5129566010">512-956-6010</a>, or grab time directly on my calendar here: <a href="https://calendly.com/adamstyer/15minutes">Schedule a Call</a></p>

<p>I'll also include a link to the loan application below. You're welcome to wait until after we talk to complete it, but if you'd like to get started now, it can help make that first conversation more productive by dialing in your purchasing power and next steps. Completely up to you.</p>

<p><a href="https://mslp.my1003app.com/513013/register?time=1767737197980">Loan Application</a></p>

<p>Looking forward to connecting.</p>

<p>Adam Styer<br>Senior Loan Officer | Mortgage Solutions LP<br>NMLS# 513013<br>(512) 956-6010<br>adam@thestyerteam.com</p>

Hardcoded links — do not change:
- Calendar: https://calendly.com/adamstyer/15minutes
- Loan Application: https://mslp.my1003app.com/513013/register?time=1767737197980
- Phone: 512-956-6010
- Email: adam@thestyerteam.com
- NMLS: 513013

---

## Step 3: Send Outlook Draft via Zapier

Use the microsoft_outlook_create_draft_email Zapier tool.

CRITICAL — Tool Usage Rules:
- Pass body parameter as null
- Pass subject parameter as null
- Pass bodyFormat parameter as null
- Put ALL content (To, Subject, Body Format, and full HTML body) inside the instructions parameter only
- This prevents Zapier from leaking parameter values into the email body

Instructions parameter format:
Create a draft email in Microsoft Outlook with the following:

To: [BUYER EMAIL]
Subject: Connecting with You – Adam Styer | Mortgage Solutions LP
Body Format: HTML
Body: [FULL HTML BODY — single line, no line breaks]

---

## Step 4: Display Pre-Send Checklist in Chat

After draft is created, show Adam:

OUTLOOK DRAFT CREATED — [BUYER NAME]

 [ ] Confirm buyer email address is correct: [BUYER EMAIL]
 [ ] Verify referral agent name is spelled correctly
 [ ] Confirm pronoun used: [them/her/him]
 [ ] Confirm calendar link is current
 [ ] Confirm loan app link is current
 [ ] Send from: adam@thestyerteam.com

FIELDS USED:
 - Buyer First Name
 - Referring Agent Name
 - Target Area
 - Timeline
 - Buyer Email

---

## Step 5: Salesforce Notes Update (if not already done)

If the contact was just created or if Adam asks, add a note to the Salesforce contact:

"Referral intro email drafted [DATE]. Referred by [AGENT NAME]. Buyer targeting [AREA], [PRICE RANGE], within [TIMELINE]. Pre-approval needed."

Use salesforce_create_note or update the Notes field on the contact record.

---

## Rules Summary

- Tone: Warm, confident, professional. Not salesy. Matches Adam's voice exactly.
- Agent pronoun: Default to "them" unless Adam specifies gender.
- Missing fields: Flag in checklist. Leave [PLACEHOLDER] in email. Do not guess.
- Links: Hardcoded. Never change without Adam's instruction.
- Draft method: Zapier Outlook tool only. body/subject/bodyFormat params = null. Everything in instructions.
- Subject line: Always use: Connecting with You – Adam Styer | Mortgage Solutions LP
- Do not auto-send. Draft only. Adam sends from Outlook.
