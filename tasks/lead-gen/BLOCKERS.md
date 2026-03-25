# Active Blockers — Lead Generation

---

## BLOCKER-001 — TCPA Bundled Consent on /get-preapproved
**Status:** ACTIVE
**Detected:** 2026-03-25 AM session
**Source:** Research subagent — live website audit

### Issue
The `/get-preapproved` page on styermortgage.com bundles SMS consent into the general form submission agreement:
> "By submitting, I agree to be contacted via phone, email, or text about mortgage options."

This is NOT TCPA best practice. SMS consent must be:
- A **separate** checkbox
- **Unchecked by default**
- With explicit disclosure of message frequency and opt-out instructions

The current bundled language may be legally challenged if SMS follow-up is ever wired to these form submissions.

### Risk Level
**MEDIUM** — No SMS automation is currently live from web form submissions. Risk becomes HIGH the moment any SMS workflow is connected to web lead form data.

### Required Action Before Any SMS Automation
1. Add a separate, unchecked SMS opt-in checkbox to `/get-preapproved` form:
   - Checkbox text: "I agree to receive text messages about my mortgage inquiry. Msg & data rates may apply. Reply STOP to opt out."
   - Must be separate from the general "I agree to be contacted" language
2. Verify the same on the homepage Quick Quote form
3. Do NOT wire any n8n SMS workflow to web form leads until this is fixed

### Who Resolves
Adam Styer (website file edit on styermortgage.com HTML) + Builder subagent when SMS funnels are in scope (Week 2+)

### References
- TCPA rule from domain-queue.md: "opt-in checkbox must be explicit and unchecked by default"
- Current site evidence: /get-preapproved bundles text consent into submit button

---
