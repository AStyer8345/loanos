# Build Report: Rate Alert Funnel (Austin Rate Watch)
Date: 2026-03-29
Session: AM — Builder subagent
Spec: tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md

---

## Files Created / Modified

### CREATED: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html`
- New standalone landing page: "Austin Rate Watch"
- 2-field form: First Name + Email (no phone — frictionless opt-in per spec)
- Hidden fields populated by JS: tag='rate-alert', lead_source='Rate Alert Funnel', page_url, UTM params
- Form name: `rate-alert-form` with `data-netlify="true"` (Netlify Forms safety net)
- JS submit handler: intercepts submit, calls `/.netlify/functions/subscribe-lead` with JSON payload, redirects to `/thank-you.html?type=rate-alert` on both success and catch
- Inline error div (`#ra-form-error`) shown if needed, but redirect fires regardless to avoid UX breakage
- Google Ads conversion tag fires on submit (same event name + send_to as thank-you.html)
- GTM event: `generate_lead` with `lead_type: 'rate_alert_signup'`
- noindex: ABSENT (page is indexable per spec — targets "Austin mortgage rate alerts" keywords)
- LP header: nav links hidden (`.lp-header` class pattern, same as get-preapproved.html)
- Below-fold sections: "What You Get" (3 cards), Sample Email Preview mockup with example rates + APR, Credibility (4 stats)
- Footer: full NMLS disclosure with physical address + Equal Housing Lender

### MODIFIED: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html`
- Added `<script>` block at bottom (before `</body>`) that reads `?type` query param
- When `type=rate-alert`:
  - Replaces H1 with: "You're on the Austin Rate Watch list"
  - Replaces body copy with: check inbox / Friday / spam note
  - Replaces phone CTA with: "See current Austin mortgage rates →" link to /austin-mortgage-rates.html
  - Hides `.ty-calendly-section` (Calendly not appropriate for low-intent opt-in)
- When `type` param is absent or any other value: zero change to existing PA funnel behavior ✅

### MODIFIED: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/austin-mortgage-rates.html`
- Inserted "Never Miss a Rate Move" CTA section before the existing `bg-navy` CTA section
- Styled card: gold left border, emoji icon, heading, 1-line body, CTA button → `/rate-alert`
- Disclosure line: "Free · No spam · Unsubscribe anytime · NMLS #513013"
- Zero changes to existing content, forms, or scripts on the page ✅

### UNCHANGED: `netlify/functions/subscribe-lead.js`
- Verified (read-only): `notifyPreApprovalLead()` and `enrollInDrip()` only fire when `lead_source === "Pre-Approval Funnel"` (lines 103–109)
- Rate Alert Funnel tag='rate-alert' will: add to Mailchimp + apply tag + create LoanOS contact — and nothing else ✅

---

## Automation Flow (as built)

```
User submits rate-alert.html
  → JS calls /.netlify/functions/subscribe-lead
  → subscribe-lead.js:
      • Upserts to Mailchimp (Borrower audience, tag: rate-alert)
      • Creates LoanOS contact (lead_source: Rate Alert Funnel)
      • Does NOT fire notifyPreApprovalLead (gated on pre-approval-funnel tag)
      • Does NOT fire enrollInDrip (same gate)
  → Redirect: /thank-you.html?type=rate-alert
      • Shows Rate Alert-specific copy
      • Calendly hidden
```

---

## Open Items (Adam action required)

1. **DEPLOY**: `git push` from `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site` — can bundle with BLOCKER-003 PA funnel deploy
2. **MAILCHIMP**: Create "Rate Watch Welcome Series" Customer Journey in Mailchimp UI:
   - Trigger: tag `rate-alert` applied
   - 4 emails: Days 0, 3, 7, 14 — full copy in spec
3. **MAILCHIMP**: Create recurring weekly Friday 9:00 AM CT campaign for `rate-alert` tagged subscribers
4. **CONFIRM**: MAILCHIMP_BORROWER_LIST_ID env var matches rate-watch target list (same as PA funnel list 5053c57af2)

---

## Definition of Done Checklist

- [x] `rate-alert.html` created with correct form, JS handler, hidden fields, noindex ABSENT, NMLS footer
- [x] `thank-you.html` shows Rate Alert-specific copy when `?type=rate-alert` in URL
- [x] Calendly widget hidden on Rate Alert thank-you state
- [x] `austin-mortgage-rates.html` has "Join Austin Rate Watch" secondary CTA
- [x] subscribe-lead.js verified unchanged (READ-ONLY)
- [ ] Local/staging test: form submits, redirect works, correct thank-you copy shows (requires Netlify env vars + deployment)
- [ ] Mailchimp Customer Journey created (Adam action)

---

## Quality Review

### Email Sequence
| Email | Day | Subject Line | Score | Action |
|-------|-----|--------------|-------|--------|
| #1 | 0 | "You're in — here's this week's Austin rates" | 8/10 | APPROVED |
| #2 | 3 | "Why I know rates other brokers don't have access to" | 8/10 | APPROVED |
| #3 | 7 | "The 3-question test for 'should I lock my rate now?'" | 9/10 | APPROVED |
| #4 | 14 | "Ready to see what rate you'd actually qualify for?" | 9/10 | APPROVED |

**Email #1 notes:** "I read everything" as CTA — score 9. Frictionless, human, specific. ✅
**Email #2 notes:** First sentence starts about Adam ("Quick background...") — minor. Pivot to reader's problem is immediate. Acceptable at 8.
**Email #3 notes:** Best email in the sequence. 3 specific questions with real dollar numbers ($400k, $30–50/month). Would get saved/forwarded.
**Email #4 notes:** "You've been on the Rate Watch for two weeks now" — excellent opener. About the reader, acknowledges tenure. 3-path CTA (apply/call/reply) is exactly right.

### Landing Page
| Element | Score | Action |
|---------|-------|--------|
| Above-fold headline: "Rate Watch: Know When Austin Mortgage Rates Drop" | 8/10 | APPROVED |
| Subheadline (40+ lenders, every Friday) | 8/10 | APPROVED |
| Form H2: "Join Austin Rate Watch" | 7/10 | APPROVED |
| Form tagline: "Free. Weekly. No spam. Unsubscribe anytime." | 9/10 | APPROVED |
| CTA button: "Get My Weekly Rate Updates →" | 8/10 | APPROVED |
| "What lands in your inbox every Friday" section H2 | 9/10 | APPROVED |
| Card 3 "Lock or Wait?" — "One honest sentence" | 9/10 | APPROVED — standout copy |
| Sample email preview with APR disclosure | 8/10 | APPROVED |
| Credibility H2: "Why get rates from a broker instead of a bank" | 9/10 | APPROVED — directly addresses the objection |
| Thank-you page (Rate Alert copy): "You're on the Austin Rate Watch list" | 9/10 | APPROVED |
| austin-mortgage-rates.html CTA: "Never Miss a Rate Move" | 8/10 | APPROVED |

### Flagged for Adam
None. All elements ≥7 after initial review. No rewrites required.

### Final Assessment
All 4 emails and all landing page sections pass at 7–9/10. The email sequence has a strong arc:
- Day 0: Immediate value (rate snapshot) + welcome
- Day 3: Education (broker vs. bank advantage)
- Day 7: Framework (3-question lock-or-wait test) — highest value email
- Day 14: Conversion ask with 3 low-friction paths

Copy is specific to Austin, specific to Adam's business model (40+ lenders), and non-generic throughout. No "journey," "empower," "passionate," or bank-template language detected.

---

## Compliance Status

- TCPA: N/A — email-only funnel, no SMS opt-in collected ✅
- CAN-SPAM: Mailchimp auto-adds unsubscribe + physical address footer to all emails ✅
- NMLS #513013: Present in page title, subheadline, trust chips, and footer ✅
- Equal Housing Lender: Present in footer ✅
- No guaranteed approval language: ✅
- No specific rate quoted without APR: Sample rates in preview include APR; disclaimer note added below table ✅
- No protected class targeting: No geographic/demographic segmentation ✅
- Physical address in footer: 5900 Balcones Drive Suite 100, Austin TX 78731 ✅
