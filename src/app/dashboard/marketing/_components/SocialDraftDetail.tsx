'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialDraft } from './SocialDraftList'

const GOLD = '#C9A84C'
const BRAND_BG = '#0a0a0a'
const BRAND_GOLD = '#C9A84C'

/** Parse "SLIDE N" blocks from post content for carousel preview */
function parseSlides(content: string): { intro: string; slides: { num: number; title: string; body: string }[] } {
  // Match patterns like "SLIDE 1:", "SLIDE 1 —", "SLIDE 1 — HOOK", etc.
  const slideRegex = /(?:^|\n)\s*(?:\*\*)?SLIDE\s+(\d+)(?:\s*[—–:-]\s*([^\n*]*))?(?:\*\*)?\s*\n?([\s\S]*?)(?=(?:\n\s*(?:\*\*)?SLIDE\s+\d)|$)/gi
  const slides: { num: number; title: string; body: string }[] = []
  let match: RegExpExecArray | null

  while ((match = slideRegex.exec(content)) !== null) {
    const num = parseInt(match[1], 10)
    const title = (match[2] || '').trim().replace(/\*\*/g, '')
    const body = (match[3] || '').trim().replace(/\*\*/g, '').replace(/^\n+|\n+$/g, '')
    if (body || title) {
      slides.push({ num, title, body })
    }
  }

  // Extract intro text (everything before first SLIDE reference)
  const firstSlideIdx = content.search(/(?:^|\n)\s*(?:\*\*)?SLIDE\s+1\b/i)
  const intro = firstSlideIdx > 0 ? content.substring(0, firstSlideIdx).trim() : ''

  return { intro, slides }
}

type Props = {
  draft: SocialDraft
  onUpdate: (draft: SocialDraft) => void
  onDelete: (id: string) => void
  onOpenVoiceGuide: () => void
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Branded slide card — renders one carousel slide as a visual preview */
function SlideCard({ slide, total }: { slide: { num: number; title: string; body: string }; total: number }) {
  const isFirst = slide.num === 1
  const isLast = slide.num === total
  const isTLDR = /tl;?dr/i.test(slide.title) || /tl;?dr/i.test(slide.body.substring(0, 20))
  const isCTA = isLast || /cta/i.test(slide.title)

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col justify-between"
      style={{
        background: BRAND_BG,
        border: `1px solid ${isCTA ? BRAND_GOLD : '#1a1a1a'}`,
        aspectRatio: '1 / 1',
        width: '100%',
        maxWidth: 400,
        padding: isFirst ? '32px 28px' : '24px 24px',
        fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top: slide number badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold tracking-wider"
          style={{ color: '#52525b', fontSize: 9, letterSpacing: '0.15em' }}
        >
          SLIDE {slide.num} OF {total}
        </span>
        {slide.title && !isFirst && (
          <span
            className="text-xs font-bold tracking-wider"
            style={{ color: BRAND_GOLD, fontSize: 9, letterSpacing: '0.1em' }}
          >
            {slide.title.toUpperCase()}
          </span>
        )}
      </div>

      {/* Middle: content */}
      <div className="flex-1 flex flex-col justify-center">
        {isFirst ? (
          // First slide — hero treatment
          <>
            <div
              className="font-bold leading-tight mb-3"
              style={{ color: BRAND_GOLD, fontSize: 20, lineHeight: 1.25 }}
            >
              {slide.body.split('\n')[0]}
            </div>
            {slide.body.split('\n').slice(1).join('\n').trim() && (
              <div
                className="leading-relaxed"
                style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.6 }}
              >
                {slide.body.split('\n').slice(1).join('\n').trim()}
              </div>
            )}
          </>
        ) : isTLDR ? (
          // TL;DR slide — bullet style
          <>
            <div
              className="font-bold mb-3"
              style={{ color: BRAND_GOLD, fontSize: 16 }}
            >
              TL;DR
            </div>
            <div style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.8 }}>
              {slide.body.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <span style={{ color: BRAND_GOLD, flexShrink: 0 }}>•</span>
                  <span>{line.replace(/^[•·-]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </>
        ) : isCTA ? (
          // CTA slide — gold accent heavy
          <div className="text-center">
            {slide.body.split('\n').filter(Boolean).map((line, i) => (
              <div
                key={i}
                className="mb-2"
                style={{
                  color: i === 0 ? BRAND_GOLD : '#a1a1aa',
                  fontSize: i === 0 ? 16 : 12,
                  fontWeight: i === 0 ? 700 : 400,
                  lineHeight: 1.5,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        ) : (
          // Normal content slide
          <div
            className="whitespace-pre-wrap leading-relaxed"
            style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.7 }}
          >
            {slide.body}
          </div>
        )}
      </div>

      {/* Bottom: branding bar */}
      <div
        className="flex items-center justify-between pt-3 mt-3"
        style={{ borderTop: `1px solid #1a1a1a` }}
      >
        <span style={{ color: '#52525b', fontSize: 9, letterSpacing: '0.05em' }}>
          Adam Styer | Mortgage Solutions LP
        </span>
        {isCTA && (
          <span style={{ color: BRAND_GOLD, fontSize: 9, fontWeight: 700 }}>
            NMLS# 513013
          </span>
        )}
      </div>
    </div>
  )
}

/** Shows branded slide carousel for carousel/multi-slide posts, plain text for others */
function SlidePreviewOrText({
  draft,
  slideIndex,
  setSlideIndex,
}: {
  draft: SocialDraft
  slideIndex: number
  setSlideIndex: (i: number) => void
}) {
  const { intro, slides } = parseSlides(draft.content || '')
  const hasSlides = slides.length >= 2

  if (!hasSlides) {
    // No slides detected — show plain text
    return (
      <div
        className="rounded-md border border-zinc-800 px-3 py-2.5 text-zinc-300 whitespace-pre-wrap"
        style={{ background: '#111118', fontSize: 12, lineHeight: 1.6 }}
      >
        {draft.content || '(empty)'}
      </div>
    )
  }

  const safeIndex = Math.min(slideIndex, slides.length - 1)
  const currentSlide = slides[safeIndex]

  return (
    <div className="space-y-3">
      {/* Caption / intro text */}
      {intro && (
        <div>
          <div
            className="font-bold mb-1"
            style={{ color: '#71717a', fontSize: 9, letterSpacing: '0.15em' }}
          >
            CAPTION
          </div>
          <div
            className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300 whitespace-pre-wrap"
            style={{ background: '#111118', fontSize: 12, lineHeight: 1.6 }}
          >
            {intro}
          </div>
        </div>
      )}

      {/* Slide visual preview */}
      <div>
        <div
          className="font-bold mb-2 flex items-center justify-between"
          style={{ color: '#71717a', fontSize: 9, letterSpacing: '0.15em' }}
        >
          <span>SLIDE PREVIEW</span>
          <span style={{ color: BRAND_GOLD }}>
            {safeIndex + 1} / {slides.length}
          </span>
        </div>

        {/* The branded slide card */}
        <div className="flex justify-center">
          <SlideCard slide={currentSlide} total={slides.length} />
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => setSlideIndex(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
            style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
          >
            ←
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === safeIndex ? 16 : 6,
                  height: 6,
                  background: i === safeIndex ? BRAND_GOLD : '#3f3f46',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setSlideIndex(Math.min(slides.length - 1, safeIndex + 1))}
            disabled={safeIndex === slides.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
            style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SocialDraftDetail({ draft, onUpdate, onDelete, onOpenVoiceGuide }: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(draft.content || '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [mediaIndex, setMediaIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const mediaScrollRef = useRef<HTMLDivElement>(null)

  // Signed URLs for media (bucket is authenticated, raw URLs don't work)
  const [signedMediaUrls, setSignedMediaUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = draft.media_urls
    if (!urls || urls.length === 0) {
      setSignedMediaUrls([])
      return
    }

    let cancelled = false
    async function resolveUrls() {
      const supabase = createClient()
      const resolved: string[] = []
      for (const urlOrPath of urls!) {
        // If it's already a signed URL or external URL, use as-is
        if (urlOrPath.includes('token=') || !urlOrPath.includes('supabase') && urlOrPath.startsWith('http') && !urlOrPath.includes('/storage/v1/')) {
          resolved.push(urlOrPath)
          continue
        }
        // Extract the storage path from a full Supabase URL or use as bare path
        let storagePath = urlOrPath
        const storageIdx = urlOrPath.indexOf('/storage/v1/object/')
        if (storageIdx !== -1) {
          // Format: .../storage/v1/object/public/documents/path or .../authenticated/documents/path
          const afterStorage = urlOrPath.substring(storageIdx + '/storage/v1/object/'.length)
          // Remove "public/documents/" or "authenticated/documents/" prefix
          storagePath = afterStorage.replace(/^(public|authenticated)\/documents\//, '')
        }
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600)
        if (!error && data?.signedUrl) {
          resolved.push(data.signedUrl)
        } else {
          // Fallback — use original URL (may still be broken but better than nothing)
          resolved.push(urlOrPath)
        }
      }
      if (!cancelled) setSignedMediaUrls(resolved)
    }
    resolveUrls()
    return () => { cancelled = true }
  }, [draft.media_urls])

  // Reset edit state when draft changes (id or content)
  const [prevId, setPrevId] = useState(draft.id)
  const [prevContent, setPrevContent] = useState(draft.content || '')
  if (draft.id !== prevId) {
    setPrevId(draft.id)
    setPrevContent(draft.content || '')
    setEditing(false)
    setEditContent(draft.content || '')
    setMessages([])
    setChatInput('')
    setMediaIndex(0)
    setSlideIndex(0)
    setPublishError(null)
  } else if (draft.content !== prevContent && !editing) {
    // Content updated externally (e.g. APPLY TO POST) — sync edit buffer
    setPrevContent(draft.content || '')
    setEditContent(draft.content || '')
  }

  function handleEdit() {
    setEditing(true)
    setEditContent(draft.content || '')
  }

  function handleSave() {
    setEditing(false)
    const oldContent = draft.content || ''
    const newContent = editContent
    onUpdate({ ...draft, content: editContent })
    // If content actually changed, log the edit as feedback for the agent
    if (oldContent !== newContent) {
      const summary = `[${new Date().toISOString().slice(0, 10)}] EDITED "${draft.title}": Adam manually edited this post. Original started with: "${oldContent.slice(0, 80)}..." — Changed to start with: "${newContent.slice(0, 80)}..."`
      fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_feedback', appendEntry: summary }),
      }).catch(() => { /* non-blocking */ })
    }
  }

  function handleApprove() {
    setPublishError(null)
    onUpdate({ ...draft, status: 'approved' })
  }

  function handleReject() {
    setShowRejectModal(true)
    setRejectReason('')
  }

  async function handleRejectSubmit() {
    if (!rejectReason.trim()) return
    setShowRejectModal(false)
    onUpdate({ ...draft, status: 'rejected', rejection_reason: rejectReason.trim() } as SocialDraft)
    // Store feedback for the agent to learn from
    try {
      const res = await fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_feedback', appendEntry: `[${new Date().toISOString().slice(0, 10)}] REJECTED "${draft.title}": ${rejectReason.trim()}` }),
      })
      if (!res.ok) console.error('Failed to save voice feedback')
    } catch { /* non-blocking */ }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setPublishError(data.error || `Publish failed (${res.status})`)
        return
      }
      onUpdate({ ...draft, status: 'posted' })
    } catch {
      setPublishError('Network error — could not reach publish API')
    } finally {
      setPublishing(false)
    }
  }

  async function handleApproveAndPublish() {
    setPublishing(true)
    setPublishError(null)

    try {
      onUpdate({ ...draft, status: 'approved' })
      await new Promise((resolve) => setTimeout(resolve, 500))

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setPublishError(data.error || `Publish failed (${res.status})`)
        return
      }

      onUpdate({ ...draft, status: 'posted' })
    } catch {
      setPublishError('Network error — could not reach publish API')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this draft?')
    if (!confirmed) return

    setPublishError(null)

    try {
      const res = await fetch('/api/social/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Delete failed' }))
        setPublishError(data.error || `Delete failed (${res.status})`)
        return
      }

      onDelete(draft.id)
    } catch {
      setPublishError('Network error — could not delete draft')
    }
  }

  function isVideo(url: string): boolean {
    return /\.(mp4|mov|webm)(\?|$)/i.test(url)
  }

  async function handleChatSend() {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')

    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          draftId: draft.id,
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')
      const data = await res.json()

      if (data.message) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.message.content }
        setMessages([...nextMessages, assistantMsg])
      }
    } catch {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'Error: could not reach the chat API.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const subtitle = [draft.platform, draft.pillar, formatDate(draft.scheduled_for)]
    .filter(Boolean)
    .join(' \u00B7 ')

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* 1. Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <div className="text-white font-bold" style={{ fontSize: 15 }}>
            {draft.title || 'Untitled'}
          </div>
          <div className="text-zinc-500" style={{ fontSize: 11 }}>
            {subtitle}
          </div>
        </div>
        <button
          onClick={onOpenVoiceGuide}
          className="px-3 py-1 rounded-sm text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
          style={{
            background: 'transparent',
            color: GOLD,
            border: `1px solid ${GOLD}`,
            fontFamily: 'inherit',
          }}
        >
          VOICE GUIDE
        </button>
      </div>

      {/* 2. Content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Post content */}
        <div>
          <div
            className="font-bold mb-2"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            POST CONTENT
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-zinc-800 text-zinc-100 text-xs px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                style={{ background: '#111118', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 rounded-sm text-xs font-bold text-zinc-500 transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #3f3f46', fontFamily: 'inherit' }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <SlidePreviewOrText draft={draft} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
          )}
        </div>

        {/* Media preview */}
        {signedMediaUrls.length > 0 && (
          <div>
            <div
              className="font-bold mb-2"
              style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
            >
              MEDIA
            </div>

            {signedMediaUrls.length === 1 ? (
              // Single media — full width
              <div
                className="rounded-md border border-zinc-800 overflow-hidden"
                style={{ background: '#111118' }}
              >
                {isVideo(signedMediaUrls[0]) ? (
                  <video
                    src={signedMediaUrls[0]}
                    controls
                    className="w-full"
                    style={{ maxHeight: 300, objectFit: 'contain', background: '#000' }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signedMediaUrls[0]}
                    alt="Post media"
                    className="w-full"
                    style={{ maxHeight: 300, objectFit: 'contain' }}
                  />
                )}
              </div>
            ) : (
              // Multiple media — carousel with arrows
              <div className="relative">
                <div
                  ref={mediaScrollRef}
                  className="flex gap-2 overflow-x-auto rounded-md border border-zinc-800 p-2"
                  style={{ background: '#111118', scrollBehavior: 'smooth' }}
                >
                  {signedMediaUrls.map((url, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded overflow-hidden border"
                      style={{
                        borderColor: i === mediaIndex ? GOLD : '#27272a',
                        cursor: 'pointer',
                      }}
                      onClick={() => setMediaIndex(i)}
                    >
                      {isVideo(url) ? (
                        <video
                          src={url}
                          controls={i === mediaIndex}
                          muted
                          style={{ height: 200, width: 'auto', objectFit: 'cover', background: '#000' }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`Media ${i + 1}`}
                          style={{ height: 200, width: 'auto', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Arrow buttons */}
                <button
                  onClick={() => {
                    const prev = Math.max(0, mediaIndex - 1)
                    setMediaIndex(prev)
                    mediaScrollRef.current?.children[prev]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                  }}
                  disabled={mediaIndex === 0}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
                  style={{ background: '#09090bCC', color: '#fff', border: '1px solid #3f3f46' }}
                >
                  &larr;
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(signedMediaUrls.length - 1, mediaIndex + 1)
                    setMediaIndex(next)
                    mediaScrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                  }}
                  disabled={mediaIndex === signedMediaUrls.length - 1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
                  style={{ background: '#09090bCC', color: '#fff', border: '1px solid #3f3f46' }}
                >
                  &rarr;
                </button>

                {/* Index indicator */}
                <div
                  className="text-center mt-1.5 font-bold"
                  style={{ color: '#71717a', fontSize: 10, letterSpacing: '0.1em' }}
                >
                  {mediaIndex + 1} / {signedMediaUrls.length}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!editing && (
          <>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: '#4CAF82',
                  border: '1px solid #4CAF82',
                  fontFamily: 'inherit',
                }}
              >
                APPROVE
              </button>
              {draft.status === 'draft' && (
                <button
                  onClick={handleApproveAndPublish}
                  disabled={publishing}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-60"
                  style={{
                    background: GOLD,
                    color: '#09090b',
                    fontFamily: 'inherit',
                  }}
                >
                  {publishing ? 'PUBLISHING...' : 'APPROVE & PUBLISH'}
                </button>
              )}
              <button
                onClick={handleEdit}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: '#3B82F6',
                  border: '1px solid #3B82F6',
                  fontFamily: 'inherit',
                }}
              >
                EDIT
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: '#E05252',
                  border: '1px solid #E05252',
                  fontFamily: 'inherit',
                }}
              >
                REJECT
              </button>
              <button
                onClick={handleDelete}
                className="ml-auto px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: '#71717a',
                  border: '1px solid #3f3f46',
                  fontFamily: 'inherit',
                }}
              >
                DELETE
              </button>
              {draft.status === 'approved' && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-60"
                  style={{
                    background: GOLD,
                    color: '#09090b',
                    fontFamily: 'inherit',
                  }}
                >
                  {publishing ? 'PUBLISHING...' : 'PUBLISH TO PUBLER'}
                </button>
              )}
            </div>
            {publishError && (
              <div
                className="rounded-sm px-3 py-2 text-xs font-bold"
                style={{ background: '#1a0505', color: '#E05252', border: '1px solid #E05252' }}
              >
                {publishError}
              </div>
            )}
            {showRejectModal && (
              <div
                className="rounded-sm p-3 space-y-2"
                style={{ background: '#1a0a0a', border: '1px solid #E05252' }}
              >
                <div className="text-xs font-bold" style={{ color: '#E05252', letterSpacing: '0.1em' }}>
                  WHY ARE YOU REJECTING THIS?
                </div>
                <div className="text-xs" style={{ color: '#a1a1aa' }}>
                  This helps the AI learn your voice. Be specific — e.g. &quot;I never debate lock vs float&quot; or &quot;too corporate sounding&quot;
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="What's wrong with this post..."
                  className="w-full rounded-sm p-2 text-sm resize-none"
                  style={{
                    background: '#09090b',
                    color: '#fafafa',
                    border: '1px solid #27272a',
                    fontFamily: 'inherit',
                    minHeight: 60,
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRejectSubmit}
                    disabled={!rejectReason.trim()}
                    className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: '#E05252', color: '#fff', fontFamily: 'inherit' }}
                  >
                    REJECT
                  </button>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ background: 'transparent', color: '#71717a', border: '1px solid #27272a', fontFamily: 'inherit' }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Agent notes */}
        {draft.agent_notes && (
          <div>
            <div
              className="font-bold mb-2"
              style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
            >
              AGENT NOTES
            </div>
            <div
              className="rounded-md border border-zinc-800 px-3 py-2.5 text-zinc-500 whitespace-pre-wrap"
              style={{ background: '#111118', fontSize: 11, lineHeight: 1.5 }}
            >
              {draft.agent_notes}
            </div>
          </div>
        )}
      </div>

      {/* 3. Chat panel */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        <div
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          CHAT &mdash; EDITING &lsquo;{draft.title || 'Untitled'}&rsquo;
        </div>

        {/* Message list */}
        {messages.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="text-xs rounded-sm px-2 py-1.5"
                style={{
                  background: msg.role === 'user' ? '#1a1a2e' : '#111118',
                  color: msg.role === 'user' ? '#e4e4e7' : '#a1a1aa',
                  borderLeft: msg.role === 'assistant' ? `2px solid ${GOLD}` : '2px solid #3f3f46',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ fontSize: 9, color: msg.role === 'user' ? '#71717a' : GOLD }}>
                    {msg.role === 'user' ? 'YOU' : 'CLAUDE'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => onUpdate({ ...draft, content: msg.content })}
                      className="px-2 py-0.5 rounded-sm font-bold transition-opacity hover:opacity-80"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        background: GOLD,
                        color: '#09090b',
                        fontFamily: 'inherit',
                      }}
                    >
                      APPLY TO POST
                    </button>
                  )}
                </div>
                <div className="mt-0.5 whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleChatSend()
              }
            }}
            placeholder="Tell Claude how to edit this post..."
            disabled={chatLoading}
            className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-sm px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
            className="px-3 py-1.5 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
          >
            {chatLoading ? '...' : 'SEND'}
          </button>
        </div>

        <div className="text-zinc-600" style={{ fontSize: 10 }}>
          Claude sees this post + your voice guide automatically
        </div>
      </div>
    </div>
  )
}
