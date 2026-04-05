# Active Blockers — Social Media

_No active blockers._

---

## Resolved

### 2026-04-05 — RESOLVED: n8n GBP webhook `loanos-build` theme branch (Task 12)

**Was blocked on:** `availableInMCP: false` on workflow `Weekly GBP + Social Post` (`V6RhmJpOb7pOzMte`).

**Resolution:** Adam toggled MCP access in the workflow settings. Modification applied via n8n REST API `PUT /workflows/V6RhmJpOb7pOzMte`:
- `Gemini: Adapt for Platforms` body expression now branches on `$json.body.theme === 'loanos-build'` — uses builder-voice prompt (no mortgage sales language, no rate data, no NMLS#) when true, mortgage prompt otherwise.
- `Extract Imagen Base64` Code node now fetches `$json.body.image_url` via `this.helpers.httpRequest` when theme is `loanos-build` (bypasses Imagen for LoanOS posts where Adam supplies the selfie/screenshot directly).

**Verified:** workflow active, both node edits landed, no new nodes or connections required.
