'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, FileText, Zap, Activity, Download, Upload,
  ChevronRight, AlertCircle, Check, Mail, Clock, Inbox, X
} from 'lucide-react'
import LoanOSChat from '@/components/crm/LoanOSChat'

const N8N_BASE = 'https://styer.app.n8n.cloud/webhook'

// ── Types ────────────────────────────────────────────────────────────────────

interface Loan {
  id: string
  // Identity
  loan_name: string | null
  loan_number: string | null
  arive_loan_id: string | null
  status: string | null
  milestone: string | null
  // Borrower (legacy)
  borrower_name: string | null
  // Borrower (expanded)
  borrower_first_name: string | null
  borrower_last_name: string | null
  borrower_email: string | null
  borrower_phone: string | null
  co_borrower_name: string | null
  co_borrower_email: string | null
  co_borrower_phone: string | null
  // Loan terms
  loan_amount: number | null
  loan_purpose: string | null
  loan_program: string | null
  loan_type: string | null
  loan_term: number | null
  interest_rate: number | null
  apr: number | null
  points: number | null
  down_payment: number | null
  down_payment_pct: number | null
  ltv: number | null
  cltv: number | null
  // Property
  property_address: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  property_county: string | null
  property_type: string | null
  occupancy: string | null
  occupancy_type: string | null
  purchase_price: number | null
  appraised_value: number | null
  // Key dates
  application_date: string | null
  submission_date: string | null
  approval_date: string | null
  closing_date: string | null
  funding_date: string | null
  rate_lock_expiration: string | null
  estimated_closing_date: string | null
  loan_created_date: string | null
  // Financials
  monthly_payment: number | null
  piti: number | null
  cash_to_close: number | null
  seller_credits: number | null
  lender_credits: number | null
  loan_costs: number | null
  total_closing_costs: number | null
  prepaid_items: number | null
  escrow_impounds: number | null
  mi_monthly: number | null
  mi_upfront: number | null
  // Qualifying
  credit_score: number | null
  middle_score: number | null
  monthly_income: number | null
  monthly_debts: number | null
  front_end_dti: number | null
  back_end_dti: number | null
  // Parties
  referring_agent_name: string | null
  referring_agent_email: string | null
  referring_agent_phone: string | null
  listing_agent_name: string | null
  listing_agent_email: string | null
  buyers_agent_name: string | null
  buyers_agent_email: string | null
  buyer_agent_name: string | null
  buyer_agent_email: string | null
  title_company: string | null
  title_contact: string | null
  title_email: string | null
  escrow_officer: string | null
  processor_name: string | null
  underwriter_name: string | null
  lender_name: string | null
  investor_name: string | null
  channel: string | null
  // Attribution
  lead_source: string | null
  referral_source: string | null
  marketing_campaign: string | null
  // Notes
  notes: string | null
  // System
  contact_id: string | null
  arive_created_at: string | null
  arive_updated_at: string | null
  synced_at: string | null
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

interface EmailDraftRow {
  id: string
  automation_name: string
  recipient_name: string | null
  recipient_email: string
  subject: string
  body_html: string
  body_preview: string | null
  status: string
  created_at: string
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

function fmtPct(n: number | null) {
  if (n == null) return '—'
  return `${parseFloat(n.toFixed(3))}%`
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LoanDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const loanId = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [emailDrafts, setEmailDrafts] = useState<EmailDraftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'automations' | 'activity' | 'emails'>('overview')

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [loanRes, docsRes, actRes, draftsRes] = await Promise.all([
      supabase.from('loans').select('*').eq('id', loanId).single(),
      supabase.from('documents').select('id, file_name, file_path, file_size, doc_type, created_at, uploaded_by').eq('loan_id', loanId).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('id, created_at, action, entity_type, metadata').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(50),
      supabase.from('email_drafts').select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(100),
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
    setEmailDrafts((draftsRes.data || []) as EmailDraftRow[])
    setLoading(false)
  }, [loanId, supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-zinc-500 text-sm font-mono">Loading…</div>
  )
  if (!loan) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3 text-zinc-500 font-mono">
      <AlertCircle size={24} />
      <p>Loan not found</p>
      <Link href="/dashboard/loans" className="text-emerald-600 hover:underline text-sm">← Back to loans</Link>
    </div>
  )

  const displayName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'
  const location = [loan.property_city, loan.property_state].filter(Boolean).join(', ')
    || loan.property_address || ''

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <Link href="/dashboard/loans" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 font-mono mb-2 transition-colors">
          <ArrowLeft size={12} /> Back to Loans
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider">{displayName}</h1>
            {loan.loan_name && loan.loan_name !== displayName && (
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">{loan.loan_name}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <StatusBadge status={loan.status} />
              {loan.loan_purpose && <span className="text-xs text-zinc-500 font-mono">{loan.loan_purpose}</span>}
              {location && <span className="text-xs text-zinc-500 font-mono">{location}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-indigo-400">{fmtCurrency(loan.loan_amount)}</p>
            {loan.closing_date && (
              <p className="text-xs text-zinc-500 mt-1 font-mono">Closes {fmtDate(loan.closing_date)}</p>
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
            { id: 'emails',      label: `Emails (${emailDrafts.length})`, icon: Mail },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm rounded font-mono font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
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
          <OverviewTab loan={loan} setLoan={l => setLoan(l)} contact={contact} loanId={loanId} />
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
        {activeTab === 'emails' && (
          <EmailHistoryTab drafts={emailDrafts} onRefresh={fetchAll} />
        )}
      </div>
      <LoanOSChat recordId={loanId} recordType="loan" recordName={displayName} />
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────

const LOAN_STATUS_OPTS = [
  'Loan Setup', 'Disclosed', 'Submitted to UW', 'Approved with Conditions',
  'Resubmitted', 'Clear to Close',
  'Pre-Approved', 'Pre-App', 'Application', 'Lead',
  'Closed', 'Funded', 'On Hold', 'Cancelled', 'Denied', 'Dead',
]

type FieldType = 'text' | 'number' | 'date' | 'select' | 'percent'

// Inline-editable row — click value to edit, blur/Enter to save
function EditableRow({ label, displayValue, field, rawValue, type = 'text', options, onSave, index }: {
  label: string
  displayValue: React.ReactNode
  field?: string
  rawValue?: string | number | null
  type?: FieldType
  options?: string[]
  onSave?: (field: string, value: string | number | null) => Promise<void>
  index: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const canEdit = !!field && !!onSave

  function startEdit() {
    if (!canEdit) return
    setDraft(rawValue != null ? String(rawValue) : '')
    setEditing(true)
  }

  async function commit() {
    if (!canEdit) return
    setEditing(false)
    let val: string | number | null = (draft ?? '').trim() || null
    if ((type === 'number' || type === 'percent') && val != null) {
      const n = parseFloat(val as string)
      val = isNaN(n) ? null : n
    }
    await onSave!(field!, val)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') setEditing(false)
  }

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); selectRef.current?.focus() }
  }, [editing])

  return (
    <div className={`flex items-start px-4 py-2 text-sm group ${index > 0 ? 'border-t border-zinc-700/60' : ''}`}>
      <span className="w-40 shrink-0 text-zinc-500 text-xs font-mono leading-5 mt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          type === 'select' ? (
            <select
              ref={selectRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              className="text-xs font-mono border border-indigo-500/50 rounded px-2 py-0.5 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
            >
              <option value="">—</option>
              {(options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              ref={inputRef}
              type={type === 'date' ? 'date' : (type === 'number' || type === 'percent') ? 'number' : 'text'}
              step={type === 'percent' ? '0.001' : undefined}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className="text-xs font-mono border border-indigo-500/50 rounded px-2 py-0.5 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
            />
          )
        ) : (
          <span
            onClick={canEdit ? startEdit : undefined}
            className={`font-mono text-sm ${canEdit ? 'cursor-text hover:text-indigo-300 transition-colors' : ''} ${saved ? 'text-emerald-400' : 'text-zinc-200'}`}
          >
            {saved ? '✓ Saved' : (displayValue ?? <span className="text-zinc-600">—</span>)}
          </span>
        )}
      </div>
      {canEdit && !editing && !saved && (
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 ml-2 mt-0.5 text-zinc-500 hover:text-indigo-400 transition-all shrink-0"
          title="Edit"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

function EditableSectionCard({ title, fields, onSave }: {
  title: string
  fields: {
    label: string
    displayValue: React.ReactNode
    field?: string
    rawValue?: string | number | null
    type?: FieldType
    options?: string[]
  }[]
  onSave: (field: string, value: string | number | null) => Promise<void>
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">{title}</h2>
      </div>
      {fields.map((f, i) => (
        <EditableRow
          key={f.label}
          index={i}
          label={f.label}
          displayValue={f.displayValue}
          field={f.field}
          rawValue={f.rawValue}
          type={f.type}
          options={f.options}
          onSave={onSave}
        />
      ))}
    </div>
  )
}

function OverviewTab({ loan, setLoan, contact, loanId }: {
  loan: Loan
  setLoan: (l: Loan) => void
  contact: ContactRow | null
  loanId: string
}) {
  const supabase = createClient()
  const [notesVal, setNotesVal] = useState(loan.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveField = useCallback(async (field: string, value: string | number | null) => {
    const { error } = await supabase.from('loans').update({ [field]: value }).eq('id', loanId)
    if (!error) setLoan({ ...loan, [field]: value } as Loan)
  }, [supabase, loanId, loan, setLoan])

  const handleNotesBlur = async () => {
    if (notesVal === (loan.notes ?? '')) return
    setSaving(true)
    await supabase.from('loans').update({ notes: notesVal }).eq('id', loanId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1 — Loan Terms */}
        <EditableSectionCard title="Loan Terms" onSave={handleSaveField} fields={[
          { label: 'Loan Number',   displayValue: loan.loan_number,   field: 'loan_number',   rawValue: loan.loan_number },
          { label: 'Arive Loan ID', displayValue: loan.arive_loan_id, field: 'arive_loan_id', rawValue: loan.arive_loan_id },
          { label: 'Status',        displayValue: <StatusBadge status={loan.status} />, field: 'status', rawValue: loan.status, type: 'select', options: LOAN_STATUS_OPTS },
          { label: 'Milestone',     displayValue: loan.milestone,     field: 'milestone',     rawValue: loan.milestone },
          { label: 'Loan Amount',   displayValue: fmtCurrency(loan.loan_amount),   field: 'loan_amount',   rawValue: loan.loan_amount,   type: 'number' },
          { label: 'Loan Purpose',  displayValue: loan.loan_purpose,  field: 'loan_purpose',  rawValue: loan.loan_purpose },
          { label: 'Loan Type',     displayValue: loan.loan_type,     field: 'loan_type',     rawValue: loan.loan_type },
          { label: 'Loan Program',  displayValue: loan.loan_program,  field: 'loan_program',  rawValue: loan.loan_program },
          { label: 'Loan Term',     displayValue: loan.loan_term ? `${loan.loan_term} months` : null, field: 'loan_term', rawValue: loan.loan_term, type: 'number' },
          { label: 'Interest Rate', displayValue: fmtPct(loan.interest_rate), field: 'interest_rate', rawValue: loan.interest_rate, type: 'percent' },
          { label: 'APR',           displayValue: fmtPct(loan.apr),   field: 'apr',   rawValue: loan.apr,   type: 'percent' },
          { label: 'Points',        displayValue: loan.points != null ? String(loan.points) : null, field: 'points', rawValue: loan.points, type: 'number' },
          { label: 'Down Payment',  displayValue: fmtCurrency(loan.down_payment),  field: 'down_payment',  rawValue: loan.down_payment,  type: 'number' },
          { label: 'Down Pmt %',    displayValue: fmtPct(loan.down_payment_pct),   field: 'down_payment_pct', rawValue: loan.down_payment_pct, type: 'percent' },
          { label: 'LTV',           displayValue: fmtPct(loan.ltv),   field: 'ltv',   rawValue: loan.ltv,   type: 'percent' },
          { label: 'CLTV',          displayValue: fmtPct(loan.cltv),  field: 'cltv',  rawValue: loan.cltv,  type: 'percent' },
        ]} />

        {/* 2 — Property */}
        <EditableSectionCard title="Property" onSave={handleSaveField} fields={[
          { label: 'Address',        displayValue: loan.property_address, field: 'property_address', rawValue: loan.property_address },
          { label: 'City',           displayValue: loan.property_city,    field: 'property_city',    rawValue: loan.property_city },
          { label: 'State',          displayValue: loan.property_state,   field: 'property_state',   rawValue: loan.property_state },
          { label: 'Zip',            displayValue: loan.property_zip,     field: 'property_zip',     rawValue: loan.property_zip },
          { label: 'County',         displayValue: loan.property_county,  field: 'property_county',  rawValue: loan.property_county },
          { label: 'Property Type',  displayValue: loan.property_type,    field: 'property_type',    rawValue: loan.property_type },
          { label: 'Occupancy',      displayValue: loan.occupancy_type || loan.occupancy, field: 'occupancy_type', rawValue: loan.occupancy_type || loan.occupancy },
          { label: 'Purchase Price', displayValue: fmtCurrency(loan.purchase_price),  field: 'purchase_price',  rawValue: loan.purchase_price,  type: 'number' },
          { label: 'Appraised Value',displayValue: fmtCurrency(loan.appraised_value), field: 'appraised_value', rawValue: loan.appraised_value, type: 'number' },
        ]} />

        {/* 3 — Borrower */}
        <EditableSectionCard title="Borrower" onSave={handleSaveField} fields={[
          { label: 'First Name',     displayValue: loan.borrower_first_name, field: 'borrower_first_name', rawValue: loan.borrower_first_name },
          { label: 'Last Name',      displayValue: loan.borrower_last_name,  field: 'borrower_last_name',  rawValue: loan.borrower_last_name },
          { label: 'Email',          displayValue: loan.borrower_email,      field: 'borrower_email',      rawValue: loan.borrower_email },
          { label: 'Phone',          displayValue: loan.borrower_phone,      field: 'borrower_phone',      rawValue: loan.borrower_phone },
          { label: 'Co-Borrower',    displayValue: loan.co_borrower_name,    field: 'co_borrower_name',    rawValue: loan.co_borrower_name },
          { label: 'Co-Borr Email',  displayValue: loan.co_borrower_email,   field: 'co_borrower_email',   rawValue: loan.co_borrower_email },
          { label: 'Co-Borr Phone',  displayValue: loan.co_borrower_phone,   field: 'co_borrower_phone',   rawValue: loan.co_borrower_phone },
          { label: 'Credit Score',   displayValue: loan.credit_score != null ? String(loan.credit_score) : null, field: 'credit_score', rawValue: loan.credit_score, type: 'number' },
          { label: 'Middle Score',   displayValue: loan.middle_score != null ? String(loan.middle_score) : null, field: 'middle_score', rawValue: loan.middle_score, type: 'number' },
          { label: 'Monthly Income', displayValue: fmtCurrency(loan.monthly_income), field: 'monthly_income', rawValue: loan.monthly_income, type: 'number' },
          { label: 'Monthly Debts',  displayValue: fmtCurrency(loan.monthly_debts),  field: 'monthly_debts',  rawValue: loan.monthly_debts,  type: 'number' },
          { label: 'Front DTI',      displayValue: fmtPct(loan.front_end_dti), field: 'front_end_dti', rawValue: loan.front_end_dti, type: 'percent' },
          { label: 'Back DTI',       displayValue: fmtPct(loan.back_end_dti),  field: 'back_end_dti',  rawValue: loan.back_end_dti,  type: 'percent' },
        ]} />

        {/* 4 — Key Dates */}
        <EditableSectionCard title="Key Dates" onSave={handleSaveField} fields={[
          { label: 'Application',  displayValue: fmtDate(loan.application_date),       field: 'application_date',       rawValue: loan.application_date,       type: 'date' },
          { label: 'Submission',   displayValue: fmtDate(loan.submission_date),        field: 'submission_date',        rawValue: loan.submission_date,        type: 'date' },
          { label: 'Approval',     displayValue: fmtDate(loan.approval_date),          field: 'approval_date',          rawValue: loan.approval_date,          type: 'date' },
          { label: 'Est. Closing', displayValue: fmtDate(loan.estimated_closing_date), field: 'estimated_closing_date', rawValue: loan.estimated_closing_date, type: 'date' },
          { label: 'Closing',      displayValue: fmtDate(loan.closing_date),           field: 'closing_date',           rawValue: loan.closing_date,           type: 'date' },
          { label: 'Funding',      displayValue: fmtDate(loan.funding_date),           field: 'funding_date',           rawValue: loan.funding_date,           type: 'date' },
          { label: 'Rate Lock Exp',displayValue: fmtDate(loan.rate_lock_expiration),   field: 'rate_lock_expiration',   rawValue: loan.rate_lock_expiration,   type: 'date' },
          { label: 'Loan Created', displayValue: fmtDate(loan.loan_created_date) },
        ]} />

        {/* 5 — Financials */}
        <EditableSectionCard title="Financials" onSave={handleSaveField} fields={[
          { label: 'Monthly Payment',  displayValue: fmtCurrency(loan.monthly_payment),     field: 'monthly_payment',     rawValue: loan.monthly_payment,     type: 'number' },
          { label: 'PITI',             displayValue: fmtCurrency(loan.piti),                field: 'piti',                rawValue: loan.piti,                type: 'number' },
          { label: 'Cash to Close',    displayValue: fmtCurrency(loan.cash_to_close),       field: 'cash_to_close',       rawValue: loan.cash_to_close,       type: 'number' },
          { label: 'Seller Credits',   displayValue: fmtCurrency(loan.seller_credits),      field: 'seller_credits',      rawValue: loan.seller_credits,      type: 'number' },
          { label: 'Lender Credits',   displayValue: fmtCurrency(loan.lender_credits),      field: 'lender_credits',      rawValue: loan.lender_credits,      type: 'number' },
          { label: 'Loan Costs',       displayValue: fmtCurrency(loan.loan_costs),          field: 'loan_costs',          rawValue: loan.loan_costs,          type: 'number' },
          { label: 'Total Closing',    displayValue: fmtCurrency(loan.total_closing_costs), field: 'total_closing_costs', rawValue: loan.total_closing_costs, type: 'number' },
          { label: 'Prepaid Items',    displayValue: fmtCurrency(loan.prepaid_items),       field: 'prepaid_items',       rawValue: loan.prepaid_items,       type: 'number' },
          { label: 'Escrow Impounds',  displayValue: fmtCurrency(loan.escrow_impounds),     field: 'escrow_impounds',     rawValue: loan.escrow_impounds,     type: 'number' },
          { label: 'MI Monthly',       displayValue: fmtCurrency(loan.mi_monthly),          field: 'mi_monthly',          rawValue: loan.mi_monthly,          type: 'number' },
          { label: 'MI Upfront',       displayValue: fmtCurrency(loan.mi_upfront),          field: 'mi_upfront',          rawValue: loan.mi_upfront,          type: 'number' },
        ]} />

        {/* 6 — Parties */}
        <EditableSectionCard title="Parties" onSave={handleSaveField} fields={[
          { label: 'Referring Agent',   displayValue: loan.referring_agent_name,  field: 'referring_agent_name',  rawValue: loan.referring_agent_name },
          { label: 'Ref Agent Email',   displayValue: loan.referring_agent_email, field: 'referring_agent_email', rawValue: loan.referring_agent_email },
          { label: 'Ref Agent Phone',   displayValue: loan.referring_agent_phone, field: 'referring_agent_phone', rawValue: loan.referring_agent_phone },
          { label: 'Listing Agent',     displayValue: loan.listing_agent_name,    field: 'listing_agent_name',    rawValue: loan.listing_agent_name },
          { label: 'Listing Email',     displayValue: loan.listing_agent_email,   field: 'listing_agent_email',   rawValue: loan.listing_agent_email },
          { label: "Buyer's Agent",     displayValue: loan.buyers_agent_name || loan.buyer_agent_name,   field: 'buyers_agent_name',  rawValue: loan.buyers_agent_name || loan.buyer_agent_name },
          { label: 'Buyer Agent Email', displayValue: loan.buyers_agent_email || loan.buyer_agent_email, field: 'buyers_agent_email', rawValue: loan.buyers_agent_email || loan.buyer_agent_email },
          { label: 'Title Company',     displayValue: loan.title_company,    field: 'title_company',    rawValue: loan.title_company },
          { label: 'Title Contact',     displayValue: loan.title_contact,    field: 'title_contact',    rawValue: loan.title_contact },
          { label: 'Title Email',       displayValue: loan.title_email,      field: 'title_email',      rawValue: loan.title_email },
          { label: 'Escrow Officer',    displayValue: loan.escrow_officer,   field: 'escrow_officer',   rawValue: loan.escrow_officer },
          { label: 'Processor',         displayValue: loan.processor_name,   field: 'processor_name',   rawValue: loan.processor_name },
          { label: 'Underwriter',       displayValue: loan.underwriter_name, field: 'underwriter_name', rawValue: loan.underwriter_name },
          { label: 'Lender',            displayValue: loan.lender_name,      field: 'lender_name',      rawValue: loan.lender_name },
          { label: 'Investor',          displayValue: loan.investor_name,    field: 'investor_name',    rawValue: loan.investor_name },
          { label: 'Channel',           displayValue: loan.channel,          field: 'channel',          rawValue: loan.channel },
        ]} />

        {/* 7 — Attribution */}
        <EditableSectionCard title="Attribution" onSave={handleSaveField} fields={[
          { label: 'Lead Source',        displayValue: loan.lead_source,        field: 'lead_source',        rawValue: loan.lead_source },
          { label: 'Referral Source',    displayValue: loan.referral_source,    field: 'referral_source',    rawValue: loan.referral_source },
          { label: 'Marketing Campaign', displayValue: loan.marketing_campaign, field: 'marketing_campaign', rawValue: loan.marketing_campaign },
        ]} />

        {/* Linked Contact */}
        {contact && (
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700">
              <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Linked Contact</h2>
            </div>
            <div className="p-4">
              <Link
                href={`/dashboard/contacts?id=${contact.id}`}
                className="font-mono font-semibold text-zinc-100 hover:text-indigo-400 transition-colors"
              >
                {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
              </Link>
              {contact.email && <p className="text-sm text-zinc-500 mt-1 font-mono">{contact.email}</p>}
              {contact.phone && <p className="text-sm text-zinc-500 font-mono">{contact.phone}</p>}
              {contact.referred_by && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 font-mono">Referred by</p>
                  <Link
                    href={`/dashboard/referral/${encodeURIComponent(contact.referred_by)}`}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 mt-0.5"
                  >
                    {contact.referred_by}
                    <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 8 — Notes */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Notes</h2>
          {saving && <span className="text-xs text-zinc-500 font-mono">Saving…</span>}
          {!saving && saved && <span className="text-xs text-[#4ADE80] font-mono">Saved ✓</span>}
        </div>
        <textarea
          value={notesVal}
          onChange={e => setNotesVal(e.target.value)}
          onBlur={handleNotesBlur}
          rows={6}
          placeholder="Add notes about this loan…"
          className="w-full p-4 text-sm text-zinc-200 bg-zinc-800/50 placeholder-zinc-500 focus:outline-none resize-y font-mono border-0"
        />
      </div>
    </div>
  )
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ loanId, docs, onRefresh }: { loanId: string; docs: DocRow[]; onRefresh: () => void }) {
  const supabase = createClient()
  const [signingId, setSigningId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const storagePath = `loans/${loanId}/${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file, { upsert: true })
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }
    // Insert document record
    await supabase.from('documents').insert({
      loan_id: loanId,
      file_name: file.name,
      file_path: storagePath,
      file_size: file.size,
      doc_type: file.type || null,
    })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRefresh()
  }

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
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 font-mono">
        <FileText size={24} />
        <p className="text-sm">No documents attached to this loan</p>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
        >
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload a document'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono font-semibold text-zinc-400">{docs.length} document{docs.length !== 1 ? 's' : ''}</h2>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono disabled:opacity-50"
        >
          <Upload size={12} />
          {uploading ? 'Uploading…' : '+ Upload Document'}
        </button>
      </div>
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-800/80 border-b border-zinc-700">
              <th className="text-left px-4 py-2.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">File</th>
              <th className="text-left px-4 py-2.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-2.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Uploaded</th>
              <th className="text-left px-4 py-2.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Size</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr key={doc.id} className={`${i !== 0 ? 'border-t border-zinc-700' : ''} hover:bg-zinc-800/50`}>
                <td className="px-4 py-3 font-mono font-medium text-zinc-200">{doc.file_name}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{doc.doc_type || '—'}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{fmtRelative(doc.created_at)}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{fmtBytes(doc.file_size)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={signingId === doc.id}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono disabled:opacity-50"
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
      <p className="text-sm text-zinc-500 font-mono mb-4">
        Run automations pre-filled with this loan&apos;s details. Output will be an Outlook draft.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKFLOWS.map(wf => (
          <div key={wf.id} className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 p-4 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{wf.icon}</span>
              <div className="flex-1">
                <p className="font-mono font-medium text-zinc-100 text-sm">{wf.name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{wf.description}</p>
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
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl shadow-black/60 w-full max-w-md">
        <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
          <div>
            <p className="font-mono font-semibold text-zinc-100">{workflow.icon} {workflow.name}</p>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">For: {loan.borrower_name || loan.loan_name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="flex flex-col items-center py-4 gap-2 text-emerald-700">
              <Check size={28} />
              <p className="font-medium">Sent to n8n</p>
              <p className="text-xs text-zinc-500 font-mono">Check Outlook for draft</p>
            </div>
          ) : (
            <>
              {/* Loan context preview */}
              <div className="bg-zinc-800 rounded-lg p-3 mb-4 text-xs text-zinc-400 font-mono space-y-1 border border-zinc-700">
                <p><span className="font-medium">Borrower:</span> {loan.borrower_name || '—'}</p>
                <p><span className="font-medium">Amount:</span> {fmtCurrency(loan.loan_amount)}</p>
                {loan.closing_date && <p><span className="font-medium">Closing:</span> {fmtDate(loan.closing_date)}</p>}
                {loan.property_address && <p><span className="font-medium">Property:</span> {loan.property_address}</p>}
              </div>

              {workflow.triggerType === 'pdf' ? (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">{workflow.triggerLabel}</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors bg-zinc-800/50"
                  >
                    {file ? (
                      <p className="text-sm text-emerald-700 font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-zinc-500 font-mono">Drop PDF here or click to browse</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Referral Details</label>
                  <textarea
                    rows={5}
                    value={referralText}
                    onChange={e => setReferralText(e.target.value)}
                    placeholder="Name, contact info, what they're looking for…"
                    className="w-full text-sm font-mono bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 resize-none"
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
  const [filter, setFilter] = useState<'all' | 'system' | 'manual'>('all')

  const INTERNAL_KEYS = new Set(['loan_id', 'contact_id', 'user_id', 'id', 'created_at'])
  const isSystem = (item: ActivityRow) => item.action.includes('.')

  const systemCount = activity.filter(isSystem).length
  const manualCount = activity.filter(i => !isSystem(i)).length
  const visible = filter === 'all'
    ? activity
    : filter === 'system'
      ? activity.filter(isSystem)
      : activity.filter(i => !isSystem(i))

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 font-mono">
        <Activity size={24} />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Filter bar */}
      <div className="flex gap-1 mb-4">
        {(['all', 'system', 'manual'] as const).map(f => {
          const label = f === 'all'
            ? `All (${activity.length})`
            : f === 'system'
              ? `System (${systemCount})`
              : `Manual (${manualCount})`
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-600'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-500 font-mono">
          <p className="text-sm">No {filter} activity</p>
        </div>
      ) : (
        <div className="space-y-0">
          {visible.map((item, i) => (
            <div key={item.id} className="flex gap-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSystem(item) ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                {i !== visible.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-1" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-mono text-zinc-200">{item.action}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{fmtRelative(item.created_at)}</p>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="mt-1 bg-zinc-800 rounded px-2 py-1 text-xs text-zinc-500 font-mono flex flex-wrap gap-x-3 gap-y-1 border border-zinc-700">
                    {Object.entries(item.metadata)
                      .filter(([k]) => !INTERNAL_KEYS.has(k))
                      .map(([k, v]) => (
                        <span key={k}><span className="font-medium">{k}:</span> {String(v)}</span>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Email history tab ─────────────────────────────────────────────────────────

const DRAFT_COLORS: Record<string, string> = {
  pre_approval:      'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  contract_received: 'bg-blue-900/40 text-blue-400 border-blue-800',
  final_cd:          'bg-amber-900/40 text-amber-400 border-amber-800',
  review_request:    'bg-purple-900/40 text-purple-400 border-purple-800',
  referral_intro:    'bg-orange-900/40 text-orange-400 border-orange-800',
  milestone:         'bg-indigo-900/40 text-indigo-400 border-indigo-800',
}

const DRAFT_LABELS: Record<string, string> = {
  pre_approval: 'Pre-Approval', contract_received: 'Contract', final_cd: 'Final CD',
  review_request: 'Review Request', referral_intro: 'Referral Intro', milestone: 'Milestone',
}

const STATUS_CLASSES: Record<string, string> = {
  pending:   'bg-amber-900/40 text-amber-400 border-amber-800',
  sent:      'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  discarded: 'bg-zinc-800 text-zinc-500 border-zinc-700',
}

function EmailHistoryTab({ drafts, onRefresh }: { drafts: EmailDraftRow[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  const updateStatus = async (id: string, status: 'sent' | 'discarded') => {
    await fetch('/api/email-drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    onRefresh()
  }

  useEffect(() => {
    if (!expanded) return
    const iframe = iframeRefs.current[expanded]
    const draft = drafts.find(d => d.id === expanded)
    if (!iframe || !draft) return
    const doc = iframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(`<html><head><style>body{font-family:-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;padding:16px;margin:0}</style></head><body>${draft.body_html}</body></html>`)
      doc.close()
    }
  }, [expanded, drafts])

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 font-mono">
        <Inbox size={24} />
        <p className="text-sm">No emails logged for this loan</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {drafts.map(draft => {
        const colorClass = DRAFT_COLORS[draft.automation_name] || 'bg-zinc-700 text-zinc-300 border-zinc-600'
        const label = DRAFT_LABELS[draft.automation_name] || draft.automation_name
        const isOpen = expanded === draft.id
        return (
          <div key={draft.id} className="border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-700 transition-colors">
            <button onClick={() => setExpanded(isOpen ? null : draft.id)} className="w-full text-left p-4 focus:outline-none">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLASSES[draft.status] ?? STATUS_CLASSES.pending}`}>{draft.status}</span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(draft.created_at)}</span>
                </div>
                {isOpen ? <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
              </div>
              <div className="text-sm font-medium text-zinc-100 mb-1 truncate">{draft.subject}</div>
              <div className="text-xs text-zinc-400 truncate">To: {draft.recipient_name ? `${draft.recipient_name} <${draft.recipient_email}>` : draft.recipient_email}</div>
              {!isOpen && draft.body_preview && <div className="text-xs text-zinc-500 mt-2 line-clamp-2">{draft.body_preview}</div>}
            </button>
            {isOpen && (
              <div className="border-t border-zinc-800">
                <div className="bg-zinc-800 rounded-b-lg">
                  <iframe
                    ref={el => { iframeRefs.current[draft.id] = el }}
                    className="w-full border-0 rounded-b-lg"
                    style={{ minHeight: '180px', maxHeight: '400px' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
                {draft.status === 'pending' && (
                  <div className="flex gap-2 p-3 border-t border-zinc-800">
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(draft.id, 'sent') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800 rounded-md transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Sent
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(draft.id, 'discarded') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Discard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-500 text-xs font-mono">—</span>
  const s = status.toLowerCase()
  let cls = 'bg-zinc-800 text-zinc-400 border border-zinc-600'
  if (['closed', 'funded'].some(v => s.includes(v))) cls = 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/40'
  else if (['process', 'submitted', 'conditional', 'clear to close', 'approved'].some(v => s.includes(v))) cls = 'bg-amber-500/10 text-amber-400 border-amber-500/40'
  else if (['started'].some(v => s.includes(v))) cls = 'bg-amber-500/10 text-amber-400 border-amber-500/40'
  else if (['cancelled', 'denied', 'withdrawn'].some(v => s.includes(v))) cls = 'bg-red-900/30 text-red-400 border-red-800'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
