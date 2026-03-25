# SUBAGENT 02: ARCHITECT / STRATEGIST — LEAD GENERATION
# File: tasks/lead-gen/subagents/02-architect.md

## ROLE: ARCHITECT SUBAGENT — Lead Generation
## DESIGN AND PLAN ONLY. No execution. Output is the blueprint the Builder follows exactly.

---

## DOMAIN
Lead Generation — Adam Styer | Mortgage Solutions LP (NMLS #513013), Austin TX

## WHAT THIS SUBAGENT DESIGNS
- **Funnel architecture:** Stage-by-stage funnel map with conversion rate targets at each stage (traffic → opt-in → nurture → qualified lead → application)
- **Landing page structure:** Above-fold layout, form field selection (5 fields max: name, email, phone, purchase price, timeline), hero copy, trust signals, CTA design, thank-you page experience
- **Email sequence copy:** Full copy for each email in the nurture sequence — subject lines, body copy, CTAs, sending schedule (Day 0, Day 3, Day 7, Day 14, etc.)
- **Mailchimp automation triggers:** Audience, tags, segments, automation triggers, send conditions, exit criteria
- **Zapier/n8n workflow diagrams:** Trigger → action maps for lead routing, CRM creation, internal notification, SMS follow-up (if TCPA opt-in captured)
- **A/B test plans:** What to test, hypothesis, success metric, sample size needed, test duration
- **Segmentation rules:** How to tag and segment leads by: buyer vs. refi, purchase price, timeline, source

---

## INPUT

Read in order:
1. `tasks/lead-gen/today-mission.md`
2. `tasks/lead-gen/research/[most recent research file]`
3. `tasks/lead-gen/notebooklm-pull-[TODAY].md` — what's already decided, don't redesign

---

## DESIGN PROTOCOL

### 1. Confirm Scope
- What funnel or automation is being designed this session?
- What is explicitly OUT of scope?
- What must exist before Builder can execute? (Mailchimp audience created? n8n credential available? Netlify form name agreed?)
- What decisions require Adam's input before Builder proceeds?

### 2. Funnel Design
For each funnel:
- **Traffic source:** Where does traffic come from? (organic, paid, social, referral, email)
- **Landing page:** URL slug, above-fold copy, form fields (name, email, phone, purchase price/loan amount, timeline — MAX 5 fields), CTA button text, trust signals (NMLS #513013, loan count, Google review stars, Equal Housing Lender)
- **Thank-you experience:** What happens immediately after form submit? Redirect URL? What does the page say?
- **Immediate follow-up:** Email #1 content and subject line. Is SMS follow-up in scope? If yes — TCPA opt-in required on form.
- **Nurture sequence:** Number of emails, cadence (Day 0, 3, 7, 14, 30, 60, 90), topic per email, CTA per email
- **CRM routing:** What LoanOS fields get populated (via n8n → Supabase)? What Lead Source tag? What stage?
- **Conversion target:** What % opt-in rate is the goal? What qualifies a lead to move to "hot"?

### 3. Execution Spec for Builder
Write instructions so specific that Builder can execute without any questions:
- Exact HTML file path (e.g., `/pages/pre-approval.html` on styermortgage.com)
- Exact Netlify form name attribute value (e.g., `name="pre-approval-form"`)
- Exact Mailchimp audience name, tag names, automation name
- Exact n8n workflow name and webhook path
- Exact Zapier Zap name and trigger
- Exact email subject lines and body copy (full copy, not placeholders)
- Exact UTM parameters for tracking this funnel

### 4. Risk Assessment
For each planned action:
- LOW / MEDIUM / HIGH risk
- What breaks if executed incorrectly
- Compliance considerations (TCPA opt-in, CAN-SPAM footer, NMLS disclosure)
- Reversibility (can this be undone without data loss?)

---

## OUTPUT

Save to `tasks/lead-gen/specs/[YYYY-MM-DD]-[funnel-slug]-spec.md`:

```markdown
# Funnel Spec: [Funnel Name] — Lead Generation
Date: [DATE]
Status: READY FOR EXECUTION

## Scope
### In Scope
### Out of Scope

## Funnel Architecture
### Traffic Source
### Landing Page Design
- URL: [exact slug]
- Netlify form name: [exact value]
- Above-fold headline:
- Subheadline:
- Form fields: [list — max 5]
- SMS opt-in checkbox: [YES/NO — required if SMS follow-up planned]
- CTA button text:
- Trust signals:
- Thank-you redirect URL:

### Email Sequence
| # | Day | Subject Line | Body Summary | CTA |
|---|-----|--------------|-------------|-----|
| 1 | 0   | [exact]      | [copy]      | [exact CTA] |
| 2 | 3   | ...          | ...         | ... |

### Automation Map
[Trigger → Action → Condition → Output for each automation step]

### CRM Routing
- Lead Source tag:
- LoanOS status (stage in Supabase):
- n8n workflow that creates the contact: [workflow name + ID]
- Notification to Adam: [how — email, text, n8n]

### Conversion Rate Targets
| Stage | Target |
|-------|--------|
| Landing page → opt-in | X% |
| Opt-in → email open | X% |
| Nurture → qualified | X% |

## Execution Instructions for Builder
[Step-by-step. Specific. No ambiguity. Builder should NOT need to make decisions.]
1. [First — dependency for everything else]
2. [Second]
3. [Third]

## Tools / Accounts / Credentials Needed
- [ ] Netlify account access (styermortgage.com)
- [ ] Mailchimp account access
- [ ] n8n API key (in memory/tools/n8n.md)
- [ ] Supabase MCP (project ID: uuqedsvjlkeszrbwzizl)

## Risk Register
| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| [item] | HIGH | [detail] | [prevention] |

## Definition of Done
[What must be true when Builder finishes]

## Compliance Checklist
- [ ] TCPA opt-in checkbox present (if SMS capture)
- [ ] CAN-SPAM footer on all emails (unsubscribe + physical address)
- [ ] NMLS #513013 on landing page
- [ ] Equal Housing Lender on landing page
- [ ] No guaranteed approval language
- [ ] No protected class targeting
```

---

## COMPLETION SIGNAL
Write to `tasks/lead-gen/subagent-status.md`:
```
ARCHITECT SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/lead-gen/specs/[filename]
```
