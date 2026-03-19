# Scenario Builder Output Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Scenario Builder output page and PDF to match a Mortgage Coach-quality 7-section layout, fix streaming AI analysis, and align the share page with the on-screen output.

**Architecture:** Create a shared `buildDisplayData()` utility so all calculations (PDF, share page, output page) derive from one source. Replace broken/weak charts with 3 focused charts (Monthly Payment bar, Cumulative Savings line, Total Interest bar). Update AI prompt to paragraph form. Rebuild PDF HTML with all 7 sections.

**Tech Stack:** Next.js 14, Recharts, TypeScript, existing `@/lib/scenarios/calculations.ts` (untouched), Anthropic SDK streaming (SSE)

---

## Chunk 1: Fix AI Analysis + Shared Utility

### Task 1: Fix AI Analysis — Error Logging + System Prompt

**Files:**
- Modify: `src/app/api/scenarios/generate-narrative/route.ts`
- Modify: `src/app/dashboard/scenarios/new/NarrativeSection.tsx`

**Root cause:** `getAnthropicClient()` throws when `ANTHROPIC_API_KEY` is not set. The catch block in `NarrativeSection.tsx` swallows the real error and shows a generic "Failed to generate" message. The system prompt also requests bullet format, but the spec wants paragraph form.

- [ ] **Step 1: Update system prompt in generate-narrative route**

In `src/app/api/scenarios/generate-narrative/route.ts`, replace `systemPrompt`:

```typescript
const systemPrompt = `You are a senior mortgage advisor. Write a clear analysis of these loan scenarios for ${borrowerName || 'the borrower'}.

Format: Plain paragraphs only — no bullet points, no headers, no bold text. Write in paragraph form.
Length: Exactly 4 paragraphs, maximum 5 sentences each.

Paragraph 1 — Which scenario wins and why: Name the best option specifically. Include the exact dollar difference in monthly payment and total interest.
Paragraph 2 — Break-even timing in plain English: For refinance, explain when the borrower recoups closing costs. For purchase, compare when each option becomes more expensive than the other.
Paragraph 3 — When each scenario makes sense: Short-term hold vs long-term hold, income stability, risk tolerance.
Paragraph 4 — One clear recommendation with reasoning, plus any risks or trade-offs worth flagging.

Rules:
- Write in plain English — no jargon
- Be specific with dollar amounts and months
- Never reference protected classes (race, religion, gender, national origin, familial status, disability, age)
- Never make a lending decision — present trade-offs only
- End last paragraph with: "This analysis is for informational purposes only."`
```

- [ ] **Step 2: Add console logging of actual error to route**

In the route's stream start() catch block, replace the error handler:

```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : 'Generation failed'
  console.error('[narrative] stream error — full details:', {
    message: msg,
    stack: err instanceof Error ? err.stack : undefined,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  })
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
  controller.close()
}
```

Also add at the top of the try block (before anthropic.messages.create):
```typescript
console.log('[narrative] starting generation, hasApiKey:', !!process.env.ANTHROPIC_API_KEY)
```

- [ ] **Step 3: Update NarrativeSection.tsx to show actual error**

In NarrativeSection.tsx, replace the catch block in `generate()`:

```typescript
} catch (e) {
  const msg = e instanceof Error ? e.message : 'Unknown error'
  console.error('[NarrativeSection] generation failed:', msg)
  onNarrativeGenerated(`Error: ${msg}. Check that ANTHROPIC_API_KEY is set in Vercel environment variables.`)
}
```

Also update the display area — when narrative starts with "Error:", render it in red:

```tsx
{!narrative && !generating ? (
  <button onClick={generate} ...>Generate Analysis</button>
) : editing ? (
  <textarea ... />
) : (
  <div
    className="text-sm leading-relaxed whitespace-pre-wrap"
    style={{
      color: narrative.startsWith('Error:') ? '#C0392B' : 'var(--sc-text)',
      fontFamily: "'IBM Plex Mono', monospace",
    }}
  >
    {narrative || (generating ? '' : '')}
    {generating && <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--sc-accent)' }} />}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add src/app/api/scenarios/generate-narrative/route.ts src/app/dashboard/scenarios/new/NarrativeSection.tsx
git commit -m "fix(scenarios): improve AI error visibility, switch prompt to paragraph form"
```

---

### Task 2: Create Shared Display Data Utility

**Files:**
- Create: `src/lib/scenarios/displayData.ts`

This utility computes all derived values needed by the output page, share page, and PDF. Single source of truth.

- [ ] **Step 1: Create `src/lib/scenarios/displayData.ts`**

```typescript
/**
 * buildDisplayData — computes all values needed for the 7-section output.
 * Used by: OutputPage (in-app), share/[token]/page.tsx, generate-pdf/route.ts
 * Never re-implement savings/break-even calculations outside this file.
 */

import type {
  PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult, CurrentLoanInput,
} from './types'

export interface ScenarioDisplayRow {
  label: string
  loanType: string
  purchasePrice?: number
  loanAmount: number
  interestRate: number
  apr: number
  monthlyPI: number
  totalMonthlyPayment: number
  cashToClose: number
  totalInterest: number
  // Savings vs first scenario (purchase) or vs current (refi)
  monthlySavingsVsCurrent?: number
  savings5yr?: number
  savings15yr?: number
  breakEvenMonths?: number
  breakEvenYears?: number
  additionalCostToClose?: number
  isRecommended: boolean
}

export interface KeyMetrics {
  monthlySavings: number            // best scenario vs baseline
  savings5yr: number
  savings15yr: number
  totalInterestBest: number         // total interest of recommended scenario
}

export interface BreakEvenRow {
  label: string
  additionalCostToClose: number
  monthlySavings: number
  breakEvenMonths: number
  breakEvenYears: number
}

export interface CumulativeSavingsPoint {
  month: number
  [scenarioLabel: string]: number
}

export interface DisplayData {
  mode: 'purchase' | 'refinance'
  rows: ScenarioDisplayRow[]
  keyMetrics: KeyMetrics
  breakEvenRows: BreakEvenRow[]      // non-baseline scenarios only
  cumulativeSavingsData: CumulativeSavingsPoint[]  // months 0-84
  recommendedIdx: number
}

// ─── Purchase ──────────────────────────────────────────────────────

export function buildPurchaseDisplayData(
  scenarios: PurchaseScenarioInput[],
  results: PurchaseCalculatedResult[]
): DisplayData {
  if (!results.length) return emptyDisplayData('purchase')

  // Baseline = scenario with highest monthly payment (most expensive)
  const baselineIdx = results.reduce((maxIdx, r, i) =>
    r.totalMonthlyPayment > results[maxIdx].totalMonthlyPayment ? i : maxIdx
  , 0)
  const baseline = results[baselineIdx]

  // Recommended = scenario with lowest total monthly payment
  const recommendedIdx = results.reduce((minIdx, r, i) =>
    r.totalMonthlyPayment < results[minIdx].totalMonthlyPayment ? i : minIdx
  , 0)

  const rows: ScenarioDisplayRow[] = scenarios.map((s, i) => {
    const r = results[i]
    const monthlySavings = baseline.totalMonthlyPayment - r.totalMonthlyPayment
    const additionalCostToClose = r.cashToClose - baseline.cashToClose
    const breakEvenMonths = monthlySavings > 0 && additionalCostToClose > 0
      ? Math.ceil(additionalCostToClose / monthlySavings)
      : 0

    return {
      label: s.label || `Option ${i + 1}`,
      loanType: s.loanType,
      purchasePrice: s.purchasePrice,
      loanAmount: s.loanAmount,
      interestRate: s.interestRate,
      apr: r.apr,
      monthlyPI: r.monthlyPI,
      totalMonthlyPayment: r.totalMonthlyPayment,
      cashToClose: r.cashToClose,
      totalInterest: r.totalInterest,
      monthlySavingsVsCurrent: i !== baselineIdx ? monthlySavings : 0,
      savings5yr: monthlySavings * 60,
      savings15yr: monthlySavings * 180,
      breakEvenMonths: i !== baselineIdx && breakEvenMonths > 0 ? breakEvenMonths : undefined,
      breakEvenYears: i !== baselineIdx && breakEvenMonths > 0 ? Math.round(breakEvenMonths / 12 * 10) / 10 : undefined,
      additionalCostToClose: i !== baselineIdx ? additionalCostToClose : undefined,
      isRecommended: i === recommendedIdx,
    }
  })

  const bestRow = rows[recommendedIdx]
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 60,
    savings15yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 180,
    totalInterestBest: results[recommendedIdx].totalInterest,
  }

  const breakEvenRows: BreakEvenRow[] = rows
    .filter((r, i) => i !== baselineIdx && (r.breakEvenMonths ?? 0) > 0)
    .map(r => ({
      label: r.label,
      additionalCostToClose: r.additionalCostToClose ?? 0,
      monthlySavings: r.monthlySavingsVsCurrent ?? 0,
      breakEvenMonths: r.breakEvenMonths ?? 0,
      breakEvenYears: r.breakEvenYears ?? 0,
    }))

  // Cumulative savings: months 0-84
  const cumulativeSavingsData: CumulativeSavingsPoint[] = []
  for (let month = 0; month <= 84; month++) {
    const point: CumulativeSavingsPoint = { month }
    scenarios.forEach((s, i) => {
      if (i === baselineIdx) return
      const label = rows[i].label
      const savings = (rows[i].monthlySavingsVsCurrent ?? 0) * month - (rows[i].additionalCostToClose ?? 0)
      point[label] = Math.round(savings)
    })
    cumulativeSavingsData.push(point)
  }

  return { mode: 'purchase', rows, keyMetrics, breakEvenRows, cumulativeSavingsData, recommendedIdx }
}

// ─── Refinance ─────────────────────────────────────────────────────

export function buildRefiDisplayData(
  currentLoan: CurrentLoanInput,
  scenarios: RefiScenarioInput[],
  results: RefiCalculatedResult[]
): DisplayData {
  if (!results.length) return emptyDisplayData('refinance')

  // Baseline = current loan (index -1 conceptually, but we just use result[0].currentMonthlyPayment)
  const currentMonthlyPayment = results[0].currentMonthlyPayment

  // Recommended = highest monthly savings
  const recommendedIdx = results.reduce((maxIdx, r, i) =>
    r.monthlySavings > results[maxIdx].monthlySavings ? i : maxIdx
  , 0)

  const rows: ScenarioDisplayRow[] = scenarios.map((s, i) => {
    const r = results[i]
    return {
      label: s.label || `Option ${i + 1}`,
      loanType: s.loanType,
      loanAmount: s.newLoanAmount,
      interestRate: s.interestRate,
      apr: r.apr,
      monthlyPI: r.newMonthlyPI,
      totalMonthlyPayment: r.newTotalMonthlyPayment,
      cashToClose: s.closingCosts,
      totalInterest: r.totalInterestNew,
      monthlySavingsVsCurrent: r.monthlySavings,
      savings5yr: r.totalSavings5Year,
      savings15yr: r.monthlySavings * 180,
      breakEvenMonths: r.breakEvenMonth > 0 ? r.breakEvenMonth : undefined,
      breakEvenYears: r.breakEvenMonth > 0 ? Math.round(r.breakEvenMonth / 12 * 10) / 10 : undefined,
      additionalCostToClose: s.closingCosts,
      isRecommended: i === recommendedIdx,
    }
  })

  const bestRow = rows[recommendedIdx]
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: bestRow.savings5yr ?? 0,
    savings15yr: bestRow.savings15yr ?? 0,
    totalInterestBest: results[recommendedIdx].totalInterestNew,
  }

  const breakEvenRows: BreakEvenRow[] = rows
    .filter(r => (r.breakEvenMonths ?? 0) > 0)
    .map(r => ({
      label: r.label,
      additionalCostToClose: r.additionalCostToClose ?? 0,
      monthlySavings: r.monthlySavingsVsCurrent ?? 0,
      breakEvenMonths: r.breakEvenMonths ?? 0,
      breakEvenYears: r.breakEvenYears ?? 0,
    }))

  const cumulativeSavingsData: CumulativeSavingsPoint[] = []
  for (let month = 0; month <= 84; month++) {
    const point: CumulativeSavingsPoint = { month }
    scenarios.forEach((s, i) => {
      const label = rows[i].label
      const savings = (rows[i].monthlySavingsVsCurrent ?? 0) * month - s.closingCosts
      point[label] = Math.round(savings)
    })
    cumulativeSavingsData.push(point)
  }

  return { mode: 'refinance', rows, keyMetrics, breakEvenRows, cumulativeSavingsData, recommendedIdx }
}

function emptyDisplayData(mode: 'purchase' | 'refinance'): DisplayData {
  return { mode, rows: [], keyMetrics: { monthlySavings: 0, savings5yr: 0, savings15yr: 0, totalInterestBest: 0 }, breakEvenRows: [], cumulativeSavingsData: [], recommendedIdx: 0 }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scenarios/displayData.ts
git commit -m "feat(scenarios): add buildDisplayData shared utility for all 7-section outputs"
```

---

## Chunk 2: Rebuild Output Page Components

### Task 3: Create ScenarioSummaryTable.tsx (Section 1)

**Files:**
- Create: `src/app/dashboard/scenarios/new/ScenarioSummaryTable.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client'

import type { DisplayData } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number | undefined) =>
  v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US')
const fmtRate = (v: number | undefined) =>
  v == null ? '—' : v.toFixed(3) + '%'

export default function ScenarioSummaryTable({ data }: { data: DisplayData }) {
  if (!data.rows.length) return null

  const rows: { label: string; getValue: (r: typeof data.rows[0]) => string }[] = [
    ...(data.mode === 'purchase' ? [{ label: 'Purchase Price', getValue: (r: typeof data.rows[0]) => fmtCurrency(r.purchasePrice) }] : []),
    { label: 'Loan Amount', getValue: r => fmtCurrency(r.loanAmount) },
    { label: 'Interest Rate', getValue: r => fmtRate(r.interestRate) },
    { label: 'APR', getValue: r => fmtRate(r.apr) },
    { label: 'Monthly P&I', getValue: r => fmtCurrency(r.monthlyPI) },
    { label: 'Total Monthly Payment', getValue: r => fmtCurrency(r.totalMonthlyPayment) },
    { label: 'Cash to Close', getValue: r => fmtCurrency(r.cashToClose) },
    {
      label: data.mode === 'purchase' ? 'Monthly Savings vs. Baseline' : 'Monthly Savings vs. Current',
      getValue: r => r.monthlySavingsVsCurrent != null && r.monthlySavingsVsCurrent !== 0
        ? fmtCurrency(r.monthlySavingsVsCurrent) + '/mo'
        : '—',
    },
    { label: 'Total Interest (Life)', getValue: r => fmtCurrency(r.totalInterest) },
  ]

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Scenario Comparison
        </h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: '#0A1628' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #C9A84C' }}>
                Metric
              </th>
              {data.rows.map((row, i) => (
                <th key={i} style={{
                  textAlign: 'right',
                  padding: '10px 16px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: row.isRecommended ? '#C9A84C' : '#ffffff',
                  borderBottom: `2px solid ${row.isRecommended ? '#C9A84C' : 'rgba(255,255,255,0.2)'}`,
                  background: row.isRecommended ? 'rgba(201,168,76,0.08)' : 'transparent',
                }}>
                  {row.label}
                  {row.isRecommended && (
                    <span style={{ display: 'block', fontSize: 8, fontWeight: 600, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      ★ Recommended
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((rowDef, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
                <td style={{ padding: '9px 16px', fontSize: 11, fontWeight: 500, color: 'var(--sc-muted)', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {rowDef.label}
                </td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{
                    padding: '9px 16px',
                    textAlign: 'right',
                    fontSize: 11,
                    fontWeight: row.isRecommended ? 600 : 400,
                    color: row.isRecommended ? '#C9A84C' : 'var(--sc-text)',
                    borderBottom: '1px solid var(--sc-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: row.isRecommended ? 'rgba(201,168,76,0.04)' : 'transparent',
                  }}>
                    {rowDef.getValue(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/scenarios/new/ScenarioSummaryTable.tsx
git commit -m "feat(scenarios): add ScenarioSummaryTable with recommended column highlight"
```

---

### Task 4: Create KeyMetricsGrid.tsx (Section 3) and BreakEvenTable.tsx (Section 4)

**Files:**
- Create: `src/app/dashboard/scenarios/new/KeyMetricsGrid.tsx`
- Create: `src/app/dashboard/scenarios/new/BreakEvenTable.tsx`

- [ ] **Step 1: Create KeyMetricsGrid.tsx**

```tsx
'use client'

import type { KeyMetrics } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

function StatCard({ label, value, subLabel, positive }: {
  label: string; value: string; subLabel?: string; positive?: boolean
}) {
  return (
    <div className="rounded-[14px] p-5 flex flex-col justify-between" style={{
      background: 'var(--sc-card)',
      border: `1px solid ${positive ? 'rgba(42,122,75,0.3)' : 'var(--sc-border)'}`,
    }}>
      <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--sc-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{
        fontFamily: "'IBM Plex Mono', monospace",
        color: positive ? '#4CC98A' : 'var(--sc-text)',
      }}>
        {value}
      </p>
      {subLabel && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--sc-muted)' }}>{subLabel}</p>
      )}
    </div>
  )
}

export default function KeyMetricsGrid({ metrics, mode }: { metrics: KeyMetrics; mode: 'purchase' | 'refinance' }) {
  const hasSavings = metrics.monthlySavings > 0
  const baseline = mode === 'refinance' ? 'current payment' : 'most expensive option'

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Key Metrics — Best Scenario
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Savings"
          value={fmtCurrency(metrics.monthlySavings) + '/mo'}
          subLabel={`vs. ${baseline}`}
          positive={hasSavings}
        />
        <StatCard
          label="Savings Over 5 Years"
          value={fmtCurrency(metrics.savings5yr)}
          subLabel="60 months"
          positive={hasSavings}
        />
        <StatCard
          label="Savings Over 15 Years"
          value={fmtCurrency(metrics.savings15yr)}
          subLabel="180 months"
          positive={hasSavings}
        />
        <StatCard
          label="Total Interest Paid"
          value={fmtCurrency(metrics.totalInterestBest)}
          subLabel="full loan term"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create BreakEvenTable.tsx**

```tsx
'use client'

import type { BreakEvenRow } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

export default function BreakEvenTable({ rows, mode }: { rows: BreakEvenRow[]; mode: 'purchase' | 'refinance' }) {
  if (!rows.length) return null

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Break-Even Analysis
        </h3>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--sc-muted)' }}>
          {mode === 'purchase'
            ? 'Months until additional upfront cost is recouped through lower monthly payments'
            : 'Months until closing costs are recouped through monthly savings'}
        </p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--sc-card-alt)' }}>
            {['Scenario', 'Cost to Close', 'Monthly Savings', 'Break-Even (Months)', 'Break-Even (Years)'].map(h => (
              <th key={h} style={{ textAlign: h === 'Scenario' ? 'left' : 'right', padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--sc-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
              <td style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sc-text)', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {row.label}
              </td>
              <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 11, color: 'var(--sc-muted)', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {fmtCurrency(row.additionalCostToClose)}
              </td>
              <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 11, color: '#4CC98A', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {fmtCurrency(row.monthlySavings)}/mo
              </td>
              <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#C9A84C', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {row.breakEvenMonths}
              </td>
              <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 11, color: 'var(--sc-text)', borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {row.breakEvenYears.toFixed(1)} yrs
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/scenarios/new/KeyMetricsGrid.tsx src/app/dashboard/scenarios/new/BreakEvenTable.tsx
git commit -m "feat(scenarios): add KeyMetricsGrid and BreakEvenTable output sections"
```

---

### Task 5: Rebuild ScenarioCharts.tsx (Sections 2, 5, 6)

**Files:**
- Modify: `src/app/dashboard/scenarios/new/ScenarioCharts.tsx`

Remove: EquityChart, AmortizationChart
Replace/Update: MonthlyPaymentChart (labeled bars on top), CumulativeSavingsChart (annotated break-even), TotalInterestChart (new)

- [ ] **Step 1: Rewrite ScenarioCharts.tsx**

Complete replacement — 3 charts only:

```tsx
'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceDot, Cell, LabelList,
} from 'recharts'
import type { DisplayData } from '@/lib/scenarios/displayData'

const CHART_COLORS = ['#5b8def', '#C9A84C', '#4CC98A', '#a78bfa']
const NAVY = '#0A1628'

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--sc-card)',
    border: '1px solid var(--sc-border)',
    borderRadius: 10,
    fontSize: 11,
    color: 'var(--sc-text)',
  },
  labelStyle: { color: 'var(--sc-muted)' },
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] p-5" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <h4 className="text-sm font-semibold mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h4>
      {children}
    </div>
  )
}

// ─── Custom label on top of bar ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTopLabel(props: any) {
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
      fontFamily="'IBM Plex Mono', monospace"
      fill="var(--sc-text)"
    >
      {fmtK(value)}
    </text>
  )
}

export default function ScenarioCharts({ data }: { data: DisplayData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <MonthlyPaymentChart data={data} />
      <TotalInterestChart data={data} />
      <CumulativeSavingsChart data={data} />
    </div>
  )
}

// ─── Chart 1: Monthly Payment Comparison ─────────────────────────
function MonthlyPaymentChart({ data }: { data: DisplayData }) {
  const chartData = useMemo(() => data.rows.map(r => ({
    name: r.label,
    payment: Math.round(r.totalMonthlyPayment),
    isRecommended: r.isRecommended,
  })), [data])

  return (
    <ChartCard title="Monthly Payment by Scenario">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 24, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [`$${v.toLocaleString()}`, 'Monthly Payment']}
          />
          <Bar dataKey="payment" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isRecommended ? '#C9A84C' : CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList content={<BarTopLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 2: Total Interest Paid ────────────────────────────────
function TotalInterestChart({ data }: { data: DisplayData }) {
  const baseInterest = data.rows[0]?.totalInterest ?? 0
  const chartData = useMemo(() => data.rows.map(r => {
    const diff = baseInterest - r.totalInterest
    return {
      name: r.label,
      interest: Math.round(r.totalInterest),
      diff: Math.round(diff),
      isRecommended: r.isRecommended,
    }
  }), [data, baseInterest])

  return (
    <ChartCard title="Total Interest Paid">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 24, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, _: string, props: { payload?: { diff: number } }) => {
              const diff = props.payload?.diff ?? 0
              const label = diff > 0 ? ` (saves ${fmtK(diff)} vs. first)` : diff < 0 ? ` (costs ${fmtK(-diff)} more)` : ''
              return [`$${v.toLocaleString()}${label}`, 'Total Interest']
            }}
          />
          <Bar dataKey="interest" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isRecommended ? '#C9A84C' : CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList content={<BarTopLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 3: Cumulative Savings / Break-Even ─────────────────────
function CumulativeSavingsChart({ data }: { data: DisplayData }) {
  const { cumulativeSavingsData, rows, breakEvenRows } = data

  const scenarioLabels = rows
    .filter(r => !r.isRecommended || rows.length === 1)
    .map(r => r.label)

  // For purchase, skip the baseline (highest cost) label
  const chartLabels = data.mode === 'purchase'
    ? rows.filter((_, i) => i !== 0).map(r => r.label)
    : rows.map(r => r.label)

  // Break-even annotation dots
  const breakEvenDots = breakEvenRows.map(row => ({
    label: row.label,
    month: row.breakEvenMonths,
    value: 0,
  }))

  if (!chartLabels.length) return null

  return (
    <ChartCard title="Cumulative Savings vs. Baseline (7 Years)">
      <div className="text-[10px] mb-3" style={{ color: 'var(--sc-muted)' }}>
        Positive = ahead of baseline. Dot = break-even point.
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={cumulativeSavingsData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--sc-muted)', fontSize: 10 }}
            label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: 'var(--sc-muted)', fontSize: 10 }}
          />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 10 }} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name: string) => [fmtK(v), name]}
            labelFormatter={(month: number) => `Month ${month}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Zero reference line */}
          <ReferenceDot x={0} y={0} r={0} />
          {chartLabels.map((label, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          {/* Break-even annotation dots */}
          {breakEvenDots.map((dot, i) => (
            <ReferenceDot
              key={i}
              x={dot.month}
              y={0}
              r={5}
              fill="#C9A84C"
              stroke="var(--sc-card)"
              strokeWidth={2}
              label={{ value: `Break-even: Mo ${dot.month}`, position: 'top', fontSize: 9, fill: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/scenarios/new/ScenarioCharts.tsx
git commit -m "refactor(scenarios): rebuild ScenarioCharts — remove equity/amortization, add labeled monthly + total interest + cumulative savings"
```

---

## Chunk 3: Wire Output Page + Rebuild PDF + Share Page

### Task 6: Wire New Sections Into ScenarioBuilder Step 2

**Files:**
- Modify: `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`

The Step 2 (Results) currently renders: ResultsTable → ScenarioCharts → ReinvestmentAnalysis → NarrativeSection → ActionsBar

Replace ResultsTable + ScenarioCharts with: ScenarioSummaryTable → [Monthly Payment Chart, Section 3 KeyMetricsGrid] → [BreakEven Table] → [CumulativeSavings + TotalInterest charts] → NarrativeSection → ActionsBar

- [ ] **Step 1: Add imports to ScenarioBuilder.tsx**

Add at top with other imports:
```tsx
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import ScenarioSummaryTable from './ScenarioSummaryTable'
import KeyMetricsGrid from './KeyMetricsGrid'
import BreakEvenTable from './BreakEvenTable'
```

- [ ] **Step 2: Replace Step 2 content in ScenarioBuilder.tsx**

Find the `{step === 2 && (` block. Replace the inner content (from `<div className="space-y-6">` to just before `<ActionsBar .../>`) with:

```tsx
<div className="space-y-6">
  {/* Recalculate button */}
  <div className="flex justify-end">
    <button
      onClick={runCalculation}
      disabled={calculating}
      className="px-5 py-2 rounded-[10px] text-xs font-semibold transition-all"
      style={{
        background: calculating ? 'var(--sc-border)' : 'var(--sc-card)',
        color: calculating ? 'var(--sc-muted)' : 'var(--sc-accent)',
        border: '1px solid var(--sc-accent)',
      }}
    >
      {calculating ? 'Calculating...' : '↻ Recalculate'}
    </button>
  </div>

  {/* Section 1: Scenario Summary Table */}
  {(() => {
    const displayData = mode === 'purchase'
      ? buildPurchaseDisplayData(purchaseScenarios, purchaseResults)
      : buildRefiDisplayData(currentLoan, refiScenarios, refiResults)
    return (
      <>
        <ScenarioSummaryTable data={displayData} />

        {/* Section 2 + 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly Payment Chart embedded here */}
          {/* Full charts rendered below */}
        </div>
        <KeyMetricsGrid metrics={displayData.keyMetrics} mode={mode} />

        {/* Section 4: Break-Even Table */}
        <BreakEvenTable rows={displayData.breakEvenRows} mode={mode} />

        {/* Sections 2, 5, 6: Charts */}
        <ScenarioCharts data={displayData} />
      </>
    )
  })()}

  {/* Section 7: AI Analysis */}
  <NarrativeSection
    mode={mode}
    narrative={narrative}
    narrativeEdited={narrativeEdited}
    purchaseScenarios={purchaseScenarios}
    purchaseResults={purchaseResults}
    refiScenarios={refiScenarios}
    refiResults={refiResults}
    currentLoan={currentLoan}
    reinvestmentResult={reinvestmentResult}
    borrowerName={borrowerName}
    onNarrativeChange={(text) => { setNarrative(text); setNarrativeEdited(true) }}
    onNarrativeGenerated={setNarrative}
  />
</div>
```

- [ ] **Step 3: Update ScenarioCharts import/usage — it now takes `data: DisplayData` not individual arrays**

The ScenarioCharts was rewritten in Task 5 to take `data: DisplayData`. Make sure the import is `import ScenarioCharts from './ScenarioCharts'` (unchanged) and pass `data={displayData}`.

- [ ] **Step 4: Remove old ResultsTable and ReinvestmentAnalysis imports from ScenarioBuilder.tsx** (if no longer used)

Check that ResultsTable is not used elsewhere in the file. If not, remove:
```tsx
import ResultsTable from './ResultsTable'
import ReinvestmentAnalysis from './ReinvestmentAnalysis'
```

Note: ReinvestmentAnalysis may still be used — only remove if confirmed unused.

- [ ] **Step 5: Run build to verify no TypeScript errors**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build 2>&1 | tail -30
```

Expected: zero type errors. Fix any issues before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/scenarios/new/ScenarioBuilder.tsx
git commit -m "refactor(scenarios): wire 7-section output into ScenarioBuilder Step 2"
```

---

### Task 7: Rebuild generate-pdf Route (All 7 Sections)

**Files:**
- Modify: `src/app/api/scenarios/generate-pdf/route.ts`

The PDF is HTML with `@media print` CSS. Add all 7 sections using the `buildDisplayData` utility.

- [ ] **Step 1: Import displayData utility in the route**

Add at top of imports:
```typescript
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData } from '@/lib/scenarios/displayData'
```

- [ ] **Step 2: Replace `generatePDFHTML` function with rebuilt 7-section version**

The function signature stays the same. Replace the body entirely:

```typescript
function generatePDFHTML(
  scenario: Record<string, unknown>,
  settings: Record<string, string> | null,
  results: ScenarioResultData[],  // keep for backwards compat but not primary
  mode: string,
  displayData: DisplayData
): string {
  const borrower = scenario.borrower_name as string || ''
  const address = scenario.property_address as string || ''
  const narrative = scenario.narrative as string || ''
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const loName = settings?.lo_name || 'Adam Styer'
  const nmls = settings?.nmls || '513013'
  const company = settings?.company || 'Adam Styer | Mortgage Solutions LP'
  const phone = settings?.phone || '(512) 956-6010'
  const email = settings?.email || 'adam@styermortgage.com'

  // Section 1: Scenario Summary Table
  const summaryTableHTML = buildSummaryTableHTML(displayData)

  // Section 3: Key Metrics Grid
  const keyMetricsHTML = buildKeyMetricsHTML(displayData)

  // Section 4: Break-Even Table
  const breakEvenHTML = displayData.breakEvenRows.length ? buildBreakEvenHTML(displayData) : ''

  // Section 7: AI Analysis narrative
  const analysisHTML = narrative ? `
    <div class="analysis-section">
      <h3>Analysis</h3>
      <div class="analysis-body">${narrative.replace(/\n\n/g, '</p><p>').replace(/\n/g, ' ')}</div>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis — ${borrower}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0A1628;
      --gold: #C9A84C;
      --gold-lt: #F0D98A;
      --light-bg: #F2F0EB;
      --mid-gray: #8A8A8A;
      --green: #2A7A4B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }

    .top-bar { background: var(--navy); padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; }
    .top-bar .company-name { color: #fff; font-size: 14px; font-weight: 700; }
    .top-bar .date { color: var(--gold-lt); font-size: 10px; font-weight: 500; }
    .gold-line { height: 3px; background: var(--gold); }
    .sub-bar { background: var(--navy); padding: 6px 40px; display: flex; justify-content: center; gap: 16px; }
    .sub-bar span { color: var(--gold-lt); font-size: 9px; font-weight: 500; letter-spacing: 0.03em; }

    .page { max-width: 960px; margin: 0 auto; padding: 32px 40px 24px; }
    .title-h1 { font-size: 22px; font-weight: 700; color: var(--navy); }
    .prepared { font-size: 11px; color: var(--mid-gray); margin-top: 4px; }
    .gold-divider { height: 2px; background: var(--gold); margin: 16px 0 20px; }

    /* Section headers */
    .section-title { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Summary Table */
    .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .summary-table th { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-bottom: 2px solid var(--gold); }
    .summary-table th.label-col { text-align: left; color: rgba(255,255,255,0.5); background: var(--navy); }
    .summary-table th.data-col { text-align: right; background: var(--navy); color: #fff; }
    .summary-table th.data-col.recommended { color: var(--gold); background: rgba(201,168,76,0.12); border-bottom-color: var(--gold); }
    .summary-table td { padding: 7px 12px; font-size: 10.5px; border-bottom: 1px solid #e8e8e8; }
    .summary-table td.label-col { color: #666; font-weight: 500; }
    .summary-table td.data-col { text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 500; }
    .summary-table td.data-col.recommended { font-weight: 700; color: #0A1628; background: rgba(201,168,76,0.06); }
    .summary-table tr:nth-child(even) td.label-col { background: #fafafa; }
    .summary-table tr:nth-child(even) td.data-col { background: #fafafa; }
    .summary-table tr:nth-child(even) td.data-col.recommended { background: rgba(201,168,76,0.08); }

    /* Key Metrics */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric-card { background: var(--light-bg); border-radius: 8px; padding: 14px; border-left: 3px solid var(--gold); }
    .metric-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mid-gray); margin-bottom: 6px; }
    .metric-value { font-size: 18px; font-weight: 700; color: var(--navy); font-family: 'IBM Plex Mono', monospace; }
    .metric-value.positive { color: var(--green); }
    .metric-sub { font-size: 9px; color: var(--mid-gray); margin-top: 4px; }

    /* Break-Even Table */
    .be-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .be-table th { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 7px 12px; background: #f2f2f2; border-bottom: 2px solid var(--navy); color: #444; }
    .be-table th:not(:first-child) { text-align: right; }
    .be-table td { padding: 7px 12px; font-size: 10.5px; border-bottom: 1px solid #e8e8e8; font-family: 'IBM Plex Mono', monospace; }
    .be-table td:first-child { font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; color: var(--navy); }
    .be-table td:not(:first-child) { text-align: right; }
    .be-table td.gold { color: #0A1628; font-weight: 700; }
    .be-table td.green { color: var(--green); }

    /* Per-Scenario Cards */
    .scenario-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .scenario-card { border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }
    .card-header { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
    .card-header.recommended { background: var(--navy); }
    .card-header.recommended .card-title { color: #fff; }
    .card-header:not(.recommended) { background: #3a3a3a; }
    .card-header:not(.recommended) .card-title { color: #fff; }
    .card-title { font-size: 12px; font-weight: 700; }
    .card-badge { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold); border: 1px solid var(--gold); padding: 2px 7px; border-radius: 3px; }
    .card-hero { padding: 14px 14px 10px; border-bottom: 2px solid var(--gold); text-align: center; background: var(--light-bg); }
    .hero-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mid-gray); font-weight: 600; margin-bottom: 3px; }
    .hero-value { font-size: 24px; font-weight: 700; color: var(--navy); font-family: 'IBM Plex Mono', monospace; }
    .card-rows { padding: 0; }
    .card-row { display: flex; justify-content: space-between; padding: 5px 14px; border-bottom: 1px solid #f0f0f0; }
    .card-row:nth-child(even) { background: #fafafa; }
    .card-row-label { font-size: 9.5px; color: #666; font-weight: 500; }
    .card-row-value { font-size: 9.5px; font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: #1a1a1a; }

    /* Analysis */
    .analysis-section { padding: 18px 20px; background: var(--light-bg); border-radius: 8px; border-left: 4px solid var(--gold); margin-bottom: 24px; }
    .analysis-section h3 { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
    .analysis-body { font-size: 11px; color: #444; line-height: 1.7; }
    .analysis-body p { margin-bottom: 10px; }
    .analysis-body p:last-child { margin-bottom: 0; }

    /* Footer */
    .footer-bar { background: var(--navy); padding: 14px 40px; margin-top: 24px; }
    .footer-cta { text-align: center; padding: 10px; border: 1px solid var(--gold); border-radius: 6px; margin-bottom: 10px; }
    .footer-cta-text { color: #fff; font-size: 12px; font-weight: 600; }
    .footer-cta-contact { color: var(--gold-lt); font-size: 10px; margin-top: 4px; }
    .footer-disclaimer { text-align: center; font-size: 8px; color: var(--mid-gray); line-height: 1.6; }

    @media print {
      body { padding: 0; }
      @page { margin: 0; size: letter; }
      .top-bar, .gold-line, .sub-bar, .footer-bar { position: relative; }
      .scenario-card { break-inside: avoid; }
      .analysis-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <span class="company-name">${company}</span>
    <span class="date">${date}</span>
  </div>
  <div class="gold-line"></div>
  <div class="sub-bar">
    <span>NMLS #${nmls}</span>
    <span>${phone}</span>
    <span>${email}</span>
    <span>styermortgage.com</span>
  </div>

  <div class="page">
    <h1 class="title-h1">${borrower ? `${borrower} — ` : ''}${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis</h1>
    <div class="prepared">Prepared by ${loName} · ${date}</div>
    <div class="gold-divider"></div>

    <!-- Section 1: Scenario Summary Table -->
    ${summaryTableHTML}

    <!-- Section 3: Key Metrics Grid -->
    ${keyMetricsHTML}

    <!-- Section 4: Break-Even Table -->
    ${breakEvenHTML}

    <!-- Per-Scenario Cards (Section 2 visual) -->
    <div class="section-title" style="margin-bottom:10px">Scenario Details</div>
    <div class="scenario-cards">
      ${results.map(r => buildScenarioCardHTML(r)).join('')}
    </div>

    <!-- Section 7: AI Analysis -->
    ${analysisHTML}
  </div>

  <div class="footer-bar">
    <div class="footer-cta">
      <div class="footer-cta-text">Questions? Let's talk.</div>
      <div class="footer-cta-contact">${loName} · ${phone} · ${email} · styermortgage.com</div>
    </div>
    <div class="footer-disclaimer">
      This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
      Consult with your loan officer for personalized guidance. This analysis was generated with AI assistance and reviewed by ${loName}.
      Equal Housing Lender | ${company} | NMLS #${nmls}
    </div>
  </div>
</body>
</html>`
}
```

- [ ] **Step 3: Add HTML builder helper functions**

Add these before `generatePDFHTML`:

```typescript
function buildSummaryTableHTML(data: DisplayData): string {
  const fmt = (v: number | undefined) => v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US')
  const fmtPct = (v: number | undefined) => v == null ? '—' : v.toFixed(3) + '%'

  const metricRows: { label: string; getValue: (r: typeof data.rows[0]) => string }[] = [
    ...(data.mode === 'purchase' ? [{ label: 'Purchase Price', getValue: (r: typeof data.rows[0]) => fmt(r.purchasePrice) }] : []),
    { label: 'Loan Amount', getValue: r => fmt(r.loanAmount) },
    { label: 'Interest Rate', getValue: r => fmtPct(r.interestRate) },
    { label: 'APR', getValue: r => fmtPct(r.apr) },
    { label: 'Monthly P&I', getValue: r => fmt(r.monthlyPI) },
    { label: 'Total Monthly Payment', getValue: r => fmt(r.totalMonthlyPayment) },
    { label: 'Cash to Close', getValue: r => fmt(r.cashToClose) },
    { label: 'Monthly Savings vs. Baseline', getValue: r => r.monthlySavingsVsCurrent ? fmt(r.monthlySavingsVsCurrent) + '/mo' : '—' },
    { label: 'Total Interest (Life)', getValue: r => fmt(r.totalInterest) },
  ]

  const headerCols = data.rows.map((row, i) =>
    `<th class="data-col${row.isRecommended ? ' recommended' : ''}">${row.label}${row.isRecommended ? '<br><small style="font-size:8px;font-weight:600;color:#C9A84C">★ RECOMMENDED</small>' : ''}</th>`
  ).join('')

  const bodyRows = metricRows.map(m =>
    `<tr><td class="label-col">${m.label}</td>${data.rows.map(row => `<td class="data-col${row.isRecommended ? ' recommended' : ''}">${m.getValue(row)}</td>`).join('')}</tr>`
  ).join('')

  return `
    <div class="section-title">Scenario Comparison</div>
    <table class="summary-table">
      <thead><tr><th class="label-col">Metric</th>${headerCols}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`
}

function buildKeyMetricsHTML(data: DisplayData): string {
  const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US')
  const m = data.keyMetrics
  const hasPositive = m.monthlySavings > 0

  const cards = [
    { label: 'Monthly Savings', value: fmt(m.monthlySavings) + '/mo', sub: 'vs. baseline', positive: hasPositive },
    { label: 'Savings Over 5 Years', value: fmt(m.savings5yr), sub: '60 months', positive: hasPositive },
    { label: 'Savings Over 15 Years', value: fmt(m.savings15yr), sub: '180 months', positive: hasPositive },
    { label: 'Total Interest Paid', value: fmt(m.totalInterestBest), sub: 'full loan term', positive: false },
  ]

  return `
    <div class="section-title" style="margin-bottom:10px">Key Metrics — Best Scenario</div>
    <div class="metrics-grid">
      ${cards.map(c => `
        <div class="metric-card">
          <div class="metric-label">${c.label}</div>
          <div class="metric-value${c.positive ? ' positive' : ''}">${c.value}</div>
          <div class="metric-sub">${c.sub}</div>
        </div>`).join('')}
    </div>`
}

function buildBreakEvenHTML(data: DisplayData): string {
  if (!data.breakEvenRows.length) return ''
  const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

  const rows = data.breakEvenRows.map(r =>
    `<tr>
      <td>${r.label}</td>
      <td>${fmt(r.additionalCostToClose)}</td>
      <td class="green">${fmt(r.monthlySavings)}/mo</td>
      <td class="gold">${r.breakEvenMonths}</td>
      <td>${r.breakEvenYears.toFixed(1)} yrs</td>
    </tr>`
  ).join('')

  return `
    <div class="section-title" style="margin-bottom:10px">Break-Even Analysis</div>
    <table class="be-table">
      <thead><tr><th>Scenario</th><th>Cost to Close</th><th>Monthly Savings</th><th>Break-Even (Mo)</th><th>Break-Even (Yrs)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function buildScenarioCardHTML(r: ScenarioResultData): string {
  const isRec = false // PDF cards don't get recommended badge, summary table handles it
  const metricsRows = r.rows.map(([label, val], i) =>
    `<div class="card-row"><span class="card-row-label">${label}</span><span class="card-row-value">${val}</span></div>`
  ).join('')

  return `
    <div class="scenario-card">
      <div class="card-header">
        <span class="card-title">${r.label}</span>
        <span class="card-badge">${r.loanType}</span>
      </div>
      <div class="card-hero">
        <div class="hero-label">${r.heroLabel}</div>
        <div class="hero-value">${r.heroValue}</div>
      </div>
      <div class="card-rows">${metricsRows}</div>
    </div>`
}
```

- [ ] **Step 4: Update POST handler to pass displayData to generatePDFHTML**

In the POST handler, before calling `generatePDFHTML`, add:

```typescript
// Build shared display data
const displayData = mode === 'purchase'
  ? buildPurchaseDisplayData(
      scenarioInputs as PurchaseScenarioInput[],
      scenarioInputs.map(s => calculatePurchaseScenario(s as PurchaseScenarioInput, propertyValue))
    )
  : buildRefiDisplayData(
      scenario.current_loan_data as CurrentLoanInput,
      scenarioInputs as RefiScenarioInput[],
      scenarioInputs.map(s => {
        const curr = calculateCurrentLoan(scenario.current_loan_data as CurrentLoanInput)
        return calculateRefiScenario(s as RefiScenarioInput, scenario.current_loan_data as CurrentLoanInput, curr, propertyValue)
      })
    )

const html = generatePDFHTML(scenario, userSettings, scenarioResults, mode, displayData)
```

Also update `generatePDFHTML` signature:
```typescript
function generatePDFHTML(
  scenario: Record<string, unknown>,
  settings: Record<string, string> | null,
  results: ScenarioResultData[],
  mode: string,
  displayData: DisplayData
): string {
```

- [ ] **Step 5: Build check**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/scenarios/generate-pdf/route.ts
git commit -m "feat(scenarios): rebuild PDF with 7-section layout using shared displayData"
```

---

### Task 8: Rebuild Share Page (All 7 Sections)

**Files:**
- Modify: `src/app/share/[token]/page.tsx`

Replace the current dark table view with a professional branded layout matching the 7-section output. The share page receives raw DB data — it must recalculate from scratch using the same logic as the in-app output.

- [ ] **Step 1: Rewrite `src/app/share/[token]/page.tsx`**

Complete replacement. Key changes:
1. Import and use `buildPurchaseDisplayData` / `buildRefiDisplayData`
2. Re-run calculations (same as PDF route) to get results
3. Render the 7 sections as HTML (no Recharts — share page is server-rendered compatible, but since it's `'use client'`, we can use Recharts for charts)

The share page can reuse the same component approach. Full rewrite:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData } from '@/lib/scenarios/displayData'
import {
  calculatePurchaseScenario, calculateCurrentLoan, calculateRefiScenario
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: AnyObj | null
  scenarios_data: AnyObj[]
  results_data: AnyObj[] | null
  narrative: string | null
  created_at: string
}

const fmtCurrency = (v: number | undefined | null) =>
  v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US')
const fmtRate = (v: number | undefined | null) =>
  v == null ? '—' : v.toFixed(3) + '%'

export default function SharePage({ params }: { params: { token: string } }) {
  const [raw, setRaw] = useState<SharedScenario | null>(null)
  const [displayData, setDisplayData] = useState<DisplayData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(res => {
        if (res.status === 410) throw new Error('This share link has expired.')
        if (res.status === 404) throw new Error('Scenario not found.')
        if (!res.ok) throw new Error('Failed to load scenario.')
        return res.json()
      })
      .then((data: SharedScenario) => {
        setRaw(data)
        // Build display data from raw scenario
        const mode = data.scenario_type
        const propertyValue = data.property_value ?? 0

        if (mode === 'purchase') {
          const scenarios = data.scenarios_data as PurchaseScenarioInput[]
          const results = scenarios.map(s => calculatePurchaseScenario(s, propertyValue))
          setDisplayData(buildPurchaseDisplayData(scenarios, results))
        } else {
          const currentLoan = data.current_loan_data as CurrentLoanInput
          const scenarios = data.scenarios_data as RefiScenarioInput[]
          const currentCalc = calculateCurrentLoan(currentLoan)
          const results = scenarios.map(s => calculateRefiScenario(s, currentLoan, currentCalc, propertyValue))
          setDisplayData(buildRefiDisplayData(currentLoan, scenarios, results))
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#F0EDE880' }}>
        <p className="text-sm">Loading scenario...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#C94C4C' }}>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!raw || !displayData) return null

  const isPurchase = raw.scenario_type === 'purchase'
  const mode = isPurchase ? 'purchase' : 'refinance'

  return (
    <div className="min-h-screen" style={{ background: '#0A1628', color: '#F0EDE8', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* NAVY Header */}
      <div style={{ background: '#0A1628', borderBottom: '3px solid #C9A84C', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Adam Styer | Mortgage Solutions LP</span>
        <span style={{ color: '#F0D98A', fontSize: 10, fontWeight: 500 }}>
          {new Date(raw.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div style={{ background: '#0A1628', padding: '4px 40px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        {['NMLS #513013', '(512) 956-6010', 'styermortgage.com'].map(s => (
          <span key={s} style={{ color: '#F0D98A', fontSize: 9, fontWeight: 500, letterSpacing: '0.03em' }}>{s}</span>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ color: '#F0EDE8' }}>
            {raw.borrower_name ? `${raw.borrower_name} — ` : ''}{isPurchase ? 'Purchase' : 'Refinance'} Analysis
          </h1>
          {raw.property_address && (
            <p className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>{raw.property_address}</p>
          )}
          <div style={{ height: 2, background: '#C9A84C', marginTop: 12, marginBottom: 20 }} />
        </div>

        {/* Section 1: Summary Table */}
        <ShareSummaryTable data={displayData} />

        {/* Section 3: Key Metrics */}
        <ShareKeyMetrics data={displayData} mode={mode} />

        {/* Section 4: Break-Even Table */}
        {displayData.breakEvenRows.length > 0 && <ShareBreakEvenTable data={displayData} />}

        {/* Section 7: AI Analysis */}
        {raw.narrative && (
          <div className="rounded-xl p-6 mb-8" style={{ background: 'rgba(242,240,235,0.06)', border: '1px solid rgba(201,168,76,0.3)', borderLeft: '4px solid #C9A84C' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>Analysis</h3>
            <div className="text-sm leading-relaxed" style={{ color: '#F0EDE8' }}>
              {raw.narrative.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: i < raw.narrative!.split('\n\n').length - 1 ? 12 : 0 }}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 }}>
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(240,237,232,0.3)' }}>
            This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
            Consult with your loan officer for personalized guidance.
            This analysis was generated with AI assistance and reviewed by a licensed loan officer. Equal Housing Lender.
          </p>
          <p className="text-[10px] mt-2 font-medium" style={{ color: 'rgba(201,168,76,0.4)' }}>
            Powered by LoanOS
          </p>
        </div>
      </div>
    </div>
  )
}

function ShareSummaryTable({ data }: { data: DisplayData }) {
  const metricRows: { label: string; getValue: (r: typeof data.rows[0]) => string }[] = [
    ...(data.mode === 'purchase' ? [{ label: 'Purchase Price', getValue: (r: typeof data.rows[0]) => fmtCurrency(r.purchasePrice) }] : []),
    { label: 'Loan Amount', getValue: r => fmtCurrency(r.loanAmount) },
    { label: 'Interest Rate', getValue: r => fmtRate(r.interestRate) },
    { label: 'APR', getValue: r => fmtRate(r.apr) },
    { label: 'Monthly P&I', getValue: r => fmtCurrency(r.monthlyPI) },
    { label: 'Total Monthly Payment', getValue: r => fmtCurrency(r.totalMonthlyPayment) },
    { label: 'Cash to Close', getValue: r => fmtCurrency(r.cashToClose) },
    { label: 'Monthly Savings vs. Baseline', getValue: r => r.monthlySavingsVsCurrent ? fmtCurrency(r.monthlySavingsVsCurrent) + '/mo' : '—' },
    { label: 'Total Interest (Life)', getValue: r => fmtCurrency(r.totalInterest) },
  ]

  return (
    <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 500, color: 'rgba(240,237,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #C9A84C', background: 'rgba(255,255,255,0.04)' }}>Metric</th>
              {data.rows.map((row, i) => (
                <th key={i} style={{
                  textAlign: 'right',
                  padding: '10px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: row.isRecommended ? '#C9A84C' : '#F0EDE8',
                  borderBottom: `2px solid ${row.isRecommended ? '#C9A84C' : 'rgba(255,255,255,0.2)'}`,
                  background: row.isRecommended ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)',
                }}>
                  {row.label}
                  {row.isRecommended && <div style={{ fontSize: 8, fontWeight: 600, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>★ RECOMMENDED</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricRows.map((m, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 500, color: 'rgba(240,237,232,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{
                    padding: '8px 14px',
                    textAlign: 'right',
                    fontSize: 11,
                    fontWeight: row.isRecommended ? 600 : 400,
                    color: row.isRecommended ? '#C9A84C' : '#F0EDE8',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: row.isRecommended ? 'rgba(201,168,76,0.04)' : 'transparent',
                  }}>
                    {m.getValue(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ShareKeyMetrics({ data, mode }: { data: DisplayData; mode: string }) {
  const m = data.keyMetrics
  const hasPositive = m.monthlySavings > 0
  const cards = [
    { label: 'Monthly Savings', value: fmtCurrency(m.monthlySavings) + '/mo', sub: `vs. ${mode === 'refinance' ? 'current payment' : 'most expensive option'}`, positive: hasPositive },
    { label: 'Savings Over 5 Years', value: fmtCurrency(m.savings5yr), sub: '60 months', positive: hasPositive },
    { label: 'Savings Over 15 Years', value: fmtCurrency(m.savings15yr), sub: '180 months', positive: hasPositive },
    { label: 'Total Interest Paid', value: fmtCurrency(m.totalInterestBest), sub: 'full loan term', positive: false },
  ]

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#C9A84C' }}>Key Metrics — Best Scenario</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(242,240,235,0.04)', border: `1px solid ${c.positive ? 'rgba(76,201,138,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            <p className="text-[9px] font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.5)' }}>{c.label}</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.positive ? '#4CC98A' : '#F0EDE8' }}>{c.value}</p>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(240,237,232,0.4)' }}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShareBreakEvenTable({ data }: { data: DisplayData }) {
  return (
    <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#C9A84C' }}>Break-Even Analysis</h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['Scenario', 'Cost to Close', 'Monthly Savings', 'Break-Even (Mo)', 'Break-Even (Yrs)'].map(h => (
              <th key={h} style={{ textAlign: h === 'Scenario' ? 'left' : 'right', padding: '8px 14px', fontSize: 10, fontWeight: 600, color: 'rgba(240,237,232,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', fontFamily: "'IBM Plex Mono', monospace" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.breakEvenRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: '#F0EDE8', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{row.label}</td>
              <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, color: 'rgba(240,237,232,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(row.additionalCostToClose)}</td>
              <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, color: '#4CC98A', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(row.monthlySavings)}/mo</td>
              <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#C9A84C', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{row.breakEvenMonths}</td>
              <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, color: '#F0EDE8', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'IBM Plex Mono', monospace" }}>{row.breakEvenYears.toFixed(1)} yrs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/share/\[token\]/page.tsx
git commit -m "feat(scenarios): rebuild share page with 7-section layout using shared displayData"
```

---

### Task 9: Final Integration — Build, Push, and Update CONTEXT.md

- [ ] **Step 1: Full build verification**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build 2>&1 | tail -40
```

Expected: zero TypeScript errors, zero build failures.

- [ ] **Step 2: Push to main (triggers Vercel deploy)**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git push origin main
```

- [ ] **Step 3: Verify Vercel deployment**

Use Vercel MCP:
```
list_deployments — confirm latest deploy is READY
get_deployment_build_logs — confirm no runtime errors
```

- [ ] **Step 4: Update CONTEXT.md**

Add to the top of CONTEXT.md (Current Status section) — the sprint summary:

```markdown
**Scenario Builder Output Rebuild (2026-03-18)**: Complete overhaul of the AI Scenario Builder output page, PDF, and share page. (1) **AI Analysis fix**: Added console logging of actual API key errors. Updated system prompt from bullet format to 4-paragraph plain English. Error message now shows the actual error instead of a generic fallback. (2) **Shared `buildDisplayData` utility** (`src/lib/scenarios/displayData.ts`): single source of truth for all derived values (savings, break-even, 5yr/15yr totals, total interest). Used by output page, PDF route, and share page — eliminates drift. (3) **ScenarioCharts rebuilt**: Removed `EquityChart` and `AmortizationChart`. Replaced with labeled `MonthlyPaymentChart` (dollar labels on top of each bar), `TotalInterestChart` (bars with savings vs. first scenario), and `CumulativeSavingsChart` (line chart 0-84 months with annotated break-even dots). (4) **New output sections**: `ScenarioSummaryTable` (comparison table, recommended column in navy/gold), `KeyMetricsGrid` (4 stat cards: monthly savings, 5yr, 15yr, total interest), `BreakEvenTable` (cost to close / monthly savings / break-even months / years). (5) **PDF rebuilt** (`generate-pdf/route.ts`): 7-section HTML layout with NAVY branding — summary table, key metrics grid, break-even table, per-scenario cards, AI analysis in gold-bordered box. (6) **Share page rebuilt** (`share/[token]/page.tsx`): Re-runs calculations from raw DB data using shared utility, renders 7-section layout matching in-app output.
```

- [ ] **Step 5: Update CHANGELOG.md**

```markdown
## [v2.2.0] — 2026-03-18

### Changed
- Scenario Builder output page: 7-section layout (Summary Table, Monthly Payment Chart, Key Metrics Grid, Break-Even Table, Cumulative Savings Chart, Total Interest Chart, AI Analysis)
- Scenario Builder AI prompt: paragraph form (was bullet points)
- ScenarioCharts: removed equity buildup and principal/interest charts, replaced with labeled bar + cumulative savings line
- PDF: rebuilt with 7-section layout, NAVY branding, all sections matched to share page

### Added
- `src/lib/scenarios/displayData.ts`: shared utility for all derived metric calculations
- `ScenarioSummaryTable.tsx`: comparison table with recommended column highlight
- `KeyMetricsGrid.tsx`: 4 large stat cards
- `BreakEvenTable.tsx`: break-even analysis table

### Fixed
- AI analysis error now shows actual error message instead of generic fallback
- Share page and PDF now use same calculations (no drift)
```

- [ ] **Step 6: Commit context updates**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add CONTEXT.md CHANGELOG.md
git commit -m "docs: update CONTEXT.md and CHANGELOG.md for Scenario Builder output rebuild"
git push origin main
```
