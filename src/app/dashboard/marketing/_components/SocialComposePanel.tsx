'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialDraft } from './SocialDraftList'

const GOLD = '#C9A84C'
const ACCEPTED_TYPES = 'image/*,video/*'
const MAX_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

type UploadedFile = {
  name: string
  path: string
  url: string
  size: number
  type: string
}

type Props = {
  onDraftCreated: (draft: SocialDraft) => void
  onClose: () => void
  onBuildCarousel?: () => void
}

const PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'All'] as const
const FORMATS = ['Single Image', 'Carousel', 'Video', 'Reel Script', 'Text Only'] as const
const CLAUDE_FORMAT = '\u2728 Let Claude Decide' as const

/** Map display format names to DB-compatible snake_case values */
const FORMAT_TO_DB: Record<string, string> = {
  'Single Image': 'single_image',
  'Carousel': 'carousel',
  'Video': 'video',
  'Reel Script': 'reel_script',
  'Text Only': 'text_only',
}

export default function SocialComposePanel({ onDraftCreated, onClose, onBuildCarousel }: Props) {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState<string>('All')
  const [format, setFormat] = useState<string | null>(null) // null = let Claude decide
  const [loading, setLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const toUpload = Array.from(fileList)
    if (files.length + toUpload.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const oversized = toUpload.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setUploadError(`${oversized.name} exceeds 50 MB limit`)
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploadError('Not authenticated'); return }

      const uploaded: UploadedFile[] = []
      for (const file of toUpload) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${user.id}/social/${Date.now()}_${safeName}`

        const { error } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, { contentType: file.type })

        if (error) {
          setUploadError(`Upload failed: ${error.message}`)
          continue
        }

        // Generate a signed URL (bucket is authenticated, getPublicUrl won't work)
        const { data: signedData, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600) // 1 hour expiry for preview

        if (signError || !signedData?.signedUrl) {
          setUploadError(`Could not generate preview URL: ${signError?.message || 'Unknown'}`)
          continue
        }

        uploaded.push({
          name: file.name,
          path: storagePath,
          url: signedData.signedUrl,
          size: file.size,
          type: file.type,
        })
      }

      setFiles((prev) => [...prev, ...uploaded])
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [files.length])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }, [uploadFiles])

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setGenerateError(null)

    // Store storage paths (not URLs) — bucket is authenticated
    const mediaPaths = files.length > 0 ? files.map((f) => f.path) : undefined
    // Map format display name to DB-compatible value
    const dbFormat = format ? FORMAT_TO_DB[format] || null : null

    try {
      const res = await fetch('/api/chat/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          compose: true,
          platform: platform.toLowerCase(),
          format: dbFormat,
          mediaUrls: mediaPaths,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
        setGenerateError(errData.error || `Generate failed (${res.status})`)
        return
      }
      const data = await res.json()

      if (data.error) {
        setGenerateError(data.error)
        return
      }

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
          format: dbFormat,
          pillar: null,
          title: data.message?.content?.split('\n')[0]?.slice(0, 40) || 'Untitled post',
          content: data.message?.content || '',
          hashtags: null,
          media_urls: mediaPaths || null,
          status: 'draft',
          scheduled_for: null,
          agent_notes: 'Created via compose mode',
          publer_post_id: null,
          created_by: 'human',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } else {
        setGenerateError('Post was generated but could not be saved. Try again.')
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Network error — could not reach server')
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

        {/* Media upload */}
        <div>
          <label
            className="block font-bold mb-1.5"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            MEDIA (OPTIONAL)
          </label>
          <div
            className={`rounded-md border border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-700'
            }`}
            style={{ background: dragOver ? undefined : '#0a0a14' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {uploading ? (
              <span className="text-zinc-400" style={{ fontSize: 11 }}>
                Uploading...
              </span>
            ) : (
              <span className="text-zinc-500" style={{ fontSize: 11 }}>
                📎 Drag photos or video here, or click to browse
              </span>
            )}
          </div>
          {uploadError && (
            <p className="text-red-400 mt-1" style={{ fontSize: 10 }}>
              {uploadError}
            </p>
          )}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((f, i) => (
                <div
                  key={f.path}
                  className="relative group rounded-md border border-zinc-700 overflow-hidden"
                  style={{ width: 72, height: 72 }}
                >
                  {f.type.startsWith('video/') ? (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <span className="text-zinc-500 text-lg">🎬</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-0 right-0 bg-black/70 text-zinc-300 hover:text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                  <div
                    className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5 truncate"
                    style={{ fontSize: 8 }}
                  >
                    <span className="text-zinc-400">{f.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Carousel shortcut — when Carousel format is selected, offer the visual builder */}
      {format === 'Carousel' && onBuildCarousel && (
        <div className="pt-2">
          <button
            onClick={onBuildCarousel}
            className="w-full py-2 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80"
            style={{
              background: 'transparent',
              color: GOLD,
              border: `1px solid ${GOLD}`,
              fontFamily: 'inherit',
            }}
          >
            BUILD CAROUSEL VISUALLY
          </button>
          <div className="text-center mt-1.5" style={{ color: '#52525b', fontSize: 10 }}>
            Or describe your idea above and let Claude generate it
          </div>
        </div>
      )}

      {/* Generate error */}
      {generateError && (
        <div
          className="rounded-sm px-3 py-2 text-xs font-bold"
          style={{ background: '#1a0505', color: '#E05252', border: '1px solid #E05252' }}
        >
          {generateError}
        </div>
      )}

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
