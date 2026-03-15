'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'

interface MISMOUploadProps {
  onUpload: (file: File) => void
}

export function MISMOUpload({ onUpload }: MISMOUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xml') || file.name.endsWith('.zip'))) {
      processFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    setUploadedFile(file)
    setUploadStatus('uploading')
    
    // Simulate processing
    setTimeout(() => {
      setUploadStatus('success')
      onUpload(file)
    }, 1500)
  }

  const clearFile = () => {
    setUploadedFile(null)
    setUploadStatus('idle')
  }

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[var(--gold)]" />
        <h3 className="text-sm font-medium text-[var(--foreground)]">MISMO 3.4 Upload</h3>
      </div>

      {uploadedFile ? (
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploadStatus === 'success' ? 'bg-green-500/10' : 'bg-[var(--surface-2)]'}`}>
                {uploadStatus === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : uploadStatus === 'uploading' ? (
                  <div className="w-5 h-5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-[var(--muted)]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--foreground)] font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {uploadStatus === 'uploading' ? 'Processing...' : 
                   uploadStatus === 'success' ? 'Successfully parsed' : 
                   `${(uploadedFile.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {uploadStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-green-500">
                MISMO file parsed successfully. Loan data has been extracted and populated into a new scenario.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-[var(--gold)] bg-[var(--gold-dim)]' 
              : 'border-[var(--border)] hover:border-[var(--gold)]'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}`} />
          <p className="text-sm text-[var(--foreground)] mb-1">
            Drag and drop your MISMO 3.4 file here
          </p>
          <p className="text-xs text-[var(--muted)] mb-4">
            Supports .xml and .zip files
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-1)] cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Browse Files
            <input
              type="file"
              accept=".xml,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      <div className="mt-4 p-3 bg-[var(--surface-2)] rounded-lg">
        <p className="text-xs text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">Note:</strong> MISMO 3.4 is the standard format for loan data exchange. 
          Upload files from your LOS or other mortgage systems to auto-populate scenario fields.
        </p>
      </div>
    </div>
  )
}
