# Reviewer Pass — Week 46 (Jan 18–24, 2027)
Date: 2026-04-28 PM

## Compliance Matrix

| Check | Post 193 (IG, RT→authority, Tue Jan 19) | Post 194 (LI, Personal, Thu Jan 21) |
|-------|------------------------------------------|--------------------------------------|
| NMLS where required | ✓ #513013 in sign-off line | N/A — no loan product |
| APR disclosure | N/A — no specific rate quoted | N/A — no specific rate quoted |
| Guaranteed-approval language | NONE | NONE |
| Banned phrases ("dream home", "seamless", "pricing is locked", "Styer Team") | NONE | NONE |
| Brand name correct ("Adam Styer \| Mortgage Solutions LP") | ✓ | N/A (no brand sign-off needed) |
| Equal Housing Lender (visual posts) | N/A — text_only | N/A — text_only |
| Fabricated data | NONE — speaks to a pattern, no client story or specific deal numbers | NONE — only voice-guide quotes (24 deals, $10M, $10k day, drive home, highlight reel) + generic language; no fabricated client/family detail |
| Voice — BBQ test | PASS — sounds like Adam at a backyard BBQ | PASS — vulnerable, Adam-cadence |
| Voice — Jessica test | PASS — too specific to be a template | PASS — anchors in Adam’s actual numbers and framing |
| Pillar — DB constraint | `authority` valid (editorial Real Talk noted in agent_notes) | `personal` valid |
| Rolling pillar mix | Real Talk lifts toward 16% (target ~20%); on direction | Personal holds ~30% (on target) |
| Schedule date sanity | Tue Jan 19, 2027 9 AM CT — skips MLK Day (Mon Jan 18) ✓ | Thu Jan 21, 2027 9 AM CT — clear of holidays ✓ |
| Two-tier publishing | `status:draft` (IG) ✓ | `status:draft` (LI) ✓ |

## Decision
**APPROVED — both posts.**

0 compliance failures. 0 data integrity flags. 0 voice flags.

## Notes for QA Subagent
- Verify both rows exist in `social_drafts` with correct `id` / `platform` / `pillar` / `status` / `scheduled_for` / `classification`.
- Verify apostrophes (’) and em-dashes (—) preserved in `content` field — Python urllib insert path used to avoid bash quoting strip.
- Verify NMLS #513013 in Post 193 content; verify Post 194 has no loan/rate language.
- Confirm existing Posts 191 + 192 (Wk45) untouched by this insert.
- Confirm `agent_notes` documents Real Talk → authority mapping for Post 193.
