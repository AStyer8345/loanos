# Marketing Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/dashboard/marketing` as a 3-tab command center (SEND / CALLS / HISTORY) wired directly to the live Netlify backend functions on styermortgage.com.

**Architecture:** LoanOS acts as a UI proxy layer — it collects inputs, calls two Netlify functions (`generate-rate-update`, `generate-newsletter`) for all AI generation and email sending, then surfaces results in-page. All state persists in a single `mcc_state` JSON blob in Supabase (existing table, no schema changes). The monolithic 2440-line `page.tsx` is decomposed into focused co-located components.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (client-side via `@/lib/supabase/client`), Vitest (already configured), IBM Plex Mono font, gold accent `#C9A84C`

**Spec:** `docs/superpowers/specs/2026-03-19-marketing-tab-redesign.md`

---

## Chunk 1: Cleanup + Foundation

### Task 1: Delete dead code

**Files:**
- Delete: `src/app/dashboard/marketing/content/page.tsx`
- Delete: `src/app/dashboard/marketing/social/page.tsx`
- Delete: `src/app/dashboard/marketing/rate-updates/page.tsx`
- Delete: `src/app/api/marketing/generate-newsletter/route.ts`
- Delete: `src/app/api/marketing/publish-newsletter/route.ts`
- Delete: `src/app/api/marketing/run-testimonials/route.ts`
- Delete: `src/app/api/marketing/send-mailchimp/route.ts`
- Delete: `src/app/api/marketing/log-social-post/route.ts`

- [ ] **Step 1: Delete sub-pages**

```bash
rm src/app/dashboard/marketing/content/page.tsx
rm src/app/dashboard/marketing/social/page.tsx
rm src/app/dashboard/marketing/rate-updates/page.tsx
```

- [ ] **Step 2: Delete dead API routes**

```bash
rm src/app/api/marketing/generate-newsletter/route.ts
rm src/app/api/marketing/publish-newsletter/route.ts
rm src/app/api/marketing/run-testimonials/route.ts
rm src/app/api/marketing/send-mailchimp/route.ts
rm src/app/api/marketing/log-social-post/route.ts
```

- [ ] **Step 3: Remove empty directories if applicable**

```bash
rmdir src/app/dashboard/marketing/content 2>/dev/null || true
rmdir src/app/dashboard/marketing/social 2>/dev/null || true
rmdir src/app/dashboard/marketing/rate-updates 2>/dev/null || true
# API dirs — only remove if now empty
rmdir src/app/api/marketing 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete dead marketing API routes and sub-pages"
```

---

### Task 2: Replace schedule.ts TRACKERS

**Files:**
- Modify: `src/lib/marketing/schedule.ts` — full rewrite (delete DAYS, TCOLS, DayTask, DayDef; replace TRACKERS)

- [ ] **Step 1: Overwrite schedule.ts with only the 6-entry TRACKERS constant**

Replace the full contents of `src/lib/marketing/schedule.ts` with:

```typescript
// Marketing cadence tracker definitions
// Imported by SendTab (cadence badges) and HistoryTab (health strip)

export type Tracker = {
  key:   string
  label: string
  freq:  number  // days
}

export const TRACKERS: readonly Tracker[] = [
  { key: 'rate-update',   label: 'Rate Update',          freq: 7 },
  { key: 'realtor-nl',    label: 'Newsletter (Realtor)',  freq: 7 },
  { key: 'borrower-nl',   label: 'Newsletter (Borrower)', freq: 7 },
  { key: 'realtor-calls', label: 'Realtor Calls',         freq: 7 },
  { key: 'preapproval',   label: 'Pre-Approval Calls',    freq: 7 },
  { key: 'social-post',   label: 'Social Posts',          freq: 2 },
] as const
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules | head -30
```

Expected: zero errors referencing `schedule.ts` or its removed exports. (The old `page.tsx` imports `DAYS` and `TCOLS` — it will show errors until page.tsx is rewritten in Task 7. That is expected at this stage.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/marketing/schedule.ts
git commit -m "refactor: replace schedule.ts with minimal TRACKERS constant"
```

---

### Task 3: Create types and utility functions with tests

**Files:**
- Create: `src/lib/marketing/types.ts`
- Create: `src/lib/marketing/utils.ts`
- Create: `src/lib/marketing/utils.test.ts`

- [ ] **Step 1: Create `src/lib/marketing/types.ts`**

```typescript
// All shared types for the marketing tab

export type MCCContact = {
  id:          string
  first:       string
  last:        string
  company:     string
  phone:       string
  email:       string
  lastTouch:   string | null   // YYYY-MM-DD date string, or null
  note:        string
  callHistory: { date: string; note: string }[]
  // NOTE: calledToday is NOT stored — computed at render by comparing lastTouch to today's date string
}

export type LogEntry = {
  id:       string   // crypto.randomUUID()
  date:     string   // ISO timestamp — new Date().toISOString()
  activity: string   // human-readable label
  channel:  string   // 'Email' | 'Phone Call' | 'LinkedIn' | 'Facebook' | 'Rate Update' | 'Task' | 'Other'
  notes:    string   // empty string if none
}

export type MCCState = {
  tasks:       Record<string, Record<string, boolean>>
  log:         LogEntry[]
  last:        Record<string, string>   // tracker key → ISO timestamp
  contacts:    {
    realtors:     MCCContact[]
    preapprovals: MCCContact[]
    inprocess:    MCCContact[]
    hotleads:     MCCContact[]
  }
  socialPosts: unknown[]
  newsletters: unknown[]
  todos:       unknown[]
  doneTodos:   unknown[]
}

export const BLANK_STATE: MCCState = {
  tasks:       {},
  log:         [],
  last:        {},
  contacts:    { realtors: [], preapprovals: [], inprocess: [], hotleads: [] },
  socialPosts: [],
  newsletters: [],
  todos:       [],
  doneTodos:   [],
}

// APR offset per product (in percentage points)
// FHA MIP and VA funding fee increase effective APR significantly
export const APR_OFFSETS: Record<string, number> = {
  '30-Yr Fixed':  0.07,
  '15-Yr Fixed':  0.10,
  '30-Yr Jumbo':  0.06,
  'VA 30-Yr':     0.18,
  'FHA 30-Yr':    0.58,
  'FHA 5-Yr ARM': 0.12,
}

// Rate table row — one per product in the Rate Update form
export type RateRow = {
  product: string
  rate:    string   // e.g. "6.875" — raw number, not formatted
  apr:     string   // e.g. "6.95" — auto-filled or manually overridden
}

export const DEFAULT_RATE_ROWS: RateRow[] = [
  { product: '30-Yr Fixed',  rate: '', apr: '' },
  { product: '15-Yr Fixed',  rate: '', apr: '' },
  { product: '30-Yr Jumbo',  rate: '', apr: '' },
  { product: 'VA 30-Yr',     rate: '', apr: '' },
  { product: 'FHA 30-Yr',    rate: '', apr: '' },
  { product: 'FHA 5-Yr ARM', rate: '', apr: '' },
]

// Channel values for LogEntry and manual log entry form
export const LOG_CHANNELS = [
  'Email',
  'Phone Call',
  'LinkedIn',
  'Facebook',
  'Rate Update',
  'Task',
  'Other',
] as const

export type LogChannel = typeof LOG_CHANNELS[number]
```

- [ ] **Step 2: Write failing tests for utility functions**

Create `src/lib/marketing/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  aprForProduct,
  cadenceColor,
  channelToType,
  buildRatesString,
  currentWeekBoundaries,
  formatDaysAgo,
} from './utils'

describe('aprForProduct', () => {
  it('adds 0.07 offset for 30-Yr Fixed', () => {
    expect(aprForProduct('30-Yr Fixed', 6.875)).toBeCloseTo(6.945, 3)
  })
  it('adds 0.58 offset for FHA 30-Yr', () => {
    expect(aprForProduct('FHA 30-Yr', 6.375)).toBeCloseTo(6.955, 3)
  })
  it('adds 0.18 offset for VA 30-Yr', () => {
    expect(aprForProduct('VA 30-Yr', 6.25)).toBeCloseTo(6.43, 3)
  })
  it('returns rate unchanged for unknown product', () => {
    expect(aprForProduct('Unknown Product', 7.0)).toBe(7.0)
  })
})

describe('cadenceColor', () => {
  const now = new Date().toISOString()
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

  it('returns green when within freq', () => {
    expect(cadenceColor(daysAgo(5), 7)).toBe('green')
  })
  it('returns green on the freq boundary', () => {
    expect(cadenceColor(daysAgo(7), 7)).toBe('green')
  })
  it('returns gold when between freq and freq*1.5', () => {
    expect(cadenceColor(daysAgo(9), 7)).toBe('gold')   // 9 <= 10.5
  })
  it('returns red when over freq*1.5', () => {
    expect(cadenceColor(daysAgo(12), 7)).toBe('red')   // 12 > 10.5
  })
  it('returns red when null (never sent)', () => {
    expect(cadenceColor(null, 7)).toBe('red')
  })
  it('returns green for social-post within 2 days', () => {
    expect(cadenceColor(daysAgo(1), 2)).toBe('green')
  })
  it('returns red for social-post at 4 days (> 2*1.5=3)', () => {
    expect(cadenceColor(daysAgo(4), 2)).toBe('red')
  })
})

describe('channelToType', () => {
  it('maps Rate Update → Rate Update', () => {
    expect(channelToType('Rate Update')).toBe('Rate Update')
  })
  it('maps Email → Newsletter', () => {
    expect(channelToType('Email')).toBe('Newsletter')
  })
  it('maps Phone Call → Call', () => {
    expect(channelToType('Phone Call')).toBe('Call')
  })
  it('maps LinkedIn → Social', () => {
    expect(channelToType('LinkedIn')).toBe('Social')
  })
  it('maps Facebook → Social', () => {
    expect(channelToType('Facebook')).toBe('Social')
  })
  it('maps Task → Task', () => {
    expect(channelToType('Task')).toBe('Task')
  })
  it('maps Other → Task', () => {
    expect(channelToType('Other')).toBe('Task')
  })
  it('maps unknown values → Task', () => {
    expect(channelToType('Carrier Pigeon')).toBe('Task')
  })
})

describe('buildRatesString', () => {
  it('formats a full row with APR', () => {
    const rows = [{ product: '30-Yr Fixed', rate: '6.875', apr: '6.95' }]
    expect(buildRatesString(rows)).toBe('30-Yr Fixed: 6.875% | APR: 6.95%')
  })
  it('omits APR portion when apr is blank', () => {
    const rows = [{ product: '30-Yr Jumbo', rate: '7.0', apr: '' }]
    expect(buildRatesString(rows)).toBe('30-Yr Jumbo: 7.0%')
  })
  it('skips rows with empty rate', () => {
    const rows = [
      { product: '30-Yr Fixed', rate: '6.875', apr: '6.95' },
      { product: '15-Yr Fixed', rate: '',      apr: '' },
    ]
    expect(buildRatesString(rows)).toBe('30-Yr Fixed: 6.875% | APR: 6.95%')
  })
  it('joins multiple rows with newline', () => {
    const rows = [
      { product: '30-Yr Fixed', rate: '6.875', apr: '6.95' },
      { product: 'VA 30-Yr',   rate: '6.25',  apr: '6.43' },
    ]
    expect(buildRatesString(rows)).toBe(
      '30-Yr Fixed: 6.875% | APR: 6.95%\nVA 30-Yr: 6.25% | APR: 6.43%'
    )
  })
})

describe('currentWeekBoundaries', () => {
  it('returns a Monday as start', () => {
    const { start } = currentWeekBoundaries()
    expect(start.getDay()).toBe(1)   // 1 = Monday
  })
  it('returns a Sunday as end', () => {
    const { end } = currentWeekBoundaries()
    expect(end.getDay()).toBe(0)     // 0 = Sunday
  })
  it('start is before end', () => {
    const { start, end } = currentWeekBoundaries()
    expect(start.getTime()).toBeLessThan(end.getTime())
  })
  it('gap between start and end is 6 days', () => {
    const { start, end } = currentWeekBoundaries()
    const diffDays = (end.getTime() - start.getTime()) / 86400000
    expect(diffDays).toBeCloseTo(6.999, 0)
  })
})

describe('formatDaysAgo', () => {
  it('returns "Today" for current timestamp', () => {
    expect(formatDaysAgo(new Date().toISOString())).toBe('Today')
  })
  it('returns "Never" for null', () => {
    expect(formatDaysAgo(null)).toBe('Never')
  })
  it('returns "3d ago" for 3 days ago', () => {
    const ts = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(formatDaysAgo(ts)).toBe('3d ago')
  })
})
```

- [ ] **Step 3: Run tests — expect all to fail**

```bash
npm test -- src/lib/marketing/utils.test.ts 2>&1 | tail -20
```

Expected: all tests fail with "Cannot find module './utils'" or similar.

- [ ] **Step 4: Create `src/lib/marketing/utils.ts`**

```typescript
import { APR_OFFSETS, type RateRow } from './types'

// ── APR Auto-Calculation ────────────────────────────────────────────────────

/**
 * Computes estimated APR for a given product and rate.
 * Uses product-specific offsets (FHA MIP, VA funding fee, etc.)
 * Result is rounded to 3 decimal places.
 */
export function aprForProduct(product: string, rate: number): number {
  const offset = APR_OFFSETS[product] ?? 0
  return Math.round((rate + offset) * 1000) / 1000
}

// ── Cadence Badge Color ─────────────────────────────────────────────────────

/**
 * Returns color for a cadence health badge.
 * green  = within target frequency
 * gold   = within 1.5× frequency (overdue but not critical)
 * red    = more than 1.5× frequency, or never sent (null)
 */
export function cadenceColor(
  lastTimestamp: string | null,
  freqDays: number
): 'green' | 'gold' | 'red' {
  if (!lastTimestamp) return 'red'
  // Math.floor makes boundary comparisons deterministic (avoids fractional-ms flake in tests)
  const daysSince = Math.floor((Date.now() - new Date(lastTimestamp).getTime()) / 86400000)
  if (daysSince <= freqDays) return 'green'
  if (daysSince <= freqDays * 1.5) return 'gold'
  return 'red'
}

// ── Channel → Type Badge Mapping ────────────────────────────────────────────

const CHANNEL_TO_TYPE: Record<string, string> = {
  'Rate Update': 'Rate Update',
  'Email':       'Newsletter',
  'Phone Call':  'Call',
  'LinkedIn':    'Social',
  'Facebook':    'Social',
  'Task':        'Task',
  'Other':       'Task',
}

/**
 * Derives the display TYPE badge label from a stored LogEntry channel value.
 * TYPE is never stored — always computed at render time.
 */
export function channelToType(channel: string): string {
  return CHANNEL_TO_TYPE[channel] ?? 'Task'
}

// ── Rates String Builder ─────────────────────────────────────────────────────

/**
 * Formats the rates table rows into the string expected by the Netlify function.
 * Rows with empty `rate` are skipped. APR portion is omitted if `apr` is blank.
 * Example output: "30-Year Fixed: 6.875% | APR: 6.95%\n15-Year Fixed: 6.25% | APR: 6.35%"
 */
export function buildRatesString(rows: RateRow[]): string {
  return rows
    .filter(r => r.rate.trim() !== '')
    .map(r => {
      const base = `${r.product}: ${r.rate}%`
      return r.apr.trim() ? `${base} | APR: ${r.apr}%` : base
    })
    .join('\n')
}

// ── Week Boundaries ─────────────────────────────────────────────────────────

/**
 * Returns Monday 00:00:00 and Sunday 23:59:59 of the current ISO week in local time.
 * Offset 0 = this week, -1 = last week, etc.
 */
export function currentWeekBoundaries(weekOffset = 0): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay()               // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day   // back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

/**
 * Formats an ISO timestamp as a human-readable "days ago" string.
 * Returns "Today", "Never" (for null), or "Nd ago".
 */
export function formatDaysAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never'
  const daysSince = Math.floor((Date.now() - new Date(timestamp).getTime()) / 86400000)
  if (daysSince === 0) return 'Today'
  return `${daysSince}d ago`
}

/**
 * Formats a week range as a label: "Mar 17 – Mar 23, 2026"
 */
export function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const startStr = start.toLocaleDateString('en-US', opts)
  const endStr   = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${startStr} – ${endStr}`
}

/**
 * Returns today's date as YYYY-MM-DD in local time.
 * Used to compute calledToday by comparing to MCCContact.lastTouch.
 */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
npm test -- src/lib/marketing/utils.test.ts 2>&1 | tail -20
```

Expected: all tests pass (green).

- [ ] **Step 6: Commit**

```bash
git add src/lib/marketing/types.ts src/lib/marketing/utils.ts src/lib/marketing/utils.test.ts
git commit -m "feat: add marketing types, utility functions, and unit tests"
```

---

### Task 4: Create shared UI atoms

**Files:**
- Create: `src/app/dashboard/marketing/_components/shared.tsx`

The gold color `#C9A84C` is not in the Tailwind default palette — use inline `style` props for it. All other colors use standard Tailwind zinc classes.

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/shared.tsx`**

```tsx
'use client'

import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cadenceColor, formatDaysAgo } from '@/lib/marketing/utils'

const GOLD = '#C9A84C'
const GREEN = '#4CAF82'
const RED = '#E05252'

// ── Card ───────────────────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-700 rounded-sm p-4 ${className}`}>
      {children}
    </div>
  )
}

// ── Section Label ──────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-xs tracking-widest mb-3"
      style={{ color: GOLD, fontWeight: 800, letterSpacing: '0.2em' }}
    >
      {children}
    </div>
  )
}

// ── Field Label ────────────────────────────────────────────────────────────

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-zinc-100 mb-1"
      style={{ fontSize: 11, fontWeight: 700 }}
    >
      {children}
    </label>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 ${className}`}
      style={{ fontFamily: 'inherit', ...props.style }}
    />
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-2 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none ${className}`}
      style={{ fontFamily: 'inherit', lineHeight: 1.6, ...props.style }}
    />
  )
}

// ── Button (primary) ───────────────────────────────────────────────────────

export function Btn({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
}) {
  const sizeClass = { xs: 'px-2 py-0.5 text-xs', sm: 'px-3 py-1 text-xs', md: 'px-4 py-2 text-sm' }[size]
  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: GOLD, color: '#09090b', fontWeight: 700, border: `1px solid ${GOLD}` } :
    variant === 'secondary' ? { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, fontWeight: 700 } :
    variant === 'ghost'     ? { background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', fontWeight: 600 } :
                              { background: 'transparent', color: RED, border: `1px solid ${RED}`, fontWeight: 700 }
  return (
    <button
      {...props}
      className={`rounded-sm font-mono transition-opacity disabled:opacity-40 ${sizeClass} ${className}`}
      style={{ fontFamily: 'inherit', ...variantStyle, ...props.style }}
    >
      {children}
    </button>
  )
}

// ── Cadence Badge ──────────────────────────────────────────────────────────

type CadenceBadgeProps = {
  label:         string
  lastTimestamp: string | null
  freqDays:      number
  showDaysAgo?:  boolean   // true in HISTORY health strip, false in SEND tab
}

export function CadenceBadge({ label, lastTimestamp, freqDays, showDaysAgo = false }: CadenceBadgeProps) {
  const color = cadenceColor(lastTimestamp, freqDays)
  const dotColor = color === 'green' ? GREEN : color === 'gold' ? GOLD : RED
  const daysLabel = formatDaysAgo(lastTimestamp)
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 border rounded-sm"
      style={{ borderColor: dotColor, fontSize: 10 }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
      <span className="text-zinc-300 font-bold tracking-wide">{label}</span>
      {showDaysAgo && (
        <span style={{ color: dotColor }}>{daysLabel}</span>
      )}
    </div>
  )
}

// ── Status Banner ──────────────────────────────────────────────────────────

export function Banner({ type, children }: { type: 'success' | 'error'; children: ReactNode }) {
  const color = type === 'success' ? GREEN : RED
  return (
    <div
      className="px-3 py-2 rounded-sm text-xs font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}`, color }}
    >
      {children}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <span
      className="inline-block border-2 border-zinc-700 rounded-full animate-spin"
      style={{ width: 14, height: 14, borderTopColor: GOLD }}
    />
  )
}

// ── Type Badge (HISTORY log table) ─────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  'Rate Update': GOLD,
  'Newsletter':  '#5B8FD4',
  'Call':        GREEN,
  'Social':      '#9B72CF',
  'Task':        '#71717a',
}

export function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? '#71717a'
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded-sm text-xs font-bold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {type}
    </span>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep '_components/shared' | head -10
```

Expected: no errors from `shared.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/marketing/_components/shared.tsx
git commit -m "feat: add marketing shared UI atoms (Card, Btn, Input, CadenceBadge, etc.)"
```

---

### Task 5: Create Supabase data hook

**Files:**
- Create: `src/app/dashboard/marketing/_components/useMCCState.ts`

This hook follows the same pattern as the existing `page.tsx` — `createClient()` from `@/lib/supabase/client`, reads the `mcc_state` table, upserts on save. No schema changes.

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/useMCCState.ts`**

```typescript
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type MCCState, BLANK_STATE } from '@/lib/marketing/types'

export type UseMCCStateReturn = {
  state:    MCCState | null
  loading:  boolean
  error:    string | null
  saveState: (next: MCCState) => Promise<void>
}

/**
 * Reads and writes the mcc_state JSON blob in Supabase.
 * Table schema: id (uuid), user_id (uuid FK auth.users), state (jsonb), updated_at (timestamptz)
 * Read:  SELECT state FROM mcc_state WHERE user_id = auth.uid() LIMIT 1
 * Write: Upsert on (user_id) conflict — sets state + updated_at
 *
 * First-time user: if no record exists, state is null until first save.
 * First save writes BLANK_STATE merged with the new changes.
 */
export function useMCCState(): UseMCCStateReturn {
  const supabase = useMemo(() => createClient(), [])
  const [state, setState] = useState<MCCState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error: dbErr } = await supabase
          .from('mcc_state')
          .select('state')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (cancelled) return

        if (dbErr && dbErr.code !== 'PGRST116') {
          // PGRST116 = no rows found — that's fine (first-time user)
          setError(dbErr.message)
        } else if (data?.state) {
          setState(data.state as MCCState)
        }
        // else: first-time user — state stays null
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [supabase])

  const saveState = useCallback(async (next: MCCState) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error: upsertErr } = await supabase
      .from('mcc_state')
      .upsert(
        { user_id: user.id, state: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (upsertErr) throw new Error(upsertErr.message)
    setState(next)
  }, [supabase])

  return { state, loading, error, saveState }
}

/**
 * Returns the current state merged with BLANK_STATE for safe reads.
 * Use this instead of `state` directly so null fields don't cause crashes.
 */
export function mergedState(state: MCCState | null): MCCState {
  if (!state) return BLANK_STATE
  return {
    ...BLANK_STATE,
    ...state,
    contacts: { ...BLANK_STATE.contacts, ...state.contacts },
    last:     { ...state.last },
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep 'useMCCState' | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/marketing/_components/useMCCState.ts
git commit -m "feat: add useMCCState hook (Supabase read/write for mcc_state)"
```

---

## Chunk 2: SEND Tab

### Task 6: Rate Update Form

**Files:**
- Create: `src/app/dashboard/marketing/_components/RateUpdateForm.tsx`

This component:
1. Renders the 6-row rates table with APR auto-calc
2. Calls `POST https://styermortgage.com/.netlify/functions/generate-rate-update`
3. Shows an inline preview panel (below the form) on success
4. Publishes on confirm, auto-logs to HISTORY, updates `mcc_state.last['rate-update']`

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/RateUpdateForm.tsx`**

```tsx
'use client'

import { useState, useCallback } from 'react'
import { Card, SectionLabel, FieldLabel, Input, Textarea, Btn, Banner, Spinner, CadenceBadge } from './shared'
import { aprForProduct, buildRatesString } from '@/lib/marketing/utils'
import { DEFAULT_RATE_ROWS, type RateRow, type MCCState, type LogEntry } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'

const NETLIFY_URL = 'https://styermortgage.com/.netlify/functions/generate-rate-update'
const GOLD = '#C9A84C'

type RatePreview = {
  pageTitle:         string
  pageUrl:           string
  borrowerSubject:   string
  borrowerPreheader: string
  realtorSubject:    string
  realtorPreheader:  string
}

type Props = {
  mccState:  MCCState
  onSave:    (next: MCCState) => Promise<void>
}

export default function RateUpdateForm({ mccState, onSave }: Props) {
  const [rows, setRows]           = useState<RateRow[]>(DEFAULT_RATE_ROWS.map(r => ({ ...r })))
  const [audiences, setAudiences] = useState<string[]>(['borrower', 'realtor'])
  const [direction, setDirection] = useState('')
  const [depth, setDepth]         = useState('standard')
  const [blurb, setBlurb]         = useState('')
  const [notes, setNotes]         = useState('')

  const [preview, setPreview]         = useState<RatePreview | null>(null)
  const [status, setStatus]           = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')

  const rateTracker = TRACKERS.find(t => t.key === 'rate-update')!

  // ── APR auto-calc ──────────────────────────────────────────────────────────
  const handleRateChange = useCallback((idx: number, val: string) => {
    setRows(prev => {
      const next = [...prev]
      const num = parseFloat(val)
      const apr = !isNaN(num)
        ? String(Math.round(aprForProduct(next[idx].product, num) * 1000) / 1000)
        : ''
      next[idx] = { ...next[idx], rate: val, apr }
      return next
    })
  }, [])

  const handleAprChange = useCallback((idx: number, val: string) => {
    setRows(prev => { const n = [...prev]; n[idx] = { ...n[idx], apr: val }; return n })
  }, [])

  const toggleAudience = (a: string) =>
    setAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  // ── Build payload ──────────────────────────────────────────────────────────
  const buildPayload = (mode: string, extraScheduleTime?: string) => ({
    rates:     buildRatesString(rows),
    direction,
    blurb,
    notes,
    depth,
    audiences,
    mode,
    ...(extraScheduleTime ? { scheduleTime: extraScheduleTime } : {}),
  })

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setStatus('loading')
    setErrorMsg('')
    setPreview(null)
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('preview')),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPreview(data.preview)
      setStatus('done')
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublish = async (scheduledTime?: string) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('live', scheduledTime)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()

      // ── auto-log to HISTORY ────────────────────────────────────────────────
      const rate30yr = rows.find(r => r.product === '30-Yr Fixed')?.rate ?? ''
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date().toISOString(),
        activity: `Rate Update sent${rate30yr ? ` — 30yr ${rate30yr}%` : ''}`,
        channel:  'Rate Update',
        notes:    scheduledTime ? `${blurb} (email scheduled for ${scheduledTime})` : blurb,
      }

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, 'rate-update': new Date().toISOString() },
      }
      await onSave(nextState)

      setPreview({
        ...preview!,
        pageUrl: data.pageUrl ?? preview?.pageUrl ?? '',
        pageTitle: scheduledTime
          ? `Published — Email scheduled for ${scheduledTime}`
          : `Published at ${data.pageUrl}`,
      })
      setStatus('done')
      setShowSchedule(false)
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  const handleSchedule = () => {
    if (!scheduleTime) return
    const selected = new Date(scheduleTime)
    const minTime = new Date(Date.now() + 15 * 60 * 1000)
    if (selected < minTime) {
      setErrorMsg('Scheduled time must be at least 15 minutes in the future.')
      return
    }
    handlePublish(selected.toISOString())
  }

  const isLoading = status === 'loading'

  return (
    <div className="space-y-4">
      {/* Cadence badge */}
      <div>
        <CadenceBadge
          label={rateTracker.label}
          lastTimestamp={mccState.last['rate-update'] ?? null}
          freqDays={rateTracker.freq}
        />
      </div>

      {/* Rates table */}
      <Card>
        <SectionLabel>CURRENT RATES</SectionLabel>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-zinc-500 pb-1 border-b border-zinc-800" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
            <span>PRODUCT</span>
            <span>RATE</span>
            <span>APR <span className="text-zinc-600">(auto)</span></span>
          </div>
          {rows.map((row, i) => (
            <div key={row.product} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-zinc-400" style={{ fontSize: 11 }}>{row.product}</span>
              <Input
                placeholder="6.875"
                value={row.rate}
                onChange={e => handleRateChange(i, e.target.value)}
                style={{ color: GOLD, fontWeight: 700 }}
              />
              <Input
                placeholder="auto"
                value={row.apr}
                onChange={e => handleAprChange(i, e.target.value)}
                style={{ borderStyle: row.apr && !rows[i].rate ? 'solid' : row.apr ? 'dashed' : 'solid', opacity: 0.85 }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Context fields */}
      <Card>
        <SectionLabel>CONTEXT</SectionLabel>
        <div className="space-y-3">
          {/* Audience */}
          <div>
            <FieldLabel>AUDIENCE</FieldLabel>
            <div className="flex gap-2">
              {['borrower', 'realtor'].map(a => (
                <button
                  key={a}
                  onClick={() => toggleAudience(a)}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-all"
                  style={{
                    border: `1px solid ${audiences.includes(a) ? GOLD : '#3f3f46'}`,
                    color: audiences.includes(a) ? GOLD : '#71717a',
                    background: audiences.includes(a) ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {a === 'borrower' ? 'Borrowers' : 'Realtors'}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Direction */}
          <div>
            <FieldLabel htmlFor="direction">RATE DIRECTION</FieldLabel>
            <select
              id="direction"
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-1.5 focus:outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">Select direction...</option>
              <option value="Rates dropped">Rates dropped</option>
              <option value="Rates went up">Rates went up</option>
              <option value="Rates flat">Rates flat</option>
              <option value="Rates volatile">Rates volatile</option>
            </select>
          </div>

          {/* Content Depth */}
          <div>
            <FieldLabel htmlFor="depth">CONTENT DEPTH</FieldLabel>
            <select
              id="depth"
              value={depth}
              onChange={e => setDepth(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-1.5 focus:outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="short">Short & Sweet</option>
              <option value="standard">Standard</option>
              <option value="in-depth">In-Depth</option>
            </select>
          </div>

          {/* Blurb */}
          <div>
            <FieldLabel htmlFor="blurb">BLURB / TALKING POINTS</FieldLabel>
            <Textarea
              id="blurb"
              rows={3}
              placeholder="Market commentary, talking points for AI..."
              value={blurb}
              onChange={e => setBlurb(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <FieldLabel htmlFor="ru-notes">ANYTHING ELSE</FieldLabel>
            <Textarea
              id="ru-notes"
              rows={2}
              placeholder="Optional..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Btn onClick={handlePreview} disabled={isLoading}>
          {isLoading ? <><Spinner /> Loading...</> : '👁 Preview'}
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => handlePublish()}
          disabled={isLoading}
        >
          ▶ Publish + Send Emails
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => setShowSchedule(!showSchedule)}
          disabled={!preview || isLoading}
        >
          📅 Schedule
        </Btn>
      </div>

      {/* Schedule picker */}
      {showSchedule && (
        <Card>
          <SectionLabel>SCHEDULE EMAIL SEND</SectionLabel>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FieldLabel htmlFor="schedule-time">DATE + TIME (local)</FieldLabel>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
              />
            </div>
            <Btn onClick={handleSchedule} disabled={isLoading}>Confirm</Btn>
          </div>
          <p className="text-zinc-500 mt-2" style={{ fontSize: 9 }}>
            Must be at least 15 minutes in the future. Page publishes immediately; email sends at scheduled time.
          </p>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && <Banner type="error">{errorMsg}</Banner>}

      {/* Preview panel */}
      {preview && (
        <Card>
          <SectionLabel>PREVIEW</SectionLabel>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-zinc-500">URL: </span>
              <a href={preview.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                {preview.pageUrl}
              </a>
            </div>
            {preview.borrowerSubject && (
              <div><span className="text-zinc-500">Borrower subject: </span><span className="text-zinc-200">{preview.borrowerSubject}</span></div>
            )}
            {preview.realtorSubject && (
              <div><span className="text-zinc-500">Realtor subject: </span><span className="text-zinc-200">{preview.realtorSubject}</span></div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep 'RateUpdateForm' | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/marketing/_components/RateUpdateForm.tsx
git commit -m "feat: add RateUpdateForm component with APR auto-calc and Netlify integration"
```

---

### Task 7: Newsletter Form

**Files:**
- Create: `src/app/dashboard/marketing/_components/NewsletterForm.tsx`

Two content modes (Structured Fields / Custom Prompt) share the same audience chips, preview, and publish flow.

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/NewsletterForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Card, SectionLabel, FieldLabel, Input, Textarea, Btn, Banner, Spinner, CadenceBadge } from './shared'
import { type MCCState, type LogEntry } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'

const NETLIFY_URL = 'https://styermortgage.com/.netlify/functions/generate-newsletter'
const GOLD = '#C9A84C'

type NLPreview = {
  pageTitle:         string
  pageUrl:           string
  borrowerSubject:   string
  borrowerPreheader: string
  borrowerEmailHtml: string
  realtorSubject:    string
  realtorPreheader:  string
  realtorEmailHtml:  string
  webContent:        string
  linkedinPost:      string
  facebookPost:      string
}

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

export default function NewsletterForm({ mccState, onSave }: Props) {
  const [mode, setMode]           = useState<'structured' | 'prompt'>('structured')
  const [audiences, setAudiences] = useState<string[]>(['borrower', 'realtor'])

  // Structured fields
  const [topic, setTopic]       = useState('')
  const [story, setStory]       = useState('')
  const [articles, setArticles] = useState('')
  const [aiTool, setAiTool]     = useState('')
  const [notes, setNotes]       = useState('')

  // Custom prompt
  const [customPrompt, setCustomPrompt] = useState('')

  const [preview, setPreview]         = useState<NLPreview | null>(null)
  const [status, setStatus]           = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')

  const realtorTracker  = TRACKERS.find(t => t.key === 'realtor-nl')!
  const borrowerTracker = TRACKERS.find(t => t.key === 'borrower-nl')!

  const toggleAudience = (a: string) =>
    setAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const buildPayload = (nlMode: string, extraScheduleTime?: string) => {
    const base = {
      audiences,
      mode: nlMode,
      ...(extraScheduleTime ? { scheduleTime: extraScheduleTime } : {}),
    }
    if (mode === 'structured') {
      return { ...base, topic, story, articles, aiTool, notes }
    }
    return { ...base, customPrompt }
  }

  const handlePreview = async () => {
    setStatus('loading')
    setErrorMsg('')
    setPreview(null)
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('preview')),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPreview(data.preview)
      setStatus('done')
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  const handlePublish = async (scheduledTime?: string) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('live', scheduledTime)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()

      // Build audience label for log entry notes
      const audienceLabel = audiences.length === 2
        ? 'Borrowers + Realtors'
        : audiences[0] === 'borrower' ? 'Borrowers' : 'Realtors'

      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date().toISOString(),
        activity: `Newsletter sent — ${preview?.borrowerSubject || preview?.realtorSubject || topic}`,
        channel:  'Email',
        notes:    scheduledTime
          ? `${audienceLabel} · Mailchimp (email scheduled for ${scheduledTime})`
          : `${audienceLabel} · Mailchimp`,
      }

      // Update last timestamps for selected audiences
      const now = new Date().toISOString()
      const lastUpdates: Record<string, string> = {}
      if (audiences.includes('realtor'))  lastUpdates['realtor-nl']  = now
      if (audiences.includes('borrower')) lastUpdates['borrower-nl'] = now

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, ...lastUpdates },
      }
      await onSave(nextState)

      setPreview(prev => prev ? { ...prev, pageUrl: data.pageUrl ?? prev.pageUrl } : prev)
      setStatus('done')
      setShowSchedule(false)
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  const handleSchedule = () => {
    if (!scheduleTime) return
    const selected = new Date(scheduleTime)
    const minTime = new Date(Date.now() + 15 * 60 * 1000)
    if (selected < minTime) {
      setErrorMsg('Scheduled time must be at least 15 minutes in the future.')
      return
    }
    handlePublish(selected.toISOString())
  }

  const isLoading = status === 'loading'

  return (
    <div className="space-y-4">
      {/* Cadence badges */}
      <div className="flex gap-2 flex-wrap">
        <CadenceBadge label={realtorTracker.label}  lastTimestamp={mccState.last['realtor-nl'] ?? null}  freqDays={realtorTracker.freq} />
        <CadenceBadge label={borrowerTracker.label} lastTimestamp={mccState.last['borrower-nl'] ?? null} freqDays={borrowerTracker.freq} />
      </div>

      {/* Audience + mode */}
      <Card>
        <div className="flex gap-4 items-start flex-wrap">
          {/* Audience chips */}
          <div>
            <FieldLabel>AUDIENCE</FieldLabel>
            <div className="flex gap-2 mt-1">
              {[
                { key: 'borrower', label: 'Borrowers / Past Clients' },
                { key: 'realtor',  label: 'Realtors / Partners' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleAudience(key)}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-all"
                  style={{
                    border: `1px solid ${audiences.includes(key) ? GOLD : '#3f3f46'}`,
                    color: audiences.includes(key) ? GOLD : '#71717a',
                    background: audiences.includes(key) ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content mode toggle */}
          <div>
            <FieldLabel>CONTENT MODE</FieldLabel>
            <div className="flex gap-0 mt-1 border border-zinc-700 rounded-sm overflow-hidden">
              {(['structured', 'prompt'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-3 py-1 text-xs font-bold transition-colors"
                  style={{
                    background: mode === m ? GOLD : 'transparent',
                    color: mode === m ? '#09090b' : '#71717a',
                  }}
                >
                  {m === 'structured' ? 'STRUCTURED FIELDS' : 'CUSTOM PROMPT'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Form fields */}
      <Card>
        {mode === 'structured' ? (
          <div className="space-y-3">
            <SectionLabel>STRUCTURED FIELDS</SectionLabel>
            <div>
              <FieldLabel htmlFor="nl-topic">THIS WEEK&apos;S TOPIC / THEME <span style={{ color: '#E05252' }}>*</span></FieldLabel>
              <Input id="nl-topic" placeholder="e.g. Spring market heating up..." value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-articles">ARTICLES / LINKS TO REFERENCE</FieldLabel>
              <Textarea id="nl-articles" rows={2} placeholder="Paste URLs or article text..." value={articles} onChange={e => setArticles(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-story">PERSONAL STORY / ANECDOTE</FieldLabel>
              <Textarea id="nl-story" rows={4} placeholder="Client win, recent experience, bullet points fine..." value={story} onChange={e => setStory(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-aitool">AI TOOL TIP FOR REALTORS</FieldLabel>
              <Textarea id="nl-aitool" rows={2} placeholder="Optional — for the &quot;AI Edge&quot; section in the realtor version..." value={aiTool} onChange={e => setAiTool(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-notes">ANYTHING ELSE</FieldLabel>
              <Textarea id="nl-notes" rows={2} placeholder="Tone preferences, things to include or avoid..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <SectionLabel>CUSTOM PROMPT</SectionLabel>
            <FieldLabel htmlFor="nl-prompt">FULL PROMPT</FieldLabel>
            <Textarea
              id="nl-prompt"
              rows={10}
              placeholder="Write everything the AI needs — topic, voice, stories, data, what to cover for each audience..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Btn onClick={handlePreview} disabled={isLoading}>
          {isLoading ? <><Spinner /> Loading...</> : '👁 Preview'}
        </Btn>
        <Btn variant="secondary" onClick={() => handlePublish()} disabled={isLoading}>
          ▶ Publish + Send Emails
        </Btn>
        <Btn variant="ghost" onClick={() => setShowSchedule(!showSchedule)} disabled={!preview || isLoading}>
          📅 Schedule
        </Btn>
      </div>

      {/* Schedule picker */}
      {showSchedule && (
        <Card>
          <SectionLabel>SCHEDULE EMAIL SEND</SectionLabel>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FieldLabel htmlFor="nl-schedule-time">DATE + TIME (local)</FieldLabel>
              <Input id="nl-schedule-time" type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
            <Btn onClick={handleSchedule} disabled={isLoading}>Confirm</Btn>
          </div>
          <p className="text-zinc-500 mt-2" style={{ fontSize: 9 }}>
            Must be at least 15 minutes in the future. Page publishes immediately; email sends at scheduled time.
          </p>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && <Banner type="error">{errorMsg}</Banner>}

      {/* Preview panel */}
      {preview && (
        <Card>
          <SectionLabel>PREVIEW</SectionLabel>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-zinc-500">URL: </span>
              <a href={preview.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>{preview.pageUrl}</a>
            </div>
            {preview.borrowerSubject && (
              <div><span className="text-zinc-500">Borrower subject: </span><span className="text-zinc-200">{preview.borrowerSubject}</span></div>
            )}
            {preview.realtorSubject && (
              <div><span className="text-zinc-500">Realtor subject: </span><span className="text-zinc-200">{preview.realtorSubject}</span></div>
            )}
            {preview.linkedinPost && (
              <details className="mt-2">
                <summary className="text-zinc-500 cursor-pointer">LinkedIn post draft</summary>
                <p className="mt-1 text-zinc-300 leading-relaxed whitespace-pre-wrap">{preview.linkedinPost}</p>
              </details>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep 'NewsletterForm' | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/marketing/_components/NewsletterForm.tsx
git commit -m "feat: add NewsletterForm component (structured + prompt modes, Netlify integration)"
```

---

### Task 8: SendTab shell

**Files:**
- Create: `src/app/dashboard/marketing/_components/SendTab.tsx`

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/SendTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { type MCCState } from '@/lib/marketing/types'
import RateUpdateForm from './RateUpdateForm'
import NewsletterForm from './NewsletterForm'

const GOLD = '#C9A84C'

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

type SendMode = 'rate-update' | 'newsletter'

export default function SendTab({ mccState, onSave }: Props) {
  const [sendMode, setSendMode] = useState<SendMode>('rate-update')

  return (
    <div className="space-y-4">
      {/* Inner toggle */}
      <div className="flex border border-zinc-700 rounded-sm overflow-hidden w-fit">
        {([
          { key: 'rate-update' as SendMode, label: '📈 RATE UPDATE' },
          { key: 'newsletter'  as SendMode, label: '✉ NEWSLETTER' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSendMode(key)}
            className="px-4 py-2 text-xs font-bold transition-colors"
            style={{
              background: sendMode === key ? GOLD : 'transparent',
              color: sendMode === key ? '#09090b' : '#71717a',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active form */}
      {sendMode === 'rate-update'
        ? <RateUpdateForm mccState={mccState} onSave={onSave} />
        : <NewsletterForm mccState={mccState} onSave={onSave} />
      }
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/marketing/_components/SendTab.tsx
git commit -m "feat: add SendTab shell with Rate Update / Newsletter toggle"
```

---

## Chunk 3: CALLS Tab

### Task 9: ContactCard component

**Files:**
- Create: `src/app/dashboard/marketing/_components/ContactCard.tsx`

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/ContactCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { type MCCContact, type MCCState, type LogEntry } from '@/lib/marketing/types'
import { Btn, Input } from './shared'
import { todayString } from '@/lib/marketing/utils'

const GOLD = '#C9A84C'
const GREEN = '#4CAF82'
const RED = '#E05252'

type Props = {
  contact:   MCCContact
  listKey:   keyof MCCState['contacts']
  mccState:  MCCState
  onSave:    (next: MCCState) => Promise<void>
  onDelete:  () => void
}

export default function ContactCard({ contact, listKey, mccState, onSave, onDelete }: Props) {
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [callNote, setCallNote]           = useState('')
  const [saving, setSaving]               = useState(false)

  const calledToday = contact.lastTouch === todayString()

  // Last touch color
  const lastTouchColor = (() => {
    if (!contact.lastTouch) return RED
    const days = Math.floor((Date.now() - new Date(contact.lastTouch).getTime()) / 86400000)
    if (days <= 14) return GREEN
    if (days <= 21) return GOLD
    return RED
  })()

  const handleMarkCalled = () => setShowNoteInput(true)

  const handleSaveCall = async () => {
    setSaving(true)
    try {
      const today = todayString()
      const now   = new Date().toISOString()

      // Update contact
      const updatedContact: MCCContact = {
        ...contact,
        lastTouch:   today,
        callHistory: [
          { date: today, note: callNote },
          ...(contact.callHistory ?? []),
        ],
      }

      // Create log entry
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     now,
        activity: `Called ${contact.first} ${contact.last}`,
        channel:  'Phone Call',
        notes:    callNote,
      }

      // Determine tracker key update for this list
      const trackerUpdates: Record<string, string> = {}
      if (listKey === 'realtors')     trackerUpdates['realtor-calls'] = now
      if (listKey === 'preapprovals') trackerUpdates['preapproval']   = now

      // Update state
      const updatedList = mccState.contacts[listKey].map(c =>
        c.id === contact.id ? updatedContact : c
      )

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, ...trackerUpdates },
        contacts: { ...mccState.contacts, [listKey]: updatedList },
      }

      await onSave(nextState)
      setShowNoteInput(false)
      setCallNote('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="bg-zinc-900 border border-zinc-700 rounded-sm p-3 relative transition-opacity"
      style={{ opacity: calledToday ? 0.55 : 1 }}
    >
      {/* Called today badge */}
      {calledToday && (
        <div className="absolute top-2 right-2 text-xs font-bold" style={{ color: GREEN, fontSize: 9 }}>
          ✓ CALLED TODAY
        </div>
      )}

      {/* Delete */}
      {!calledToday && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 text-xs leading-none"
          title="Delete contact"
        >
          ✕
        </button>
      )}

      {/* Name + company */}
      <div className="font-bold text-zinc-100 pr-6" style={{ fontSize: 13 }}>
        {contact.first} {contact.last}
      </div>
      {contact.company && (
        <div className="text-zinc-400 text-xs mt-0.5">{contact.company}</div>
      )}

      {/* Contact links */}
      <div className="flex gap-3 mt-2 text-xs">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="text-zinc-400 hover:text-zinc-100">{contact.phone}</a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="text-zinc-400 hover:text-zinc-100">{contact.email}</a>
        )}
      </div>

      {/* Last touch */}
      <div className="mt-2 text-xs" style={{ color: lastTouchColor }}>
        Last touch: {contact.lastTouch
          ? new Date(contact.lastTouch).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Never'}
      </div>

      {/* Call history (last 2) */}
      {contact.callHistory?.slice(0, 2).map((h, i) => (
        <div key={i} className="text-xs text-zinc-600 mt-0.5">
          {h.date}: {h.note || 'No note'}
        </div>
      ))}

      {/* Mark called / note input */}
      {!showNoteInput ? (
        <div className="mt-3">
          <Btn size="xs" onClick={handleMarkCalled} disabled={calledToday}>
            📞 Mark Called
          </Btn>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Input
            placeholder="Add a call note (optional)..."
            value={callNote}
            onChange={e => setCallNote(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Btn size="xs" onClick={handleSaveCall} disabled={saving}>
              {saving ? 'Saving...' : 'Save Call'}
            </Btn>
            <Btn size="xs" variant="ghost" onClick={() => { setShowNoteInput(false); setCallNote('') }}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/marketing/_components/ContactCard.tsx
git commit -m "feat: add ContactCard component with Mark Called inline flow"
```

---

### Task 10: CallsTab component

**Files:**
- Create: `src/app/dashboard/marketing/_components/CallsTab.tsx`

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/CallsTab.tsx`**

```tsx
'use client'

import { useState, useRef } from 'react'
import { type MCCContact, type MCCState } from '@/lib/marketing/types'
import { SectionLabel, FieldLabel, Input, Btn } from './shared'
import ContactCard from './ContactCard'

type ListKey = keyof MCCState['contacts']

const LIST_CONFIG: { key: ListKey; label: string }[] = [
  { key: 'realtors',     label: 'REALTORS' },
  { key: 'preapprovals', label: 'PRE-APPROVALS' },
  { key: 'inprocess',    label: 'ACTIVE FILES' },
  { key: 'hotleads',     label: 'HOT LEADS' },
]

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

const emptyContact = (): Omit<MCCContact, 'id'> => ({
  first: '', last: '', company: '', phone: '', email: '',
  lastTouch: null, note: '', callHistory: [],
})

export default function CallsTab({ mccState, onSave }: Props) {
  const [activeList, setActiveList] = useState<ListKey>('realtors')
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [newContact, setNewContact] = useState(emptyContact())
  const [addError, setAddError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const contacts = mccState.contacts[activeList] ?? []

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || `${c.first} ${c.last} ${c.company}`.toLowerCase().includes(q)
  })

  // ── Add contact ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newContact.first.trim() || !newContact.last.trim()) {
      setAddError('First name and last name are required.')
      return
    }
    const contact: MCCContact = {
      ...newContact,
      id: crypto.randomUUID(),
      callHistory: [],
    }
    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: [contact, ...mccState.contacts[activeList]],
      },
    }
    await onSave(nextState)
    setNewContact(emptyContact())
    setShowAdd(false)
    setAddError('')
  }

  // ── Delete contact ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string, first: string, last: string) => {
    if (!confirm(`Delete ${first} ${last}? This cannot be undone.`)) return
    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: mccState.contacts[activeList].filter(c => c.id !== id),
      },
    }
    await onSave(nextState)
  }

  // ── CSV import ─────────────────────────────────────────────────────────────
  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    if (lines.length < 2) { alert('CSV is empty or missing rows.'); return }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idxOf = (name: string) => headers.indexOf(name)

    const existing = new Set(
      mccState.contacts[activeList].map(c => `${c.first}|${c.last}`.toLowerCase())
    )

    let added = 0
    let skipped = 0
    const imported: MCCContact[] = []

    for (const line of lines.slice(1)) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const first = cols[idxOf('firstname')] ?? ''
      const last  = cols[idxOf('lastname')]  ?? ''
      if (!first && !last) continue
      const key = `${first}|${last}`.toLowerCase()
      if (existing.has(key)) { skipped++; continue }
      imported.push({
        id:          crypto.randomUUID(),
        first,
        last,
        company:     cols[idxOf('company')]   ?? '',
        phone:       cols[idxOf('phone')]      ?? '',
        email:       cols[idxOf('email')]      ?? '',
        lastTouch:   cols[idxOf('lasttouch')]  ?? null,
        note:        '',
        callHistory: [],
      })
      existing.add(key)
      added++
    }

    if (added === 0) { alert(`No new contacts to import. ${skipped} duplicate(s) skipped.`); return }

    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: [...imported, ...mccState.contacts[activeList]],
      },
    }
    await onSave(nextState)
    alert(`Imported ${added} contact(s).${skipped ? ` ${skipped} duplicate(s) skipped.` : ''}`)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* List selector pills */}
      <div className="flex gap-2 flex-wrap">
        {LIST_CONFIG.map(({ key, label }) => {
          const count = mccState.contacts[key]?.length ?? 0
          const active = activeList === key
          return (
            <button
              key={key}
              onClick={() => { setActiveList(key); setSearch(''); setShowAdd(false) }}
              className="px-3 py-1.5 rounded-sm text-xs font-bold transition-all border"
              style={{
                borderColor: active ? '#C9A84C' : '#3f3f46',
                color:       active ? '#09090b' : '#71717a',
                background:  active ? '#C9A84C' : 'transparent',
              }}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search + actions */}
      <div className="flex gap-2">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Btn variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          + ADD
        </Btn>
        <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          ↑ CSV
        </Btn>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4 space-y-3">
          <SectionLabel>ADD CONTACT</SectionLabel>
          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>FIRST NAME *</FieldLabel>
              <Input value={newContact.first} onChange={e => setNewContact(p => ({ ...p, first: e.target.value }))} autoFocus />
            </div>
            <div>
              <FieldLabel>LAST NAME *</FieldLabel>
              <Input value={newContact.last} onChange={e => setNewContact(p => ({ ...p, last: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>COMPANY</FieldLabel>
              <Input value={newContact.company} onChange={e => setNewContact(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>PHONE</FieldLabel>
              <Input type="tel" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <FieldLabel>EMAIL</FieldLabel>
              <Input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={handleAdd}>Save Contact</Btn>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setNewContact(emptyContact()); setAddError('') }}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {/* Contact grid — empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-sm">
            {search
              ? `No contacts match "${search}"`
              : `No ${LIST_CONFIG.find(l => l.key === activeList)?.label.toLowerCase()} yet. Add manually or import a CSV.`}
          </p>
          {!search && (
            <div className="mt-3">
              <Btn variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ ADD</Btn>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              listKey={activeList}
              mccState={mccState}
              onSave={onSave}
              onDelete={() => handleDelete(contact.id, contact.first, contact.last)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/marketing/_components/CallsTab.tsx
git commit -m "feat: add CallsTab with per-contact call tracking, add form, and CSV import"
```

---

## Chunk 4: HISTORY Tab + Page Shell

### Task 11: HistoryTab component

**Files:**
- Create: `src/app/dashboard/marketing/_components/HistoryTab.tsx`

- [ ] **Step 1: Create `src/app/dashboard/marketing/_components/HistoryTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { type MCCState, type LogEntry, LOG_CHANNELS } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'
import { currentWeekBoundaries, channelToType, formatWeekLabel } from '@/lib/marketing/utils'
import { SectionLabel, FieldLabel, Input, Textarea, Btn, TypeBadge, CadenceBadge } from './shared'

const GOLD = '#C9A84C'

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

export default function HistoryTab({ mccState, onSave }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm]   = useState({
    activity: '', channel: 'Task' as string, date: new Date().toISOString().slice(0, 10), notes: '',
  })
  const [saving, setSaving] = useState(false)

  // ── Week boundaries ────────────────────────────────────────────────────────
  const { start, end } = currentWeekBoundaries(weekOffset)
  const weekLabel = formatWeekLabel(start, end)
  const isCurrentWeek = weekOffset === 0

  // ── Filter log entries for selected week ───────────────────────────────────
  const weekEntries = (mccState.log ?? []).filter(entry => {
    const d = new Date(entry.date)
    return d >= start && d <= end
  })

  // ── Manual log entry ───────────────────────────────────────────────────────
  const handleSaveLog = async () => {
    if (!logForm.activity.trim()) return
    setSaving(true)
    try {
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date(logForm.date).toISOString(),
        activity: logForm.activity,
        channel:  logForm.channel,
        notes:    logForm.notes,
      }

      // Update social-post tracker if LinkedIn or Facebook
      const trackerUpdates: Record<string, string> = {}
      if (logForm.channel === 'LinkedIn' || logForm.channel === 'Facebook') {
        trackerUpdates['social-post'] = new Date(logForm.date).toISOString()
      }

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, ...trackerUpdates },
      }
      await onSave(nextState)
      setLogForm({ activity: '', channel: 'Task', date: new Date().toISOString().slice(0, 10), notes: '' })
      setShowLogForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="xs" onClick={() => setWeekOffset(w => w - 1)}>← PREV</Btn>
        <span className="text-zinc-300 text-xs font-bold">
          {weekLabel}{isCurrentWeek ? ' · This Week' : ''}
        </span>
        <Btn variant="ghost" size="xs" onClick={() => setWeekOffset(w => w + 1)} disabled={isCurrentWeek}>
          NEXT →
        </Btn>
      </div>

      {/* Cadence health strip */}
      <div className="flex flex-wrap gap-2">
        {TRACKERS.map(t => (
          <CadenceBadge
            key={t.key}
            label={t.label}
            lastTimestamp={mccState.last[t.key] ?? null}
            freqDays={t.freq}
            showDaysAgo
          />
        ))}
      </div>

      {/* Manual log button */}
      <div className="flex justify-between items-center">
        <SectionLabel>ACTIVITY LOG</SectionLabel>
        <Btn variant="ghost" size="xs" onClick={() => setShowLogForm(!showLogForm)}>
          + LOG ACTIVITY
        </Btn>
      </div>

      {/* Manual log form */}
      {showLogForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4 space-y-3">
          <div>
            <FieldLabel>ACTIVITY *</FieldLabel>
            <Input
              placeholder="What did you do?"
              value={logForm.activity}
              onChange={e => setLogForm(p => ({ ...p, activity: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>CHANNEL</FieldLabel>
              <select
                value={logForm.channel}
                onChange={e => setLogForm(p => ({ ...p, channel: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-1.5 focus:outline-none"
                style={{ fontFamily: 'inherit' }}
              >
                {LOG_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>DATE</FieldLabel>
              <Input
                type="date"
                value={logForm.date}
                onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <FieldLabel>NOTES</FieldLabel>
            <Textarea
              rows={2}
              placeholder="Optional..."
              value={logForm.notes}
              onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Btn onClick={handleSaveLog} disabled={saving || !logForm.activity.trim()}>
              {saving ? 'Saving...' : 'Save Entry'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowLogForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Log table */}
      {weekEntries.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-sm">Nothing logged this week.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
                <th className="text-left pb-2 pr-4 font-bold">DATE</th>
                <th className="text-left pb-2 pr-4 font-bold">ACTIVITY</th>
                <th className="text-left pb-2 pr-4 font-bold">TYPE</th>
                <th className="text-left pb-2 font-bold">CHANNEL</th>
              </tr>
            </thead>
            <tbody>
              {weekEntries.map(entry => (
                <tr key={entry.id} className="border-b border-zinc-900 hover:bg-zinc-900 transition-colors">
                  <td className="py-2 pr-4 text-zinc-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2 pr-4 text-zinc-200">
                    {entry.activity}
                    {entry.notes && (
                      <span className="text-zinc-600 ml-2" style={{ fontSize: 10 }}>· {entry.notes}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <TypeBadge type={channelToType(entry.channel)} />
                  </td>
                  <td className="py-2 text-zinc-400">{entry.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/marketing/_components/HistoryTab.tsx
git commit -m "feat: add HistoryTab with week nav, cadence health strip, log table, and manual entry"
```

---

### Task 12: Rewrite page.tsx (3-tab shell)

**Files:**
- Modify: `src/app/dashboard/marketing/page.tsx` — full rewrite

This is the main entry point. It:
1. Loads `mcc_state` from Supabase via `useMCCState`
2. Merges with `BLANK_STATE` for safe reads
3. Renders the 3-tab shell (SEND / CALLS / HISTORY)
4. Passes `mccState` + `onSave` to each tab

- [ ] **Step 1: Rewrite `src/app/dashboard/marketing/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useMCCState, mergedState } from './_components/useMCCState'
import SendTab    from './_components/SendTab'
import CallsTab   from './_components/CallsTab'
import HistoryTab from './_components/HistoryTab'

const GOLD = '#C9A84C'

type Tab = 'SEND' | 'CALLS' | 'HISTORY'

const TABS: Tab[] = ['SEND', 'CALLS', 'HISTORY']

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('SEND')
  const { state, loading, error, saveState } = useMCCState()

  const mcc = mergedState(state)

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <span className="text-zinc-600 text-sm tracking-widest">LOADING...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-red-400 text-sm">Error loading marketing data.</p>
          <p className="text-zinc-600 text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 p-6"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-sm font-bold tracking-widest" style={{ color: GOLD }}>
          MARKETING
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-bold tracking-widest transition-colors relative"
            style={{
              color: activeTab === tab ? GOLD : '#52525b',
              fontFamily: 'inherit',
            }}
          >
            {tab}
            {activeTab === tab && (
              <span
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: GOLD }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-3xl">
        {activeTab === 'SEND' && (
          <SendTab mccState={mcc} onSave={saveState} />
        )}
        {activeTab === 'CALLS' && (
          <CallsTab mccState={mcc} onSave={saveState} />
        )}
        {activeTab === 'HISTORY' && (
          <HistoryTab mccState={mcc} onSave={saveState} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — expect zero errors now**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules | head -30
```

Expected: zero errors. (The old `DAYS`/`TCOLS` imports are gone; all new components are typed correctly.)

- [ ] **Step 3: Run all utility tests to confirm nothing regressed**

```bash
npm test -- src/lib/marketing/utils.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/marketing/page.tsx
git commit -m "feat: rewrite marketing page.tsx as 3-tab shell (SEND / CALLS / HISTORY)"
```

---

## Chunk 5: Integration + Smoke Test

### Task 13: End-to-end smoke test (manual)

This task is a manual walkthrough. The app requires Supabase env vars — run it against the real dev environment or a staging environment with `.env.local` populated.

- [ ] **Step 1: Verify dev server starts**

```bash
npm run dev 2>&1 | head -20
```

Expected: "Ready - started server on 0.0.0.0:3000" (or similar — no compile errors).

- [ ] **Step 2: Navigate to /dashboard/marketing**

Open `http://localhost:3000/dashboard/marketing` in a browser.

Expected:
- Dark background, IBM Plex Mono font
- "MARKETING" gold header
- Three tabs: SEND · CALLS · HISTORY
- SEND tab shows Rate Update / Newsletter toggle
- No console errors

- [ ] **Step 3: Test Rate Update form**

1. Enter a rate in the 30-Yr Fixed row (e.g., `6.875`)
2. Verify APR auto-fills with `6.945` (6.875 + 0.07)
3. Verify APR field is still editable — clear and type a custom value
4. Select "Rates dropped" direction, enter blurb text
5. Click "👁 Preview" — verify loading spinner shows, then preview panel appears below
6. Preview panel should show: page URL, borrower subject, realtor subject

Expected: No red error banner. If Netlify errors, verify the URL is correct and the function is deployed.

- [ ] **Step 4: Test Newsletter form**

1. Switch to NEWSLETTER toggle
2. Enter a topic, story
3. Click "👁 Preview"
4. Switch to CUSTOM PROMPT mode — verify form switches

Expected: Both modes render without errors.

- [ ] **Step 5: Test CALLS tab**

1. Click CALLS tab
2. Select REALTORS list
3. Click "+ ADD" — fill in first name, last name — save
4. Verify contact card appears in the grid
5. Click "📞 Mark Called" — enter a note — click "Save Call"
6. Verify card dims to 55% opacity and shows "✓ CALLED TODAY"
7. Switch to HISTORY tab
8. Verify the call appears in the log table with TYPE badge = "Call"
9. Verify cadence chip "Realtor Calls" turns green

Expected: All state persists — refresh the page and verify contacts and log entries are still there.

- [ ] **Step 6: Test HISTORY tab**

1. Click "+ LOG ACTIVITY"
2. Enter activity text, select "LinkedIn" channel, set today's date
3. Save
4. Verify entry appears in log table with TYPE badge = "Social"
5. Verify "Social Posts" health strip chip updates color
6. Click "← PREV" — verify week label changes and prior week's entries (or empty state) shows
7. Verify "NEXT →" is disabled when on current week

Expected: Week navigation works; empty state shows for weeks with no activity.

- [ ] **Step 7: Final TypeScript + lint check**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
npm test
```

Expected: zero TS errors, all unit tests pass.

- [ ] **Step 8: Final commit + push**

```bash
git add -A
git status
git commit -m "feat: complete marketing tab redesign — SEND / CALLS / HISTORY

Rebuilds /dashboard/marketing as a 3-tab command center:
- SEND: Rate Update and Newsletter forms wired to live Netlify functions
  with APR auto-calc, preview panel, schedule support, and HISTORY auto-log
- CALLS: Per-contact call tracking across 4 lists with Mark Called,
  inline note input, CSV import, and calledToday daily reset
- HISTORY: Week navigation, cadence health strip (6 trackers),
  activity log table with TYPE badges, manual log entry form

Removes 9-tab monolith and 5 dead API routes.
All state persists in existing mcc_state Supabase JSON blob.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin main
```

---

## File Summary

| Action | Path |
|--------|------|
| **Rewrite** | `src/app/dashboard/marketing/page.tsx` |
| **Rewrite** | `src/lib/marketing/schedule.ts` |
| **Create** | `src/lib/marketing/types.ts` |
| **Create** | `src/lib/marketing/utils.ts` |
| **Create** | `src/lib/marketing/utils.test.ts` |
| **Create** | `src/app/dashboard/marketing/_components/shared.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/useMCCState.ts` |
| **Create** | `src/app/dashboard/marketing/_components/SendTab.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/RateUpdateForm.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/NewsletterForm.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/CallsTab.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/ContactCard.tsx` |
| **Create** | `src/app/dashboard/marketing/_components/HistoryTab.tsx` |
| **Delete** | `src/app/dashboard/marketing/content/page.tsx` |
| **Delete** | `src/app/dashboard/marketing/social/page.tsx` |
| **Delete** | `src/app/dashboard/marketing/rate-updates/page.tsx` |
| **Delete** | `src/app/api/marketing/generate-newsletter/route.ts` |
| **Delete** | `src/app/api/marketing/publish-newsletter/route.ts` |
| **Delete** | `src/app/api/marketing/run-testimonials/route.ts` |
| **Delete** | `src/app/api/marketing/send-mailchimp/route.ts` |
| **Delete** | `src/app/api/marketing/log-social-post/route.ts` |
