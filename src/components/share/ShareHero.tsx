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
  loName = 'Adam Styer',
  company,
}: ShareHeroProps) {
  const borrowerFirst = borrowerName ? borrowerName.split(' ')[0] : null
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const preparedBy = company ? `${loName} · ${company}` : loName

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0f0d08 0%, #0a0a0a 100%)',
        borderBottom: `1px solid ${GOLD}15`,
      }}
    >
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-14 sm:pt-16 sm:pb-18">
        {/* Top meta line */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
            style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}25` }}
          >
            {mode === 'purchase' ? 'Purchase Analysis' : 'Refinance Analysis'}
          </span>
          {propertyAddress && (
            <span className="text-[11px] font-medium" style={{ color: `${MUTED}CC` }}>
              {propertyAddress}
            </span>
          )}
        </div>

        {/* Borrower name — large and prominent */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight"
          style={{ color: TEXT, letterSpacing: '-0.02em' }}
        >
          {borrowerFirst
            ? `${borrowerFirst}\u2019s ${mode === 'purchase' ? 'Purchase' : 'Refinance'} Options`
            : 'Your Loan Analysis'}
        </h1>

        <p className="text-sm mb-10" style={{ color: MUTED }}>
          Prepared by {preparedBy}{dateStr ? ` · ${dateStr}` : ''}
        </p>

        {/* Hero stat — the big number */}
        {heroStat.value !== 'See details below' && (
          <div
            className="rounded-2xl px-8 py-7 inline-block"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
              border: `1px solid ${GOLD}20`,
              boxShadow: `0 4px 24px rgba(201,168,76,0.06)`,
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: `${GOLD}AA` }}
            >
              {heroStat.label}
            </p>
            <p
              className="text-5xl sm:text-6xl font-bold leading-none"
              style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {heroStat.value}
            </p>
            {heroStat.sublabel && (
              <p className="text-sm mt-3" style={{ color: MUTED }}>{heroStat.sublabel}</p>
            )}
          </div>
        )}

        {/* Subtle gold rule */}
        <div
          className="mt-12"
          style={{
            height: 1,
            background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}30, ${GOLD}00)`,
          }}
        />
      </div>
    </div>
  )
}
