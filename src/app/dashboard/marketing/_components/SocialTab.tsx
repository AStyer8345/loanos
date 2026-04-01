'use client'

import { useState, useEffect, useCallback } from 'react'
import SocialActivityFeed from './SocialActivityFeed'
import SocialDraftList, { type SocialDraft } from './SocialDraftList'
import SocialDraftDetail from './SocialDraftDetail'
import SocialComposePanel from './SocialComposePanel'
import VoiceGuideDrawer from './VoiceGuideDrawer'

type Mode = 'browse' | 'compose'

type Props = {
  onSwitchToVoiceGuide?: () => void
}

export default function SocialTab({ onSwitchToVoiceGuide }: Props) {
  const [drafts, setDrafts] = useState<SocialDraft[]>([])
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('browse')
  const [loading, setLoading] = useState(true)
  const [voiceGuideOpen, setVoiceGuideOpen] = useState(false)

  // Fetch drafts on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/social/drafts')
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (!cancelled) {
          const list: SocialDraft[] = data.drafts ?? data ?? []
          setDrafts(list)
        }
      } catch {
        if (!cancelled) setDrafts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) || null

  const handleSelect = useCallback((id: string) => {
    setSelectedDraftId(id)
    setMode('browse')
  }, [])

  const handleCompose = useCallback(() => {
    setMode('compose')
    setSelectedDraftId(null)
  }, [])

  const handleUpdate = useCallback(async (updated: SocialDraft) => {
    // Optimistic update
    setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))

    try {
      const res = await fetch('/api/social/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          status: updated.status,
          content: updated.content,
          title: updated.title,
          hashtags: updated.hashtags,
          platform: updated.platform,
          format: updated.format,
          scheduled_for: updated.scheduled_for,
          media_urls: updated.media_urls,
          rejection_reason: updated.rejection_reason,
        }),
      })

      if (!res.ok) throw new Error('update failed')
      const data = await res.json()
      if (data.draft) {
        setDrafts((prev) => prev.map((d) => (d.id === data.draft.id ? data.draft : d)))
      }
    } catch {
      // Revert on failure — refetch
      try {
        const res = await fetch('/api/social/drafts')
        if (res.ok) {
          const data = await res.json()
          setDrafts(data.drafts ?? data ?? [])
        }
      } catch {
        // silent
      }
    }
  }, [])

  const handleDraftCreated = useCallback((draft: SocialDraft) => {
    setDrafts((prev) => [draft, ...prev])
    setSelectedDraftId(draft.id)
    setMode('browse')
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/social/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('[social] delete failed', error)
    } finally {
      setDrafts((prev) => prev.filter((draft) => draft.id !== id))
      setSelectedDraftId((prev) => (prev === id ? null : prev))
      setMode('browse')
    }
  }, [])

  const handleOpenVoiceGuide = useCallback(() => {
    setVoiceGuideOpen(true)
  }, [])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        <span className="text-zinc-600 text-sm tracking-widest">LOADING SOCIAL...</span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col border border-zinc-800 rounded-sm overflow-hidden"
      style={{
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        height: 'calc(100vh - 180px)',
        minHeight: 500,
      }}
    >
      {/* Activity feed strip */}
      <SocialActivityFeed />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Draft list */}
        <SocialDraftList
          drafts={drafts}
          selectedId={selectedDraftId}
          onSelect={handleSelect}
          onCompose={handleCompose}
        />

        {/* Right: Detail or Compose */}
        <div className="flex-1 overflow-hidden">
          {mode === 'compose' ? (
            <SocialComposePanel
              onDraftCreated={handleDraftCreated}
              onClose={() => setMode('browse')}
            />
          ) : selectedDraft ? (
            <SocialDraftDetail
              draft={selectedDraft}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onOpenVoiceGuide={handleOpenVoiceGuide}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-zinc-600" style={{ fontSize: 12 }}>
                Select a draft to preview
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Guide Drawer */}
      <VoiceGuideDrawer
        open={voiceGuideOpen}
        onClose={() => setVoiceGuideOpen(false)}
        onEditFullTab={() => {
          setVoiceGuideOpen(false)
          onSwitchToVoiceGuide?.()
        }}
      />
    </div>
  )
}
