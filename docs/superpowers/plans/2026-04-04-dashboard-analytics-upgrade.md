# Dashboard Analytics Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sparklines, conversion funnel, commission forecast, YoY comparison, days-to-close gauge, referral leaderboard, rate lock countdowns, and remove the stale loan display cap to the LoanOS dashboard.

**Architecture:** All new data computations happen in the server component (`page.tsx`), passed as props to `DashboardClient.tsx`. New visualizations are built as focused client components in `src/components/dashboard/charts/`. Recharts (already installed v3.8.0) powers all charts. No new dependencies needed.

**Tech Stack:** Next.js 14 (App Router), Supabase, Recharts, Tailwind CSS, TypeScript

**Parallel Workstreams:**
- **Workstream A (Claude):** Tasks 1–5 — data layer + pipeline tab improvements (sparklines, funnel, stale cap, referral leaderboard, rate lock countdowns)
- **Workstream B (Codex):** Tasks 6–9 — performance tab improvements (YoY comparison, commission forecast, days-to-close gauge, performance tab layout)

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/dashboard/charts/SparklineCard.tsx` | Reusable KPI card with embedded sparkline |
| `src/components/dashboard/charts/ConversionFunnel.tsx` | Lead → App → Submitted → Approved → CTC → Funded funnel |
| `src/components/dashboard/charts/ReferralLeaderboard.tsx` | Top referral sources ranked by volume |
| `src/components/dashboard/charts/RateLockCountdown.tsx` | Visual countdown bars for locked loans |
| `src/components/dashboard/charts/CommissionForecast.tsx` | Projected commission line overlaid on actuals |
| `src/components/dashboard/charts/DaysToCloseGauge.tsx` | Avg days-to-close by loan type |
| `src/components/dashboard/charts/YoYVolumeChart.tsx` | This year vs last year monthly volume bars |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/dashboard/page.tsx` | Add 6 new data computations, parallelize queries, expand loans query to include last year |
| `src/components/dashboard/DashboardClient.tsx` | Accept new props, replace flat KPI cards with SparklineCards, add new chart sections, remove stale loan cap |

---

## Task 1: Sparkline KPI Cards

**Files:**
- Create: `src/components/dashboard/charts/SparklineCard.tsx`
- Modify: `src/app/dashboard/page.tsx` (lines 239–253 — monthly data computation)
- Modify: `src/components/dashboard/DashboardClient.tsx` (lines 133–162 — KPI cards section)

### Data needed
Monthly commission, volume, and funded count for the trailing 6 months (not just current year).

- [ ] **Step 1: Compute trailing-6-month sparkline data in page.tsx**

In `src/app/dashboard/page.tsx`, after the existing `monthlyMap` loop (line 253), add sparkline data computation. Insert after line 253:

```typescript
// ── Sparkline data: trailing 6 months of commission, volume, funded count ───
const sparklineMonths: Array<{ month: string; commission: number; volume: number; funded: number }> = []
{
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const mk = d.toLocaleString('en-US', { month: 'short' })
    const yr = d.getFullYear()
    const mo = d.getMonth()
    let commission = 0, volume = 0, funded = 0
    for (const loan of loans ?? []) {
      const rawStatus = (loan.status ?? '').toLowerCase()
      const closingDate = loan.closing_date || loan.funding_date
      if (!closingDate || !(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
      const cd = new Date(closingDate)
      if (cd.getFullYear() === yr && cd.getMonth() === mo) {
        commission += loan.commission_amount ?? 0
        volume += loan.loan_amount ?? 0
        funded++
      }
    }
    sparklineMonths.push({ month: mk, commission, volume, funded })
  }
}
```

- [ ] **Step 2: Pass sparklineMonths to DashboardClient**

In `page.tsx`, add to the `<DashboardClient>` JSX props (after line 273 `chartData={chartData}`):

```typescript
sparklineMonths={sparklineMonths}
```

- [ ] **Step 3: Create SparklineCard component**

Create `src/components/dashboard/charts/SparklineCard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card } from '@/components/ui/card'

interface SparklineCardProps {
  href: string
  label: string
  value: string
  subtitle: string
  borderColor: string
  valueColor?: string
  data: Array<{ value: number }>
  sparkColor: string
}

export default function SparklineCard({
  href, label, value, subtitle, borderColor, valueColor, data, sparkColor,
}: SparklineCardProps) {
  const hasData = data.some(d => d.value > 0)

  return (
    <Link href={href}>
      <Card
        className="p-3 hover:bg-secondary/50 transition-colors relative overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        <div className="relative z-10">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {label}
          </div>
          <div className={`text-2xl font-mono font-bold ${valueColor ?? 'text-foreground'}`}>
            {value}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        </div>
        {hasData && (
          <div className="absolute bottom-0 right-0 w-24 h-10 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  fill={sparkColor}
                  fillOpacity={0.3}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </Link>
  )
}
```

- [ ] **Step 4: Update DashboardClient types and KPI cards**

In `DashboardClient.tsx`, add to the `DashboardClientProps` interface (line 30):

```typescript
sparklineMonths: Array<{ month: string; commission: number; volume: number; funded: number }>
```

Replace the KPI cards grid (lines 133–162) with:

```tsx
import SparklineCard from './charts/SparklineCard'

{/* ── KPI Cards with Sparklines ── */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  <SparklineCard
    href="/dashboard/loans?stage=funded&period=ytd"
    label="Commission Earned"
    value={fmt(props.commissionYTD)}
    subtitle={`${props.fundedYTD} loans · ${fmtK(props.volumeYTD)} volume YTD`}
    borderColor="#10b981"
    valueColor="text-emerald-400"
    data={props.sparklineMonths.map(m => ({ value: m.commission }))}
    sparkColor="#10b981"
  />
  <SparklineCard
    href="/dashboard/loans"
    label="Pipeline Commission"
    value={fmt(props.pipelineCommission ?? props.totalActiveCommission)}
    subtitle={`${props.pipelineCount ?? props.totalActive} loans · ${fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume`}
    borderColor="#C9A84C"
    data={props.sparklineMonths.map(m => ({ value: m.volume }))}
    sparkColor="#C9A84C"
  />
  <SparklineCard
    href="/dashboard/loans?stage=funded&period=mtd"
    label="Closed This Month"
    value={fmt(props.commissionThisMonth)}
    subtitle={`${props.fundedThisMonth} loans · ${fmtK(props.volumeThisMonth)} volume`}
    borderColor="#8b5cf6"
    valueColor="text-violet-400"
    data={props.sparklineMonths.map(m => ({ value: m.funded }))}
    sparkColor="#8b5cf6"
  />
  <SparklineCard
    href="/dashboard/loans"
    label="Pipeline Loans"
    value={String(props.pipelineCount ?? props.totalActive)}
    subtitle={`${fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume`}
    borderColor="#3b82f6"
    data={props.sparklineMonths.map(m => ({ value: m.volume }))}
    sparkColor="#3b82f6"
  />
</div>
```

- [ ] **Step 5: Verify build passes**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/charts/SparklineCard.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add sparkline KPI cards with trailing 6-month trends"
```

---

## Task 2: Conversion Funnel Chart

**Files:**
- Create: `src/components/dashboard/charts/ConversionFunnel.tsx`
- Modify: `src/app/dashboard/page.tsx` (add funnel data computation)
- Modify: `src/components/dashboard/DashboardClient.tsx` (render funnel in pipeline tab)

### Data needed
Count of loans at each stage in the pipeline progression: Lead → Application → Pre-Approval → Processing → Underwriting → Clear to Close → Funded (YTD).

- [ ] **Step 1: Compute funnel data in page.tsx**

After the `stageData` computation (line 122 in page.tsx), add:

```typescript
// ── Conversion funnel: count loans that reached each stage (YTD) ────────
const funnelStages = [
  { key: 'lead' as const, label: 'Lead' },
  { key: 'new_application' as const, label: 'Application' },
  { key: 'pre_approval' as const, label: 'Pre-Approval' },
  { key: 'submitted' as const, label: 'Submitted' },
  { key: 'approved' as const, label: 'Approved' },
  { key: 'clear_to_close' as const, label: 'CTC' },
  { key: 'funded' as const, label: 'Funded' },
] as const

// Stage ordering for "reached at least this stage" logic
const STAGE_ORDER: Record<string, number> = {
  lead: 0, new_application: 1, pre_approval: 2, setup: 3,
  disclosed: 3, processing: 3, submitted: 4, underwriting: 4,
  approved: 5, resubmit: 5, clear_to_close: 6, funded: 7,
}

const funnelData = funnelStages.map(fs => {
  const threshold = STAGE_ORDER[fs.key] ?? 0
  const count = (loans ?? []).filter(l => {
    const key = normalizeToStageKey(l.status)
    return (STAGE_ORDER[key] ?? 0) >= threshold
  }).length
  return { stage: fs.label, count }
})
```

- [ ] **Step 2: Pass funnelData to DashboardClient**

Add prop: `funnelData={funnelData}`

- [ ] **Step 3: Create ConversionFunnel component**

Create `src/components/dashboard/charts/ConversionFunnel.tsx`:

```tsx
'use client'

import { Card } from '@/components/ui/card'

interface FunnelStep {
  stage: string
  count: number
}

interface ConversionFunnelProps {
  data: FunnelStep[]
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const max = data[0]?.count || 1

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Pipeline Funnel
      </h3>
      <div className="space-y-2">
        {data.map((step, i) => {
          const pct = max > 0 ? (step.count / max) * 100 : 0
          const dropoff = i > 0 && data[i - 1].count > 0
            ? Math.round(((data[i - 1].count - step.count) / data[i - 1].count) * 100)
            : null

          return (
            <div key={step.stage} className="flex items-center gap-3">
              <div className="w-20 text-[11px] font-mono text-muted-foreground text-right flex-shrink-0">
                {step.stage}
              </div>
              <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: `linear-gradient(90deg, #C9A84C, #C9A84C${Math.round(40 + pct * 0.6).toString(16)})`,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono font-semibold text-foreground">
                  {step.count}
                </span>
              </div>
              {dropoff !== null && dropoff > 0 && (
                <span className="text-[10px] font-mono text-red-400 w-10 flex-shrink-0">
                  -{dropoff}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Add ConversionFunnel to DashboardClient pipeline tab**

In `DashboardClient.tsx`, add the funnel prop to the interface:

```typescript
funnelData: Array<{ stage: string; count: number }>
```

Insert after the Needs Attention section (line 231), before Hot Leads:

```tsx
import ConversionFunnel from './charts/ConversionFunnel'

{/* ── Conversion Funnel ── */}
<ConversionFunnel data={props.funnelData} />
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/ConversionFunnel.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add pipeline conversion funnel with drop-off percentages"
```

---

## Task 3: Remove Stale Loan Display Cap

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx` (line 208)

- [ ] **Step 1: Replace slice(0, 12) with scrollable container**

In `DashboardClient.tsx`, replace line 208:

```tsx
{props.staleLoans.slice(0, 12).map(l => (
```

With:

```tsx
{props.staleLoans.map(l => (
```

And wrap the parent grid div (line 207) with a max-height scrollable container:

Replace:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
```

With:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[400px] overflow-y-auto">
```

- [ ] **Step 2: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/DashboardClient.tsx
git commit -m "fix(dashboard): show all stale loans with scrollable container instead of capping at 12"
```

---

## Task 4: Referral Source Leaderboard

**Files:**
- Create: `src/components/dashboard/charts/ReferralLeaderboard.tsx`
- Modify: `src/app/dashboard/page.tsx` (add referral computation)
- Modify: `src/components/dashboard/DashboardClient.tsx` (render leaderboard)

### Data needed
`referral_source` from the loans table — group by source, count loans + sum volume for funded/in-process loans.

- [ ] **Step 1: Compute referral data in page.tsx**

After the sparklineMonths computation, add:

```typescript
// ── Referral leaderboard: top sources by funded + in-process volume ──────
const referralMap = new Map<string, { loans: number; volume: number; funded: number }>()
for (const loan of loans ?? []) {
  const source = loan.referral_source
  if (!source) continue
  const rawStatus = (loan.status ?? '').toLowerCase()
  const isFunded = rawStatus.includes('closed') || rawStatus.includes('funded')
  const isActive = !INACTIVE.has(rawStatus)
  if (!isFunded && !isActive) continue

  const entry = referralMap.get(source) ?? { loans: 0, volume: 0, funded: 0 }
  entry.loans++
  entry.volume += loan.loan_amount ?? 0
  if (isFunded) entry.funded++
  referralMap.set(source, entry)
}

const referralData = [...referralMap.entries()]
  .map(([source, data]) => ({ source, ...data }))
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 10)
```

Note: This requires adding `referral_source` to the loans query select. Update the query on line 33:

```typescript
.select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, rate_lock_expiration, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at, lender_name, referral_source')
```

- [ ] **Step 2: Pass referralData to DashboardClient**

Add prop: `referralData={referralData}`

- [ ] **Step 3: Create ReferralLeaderboard component**

Create `src/components/dashboard/charts/ReferralLeaderboard.tsx`:

```tsx
'use client'

import { Card } from '@/components/ui/card'
import { fmtK } from '@/lib/formatters'

interface ReferralEntry {
  source: string
  loans: number
  volume: number
  funded: number
}

interface ReferralLeaderboardProps {
  data: ReferralEntry[]
}

export default function ReferralLeaderboard({ data }: ReferralLeaderboardProps) {
  if (data.length === 0) return null
  const maxVolume = data[0]?.volume || 1

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Top Referral Sources
      </h3>
      <div className="space-y-2">
        {data.map((entry, i) => {
          const pct = (entry.volume / maxVolume) * 100
          return (
            <div key={entry.source} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-xs font-mono text-foreground">{entry.source}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                  <span>{entry.loans} loans</span>
                  <span className="text-primary font-medium">{fmtK(entry.volume)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden ml-6">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Add ReferralLeaderboard to DashboardClient pipeline tab**

Add to interface:

```typescript
referralData: Array<{ source: string; loans: number; volume: number; funded: number }>
```

Insert after Hot Leads, before Today's Priorities grid:

```tsx
import ReferralLeaderboard from './charts/ReferralLeaderboard'

{/* ── Referral Leaderboard ── */}
<ReferralLeaderboard data={props.referralData} />
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/ReferralLeaderboard.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add referral source leaderboard ranked by volume"
```

---

## Task 5: Rate Lock Countdown Bars

**Files:**
- Create: `src/components/dashboard/charts/RateLockCountdown.tsx`
- Modify: `src/app/dashboard/page.tsx` (collect rate lock data)
- Modify: `src/components/dashboard/DashboardClient.tsx` (render countdown)

- [ ] **Step 1: Collect rate lock data in page.tsx**

After the referralData computation, add:

```typescript
// ── Rate lock countdown data ─────────────────────────────────────────────
const rateLockLoans: Array<{
  id: string
  name: string
  daysRemaining: number
  totalDays: number
  expirationDate: string
}> = []
for (const loan of activeLoans) {
  if (!loan.rate_lock_expiration) continue
  const lockExp = new Date(loan.rate_lock_expiration + 'T00:00:00')
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysRemaining = Math.ceil((lockExp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysRemaining < -7) continue // skip long-expired locks

  const lockStart = loan.rate_lock_date
    ? new Date(loan.rate_lock_date + 'T00:00:00')
    : null
  const totalDays = lockStart
    ? Math.ceil((lockExp.getTime() - lockStart.getTime()) / (1000 * 60 * 60 * 24))
    : loan.rate_lock_days ?? 30

  const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
    || loan.loan_name || 'Unknown'

  rateLockLoans.push({
    id: loan.id,
    name: borrowerName,
    daysRemaining,
    totalDays: Math.max(totalDays, 1),
    expirationDate: loan.rate_lock_expiration,
  })
}
rateLockLoans.sort((a, b) => a.daysRemaining - b.daysRemaining)
```

Note: This requires adding `rate_lock_date, rate_lock_days` to the loans query select (line 33).

- [ ] **Step 2: Pass rateLockLoans to DashboardClient**

Add prop: `rateLockLoans={rateLockLoans}`

- [ ] **Step 3: Create RateLockCountdown component**

Create `src/components/dashboard/charts/RateLockCountdown.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'

interface RateLock {
  id: string
  name: string
  daysRemaining: number
  totalDays: number
  expirationDate: string
}

interface RateLockCountdownProps {
  locks: RateLock[]
}

function lockColor(daysRemaining: number): string {
  if (daysRemaining <= 0) return '#ef4444'   // red — expired
  if (daysRemaining <= 3) return '#f97316'   // orange — critical
  if (daysRemaining <= 7) return '#eab308'   // yellow — warning
  return '#22c55e'                            // green — healthy
}

function fmtDateShort(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function RateLockCountdown({ locks }: RateLockCountdownProps) {
  if (locks.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Rate Lock Status
      </h3>
      <div className="space-y-3">
        {locks.map(lock => {
          const color = lockColor(lock.daysRemaining)
          const elapsed = lock.totalDays - lock.daysRemaining
          const pctUsed = Math.min(100, Math.max(0, (elapsed / lock.totalDays) * 100))
          const label = lock.daysRemaining <= 0
            ? `EXPIRED ${-lock.daysRemaining}d ago`
            : lock.daysRemaining === 1
              ? '1 day left'
              : `${lock.daysRemaining} days left`

          return (
            <Link
              key={lock.id}
              href={`/dashboard/loans/${lock.id}`}
              className="block hover:bg-secondary/50 rounded -mx-2 px-2 py-1 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-foreground">{lock.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    exp {fmtDateShort(lock.expirationDate)}
                  </span>
                  <span className="text-[11px] font-mono font-medium" style={{ color }}>
                    {label}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pctUsed}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Add RateLockCountdown to DashboardClient pipeline tab**

Add to interface:

```typescript
rateLockLoans: Array<{ id: string; name: string; daysRemaining: number; totalDays: number; expirationDate: string }>
```

Insert after Referral Leaderboard, before Today's Priorities grid:

```tsx
import RateLockCountdown from './charts/RateLockCountdown'

{/* ── Rate Lock Countdown ── */}
<RateLockCountdown locks={props.rateLockLoans} />
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/RateLockCountdown.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add rate lock countdown bars with color-coded expiration"
```

---

## Task 6: YoY Volume Comparison Chart (Codex Workstream)

**Files:**
- Create: `src/components/dashboard/charts/YoYVolumeChart.tsx`
- Modify: `src/app/dashboard/page.tsx` (compute last year data)
- Modify: `src/components/dashboard/DashboardClient.tsx` (replace Volume by Month chart)

- [ ] **Step 1: Compute last year monthly data in page.tsx**

After the existing `chartData` computation (line 253), add:

```typescript
// ── YoY comparison: last year monthly volume ─────────────────────────────
const lastYearMap: Record<string, { loans: number; volume: number; commission: number }> = {}
const lastYear = thisYear - 1
for (const loan of loans ?? []) {
  const rawStatus = (loan.status ?? '').toLowerCase()
  const closingDate = loan.closing_date || loan.funding_date
  if (!closingDate || !(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
  const cd = new Date(closingDate)
  if (cd.getFullYear() !== lastYear) continue
  const mk = cd.toLocaleString('en-US', { month: 'short' })
  if (!lastYearMap[mk]) lastYearMap[mk] = { loans: 0, volume: 0, commission: 0 }
  lastYearMap[mk].loans++
  lastYearMap[mk].volume += loan.loan_amount ?? 0
  lastYearMap[mk].commission += loan.commission_amount ?? 0
}

const yoyChartData = MONTH_ORDER.map(m => ({
  month: m,
  thisYear: monthlyMap[m]?.volume ?? 0,
  lastYear: lastYearMap[m]?.volume ?? 0,
}))
```

- [ ] **Step 2: Pass yoyChartData to DashboardClient**

Add prop: `yoyChartData={yoyChartData}`

- [ ] **Step 3: Create YoYVolumeChart component**

Create `src/components/dashboard/charts/YoYVolumeChart.tsx`:

```tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { fmtK, fmtCurrency } from '@/lib/formatters'

interface YoYPoint {
  month: string
  thisYear: number
  lastYear: number
}

interface YoYVolumeChartProps {
  data: YoYPoint[]
  currentYear: number
}

interface TTProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string }>
  label?: string
}

const ChartTooltip = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-foreground/80 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="text-muted-foreground">
          {p.name}: <span className="text-foreground">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function YoYVolumeChart({ data, currentYear }: YoYVolumeChartProps) {
  const hasData = data.some(d => d.thisYear > 0 || d.lastYear > 0)

  if (!hasData) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
          Volume by Month — YoY
        </h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">
          No funded loans yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Volume by Month — YoY
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => fmtK(v as number)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }}
          />
          <Bar
            dataKey="lastYear"
            name={String(currentYear - 1)}
            fill="#3b82f6"
            fillOpacity={0.3}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="thisYear"
            name={String(currentYear)}
            fill="#3b82f6"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 4: Replace Volume by Month chart in DashboardClient**

In the performance tab, replace the Volume by Month `<Card>` (lines 269–283) with:

```tsx
import YoYVolumeChart from './charts/YoYVolumeChart'

<YoYVolumeChart data={props.yoyChartData} currentYear={new Date().getFullYear()} />
```

Add to interface:

```typescript
yoyChartData: Array<{ month: string; thisYear: number; lastYear: number }>
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/YoYVolumeChart.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add year-over-year volume comparison chart"
```

---

## Task 7: Commission Forecast Chart (Codex Workstream)

**Files:**
- Create: `src/components/dashboard/charts/CommissionForecast.tsx`
- Modify: `src/app/dashboard/page.tsx` (compute forecast data)
- Modify: `src/components/dashboard/DashboardClient.tsx` (replace Commission Trend chart)

- [ ] **Step 1: Compute forecast data in page.tsx**

After yoyChartData, add:

```typescript
// ── Commission forecast: actual + projected from pipeline closing dates ──
const forecastData = MONTH_ORDER.map((m, i) => {
  const actual = monthlyMap[m]?.commission ?? 0
  // Projected: sum commission from in-process loans with estimated_closing_date in this month
  let projected = 0
  for (const loan of activeLoans) {
    if (!isInStageGroup(loan.status, STAGE_GROUPS.IN_PROCESS)) continue
    const ecd = loan.estimated_closing_date
    if (!ecd) continue
    const cd = new Date(ecd)
    if (cd.getFullYear() !== thisYear) continue
    const loanMonth = cd.getMonth()
    if (loanMonth === i) {
      projected += loan.commission_amount ?? 0
    }
  }
  return { month: m, actual, projected }
})
```

- [ ] **Step 2: Pass forecastData to DashboardClient**

Add prop: `forecastData={forecastData}`

- [ ] **Step 3: Create CommissionForecast component**

Create `src/components/dashboard/charts/CommissionForecast.tsx`:

```tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { fmtK, fmtCurrency } from '@/lib/formatters'

interface ForecastPoint {
  month: string
  actual: number
  projected: number
}

interface CommissionForecastProps {
  data: ForecastPoint[]
}

interface TTProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}

const ChartTooltip = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-foreground/80 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="text-muted-foreground">
          {p.name}: <span className="text-foreground">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CommissionForecast({ data }: CommissionForecastProps) {
  const hasData = data.some(d => d.actual > 0 || d.projected > 0)

  if (!hasData) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
          Commission — Actual vs Projected
        </h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">
          No data yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Commission — Actual vs Projected
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => fmtK(v as number)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
          <Bar
            dataKey="actual"
            name="Actual"
            fill="#C9A84C"
            radius={[3, 3, 0, 0]}
            stackId="commission"
          />
          <Bar
            dataKey="projected"
            name="Projected"
            fill="#C9A84C"
            fillOpacity={0.3}
            radius={[3, 3, 0, 0]}
            stackId="commission"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 4: Replace Commission Trend chart in DashboardClient**

In the performance tab, replace the Commission Trend `<Card>` (lines 285–303) with:

```tsx
import CommissionForecast from './charts/CommissionForecast'

<CommissionForecast data={props.forecastData} />
```

Add to interface:

```typescript
forecastData: Array<{ month: string; actual: number; projected: number }>
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/CommissionForecast.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add commission forecast chart with actual vs projected"
```

---

## Task 8: Average Days-to-Close Gauge (Codex Workstream)

**Files:**
- Create: `src/components/dashboard/charts/DaysToCloseGauge.tsx`
- Modify: `src/app/dashboard/page.tsx` (compute avg days-to-close by loan type)
- Modify: `src/components/dashboard/DashboardClient.tsx` (render gauge)

- [ ] **Step 1: Compute days-to-close data in page.tsx**

After forecastData, add:

```typescript
// ── Avg days-to-close by loan type (YTD funded loans) ────────────────────
const dtcMap = new Map<string, { totalDays: number; count: number }>()
for (const loan of loans ?? []) {
  const rawStatus = (loan.status ?? '').toLowerCase()
  if (!(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
  const closingDate = loan.closing_date || loan.funding_date
  if (!closingDate || !loan.created_at) continue
  const cd = new Date(closingDate)
  if (cd.getFullYear() !== thisYear) continue
  const created = new Date(loan.created_at)
  const days = Math.floor((cd.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0 || days > 365) continue // sanity check
  const loanType = loan.loan_type ?? 'Other'
  const entry = dtcMap.get(loanType) ?? { totalDays: 0, count: 0 }
  entry.totalDays += days
  entry.count++
  dtcMap.set(loanType, entry)
}

const daysToCloseData = [...dtcMap.entries()]
  .map(([type, data]) => ({
    type,
    avgDays: Math.round(data.totalDays / data.count),
    count: data.count,
  }))
  .sort((a, b) => b.count - a.count)
```

- [ ] **Step 2: Pass daysToCloseData to DashboardClient**

Add prop: `daysToCloseData={daysToCloseData}`

- [ ] **Step 3: Create DaysToCloseGauge component**

Create `src/components/dashboard/charts/DaysToCloseGauge.tsx`:

```tsx
'use client'

import { Card } from '@/components/ui/card'

interface DtcEntry {
  type: string
  avgDays: number
  count: number
}

interface DaysToCloseGaugeProps {
  data: DtcEntry[]
}

function gaugeColor(days: number): string {
  if (days <= 25) return '#22c55e'  // green — fast
  if (days <= 35) return '#C9A84C'  // gold — normal
  if (days <= 45) return '#f97316'  // orange — slow
  return '#ef4444'                   // red — very slow
}

export default function DaysToCloseGauge({ data }: DaysToCloseGaugeProps) {
  if (data.length === 0) return null
  const maxDays = Math.max(...data.map(d => d.avgDays), 45)

  // Overall average
  const totalDays = data.reduce((sum, d) => sum + d.avgDays * d.count, 0)
  const totalCount = data.reduce((sum, d) => sum + d.count, 0)
  const overallAvg = totalCount > 0 ? Math.round(totalDays / totalCount) : 0

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Avg Days to Close
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-mono font-bold" style={{ color: gaugeColor(overallAvg) }}>
            {overallAvg}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">days avg</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map(entry => {
          const color = gaugeColor(entry.avgDays)
          const pct = (entry.avgDays / maxDays) * 100
          return (
            <div key={entry.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-foreground">{entry.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.count} loans</span>
                  <span className="text-xs font-mono font-medium" style={{ color }}>
                    {entry.avgDays}d
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Add DaysToCloseGauge to DashboardClient performance tab**

Add to interface:

```typescript
daysToCloseData: Array<{ type: string; avgDays: number; count: number }>
```

Insert after the Active Pipeline by Stage chart, before the Monthly breakdown table:

```tsx
import DaysToCloseGauge from './charts/DaysToCloseGauge'

{/* ── Days to Close Gauge ── */}
<DaysToCloseGauge data={props.daysToCloseData} />
```

- [ ] **Step 5: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/components/dashboard/charts/DaysToCloseGauge.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add average days-to-close gauge by loan type"
```

---

## Task 9: Parallelize Server Queries (Codex Workstream)

**Files:**
- Modify: `src/app/dashboard/page.tsx` (restructure queries)

- [ ] **Step 1: Wrap independent queries in Promise.all**

In `page.tsx`, the org_settings and loans queries must run first (loans feeds everything else). But after loans completes, the activity_log, contacts, and contact_activity queries can be parallelized.

Restructure the query section. Replace the sequential queries (starting at line 131) with:

```typescript
// Run independent queries in parallel
const [activityResult, hotLeadResult] = await Promise.all([
  // Activity log query
  activeLoanIds.length > 0
    ? supabase
        .from('activity_log')
        .select('loan_id, occurred_at, action')
        .in('loan_id', activeLoanIds)
        .not('loan_id', 'is', null)
        .not('action', 'ilike', 'arive.%')
        .not('action', 'ilike', '%.webhook%')
        .not('action', 'ilike', 'error_%')
        .order('occurred_at', { ascending: false })
        .limit(500)
    : Promise.resolve({ data: [] as Array<{ loan_id: string; occurred_at: string; action: string }> }),
  // Hot leads query
  (supabase.from('contacts') as any)
    .select('id, first_name, last_name, email, phone, referred_by, created_at')
    .eq('organization_id', organizationId)
    .eq('stage', 'Lead')
    .neq('hot_lead_dismissed', true)
    .not('contact_type', 'in', '("realtor","agent","lender","title")')
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: false }),
])

const activityRows = activityResult.data ?? []
const webLeadContacts = hotLeadResult.data ?? []
```

Then continue with the existing logic that processes these results.

- [ ] **Step 2: Build and commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
git add src/app/dashboard/page.tsx
git commit -m "perf(dashboard): parallelize independent Supabase queries with Promise.all"
```

---

## Appendix: Updated DashboardClientProps Interface

After all tasks, the full interface should be:

```typescript
interface DashboardClientProps {
  totalActive: number; totalActiveVolume: number; totalActiveCommission: number
  pipelineCount?: number; pipelineVolume?: number; pipelineCommission?: number
  commissionThisMonth: number; commissionYTD: number; projectedCommission: number
  fundedThisMonth: number; fundedYTD: number
  volumeThisMonth: number; volumeYTD: number
  stageData: StageData[]
  urgentFlags: UrgentFlag[]; staleLoans: StaleLoan[]
  chartData: ChartPoint[]
  scoredLoans: ScoredLoan[]
  hotLeads: HotLead[]
  showSetupBanner?: boolean
  // New props — Tier 1 + Tier 2
  sparklineMonths: Array<{ month: string; commission: number; volume: number; funded: number }>
  funnelData: Array<{ stage: string; count: number }>
  referralData: Array<{ source: string; loans: number; volume: number; funded: number }>
  rateLockLoans: Array<{ id: string; name: string; daysRemaining: number; totalDays: number; expirationDate: string }>
  yoyChartData: Array<{ month: string; thisYear: number; lastYear: number }>
  forecastData: Array<{ month: string; actual: number; projected: number }>
  daysToCloseData: Array<{ type: string; avgDays: number; count: number }>
}
```

## Appendix: Updated Loans Query Select

The loans query on line 33 of `page.tsx` must include these additional fields:

```
referral_source, rate_lock_date, rate_lock_days
```
