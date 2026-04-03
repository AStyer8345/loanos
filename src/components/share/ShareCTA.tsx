import { GOLD, TEXT, MUTED, CARD_BG, BORDER } from './constants'

interface ShareCTAProps {
  calendlyUrl?: string | null
  applicationUrl?: string | null
  loName?: string
  company?: string
  nmls?: string
}

export default function ShareCTA({
  calendlyUrl = 'https://calendly.com/adamstyer/15minutes',
  applicationUrl = 'https://mslp.my1003app.com/513013/register',
  loName = 'Adam Styer',
  company = 'Adam Styer | Mortgage Solutions LP',
  nmls = '513013',
}: ShareCTAProps) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-8 text-center"
      style={{ background: CARD_BG, border: `1px solid ${GOLD}25` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
        Ready to Move Forward?
      </p>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>
        Let&rsquo;s talk through your options.
      </h3>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Questions about these numbers? Schedule a quick call — no pressure, no obligation.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {calendlyUrl && (
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: '#0a0a0a', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Schedule a Call
          </a>
        )}
        {applicationUrl && (
          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}40`, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Start Application
          </a>
        )}
      </div>

      <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs font-medium" style={{ color: TEXT }}>{loName}</p>
        <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
          {company}{nmls ? ` · NMLS #${nmls}` : ''}
        </p>
      </div>
    </div>
  )
}
