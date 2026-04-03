'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
          Media
        </span>
        <span className="text-muted-foreground text-[10px] tabular-nums">
          {mediaPaths.length} / {MAX_FILES}
        </span>
      </div>

      {/* Thumbnails with reorder + remove */}
      {signedUrls.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-3">
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
              className={cn(
                'relative group rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing transition-all',
                dropTarget === i && dragIndex !== null ? 'border-primary ring-1 ring-primary/30' : 'border-input',
                dragIndex === i && 'opacity-40',
              )}
              style={{ width: 80, height: 80 }}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-card flex items-center justify-center">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
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
              <div className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold bg-background/80 text-primary backdrop-blur-sm">
                {i + 1}
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white"
              >
                &times;
              </button>

              {/* Drag hint */}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-muted-foreground backdrop-blur-sm">
                drag to reorder
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      <div
        className={cn(
          'rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(201,168,76,0.05)]'
            : 'border-input bg-card/50 hover:border-muted-foreground/40 hover:bg-card',
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (dragIndex === null) setDragOver(true)
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
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-muted-foreground text-xs">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-muted-foreground text-xs">
              Drop photos or video here, or <span className="text-primary font-medium">browse</span>
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-destructive text-[10px] mt-2 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
