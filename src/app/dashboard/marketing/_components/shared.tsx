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
