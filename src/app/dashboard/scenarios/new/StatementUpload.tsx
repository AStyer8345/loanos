'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import type { CurrentLoanInput, LoanTerm } from '@/lib/scenarios/types'

interface StatementUploadProps {
  onImport: (updates: Partial<CurrentLoanInput> & { borrowerName?: string; propertyAddress?: string }) => void
}

export default function StatementUpload({ onImport }: StatementUploadProps) {
  const [open, setOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<Record<string, any> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return
    }

    setParsing(true)
    setError(null)
    setPreview(null)

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const res = await fetch('/api/scenarios/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Parsing failed')
      }

      const data = await res.json()
      setPreview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse statement')
    } finally {
      setParsing(false)
    }
  }

  const applyImport = () => {
    if (!preview) return

    const termYears = (preview.loanTerm as number) || 30
    const validTerms: LoanTerm[] = [10, 15, 20, 25, 30]
    const closestTerm = validTerms.reduce((prev, curr) =>
      Math.abs(curr - termYears) < Math.abs(prev - termYears) ? curr : prev
    )

    const updates: Partial<CurrentLoanInput> & { borrowerName?: string; propertyAddress?: string } = {}

    if (preview.originalLoanAmount) updates.originalLoanAmount = preview.originalLoanAmount as number
    if (preview.interestRate) updates.interestRate = preview.interestRate as number
    if (preview.loanStartDate) updates.loanStartDate = preview.loanStartDate as string
    if (preview.loanTerm) updates.originalLoanTerm = closestTerm
    if (preview.monthlyPI) updates.currentMonthlyPI = preview.monthlyPI as number
    if (preview.currentBalance) updates.currentPayoffBalance = preview.currentBalance as number
    if (preview.propertyTaxes) updates.propertyTaxes = preview.propertyTaxes as number
    if (preview.insurance) updates.insurance = preview.insurance as number
    if (preview.pmi) updates.pmi = preview.pmi as number
    if (preview.borrowerName) updates.borrowerName = preview.borrowerName as string
    if (preview.propertyAddress) updates.propertyAddress = preview.propertyAddress as string

    onImport(updates)
    setOpen(false)
    setPreview(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-muted/60"
        style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
      >
        <Upload size={12} />
        Upload Statement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--sc-text)' }}>Upload Mortgage Statement</h3>
              <button onClick={() => { setOpen(false); setPreview(null); setError(null) }} className="p-1 rounded hover:bg-muted/60" style={{ color: 'var(--sc-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--sc-muted)' }}>
              Upload a recent mortgage statement PDF. Claude will extract the loan details and auto-fill the current loan fields.
            </p>

            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-amber-500/50"
              style={{ borderColor: 'var(--sc-border)' }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sc-gold)' }} />
                  <p className="text-xs" style={{ color: 'var(--sc-muted)' }}>Analyzing statement with AI...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={24} style={{ color: 'var(--sc-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--sc-muted)' }}>Click to upload mortgage statement PDF</p>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 text-xs" style={{ color: 'var(--sc-red)' }}>{error}</p>
            )}

            {/* Preview extracted fields */}
            {preview && (
              <div className="mt-4">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--sc-gold)' }}>Extracted Fields:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--sc-text)' }}>
                  {preview.borrowerName && <PreviewRow label="Borrower" value={preview.borrowerName as string} />}
                  {preview.propertyAddress && <PreviewRow label="Property" value={preview.propertyAddress as string} />}
                  {preview.originalLoanAmount && <PreviewRow label="Original Amount" value={`$${Number(preview.originalLoanAmount).toLocaleString()}`} />}
                  {preview.currentBalance && <PreviewRow label="Current Balance" value={`$${Number(preview.currentBalance).toLocaleString()}`} />}
                  {preview.interestRate && <PreviewRow label="Rate" value={`${preview.interestRate}%`} />}
                  {preview.loanTerm && <PreviewRow label="Term" value={`${preview.loanTerm} years`} />}
                  {preview.loanStartDate && <PreviewRow label="Start Date" value={preview.loanStartDate as string} />}
                  {preview.monthlyPI && <PreviewRow label="Monthly P&I" value={`$${Number(preview.monthlyPI).toLocaleString()}`} />}
                  {preview.propertyTaxes && <PreviewRow label="Taxes/mo" value={`$${Number(preview.propertyTaxes).toLocaleString()}`} />}
                  {preview.insurance && <PreviewRow label="Insurance/mo" value={`$${Number(preview.insurance).toLocaleString()}`} />}
                  {preview.pmi && <PreviewRow label="PMI/mo" value={`$${Number(preview.pmi).toLocaleString()}`} />}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={applyImport}
                    className="flex-1 px-4 py-2 rounded-md text-xs font-semibold transition-colors"
                    style={{ background: 'var(--sc-gold)', color: '#0a0a0a' }}
                  >
                    Apply to Current Loan
                  </button>
                  <button
                    onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="px-4 py-2 rounded-md text-xs font-medium transition-colors"
                    style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ color: 'var(--sc-muted)' }}>{label}</span>
      <span className="font-mono text-right">{value}</span>
    </>
  )
}
