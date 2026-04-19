## Scenarios Mission Brief — 2026-04-19 AM

### Focus Area
Tier 7 Item 3 — PDF from mobile: add "Save as PDF" button to the share page

### Why This Matters
The share page has no way for borrowers to save or download their analysis.
On desktop and mobile, borrowers have zero affordance to preserve the document.
MC share links have a "Download" button. LoanOS share pages have nothing.
The fix: a "Save as PDF" button that triggers the browser's native print-to-PDF
flow (already styled via @media print in SharePageLayout). Works on:
- Desktop: browser print dialog → "Save as PDF"
- iOS Safari: AirPrint sheet → Share → Save to Files (standard iOS flow)
- Android Chrome: print dialog → "Save as PDF"

No new puppeteer dependency needed — the @media print styles already produce
a clean print-optimized layout. The button just calls window.print().

### Session Type
[x] Build

### Objectives
1. Add "Save as PDF" button to share page sidebar (desktop) and below ShareCTA (mobile)
2. Button is print:hidden so it doesn't appear in the PDF output itself
3. Build passes, no TypeScript errors

### Files in Scope
- src/components/share/ShareSavePDFButton.tsx (new)
- src/components/share/SharePageLayout.tsx (import + render in 2 locations)

### Definition of Done
- "Save as PDF" button visible on share page (mobile + desktop)
- Clicking it triggers window.print()
- Button does not appear when printing (print:hidden)
- npm run build passes, 0 TypeScript errors

### Subagents to Activate
[ ] Research Subagent — skipped (gap is clear)
[x] Builder Subagent — master agent acting as builder
[x] QA Subagent — npm run build + TypeScript check
[ ] Reporter Subagent — session log update (master agent handles)
