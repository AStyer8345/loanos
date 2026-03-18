'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'

// ── Types ─────────────────────────────────────────────────────────────────────

type Newsletter = {
  id: string; audience: string; subject: string; date: string
  mailchimpUrl: string; openRate: string; notes: string
}

type GeneratedNewsletter = {
  subject: string
  teaserHtml: string
  webTitle: string
  webHtml: string
  slug: string
}

type UserMarketingSettings = {
  anthropic_api_key?: string
  mailchimp_api_key?: string
  mailchimp_server_prefix?: string
  mailchimp_realtor_list_id?: string
  mailchimp_borrower_list_id?: string
  dispatch_webhook_url?: string
  dispatch_secret?: string
}

// Minimal MCCState slice — only what this page needs
type MCCNewsletterState = {
  newsletters: Newsletter[]
  log: { id: string; date: string; activity: string; channel: string; notes: string }[]
  last: Record<string, string>
}

type AudienceFilter = 'all' | 'Realtors' | 'Borrowers' | 'Both'
type GenAudience    = 'Realtors' | 'Borrowers' | 'Both'

const AUDIENCE_BADGE: Record<string, string> = {
  Realtors: '#5B8FD4', Borrowers: '#4CAF82', Both: '#C9A84C',
}

const BLANK_NL_STATE: MCCNewsletterState = { newsletters: [], log: [], last: {} }

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate() { return new Date().toISOString().slice(0, 10) }

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className = '', style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`border rounded-sm p-4 ${className}`}
      style={{ background: '#18181b', borderColor: '#3f3f46', ...style }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: '#71717a' }}>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
      style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
    />
  )
}

function Btn({ onClick, children, variant = 'default', disabled = false, className = '' }: {
  onClick: () => void; children: React.ReactNode
  variant?: 'default' | 'gold' | 'danger' | 'green'
  disabled?: boolean; className?: string
}) {
  const colors = {
    default: { color: '#71717a', border: '#3f3f46' },
    gold:    { color: '#C9A84C', border: '#C9A84C' },
    danger:  { color: '#E05252', border: '#E05252' },
    green:   { color: '#4CAF82', border: '#4CAF82' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40 ${className}`}
      style={{ color: colors.color, borderColor: colors.border }}
    >
      {children}
    </button>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSupabase() {
  return useMemo(() => createClient(), [])
}

function useMarketingSettings(): UserMarketingSettings {
  const supabase = useSupabase()
  const { userId, loading: orgLoading } = useOrg()
  const [settings, setSettings] = useState<UserMarketingSettings>({})
  useEffect(() => {
    if (orgLoading || !userId) return
    Promise.all([
      supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'integrations').single(),
      supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'website').single(),
    ]).then(([integ, site]) => {
      setSettings({
        ...((integ.data?.value as Record<string, string>) ?? {}),
        ...((site.data?.value  as Record<string, string>) ?? {}),
      })
    })
  }, [supabase, userId, orgLoading])
  return settings
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContentDashboardPage() {
  const supabase = useSupabase()
  const settings = useMarketingSettings()
  const { userId, loading: orgLoading } = useOrg()

  const [state, setState]   = useState<MCCNewsletterState>(BLANK_NL_STATE)
  const [loading, setLoading] = useState(true)

  // Filter + log form
  const [filter, setFilter]   = useState<AudienceFilter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const BLANK_FORM: Omit<Newsletter, 'id'> = {
    audience: 'Realtors', subject: '', date: isoDate(), mailchimpUrl: '', openRate: '', notes: '',
  }
  const [form, setForm] = useState({ ...BLANK_FORM })

  // Generator state
  const [showGen, setShowGen]         = useState(false)
  const [genAudience, setGenAud]      = useState<GenAudience>('Realtors')
  const [genNotes, setGenNotes]       = useState('')
  const [generating, setGenerating]   = useState(false)
  const [preview, setPreview]         = useState<GeneratedNewsletter | null>(null)
  const [sendingMC, setSendingMC]     = useState(false)
  const [publishing, setPublishing]   = useState(false)
  const [statusMsg, setStatusMsg]     = useState('')

  // Load MCC state from Supabase
  useEffect(() => {
    if (orgLoading) return
    if (!userId) { setLoading(false); return }
    supabase
      .from('mcc_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'mcc')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as Record<string, unknown>
          setState({
            newsletters: (v.newsletters as Newsletter[]) ?? [],
            log:         (v.log as MCCNewsletterState['log']) ?? [],
            last:        (v.last as Record<string, string>) ?? {},
          })
        }
        setLoading(false)
      })
  }, [supabase, userId, orgLoading])

  // Persist back to MCC blob (merges newsletter/log/last into existing mcc_state)
  async function save(next: MCCNewsletterState) {
    setState(next)
    if (!userId) return
    // Read current full state to merge
    const { data } = await supabase
      .from('mcc_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'mcc')
      .single()
    const current = (data?.value as Record<string, unknown>) ?? {}
    await supabase
      .from('mcc_state')
      .upsert(
        { user_id: userId, key: 'mcc', value: { ...current, newsletters: next.newsletters, log: next.log, last: next.last } },
        { onConflict: 'user_id,key' }
      )
  }

  // ── Log manual newsletter ──
  function addNL() {
    if (!form.subject.trim()) { alert('Subject line is required.'); return }
    const nl: Newsletter = { ...form, id: uid() }
    const now = new Date().toISOString()
    const lastUpd = { ...state.last }
    if (form.audience === 'Realtors'  || form.audience === 'Both') lastUpd['realtor-nl']  = now
    if (form.audience === 'Borrowers' || form.audience === 'Both') lastUpd['borrower-nl'] = now
    const logEntry = {
      id: uid(), date: now,
      activity: `Newsletter sent — ${form.subject}`,
      channel: 'Email', notes: form.audience,
    }
    save({ ...state, newsletters: [...state.newsletters, nl], log: [...state.log, logEntry], last: lastUpd })
    setForm({ ...BLANK_FORM })
    setShowAdd(false)
  }

  // ── Generator functions ──
  async function generateNewsletter() {
    setGenerating(true)
    setStatusMsg('')
    setPreview(null)
    try {
      const res = await fetch('/api/marketing/generate-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: genAudience,
          notes:    genNotes,
          apiKey:   settings.anthropic_api_key,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setStatusMsg(`Error: ${data.error}`); return }
      setPreview(data as GeneratedNewsletter)
    } catch {
      setStatusMsg('Generation failed — check Anthropic API key in Settings.')
    } finally {
      setGenerating(false)
    }
  }

  async function sendMailchimp() {
    if (!preview) return
    if (!settings.mailchimp_api_key || !settings.mailchimp_server_prefix) {
      setStatusMsg('Mailchimp credentials not configured. Go to Settings → Integrations.')
      return
    }
    const listId = genAudience === 'Realtors'
      ? settings.mailchimp_realtor_list_id
      : settings.mailchimp_borrower_list_id
    if (!listId) {
      setStatusMsg(`Mailchimp ${genAudience} list ID not configured in Settings.`)
      return
    }
    setSendingMC(true)
    setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/send-mailchimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:       settings.mailchimp_api_key,
          server_prefix: settings.mailchimp_server_prefix,
          list_id:       listId,
          subject:       preview.subject,
          html_body:     preview.teaserHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`✓ Mailchimp campaign sent! Campaign ID: ${data.campaignId}`)
      else setStatusMsg(`Mailchimp error: ${data.error}`)
    } finally {
      setSendingMC(false)
    }
  }

  async function publishToWebsite() {
    if (!preview) return
    if (!settings.dispatch_webhook_url) {
      setStatusMsg('Dispatch webhook URL not configured. Go to Settings → Website.')
      return
    }
    setPublishing(true)
    setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/publish-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_url:    settings.dispatch_webhook_url,
          dispatch_secret: settings.dispatch_secret,
          audience:        genAudience,
          slug:            preview.slug,
          title:           preview.webTitle,
          html:            preview.webHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`✓ Published to website! ${data.url ? `URL: ${data.url}` : 'Check your site.'}`)
      else setStatusMsg(`Publish error: ${data.error}`)
    } finally {
      setPublishing(false)
    }
  }

  function logGeneratedNewsletter() {
    if (!preview) return
    const now = new Date().toISOString()
    const nl: Newsletter = {
      id: uid(), audience: genAudience, subject: preview.subject,
      date: isoDate(), mailchimpUrl: '', openRate: '', notes: genNotes,
    }
    const lastUpd = { ...state.last }
    if (genAudience === 'Realtors'  || genAudience === 'Both') lastUpd['realtor-nl']  = now
    if (genAudience === 'Borrowers' || genAudience === 'Both') lastUpd['borrower-nl'] = now
    const logEntry = {
      id: uid(), date: now,
      activity: `Newsletter generated & sent — ${preview.subject}`,
      channel: 'Email', notes: genAudience,
    }
    save({ ...state, newsletters: [...state.newsletters, nl], log: [...state.log, logEntry], last: lastUpd })
    setPreview(null)
    setShowGen(false)
    setGenNotes('')
    setStatusMsg('')
  }

  const filtered = filter === 'all' ? state.newsletters : state.newsletters.filter(n => n.audience === filter)
  const sorted   = [...filtered].reverse()

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-xs font-mono" style={{ color: '#71717a' }}>LOADING…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-mono text-lg font-bold" style={{ color: '#f4f4f5' }}>Content Dashboard</h1>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#71717a' }}>
          Generate newsletters · send via Mailchimp · publish to website
        </p>
      </div>

      {/* ── Generator Panel ── */}
      <Card className="mb-4" style={{ borderColor: showGen ? '#C9A84C' : '#3f3f46' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-xs font-semibold" style={{ color: '#C9A84C' }}>
              🚀 NEWSLETTER GENERATOR
            </div>
            <div className="font-mono text-[9px] mt-0.5" style={{ color: '#71717a' }}>
              AI drafts → Mailchimp campaign → publish to website
            </div>
          </div>
          <Btn
            onClick={() => { setShowGen(v => !v); setPreview(null); setStatusMsg('') }}
            variant="gold"
          >
            {showGen ? 'COLLAPSE' : 'GENERATE NEW'}
          </Btn>
        </div>

        {showGen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
                <select
                  value={genAudience}
                  onChange={e => setGenAud(e.target.value as GenAudience)}
                  className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                  style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
                >
                  {(['Realtors', 'Borrowers', 'Both'] as const).map(a => (
                    <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>
                  RATE / MARKET CONTEXT (optional)
                </div>
                <Input
                  value={genNotes}
                  onChange={setGenNotes}
                  placeholder="e.g. 30yr at 6.875%, Austin inventory up 12% MOM"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Btn onClick={generateNewsletter} variant="gold" disabled={generating}>
                {generating ? '⟳ GENERATING…' : '✦ GENERATE DRAFT'}
              </Btn>
              {preview && (
                <>
                  <Btn onClick={sendMailchimp} disabled={sendingMC}>
                    {sendingMC ? '⟳ SENDING…' : '📧 SEND MAILCHIMP'}
                  </Btn>
                  <Btn onClick={publishToWebsite} disabled={publishing}>
                    {publishing ? '⟳ PUBLISHING…' : '🌐 PUBLISH TO WEBSITE'}
                  </Btn>
                  <Btn onClick={logGeneratedNewsletter} variant="green">✓ LOG THIS</Btn>
                </>
              )}
            </div>

            {statusMsg && (
              <div
                className="font-mono text-[10px] px-3 py-2 rounded-sm"
                style={{
                  background: statusMsg.startsWith('✓') ? 'rgba(76,175,130,0.1)' : 'rgba(224,82,82,0.1)',
                  color:      statusMsg.startsWith('✓') ? '#4CAF82' : '#E05252',
                  border:     `1px solid ${statusMsg.startsWith('✓') ? '#4CAF8233' : '#E0525233'}`,
                }}
              >
                {statusMsg}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#C9A84C' }}>SUBJECT LINE</div>
                  <div
                    className="font-mono text-xs px-3 py-2 rounded-sm"
                    style={{ background: 'rgba(201,168,76,0.08)', color: '#f4f4f5' }}
                  >
                    {preview.subject}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>TEASER EMAIL (Mailchimp)</div>
                  <div
                    className="text-xs rounded-sm p-3 overflow-auto max-h-40 font-mono leading-relaxed"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', fontSize: 10 }}
                    dangerouslySetInnerHTML={{ __html: preview.teaserHtml }}
                  />
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>WEB PAGE CONTENT</div>
                  <div
                    className="font-mono text-[9px] px-3 py-2 rounded-sm leading-snug"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}
                  >
                    {preview.webTitle} — slug: /{preview.slug}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Newsletter Log ── */}
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['all', 'Realtors', 'Borrowers', 'Both'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: filter === f ? '#C9A84C' : '#3f3f46',
                color:       filter === f ? '#C9A84C' : '#71717a',
                background:  filter === f ? 'rgba(201,168,76,0.08)' : 'transparent',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG NEWSLETTER</Btn>
      </div>

      {showAdd && (
        <Card className="mb-3">
          <SectionLabel>LOG NEWSLETTER</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
              <select
                value={form.audience}
                onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {['Realtors', 'Borrowers', 'Both'].map(a => (
                  <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE SENT</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>SUBJECT LINE *</div>
              <Input
                value={form.subject}
                onChange={v => setForm(p => ({ ...p, subject: v }))}
                placeholder="Austin Market Update — Feb 2026"
              />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>OPEN RATE</div>
              <Input value={form.openRate} onChange={v => setForm(p => ({ ...p, openRate: v }))} placeholder="42%" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>MAILCHIMP URL</div>
              <Input value={form.mailchimpUrl} onChange={v => setForm(p => ({ ...p, mailchimpUrl: v }))} placeholder="https://mailchi.mp/…" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={addNL} variant="gold">SAVE</Btn>
            <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: '#3f3f46' }}>
        <div
          className="grid font-mono text-[9px] tracking-widest px-3 py-2"
          style={{
            gridTemplateColumns: '90px 1fr 90px 70px 80px',
            background: '#09090b', color: '#71717a', borderBottom: '1px solid #3f3f46',
          }}
        >
          <span>DATE</span><span>SUBJECT</span><span>AUDIENCE</span><span>OPEN %</span><span>ACTIONS</span>
        </div>
        {sorted.length === 0 && (
          <div className="font-mono text-[10px] px-3 py-4" style={{ color: '#71717a' }}>
            No newsletters logged yet.
          </div>
        )}
        {sorted.map(n => (
          <div
            key={n.id}
            className="grid items-center px-3 py-2.5 border-b font-mono"
            style={{ gridTemplateColumns: '90px 1fr 90px 70px 80px', borderColor: '#3f3f46', background: '#18181b' }}
          >
            <span className="text-[9px]" style={{ color: '#71717a' }}>
              {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </span>
            <div>
              <div className="text-[10px]" style={{ color: '#f4f4f5' }}>{n.subject}</div>
              {n.notes && <div className="text-[9px]" style={{ color: '#71717a' }}>{n.notes}</div>}
            </div>
            <span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: (AUDIENCE_BADGE[n.audience] ?? '#888') + '22',
                  color: AUDIENCE_BADGE[n.audience] ?? '#888',
                }}
              >
                {n.audience.toUpperCase()}
              </span>
            </span>
            <span className="text-[10px]" style={{ color: n.openRate ? '#4CAF82' : '#71717a' }}>
              {n.openRate || '—'}
            </span>
            <div className="flex gap-1">
              {n.mailchimpUrl && (
                <a
                  href={n.mailchimpUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[8px] px-1.5 py-0.5 border rounded-sm"
                  style={{ color: '#5B8FD4', borderColor: '#5B8FD433' }}
                >
                  VIEW
                </a>
              )}
              <Btn
                onClick={() => save({ ...state, newsletters: state.newsletters.filter(x => x.id !== n.id) })}
                variant="danger"
              >
                ✕
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
