/**
 * src/lib/formatters.ts
 *
 * Shared formatting utilities for LoanOS.
 * Single source of truth for currency, date, percentage, and relative time formatting.
 * All functions return '—' (em dash) for null/undefined/invalid inputs.
 */

const CURRENCY_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/**
 * Format a number as USD currency. Returns '—' for null/undefined.
 * Example: 350000 → '$350,000'
 */
export function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  return CURRENCY_FMT.format(n)
}

/**
 * Format a number in compact form (K / M). Returns '—' for null/undefined.
 * Example: 1500000 → '$1.5M' | 350000 → '$350K'
 */
export function fmtK(n: number | null | undefined): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return fmtCurrency(n)
}

/**
 * Format a date string (YYYY-MM-DD or ISO) as 'Mon DD, YYYY'.
 * Handles date-only strings safely (no timezone shift).
 * Returns '—' for null/empty/invalid.
 * Example: '2026-03-17' → 'Mar 17, 2026'
 */
export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  // Append T00:00:00 for date-only strings to avoid timezone shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a date string as MM/DD/YYYY (date only, no time).
 * Returns '—' for null/empty/invalid.
 * Example: '2026-03-17T10:00:00' → '03/17/2026'
 */
export function fmtDateOnly(s: string | null | undefined): string {
  if (!s) return '—'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)
  if (isNaN(d.getTime())) return '—'
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${mo}/${da}/${d.getFullYear()}`
}

/**
 * Format a percentage. Returns '—' for null/undefined.
 * Example: 6.875 → '6.875%'
 */
export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${parseFloat(n.toFixed(3))}%`
}

/**
 * Format an ISO timestamp as a relative time string.
 * Falls back to fmtDate for dates older than 7 days.
 * Example: (5 minutes ago) → '5m ago' | (2 days ago) → '2d ago'
 */
export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (isNaN(diff)) return '—'
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso.split('T')[0])
}
