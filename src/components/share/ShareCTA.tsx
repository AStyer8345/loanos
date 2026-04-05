import { GOLD, TEXT, MUTED, BORDER } from './constants'

interface ShareCTAProps {
  calendlyUrl?: string | null
  applicationUrl?: string | null
  loName?: string
  company?: string
  nmls?: string
}

export default function ShareCTA({
  calendlyUrl = null,
  applicationUrl = null,
  loName = '',
  company = '',
  nmls = '',
}: ShareCTAProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden text-center"
      style={{
        background: 'linear-gradient(180deg, #1a1710 0%, #0f0d08 100%)',
        border: `1px solid ${GOLD}25`,
        boxShadow: '0 4px 24px rgba(201,168,76,0.06)',
      }}
    >
      {/* Gold accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}, ${GOLD}40)` }} />

      <div className="p-8 sm:p-10">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
          style={{ color: GOLD }}
        >
          Ready to Move Forward?
        </p>
        <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: TEXT }}>
          Let&rsquo;s talk through your options.
        </h3>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: MUTED }}>
          Questions about these numbers? Schedule a quick call — no pressure, no obligation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {calendlyUrl && (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #D4B85C)`,
                color: '#0a0a0a',
                fontFamily: "'IBM Plex Mono', monospace",
                boxShadow: `0 2px 12px rgba(201,168,76,0.3)`,
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
              className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{
                background: 'transparent',
                color: GOLD,
                border: `1.5px solid ${GOLD}50`,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Start Application
            </a>
          )}
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: TEXT }}>{loName}</p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            {company}{nmls ? ` · NMLS #${nmls}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
