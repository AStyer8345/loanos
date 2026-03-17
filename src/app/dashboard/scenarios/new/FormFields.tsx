'use client'

import { useState } from 'react'

// ─── Shared Input Components ──────────────────────────────────────
// Extracted from ScenarioBuilder to break circular import chain.
// ScenarioCard and CurrentLoanCard both import these, and
// ScenarioBuilder imports those components — creating a cycle that
// can cause undefined exports at runtime in webpack.

export function InputField({ label, value, onChange, placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1"
        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'IBM Plex Mono', monospace" }}
      />
    </div>
  )
}

export function CurrencyField({ label, value, onChange, className, readOnly, accent }: {
  label: string; value: number; onChange: (v: number) => void; className?: string; readOnly?: boolean; accent?: string
}) {
  const display = value > 0 ? value.toLocaleString('en-US') : ''
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>$</span>
        <input
          type="text"
          value={display}
          readOnly={readOnly}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            onChange(parseFloat(raw) || 0)
          }}
          className="w-full pl-8 pr-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1"
          style={{
            borderColor: 'var(--sc-border)',
            color: accent || 'var(--sc-text)',
            background: readOnly ? 'var(--sc-card)' : 'var(--sc-bg)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PercentField({ label, value, onChange, decimals: _decimals = 3 }: {
  label: string; value: number; onChange: (v: number) => void; decimals?: number
}) {
  const [localVal, setLocalVal] = useState(value > 0 ? String(value) : '')
  const [focused, setFocused] = useState(false)

  // Sync from parent when not focused
  const displayed = focused ? localVal : (value > 0 ? String(value) : '')

  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayed}
          onFocus={() => {
            setFocused(true)
            setLocalVal(value > 0 ? String(value) : '')
          }}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            setLocalVal(raw)
            const parsed = parseFloat(raw)
            if (!isNaN(parsed)) onChange(parsed)
          }}
          onBlur={() => {
            setFocused(false)
            const parsed = parseFloat(localVal)
            onChange(!isNaN(parsed) ? parsed : 0)
          }}
          className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1 pr-8"
          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'IBM Plex Mono', monospace" }}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>%</span>
      </div>
    </div>
  )
}

export function SelectField({ label, value, onChange, options }: {
  label: string; value: string | number; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none"
        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-card)', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
