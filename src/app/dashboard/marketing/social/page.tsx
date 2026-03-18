'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'

// ── Types ─────────────────────────────────────────────────────────────────────

type SocialPost = {
  id: string; platform: string; caption: string; url: string; date: string; notes: string
}

type MCCSocialState = {
  socialPosts: SocialPost[]
  last: Record<string, string>
}

const PLAT_OPTS    = ['LinkedIn', 'Facebook', 'Instagram', 'LinkedIn + Facebook', 'All Platforms']
const PLAT_DISPLAY: Record<string, string> = {
  'LinkedIn':           'LinkedIn',
  'Facebook':           'Facebook',
  'Instagram':          'Instagram',
  'LinkedIn + Facebook':'LinkedIn + Facebook',
  'All Platforms':      'All Platforms',
}
const PLAT_FILTERS = ['All', ...PLAT_OPTS]

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid()    { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate(){ return new Date().toISOString().slice(0, 10) }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border rounded-sm p-4 ${className}`}
      style={{ background: '#18181b', borderColor: '#3f3f46' }}
    >
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

function Btn({ onClick, children, variant = 'default', disabled = false }: {
  onClick: () => void; children: React.ReactNode
  variant?: 'default' | 'gold' | 'danger'
  disabled?: boolean
}) {
  const colors = {
    default: { color: '#71717a', border: '#3f3f46' },
    gold:    { color: '#C9A84C', border: '#C9A84C' },
    danger:  { color: '#E05252', border: '#E05252' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: colors.color, borderColor: colors.border }}
    >
      {children}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const supabase  = useMemo(() => createClient(), [])
  const { userId, loading: orgLoading } = useOrg()
  const [state, setState]     = useState<MCCSocialState>({ socialPosts: [], last: {} })
  const [loading, setLoading] = useState(true)

  const [platFilter, setPlatFilter] = useState('All')
  const [showAdd, setShowAdd]       = useState(false)
  const BLANK_FORM = { platform: 'LinkedIn', caption: '', url: '', date: isoDate(), notes: '' }
  const [form, setForm] = useState({ ...BLANK_FORM })

  // Load MCC state
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
            socialPosts: (v.socialPosts as SocialPost[]) ?? [],
            last:        (v.last as Record<string, string>) ?? {},
          })
        }
        setLoading(false)
      })
  }, [supabase, userId, orgLoading])

  async function save(next: MCCSocialState) {
    setState(next)
    if (!userId) return
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
        { user_id: userId, key: 'mcc', value: { ...current, socialPosts: next.socialPosts, last: next.last } },
        { onConflict: 'user_id,key' }
      )
  }

  function addPost() {
    if (!form.caption.trim()) { alert('Caption is required.'); return }
    const post: SocialPost = { ...form, id: uid() }
    const now = new Date().toISOString()
    save({ ...state, socialPosts: [...state.socialPosts, post], last: { ...state.last, 'social-post': now } })
    setForm({ ...BLANK_FORM })
    setShowAdd(false)
  }

  const filtered = platFilter === 'All'
    ? state.socialPosts
    : state.socialPosts.filter(p => p.platform === platFilter)
  const sorted = [...filtered].reverse()

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
        <h1 className="font-mono text-lg font-bold" style={{ color: '#f4f4f5' }}>Social Media Posts</h1>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#71717a' }}>
          Log and track social posts across LinkedIn, Facebook, and Instagram
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'TOTAL POSTS',   value: state.socialPosts.length },
          { label: 'THIS WEEK',     value: state.socialPosts.filter(p => {
            const d = new Date(p.date)
            const now = new Date()
            const diff = (now.getTime() - d.getTime()) / 86400000
            return diff <= 7
          }).length },
          { label: 'LINKEDIN',      value: state.socialPosts.filter(p => p.platform.includes('LinkedIn')).length },
          { label: 'LAST POST',     value: state.last['social-post']
            ? fmtDate(state.last['social-post'])
            : '—' },
        ].map((st, i) => (
          <div key={i} className="border rounded-sm px-4 py-3" style={{ background: '#18181b', borderColor: '#3f3f46' }}>
            <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#71717a' }}>{st.label}</div>
            <div className="font-mono text-xl font-semibold" style={{ color: '#C9A84C' }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Log button */}
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1 flex-wrap">
          {PLAT_FILTERS.map(p => (
            <button
              key={p}
              onClick={() => setPlatFilter(p)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: platFilter === p ? '#C9A84C' : '#3f3f46',
                color:       platFilter === p ? '#C9A84C' : '#71717a',
                background:  platFilter === p ? 'rgba(201,168,76,0.08)' : 'transparent',
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG POST</Btn>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="mb-3">
          <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: '#71717a' }}>LOG SOCIAL POST</div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>PLATFORM</div>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {PLAT_OPTS.map(p => (
                  <option key={p} value={p} style={{ background: '#1a1a1a' }}>{PLAT_DISPLAY[p] ?? p}</option>
                ))}
              </select>
            </div>
            {(['caption', 'url', 'date', 'notes'] as const).map(f => (
              <div key={f}>
                <div className="font-mono text-[9px] mb-1 uppercase" style={{ color: '#71717a' }}>
                  {f}{f === 'caption' ? ' *' : f === 'date' ? '' : ' (optional)'}
                </div>
                <Input
                  type={f === 'date' ? 'date' : 'text'}
                  value={form[f]}
                  onChange={v => setForm(p => ({ ...p, [f]: v }))}
                  placeholder={
                    f === 'caption' ? 'What did you post?' :
                    f === 'url'     ? 'https://linkedin.com/…' :
                    f === 'notes'   ? 'Engagement, reach, context…' : undefined
                  }
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Btn onClick={addPost} variant="gold">SAVE POST</Btn>
              <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Post list */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: '#3f3f46' }}>
        <div
          className="grid font-mono text-[9px] tracking-widest px-3 py-2"
          style={{
            gridTemplateColumns: '80px 1fr 120px 24px',
            background: '#09090b', color: '#71717a', borderBottom: '1px solid #3f3f46',
          }}
        >
          <span>DATE</span><span>CAPTION</span><span>PLATFORM</span><span />
        </div>

        {sorted.length === 0 && (
          <div className="font-mono text-[10px] px-3 py-4" style={{ color: '#71717a' }}>
            No posts logged yet.
          </div>
        )}

        {sorted.map(post => (
          <div
            key={post.id}
            className="grid items-start px-3 py-2.5 border-b font-mono"
            style={{ gridTemplateColumns: '80px 1fr 120px 24px', borderColor: '#3f3f46', background: '#18181b' }}
          >
            <span className="text-[9px] pt-0.5" style={{ color: '#71717a' }}>{fmtDate(post.date)}</span>
            <div>
              <div className="text-[10px]" style={{ color: '#f4f4f5' }}>{post.caption}</div>
              {post.notes && <div className="text-[9px] mt-0.5" style={{ color: '#71717a' }}>{post.notes}</div>}
              {post.url && (
                <a
                  href={post.url} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[8px] mt-0.5 inline-block"
                  style={{ color: '#5B8FD4' }}
                >
                  VIEW POST ↗
                </a>
              )}
            </div>
            <span className="text-[9px] pt-0.5" style={{ color: '#71717a' }}>{post.platform}</span>
            <button
              onClick={() => save({ ...state, socialPosts: state.socialPosts.filter(x => x.id !== post.id) })}
              className="font-mono text-[9px] hover:opacity-70 transition-opacity pt-0.5"
              style={{ color: '#E05252' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
