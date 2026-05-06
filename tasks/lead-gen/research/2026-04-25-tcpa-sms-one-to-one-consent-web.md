# Research — TCPA One-to-One Consent + SMS Mortgage Lead Compliance

**Date:** 2026-04-25
**Source URL:** https://www.scotsmanguide.com/news/navigating-the-perils-of-lead-generation/
**Title:** Navigating the perils of lead generation
**Authority:** Scotsman Guide (top-tier mortgage industry publication)
**Companion regulatory source:** FCC TCPA Rules — https://www.fcc.gov/sites/default/files/tcpa-rules.pdf

## Why This Source

**Pending decision (per yesterday's session-end):** TCPA form language + Sendblue signup before iMessage speed-to-lead build. Today's drip reliability fix (`referred_by` + Ghost Referral guard) is in production. Outbound SMS/iMessage is the next major lead-gen workstream. Compliance must be in place BEFORE the build.

## Three-Sentence Summary

The TCPA's one-to-one consent rule (FCC, in effect April 11, 2026) requires that prior express written consent for marketing autodialed calls or robotexts apply to a single seller at a time, in response to clear and conspicuous disclosure on the website where consent was captured, and topically related to the messaging that follows. For mortgage lead gen, the burden of proof for valid consent rests on the sender — meaning forms must capture and store consent with timestamps, IP, viewable language, and a certificate of authenticity. Hidden checkboxes, terms-of-service burial, or shared lead-list consent for "marketing partners" no longer satisfies the rule.

## Direct Application to LoanOS / styermortgage.com

**Form language (every lead capture form):**

> By providing my phone number and clicking submit, I expressly consent to receive calls and text messages (including SMS/MMS, iMessage, and automated/prerecorded messages) from Adam Styer | Mortgage Solutions LP (NMLS #513013) at the number provided regarding mortgage loans, rates, pre-approvals, and related services. Message and data rates may apply. Consent is not a condition of any service. Reply STOP to opt out at any time.

**Required infrastructure:**
1. **Consent capture** — every form (web-lead, quick-add, prequal, suburb forms) must store: timestamp, IP, user-agent, exact disclosure text version, form URL, opt-in checkbox state.
2. **Database column** — `contacts.tcpa_consent_at TIMESTAMPTZ`, `tcpa_consent_disclosure_version TEXT`, `tcpa_consent_url TEXT`, `tcpa_consent_ip INET`. Migration before iMessage build.
3. **Sendblue gate** — outbound iMessage route must check `tcpa_consent_at IS NOT NULL` and that the consent disclosure version is current. If absent: skip send + log as `tcpa_block`.
4. **STOP handling** — inbound STOP → `contacts.sms_opt_out=true` immediately + suppress all future sends across all channels (SMS, MMS, iMessage). Mirrors existing `email_opt_out` from CAN-SPAM unsubscribe page.
5. **Suppression list** — single `contact_suppressions` table (already exists for email) extended for `sms_opt_out` with same dedup logic.

## Linkage to Existing Sources

- Companion to: CAN-SPAM Act compliance guide (c068a394 — already in notebook), unsubscribe page shipped 2026-04-24
- Replaces gap: prior to today no TCPA-specific authoritative source was in the Lead Gen notebook
- Critical path: spec for Sendblue iMessage build (per yesterday's research file 2026-04-24-imessage-speed-to-lead.md) cannot proceed without TCPA infrastructure first

## Adam Decision Required

Two items blocking the iMessage build (per yesterday's session-end):
1. TCPA form language — approve the disclosure copy above (or revise) so we can update all 5 lead capture forms before Sendblue integration
2. Sendblue account signup — Adam credentials needed before n8n credential is provisioned

Once both are resolved, the Sendblue iMessage workflow can be built per spec at tasks/lead-gen/research/2026-04-24-imessage-speed-to-lead.md.
