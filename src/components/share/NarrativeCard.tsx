import { GOLD, TEXT, CARD_BG } from './constants'

interface NarrativeCardProps {
  text: string
}

export default function NarrativeCard({ text }: NarrativeCardProps) {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (!paragraphs.length) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #1a1710 0%, ${CARD_BG} 100%)`,
        border: `1px solid ${GOLD}20`,
      }}
    >
      {/* Gold accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}, ${GOLD}40)` }} />

      <div className="p-6 sm:p-8">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-5"
          style={{ color: GOLD }}
        >
          Analysis Summary
        </p>
        {paragraphs.map((para, i) => {
          if (i === 0) {
            const dotIdx = para.indexOf('.')
            const lede = dotIdx > -1 ? para.slice(0, dotIdx + 1) : para
            const rest = dotIdx > -1 ? para.slice(dotIdx + 1).trim() : ''
            return (
              <p key={i} className="text-[15px] leading-relaxed mb-4" style={{ color: TEXT }}>
                <span className="font-semibold" style={{ color: GOLD }}>{lede}</span>
                {rest ? ` ${rest}` : ''}
              </p>
            )
          }
          return (
            <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: `${TEXT}BB` }}>
              {para}
            </p>
          )
        })}
      </div>
    </div>
  )
}
