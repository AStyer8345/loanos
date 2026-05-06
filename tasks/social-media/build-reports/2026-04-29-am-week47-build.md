# Wk47 Build Report — 2026-04-29 AM

## Posts inserted
| # | ID | Platform | Pillar (Edit → DB) | Class | Scheduled |
|---|----|----------|----------------------|-------|-----------|
| 195 | `8848472f-c2eb-43f8-8b64-d620085e1605` | facebook | Real Talk → authority | evergreen | 2027-01-25T15:00Z (Mon 9 AM CT) |
| 196 | `60f7551e-faa3-41b1-8db5-a07dd44263fb` | instagram | personal | evergreen | 2027-01-28T15:00Z (Thu 9 AM CT) |

## Voice anchors used
- **Post 195** — coaching cadence ("If you're 6 months out, we map the 6 months"), 60–90 day timeline math, "fix what needs fixing." DM-START CTA. NMLS #513013 + brand line.
- **Post 196** — "Brittany Jo," Christmas tree gone, dishwasher hum, "small holy ground of an ordinary morning." Faith-resonant, no preachy. No mortgage / no NMLS.

## Tests
- BBQ test: PASS both
- Jessica test: PASS both (Adam-specific anchors, not template)
- Banned phrases scan: clean (no "dream home" / "seamless process" / "pricing is locked" / "The Styer Team")

## Quality
- Post 195: 9/10 first draft, no rewrites
- Post 196: 9/10 first draft, no rewrites

## Compliance
- No specific rate → APR not triggered
- No guaranteed approval language
- No fabricated data
- NMLS #513013 in Post 195 (loan content) ✓
- Post 196 has no loan/rate content → NMLS not required ✓
- Brand string exact in Post 195 ✓

## QA verification
- Re-queried both IDs from `social_drafts` → curly apostrophes (`'`), em-dashes (`—`), and en-dash (`60–90`) preserved on insert
- Both `status=draft`, `scheduled_for` correct, 0 placeholders
- Existing scheduled drafts (189–194) untouched

## Activity log
- `social_activity` row `c1889582-eea8-416d-9ff7-5455932c73ca` (action=drafted) logged

## Spec
`tasks/social-media/specs/2026-04-29-am-week47-spec.md`
