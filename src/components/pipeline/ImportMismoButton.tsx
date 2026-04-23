'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'

export default function ImportMismoButton() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const resetForRetry = () => {
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const resetAll = () => {
    resetForRetry()
    setError(null)
    setDuplicateMsg(null)
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Please upload a .xml file')
      return
    }

    setImporting(true)
    setError(null)
    setDuplicateMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/mismo/import', {
        method: 'POST',
        body: formData,
      })

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        setError(`Server returned ${res.status}. Try again or contact support.`)
        resetForRetry()
        return
      }

      const data = (await res.json()) as {
        loan_id?: string
        contact_id?: string
        duplicate?: boolean
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Import failed')
        resetForRetry()
        return
      }

      if (data.duplicate) {
        setDuplicateMsg('Loan already exists — opening it')
        redirectTimerRef.current = setTimeout(
          () => router.push(`/dashboard/loans/${data.loan_id}`),
          800,
        )
      } else {
        router.push(`/dashboard/loans/${data.loan_id}`)
      }
    } catch (e) {
      setError('Upload failed. Check your connection and try again.')
      resetForRetry()
      console.error(e)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (importing) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const closeModal = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    setShowModal(false)
    resetAll()
  }

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, importing])

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
      >
        <Upload size={13} />
        Import MISMO
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => { if (!importing) closeModal() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-mismo-title"
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                id="import-mismo-title"
                className="text-sm font-semibold"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Import MISMO 3.4 File
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                style={{ color: 'var(--sc-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                if (!importing) fileRef.current?.click()
              }}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-solid"
              style={{
                borderColor: 'var(--sc-border)',
                cursor: importing ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.6 : 1,
              }}
            >
              <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--sc-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--sc-muted)' }}>
                {importing ? 'Importing...' : 'Drop .xml file here, or click to browse'}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              className="hidden"
              disabled={importing}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            {error && (
              <p className="text-xs mt-2" style={{ color: 'var(--sc-red)' }}>
                {error}
              </p>
            )}
            {duplicateMsg && (
              <p className="text-xs mt-2" style={{ color: 'var(--sc-muted)' }}>
                {duplicateMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
