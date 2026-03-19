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
