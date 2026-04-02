'use client'

import { useState, useEffect, useCallback } from 'react'

const GOLD = '#C9A84C'

const SEED_CONTENT = `# Voice & Workflow Guide

## Brand Voice

- Short punchy sentences. Conversational. Raw. Vulnerable without being soft.
- No fluff, no filler, no corporate jargon.
- Direct — answer first, then reasoning.
- Faith-driven but not preachy.

## Tone by Channel

### LinkedIn
- Professional but human. Share insights, lessons, wins.
- Use first person. No hashtag spam (3 max).

### Facebook
- Community-focused. Local Austin angle when possible.
- More casual than LinkedIn. OK to be funny.

### Instagram
- Visual-first. Captions short and punchy.
- Stories for behind-the-scenes, Reels for education.

### Google Business Profile
- Informative, local, helpful. Think "answer a question."
- Keep posts under 300 words.

## Content Pillars

1. **Market Updates** — Rates, trends, what it means for buyers
2. **Education** — Mortgage process, terms, tips
3. **Social Proof** — Closings, testimonials, milestones
4. **Personal** — Faith, family, Austin life, behind-the-scenes
5. **Referral Partner** — Co-branded content, realtor shoutouts

## Posting Cadence

- LinkedIn: 3x/week
- Facebook: 3x/week
- Instagram: 4x/week (mix of posts, stories, reels)
- GBP: 1x/week

## Workflow Notes

- All posts go through Publer for scheduling
- Rate updates generated via LoanOS workflow
- Testimonial posts auto-generated weekly via n8n
- GBP + social post combo runs weekly via n8n
`

export default function VoiceGuideEditor() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)

  const fetchGuide = useCallback(async () => {
    try {
      const res = await fetch('/api/social/settings?key=voice_guide')
      const data = await res.json()
      if (data.value) {
        setContent(data.value)
        setUpdatedAt(data.updatedAt)
        setIsEmpty(false)
      } else {
        setIsEmpty(true)
      }
    } catch {
      setIsEmpty(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuide()
  }, [fetchGuide])

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_guide', value: content }),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setUpdatedAt(new Date().toISOString())
        setIsEmpty(false)
        setTimeout(() => setSaveStatus('idle'), 2500)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = () => {
    setContent(SEED_CONTENT)
    setIsEmpty(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-muted-foreground text-sm tracking-widest">LOADING...</span>
      </div>
    )
  }

  if (isEmpty && !content) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-muted-foreground text-sm">No voice guide found.</p>
        <button
          onClick={handleSeed}
          className="px-4 py-2 text-xs font-bold tracking-widest rounded-sm transition-colors"
          style={{ background: GOLD, color: 'var(--bg)' }}
        >
          SEED FROM TEMPLATE
        </button>
      </div>
    )
  }

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-widest" style={{ color: GOLD }}>
            VOICE & WORKFLOW GUIDE
          </h2>
          {formattedDate && (
            <p className="text-muted-foreground text-xs mt-1">
              Last updated: {formattedDate}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-500 tracking-wide animate-pulse">
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400 tracking-wide">
              Error saving
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold tracking-widest rounded-sm transition-colors disabled:opacity-50"
            style={{ background: GOLD, color: 'var(--bg)' }}
          >
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-sm border border-input bg-[var(--surface)] text-foreground p-4 focus:outline-none focus:border-input resize-y"
        style={{
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: '13px',
          lineHeight: '1.7',
          minHeight: '600px',
        }}
        spellCheck={false}
      />
    </div>
  )
}
