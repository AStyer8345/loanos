# NotebookLM Pull Report — 2026-04-03 AM
Active Topic: Week 4 Builder — Execute FTB DPA Guide Funnel

## What We Already Know
- Adam's current database has 2,331 contacts — 77% untagged ("Other" or null). Only 8 web-captured leads since site launch.
- The Homebuyers Privacy Protection Act (effective March 5, 2026) banned trigger lead reselling — owned lists are now a major strategic advantage.
- 3 funnels live: FTB Guide, Pre-Approval, Rate Alert. All backend integrations (LoanOS + Mailchimp + PA notify) are confirmed working as of 2026-03-31.
- BLOCKERS 004 + 005 resolved: LOANOS_URL env var is set; subscribe-lead.js no longer fire-and-forgets PA notify.
- FTB DPA Guide funnel spec is fully written and ready for execution (tasks/lead-gen/specs/2026-04-02-ftb-dpa-funnel-spec.md).
- TSAHC Home Sweet Texas is the hero DPA program: 5% grant, no repayment, $167,250 household income limit, $593K purchase price cap — covers majority of Austin buyers in 2026.

## Open Questions
- Will Adam use Google Drive or Netlify to host the DPA guide PDF? (Placeholder link needed in email copy.)
- Should the n8n PA Lead Notify email subject line be updated to distinguish DPA vs. PA leads?

## Prior Decisions
- Email-only funnel (no phone TCPA checkbox, no SMS automation).
- Reuse LoanOS Web Lead Automation (PiuIsQpBuydtFM4m) — no new n8n workflow needed.
- DPA leads ARE warm/high-intent → LO notification fires same as PA funnel.
- Mailchimp Customer Journey (8 emails) — Adam creates in UI; Builder delivers email copy.

## Lead Gen Program Priorities
1. Execute FTB DPA Guide funnel (Week 4 build — this session)
2. Adam must create Mailchimp Customer Journey after Builder completes
3. Adam must create/host DPA guide PDF before promoting funnel live
4. Week 5 (Refi Watch Funnel) begins only after Week 4 QA passes

## Briefing for Research Subagent
This is a build session — no new research needed. Do NOT re-research:
- TSAHC Home Sweet Texas program details (fully documented in spec)
- DPA program landscape for Austin (covered in 2026-04-02 research file)
- Email sequence copy (all 8 emails written in spec)
Focus: Execute only — modify subscribe-lead.js, create ftb-dpa-guide.html, modify thank-you.html.
