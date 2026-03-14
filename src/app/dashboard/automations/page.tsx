'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ─── Workflow data ────────────────────────────────────────────────────────────

const WORKFLOWS = [
  {
    id: 'final-cd',
    name: 'Final CD Email',
    description: 'Upload a Closing Disclosure PDF — Claude extracts 10 fields and generates a personalized closing email draft in Outlook.',
    triggerLabel: 'Upload CD PDF',
    triggerType: 'pdf' as const,
    n8nId: 'SkzrWeR0bHZs8kWX',
    webhookPath: 'loanos-final-cd',
    icon: 'cd',
  },
  {
    id: 'pre-approval',
    name: 'Pre-Approval Email',
    description: 'Upload a Pre-Approval letter — Claude extracts borrower details and drafts a congratulations email ready to review.',
    triggerLabel: 'Upload PA Letter PDF',
    triggerType: 'pdf' as const,
    n8nId: 'utMvZpkdRwIRZ51u',
    webhookPath: 'loanos-pre-approval',
    icon: 'pa',
  },
  {
    id: 'referral-intro',
    name: 'Referral Intro Email',
    description: 'Paste referral details — Claude writes a personalized introduction email to the new lead in seconds.',
    triggerLabel: 'Paste Referral Details',
    triggerType: 'form' as const,
    n8nId: 'YbgDnTpPdefcazKy',
    webhookPath: 'loanos-referral-intro',
    icon: 'referral',
  },
  {
    id: 'new-application',
    name: 'New Application Received',
    description: '1003 PDF lands in Supabase storage — Claude extracts borrower info, creates contacts, and drafts a welcome email.',
    triggerLabel: '1003 PDF in Storage',
    triggerType: 'pdf' as const,
    n8nId: 'cWESnXXy9UOLB13q',
    webhookPath: 'loanos-new-application',
    icon: 'app',
  },
  {
    id: 'refi-intake',
    name: 'Refi Intake Email',
    description: 'Upload an Initial Fees Worksheet — Claude extracts loan details and drafts the refinance kickoff email with disclosures breakdown.',
    triggerLabel: 'Upload IFW PDF',
    triggerType: 'refi' as const,
    n8nId: '',
    webhookPath: 'loanos-refi-intake',
    icon: 'refi',
  },
]

type Workflow = typeof WORKFLOWS[0]

interface LoanOption { id: string; label: string }

// ─── Pipeline steps ───────────────────────────────────────────────────────────

const STEPS = [
  { key: 'trigger', label: 'Trigger' },
  { key: 'claude',  label: 'Claude AI' },
  { key: 'outlook', label: 'Outlook' },
  { key: 'review',  label: 'Review' },
]

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const WORKFLOW_ICONS: Record<string, React.ReactNode> = {
  cd: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  pa: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  referral: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  app: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  refi: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  trigger: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  claude: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  outlook: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  review: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
}

// ─── RefiIntakeModal ──────────────────────────────────────────────────────────

interface RefiFields {
  borrower_first_name: string
  borrower_last_name: string
  loan_amount: string
  rate: string
  pi_payment: string
  total_monthly_payment: string
  cash_to_close: string
  lock_period: string
  escrow: string
}

function RefiIntakeModal({ wf, loanId, onClose }: { wf: Workflow; loanId: string | null; onClose: () => void }) {
  const [phase, setPhase] = useState<'upload' | 'extracting' | 'review' | 'sending' | 'success'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const [extractErr, setExtractErr] = useState('')
  const [sendErr, setSendErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Extracted + manual fields
  const [fields, setFields] = useState<RefiFields>({
    borrower_first_name: '',
    borrower_last_name: '',
    loan_amount: '',
    rate: '',
    pi_payment: '',
    total_monthly_payment: '',
    cash_to_close: '',
    lock_period: '',
    escrow: '',
  })
  const [coBorrowerFirst, setCoBorrowerFirst] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [rateLockStatus, setRateLockStatus] = useState('not locked yet')

  function pickFile(f: File) {
    if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) {
      setExtractErr('PDF files only')
      return
    }
    setFile(f)
    setExtractErr('')
  }

  async function handleExtract() {
    if (!file) { setExtractErr('Select a PDF first'); return }
    setPhase('extracting')
    setExtractErr('')
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const res = await fetch('/api/automations/refi-intake', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const f = data.fields ?? {}
      setFields({
        borrower_first_name:    String(f.borrower_first_name    ?? ''),
        borrower_last_name:     String(f.borrower_last_name     ?? ''),
        loan_amount:            String(f.loan_amount            ?? ''),
        rate:                   String(f.rate                   ?? ''),
        pi_payment:             String(f.pi_payment             ?? ''),
        total_monthly_payment:  String(f.total_monthly_payment  ?? ''),
        cash_to_close:          String(f.cash_to_close          ?? ''),
        lock_period:            String(f.lock_period            ?? ''),
        escrow:                 String(f.escrow                 ?? ''),
      })
      setPhase('review')
    } catch (e: unknown) {
      setExtractErr(e instanceof Error ? e.message : 'Extraction failed')
      setPhase('upload')
    }
  }

  async function handleSend() {
    if (!borrowerEmail.trim()) { setSendErr('Borrower email is required'); return }
    setPhase('sending')
    setSendErr('')
    try {
      const payload = {
        ...fields,
        co_borrower_first_name: coBorrowerFirst.trim(),
        borrower_email: borrowerEmail.trim(),
        rate_lock_status: rateLockStatus,
        ...(loanId ? { loan_id: loanId } : {}),
      }
      const res = await fetch(`https://styer.app.n8n.cloud/webhook/${wf.webhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPhase('success')
    } catch (e: unknown) {
      setSendErr(e instanceof Error ? e.message : 'Webhook call failed')
      setPhase('review')
    }
  }

  const REVIEW_LABELS: { key: keyof RefiFields; label: string }[] = [
    { key: 'borrower_first_name',   label: 'First Name'           },
    { key: 'borrower_last_name',    label: 'Last Name'            },
    { key: 'loan_amount',           label: 'Loan Amount'          },
    { key: 'rate',                  label: 'Rate (%)'             },
    { key: 'pi_payment',            label: 'P&I Payment'          },
    { key: 'total_monthly_payment', label: 'Total Monthly Pmt'    },
    { key: 'cash_to_close',         label: 'Cash to Close'        },
    { key: 'lock_period',           label: 'Lock Period'          },
    { key: 'escrow',                label: 'Escrow'               },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-7 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-4 text-xs text-zinc-500 hover:text-zinc-300 font-mono">
          [ESC]
        </button>

        {/* Title */}
        <div className="text-lg font-mono font-semibold text-zinc-100 mb-0.5">{wf.name}</div>
        <div className="text-xs text-zinc-500 font-mono mb-5">
          {phase === 'upload'     && 'Step 1 of 3 — Upload IFW PDF'}
          {phase === 'extracting' && 'Extracting fields…'}
          {phase === 'review'     && 'Step 2 of 3 — Review & confirm'}
          {phase === 'sending'    && 'Creating Outlook draft…'}
          {phase === 'success'    && 'Draft created in Outlook'}
        </div>

        {/* ── UPLOAD phase ── */}
        {(phase === 'upload' || phase === 'extracting') && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f) }}
              onClick={() => fileRef.current?.click()}
              className={`
                border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4
                ${drag ? 'border-amber-500 bg-amber-500/10' : file ? 'border-amber-500/70 bg-amber-500/5' : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'}
              `}
            >
              <div className={`text-sm font-medium ${file ? 'text-amber-400' : 'text-zinc-500'}`}>
                {file ? `✓  ${file.name}` : 'Drop IFW PDF here or click to select'}
              </div>
              {file && <div className="text-xs text-slate-400 mt-1 font-mono">{(file.size / 1024).toFixed(0)} KB</div>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
            />
            {extractErr && (
              <div className="text-sm rounded-md px-3 py-2 mb-4 bg-red-900/20 border border-red-800 text-red-400 font-mono">
                {extractErr}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleExtract}
                disabled={phase === 'extracting' || !file}
                className="px-4 py-2 text-sm font-medium text-zinc-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {phase === 'extracting' ? 'Extracting…' : 'Extract Fields'}
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm font-mono font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-600 hover:border-zinc-500 rounded transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── REVIEW phase ── */}
        {phase === 'review' && (
          <>
            {/* Extracted fields grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {REVIEW_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-mono text-zinc-500 mb-1">{label}</label>
                  <input
                    value={fields[key]}
                    onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-700 my-4" />

            {/* Manual fields */}
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">Co-Borrower First Name <span className="text-zinc-500">(optional)</span></label>
                <input
                  value={coBorrowerFirst}
                  onChange={(e) => setCoBorrowerFirst(e.target.value)}
                  placeholder="Jane"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">Borrower Email *</label>
                <input
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  placeholder="john@example.com"
                  type="email"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">Rate Lock Status</label>
                <select
                  value={rateLockStatus}
                  onChange={(e) => setRateLockStatus(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="not locked yet">Not locked yet</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            {sendErr && (
              <div className="text-sm rounded-md px-3 py-2 mb-4 bg-red-900/20 border border-red-800 text-red-400 font-mono">
                {sendErr}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                Send Draft to Outlook
              </button>
              <button
                onClick={() => setPhase('upload')}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-md transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}

        {/* ── SENDING phase ── */}
        {phase === 'sending' && (
          <div className="flex items-center gap-3 py-4 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
            Creating Outlook draft…
          </div>
        )}

        {/* ── SUCCESS phase ── */}
        {phase === 'success' && (
          <div className="py-4">
            <div className="text-sm rounded-md px-3 py-2 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700">
              Draft created — check Outlook to review and send.
            </div>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TriggerModal ─────────────────────────────────────────────────────────────

function TriggerModal({ wf, loanId, onClose }: { wf: Workflow; loanId: string | null; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [leadName, setLeadName] = useState('')
  const [agent, setAgent] = useState('')
  const [details, setDetails] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) {
      setStatus('error')
      setMsg('PDF files only')
      return
    }
    setFile(f)
    setStatus('idle')
    setMsg('')
  }

  async function handleSubmit() {
    setStatus('loading')
    setMsg('')
    try {
      let res: Response
      if (wf.triggerType === 'pdf') {
        if (!file) {
          setStatus('error')
          setMsg('Select a PDF first')
          return
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('triggered_by', 'loanos_ui')
        fd.append('workflow_id', wf.id)
        if (loanId) fd.append('loan_id', loanId)
        res = await fetch(`https://styer.app.n8n.cloud/webhook/${wf.webhookPath}`, {
          method: 'POST',
          body: fd,
        })
      } else {
        if (!leadName.trim()) {
          setStatus('error')
          setMsg('Lead name is required')
          return
        }
        res = await fetch(`https://styer.app.n8n.cloud/webhook/${wf.webhookPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_name: leadName.trim(),
            agent: agent.trim(),
            details: details.trim(),
            ...(loanId ? { loan_id: loanId } : {}),
          }),
        })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('success')
      setMsg('Workflow triggered — check Outlook for the draft.')
    } catch (e: unknown) {
      setStatus('error')
      setMsg(e instanceof Error ? e.message : 'Webhook call failed')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg p-7 w-full max-w-md relative shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xs text-slate-400 hover:text-slate-600 font-mono"
        >
          [ESC]
        </button>

        {/* Title */}
        <div className="text-lg font-semibold text-slate-900 mb-0.5">{wf.name}</div>
        <div className="text-xs text-slate-400 font-mono mb-5">
          Trigger: {wf.triggerLabel}
        </div>

        {/* PDF drop zone */}
        {wf.triggerType === 'pdf' && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                const f = e.dataTransfer.files[0]
                if (f) pickFile(f)
              }}
              onClick={() => fileRef.current?.click()}
              className={`
                border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4
                ${drag ? 'border-amber-500 bg-amber-500/10' : file ? 'border-amber-500/70 bg-amber-500/5' : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'}
              `}
            >
              <div className={`text-sm font-medium ${file ? 'text-amber-400' : 'text-zinc-500'}`}>
                {file ? `✓  ${file.name}` : 'Drop PDF here or click to select'}
              </div>
              {file && (
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0]
                if (f) pickFile(f)
              }}
            />
          </>
        )}

        {/* Form fields for referral */}
        {wf.triggerType === 'form' && (
          <div className="flex flex-col gap-3 mb-4">
            {([
              { label: 'Lead Name *', value: leadName, set: setLeadName, placeholder: 'John Smith' },
              { label: 'Referring Agent', value: agent, set: setAgent, placeholder: 'Sarah Johnson' },
            ] as { label: string; value: string; set: (v: string) => void; placeholder: string }[]).map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                <input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Buying in Austin, pre-approved $450k, relocating from Dallas..."
                rows={3}
                className="w-full resize-y bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>
          </div>
        )}

        {/* Status message */}
        {msg && (
          <div className={`
            text-sm rounded-md px-3 py-2 mb-4
            ${status === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : ''}
            ${status === 'error' ? 'bg-red-900/20 border border-red-800 text-red-400 font-mono' : ''}
          `}>
            {msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 items-center">
          {status !== 'success' && (
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="px-4 py-2 text-sm font-medium text-zinc-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {status === 'loading' ? 'Running...' : 'Trigger Now'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-md transition-colors"
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AutoCard component ───────────────────────────────────────────────────────

function AutoCard({ wf, index, loans, onTrigger }: { wf: Workflow; index: number; loans: LoanOption[]; onTrigger: (loanId: string | null) => void }) {
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)

  return (
    <div
      className="auto-card bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {/* Emerald left accent */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-lg" />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-emerald-600 shrink-0">
            {WORKFLOW_ICONS[wf.icon]}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900 leading-tight">
              {wf.name}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Trigger: {wf.triggerLabel}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-700">Active</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed mb-5">
        {wf.description}
      </p>

      {/* Pipeline flow */}
      <div className="flex items-center mb-5">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? undefined : 1 }}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div className={`
                w-7 h-7 rounded-full border flex items-center justify-center
                ${i === 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 bg-slate-50 text-slate-400'}
              `}>
                {STEP_ICONS[step.key] ?? STEP_ICONS.trigger}
              </div>
              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">
                {step.label}
              </span>
            </div>

            {/* Connector with animated dot */}
            {i < STEPS.length - 1 && (
              <div className="flow-connector flex-1 h-px bg-slate-200 relative overflow-visible mb-3.5">
                <div
                  className="flow-dot"
                  style={{ animationDelay: `${i * 0.7}s` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meta row (hover reveal) */}
      <div className="meta-reveal text-[10px] text-slate-400 font-mono flex gap-4 mb-4">
        <span>n8n: <span className="text-slate-300">{wf.n8nId || '—'}</span></span>
        <span>webhook: <span className="text-slate-300">/webhook/{wf.webhookPath}</span></span>
        <span>last run: <span>—</span></span>
      </div>

      {/* Loan selector + Trigger */}
      <div className="flex items-center gap-2">
        <select
          value={selectedLoanId ?? ''}
          onChange={e => setSelectedLoanId(e.target.value || null)}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 focus:outline-none focus:border-emerald-400"
        >
          <option value="">Run for loan… (optional)</option>
          {loans.map(l => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <button
          onClick={() => onTrigger(selectedLoanId)}
          className="shrink-0 px-4 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-md transition-colors"
        >
          Trigger
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [activeWf, setActiveWf] = useState<Workflow | null>(null)
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null)
  const [loans, setLoans] = useState<LoanOption[]>([])

  useEffect(() => {
    supabase.from('loans')
      .select('id, borrower_name, loan_name')
      .order('closing_date', { ascending: false, nullsFirst: false })
      .limit(200)
      .then(({ data }) => {
        setLoans((data || []).map(l => ({
          id: l.id,
          label: l.borrower_name || l.loan_name || '(unnamed)',
        })))
      })
  }, [])

  function handleClose() { setActiveWf(null); setActiveLoanId(null) }

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flowDot {
          0%   { left: -5px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: calc(100% + 5px); opacity: 0; }
        }

        .auto-card {
          opacity: 0;
          animation: cardIn 0.4s ease forwards;
        }

        .flow-dot {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #059669;
          animation: flowDot 2.1s ease-in-out infinite;
          left: -5px;
        }

        .meta-reveal {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .auto-card:hover .meta-reveal {
          opacity: 1;
        }
      `}</style>

      {activeWf && activeWf.triggerType === 'refi' && (
        <RefiIntakeModal wf={activeWf} loanId={activeLoanId} onClose={handleClose} />
      )}
      {activeWf && activeWf.triggerType !== 'refi' && (
        <TriggerModal wf={activeWf} loanId={activeLoanId} onClose={handleClose} />
      )}

      <div className="p-8 pb-12 bg-slate-50 min-h-full">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Automations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            5 active workflows — Claude extracts, n8n routes, Outlook drafts. You review and send.
          </p>
        </div>

        {/* ── Stat row ────────────────────────────────────────────────── */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm mb-6">
          {[
            { label: 'Active Workflows', value: '5',             color: 'text-emerald-600' },
            { label: 'Errors',           value: '0',             color: 'text-slate-900'   },
            { label: 'Last Updated',     value: '2026-03-13',    color: 'text-slate-500'   },
            { label: 'Engine',           value: 'n8n + Claude',  color: 'text-emerald-600' },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex-1 px-5 py-4 ${i < 3 ? 'border-r border-slate-200' : ''}`}>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className={`text-sm font-semibold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Infra status bar ────────────────────────────────────────── */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">
            All Workflows Live — Supabase → n8n → Claude API → Outlook
          </span>
        </div>

        {/* ── Workflow cards grid ─────────────────────────────────────── */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))' }}
        >
          {WORKFLOWS.map((wf, i) => (
            <AutoCard key={wf.id} wf={wf} index={i} loans={loans} onTrigger={(loanId) => { setActiveLoanId(loanId); setActiveWf(wf) }} />
          ))}
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <div className="mt-8 px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-400 font-mono">
          Instance: styer.app.n8n.cloud · Trigger: manual via LoanOS or Supabase pg_net · Drafts: Outlook via n8n
        </div>

      </div>
    </>
  )
}
