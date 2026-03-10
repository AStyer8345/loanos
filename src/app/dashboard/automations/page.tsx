'use client'

// ─── Workflow data ────────────────────────────────────────────────────────────

const WORKFLOWS = [
  {
    id: 'final-cd',
    name: 'FINAL CD EMAIL',
    description: 'Upload a Closing Disclosure PDF — Claude extracts 10 fields and generates a personalized closing email draft in Outlook.',
    triggerLabel: 'Upload CD PDF',
    n8nId: 'SkzrWeR0bHZs8kWX',
    webhookPath: 'loanos-final-cd',
    icon: 'cd',
  },
  {
    id: 'pre-approval',
    name: 'PRE-APPROVAL EMAIL',
    description: 'Upload a Pre-Approval letter — Claude extracts borrower details and drafts a congratulations email ready to review.',
    triggerLabel: 'Upload PA Letter PDF',
    n8nId: 'utMvZpkdRwIRZ51u',
    webhookPath: 'loanos-pre-approval',
    icon: 'pa',
  },
  {
    id: 'referral-intro',
    name: 'REFERRAL INTRO EMAIL',
    description: 'Paste referral details — Claude writes a personalized introduction email to the new lead in seconds.',
    triggerLabel: 'Paste Referral Details',
    n8nId: 'YbgDnTpPdefcazKy',
    webhookPath: 'loanos-referral-intro',
    icon: 'referral',
  },
  {
    id: 'new-application',
    name: 'NEW APPLICATION RECEIVED',
    description: '1003 PDF lands in Supabase storage — Claude extracts borrower info, creates contacts, and drafts a welcome email.',
    triggerLabel: '1003 PDF in Storage',
    n8nId: 'cWESnXXy9UOLB13q',
    webhookPath: 'loanos-new-application',
    icon: 'app',
  },
]

// ─── Pipeline steps ───────────────────────────────────────────────────────────

const STEPS = [
  { key: 'trigger', label: 'TRIGGER' },
  { key: 'claude',  label: 'CLAUDE AI' },
  { key: 'outlook', label: 'OUTLOOK' },
  { key: 'review',  label: 'REVIEW' },
]

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const WORKFLOW_ICONS: Record<string, React.ReactNode> = {
  cd: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  pa: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  referral: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  app: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  trigger: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  claude: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  outlook: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  review: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
}

// ─── AutoCard component ───────────────────────────────────────────────────────

function AutoCard({ wf, index }: { wf: typeof WORKFLOWS[0]; index: number }) {
  return (
    <div
      className="auto-card"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 0.12}s`,
      }}
    >
      {/* Gold left accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: 3, background: 'var(--gold)', borderRadius: '8px 0 0 8px',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--gold)', lineHeight: 0 }}>
            {WORKFLOW_ICONS[wf.icon]}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
              fontSize: 20, letterSpacing: '0.06em', lineHeight: 1,
              color: 'var(--text)',
            }}>
              {wf.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.08em',
            }}>
              TRIGGER: {wf.triggerLabel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          fontSize: 9, letterSpacing: '0.12em',
          background: 'rgba(62,214,138,0.08)', border: '1px solid rgba(62,214,138,0.25)',
          color: 'var(--green)', borderRadius: 4, padding: '3px 8px',
          whiteSpace: 'nowrap',
        }}>
          ✓ ACTIVE
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-sans, "IBM Plex Sans", sans-serif)',
        fontSize: 12, color: 'var(--muted)', lineHeight: 1.6,
        marginBottom: 20,
      }}>
        {wf.description}
      </p>

      {/* Pipeline flow */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        {STEPS.map((step, i) => (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? undefined : 1 }}>
            {/* Step node */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              minWidth: 60,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border)'}`,
                background: i === 0 ? 'rgba(201,168,76,0.1)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i === 0 ? 'var(--gold)' : 'var(--muted)',
              }}>
                {STEP_ICONS[step.key] ?? STEP_ICONS.trigger}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: 8, letterSpacing: '0.1em', color: 'var(--muted)',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector with animated dot */}
            {i < STEPS.length - 1 && (
              <div className="flow-connector" style={{
                flex: 1, height: 1,
                background: 'var(--border)',
                position: 'relative',
                overflow: 'visible',
                marginBottom: 13, // offset label height
              }}>
                <div
                  className="flow-dot"
                  style={{ animationDelay: `${i * 0.7}s` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meta row (hover reveal) */}
      <div className="meta-reveal" style={{
        fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
        fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em',
        display: 'flex', gap: 16, marginBottom: 16,
      }}>
        <span>n8n: <span style={{ color: 'var(--border)' }}>{wf.n8nId}</span></span>
        <span>webhook: <span style={{ color: 'var(--border)' }}>/webhook/{wf.webhookPath}</span></span>
        <span>last run: <span>—</span></span>
      </div>

      {/* Trigger button */}
      <div className="trigger-wrap" style={{ position: 'relative', display: 'inline-block' }}>
        <button
          disabled
          style={{
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            fontSize: 10, letterSpacing: '0.1em',
            background: 'transparent', color: 'var(--border)',
            border: '1px solid var(--border)', borderRadius: 4,
            padding: '6px 14px', cursor: 'not-allowed',
          }}
        >
          &gt;_ TRIGGER
        </button>
        <div className="trigger-tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          fontSize: 9, letterSpacing: '0.06em',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--muted)', borderRadius: 4, padding: '5px 10px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          opacity: 0, transition: 'opacity 0.15s',
        }}>
          Coming soon — trigger from LoanOS
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flowDot {
          0%   { left: -5px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: calc(100% + 5px); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .auto-card {
          opacity: 0;
          animation: cardIn 0.4s ease forwards;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auto-card:hover {
          border-color: rgba(201,168,76,0.3) !important;
          box-shadow: 0 0 24px rgba(201,168,76,0.06);
        }

        .flow-dot {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          animation: flowDot 2.1s ease-in-out infinite;
          left: -5px;
        }

        .meta-reveal {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .auto-card:hover .meta-reveal {
          opacity: 1;
        }

        .trigger-wrap:hover .trigger-tooltip {
          opacity: 1 !important;
        }

        .status-pulse {
          animation: pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      <div style={{ padding: '32px 32px 48px', background: 'var(--bg)', minHeight: '100%' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{
            fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
            fontSize: 36, letterSpacing: '0.05em', lineHeight: 1,
            color: 'var(--text)',
          }}>
            AUTOMATIONS
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5,
          }}>
            4 active workflows — Claude extracts, n8n routes, Outlook drafts. You review and send.
          </p>
        </div>

        {/* ── Stat row ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 28, marginTop: 16,
          border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden',
          background: 'var(--surface)',
        }}>
          {[
            { label: 'ACTIVE WORKFLOWS', value: '4', color: 'var(--green)' },
            { label: 'ERRORS',           value: '0', color: 'var(--text)'  },
            { label: 'LAST UPDATED',     value: '2026-03-09', color: 'var(--muted)' },
            { label: 'ENGINE',           value: 'n8n + Claude API', color: 'var(--gold)' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, padding: '12px 18px',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 4,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: 13, color: stat.color, fontWeight: 500,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Infra bar ───────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', marginBottom: 28,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderLeft: '3px solid var(--green)', borderRadius: 6,
        }}>
          <span className="status-pulse" style={{
            display: 'inline-block', width: 7, height: 7,
            borderRadius: '50%', background: 'var(--green)', flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            fontSize: 10, letterSpacing: '0.1em', color: 'var(--green)',
          }}>
            ALL WORKFLOWS LIVE — Supabase pg_net → n8n webhook → Claude API → Outlook
          </span>
        </div>

        {/* ── Workflow cards grid ─────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
          gap: 16,
        }}>
          {WORKFLOWS.map((wf, i) => (
            <AutoCard key={wf.id} wf={wf} index={i} />
          ))}
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, letterSpacing: '0.05em',
        }}>
          INSTANCE: styer.app.n8n.cloud · TRIGGER: Supabase pg_net or manual · DRAFTS: Outlook via n8n ·{' '}
          <span style={{ color: 'rgba(201,168,76,0.5)' }}>
            Trigger buttons wired in Phase 2 sprint.
          </span>
        </div>

      </div>
    </>
  )
}
