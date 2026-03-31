# NotebookLM Pull Report — 2026-03-31 AM
Active Topic: BLOCKER-004 + BLOCKER-005 — subscribe-lead.js fixes (Builder session)

## What We Already Know

**Lead Sources:** Business is overwhelmingly referral-driven (466 Realtor Referral contacts). ~77% of 1,794 contacts have null/Other lead source — data hygiene gap. Website organic: 8 contacts total since inception. Pre-qual form was 0% conversion until BLOCKER-002 fix.

**Funnels Built:**
- FTB Guide Funnel — live, properly wired to Mailchimp + LoanOS
- Pre-Approval Funnel — live (deployed 2026-03-29, commit 1b3f0be), Mailchimp capture working, CRM FAILING (BLOCKER-004)
- Rate Alert Funnel — live (same deploy), Mailchimp capture working, CRM FAILING (BLOCKER-004)

**Critical Blockers Active:**
- BLOCKER-004: `LOANOS_URL` hardcoded as `https://loanos.vercel.app` (404) — all CRM contact creation failing. Correct domain: `https://loanos-astyer8345s-projects.vercel.app`
- BLOCKER-005: `notifyPreApprovalLead()` called without `await` — fire-and-forget in Netlify serverless kills the call before it completes. n8n PA notification never fires.

**n8n Automations Live (lead-touching):**
- J9Pe24vUi6fpZtdZ — Pre-Approval Lead Notify (ACTIVE, but never called due to BLOCKER-005)
- PiuIsQpBuydtFM4m — Web Lead Automation (ACTIVE)
- utMvZpkdRwIRZ51u — Pre-Approval Email (ACTIVE)
- YbgDnTpPdefcazKy — Referral Intro Email (ACTIVE)

**What the Last Session (2026-03-30 AM) Did:**
- Confirmed all 4 pages live post-deploy
- Confirmed Mailchimp tagging working for both funnels
- Confirmed regression gate (Rate Alert does not trigger PA notify)
- Discovered BLOCKER-004 and BLOCKER-005 via live form tests
- Adam action items added for env var + git push

## Open Questions

1. Has Adam added the `LOANOS_URL` Netlify env var yet? (ADAM-TODO item from 2026-03-30)
2. Has Adam created the Mailchimp Customer Journeys (PA Welcome Series + Rate Watch Welcome Series)?
3. Is `LOANOS_SYSTEM_USER_ID` set as a Vercel env var for the LoanOS project?
4. Has Adam confirmed Week 4 priority: FTB Guide enhancement vs Homepage Form Wiring?

## Prior Decisions

- Use `process.env.LOANOS_URL` (env var approach) for BLOCKER-004 — not hardcoded domain
- Fallback to `https://loanos-astyer8345s-projects.vercel.app` if env var not set (Option 2 backup)
- Keep `subscribe-lead.js` as the sole Netlify function — no new files
- Regression gate must hold: Rate Alert form must NOT trigger PA notify
- TCPA compliance: separate SMS opt-in checkbox, unchecked by default (already deployed)

## Lead Gen Program Priorities

1. **TODAY:** Fix BLOCKER-004 + BLOCKER-005 in subscribe-lead.js (Builder session)
2. **Adam action required:** Add `LOANOS_URL` Netlify env var + git push after Builder fix
3. **After fix:** Re-run post-deploy QA to confirm CRM sync and PA notify working
4. **Week 4:** FTB Guide enhancement vs Homepage Form Wiring (requires Adam decision)
5. **Ongoing Adam items:** Mailchimp Customer Journeys (PA + Rate Alert), weekly rate campaign

## Briefing for Builder Subagent

**DO NOT re-research. DO NOT redesign. The fixes are already specified in BLOCKERS.md.**

Today's Builder scope is two surgical changes to `netlify/functions/subscribe-lead.js` in repo `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site`:

1. **BLOCKER-004 fix:** Line ~42 — Change:
   ```js
   const LOANOS_URL = "https://loanos.vercel.app";
   ```
   To:
   ```js
   const LOANOS_URL = process.env.LOANOS_URL || "https://loanos-astyer8345s-projects.vercel.app";
   ```

2. **BLOCKER-005 fix:** Find the `notifyPreApprovalLead(contactData);` call (fire-and-forget) — add `await`:
   ```js
   await notifyPreApprovalLead(contactData);
   ```

After both fixes: commit and push from the website repo. Then run QA.
