'use client'

import { useState } from 'react'
import type { SocialDraft } from './SocialDraftList'

const GOLD = '#C9A84C'

type Props = {
  onDraftCreated: (draft: SocialDraft) => void
  onClose: () => void
}

const PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'All'] as const
const FORMATS = ['Single Image', 'Carousel', 'Video', 'Reel Script', 'Text Only'] as const
const CLAUDE_FORMAT = '\u2728 Let Claude Decide' as const

export default function SocialComposePanel({ onDraftCreated, onClose }: Props) {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState<string>('All')
  const [format, setFormat] = useState<string | null>(null) // null = let Claude decide
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)

    try {
      const res = await fetch('/api/chat/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          compose: true,
          platform: platform.toLowerCase(),
          format,
        }),
      })

      if (!res.ok) throw new Error('Generate failed')
      const data = await res.json()

      if (data.draftId) {
        // Fetch the full draft to pass back
        const draftRes = await fetch('/api/social/drafts')
        if (draftRes.ok) {
          const draftsData = await draftRes.json()
          const allDrafts: SocialDraft[] = draftsData.drafts ?? draftsData ?? []
          const newDraft = allDrafts.find((d: SocialDraft) => d.id === data.draftId)
          if (newDraft) {
            onDraftCreated(newDraft)
            return
          }
        }
        // Fallback: construct a minimal draft from what we know
        onDraftCreated({
          id: data.draftId,
          platform: platform.toLowerCase(),
          format,
          pillar: null,
          title: data.message?.content?.split('\n')[0]?.slice(0, 40) || 'Untitled post',
          content: data.message?.content || '',
          hashtags: null,
          media_urls: null,
          status: 'draft',
          scheduled_for: null,
          agent_notes: 'Created via compose mode',
          publer_post_id: null,
          created_by: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch {
      // Silently fail — user sees no change
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full p-4"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          COMPOSE NEW POST
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 text-xs font-bold tracking-wider hover:text-zinc-300 transition-colors"
          style={{ fontFamily: 'inherit' }}
        >
          X CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        {/* Prompt area */}
        <div>
          <label
            className="block font-bold mb-1.5"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            WHAT&apos;S YOUR IDEA?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Post about how first-time buyers can use down payment assistance programs in Texas..."
            className="w-full rounded-md border border-zinc-800 text-zinc-100 text-xs px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
            style={{ background: '#111118', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </div>

        {/* Media upload (future) */}
        <div>
          <label
            className="block font-bold mb-1.5"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            MEDIA (COMING SOON)
          </label>
          <div
            className="rounded-md border border-dashed border-zinc-700 px-4 py-6 text-center"
            style={{ background: '#0a0a14' }}
          >
            <span className="text-zinc-600" style={{ fontSize: 11 }}>
              📎 Photo/video upload coming soon
            </span>
          </div>
        </div>

        {/* Platform picker */}
        <div>
          <label
            className="block font-bold mb-1.5"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            PLATFORM
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-colors"
                style={{
                  background: platform === p ? GOLD : 'transparent',
                  color: platform === p ? '#09090b' : '#71717a',
                  border: platform === p ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                  fontFamily: 'inherit',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Format picker */}
        <div>
          <label
            className="block font-bold mb-1.5"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            FORMAT
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-colors"
                style={{
                  background: format === f ? GOLD : 'transparent',
                  color: format === f ? '#09090b' : '#71717a',
                  border: format === f ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                  fontFamily: 'inherit',
                }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => setFormat(null)}
              className="px-3 py-1 rounded-sm text-xs font-bold transition-colors"
              style={{
                background: format === null ? GOLD : 'transparent',
                color: format === null ? '#09090b' : '#71717a',
                border: format === null ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                fontFamily: 'inherit',
              }}
            >
              {CLAUDE_FORMAT}
            </button>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="pt-4">
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-2.5 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
        >
          {loading ? 'GENERATING...' : 'GENERATE POST'}
        </button>
      </div>
    </div>
  )
}
