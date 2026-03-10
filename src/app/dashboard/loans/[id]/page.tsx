'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, FileText, Zap, Activity, Download,
  ExternalLink, ChevronRight, AlertCircle, Check
} from 'lucide-react'

const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
})()

const N8N_BASE = 'https://styer.app.n8n.cloud/webhook'

// ── Types ────────────────────────────────────────────────────────────────────

interface Loan {
  id: string
  loan_name: string | null
  borrower_name: string | null
  status: string | null
  loan_amount: number | null
  loan_purpose: string | null
  loan_program: string | null
  loan_type: string | null
  occupancy: string | null
  closing_date: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  interest_rate: number | null
  contact_id: string | null
  buyer_agent_name: string | null
  buyer_agent_email: string | null
  title_company: string | null
  loan_number: string | null
}

interface DocRow {
  id: string
  file_name: string
  file_path: string
  file_size: number | null
  doc_type: string | null
  created_at: string
  uploaded_by: string | null
}

interface ActivityRow {
  id: string
  created_at: string
  action: string
  entity_type: string | null
  metadata: Record<string, unknown> | null
}

interface ContactRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  referred_by: string | null
}

// ── Workflow definitions (subset relevant to loan automation) ─────────────────

const WORKFLOWS = [
  {
    id: 'final-cd',
    name: 'Final CD Email',
    description: 'Upload a Closing Disclosure PDF — Claude extracts 10 fields and generates a personalized closing email draft.',
    triggerLabel: 'Upload CD PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-final-cd',
    icon: '📄',
  },
  {
    id: 'pre-approval',
    name: 'Pre-Approval Email',
    description: 'Upload a Pre-Approval letter — Claude extracts details and drafts a congratulations email.',
    triggerLabel: 'Upload PA Letter PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-pre-approval',
    icon: '✅',
  },
  {
    id: 'referral-intro',
    name: 'Referral Intro Email',
    description: 'Paste referral details — Claude writes a personalized introduction email to the new lead.',
    triggerLabel: 'Paste Referral Details',
    triggerType: 'form' as const,
    webhookPath: 'loanos-referral-intro',
    icon: '🤝',
  },
  {
    id: 'new-application',
    name: 'New Application Received',
    description: '1003 PDF — Claude extracts borrower info, creates contacts, and drafts a welcome email.',
    triggerLabel: '1003 PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-new-application',
    icon: '📋',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtBytes(n: number | null) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso.split('T')[0])
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LoanDetailPage() {
  const params = useParams()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'automations' | 'activity'>('overview')
  const [triggerWorkflow, setTriggerWorkflow] = useState<typeof WORKFLOWS[0] | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [loanRes, docsRes, actRes] = await Promise.all([
      supabase.from('loans').select('*').eq('id', loanId).single(),
      supabase.from('documents').select('id, file_name, file_path, file_size, doc_type, created_at, uploaded_by').eq('loan_id', loanId).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('id, created_at, action, entity_type, metadata').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(50),
    ])

    if (loanRes.data) {
      setLoan(loanRes.data)
      // Fetch linked contact
      if (loanRes.data.contact_id) {
        const { data: c } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, referred_by')
          .eq('id', loanRes.data.contact_id)
          .single()
        setContact(c)
      }
    }
    setDocs(docsRes.data || [])
    setActivity(actRes.data || [])
    setLoading(false)
  }, [loanId])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-slate-400 text-sm">Loading…</div>
  )
  if (!loan) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-400">
      <AlertCircle size={24} />
      <p>Loan not found</p>
      <Link href="/dashboard/loans" className="text-emerald-600 hover:underline text-sm">← Back to loans</Link>
    </div>
  )

  const displayName = loan.borrower_name || loan.loan_name || '(unnamed)'
  const location = [loan.property_city, loan.property_state].filter(Boolean).join(', ')
    || loan.property_address || ''

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <Link href="/dashboard/loans" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-2 transition-colors">
          <ArrowLeft size={12} /> Back to Loans
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{displayName}</h1>
            {loan.loan_name && loan.loan_name !== displayName && (
              <p className="text-xs text-slate-400 mt-0.5">{loan.loan_name}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <StatusBadge status={loan.status} />
              {loan.loan_purpose && <span className="text-xs text-slate-500">{loan.loan_purpose}</span>}
              {location && <span className="text-xs text-slate-500">{location}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{fmtCurrency(loan.loan_amount)}</p>
            {loan.closing_date && (
              <p className="text-xs text-slate-500 mt-1">Closes {fmtDate(loan.closing_date)}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {([
            { id: 'overview',    label: 'Overview',    icon: FileText },
            { id: 'documents',   label: `Documents (${docs.length})`, icon: FileText },
            { id: 'automations', label: 'Automations', icon: Zap },
            { id: 'activity',    label: `Activity (${activity.length})`, icon: Activity },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab loan={loan} contact={contact} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab loanId={loanId} docs={docs} onRefresh={fetchAll} />
        )}
        {activeTab === 'automations' && (
          <AutomationsTab loan={loan} onActivityCreated={fetchAll} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab activity={activity} />
        )}
      </div>
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ loan, contact }: { loan: Loan; contact: ContactRow | null }) {
  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Loan Name',      value: loan.loan_name || '—' },
    { label: 'Loan Number',    value: loan.loan_number || '—' },
    { label: 'Status',         value: <StatusBadge status={loan.status} /> },
    { label: 'Loan Amount',    value: fmtCurrency(loan.loan_amount) },
    { label: 'Interest Rate',  value: loan.interest_rate ? `${loan.interest_rate}%` : '—' },
    { label: 'Loan Program',   value: loan.loan_program || '—' },
    { label: 'Loan Purpose',   value: loan.loan_purpose || '—' },
    { label: 'Loan Type',      value: loan.loan_type || '—' },
    { label: 'Occupancy',      value: loan.occupancy || '—' },
    { label: 'Closing Date',   value: fmtDate(loan.closing_date) },
    { label: 'Property',       value: [loan.property_address, loan.property_city, loan.property_state].filter(Boolean).join(', ') || '—' },
    { label: "Buyer's Agent",  value: loan.buyer_agent_name ? `${loan.buyer_agent_name}${loan.buyer_agent_email ? ` — ${loan.buyer_agent_email}` : ''}` : '—' },
    { label: 'Title Company',  value: loan.title_company || '—' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Loan fields */}
      <div className="lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Loan Details</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {fields.map((f, i) => (
            <div key={f.label} className={`flex items-start px-4 py-2.5 text-sm ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
              <span className="w-36 shrink-0 text-slate-500">{f.label}</span>
              <span className="text-slate-900">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Borrower card */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Borrower</h2>
        {contact ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <Link
              href={`/dashboard/contacts?id=${contact.id}`}
              className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
            >
              {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
            </Link>
            {contact.email && <p className="text-sm text-slate-600 mt-1">{contact.email}</p>}
            {contact.phone && <p className="text-sm text-slate-600">{contact.phone}</p>}
            {contact.referred_by && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Referred by</p>
                <Link
                  href={`/dashboard/referral/${encodeURIComponent(contact.referred_by)}`}
                  className="text-sm text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {contact.referred_by}
                  <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-400">
            No linked contact
          </div>
        )}
      </div>
    </div>
  )
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ loanId, docs, onRefresh }: { loanId: string; docs: DocRow[]; onRefresh: () => void }) {
  const [signingId, setSigningId] = useState<string | null>(null)

  const handleDownload = async (doc: DocRow) => {
    setSigningId(doc.id)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 120) // 2-minute URL
    setSigningId(null)
    if (error || !data?.signedUrl) {
      alert('Could not generate download link. Please try again.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
        <FileText size={24} />
        <p className="text-sm">No documents attached to this loan</p>
        <Link href="/dashboard/upload" className="text-emerald-600 hover:underline text-sm">Upload a document →</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">{docs.length} document{docs.length !== 1 ? 's' : ''}</h2>
        <Link href="/dashboard/upload" className="text-xs text-emerald-600 hover:underline">+ Upload Document</Link>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">File</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Uploaded</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Size</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr key={doc.id} className={`${i !== 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50`}>
                <td className="px-4 py-3 font-medium text-slate-900">{doc.file_name}</td>
                <td className="px-4 py-3 text-slate-600">{doc.doc_type || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmtRelative(doc.created_at)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmtBytes(doc.file_size)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={signingId === doc.id}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                  >
                    {signingId === doc.id ? 'Loading…' : <><Download size={12} /> Download</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Automations tab ───────────────────────────────────────────────────────────

function AutomationsTab({ loan, onActivityCreated }: { loan: Loan; onActivityCreated: () => void }) {
  const [activeModal, setActiveModal] = useState<typeof WORKFLOWS[0] | null>(null)

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Run automations pre-filled with this loan's details. Output will be an Outlook draft.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKFLOWS.map(wf => (
          <div key={wf.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{wf.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">{wf.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{wf.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(wf)}
              className="mt-3 w-full py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
            >
              <Zap size={11} /> {wf.triggerLabel}
            </button>
          </div>
        ))}
      </div>

      {activeModal && (
        <LoanTriggerModal
          workflow={activeModal}
          loan={loan}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); onActivityCreated() }}
        />
      )}
    </div>
  )
}

// ── Loan trigger modal ────────────────────────────────────────────────────────

function LoanTriggerModal({
  workflow, loan, onClose, onSuccess
}: {
  workflow: typeof WORKFLOWS[0]
  loan: Loan
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [referralText, setReferralText] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setSending(true)
    setError('')
    try {
      const loanContext = {
        loan_id: loan.id,
        loan_name: loan.loan_name,
        borrower_name: loan.borrower_name,
        loan_amount: loan.loan_amount,
        property_address: [loan.property_address, loan.property_city, loan.property_state].filter(Boolean).join(', '),
        closing_date: loan.closing_date,
        contact_id: loan.contact_id,
      }

      let res: Response
      if (workflow.triggerType === 'pdf') {
        if (!file) { setError('Please select a file.'); setSending(false); return }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('loan_context', JSON.stringify(loanContext))
        res = await fetch(`${N8N_BASE}/${workflow.webhookPath}`, { method: 'POST', body: fd })
      } else {
        res = await fetch(`${N8N_BASE}/${workflow.webhookPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...loanContext, notes: referralText }),
        })
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDone(true)
      setTimeout(onSuccess, 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{workflow.icon} {workflow.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">For: {loan.borrower_name || loan.loan_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="flex flex-col items-center py-4 gap-2 text-emerald-700">
              <Check size={28} />
              <p className="font-medium">Sent to n8n</p>
              <p className="text-xs text-slate-500">Check Outlook for draft</p>
            </div>
          ) : (
            <>
              {/* Loan context preview */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-600 space-y-1">
                <p><span className="font-medium">Borrower:</span> {loan.borrower_name || '—'}</p>
                <p><span className="font-medium">Amount:</span> {fmtCurrency(loan.loan_amount)}</p>
                {loan.closing_date && <p><span className="font-medium">Closing:</span> {fmtDate(loan.closing_date)}</p>}
                {loan.property_address && <p><span className="font-medium">Property:</span> {loan.property_address}</p>}
              </div>

              {workflow.triggerType === 'pdf' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{workflow.triggerLabel}</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    {file ? (
                      <p className="text-sm text-emerald-700 font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Drop PDF here or click to browse</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Referral Details</label>
                  <textarea
                    rows={5}
                    value={referralText}
                    onChange={e => setReferralText(e.target.value)}
                    placeholder="Name, contact info, what they're looking for…"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="mt-4 w-full py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
              >
                {sending ? 'Sending…' : <><Zap size={13} /> Run Automation</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Activity tab ──────────────────────────────────────────────────────────────

function ActivityTab({ activity }: { activity: ActivityRow[] }) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
        <Activity size={24} />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-0">
        {activity.map((item, i) => (
          <div key={item.id} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              {i !== activity.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm text-slate-900">{item.action}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtRelative(item.created_at)}</p>
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-1 bg-slate-50 rounded px-2 py-1 text-xs text-slate-500">
                  {Object.entries(item.metadata)
                    .filter(([k]) => !['loan_id', 'contact_id', 'user_id'].includes(k))
                    .slice(0, 3)
                    .map(([k, v]) => <span key={k} className="mr-3"><span className="font-medium">{k}:</span> {String(v)}</span>)
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>
  const s = status.toLowerCase()
  let cls = 'bg-slate-100 text-slate-600'
  if (['closed', 'funded'].some(v => s.includes(v))) cls = 'bg-emerald-100 text-emerald-700'
  else if (['process', 'submitted', 'conditional', 'clear to close', 'approved'].some(v => s.includes(v))) cls = 'bg-blue-100 text-blue-700'
  else if (['started'].some(v => s.includes(v))) cls = 'bg-amber-100 text-amber-700'
  else if (['cancelled', 'denied', 'withdrawn'].some(v => s.includes(v))) cls = 'bg-red-100 text-red-600'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
