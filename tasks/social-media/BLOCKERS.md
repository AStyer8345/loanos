# Active Blockers — Social Media

### BLOCKER-LOANOS-001 — LoanOS Stream: Selfies Not Uploaded

**Date added:** 2026-04-05 PM
**Impact:** LoanOS content stream cannot launch. All 6 Phase 1A pool entries require a selfie image (`selfie_carousel` or `selfie_thinking` format). Builder cannot write LoanOS stream posts without confirmed image assets.
**Blocks:** Posts 57+ using `stream: loanos` classification. Does NOT block non-LoanOS posts under new 4-pillar framework.
**Resolution required:** Adam shoots 2-3 selfies (neutral desk, thinking/looking-away, optional outdoor) and uploads to `tasks/social-media/assets/selfies/`. Filenames expected: `selfie_neutral.jpg`, `selfie_thinking.jpg`, `selfie_outdoor.jpg` (optional).
**Spec reference:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 8.1
**Gate check:** On next AM session, check if `tasks/social-media/assets/selfies/` contains at least 2 jpg files. If yes, RESOLVED — LoanOS stream can begin.
**Workaround this week:** Agent runs new 4-pillar framework without LoanOS stream. Architect plans 5 non-LoanOS posts.

---

## Resolved

### 2026-04-05 — RESOLVED: n8n GBP webhook `loanos-build` theme branch (Task 12)

**Was blocked on:** `availableInMCP: false` on workflow `Weekly GBP + Social Post` (`V6RhmJpOb7pOzMte`).

**Resolution:** Adam toggled MCP access in the workflow settings. Modification applied via n8n REST API `PUT /workflows/V6RhmJpOb7pOzMte`:
- `Gemini: Adapt for Platforms` body expression now branches on `$json.body.theme === 'loanos-build'` — uses builder-voice prompt (no mortgage sales language, no rate data, no NMLS#) when true, mortgage prompt otherwise.
- `Extract Imagen Base64` Code node now fetches `$json.body.image_url` via `this.helpers.httpRequest` when theme is `loanos-build` (bypasses Imagen for LoanOS posts where Adam supplies the selfie/screenshot directly).

**Verified:** workflow active, both node edits landed, no new nodes or connections required.
