import { GOLD, TEXT, MUTED } from './constants'

interface ShareHeroProps {
  borrowerName: string | null
  mode: 'purchase' | 'refinance'
  propertyAddress: string | null
  heroStat: { label: string; value: string; sublabel?: string }
  createdAt?: string
  loName?: string
  company?: string
}

export default function ShareHero({
  borrowerName,
  mode,
  propertyAddress,
  heroStat,
  createdAt,
}: ShareHeroProps) {
  const borrowerFirst = borrowerName ? borrowerName.split(' ')[0] : null
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className="w-full"
      style={{
        background: 'linear-gradient(180deg, #0f0d08 0%, #0a0a0a 100%)',
        borderBottom: `1px solid ${GOLD}15`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Left: Greeting + context */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-2"
              style={{ color: TEXT, letterSpacing: '-0.02em' }}
            >
              {borrowerFirst ? `Hi ${borrowerFirst}!` : 'Your Loan Analysis'}
            </h1>
            <p className="text-sm leading-relaxed max-w-xl" style={{ color: `${MUTED}CC` }}>
              {mode === 'purchase'
                ? `Welcome to your personal Total Cost Analysis. Here you can compare different loan options from a short and long term perspective.`
                : `Here\u2019s your refinance comparison. See how each option stacks up against your current loan.`}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}25` }}
              >
                {mode === 'purchase' ? 'Purchase' : 'Refinance'}
              </span>
              {propertyAddress && (
                <span className="text-[11px]" style={{ color: `${MUTED}AA` }}>{propertyAddress}</span>
              )}
              {dateStr && (
                <span className="text-[11px]" style={{ color: `${MUTED}80` }}>Prepared {dateStr}</span>
              )}
            </div>
          </div>

          {/* Right: Hero stat */}
          {heroStat.value !== 'See details below' && (
            <div
              className="rounded-xl px-6 py-4 text-right shrink-0"
              style={{
                background: `linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)`,
                border: `1px solid ${GOLD}20`,
              }}
            >
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1"
                style={{ color: `${GOLD}AA` }}
              >
                {heroStat.label}
              </p>
              <p
                className="text-3xl sm:text-4xl font-bold leading-none"
                style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {heroStat.value}
              </p>
              {heroStat.sublabel && (
                <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>{heroStat.sublabel}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
