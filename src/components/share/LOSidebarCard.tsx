import { GOLD, TEXT, MUTED, CARD_BG } from './constants'

interface LOSidebarCardProps {
  loName: string
  company: string
  nmls: string
  phone?: string
  email?: string
  calendlyUrl?: string | null
  applicationUrl?: string | null
}

export default function LOSidebarCard({
  loName,
  company,
  nmls,
  phone,
  email,
  calendlyUrl,
  applicationUrl,
}: LOSidebarCardProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #1a1710 0%, ${CARD_BG} 100%)`,
        border: `1px solid ${GOLD}20`,
      }}
    >
      {/* Gold accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}, ${GOLD}40)` }} />

      <div className="p-5">
        {/* Label */}
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-3"
          style={{ color: `${GOLD}AA` }}
        >
          This report was created for you by
        </p>

        {/* LO Name */}
        <p className="text-lg font-bold mb-0.5" style={{ color: TEXT }}>{loName}</p>
        <p className="text-xs mb-1" style={{ color: MUTED }}>{company}</p>
        <p className="text-[10px] mb-4" style={{ color: `${MUTED}AA` }}>NMLS #{nmls}</p>

        {/* Contact info */}
        <div className="space-y-1.5 mb-4">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="flex items-center gap-2 text-xs hover:underline"
              style={{ color: TEXT }}
            >
              <span style={{ color: GOLD, fontSize: 14 }}>✆</span>
              {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-xs hover:underline"
              style={{ color: TEXT }}
            >
              <span style={{ color: GOLD, fontSize: 12 }}>✉</span>
              {email}
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {calendlyUrl && (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #D4B85C)`,
                color: '#0a0a0a',
                fontFamily: "'IBM Plex Mono', monospace",
                boxShadow: `0 2px 8px rgba(201,168,76,0.25)`,
              }}
            >
              Schedule a Call
            </a>
          )}
          {applicationUrl && (
            <a
              href={applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{
                background: 'transparent',
                color: GOLD,
                border: `1.5px solid ${GOLD}40`,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Start Application
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
