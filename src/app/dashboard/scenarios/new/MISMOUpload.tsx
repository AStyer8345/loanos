'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Check, X } from 'lucide-react'
import type { ParsedMismo } from '@/lib/mismo/parse'

interface MISMOUploadProps {
  onImport: (data: Record<string, unknown>) => void
}

// Convert loan term in months to the nearest standard LoanTerm year (30/25/20/15/10).
// Keeps the shape ScenarioBuilder already expects (years, not months).
function mapMonthsToYears(months: number | null): number | null {
  if (!months || months <= 0) return null
  const years = months / 12
  if (years <= 10) return 10
  if (years <= 15) return 15
  if (years <= 20) return 20
  if (years <= 25) return 25
  return 30
}

function flatten(parsed: ParsedMismo): Record<string, unknown> {
  const firstName = parsed.borrower.first_name
  const lastName = parsed.borrower.last_name
  const borrowerName = [firstName, lastName].filter(Boolean).join(' ') || null

  const addressParts = [
    parsed.property.address,
    parsed.property.city,
    parsed.property.state,
    parsed.property.zip,
  ].filter(Boolean)
  const propertyAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  const flat: Record<string, unknown> = {}
  if (borrowerName) flat.borrowerName = borrowerName
  if (propertyAddress) flat.propertyAddress = propertyAddress
  if (parsed.property.purchase_price != null) flat.purchasePrice = parsed.property.purchase_price
  if (parsed.property.property_taxes_monthly != null)
    flat.propertyTaxes = parsed.property.property_taxes_monthly
  if (parsed.property.insurance_monthly != null) flat.insurance = parsed.property.insurance_monthly
  if (parsed.loan.loan_amount != null) flat.loanAmount = parsed.loan.loan_amount
  if (parsed.loan.interest_rate != null) flat.interestRate = parsed.loan.interest_rate
  if (parsed.loan.loan_type) flat.loanType = parsed.loan.loan_type
  const termYears = mapMonthsToYears(parsed.loan.loan_term_months)
  if (termYears != null) flat.loanTerm = termYears
  if (parsed.borrower.ssn_last4) flat.ssnLast4 = parsed.borrower.ssn_last4
  return flat
}

// Render helper: walk the nested structure and produce a flat list of [label, value] entries.
function previewEntries(parsed: ParsedMismo): Array<[string, string]> {
  const sections: Array<[string, Record<string, unknown>]> = [
    ['borrower', parsed.borrower as unknown as Record<string, unknown>],
    ['property', parsed.property as unknown as Record<string, unknown>],
    ['loan', parsed.loan as unknown as Record<string, unknown>],
  ]
  const out: Array<[string, string]> = []
  for (const [section, obj] of sections) {
    for (const [key, val] of Object.entries(obj)) {
      if (val == null) continue
      out.push([`${section}.${key}`, String(val)])
    }
  }
  return out
}

export default function MISMOUpload({ onImport }: MISMOUploadProps) {
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsed, setParsed] = useState<ParsedMismo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xml') && !file.name.endsWith('.zip')) {
      setError('Please upload a .xml or .zip file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/mismo/parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to parse MISMO file')

      const data = (await res.json()) as { fields: ParsedMismo; filename: string }
      setParsed(data.fields)
    } catch (e) {
      setError('Failed to parse MISMO file. Please verify the format.')
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const useData = () => {
    if (parsed) {
      onImport(flatten(parsed))
      setShowModal(false)
      setParsed(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
      >
        <Upload size={13} />
        Upload MISMO
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Import MISMO 3.4 File
              </h3>
              <button onClick={() => { setShowModal(false); setParsed(null); setError(null) }} style={{ color: 'var(--sc-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {!parsed ? (
              <>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-solid"
                  style={{ borderColor: 'var(--sc-border)' }}
                >
                  <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--sc-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--sc-muted)' }}>
                    {uploading ? 'Parsing...' : 'Drop .xml or .zip file here, or click to browse'}
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml,.zip"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                {error && <p className="text-xs mt-2" style={{ color: 'var(--sc-red)' }}>{error}</p>}
              </>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewEntries(parsed).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs px-2 py-1 rounded" style={{ background: 'var(--sc-card-alt)' }}>
                      <span style={{ color: 'var(--sc-muted)' }}>{key}</span>
                      <span style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={useData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium flex-1"
                    style={{ background: 'var(--sc-gold)', color: 'var(--bg)' }}
                  >
                    <Check size={14} />
                    Use This Data
                  </button>
                  <button
                    onClick={() => setParsed(null)}
                    className="px-4 py-2 rounded-md text-sm font-medium"
                    style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            <p className="text-[9px] mt-3" style={{ color: 'var(--sc-muted)' }}>
              SSN data is masked to last 4 digits. Original files are stored securely.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
