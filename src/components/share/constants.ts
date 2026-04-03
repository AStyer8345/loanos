// Share page theme constants
// Dark theme matching LoanOS brand

export const GOLD = '#C9A84C'
export const TEXT = '#F0EDE8'
export const MUTED = '#888888'
export const CARD_BG = '#141414'
export const BORDER = '#262626'
export const BG = '#0a0a0a'
export const GREEN = '#4ade80'
export const AMBER = '#fbbf24'

export const fmtCurrency = (v: number) =>
  '$' + Math.round(v).toLocaleString('en-US')

export const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${Math.round(v)}`
}

export const fmtRate = (v: number) => v.toFixed(3) + '%'
