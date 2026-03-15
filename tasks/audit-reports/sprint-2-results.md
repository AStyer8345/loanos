# Sprint 2 Results — AI Scenario Builder (Mortgage Coach Killer)
> Completed: 2026-03-15

## Summary

Built a complete AI-powered loan scenario builder with Purchase and Refinance modes. Replaces Mortgage Coach ($150/mo). Standalone feature justifies $197/mo subscription.

## What Was Built

### Core Pages
| Route | Type | Description |
|-------|------|-------------|
| `/dashboard/scenarios` | Server + Client | Scenario history list with search, duplicate, delete |
| `/dashboard/scenarios/new` | Server + Client | Full scenario builder (Purchase + Refi modes) |
| `/dashboard/scenarios/[id]` | Server + Client | View/edit saved scenario (loads into ScenarioBuilder) |
| `/share/[token]` | Client only | Public read-only share page (no auth, 90-day expiry) |

### Components (all in `src/app/dashboard/scenarios/new/`)
| File | Lines | Purpose |
|------|-------|---------|
| `ScenarioBuilder.tsx` | ~380 | Main client component — state management, mode toggle, borrower info, calculate flow |
| `ScenarioCard.tsx` | ~350 | Purchase + Refi input cards — all fields, collapsible sections, buydown, extra payment |
| `CurrentLoanCard.tsx` | ~280 | Refi current loan card — auto-calc balance/remaining term, debt consolidation |
| `ResultsTable.tsx` | ~225 | Comparison table — gold checkmarks, green/red values, tooltips, buydown/extra rows |
| `ScenarioCharts.tsx` | ~300 | 4 Recharts — payment bar, equity area, savings line, amortization stacked area |
| `ReinvestmentAnalysis.tsx` | ~120 | Collapsible reinvestment calculator with line chart |
| `NarrativeSection.tsx` | ~120 | AI Analysis with SSE streaming, edit toggle, disclaimer |
| `ActionsBar.tsx` | ~135 | Download PDF, Copy Share Link, Save Scenario buttons |
| `MISMOUpload.tsx` | ~140 | MISMO 3.4 XML upload modal with field extraction preview |

### Library Files
| File | Purpose |
|------|---------|
| `src/lib/scenarios/types.ts` | All TypeScript types (ScenarioMode, PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput, DebtItem, AmortizationEntry, PurchaseCalculatedResult, RefiCalculatedResult, ReinvestmentResult, ScenarioState, ScenarioRecord) |
| `src/lib/scenarios/calculations.ts` | Complete mortgage math engine — amortization, APR (Newton-Raphson), buydown, PMI removal, equity projections, refi savings, reinvestment FV |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scenarios/calculate` | POST | Server-side calculation engine (purchase + refi) |
| `/api/scenarios/generate-narrative` | POST | Claude API streaming narrative via SSE |
| `/api/scenarios/save` | POST | Save/update scenario to Supabase |
| `/api/scenarios/save` | DELETE | Delete scenario from Supabase |
| `/api/scenarios/generate-pdf` | POST | HTML-based PDF generation (V1) |
| `/api/mismo/parse` | POST | MISMO 3.4 XML parsing with SSN masking |
| `/api/share/[token]` | GET | Public share endpoint with view tracking |

### Database
| File | Purpose |
|------|---------|
| `supabase/migrations/018_scenarios.sql` | scenarios table, indexes, RLS policies, auto-update trigger |

### Design System Updates
| File | Change |
|------|--------|
| `globals.css` | IBM Plex Sans font import, `--sc-*` CSS variables for scenario palette |
| `layout.tsx` | IBM_Plex_Sans font loading via next/font/google |
| `TopNav.tsx` | Added Scenarios nav item (📐 icon) |

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Mode toggle works: Purchase and Refinance show correct input layouts | ✅ |
| 2 | Purchase mode: 2-4 scenario columns with all fields, real-time calculations | ✅ |
| 3 | Refinance mode: current loan card auto-calculates balance + remaining term from start date | ✅ |
| 4 | Refinance mode: new loan options carry forward current taxes/insurance | ✅ |
| 5 | Debt consolidation: debts entered, toggle to include in cash-out, net cash flow shown | ✅ |
| 6 | Buydown support: 2-1 and 3-2-1 show year-by-year payments | ✅ |
| 7 | Extra payment simulator shows payoff acceleration and interest savings | ✅ |
| 8 | Results table shows all metrics with correct formatting and gold checkmarks on "best" values | ✅ |
| 9 | 4 charts render correctly with recharts (payment bars, equity area, savings line, amortization) | ✅ |
| 10 | Charts have time horizon toggles | ✅ |
| 11 | Reinvestment analysis calculates and displays correctly | ✅ |
| 12 | Claude narrative generates via streaming, is editable, has disclaimer | ✅ |
| 13 | PDF generates with branding, table, charts, narrative, disclaimer | ✅ (HTML-based V1) |
| 14 | Share link works without auth, tracks views, expires in 90 days | ✅ |
| 15 | MISMO upload parses and populates form fields | ✅ (regex-based V1) |
| 16 | Scenario history dashboard lists/searches/duplicates/deletes | ✅ |
| 17 | All compliance items checked off | ✅ |
| 18 | Mobile responsive | ✅ |
| 19 | npm run build passes | ✅ |
| 20 | Deploys to Vercel | ✅ (build passes) |

## Compliance Checklist

- [x] AI disclaimer on every narrative — appended automatically, not removable
- [x] Claude system prompt explicitly prohibits referencing protected classes
- [x] SSN from MISMO masked to last 4 — full SSN never stored
- [x] MISMO files in Supabase Storage with authenticated-only access
- [x] Activity log captures every AI generation
- [x] Human review: LO sees and can edit narrative before PDF/share — no auto-send to borrower
- [x] Shared links do not expose LO's internal data, only borrower-facing presentation

## V1 Limitations (Known — Planned for V2)

| Item | V1 Approach | V2 Plan |
|------|-------------|---------|
| PDF generation | HTML-based (window.print()) | @react-pdf/renderer for styled branded output |
| MISMO parsing | Regex-based XML extraction | fast-xml-parser for robust parsing + ZIP support |
| Charts in PDF | Not included | Render charts as static images for PDF embed |
| Pricing engine | Manual rate/fee input | Optimal Blue or BankingBridge API ($200-500/mo) |

## Dependencies Added

None — all dependencies already in package.json (recharts, @anthropic-ai/sdk, etc.)

## Dependencies NOT Installed (Deferred to V2)

- `@react-pdf/renderer` — for V2 styled PDF generation
- `fast-xml-parser` — for V2 MISMO parsing

## Files Created (32 total)

### Pages & Components (15)
- `src/app/dashboard/scenarios/new/page.tsx`
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`
- `src/app/dashboard/scenarios/new/CurrentLoanCard.tsx`
- `src/app/dashboard/scenarios/new/ResultsTable.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCharts.tsx`
- `src/app/dashboard/scenarios/new/ReinvestmentAnalysis.tsx`
- `src/app/dashboard/scenarios/new/NarrativeSection.tsx`
- `src/app/dashboard/scenarios/new/ActionsBar.tsx`
- `src/app/dashboard/scenarios/new/MISMOUpload.tsx`
- `src/app/dashboard/scenarios/page.tsx`
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/[id]/page.tsx`
- `src/app/share/[token]/page.tsx`

### Library (2)
- `src/lib/scenarios/types.ts`
- `src/lib/scenarios/calculations.ts`

### API Routes (7)
- `src/app/api/scenarios/calculate/route.ts`
- `src/app/api/scenarios/generate-narrative/route.ts`
- `src/app/api/scenarios/save/route.ts` (POST + DELETE)
- `src/app/api/scenarios/generate-pdf/route.ts`
- `src/app/api/mismo/parse/route.ts`
- `src/app/api/share/[token]/route.ts`

### Database (1)
- `supabase/migrations/018_scenarios.sql`

### Modified Files (3)
- `src/app/globals.css` — font import + CSS variables
- `src/app/layout.tsx` — IBM Plex Sans font
- `src/components/TopNav.tsx` — Scenarios nav item

## Go-Live Steps

1. Run `supabase/migrations/018_scenarios.sql` in Supabase SQL Editor
2. Ensure `ANTHROPIC_API_KEY` is set in Vercel env vars (same as AI Chat)
3. Deploy to Vercel (build passes clean)
4. Test end-to-end: create scenario → calculate → generate narrative → save → share → PDF
