'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialDraft } from './SocialDraftList'
import MediaManager from './MediaManager'
import SocialPostPreview from './SocialPostPreview'

const GOLD = '#C9A84C'
const BRAND_GOLD = '#C9A84C'

/** Lightweight inline markdown → HTML for social post preview.
 *  Handles: **bold**, *italic*, --- hr, and lines starting with - as bullets. */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #27272a;margin:8px 0" />')
    .replace(/^- (.+)$/gm, '<span style="display:flex;gap:6px;margin-bottom:2px"><span style="color:#C9A84C;flex-shrink:0">•</span><span>$1</span></span>')
}

/** Parse "SLIDE N" blocks from post content for carousel preview.
 *  Supports ALL agent formats:
 *    SLIDE 1 — HOOK           (carousel builder)
 *    **SLIDE 1 — HOOK**       (bold markdown)
 *    [Slide 1 — Hook]         (bracket format)
 *    ## Slide 1 — Hook        (markdown header - agent format)
 */
/** Lines that are Canva design instructions, not displayable content */
const designInstructionPattern = /^\s*(?:\*\*)?(?:Visual|Text on image|Caption starter)(?:\*\*)?:.*$/i

/** Strip metadata, headers, contact blocks, hashtags, and image notes from draft content
 *  so the detail panel only shows the actual post caption. */
function cleanContentForDisplay(content: string): string {
  let text = content.replace(/\r\n/g, '\n')

  // Remove everything from ## Hashtags onward
  text = text.replace(/\n##\s*Hashtags?\b[\s\S]*/i, '')
  // Remove everything from ## Image Notes onward
  text = text.replace(/\n##\s*Image\s+Notes?\b[\s\S]*/i, '')
  // Remove ## LinkedIn Version section
  text = text.replace(/\n##\s*LinkedIn\s*Version[^\n]*\n[\s\S]*?(?=\n##\s|$)/i, '')
  // Remove ## Caption header line (keep the text under it)
  text = text.replace(/^##\s*Caption\s*\n/im, '')

  // Remove title header (# Post — ... or # Title)
  text = text.replace(/^#\s+.*$/gm, '')
  // Remove **NMLS Disclosure:** lines
  text = text.replace(/^\*\*NMLS\s+Disclosure:\*\*.*$/gm, '')
  // Remove contact block: **Name | Company**, NMLS#, email, phone lines
  text = text.replace(/^\*\*Adam Styer[^*]*\*\*\s*$/gm, '')
  text = text.replace(/^NMLS#\s*\d+\s*$/gm, '')
  text = text.replace(/^[📧📱🏢]\s*.*$/gm, '')
  // Remove --- dividers
  text = text.replace(/^---\s*$/gm, '')

  // Collapse excess blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}

function parseSlides(content: string): { intro: string; slides: { num: number; title: string; body: string }[] } {
  // Strip UI artifacts that got saved into content
  let cleaned = content.replace(/^(?:CLAUDE|APPLY TO POST|YOU|SEND)\s*\n/gim, '')

  // Cut off content at design brief section (agent sometimes appends Canva specs)
  const briefIdx = cleaned.search(/\n---\s*\n+\s*(?:#{1,3}\s+)?(?:CANVA|DESIGN)\s+(?:DESIGN\s+)?BRIEF/i)
  if (briefIdx > 0) cleaned = cleaned.substring(0, briefIdx)
  // Cut off at hashtag section, FULL CAPTION, or Agent Notes
  const hashIdx = cleaned.search(/\n---\s*\n+\s*\*\*Hashtags?\*\*\s*:/i)
  if (hashIdx > 0) cleaned = cleaned.substring(0, hashIdx)
  const captionIdx = cleaned.search(/\n\s*(?:#{1,3}\s+)?(?:\*\*)?FULL CAPTION(?:\*\*)?:?\s*\n/i)
  if (captionIdx > 0) cleaned = cleaned.substring(0, captionIdx)
  const agentIdx = cleaned.search(/\n---\s*\n+\s*(?:\*\*)?Agent\s+Notes?\s*(?:\*\*)?:?/i)
  if (agentIdx > 0) cleaned = cleaned.substring(0, agentIdx)

  // Remove horizontal rules and metadata lines
  cleaned = cleaned
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')

  const slideRegex = /(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+(\d+)(?:\s*[—–:\-]\s*([^\n\]*]*))?(?:\*\*|\])?\s*\n([\s\S]*?)(?=(?:\n\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+\d)|$)/gi
  const slides: { num: number; title: string; body: string }[] = []
  let match: RegExpExecArray | null

  while ((match = slideRegex.exec(cleaned)) !== null) {
    const num = parseInt(match[1], 10)
    const title = (match[2] || '').trim().replace(/\*\*/g, '').replace(/\]$/, '').replace(/\(.*?\)\s*$/, '').trim()
    let body = (match[3] || '').trim().replace(/^\n+|\n+$/g, '')
    body = body.replace(/\*\*([^*]+)\*\*/g, '$1')
    // Strip design instructions from slide bodies
    body = body
      .split('\n')
      .filter((l) => !designInstructionPattern.test(l))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (body || title) {
      slides.push({ num, title, body })
    }
  }

  // Extract intro text (everything before first SLIDE reference), stripping metadata + design instructions
  const firstSlideIdx = cleaned.search(/(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+1\b/i)
  const metaPattern = /^\s*(?:#{1,3}\s+)?(?:\*\*)?(?:TITLE|PLATFORM|FORMAT|PILLAR|CURRENT CONTENT|CAPTION(\s*\(.*?\))?)(?:\*\*)?\s*:?/i
  const postTitlePattern = /^\s*#{1,3}\s+Post\s+\d+\s*[—–:-].*/i
  const introRaw = firstSlideIdx > 0 ? cleaned.substring(0, firstSlideIdx) : ''
  const intro = introRaw
    .split('\n')
    .filter((l) => !metaPattern.test(l) && !postTitlePattern.test(l) && !designInstructionPattern.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

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

/** Branded slide card — renders one carousel slide as a compact preview that fits the detail panel */
function SlideCard({ slide, total }: { slide: { num: number; title: string; body: string }; total: number }) {
  const isFirst = slide.num === 1
  const isLast = slide.num === total
  const isCTA = isLast || /cta/i.test(slide.title)

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isCTA ? BRAND_GOLD : '#27272a'}`,
        padding: '16px 18px',
      }}
    >
      {/* Slide badge row */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-bold"
          style={{
            color: BRAND_GOLD,
            fontSize: 10,
            letterSpacing: '0.1em',
            background: '#1a1a2e',
            padding: '2px 8px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {slide.num} / {total}
        </span>
        {slide.title && (
          <span
            className="font-bold truncate"
            style={{ color: '#a1a1aa', fontSize: 10, letterSpacing: '0.05em' }}
          >
            {slide.title.toUpperCase()}
          </span>
        )}
      </div>

      {/* Slide content */}
      {isFirst ? (
        <>
          <div
            className="font-bold mb-1"
            style={{ color: BRAND_GOLD, fontSize: 15, lineHeight: 1.3 }}
          >
            {slide.body.split('\n')[0]}
          </div>
          {slide.body.split('\n').slice(1).join('\n').trim() && (
            <div style={{ color: '#d4d4d8', fontSize: 12, lineHeight: 1.6 }}>
              {slide.body.split('\n').slice(1).join('\n').trim()}
            </div>
          )}
        </>
      ) : (
        <div
          className="whitespace-pre-wrap"
          style={{
            color: isCTA ? BRAND_GOLD : '#d4d4d8',
            fontSize: 12,
            lineHeight: 1.6,
            fontWeight: isCTA ? 600 : 400,
          }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(slide.body) }}
        />
      )}
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
    // No slides detected — strip metadata and render clean caption only
    const displayText = cleanContentForDisplay(draft.content || '')
    return (
      <div
        className="rounded-md border border-input px-3 py-2.5 text-foreground/80 whitespace-pre-wrap"
        style={{ background: 'var(--surface)', fontSize: 12, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(displayText || '(empty)') }}
      />
    )
  }

  const safeIndex = Math.min(slideIndex, slides.length - 1)
  const currentSlide = slides[safeIndex]

  return (
    <div className="space-y-3">
      {/* Caption / intro text */}
      {intro && (
        <div
          className="rounded-md border border-input px-3 py-2 text-foreground/80 whitespace-pre-wrap"
          style={{ background: 'var(--surface)', fontSize: 12, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(intro) }}
        />
      )}

      {/* Slide card */}
      <SlideCard slide={currentSlide} total={slides.length} />

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSlideIndex(Math.max(0, safeIndex - 1))}
          disabled={safeIndex === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
          style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
        >
          &#8592;
        </button>

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
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
          style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
        >
          &#8594;
        </button>
      </div>
    </div>
  )
}

const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'single_image', label: 'Single Image' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'video', label: 'Video' },
  { value: 'reel_script', label: 'Reel Script' },
  { value: 'text_only', label: 'Text Only' },
]

function FormatSwitcher({ current, onChange }: { current: string | null; onChange: (fmt: string) => void }) {
  const [open, setOpen] = useState(false)
  const label = FORMAT_OPTIONS.find((f) => f.value === current)?.label || current || 'No format'

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-0.5 rounded-sm text-xs font-bold transition-colors hover:opacity-80"
        style={{
          background: 'transparent',
          color: GOLD,
          border: `1px solid ${GOLD}`,
          fontFamily: 'inherit',
          fontSize: 10,
          letterSpacing: '0.05em',
        }}
      >
        {label.toUpperCase()} ▾
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-sm border border-input py-1 z-50"
          style={{ background: '#18181b', minWidth: 140 }}
        >
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => { onChange(f.value); setOpen(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs font-bold transition-colors hover:bg-muted"
              style={{
                color: f.value === current ? GOLD : '#a1a1aa',
                fontFamily: 'inherit',
                fontSize: 10,
                letterSpacing: '0.05em',
              }}
            >
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}
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
  const [slideIndex, setSlideIndex] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

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

  /** When media paths change via MediaManager, update the draft and re-resolve signed URLs */
  const handleMediaChange = useCallback((newPaths: string[]) => {
    onUpdate({ ...draft, media_urls: newPaths.length > 0 ? newPaths : null })
  }, [draft, onUpdate])

  const handleFormatChange = useCallback((fmt: string) => {
    onUpdate({ ...draft, format: fmt })
  }, [draft, onUpdate])

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-input">
        <div>
          <div className="text-white font-bold" style={{ fontSize: 15 }}>
            {draft.title || 'Untitled'}
          </div>
          <div className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 11 }}>
            <span>{subtitle}</span>
            <FormatSwitcher current={draft.format} onChange={handleFormatChange} />
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
                className="w-full rounded-md border border-input text-foreground text-xs px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                style={{ background: 'var(--surface)', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 rounded-sm text-xs font-bold text-muted-foreground transition-opacity hover:opacity-80"
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

        {/* Media manager — add, remove, reorder */}
        <MediaManager
          mediaPaths={draft.media_urls || []}
          signedUrls={signedMediaUrls}
          onChange={handleMediaChange}
        />

        {/* Action buttons */}
        {!editing && (
          <>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowPreview(true)}
                className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: '#8B5CF6',
                  border: '1px solid #8B5CF6',
                  fontFamily: 'inherit',
                }}
              >
                PREVIEW
              </button>
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
                    color: 'var(--bg)',
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
                    color: 'var(--bg)',
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
                    background: 'var(--bg)',
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
              className="rounded-md border border-input px-3 py-2.5 text-muted-foreground whitespace-pre-wrap"
              style={{ background: 'var(--surface)', fontSize: 11, lineHeight: 1.5 }}
            >
              {draft.agent_notes}
            </div>
          </div>
        )}
      </div>

      {/* 3. Chat panel */}
      <div className="border-t border-input p-3 space-y-2">
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
                  background: msg.role === 'user' ? '#1a1a2e' : 'var(--surface)',
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
                        color: 'var(--bg)',
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
            className="flex-1 bg-background border border-input text-foreground text-xs rounded-sm px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
            className="px-3 py-1.5 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
          >
            {chatLoading ? '...' : 'SEND'}
          </button>
        </div>

        <div className="text-muted-foreground" style={{ fontSize: 10 }}>
          Claude sees this post + your voice guide automatically
        </div>
      </div>

      {/* Platform preview modal */}
      {showPreview && (
        <SocialPostPreview
          draft={draft}
          signedMediaUrls={signedMediaUrls}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
