import { GOLD, TEXT, CARD_BG, BORDER } from './constants'

interface NarrativeCardProps {
  text: string
}

export default function NarrativeCard({ text }: NarrativeCardProps) {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (!paragraphs.length) return null

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
        Analysis Summary
      </p>
      {paragraphs.map((para, i) => {
        if (i === 0) {
          const dotIdx = para.indexOf('.')
          const lede = dotIdx > -1 ? para.slice(0, dotIdx + 1) : para
          const rest = dotIdx > -1 ? para.slice(dotIdx + 1).trim() : ''
          return (
            <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: TEXT }}>
              <span className="font-semibold" style={{ color: GOLD }}>{lede}</span>
              {rest ? ` ${rest}` : ''}
            </p>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: `${TEXT}BB` }}>
            {para}
          </p>
        )
      })}
    </div>
  )
}
