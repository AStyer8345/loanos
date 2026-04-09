# Funnel Spec: LO Waitlist Capture — Lead Generation
Date: 2026-04-06
Status: READY FOR EXECUTION — copy approval required before deploy

## Scope
### In Scope
- Static landing page `/loanos-waitlist.html` on styermortgage.com
- New Netlify function `subscribe-lo.js` (does NOT touch borrower funnel code)
- n8n workflow `LoanOS — LO Waitlist Intake` — receives submission, logs to Supabase activity_log, notifies Adam
- Thank-you redirect to `/thank-you.html?source=lo-waitlist`

### Out of Scope
- Mailchimp Customer Journey / email nurture sequence (Adam creates separately)
- Modifying existing subscribe-lead.js, rate-alert.html, get-preapproved.html, or any other existing funnel
- TCPA SMS opt-in (no phone field, email only)
- Paid traffic / SEO (this URL gets shared via social, not ranked)

---

## Funnel Architecture

### Traffic Source
- LoanOS content stream social posts (Instagram, LinkedIn, GBP)
- `loanos-pool.md` post pool entries that CTA to this URL
- Manual shares by Adam in DMs or LinkedIn replies

### Landing Page Design
- **URL:** `/loanos-waitlist.html`
- **Netlify form name:** `lo-waitlist-form`
- **Above-fold headline:** "Building software loan officers actually want."
- **Subheadline:** "LoanOS is a mortgage CRM built by an LO, not a SaaS company. Get on the waitlist."
- **Form fields (5 max):**
  1. First Name (required)
  2. Last Name (required)
  3. Email Address (required)
  4. NMLS# (optional)
  5. Company / Brokerage (optional)
- **SMS opt-in checkbox:** NO — email only, no phone field
- **CTA button text:** "Join the Waitlist"
- **Trust signals:** "Built by a loan officer. No VC. No SaaS bloat."
- **Thank-you redirect:** `/thank-you.html?source=lo-waitlist`

### Email Sequence
No automated sequence for launch. Adam reviews waitlist manually and sends personal note.
Mailchimp list "LoanOS Waitlist" is created by Adam in Mailchimp UI for future nurture.

### Automation Map
```
Form submit (browser)
  → POST /.netlify/functions/subscribe-lo
      → [parallel]
          a. POST to n8n webhook /loanos-waitlist → Supabase activity_log insert + Outlook notify Adam
          b. POST to Mailchimp API (if MAILCHIMP_LO_LIST_ID env var is set) — add to "LoanOS Waitlist" list
      → return 200 success
  → browser redirects to /thank-you.html?source=lo-waitlist
```

### CRM Routing
- **NOT** routed to LoanOS contacts table (LOs are not mortgage applicants)
- Logged to Supabase `activity_log` table with `action_type: 'lo_waitlist_signup'`
- n8n notifies Adam via Outlook with: name, email, NMLS#, company
- **Lead Source tag (Mailchimp):** `loanos-waitlist`

### Conversion Rate Targets
| Stage | Target |
|-------|--------|
| Landing page → form submit | 25–40% (this is a warm audience from social) |
| Form submit → notification to Adam | 100% (sync, not fire-and-forget) |

---

## Execution Instructions for Builder

1. **Create `/loanos-waitlist.html`** — follows exact design system from rate-alert.html (navy hero, gold CTA, IBM Plex fonts, lp-header, lp-footer). Copy per spec above. Mobile-first.
2. **Create `netlify/functions/subscribe-lo.js`** — new file, does NOT touch subscribe-lead.js. Handles: form validation, n8n webhook, optional Mailchimp add if MAILCHIMP_LO_LIST_ID env var set.
3. **Create n8n workflow `LoanOS — LO Waitlist Intake`** via n8n MCP. Webhook path: `/loanos-waitlist`. Actions: Supabase INSERT to activity_log + Outlook email to adam@thestyerteam.com with submission details.
4. **Update `/thank-you.html`** — confirm `?source=lo-waitlist` branch exists or add it. Show: "You're on the list. I'll reach out personally when LoanOS is ready."
5. **Update `tasks/ADAM-TODO.md`** — add copy review + Mailchimp list creation items.
6. **Commit to repo** (git add + commit). Do NOT push to production — copy review required first.

---

## Tools / Accounts / Credentials Needed
- [x] styerteam-mortgage-site repo (local: /Users/adamstyer/Documents/Claude/styerteam-mortgage-site)
- [x] n8n MCP (loanos-waitlist n8n webhook will be created)
- [x] Supabase MCP (project ID: uuqedsvjlkeszrbwzizl) — verify activity_log schema
- [ ] Mailchimp — Adam creates "LoanOS Waitlist" audience + provides MAILCHIMP_LO_LIST_ID (optional at launch)

---

## Risk Register
| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| New netlify function | LOW | Function throws error | Validate + test locally first |
| n8n workflow creation | LOW | Webhook path collision | Use unique path `/loanos-waitlist` |
| Mailchimp LO list | LOW | List doesn't exist yet | Function handles missing MAILCHIMP_LO_LIST_ID gracefully — just skips |
| Copy approval | LOW | Deploy before Adam approves | Commit only — no push until approved |

---

## Definition of Done
- [ ] `loanos-waitlist.html` exists and renders correctly
- [ ] `subscribe-lo.js` validates + routes submissions without touching existing funnels
- [ ] n8n workflow created and ready (may be inactive until Adam approves)
- [ ] thank-you.html handles `?source=lo-waitlist` branch
- [ ] ADAM-TODO.md updated with copy approval + Mailchimp list creation items
- [ ] Committed to repo (not deployed)

---

## Compliance Checklist
- [ ] TCPA: N/A — no phone field, no SMS, email-only opt-in implicit in form submission
- [x] CAN-SPAM: Unsubscribe + physical address in any future emails (Mailchimp Journey handles this)
- [x] NMLS #513013: Present in footer of landing page
- [x] Equal Housing Lender: Present in footer of landing page
- [x] No guaranteed approval language: N/A — this is not a borrower page
- [x] No protected class targeting: N/A — targeting LOs by job role, not demographics
- [x] "Adam Styer | Mortgage Solutions LP" (not "The Styer Team") in footer
