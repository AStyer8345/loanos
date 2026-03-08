'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Loan } from './page'

const DOC_TYPES = [
  { value: 'contract',  label: 'Purchase Contract' },
  { value: 'cd',        label: 'Closing Disclosure (CD)' },
  { value: 'pa_letter', label: 'Pre-Approval Letter' },
  { value: 'income',    label: 'Income Documents' },
  { value: 'bank',      label: 'Bank Statements' },
  { value: 'id',        label: 'ID / Identity' },
  { value: 'other',     label: 'Other' },
]

function loanLabel(loan: Loan): string {
  const contact = loan.contacts?.[0]
  const name = contact ? `${contact.first_name} ${contact.last_name}`.trim() : 'Unknown'
  const num = loan.loan_number ? ` — #${loan.loan_number}` : ''
  const addr = loan.property_address ? ` — ${loan.property_address}` : ''
  return `${name}${num}${addr}`
}

export default function UploadForm({ loans, userId }: { loans: Loan[]; userId: string }) {
  const supabase = createClient()

  const [docType, setDocType]               = useState('')
  const [loanMode, setLoanMode]             = useState<'existing' | 'new'>(loans.length > 0 ? 'existing' : 'new')
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id ?? '')
  const [firstName, setFirstName]           = useState('')
  const [lastName, setLastName]             = useState('')
  const [loanNumber, setLoanNumber]         = useState('')
  const [file, setFile]                     = useState<File | null>(null)
  const [uploading, setUploading]           = useState(false)
  const [result, setResult]                 = useState<{ ok: boolean; msg: string } | null>(null)

  function resetForm() {
    setDocType('')
    setFirstName('')
    setLastName('')
    setLoanNumber('')
    setFile(null)
    const input = document.getElementById('pdf-input') as HTMLInputElement | null
    if (input) input.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !docType) return
    if (loanMode === 'existing' && !selectedLoanId) return
    if (loanMode === 'new' && !firstName.trim()) return

    setUploading(true)
    setResult(null)

    try {
      let loanId = selectedLoanId

      // ── New loan flow ──────────────────────────────────────────
      if (loanMode === 'new') {
        const { data: contact, error: cErr } = await supabase
          .from('contacts')
          .insert({
            user_id:      userId,
            first_name:   firstName.trim(),
            last_name:    lastName.trim(),
            contact_type: 'borrower',
          })
          .select('id')
          .single()

        if (cErr) throw new Error(`Contact: ${cErr.message}`)

        const { data: loan, error: lErr } = await supabase
          .from('loans')
          .insert({
            user_id:     userId,
            contact_id:  contact.id,
            loan_number: loanNumber.trim() || null,
            status:      'lead',
          })
          .select('id')
          .single()

        if (lErr) throw new Error(`Loan: ${lErr.message}`)
        loanId = loan.id
      }

      // ── Storage upload ─────────────────────────────────────────
      // Path: {userId}/{loanId}/{timestamp}_{filename}
      // Storage policy required: allow authenticated users to upload to their own folder
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath  = `${userId}/${loanId}/${Date.now()}_${safeFilename}`

      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: 'application/pdf' })

      if (storageErr) throw new Error(`Storage: ${storageErr.message}`)

      // ── documents row ──────────────────────────────────────────
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert({
          user_id:     userId,
          loan_id:     loanId,
          file_name:   file.name,
          file_path:   storagePath,
          file_size:   file.size,
          mime_type:   'application/pdf',
          doc_type:    docType,
          uploaded_by: userId,
        })
        .select('id')
        .single()

      if (docErr) throw new Error(`Document record: ${docErr.message}`)

      // ── activity_log row ───────────────────────────────────────
      await supabase.from('activity_log').insert({
        user_id:     userId,
        action:      'document.uploaded',
        entity_type: 'document',
        entity_id:   doc.id,
        metadata: {
          file_name:    file.name,
          file_size:    file.size,
          doc_type:     docType,
          loan_id:      loanId,
          storage_path: storagePath,
        },
      })

      setResult({ ok: true, msg: `${file.name} uploaded successfully.` })
      resetForm()
    } catch (err: unknown) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  const canSubmit = !!file && !!docType &&
    (loanMode === 'existing' ? !!selectedLoanId : !!firstName.trim())

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Doc type ─────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Document type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Select type…</option>
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* ── Loan ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Loan record
        </label>

        {loans.length > 0 && (
          <div className="flex gap-2 mb-3">
            {(['existing', 'new'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLoanMode(mode)}
                className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                  loanMode === mode
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {mode === 'existing' ? 'Existing loan' : 'New loan'}
              </button>
            ))}
          </div>
        )}

        {loanMode === 'existing' ? (
          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select loan…</option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loanLabel(loan)}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required={loanMode === 'new'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Loan number (optional)"
              value={loanNumber}
              onChange={(e) => setLoanNumber(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* ── File ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          PDF file
        </label>
        <label
          htmlFor="pdf-input"
          className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-700 rounded-lg p-8 cursor-pointer hover:border-gray-500 transition-colors"
        >
          {file ? (
            <div className="text-center">
              <p className="text-white text-sm font-medium">{file.name}</p>
              <p className="text-gray-400 text-xs mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-blue-400 text-xs mt-2">Click to change</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Click to select a PDF</p>
              <p className="text-gray-600 text-xs mt-1">PDF files only</p>
            </div>
          )}
          <input
            id="pdf-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="hidden"
          />
        </label>
      </div>

      {/* ── Result banner ─────────────────────────────────────── */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.ok
              ? 'bg-green-950 border border-green-800 text-green-300'
              : 'bg-red-950 border border-red-800 text-red-300'
          }`}
        >
          {result.msg}
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canSubmit || uploading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
      >
        {uploading ? 'Uploading…' : 'Upload document'}
      </button>

    </form>
  )
}
