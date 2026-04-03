import { GOLD, TEXT, MUTED, BORDER } from './constants'

interface ShareHeroProps {
  borrowerName: string | null
  mode: 'purchase' | 'refinance'
  propertyAddress: string | null
  heroStat: { label: string; value: string; sublabel?: string }
  createdAt?: string
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
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        {/* Mode badge + date */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}
          >
            {mode === 'purchase' ? 'Purchase Analysis' : 'Refinance Analysis'}
          </span>
          {propertyAddress && (
            <span className="text-[10px]" style={{ color: MUTED }}>
              {propertyAddress}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: TEXT }}>
          {borrowerFirst
            ? `${borrowerFirst}\u2019s ${mode === 'purchase' ? 'Purchase' : 'Refinance'} Options`
            : 'Your Loan Analysis'}
        </h1>

        <p className="text-xs mb-6" style={{ color: MUTED }}>
          Prepared by Adam Styer{dateStr ? ` \u00B7 ${dateStr}` : ''}
        </p>

        {/* Hero stat */}
        {heroStat.value !== 'See details below' && (
          <div
            className="inline-block rounded-2xl px-6 py-5"
            style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: `${GOLD}90` }}>
              {heroStat.label}
            </p>
            <p
              className="text-4xl font-bold"
              style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {heroStat.value}
            </p>
            {heroStat.sublabel && (
              <p className="text-xs mt-1" style={{ color: MUTED }}>{heroStat.sublabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
