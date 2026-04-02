'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const GOLD = '#C9A84C'
const ACCEPTED_TYPES = 'image/*,video/*'
const MAX_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

type Props = {
  /** Storage paths (not URLs) currently attached to the draft */
  mediaPaths: string[]
  /** Already-resolved signed URLs matching mediaPaths by index */
  signedUrls: string[]
  /** Called with updated storage paths array whenever media changes */
  onChange: (paths: string[]) => void
}

export default function MediaManager({ mediaPaths, signedUrls, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const toUpload = Array.from(fileList)
    if (mediaPaths.length + toUpload.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const oversized = toUpload.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`${oversized.name} exceeds 50 MB limit`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); return }

      const newPaths: string[] = []
      for (const file of toUpload) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${user.id}/social/${Date.now()}_${safeName}`

        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, { contentType: file.type })

        if (uploadErr) {
          setError(`Upload failed: ${uploadErr.message}`)
          continue
        }
        newPaths.push(storagePath)
      }

      if (newPaths.length > 0) {
        onChange([...mediaPaths, ...newPaths])
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [mediaPaths, onChange])

  const removeFile = useCallback((index: number) => {
    onChange(mediaPaths.filter((_, i) => i !== index))
  }, [mediaPaths, onChange])

  function isVideo(urlOrPath: string): boolean {
    return /\.(mp4|mov|webm)(\?|$)/i.test(urlOrPath)
  }

  return (
    <div>
      <div
        className="font-bold mb-2 flex items-center justify-between"
        style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
      >
        <span>MEDIA</span>
        <span className="text-muted-foreground" style={{ fontSize: 10, letterSpacing: 'normal' }}>
          {mediaPaths.length} / {MAX_FILES}
        </span>
      </div>

      {/* Thumbnails with reorder + remove */}
      {signedUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {signedUrls.map((url, i) => (
            <div
              key={mediaPaths[i] || i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(i) }}
              onDragEnd={() => { setDragIndex(null); setDropTarget(null) }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (dragIndex !== null && dragIndex !== i) {
                  const reordered = [...mediaPaths]
                  const [moved] = reordered.splice(dragIndex, 1)
                  reordered.splice(i, 0, moved)
                  onChange(reordered)
                }
                setDragIndex(null)
                setDropTarget(null)
              }}
              className="relative group rounded-md border overflow-hidden cursor-grab active:cursor-grabbing transition-all"
              style={{
                width: 80,
                height: 80,
                borderColor: dropTarget === i && dragIndex !== null ? GOLD : '#3f3f46',
                opacity: dragIndex === i ? 0.4 : 1,
              }}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-card flex items-center justify-center">
                  <span className="text-muted-foreground text-xs font-bold">VIDEO</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Order badge */}
              <div
                className="absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                style={{ background: 'var(--bg)CC', color: GOLD, fontSize: 9 }}
              >
                {i + 1}
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: '#E05252', color: '#fff', fontSize: 10 }}
              >
                &times;
              </button>

              {/* Drag hint */}
              <div
                className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: 8, color: '#a1a1aa' }}
              >
                drag to reorder
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={`rounded-md border border-dashed px-4 py-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-yellow-500 bg-yellow-500/5' : 'border-input'
        }`}
        style={{ background: dragOver ? undefined : '#0a0a14' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (dragIndex === null) setDragOver(true) // only for external files
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (dragIndex === null && e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files)
          }
        }}
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
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            Uploading...
          </span>
        ) : (
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            + Add photos or video (drag &amp; drop or click)
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-400 mt-1" style={{ fontSize: 10 }}>
          {error}
        </p>
      )}
    </div>
  )
}
