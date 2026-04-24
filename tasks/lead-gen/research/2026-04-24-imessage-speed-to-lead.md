# Research: Outbound iMessage for Speed-to-Lead
# Date: 2026-04-24 AM
# Context: GOALS.md priority — when a lead submits a form, send email + iMessage within 5 minutes

---

## Problem

Current state: web lead submits form → n8n fires Pre-Approval Lead Notify email → ~5 min response.
Missing: text/iMessage to lead immediately. GOALS.md calls this a PRIORITY for this week.

---

## Options Evaluated

### 1. Sendblue (sendblue.co) ✅ RECOMMENDED

**What it is:** Cloud API that sends real iMessages (blue bubble) when recipient has iPhone. Falls back to SMS.

**Pricing:** ~$0.01–0.02/message pay-as-you-go. Free tier for testing. ~$50–150/mo for volume.

**n8n integration:** HTTP Request node. POST to `https://api.sendblue.co/api/sendMessage` with API key header. 5-minute setup.

**Reliability:** High. Production-grade cloud service. No Mac dependency.

**Compliance/ToS risk:** Low-moderate. Operates in gray area — Apple hasn't formally enforced against them. TCPA: requires explicit opt-in language on forms.

**Setup time:** 1 day. Sign up → API key → HTTP Request node in n8n Web Lead workflow.

---

### 2. Twilio SMS (fallback)

**What it is:** SMS (green bubble always). No iMessage.

**Pricing:** ~$0.0079/message. 10DLC registration required (~$20 one-time + $10/mo, takes 1–2 weeks).

**n8n integration:** Native Twilio node. Zero custom code.

**Reliability:** Best-in-class. Rock-solid delivery.

**Use case:** Wire as fallback in same n8n workflow — if Sendblue errors, route to Twilio.

---

### 3. BlueBubbles (self-hosted Mac) ❌ TOO FRAGILE

Requires Mac awake + logged in + Messages.app running + tunnel stable. Apple ID risk at business scale.
Not suitable for unattended automated production use.

---

### 4. AppleScript / JXA ❌ DO NOT USE

Worse than BlueBubbles. Messages.app foreground dependency. Race conditions. Fragile.

---

### 5. Apple Messages for Business ❌ NOT VIABLE

Enterprise program, months-long Apple approval process. Not for solo LO.

---

## Recommended Implementation Plan

### Step 1 — TCPA Language on Forms (REQUIRED before any text sends)

Add to all web forms (get-preapproved.html, rate-alert.html, homepage forms):
> "By submitting this form, you consent to receive calls and text messages at the number provided from Adam Styer | Mortgage Solutions LP (NMLS #513013). Consent is not required to obtain a loan."

This must be added BEFORE activating Sendblue. TCPA violation risk is real.

### Step 2 — Sendblue Setup

1. Sign up at sendblue.co
2. Get API key
3. Add `SENDBLUE_API_KEY` to Netlify env vars (for subscribe-lead.js) and n8n credentials

### Step 3 — n8n Integration

Target workflow: `PiuIsQpBuydtFM4m` (Web Lead Automation) or `J9Pe24vUi6fpZtdZ` (Pre-Approval Lead Notify).

Add HTTP Request node after lead is created:
```
POST https://api.sendblue.co/api/sendMessage
Headers: { "sb-api-key-id": "...", "sb-api-secret-key": "..." }
Body: {
  "number": "+1{{phone}}",
  "content": "Hey {{first_name}}, this is Adam Styer. I got your request — let's talk mortgages. When's a good time to connect? (512) 710-1400",
  "send_style": "invisible"
}
```

Message should be short, human, not automated-sounding. ~160 chars.

### Step 4 — Twilio Fallback (optional, adds ~30 min)

Add Twilio SMS node as error handler branch on the Sendblue node. Fires only if Sendblue returns non-2xx.

---

## ADAM Action Items Required

1. **Add TCPA consent language** to all web forms before activating (5 min, styermortgage.com)
2. **Sign up for Sendblue** (sendblue.co) and get API key
3. **Share Sendblue API key** so agent can wire n8n workflow
4. **Decision: Twilio fallback?** Register 10DLC now (2-week process) or skip.

---

## Spec Status

Research complete. Ready for Sequence C (Execute) once Adam provides Sendblue API key and TCPA language is live on forms.

Build estimate: 1 session (~1.5 hrs)
- Wire Sendblue HTTP node into existing Web Lead n8n workflow
- Add error handling / Twilio fallback if desired
- Test end-to-end with real form submission

---

## Compliance Notes

- TCPA: explicit opt-in required before texting any lead. "Consent is not required to obtain a loan" strengthens the language.
- CAN-SPAM: does not apply to SMS/iMessage (email law only)
- RESPA: texting your own leads about your own services is not a RESPA concern
- Fair lending: no targeting by protected class — this fires for all leads equally
