'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Zap, Activity, Download, Upload,
  ChevronRight, AlertCircle, Check, Clock, Inbox, X, ChevronDown,
  Mail, Phone, MessageSquare, StickyNote, Trash2,
} from 'lucide-react'
import { useOutreachChat } from '@/components/outreach/OutreachChatContext'
import { normalizeToStageKey, statusHex } from '@/lib/constants/loan-stages'
import type { StageKey } from '@/lib/constants/loan-stages'
import '../../record-detail.css'
// No hardcoded fallback — a missing env var must fail closed rather than
// route every tenant's manual automation triggers through Adam's n8n instance.

// ── Types ────────────────────────────────────────────────────────────────────

interface Loan {
  id: string
  organization_id: string
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
  rate_lock_date: string | null
  rate_lock_days: number | null
  estimated_closing_date: string | null
  loan_created_date: string | null
  appraisal_ordered_date: string | null
  first_payment_date: string | null
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
  hoi_monthly: number | null
  property_taxes_monthly: number | null
  hoa_dues: number | null
  flood_insurance_monthly: number | null
  // Qualifying
  credit_score: number | null
  middle_score: number | null
  monthly_income: number | null
  monthly_debts: number | null
  front_end_dti: number | null
  back_end_dti: number | null
  // Borrower employment
  employer_name: string | null
  // Parties
  referring_agent_name: string | null
  referring_agent_email: string | null
  referring_agent_phone: string | null
  listing_agent_name: string | null
  listing_agent_email: string | null
  listing_agent_phone: string | null
  buyers_agent_name: string | null
  buyers_agent_email: string | null
  buyers_agent_phone: string | null
  buyer_agent_name: string | null
  buyer_agent_email: string | null
  buyer_agent_contact_id: string | null
  listing_agent_contact_id: string | null
  referral_contact_id: string | null
  title_company: string | null
  title_contact: string | null
  title_contact_id: string | null
  title_email: string | null
  escrow_officer: string | null
  escrow_contact_id: string | null
  transaction_coordinator_name: string | null
  transaction_coordinator_email: string | null
  transaction_coordinator_phone: string | null
  transaction_coordinator_contact_id: string | null
  processor_name: string | null
  underwriter_name: string | null
  lender_name: string | null
  investor_name: string | null
  channel: string | null
  // Attribution
  lead_source: string | null
  referral_source: string | null
  marketing_campaign: string | null
  // Commission
  commission_amount: number | null
  // Origination
  aus_result: string | null
  originator_comp: number | null
  // Borrower employment
  position_description: string | null
  self_employed: boolean | null
  borrower_birthdate: string | null
  // Co-borrower (expanded)
  co_borrower_home_phone: string | null
  co_borrower_work_phone: string | null
  co_borrower_birthdate: string | null
  co_borrower_marital_status: string | null
  co_borrower_contact_id: string | null
  // Revenue
  gross_loan_revenue: number | null
  net_loan_revenue: number | null
  // Notes
  notes: string | null
  // System
  contact_id: string | null
  arive_created_at: string | null
  arive_updated_at: string | null
  synced_at: string | null
  // Raw payload for keyDates extraction
  raw_payload: Record<string, unknown> | null
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
  type: string | null
  event_type: string | null
  summary: string | null
  entity_type: string | null
  metadata: Record<string, unknown> | null
  loan_name?: string | null
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

interface ContactEmailRow {
  id: string
  subject: string
  body_html: string | null
  body_text: string | null
  automation_source: string | null
  sent_at: string
  created_at: string
}

interface InboundEmailRow {
  id: string
  subject: string | null
  from_address: string | null
  body_snippet: string | null
  occurred_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  contact_id: string | null
  loan_id: string | null
}

// ── Workflow definitions ──────────────────────────────────────────────────────

const WORKFLOWS = [
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
    id: 'final-cd',
    name: 'Final CD Email',
    description: 'Upload a Closing Disclosure PDF — Claude extracts 10 fields and generates a personalized closing email draft.',
    triggerLabel: 'Upload CD PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-final-cd',
    icon: '📄',
  },
  {
    id: 'refi-intake',
    name: 'Refi Intake Email',
    description: 'Upload an Initial Fees Worksheet — Claude extracts loan details and drafts the refinance kickoff email.',
    triggerLabel: 'Upload IFW PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-refi-intake',
    icon: '🔄',
  },
  {
    id: 'refi-analysis',
    name: 'Refi Analysis',
    description: 'Upload an IFW PDF — builds a branded multi-page refinance analysis PDF and drafts the accompanying email.',
    triggerLabel: 'Upload IFW PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-refi-analysis',
    icon: '📊',
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
    id: 'website-lead',
    name: 'Website Lead Follow-up',
    description: 'Process a new inbound lead from styermortgage.com — creates Salesforce contact and drafts a personalized follow-up email.',
    triggerLabel: 'Enter Lead Details',
    triggerType: 'form' as const,
    webhookPath: 'loanos-website-lead',
    icon: '🌐',
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
  {
    id: 'contract-received',
    name: 'Contract Received',
    description: 'Save the executed contract as a source version and create a review task before any source changes.',
    triggerLabel: 'Upload Contract PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-contract-received',
    icon: '📝',
  },
  {
    id: 'review-request',
    name: 'Review Request Email',
    description: 'Creates an Outlook draft asking the borrower to leave a Google and Zillow review after closing.',
    triggerLabel: 'Create Review Draft',
    triggerType: 'direct' as const,
    webhookPath: 'loanos-outlook-draft',
    icon: '⭐',
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

function fmtPhone(val: string | null | undefined): string | null {
  if (!val) return null
  const d = val.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return val
}

function PhoneLink({ phone }: { phone: string | null | undefined }) {
  const fmt = fmtPhone(phone)
  if (!fmt) return <span className="text-muted-foreground">—</span>
  const digits = (phone ?? '').replace(/\D/g, '')
  return <a href={`tel:${digits}`} className="hover:underline">{fmt}</a>
}

function EmailLink({ email }: { email: string | null | undefined }) {
  if (!email) return <span className="text-muted-foreground">—</span>
  return <a href={`mailto:${email}`} className="hover:underline">{email}</a>
}

// ── Pipeline helpers (canonical stage ordering) ──────────────────────────────

// Ordered stage keys from earliest to latest in the pipeline
const STAGE_ORDER: StageKey[] = [
  'lead', 'new_application', 'pre_approval',
  'setup', 'disclosed', 'processing',
  'submitted', 'underwriting', 'approved', 'resubmit',
  'clear_to_close',
  'funded',
]

// Milestone completion: a milestone is complete when the loan has reached or passed the target stage
function hasReachedStage(status: string | null, target: StageKey): boolean {
  const key = normalizeToStageKey(status)
  return STAGE_ORDER.indexOf(key) >= STAGE_ORDER.indexOf(target)
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LoanDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const loanId = params.id as string
  const { organizationId } = useOrg()

  const [loan, setLoan] = useState<Loan | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [emailDrafts, setEmailDrafts] = useState<EmailDraftRow[]>([])
  const [contactEmails, setContactEmails] = useState<ContactEmailRow[]>([])
  const [inboundEmails, setInboundEmails] = useState<InboundEmailRow[]>([])
  const [loading, setLoading] = useState(true)
  const outreachChat = useOutreachChat() as unknown as {
    setActiveRecord?: (record: { id: string; type: 'contact' | 'loan'; name: string } | null) => void
  }
  const setActiveRecord = outreachChat.setActiveRecord
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automations' | 'activity' | 'emails'>('dashboard')
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null)
  // commission editing in Financials EditableSectionCard
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [headerInput, setHeaderInput] = useState('')
  // referral_contact_id FK now lives on the loan row directly
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false)
      }
    }
    if (actionsOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [actionsOpen])

  const fetchAll = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    const [loanRes, docsRes, activityRows, draftsRes, contactEmailsRes] = await Promise.all([
      supabase.from('loans').select('*').eq('id', loanId).eq('organization_id', organizationId).single(),
      supabase.from('documents').select('id, file_name, file_path, file_size, doc_type, created_at, uploaded_by').eq('loan_id', loanId).order('created_at', { ascending: false }),
      fetch(`/api/activity?loan_id=${loanId}&limit=50&columns=id,created_at,action,type,event_type,summary,entity_type,metadata`).then(r => r.ok ? r.json() : []),
      supabase.from('email_drafts').select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_emails').select('id, subject, body_html, body_text, automation_source, sent_at, created_at').eq('loan_id', loanId).order('sent_at', { ascending: false }).limit(100),
    ])

    if (loanRes.data) {
      setLoan(loanRes.data as unknown as Loan)
      const contactId = loanRes.data.contact_id
      if (contactId) {
        const [{ data: c }, inbound] = await Promise.all([
          supabase.from('contacts').select('id, first_name, last_name, email, phone, referred_by').eq('id', contactId).eq('organization_id', organizationId).single(),
          fetch(`/api/activity?type=email_inbound&or_filter=loan_id.eq.${loanId},contact_id.eq.${contactId}&order=occurred_at&limit=100&columns=id,subject,from_address,body_snippet,occurred_at,created_at,metadata,contact_id,loan_id`).then(r => r.ok ? r.json() : []),
        ])
        setContact(c)
        setInboundEmails((inbound || []) as InboundEmailRow[])
      } else {
        const inbound = await fetch(`/api/activity?type=email_inbound&loan_id=${loanId}&order=occurred_at&limit=100&columns=id,subject,from_address,body_snippet,occurred_at,created_at,metadata,contact_id,loan_id`).then(r => r.ok ? r.json() : [])
        setInboundEmails((inbound || []) as InboundEmailRow[])
      }

    }
    setDocs(docsRes.data || [])
    setActivity((activityRows || []) as ActivityRow[])
    setEmailDrafts((draftsRes.data || []) as EmailDraftRow[])
    setContactEmails((contactEmailsRes.data || []) as ContactEmailRow[])
    setLoading(false)
  }, [loanId, supabase, organizationId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const displayName =
    loan
      ? [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'
      : '(unnamed)'

  // Set active record so the global chat bot knows we're on a loan page.
  // Keep hook order stable across loading / not-found early returns.
  useEffect(() => {
    setActiveRecord?.({ id: loanId, type: 'loan', name: displayName })
    return () => setActiveRecord?.(null)
  }, [loanId, displayName, setActiveRecord])

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-muted-foreground text-sm font-mono">Loading…</div>
  )
  if (!loan) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3 text-muted-foreground font-mono">
      <AlertCircle size={24} />
      <p>Loan not found</p>
      <Link href="/dashboard/loans" className="text-amber-400 hover:underline text-sm">← Back to loans</Link>
    </div>
  )

  const productLabel = [loan.loan_program || loan.loan_type, loan.loan_term ? `${Math.round(loan.loan_term / 12)}yr` : null].filter(Boolean).join(' ')

  // Header inline edit save helper
  const handleDeleteLoan = async () => {
    if (!organizationId) return
    setDeleting(true)
    const { error } = await supabase.from('loans').delete().eq('id', loanId).eq('organization_id', organizationId)
    if (error) {
      setDeleting(false)
      alert('Failed to delete loan: ' + error.message)
      return
    }
    router.push('/dashboard/loans')
  }

  const saveHeaderField = async (field: string, value: string | number | null) => {
    if (!organizationId) return
    await supabase.from('loans').update({ [field]: value }).eq('id', loanId).eq('organization_id', organizationId)
    setLoan({ ...loan, [field]: value } as Loan)
    setEditingHeader(null)
    setHeaderInput('')
  }

  // Rate lock expiry warning
  const lockExpiryWarning = (() => {
    if (!loan.rate_lock_expiration) return null
    const exp = new Date(loan.rate_lock_expiration + 'T00:00:00')
    const now = new Date()
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { type: 'expired' as const, text: 'Lock Expired' }
    if (diffDays <= 5) return { type: 'warning' as const, text: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}` }
    return null
  })()

  return (
    <>
    <div className="record-detail loan-detail">
      {/* ── Header — slim, consolidated ── */}
      <div className="record-detail-header">
        <div>
          {/* Row 1: Breadcrumb + Actions */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/dashboard/loans" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground/80 font-mono transition-colors">
              <ArrowLeft size={13} /> Loan Records
            </Link>
            <div className="flex items-center gap-2">
              <InlineStatusSelect
                status={loan.status}
                loanId={loanId}
                onUpdate={s => setLoan(l => l ? { ...l, status: s } : l)}
              />
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={() => setActionsOpen(prev => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-muted hover:bg-input text-foreground rounded border border-input transition-colors font-mono"
                >
                  Actions <ChevronDown size={10} className={actionsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-input rounded-lg shadow-xl z-20 py-1 overflow-hidden max-h-[70vh] overflow-y-auto">
                    <p className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Automations</p>
                    {[
                      { label: 'Send PA Email', automationId: 'pre-approval' },
                      { label: 'Send CD Email', automationId: 'final-cd' },
                      { label: 'Refi Intake Email', automationId: 'refi-intake' },
                      { label: 'Send Refi Analysis', automationId: 'refi-analysis' },
                      { label: 'Referral Intro Email', automationId: 'referral-intro' },
                      { label: 'Website Lead Follow-up', automationId: 'website-lead' },
                      { label: 'New Application Received', automationId: 'new-application' },
                      { label: 'Contract Received', automationId: 'contract-received' },
                      { label: 'Review Request Email', automationId: 'review-request' },
                    ].map(({ label, automationId }) => (
                      <button
                        key={label}
                        onClick={() => { setActiveTab('automations'); setSelectedAutomationId(automationId); setActionsOpen(false) }}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                      >
                        <Zap size={12} className="text-muted-foreground shrink-0" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-input mt-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Tools</p>
                      <Link
                        href={`/dashboard/scenarios/new?loan_id=${loanId}`}
                        onClick={() => setActionsOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                      >
                        <span className="shrink-0">📐</span>
                        Create Scenario
                      </Link>
                    </div>
                    <div className="border-t border-input mt-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">View</p>
                      {[
                        { label: 'Activity Log', tab: 'activity' as const },
                        { label: 'Email History', tab: 'emails' as const },
                        { label: 'Documents', tab: 'dashboard' as const },
                      ].map(({ label, tab }) => (
                        <button
                          key={label}
                          onClick={() => { setActiveTab(tab); setActionsOpen(false) }}
                          className="w-full text-left px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-input mt-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-red-600">Danger</p>
                      <button
                        onClick={() => { setDeleteConfirmOpen(true); setActionsOpen(false) }}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={12} className="shrink-0" />
                        Delete Record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="record-detail-eyebrow">Loan record</div>
          {/* Row 2: Name + Days to Close */}
          <div className="record-detail-identity">
            <div className="min-w-0">
              <h1 className="font-mono font-bold text-foreground text-lg leading-tight truncate">
                {displayName}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {loan.contact_id ? (
                  <Link href={`/dashboard/contacts/${loan.contact_id}`} className="hover:text-foreground/80 transition-colors">
                    {displayName}
                  </Link>
                ) : displayName}
                {(loan.loan_number || loan.arive_loan_id) ? <span className="text-muted-foreground"> · #{loan.loan_number || loan.arive_loan_id}</span> : ''}
                {productLabel ? <span className="text-muted-foreground"> · {productLabel}</span> : ''}
              </p>
            </div>
            {(() => {
              if (normalizeToStageKey(loan.status) === 'funded') return null
              const target = loan.estimated_closing_date || loan.closing_date
              const dtc = target ? Math.ceil((new Date(target + 'T00:00:00').getTime() - Date.now()) / 86400000) : null
              const isUrgent = dtc != null && (dtc < 0 || dtc <= 7)
              if (dtc == null) return null
              return (
                <div className="shrink-0 text-right">
                  <span className={`text-2xl font-mono font-bold leading-none ${isUrgent ? 'text-amber-400' : 'text-foreground'}`}>
                    {Math.abs(dtc)}
                  </span>
                  <p className={`text-[9px] font-mono font-medium mt-0.5 ${isUrgent ? 'text-amber-400/80' : 'text-muted-foreground'}`}>
                    {dtc < 0 ? 'DAYS PAST CLOSE' : dtc === 0 ? 'CLOSES TODAY' : 'DAYS TO CLOSE'}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Row 3: Vital Signs — compact, all items visible */}
          <div className="record-detail-stats">
            <div className="record-detail-stats-grid">
              {loan.loan_amount != null && (
                <VitalStat label="Amount" value={fmtCurrency(loan.loan_amount)} color="#60A5FA" />
              )}
              {loan.interest_rate != null && (
                <VitalStat label="Rate" value={fmtPct(loan.interest_rate)} color="#4ADE80" />
              )}
              {loan.ltv != null && (
                <VitalStat label="LTV" value={fmtPct(loan.ltv)} color="#A855F7" />
              )}
              {(loan.front_end_dti || loan.back_end_dti) && (
                <VitalStat label="DTI" value={`${fmtPct(loan.front_end_dti)} / ${fmtPct(loan.back_end_dti)}`} color="#F59E0B" />
              )}
              <VitalStatEditable
                label="Lock Exp"
                value={fmtDate(loan.rate_lock_expiration)}
                field="rate_lock_expiration"
                rawValue={loan.rate_lock_expiration}
                editingHeader={editingHeader}
                headerInput={headerInput}
                setEditingHeader={setEditingHeader}
                setHeaderInput={setHeaderInput}
                saveHeaderField={saveHeaderField}
                warning={lockExpiryWarning}
              />
              <VitalStatEditable
                label="Est. Close"
                value={fmtDate(loan.estimated_closing_date)}
                field="estimated_closing_date"
                rawValue={loan.estimated_closing_date}
                editingHeader={editingHeader}
                headerInput={headerInput}
                setEditingHeader={setEditingHeader}
                setHeaderInput={setHeaderInput}
                saveHeaderField={saveHeaderField}
              />
              {loan.referring_agent_name && (
                <div className="shrink-0">
                  <p className="record-detail-stat-label text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Realtor</p>
                  <Link
                    href={
                      loan.referral_contact_id
                        ? `/dashboard/contacts/${loan.referral_contact_id}`
                        : `/dashboard/contacts/by-name/${encodeURIComponent(loan.referring_agent_name.trim())}`
                    }
                    className="text-sm font-mono text-foreground hover:text-foreground/80 transition-colors truncate block max-w-[9rem]"
                  >
                    {loan.referring_agent_name}
                  </Link>
                </div>
              )}
              <VitalStat label="2% planning estimate" value={loan.loan_amount != null ? fmtCurrency(loan.loan_amount * 0.02) : '—'} />
              {loan.lender_name && (
                <div className="ml-auto shrink-0">
                  <VitalStat label="Lender" value={loan.lender_name} color="#F472B6" />
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Milestones (left) + Property address (right, same height) */}
          <div className="record-detail-milestones">
            <div className="flex-1 min-w-0 rounded-lg border border-input bg-card px-4 py-3 shadow-sm">
              <MilestoneTimeline loan={loan} activity={activity} />
            </div>
            {loan.property_address && (
              <a
                href={`https://www.zillow.com/homes/${encodeURIComponent(
                  `${loan.property_address}${loan.property_city ? `, ${loan.property_city}` : ''}${loan.property_state ? `, ${loan.property_state}` : ''}${loan.property_zip ? ` ${loan.property_zip}` : ''}`
                )}_rb/`}
                target="_blank"
                rel="noopener noreferrer"
                className="record-detail-property"
                title="View on Zillow"
              >
                <span className="text-[9px] font-mono text-blue-500 dark:text-blue-400/80 uppercase tracking-wider leading-none mb-1">Property</span>
                <span className="text-sm font-mono text-blue-900 dark:text-blue-100 leading-tight font-medium whitespace-nowrap">{loan.property_address}</span>
                <span className="text-xs font-mono text-blue-700/70 dark:text-blue-300/70 leading-tight mt-1 whitespace-nowrap">
                  {[loan.property_city, loan.property_state].filter(Boolean).join(', ')}{loan.property_zip ? ` ${loan.property_zip}` : ''}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Tab bar — active tab uses loan status color */}
        <nav className="record-detail-tabs" aria-label="Loan record sections">
          {([
            { id: 'dashboard',   label: 'Overview' },
            { id: 'automations', label: 'Automations' },
            { id: 'activity',    label: `Activity (${activity.length})` },
            { id: 'emails',      label: `Emails (${emailDrafts.length + inboundEmails.length})` },
          ] as const).map(tab => {
            const tabHex = statusHex(loan.status)
            return (
              <button
                key={tab.id}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[11px] font-mono font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80'
                }`}
                style={activeTab === tab.id ? { borderBottomColor: tabHex } : undefined}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Content ── */}
      <div className="record-detail-content">
        {activeTab === 'dashboard' && (
          <DashboardTab loan={loan} setLoan={l => setLoan(l)} loanId={loanId} docs={docs} activity={activity} setActivity={setActivity} contact={contact} onRefresh={fetchAll} />
        )}
        {activeTab === 'automations' && (
          <div className="p-6"><AutomationsTab loan={loan} onActivityCreated={fetchAll} highlightId={selectedAutomationId} onClearHighlight={() => setSelectedAutomationId(null)} /></div>
        )}
        {activeTab === 'activity' && (
          <div className="p-6"><ActivityTab activity={activity} setActivity={setActivity} contactId={loan?.contact_id ?? null} /></div>
        )}
        {activeTab === 'emails' && (
          <div className="p-6"><EmailHistoryTab drafts={emailDrafts} contactEmails={contactEmails} inboundEmails={inboundEmails} onRefresh={fetchAll} /></div>
        )}
      </div>

    </div>

    {/* Delete confirmation modal */}
    {deleteConfirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-card border border-input rounded-xl p-6 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-950/50 rounded-lg">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <h2 className="text-sm font-mono font-semibold text-foreground">Delete Loan Record</h2>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-2">
            This will permanently delete <span className="text-foreground font-semibold">{loan.loan_name ?? loan.borrower_name ?? 'this loan'}</span> and all associated data.
          </p>
          <p className="text-xs font-mono text-red-400 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
              className="px-4 py-1.5 text-xs font-mono text-foreground/80 bg-muted hover:bg-input rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLoan}
              disabled={deleting}
              className="px-4 py-1.5 text-xs font-mono text-white bg-red-700 hover:bg-red-600 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 size={11} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ── Vital stat helpers (header) ────────────────────────────────────────────────

function VitalStat({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div className="shrink-0">
      <p className="record-detail-stat-label text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
      <p
        className="record-detail-stat-value text-sm font-mono font-semibold leading-none"
        style={color ? { color } : undefined}
      >
        {!color && <span className={highlight ? 'text-foreground' : 'text-foreground/80'}>{value}</span>}
        {color && value}
      </p>
    </div>
  )
}

function VitalStatEditable({ label, value, field, rawValue, editingHeader, headerInput, setEditingHeader, setHeaderInput, saveHeaderField, warning, inputType = 'date', color }: {
  label: string
  value: string
  field: string
  rawValue: string | number | null | undefined
  editingHeader: string | null
  headerInput: string
  setEditingHeader: (v: string | null) => void
  setHeaderInput: (v: string) => void
  saveHeaderField: (field: string, value: string | number | null) => void
  warning?: { type: 'expired' | 'warning'; text: string } | null
  inputType?: 'date' | 'number' | 'text'
  color?: string
}) {
  return (
    <div className="shrink-0">
      <p className="record-detail-stat-label text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {editingHeader === field ? (
          <input
            autoFocus
            type={inputType}
            step={inputType === 'number' ? '0.01' : undefined}
            value={headerInput}
            onChange={e => setHeaderInput(e.target.value)}
            onBlur={() => saveHeaderField(field, inputType === 'number' ? (headerInput ? parseFloat(headerInput) : null) : (headerInput || null))}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingHeader(null) }}
            className="w-32 text-sm font-mono font-semibold text-foreground bg-transparent border-b border-zinc-500 outline-none"
          />
        ) : (
          <p
            className="record-detail-stat-value text-sm font-mono font-semibold cursor-pointer hover:text-foreground transition-colors leading-none"
            style={color ? { color } : undefined}
            onClick={() => { setHeaderInput(rawValue != null ? String(rawValue) : ''); setEditingHeader(field) }}
          >
            {value}
          </p>
        )}
        {warning && (
          <span className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded leading-none ${
            warning.type === 'expired'
              ? 'bg-red-950/60 text-red-400'
              : 'bg-amber-950/60 text-amber-400'
          }`}>
            {warning.text}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function DashboardTab({ loan, setLoan, loanId, docs, activity, setActivity, contact, onRefresh }: {
  loan: Loan
  setLoan: (l: Loan) => void
  loanId: string
  docs: DocRow[]
  activity: ActivityRow[]
  setActivity: (a: ActivityRow[]) => void
  contact: ContactRow | null
  onRefresh: () => void
}) {
  const supabase = createClient()
  const { organizationId } = useOrg()

  const handleSaveField = useCallback(async (field: string, value: string | number | null) => {
    if (!organizationId) return
    const { error } = await supabase.from('loans').update({ [field]: value }).eq('id', loanId).eq('organization_id', organizationId)
    if (!error) setLoan({ ...loan, [field]: value } as Loan)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, loan, organizationId])

  const handleSaveMultiple = useCallback(async (fields: Record<string, string | null>) => {
    if (!organizationId) return
    const { error } = await supabase.from('loans').update(fields).eq('id', loanId).eq('organization_id', organizationId)
    if (!error) setLoan({ ...loan, ...fields } as Loan)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, loan, organizationId])

  const handleReassignContact = useCallback(async (contactId: string) => {
    if (!organizationId) return
    const { error } = await supabase.from('loans').update({ contact_id: contactId }).eq('id', loanId).eq('organization_id', organizationId)
    if (!error) onRefresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, onRefresh, organizationId])

  return (
    <div className="record-detail-overview space-y-6">

      <section className="record-detail-note" aria-label="Loan notes">
        <h2>Loan notes</h2>
        <p>{loan.notes?.trim() || 'No loan notes recorded yet.'}</p>
      </section>
      {/* ── Section 1: Parties (full width) ── */}
      <CommunicationHub loan={loan} activity={activity} contact={contact} />

      {/* ── Section 2: Key Dates (3/4) + Documents & Activity sidebar (1/4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">
        <KeyDatesGrid loan={loan} onSave={handleSaveField} />
        <div className="flex flex-col gap-6">
          <DocumentsSidebarPanel loanId={loanId} docs={docs} onRefresh={onRefresh} />
          <LoanActivityPanel activity={activity} setActivity={setActivity} contactId={loan.contact_id ?? null} />
        </div>
      </div>

      <div className="border-t border-input/40 my-6" />

      {/* ── Section 4: Loan Details — horizontal grid to reduce scrolling ── */}
      <details className="record-detail-full-details">
        <summary>Full loan details <span>Borrower, property, terms, financials, and referral information</span></summary>
        <div className="space-y-6">
        {/* Row 1: Borrower (1/2) + Co-Borrower (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EditableSectionCard title="Borrower" onSave={handleSaveField} fields={[
              { label: 'First Name',     displayValue: loan.borrower_first_name, field: 'borrower_first_name', rawValue: loan.borrower_first_name },
              { label: 'Last Name',      displayValue: loan.borrower_last_name,  field: 'borrower_last_name',  rawValue: loan.borrower_last_name },
              { label: 'Email',          displayValue: <EmailLink email={loan.borrower_email} />, field: 'borrower_email', rawValue: loan.borrower_email },
              { label: 'Phone',          displayValue: <PhoneLink phone={loan.borrower_phone} />, field: 'borrower_phone', rawValue: loan.borrower_phone },
              { label: 'DOB',            displayValue: loan.borrower_birthdate ? fmtDate(loan.borrower_birthdate) : null, field: 'borrower_birthdate', rawValue: loan.borrower_birthdate },
              { label: 'Credit Score',   displayValue: loan.credit_score != null ? String(loan.credit_score) : null, field: 'credit_score', rawValue: loan.credit_score, type: 'number' },
              { label: 'Employer',       displayValue: loan.employer_name, field: 'employer_name', rawValue: loan.employer_name },
              { label: 'Position',       displayValue: loan.position_description, field: 'position_description', rawValue: loan.position_description },
              ...(loan.self_employed ? [{ label: 'Self-Employed', displayValue: 'Yes' as React.ReactNode }] : []),
              { label: 'Monthly Income', displayValue: fmtCurrency(loan.monthly_income), field: 'monthly_income', rawValue: loan.monthly_income, type: 'number' as const },
              { label: 'Front DTI',      displayValue: fmtPct(loan.front_end_dti), field: 'front_end_dti', rawValue: loan.front_end_dti, type: 'percent' as const },
              { label: 'Back DTI',       displayValue: fmtPct(loan.back_end_dti),  field: 'back_end_dti',  rawValue: loan.back_end_dti,  type: 'percent' as const },
            ]} />

            {loan.co_borrower_name ? (
              <EditableSectionCard title="Co-Borrower" onSave={handleSaveField} fields={[
                { label: 'Name',           displayValue: loan.co_borrower_name,    field: 'co_borrower_name',    rawValue: loan.co_borrower_name },
                { label: 'Email',          displayValue: <EmailLink email={loan.co_borrower_email} />, field: 'co_borrower_email', rawValue: loan.co_borrower_email },
                { label: 'Phone',          displayValue: <PhoneLink phone={loan.co_borrower_phone} />, field: 'co_borrower_phone', rawValue: loan.co_borrower_phone },
                { label: 'Home Phone',     displayValue: <PhoneLink phone={loan.co_borrower_home_phone} />, field: 'co_borrower_home_phone', rawValue: loan.co_borrower_home_phone },
                { label: 'Work Phone',     displayValue: <PhoneLink phone={loan.co_borrower_work_phone} />, field: 'co_borrower_work_phone', rawValue: loan.co_borrower_work_phone },
                { label: 'DOB',            displayValue: loan.co_borrower_birthdate ? fmtDate(loan.co_borrower_birthdate) : null, field: 'co_borrower_birthdate', rawValue: loan.co_borrower_birthdate },
                { label: 'Marital Status', displayValue: loan.co_borrower_marital_status, field: 'co_borrower_marital_status', rawValue: loan.co_borrower_marital_status },
              ]} />
            ) : <div />}
        </div>

        {/* Row 2: Property (1/2) + Loan Terms (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EditableSectionCard title="Property" onSave={handleSaveField} fields={[
            { label: 'Address',        displayValue: loan.property_address, field: 'property_address', rawValue: loan.property_address },
            { label: 'City',           displayValue: loan.property_city,    field: 'property_city',    rawValue: loan.property_city },
            { label: 'State',          displayValue: loan.property_state,   field: 'property_state',   rawValue: loan.property_state },
            { label: 'Zip',            displayValue: loan.property_zip,     field: 'property_zip',     rawValue: loan.property_zip },
            { label: 'County',         displayValue: loan.property_county,  field: 'property_county',  rawValue: loan.property_county },
            ...(loan.property_type ? [{ label: 'Type', displayValue: loan.property_type as React.ReactNode, field: 'property_type', rawValue: loan.property_type }] : []),
            ...(loan.occupancy_type || loan.occupancy ? [{ label: 'Occupancy', displayValue: (loan.occupancy_type || loan.occupancy) as React.ReactNode, field: 'occupancy_type', rawValue: loan.occupancy_type || loan.occupancy }] : []),
            { label: 'Purchase Price', displayValue: fmtCurrency(loan.purchase_price),  field: 'purchase_price',  rawValue: loan.purchase_price,  type: 'number' as const },
            { label: 'Appraised Value',displayValue: fmtCurrency(loan.appraised_value), field: 'appraised_value', rawValue: loan.appraised_value, type: 'number' as const },
          ]} />

          <EditableSectionCard title="Loan Terms" onSave={handleSaveField} fields={[
            { label: 'Loan Number',   displayValue: loan.loan_number,   field: 'loan_number',   rawValue: loan.loan_number },
            { label: 'Loan Amount',   displayValue: fmtCurrency(loan.loan_amount),   field: 'loan_amount',   rawValue: loan.loan_amount,   type: 'number' },
            { label: 'Loan Purpose',  displayValue: loan.loan_purpose,  field: 'loan_purpose',  rawValue: loan.loan_purpose },
            { label: 'Loan Type',     displayValue: loan.loan_type,     field: 'loan_type',     rawValue: loan.loan_type },
            { label: 'Program',       displayValue: loan.loan_program,  field: 'loan_program',  rawValue: loan.loan_program },
            { label: 'Rate',          displayValue: fmtPct(loan.interest_rate), field: 'interest_rate', rawValue: loan.interest_rate, type: 'percent' },
            { label: 'Term',          displayValue: loan.loan_term ? `${Math.round(loan.loan_term / 12)} years` : null, field: 'loan_term', rawValue: loan.loan_term, type: 'number' },
            { label: 'Down Payment',  displayValue: loan.down_payment ? `${fmtCurrency(loan.down_payment)}${loan.down_payment_pct ? ` (${fmtPct(loan.down_payment_pct)})` : ''}` : null, field: 'down_payment', rawValue: loan.down_payment, type: 'number' },
            { label: 'LTV',           displayValue: fmtPct(loan.ltv),   field: 'ltv',   rawValue: loan.ltv,   type: 'percent' },
            ...(loan.cltv ? [{ label: 'CLTV', displayValue: fmtPct(loan.cltv) as React.ReactNode, field: 'cltv', rawValue: loan.cltv, type: 'percent' as const }] : []),
          ]} />
        </div>

        {/* Row 2: Financials + Parties & Agents side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EditableSectionCard title="Financials" onSave={handleSaveField} fields={[
            { label: 'Commission',      displayValue: fmtCurrency(loan.commission_amount), field: 'commission_amount', rawValue: loan.commission_amount, type: 'number', labelColor: 'text-[#C9A84C]' },
            ...(loan.gross_loan_revenue ? [{ label: 'Gross Revenue', displayValue: fmtCurrency(loan.gross_loan_revenue) as React.ReactNode, field: 'gross_loan_revenue', rawValue: loan.gross_loan_revenue, type: 'number' as const }] : []),
            ...(loan.net_loan_revenue ? [{ label: 'Net Revenue', displayValue: fmtCurrency(loan.net_loan_revenue) as React.ReactNode, field: 'net_loan_revenue', rawValue: loan.net_loan_revenue, type: 'number' as const }] : []),
            { label: 'Monthly P&I',   displayValue: fmtCurrency(loan.monthly_payment), field: 'monthly_payment', rawValue: loan.monthly_payment, type: 'number' },
            ...(loan.piti ? [{ label: 'PITI', displayValue: fmtCurrency(loan.piti) as React.ReactNode, field: 'piti', rawValue: loan.piti, type: 'number' as const }] : []),
            ...(loan.cash_to_close ? [{ label: 'Cash to Close', displayValue: fmtCurrency(loan.cash_to_close) as React.ReactNode, field: 'cash_to_close', rawValue: loan.cash_to_close, type: 'number' as const }] : []),
            ...(loan.seller_credits ? [{ label: 'Seller Credits', displayValue: fmtCurrency(loan.seller_credits) as React.ReactNode, field: 'seller_credits', rawValue: loan.seller_credits, type: 'number' as const }] : []),
            ...(loan.total_closing_costs ? [{ label: 'Total Closing', displayValue: fmtCurrency(loan.total_closing_costs) as React.ReactNode, field: 'total_closing_costs', rawValue: loan.total_closing_costs, type: 'number' as const }] : []),
            { label: 'HOI Monthly',    displayValue: fmtCurrency(loan.hoi_monthly),              field: 'hoi_monthly',              rawValue: loan.hoi_monthly,              type: 'number' as const },
            { label: 'Property Taxes', displayValue: fmtCurrency(loan.property_taxes_monthly), field: 'property_taxes_monthly', rawValue: loan.property_taxes_monthly, type: 'number' as const },
            ...(loan.hoa_dues ? [{ label: 'HOA Dues', displayValue: fmtCurrency(loan.hoa_dues) as React.ReactNode, field: 'hoa_dues', rawValue: loan.hoa_dues, type: 'number' as const }] : []),
          ]} />

          <EditableSectionCard title="Parties & Agents" onSave={handleSaveField} onSaveMultiple={handleSaveMultiple} fields={[
            { label: 'Referring Agent',   displayValue: loan.referring_agent_name,  field: 'referring_agent_name',  rawValue: loan.referring_agent_name,  searchContacts: true, relatedFields: { email: 'referring_agent_email', phone: 'referring_agent_phone' }, labelColor: 'text-amber-400' },
            { label: 'Ref Agent Email',   displayValue: loan.referring_agent_email, field: 'referring_agent_email', rawValue: loan.referring_agent_email, labelColor: 'text-amber-400/70' },
            { label: 'Ref Agent Phone',   displayValue: loan.referring_agent_phone, field: 'referring_agent_phone', rawValue: loan.referring_agent_phone, labelColor: 'text-amber-400/70' },
            { label: "Buyer's Agent",     displayValue: loan.buyers_agent_name || loan.buyer_agent_name, field: 'buyers_agent_name', rawValue: loan.buyers_agent_name || loan.buyer_agent_name, searchContacts: true, relatedFields: { email: 'buyers_agent_email', phone: 'buyers_agent_phone' }, labelColor: 'text-blue-400' },
            { label: 'BA Email',          displayValue: loan.buyers_agent_email || loan.buyer_agent_email, field: 'buyers_agent_email', rawValue: loan.buyers_agent_email || loan.buyer_agent_email, labelColor: 'text-blue-400/70' },
            { label: 'BA Phone',          displayValue: <PhoneLink phone={loan.buyers_agent_phone} />, field: 'buyers_agent_phone', rawValue: loan.buyers_agent_phone, labelColor: 'text-blue-400/70' },
            { label: 'Listing Agent',     displayValue: loan.listing_agent_name,    field: 'listing_agent_name',    rawValue: loan.listing_agent_name,    searchContacts: true, relatedFields: { email: 'listing_agent_email', phone: 'listing_agent_phone' }, labelColor: 'text-sky-400' },
            { label: 'LA Email',          displayValue: loan.listing_agent_email,   field: 'listing_agent_email',   rawValue: loan.listing_agent_email,   labelColor: 'text-sky-400/70' },
            { label: 'LA Phone',          displayValue: <PhoneLink phone={loan.listing_agent_phone} />, field: 'listing_agent_phone', rawValue: loan.listing_agent_phone, labelColor: 'text-sky-400/70' },
            ...(loan.title_company || loan.title_contact ? [
              { label: 'Title Company', displayValue: loan.title_company as React.ReactNode, field: 'title_company', rawValue: loan.title_company },
              { label: 'Title Contact', displayValue: loan.title_contact as React.ReactNode, field: 'title_contact', rawValue: loan.title_contact },
              { label: 'Title Email',   displayValue: (<EmailLink email={loan.title_email} />) as React.ReactNode, field: 'title_email', rawValue: loan.title_email },
            ] : []),
            ...(loan.escrow_officer ? [{ label: 'Escrow Officer', displayValue: loan.escrow_officer as React.ReactNode, field: 'escrow_officer', rawValue: loan.escrow_officer }] : []),
            ...(loan.processor_name ? [{ label: 'Processor', displayValue: loan.processor_name as React.ReactNode, field: 'processor_name', rawValue: loan.processor_name }] : []),
            ...(loan.underwriter_name ? [{ label: 'Underwriter', displayValue: loan.underwriter_name as React.ReactNode, field: 'underwriter_name', rawValue: loan.underwriter_name }] : []),
            ...(loan.lender_name ? [{ label: 'Lender', displayValue: loan.lender_name as React.ReactNode, field: 'lender_name', rawValue: loan.lender_name }] : []),
          ]} />
        </div>

        {/* Row 3: Attribution + Linked Contact side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(loan.lead_source || loan.referral_source || loan.channel) && (
            <EditableSectionCard title="Attribution" onSave={handleSaveField} fields={[
              ...(loan.lead_source ? [{ label: 'Lead Source', displayValue: loan.lead_source as React.ReactNode, field: 'lead_source', rawValue: loan.lead_source }] : []),
              ...(loan.referral_source ? [{ label: 'Referral Source', displayValue: loan.referral_source as React.ReactNode, field: 'referral_source', rawValue: loan.referral_source }] : []),
              ...(loan.channel ? [{ label: 'Channel', displayValue: loan.channel as React.ReactNode, field: 'channel', rawValue: loan.channel }] : []),
            ]} />
          )}
          <LinkedContactCard loan={loan} contact={contact} onReassignContact={handleReassignContact} />
        </div>
        </div>
      </details>

    </div>
  )
}

// ── CommunicationHub — Contact Cards with one-click actions ──────────────────

function CommunicationHub({ loan, activity, contact }: { loan: Loan; activity: ActivityRow[]; contact: ContactRow | null }) {

  // Build party list — fall back to linked contact when loan borrower fields are empty
  const parties: {
    role: string
    name: string | null
    email: string | null
    phone: string | null
    contactId: string | null
  }[] = [
    {
      role: 'Borrower',
      name: [loan.borrower_first_name ?? contact?.first_name, loan.borrower_last_name ?? contact?.last_name].filter(Boolean).join(' ') || loan.borrower_name || null,
      email: loan.borrower_email ?? contact?.email ?? null,
      phone: loan.borrower_phone ?? contact?.phone ?? null,
      contactId: loan.contact_id,
    },
    ...(loan.co_borrower_name ? [{
      role: 'Co-Borrower',
      name: loan.co_borrower_name,
      email: loan.co_borrower_email,
      phone: loan.co_borrower_phone,
      contactId: loan.co_borrower_contact_id,
    }] : []),
    ...(loan.buyers_agent_name || loan.buyer_agent_name ? [{
      role: "Buyer's Agent",
      name: loan.buyers_agent_name || loan.buyer_agent_name,
      email: loan.buyers_agent_email || loan.buyer_agent_email,
      phone: loan.buyers_agent_phone,
      contactId: loan.buyer_agent_contact_id,
    }] : []),
    ...(loan.listing_agent_name ? [{
      role: 'Listing Agent',
      name: loan.listing_agent_name,
      email: loan.listing_agent_email,
      phone: loan.listing_agent_phone,
      contactId: loan.listing_agent_contact_id,
    }] : []),
    ...(loan.transaction_coordinator_name ? [{
      role: 'TC',
      name: loan.transaction_coordinator_name,
      email: loan.transaction_coordinator_email,
      phone: loan.transaction_coordinator_phone,
      contactId: loan.transaction_coordinator_contact_id,
    }] : []),
    ...(loan.title_company || loan.title_contact ? [{
      role: 'Title',
      name: loan.title_contact || loan.title_company,
      email: loan.title_email,
      phone: null as string | null,
      contactId: loan.title_contact_id,
    }] : []),
    ...(loan.escrow_officer ? [{
      role: 'Escrow',
      name: loan.escrow_officer,
      email: null as string | null,
      phone: null as string | null,
      contactId: loan.escrow_contact_id,
    }] : []),
    ...(loan.referring_agent_name ? [{
      role: 'Referring Agent',
      name: loan.referring_agent_name,
      email: loan.referring_agent_email,
      phone: loan.referring_agent_phone,
      contactId: loan.referral_contact_id,
    }] : []),
  ]

  // Derive "last contacted" from activity log per email address
  const lastContactedMap = new Map<string, string>()
  for (const a of activity) {
    const meta = a.metadata as Record<string, string> | null
    const email = meta?.recipient_email ?? meta?.to ?? meta?.email ?? null
    if (email && !lastContactedMap.has(email.toLowerCase())) {
      lastContactedMap.set(email.toLowerCase(), a.created_at)
    }
  }

  // Role-specific colors for party cards
  const ROLE_HEX: Record<string, string> = {
    'Borrower':        '#60A5FA',  // blue
    'Co-Borrower':     '#818CF8',  // indigo
    "Buyer's Agent":   '#4ADE80',  // green
    'TC':              '#2DD4BF',  // teal
    'Listing Agent':   '#F59E0B',  // amber
    'Title':           '#A855F7',  // purple
    'Escrow':          '#F472B6',  // pink
    'Referring Agent': '#C9A84C',  // gold
  }

  // Group messaging helpers
  const borrowers = parties.filter(p => p.role === 'Borrower' || p.role === 'Co-Borrower')
  const agents    = parties.filter(p => p.role === "Buyer's Agent" || p.role === 'TC' || p.role === 'Listing Agent')
  const allParties = parties

  const emailHref = (list: typeof parties) => {
    const emails = list.map(p => p.email).filter(Boolean).join(',')
    return emails ? `mailto:${emails}` : null
  }
  const textHref = (list: typeof parties) => {
    const phones = list.map(p => p.phone).filter(Boolean).map(ph => ph!.replace(/\D/g, '')).join(',')
    return phones ? `sms:${phones}` : null
  }

  const groupButtons: { label: string; href: string | null; title: string }[] = [
    { label: 'Email All',        href: emailHref(allParties), title: 'Email everyone on this loan' },
    { label: 'Text Borrowers',   href: textHref(borrowers),  title: 'Text Doug + Tiffany' },
    { label: 'Email Borrowers',  href: emailHref(borrowers), title: 'Email borrowers' },
    { label: 'Email Agents + TC', href: emailHref(agents),   title: "Email buyer's agent + TC + listing agent" },
  ]

  return (
    <div className="record-detail-parties">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h2 className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">Parties</h2>
        <div className="flex items-center flex-wrap gap-1.5">
          {groupButtons.map(btn => btn.href && (
            <a
              key={btn.label}
              href={btn.href}
              title={btn.title}
              className="text-[9px] font-mono px-2 py-0.5 rounded border border-input text-muted-foreground hover:text-foreground hover:border-zinc-500 transition-colors whitespace-nowrap"
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {parties.map(p => {
          const lastContacted = p.email ? lastContactedMap.get(p.email.toLowerCase()) : undefined
          const roleHex = ROLE_HEX[p.role] ?? '#6B7280'
          return (
            <div key={p.role} className="group rounded-lg p-4 border border-input hover:border-input/80 transition-colors shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: roleHex, backgroundColor: `${roleHex}0A` }}>
              {/* Name + Role */}
              <div className="mb-3">
                <p className="text-[11px] font-mono uppercase tracking-wide font-semibold leading-none" style={{ color: roleHex }}>{p.role}</p>
                {p.contactId ? (
                  <Link href={`/dashboard/contacts/${p.contactId}`} className="text-base font-mono font-semibold text-foreground hover:text-foreground/80 transition-colors truncate block mt-1">
                    {p.name || '—'}
                  </Link>
                ) : (
                  <p className="text-base font-mono font-semibold text-foreground truncate mt-1">{p.name || '—'}</p>
                )}
              </div>

              {/* Action icons — colored on hover */}
              <div className="flex items-center gap-2 mb-2">
                {p.phone && (
                  <a
                    href={`tel:${p.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    style={{ ['--hover-bg' as string]: roleHex }}
                    title={`Call ${fmtPhone(p.phone)}`}
                    onMouseEnter={e => (e.currentTarget.style.background = `${roleHex}33`)}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <Phone size={13} />
                  </a>
                )}
                {p.phone && (
                  <a
                    href={`sms:${p.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title={`Text ${fmtPhone(p.phone)}`}
                    onMouseEnter={e => (e.currentTarget.style.background = `${roleHex}33`)}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <MessageSquare size={13} />
                  </a>
                )}
                {p.email && (
                  <a
                    href={`mailto:${p.email}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title={`Email ${p.email}`}
                    onMouseEnter={e => (e.currentTarget.style.background = `${roleHex}33`)}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <Mail size={13} />
                  </a>
                )}
              </div>

              {/* Last Contacted timestamp */}
              {lastContacted ? (
                <p className="text-[10px] font-mono text-muted-foreground">Last contacted {fmtRelative(lastContacted)}</p>
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground/60">No contact logged</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── LinkedContactCard — link from loan to borrower contact ─────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LinkedContactCard({ loan, contact, onReassignContact }: {
  loan: Loan
  contact: ContactRow | null
  onReassignContact: (contactId: string) => Promise<void>
}) {
  if (!contact && !loan.contact_id) return null
  const name = contact ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() : 'Unknown'
  return (
    <div style={{
      background: 'var(--surface, var(--card))', border: '1px solid var(--border, var(--input))',
      borderRadius: 6, padding: '16px 20px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted, #888)', letterSpacing: '0.1em', marginBottom: 8 }}>
        LINKED CONTACT
      </div>
      {contact ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href={`/dashboard/contacts/${contact.id}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#c9a84c', textDecoration: 'none' }}
          >
            {name}
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\D/g, '')}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                <Phone size={14} />
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                <Mail size={14} />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          No linked contact
        </div>
      )}
    </div>
  )
}

// ── KeyDatesGrid — compact grid from raw_payload + loan columns ──────────────

function KeyDatesGrid({ loan, onSave }: { loan: Loan; onSave: (field: string, value: string | null) => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expanded, setExpanded] = useState(false)

  // raw_payload may be a JSON string (pre-import loans) or an object (webhook loans)
  const rp: Record<string, string> = (() => {
    const raw = loan.raw_payload
    if (!raw) return {}
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, string>
    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return typeof p === 'object' && p ? p : {} } catch { return {} } }
    return {}
  })()
  const rpDate = (key: string): string | null => {
    const v = rp[key]
    return v && typeof v === 'string' && v.trim() ? v.trim() : null
  }

  const primaryDates: { label: string; key: string; field?: string; value: string | null; hex: string }[] = [
    { label: 'Application',        key: 'app',   field: 'application_date',       value: loan.application_date,       hex: '#60A5FA' },
    { label: 'Sales Contract',     key: 'sc',    value: rpDate('keyDates_salesContractDate'), hex: '#818CF8' },
    { label: 'Intent to Proceed',  key: 'itp',   value: rpDate('keyDates_intentToProceedDate'), hex: '#7C3AED' },
    { label: 'Submission',         key: 'sub',   field: 'submission_date',        value: loan.submission_date,        hex: '#2563EB' },
    { label: 'Approval',           key: 'apr',   field: 'approval_date',          value: loan.approval_date,          hex: '#0891B2' },
    { label: 'Est. Close',         key: 'est',   field: 'estimated_closing_date', value: loan.estimated_closing_date, hex: '#F59E0B' },
    { label: 'Funded',             key: 'fund',  field: 'funding_date',           value: loan.funding_date,           hex: '#C9A84C' },
    { label: 'Rate Lock',          key: 'rl',    field: 'rate_lock_date',         value: loan.rate_lock_date,         hex: '#4ADE80' },
    { label: 'Lock Expiry',        key: 'rle',   field: 'rate_lock_expiration',   value: loan.rate_lock_expiration,   hex: '#EF4444' },
  ]

  const secondaryDates: { label: string; key: string; field?: string; value: string | null; hex: string }[] = [
    { label: 'LE Sent',              key: 'les',   value: rpDate('keyDates_initialLESentDate'),       hex: '#60A5FA' },
    { label: 'LE Signed',            key: 'lsg',   value: rpDate('keyDates_initialLESignedDate'),     hex: '#60A5FA' },
    { label: 'Recent LE Sent',       key: 'rles',  value: rpDate('keyDates_mostRecentLESentDate'),    hex: '#818CF8' },
    { label: 'Recent LE Signed',     key: 'rlsg',  value: rpDate('keyDates_mostRecentLESignedDate'),  hex: '#818CF8' },
    { label: 'CD Sent',              key: 'cds',   value: rpDate('keyDates_initialCDSentDate'),       hex: '#7C3AED' },
    { label: 'CD Signed',            key: 'cdsg',  value: rpDate('keyDates_initialCDSignedDate'),     hex: '#7C3AED' },
    { label: 'Recent CD Sent',       key: 'rcds',  value: rpDate('keyDates_mostRecentCDSentDate'),    hex: '#A855F7' },
    { label: 'Recent CD Signed',     key: 'rcdsg', value: rpDate('keyDates_mostRecentCDSignedDate'),  hex: '#A855F7' },
    { label: 'Appraisal Ordered',    key: 'ao',    field: 'appraisal_ordered_date', value: loan.appraisal_ordered_date ?? rpDate('keyDates_appraisalOrderedDate'), hex: '#0891B2' },
    { label: 'Appraisal Received',   key: 'ar',    value: rpDate('keyDates_appraisalDeliveryDate'),   hex: '#0891B2' },
    { label: 'Appraisal Contingency',key: 'ac',    value: rpDate('keyDates_appraisalContingency'),    hex: '#0891B2' },
    { label: 'Title Ordered',        key: 'to',    value: rpDate('keyDates_titleOrderedDate'),        hex: '#D97706' },
    { label: 'Title Received',       key: 'tr',    value: rpDate('keyDates_titleReceivedDate'),       hex: '#D97706' },
    { label: 'Credit Ordered',       key: 'co',    value: rpDate('keyDates_creditOrderDate'),         hex: '#F59E0B' },
    { label: 'Credit Expires',       key: 'ce',    value: rpDate('keyDates_creditExpirationDate'),    hex: '#F59E0B' },
    { label: 'HOI Ordered',          key: 'ho',    value: rpDate('keyDates_hoiOrderedDate'),          hex: '#34D399' },
    { label: 'HOI Received',         key: 'hr',    value: rpDate('keyDates_hoiReceivedDate'),         hex: '#34D399' },
    { label: 'TRID Date',            key: 'trid',  value: rpDate('keyDates_tridDate'),                hex: '#6B7280' },
    { label: 'First Payment',        key: 'fp',    field: 'first_payment_date', value: loan.first_payment_date ?? rpDate('keyDates_firstPaymentDate'), hex: '#C9A84C' },
    { label: 'Est. Funding',         key: 'ef',    value: rpDate('keyDates_estimatedFundingDate'),    hex: '#C9A84C' },
    { label: 'PA Expiry',            key: 'pae',   value: rpDate('keyDates_preApprovalExpiryDate'),   hex: '#EF4444' },
    { label: 'Loan Contingency',     key: 'lc',    value: rpDate('keyDates_loanContingency'),         hex: '#6B7280' },
    { label: 'Closing Contingency',  key: 'cc',    value: rpDate('keyDates_closingContingency'),      hex: '#6B7280' },
    { label: 'Avoid EPO',            key: 'epo',   value: rpDate('keyDates_dateToAvoidEPO'),          hex: '#EF4444' },
  ]

  const populatedSecondary = secondaryDates.filter(d => d.value)

  const handleSave = (field: string) => {
    onSave(field, editValue || null)
    setEditing(null)
  }

  const renderDate = (d: { label: string; key: string; field?: string; value: string | null; hex: string }) => {
    const canEdit = !!d.field
    return (
      <div key={d.key} className="flex items-center justify-between gap-2 py-1 group">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-1 h-1 rounded-full shrink-0" style={{ background: d.value ? d.hex : 'var(--input)' }} />
          <span className="text-[11px] font-mono truncate" style={{ color: d.value ? d.hex : 'var(--muted)' }}>{d.label}</span>
        </div>
        {editing === d.field ? (
          <input
            autoFocus
            type="date"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => handleSave(d.field!)}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null) }}
            className="w-28 text-[11px] font-mono text-foreground bg-transparent border-b border-zinc-500 outline-none text-right"
          />
        ) : (
          <span
            className={`text-[11px] font-mono text-right shrink-0 ${canEdit ? 'cursor-pointer hover:text-foreground' : ''} transition-colors`}
            style={{ color: d.value ? 'var(--fg)' : 'var(--input)' }}
            onClick={canEdit ? () => { setEditValue(d.value ?? ''); setEditing(d.field!) } : undefined}
          >
            {fmtDate(d.value)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border border-input rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-secondary border-b border-input flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock size={11} className="text-[#C9A84C]" /> Key Dates
        </h2>
        {populatedSecondary.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[11px] font-mono text-muted-foreground hover:text-muted-foreground transition-colors flex items-center gap-1"
          >
            {expanded ? 'Less' : `+${populatedSecondary.length} more`}
            <ChevronDown size={10} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        )}
      </div>
      <div className="px-4 py-1.5 grid grid-cols-2 gap-x-6">
        <div>{primaryDates.slice(0, 5).map(renderDate)}</div>
        <div>{primaryDates.slice(5).map(renderDate)}</div>
      </div>
      {expanded && populatedSecondary.length > 0 && (
        <div className="px-4 pb-2 pt-1 border-t border-input/40 grid grid-cols-2 gap-x-6">
          <div>{populatedSecondary.slice(0, Math.ceil(populatedSecondary.length / 2)).map(renderDate)}</div>
          <div>{populatedSecondary.slice(Math.ceil(populatedSecondary.length / 2)).map(renderDate)}</div>
        </div>
      )}
    </div>
  )
}


const LOAN_ACTIVITY_CONFIG: Record<string, { icon: typeof Phone; color: string; bg: string; label: string }> = {
  call:           { icon: Phone,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Call' },
  text:           { icon: MessageSquare,  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Text' },
  email:          { icon: Mail,           color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Email' },
  email_inbound:  { icon: Inbox,          color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  label: 'Inbound' },
  email_outbound: { icon: Mail,           color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Sent' },
  note:           { icon: StickyNote,     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Note' },
}

function LoanActivityPanel({ activity, setActivity, contactId }: {
  activity: ActivityRow[]
  setActivity: (a: ActivityRow[]) => void
  contactId: string | null
}) {
  const supabase = createClient()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [panelFilter, setPanelFilter] = useState<'system' | 'all'>('system')

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    await supabase.from('activity_log').delete().eq('id', id)
    setActivity(activity.filter(a => a.id !== id))
    setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  // Loan activity feed = system events only. Correspondence (emails, calls,
  // texts, notes) lives on the contact record — see the "View on contact" link
  // at the bottom of the panel.
  const CORRESPONDENCE_TYPES = new Set(['call', 'text', 'email', 'note', 'email_inbound', 'email_outbound'])
  const CORRESPONDENCE_ACTIONS = new Set(['imessage.received', 'imessage.sent', 'email.received', 'email_received'])

  const feedItems = activity
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(a => {
      if (panelFilter === 'all') return true
      const aType = (a.metadata as Record<string, unknown> | null)?.activity_type as string | undefined ?? a.type
      const action = a.action ?? ''
      // 'system' filter — exclude correspondence
      return !CORRESPONDENCE_TYPES.has(aType ?? '') && !CORRESPONDENCE_ACTIONS.has(action)
    })

  return (
    <div className="bg-card/80 border border-input rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: 480 }}>
      {/* Header */}
      <div className="px-4 py-2.5 bg-muted/80 border-b border-input flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={11} className="text-[#C9A84C]" />
          <h2 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Activity {feedItems.length > 0 && `(${feedItems.length})`}
          </h2>
        </div>
      </div>

      {/* Filter tabs + contact link */}
      <div className="px-3 pt-2 pb-2 shrink-0 flex items-center justify-between gap-2 border-b border-input/60">
        <div className="flex gap-0.5 flex-wrap">
          {([['system', 'System'], ['all', 'All']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPanelFilter(key)}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold tracking-wide transition-colors"
              style={{
                background: panelFilter === key ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: panelFilter === key ? '#c9a84c' : 'var(--muted)',
                border: 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {contactId && (
          <Link
            href={`/dashboard/contacts/${contactId}`}
            className="text-[10px] font-mono text-muted-foreground hover:text-[#c9a84c] transition-colors shrink-0"
          >
            Log calls, texts, notes on contact →
          </Link>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {feedItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground font-mono">{panelFilter === 'all' ? 'No activity yet.' : 'No system activity yet.'}</p>
          </div>
        ) : (
          feedItems.map(item => {
            const aType = (item.metadata as Record<string, unknown> | null)?.activity_type as string | undefined ?? item.type ?? 'note'
            const cfg = LOAN_ACTIVITY_CONFIG[aType] ?? LOAN_ACTIVITY_CONFIG.note
            const Icon = cfg.icon
            const ts = new Date(item.created_at)
            const now = new Date()
            const diffDays = Math.floor((now.getTime() - ts.getTime()) / 86400000)
            const timeLabel = diffDays === 0
              ? ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : diffDays === 1 ? 'Yesterday'
              : diffDays < 7 ? `${diffDays}d ago`
              : ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const isExpanded = expandedIds.has(item.id)
            const isDeleting = deletingIds.has(item.id)
            const preview = item.summary
              ? item.summary.replace(/\n+/g, ' ').slice(0, 70) + (item.summary.length > 70 ? '…' : '')
              : null

            return (
              <div key={item.id} className="border-b border-input/50">
                <div
                  className="flex gap-2.5 px-4 py-2.5 items-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={11} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-muted-foreground">{timeLabel}</span>
                        <ChevronDown size={10} className="text-muted-foreground transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                      </div>
                    </div>
                    {!isExpanded && preview && (
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">{preview}</p>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 pl-12">
                    {item.summary && (
                      <p className="text-[11px] font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap mb-2">{item.summary}</p>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-red-500 border border-red-500/30 rounded px-2 py-0.5 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={10} /> {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Documents sidebar panel ───────────────────────────────────────────────────

function DocumentsSidebarPanel({ loanId, docs, onRefresh }: { loanId: string; docs: DocRow[]; onRefresh: () => void }) {
  const supabase = createClient()
  const { userId, organizationId } = useOrg()
  const [signingId, setSigningId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    if (!userId) { alert('Not authenticated'); setUploading(false); return }
    const storagePath = `${userId}/${loanId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return }
    if (!organizationId) { alert('No organization found'); setUploading(false); return }
    const { error: insertError } = await supabase.from('documents').insert({ user_id: userId, loan_id: loanId, file_name: file.name, file_path: storagePath, file_size: file.size, doc_type: file.type || null, organization_id: organizationId })
    if (insertError) { alert('Record save failed: ' + insertError.message); setUploading(false); return }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRefresh()
  }

  const handleDownload = async (doc: DocRow) => {
    setSigningId(doc.id)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 120)
    setSigningId(null)
    if (error || !data?.signedUrl) { alert('Could not generate download link.'); return }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="bg-card border border-input rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-secondary border-b border-input flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Documents</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-mono">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#C9A84C] hover:text-[#d4b860] disabled:opacity-50 transition-colors"
          >
            <Upload size={10} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
      {docs.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground font-mono">No documents uploaded</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono border border-input text-muted-foreground hover:border-[#C9A84C] hover:text-[#C9A84C] rounded transition-colors disabled:opacity-50"
          >
            <Upload size={10} /> Upload Document
          </button>
        </div>
      ) : (
        <div>
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              className={`flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors ${i > 0 ? 'border-t border-input/50' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={11} className="text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-foreground truncate">{doc.file_name}</span>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                disabled={signingId === doc.id}
                className="text-muted-foreground hover:text-foreground/80 disabled:opacity-50 transition-colors ml-2 shrink-0"
                title="Download"
              >
                {signingId === doc.id ? <span className="text-[11px] font-mono">…</span> : <Download size={11} />}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 border-t border-input"><a className="text-xs underline" href={`/dashboard/loans/${loanId}/document-review`}>Contract and conditional-approval reviews →</a></div>
    </div>
  )
}

// ── Milestone timeline ────────────────────────────────────────────────────────

function MilestoneTimeline({ loan, activity }: { loan: Loan; activity?: ActivityRow[] }) {
  const currentKey = normalizeToStageKey(loan.status)

  // Hex colors per milestone stage
  const MILESTONE_HEX: Record<StageKey, string> = {
    lead: '#6B7280', new_application: '#60A5FA', pre_approval: '#818CF8',
    setup: '#64748B', disclosed: '#7C3AED', submitted: '#2563EB',
    approved: '#0891B2', resubmit: '#D97706', underwriting: '#0E7490',
    processing: '#D97706', clear_to_close: '#16A34A', funded: '#C9A84C',
  }

  // Each milestone maps to a canonical StageKey — complete when loan has reached or passed that stage
  const milestones: { label: string; date: string | null; est?: string | null; reachedAt: StageKey; activeAt: StageKey; notifyLabel?: string; hex: string }[] = [
    { label: 'Application',               date: loan.application_date,      reachedAt: 'new_application', activeAt: 'new_application', hex: MILESTONE_HEX.new_application },
    { label: 'Disclosures (LE)',           date: null,                       reachedAt: 'disclosed',       activeAt: 'setup', hex: MILESTONE_HEX.disclosed },
    { label: 'Processing',                date: loan.submission_date,       reachedAt: 'processing',      activeAt: 'disclosed', notifyLabel: 'Agents notified', hex: MILESTONE_HEX.processing },
    { label: 'Underwriting',              date: null,                       reachedAt: 'submitted',       activeAt: 'processing', notifyLabel: 'Agents notified', hex: MILESTONE_HEX.submitted },
    { label: 'Approved w/ Cond.',          date: loan.approval_date,         reachedAt: 'approved',        activeAt: 'submitted', notifyLabel: 'Agents notified', hex: MILESTONE_HEX.approved },
    { label: 'CTC',                        date: null,                       reachedAt: 'clear_to_close',  activeAt: 'approved', notifyLabel: 'Agents notified', hex: MILESTONE_HEX.clear_to_close },
    { label: 'Closing Docs',               date: null,                       reachedAt: 'clear_to_close',  activeAt: 'clear_to_close',
      est: loan.estimated_closing_date, hex: MILESTONE_HEX.clear_to_close },
    { label: 'Funded',
      date: loan.funding_date || loan.closing_date,                         reachedAt: 'funded',          activeAt: 'clear_to_close',
      est: loan.closing_date || loan.estimated_closing_date, hex: MILESTONE_HEX.funded },
  ]

  // Check if agents were notified for a milestone by looking at activity log
  const notifiedStages = new Set<string>()
  if (activity) {
    for (const a of activity) {
      const action = a.action ?? ''
      if (action.includes('status_updated') || action.includes('email') || action.includes('milestone')) {
        const meta = a.metadata as Record<string, string> | null
        const to = meta?.new_status ?? meta?.status ?? meta?.milestone ?? null
        if (to) {
          const key = normalizeToStageKey(to)
          notifiedStages.add(key)
        }
      }
    }
  }

  return (
    <div>
      <h2 className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-3">Milestones</h2>
      <div className="record-detail-milestone-track flex flex-nowrap items-start gap-0 overflow-x-auto">
        {milestones.map((m, i) => {
          const isComplete = m.date != null || hasReachedStage(loan.status, m.reachedAt)
          const isActive = !isComplete && (currentKey === m.activeAt || hasReachedStage(loan.status, m.activeAt))
          const isPending = !isComplete && !isActive
          const estDate = m.est ?? null
          const wasNotified = isComplete && m.notifyLabel && notifiedStages.has(m.reachedAt)

          const sub =
            isComplete && m.date
              ? fmtDate(m.date)
              : isComplete && !m.date
                ? 'Done'
                : isActive
                  ? 'In progress'
                  : isPending && estDate
                    ? `Est. ${fmtDate(estDate)}`
                    : null

          return (
            <div key={m.label} className="contents">
              <div className="flex flex-col items-center shrink-0 w-[5rem] sm:w-[5.5rem] px-0.5">
                {/* Indicator — stage-colored */}
                <div className="flex justify-center mb-1.5">
                  {isComplete ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: m.hex }}
                    >
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: m.hex }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.hex }} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-input shrink-0" />
                  )}
                </div>
                {/* Label — colored when complete/active */}
                <p
                  className={`text-[11px] font-mono font-medium text-center leading-tight line-clamp-2 ${
                    isPending ? 'text-muted-foreground' : ''
                  }`}
                  style={isComplete ? { color: m.hex } : isActive ? { color: m.hex } : undefined}
                >
                  {m.label}
                </p>
                {/* Sub-line: date or status */}
                {sub && (
                  <p className={`text-[9px] font-mono text-center leading-tight mt-0.5 ${
                    isActive ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {sub}
                  </p>
                )}
                {/* Agent notification indicator */}
                {isComplete && m.notifyLabel && (
                  <p className={`text-[8px] font-mono text-center leading-tight mt-0.5 ${
                    wasNotified ? 'text-emerald-500' : 'text-amber-400'
                  }`}>
                    {wasNotified ? '✓ Notified' : '⚠ Not sent'}
                  </p>
                )}
              </div>
              {i < milestones.length - 1 && (
                <div
                  className="record-detail-milestone-connector shrink-0 self-start mt-[9px] h-px w-2 sm:w-3"
                  style={{ background: isComplete ? `${m.hex}66` : 'var(--input)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ── Editable field helpers ────────────────────────────────────────────────────

const LOAN_STATUS_OPTS = [
  'Loan Setup', 'Disclosed', 'Submitted to UW', 'Approved with Conditions',
  'Resubmitted', 'Clear to Close',
  'Pre-Approved', 'Pre-App', 'Application', 'Lead',
  'Closed', 'Funded', 'On Hold', 'Cancelled', 'Denied', 'Dead',
]

type FieldType = 'text' | 'number' | 'date' | 'select' | 'percent'

interface ContactSuggestion {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
}

function EditableRow({ label, displayValue, field, rawValue, type = 'text', options, onSave, onSaveMultiple, searchContacts, relatedFields, labelColor, index }: {
  label: string
  displayValue: React.ReactNode
  field?: string
  rawValue?: string | number | null
  type?: FieldType
  options?: string[]
  onSave?: (field: string, value: string | number | null) => Promise<void>
  onSaveMultiple?: (fields: Record<string, string | null>) => Promise<void>
  searchContacts?: boolean
  relatedFields?: { email?: string; phone?: string }
  labelColor?: string
  index: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
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
    setSuggestions([])
    let val: string | number | null = (draft ?? '').trim() || null
    if ((type === 'number' || type === 'percent') && val != null) {
      const n = parseFloat(val as string)
      val = isNaN(n) ? null : n
    }
    await onSave!(field!, val)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function selectContact(contact: ContactSuggestion) {
    if (!canEdit || !field) return
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    setSuggestions([])
    setEditing(false)
    // Bundle name + email + phone into one save so there's a single state update
    if (onSaveMultiple) {
      const updates: Record<string, string | null> = { [field]: name }
      if (relatedFields?.email) updates[relatedFields.email] = contact.email ?? null
      if (relatedFields?.phone) updates[relatedFields.phone] = contact.phone ?? null
      await onSaveMultiple(updates)
    } else {
      await onSave!(field, name)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setSuggestions([]); setEditing(false) }
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      selectRef.current?.focus()
      if (searchContacts && inputRef.current) {
        const r = inputRef.current.getBoundingClientRect()
        setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width })
      }
    }
  }, [editing, searchContacts])

  useEffect(() => {
    if (!searchContacts || !editing || draft.trim().length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, contact_type')
        .or(`first_name.ilike.%${draft.trim()}%,last_name.ilike.%${draft.trim()}%`)
        .limit(6)
      setSuggestions(data ?? [])
      setLoadingSuggestions(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [draft, searchContacts, editing])

  return (
    <div className={`record-detail-field flex items-start px-4 py-2 text-sm group ${index > 0 ? 'border-t border-input/60' : ''}`}>
      <span className={`w-40 shrink-0 text-xs font-mono leading-5 mt-0.5 ${labelColor ?? 'text-muted-foreground'}`}>{label}</span>
      <div className="flex-1 min-w-0">
        {editing && searchContacts ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={e => {
                setDraft(e.target.value)
                if (inputRef.current) {
                  const r = inputRef.current.getBoundingClientRect()
                  setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width })
                }
              }}
              onBlur={commit}
              onKeyDown={onKeyDown}
              placeholder="Type to search contacts…"
              className="text-xs font-mono border border-amber-500/50 rounded px-2 py-0.5 bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50 w-full placeholder-zinc-600"
            />
            {(loadingSuggestions || suggestions.length > 0) && dropdownRect && typeof document !== 'undefined' && createPortal(
              <div
                style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: Math.max(dropdownRect.width, 256), zIndex: 9999 }}
                className="bg-muted border border-input rounded shadow-xl max-h-52 overflow-y-auto"
              >
                {loadingSuggestions && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-xs font-mono text-muted-foreground">Searching…</div>
                )}
                {suggestions.map(c => (
                  <button
                    key={c.id}
                    onMouseDown={e => { e.preventDefault(); selectContact(c) }}
                    className="w-full text-left px-3 py-2 hover:bg-input transition-colors border-b border-input/50 last:border-0"
                  >
                    <div className="text-xs font-mono text-foreground font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                    </div>
                    {c.email && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{c.email}</div>}
                    {c.contact_type && <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide">{c.contact_type}</span>}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </>
        ) : editing ? (
          type === 'select' ? (
            <select
              ref={selectRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              className="text-xs font-mono border border-amber-500/50 rounded px-2 py-0.5 bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50 w-full"
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
              className="text-xs font-mono border border-amber-500/50 rounded px-2 py-0.5 bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50 w-full"
            />
          )
        ) : (
          <span
            onClick={canEdit ? startEdit : undefined}
            className={`font-mono text-sm ${canEdit ? 'cursor-text hover:text-amber-400 transition-colors' : ''} ${saved ? 'text-[#4ADE80]' : 'text-foreground'}`}
          >
            {saved ? '✓ Saved' : (displayValue ?? <span className="text-muted-foreground">—</span>)}
          </span>
        )}
      </div>
      {canEdit && !editing && !saved && (
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 ml-2 mt-0.5 text-muted-foreground hover:text-amber-400 transition-all shrink-0"
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

function EditableSectionCard({ title, fields, onSave, onSaveMultiple }: {
  title: string
  fields: {
    label: string
    displayValue: React.ReactNode
    field?: string
    rawValue?: string | number | null
    type?: FieldType
    options?: string[]
    searchContacts?: boolean
    relatedFields?: { email?: string; phone?: string }
    labelColor?: string
  }[]
  onSave: (field: string, value: string | number | null) => Promise<void>
  onSaveMultiple?: (fields: Record<string, string | null>) => Promise<void>
}) {
  return (
    <div className="record-detail-field-card bg-card/80 border border-input rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/80 border-b border-input">
        <h2 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
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
          onSaveMultiple={onSaveMultiple}
          searchContacts={f.searchContacts}
          relatedFields={f.relatedFields}
          labelColor={f.labelColor}
        />
      ))}
    </div>
  )
}


// ── Automations tab ───────────────────────────────────────────────────────────

function AutomationsTab({ loan, onActivityCreated, highlightId, onClearHighlight }: { loan: Loan; onActivityCreated: () => void; highlightId?: string | null; onClearHighlight?: () => void }) {
  const [activeModal, setActiveModal] = useState<typeof WORKFLOWS[0] | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Auto-open modal when an automation is pre-selected from Actions dropdown
  useEffect(() => {
    if (highlightId) {
      const wf = WORKFLOWS.find(w => w.id === highlightId)
      if (wf) {
        setActiveModal(wf)
        onClearHighlight?.()
      }
      // Scroll to the highlighted card
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [highlightId, onClearHighlight])

  return (
    <div>
      <p className="text-sm text-muted-foreground font-mono mb-4">
        Run automations pre-filled with this loan&apos;s details. Output will be an Outlook draft.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKFLOWS.map(wf => (
          <div
            key={wf.id}
            ref={wf.id === highlightId ? highlightRef : undefined}
            className={`bg-card/80 border rounded-lg shadow-lg shadow-black/50 p-4 transition-colors ${
              wf.id === highlightId ? 'border-[#C9A84C] ring-1 ring-[#C9A84C]/30' : 'border-input hover:border-input'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{wf.icon}</span>
              <div className="flex-1">
                <p className="font-mono font-medium text-foreground text-sm">{wf.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{wf.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(wf)}
              className="mt-3 w-full py-1.5 text-xs font-medium bg-amber-500 text-zinc-900 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
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

function LoanTriggerModal({ workflow, loan, onClose, onSuccess }: {
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
  const { userId } = useOrg()

  const displayName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'

  const handleSubmit = async () => {
    setSending(true)
    setError('')
    try {
      const loanContext = {
        loan_id: loan.id,
        organization_id: loan.organization_id,
        loan_name: loan.loan_name,
        borrower_name: displayName,
        borrower_email: loan.borrower_email,
        loan_amount: loan.loan_amount,
        property_address: [loan.property_address, loan.property_city, loan.property_state].filter(Boolean).join(', '),
        closing_date: loan.closing_date,
        contact_id: loan.contact_id,
      }

      // Route through same-origin proxy — avoids CORS/upload-stall failures
      // that surfaced as "Failed to fetch" when the browser hit n8n directly.
      const proxyUrl = `/api/automations/n8n-proxy?path=${encodeURIComponent(workflow.webhookPath)}`

      let res: Response
      if (workflow.triggerType === 'direct') {
        // Review request: build email HTML and send to generic Outlook draft webhook
        if (!loan.borrower_email) { setError('No borrower email on this loan.'); setSending(false); return }
        const firstName = loan.borrower_first_name || displayName.split(' ')[0] || 'there'
        const googleUrl = 'https://share.google/ddpwv31jI2oqzN5Ia'
        const zillowUrl = 'https://www.zillow.com/lender-profile/adamstyer/'
        const emailHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f9f9f9;font-family:Georgia,serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden"><tr><td style="background:#1a1a1a;padding:28px 40px"><p style="margin:0;color:#c9a84c;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Adam Styer | Mortgage Solutions LP</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#333;margin:0 0 20px">Hey ${firstName},</p><p style="font-size:16px;line-height:1.7;color:#555;margin:0 0 16px">Congrats again on closing! It was a genuine privilege walking alongside you through one of the biggest moments of your life.</p><p style="font-size:16px;line-height:1.7;color:#555;margin:0 0 24px">If you have two minutes, I\u2019d be so grateful if you left a quick review. It helps other families find trusted mortgage help.</p><table cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td style="background:#c9a84c;border-radius:6px;padding:14px 28px"><a href="${googleUrl}" style="color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;text-decoration:none">\u2b50 Leave a Google Review</a></td></tr></table><table cellpadding="0" cellspacing="0" style="margin:0 0 32px"><tr><td style="background:#006aff;border-radius:6px;padding:14px 28px"><a href="${zillowUrl}" style="color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;text-decoration:none">\ud83c\udfe0 Leave a Zillow Review</a></td></tr></table><p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 32px">Two minutes. Your own words. That\u2019s all it takes.</p><p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 32px">Praying for you and your family in the new home.</p><p style="font-size:15px;color:#333;margin:0">\u2014 Adam<br><strong>Adam Styer | Mortgage Solutions LP</strong><br>NMLS #513013</p></td></tr><tr><td style="background:#f4f4f4;padding:20px 40px;border-top:1px solid #eee"><p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999">Adam Styer | Mortgage Solutions LP \u00b7 NMLS #513013 \u00b7 Austin, TX</p></td></tr></table></td></tr></table></body></html>`
        res = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: loan.borrower_email,
            subject: 'A quick favor \u2014 can you leave a review?',
            body: emailHtml,
          }),
        })
      } else if (workflow.triggerType === 'pdf') {
        if (!file) { setError('Please select a file.'); setSending(false); return }
        if (!userId) { setError('Not authenticated.'); setSending(false); return }
        // Upload to Supabase Storage first to sidestep Vercel's 4.5MB function
        // ingress (FUNCTION_PAYLOAD_TOO_LARGE on multipart). n8n then fetches
        // the file from Storage server-side using its service-role JWT.
        const supabase = createClient()
        const storagePath = `${userId}/${loan.id}/automations/${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, { contentType: file.type || 'application/pdf' })
        if (uploadErr) { setError('Upload failed: ' + uploadErr.message); setSending(false); return }

        if (workflow.id === 'contract-received') {
          // n8n's contract-received webhook routes on body.doc_type === 'contract'
          // and downloads the PDF from `documents/{body.file_path}` itself.
          res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doc_type: 'contract',
              file_path: storagePath,
              file_name: file.name,
              loan_id: loan.id,
              user_id: userId,
              organization_id: loan.organization_id,
            }),
          })
        } else {
          // Other pdf automations (pre-approval, final-cd, refi-intake, …)
          // still expect multipart `file` + `loan_context` at n8n. Send a
          // signed URL; the proxy fetches and re-emits the multipart shape.
          const { data: signed, error: signErr } = await supabase.storage
            .from('documents')
            .createSignedUrl(storagePath, 600)
          if (signErr || !signed?.signedUrl) {
            setError('Could not generate signed URL: ' + (signErr?.message || 'unknown'))
            setSending(false)
            return
          }
          res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...loanContext, file_url: signed.signedUrl, file_name: file.name }),
          })
        }
      } else {
        res = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...loanContext, notes: referralText }),
        })
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`n8n returned ${res.status}: ${errText.substring(0, 200) || 'no details'}`)
      }
      setDone(true)
      setTimeout(onSuccess, 1200)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      console.error('[LoanTriggerModal]', workflow.name, msg)
      setError(msg === 'Failed to fetch' ? 'Could not reach n8n — check your connection or try again' : msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-input rounded-lg shadow-xl shadow-black/60 w-full max-w-md">
        <div className="px-5 py-4 border-b border-input flex items-center justify-between">
          <div>
            <p className="font-mono font-semibold text-foreground">{workflow.icon} {workflow.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">For: {displayName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground/80 text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="flex flex-col items-center py-4 gap-2 text-[#4ADE80]">
              <Check size={28} />
              <p className="font-medium">{workflow.id === 'contract-received' ? 'Contract review saved' : 'Request accepted'}</p>
              <p className="text-xs text-muted-foreground font-mono">{workflow.id === 'contract-received' ? 'Open Document review to inspect the source and assign work.' : 'Check the workflow result before taking the next action.'}</p>
            </div>
          ) : (
            <>
              <div className="bg-muted rounded-lg p-3 mb-4 text-xs text-muted-foreground font-mono space-y-1 border border-input">
                <p><span className="font-medium">Borrower:</span> {displayName}</p>
                <p><span className="font-medium">Amount:</span> {fmtCurrency(loan.loan_amount)}</p>
                {loan.closing_date && <p><span className="font-medium">Closing:</span> {fmtDate(loan.closing_date)}</p>}
                {loan.property_address && <p><span className="font-medium">Property:</span> {loan.property_address}</p>}
              </div>

              {workflow.triggerType === 'direct' ? (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-xs font-mono text-amber-200/80">
                  <p>This will create an Outlook draft to <span className="text-foreground font-medium">{loan.borrower_email || '(no email)'}</span> with Google + Zillow review links.</p>
                  <p className="mt-1.5 text-muted-foreground">You can edit the draft before sending.</p>
                </div>
              ) : workflow.triggerType === 'pdf' ? (
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">{workflow.triggerLabel}</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors bg-muted/50"
                  >
                    {file ? (
                      <p className="text-sm text-[#4ADE80] font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground font-mono">Drop PDF here or click to browse</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Referral Details</label>
                  <textarea
                    rows={5}
                    value={referralText}
                    onChange={e => setReferralText(e.target.value)}
                    placeholder="Name, contact info, what they're looking for…"
                    className="w-full text-sm font-mono bg-muted border border-input text-foreground rounded-lg p-2.5 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="mt-4 w-full py-2 text-sm font-medium bg-amber-500 text-zinc-900 rounded-lg hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
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


// ── Activity Tab (read-only timeline) ───────────────────────────────────────

function ActivityTab({ activity, setActivity, contactId }: { activity: ActivityRow[]; setActivity: (a: ActivityRow[]) => void; contactId: string | null }) {
  const supabase = createClient()
  const [filter, setFilter] = useState<'system' | 'all'>('system')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleDeleteActivity = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    await supabase.from('activity_log').delete().eq('id', id)
    setActivity(activity.filter(a => a.id !== id))
    setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  const CORRESPONDENCE_ACTIONS_AT = new Set(['imessage.received', 'imessage.sent', 'email.received', 'email_received'])
  const isCorrespondence = (item: ActivityRow) => {
    const aType = (item.metadata as Record<string, unknown> | null)?.activity_type as string | undefined ?? item.type
    return ['call', 'text', 'email', 'note', 'email_inbound', 'email_outbound'].includes(aType ?? '') || CORRESPONDENCE_ACTIONS_AT.has(item.action)
  }

  const visible = activity.filter(item => {
    if (filter === 'all') return true
    // 'system' filter — exclude correspondence (lives on contact record)
    return !isCorrespondence(item)
  })

  return (
    <div className="max-w-2xl">
      {contactId && (
        <div className="mb-4 flex items-center justify-between gap-3 px-3 py-2 bg-muted/40 border border-input/60 rounded text-[11px] font-mono text-muted-foreground">
          <span>Calls, texts, emails, and notes live on the contact record.</span>
          <Link
            href={`/dashboard/contacts/${contactId}`}
            className="shrink-0 text-[#c9a84c] hover:underline"
          >
            View on contact →
          </Link>
        </div>
      )}

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground font-mono">
          <Activity size={24} />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
      <>
      <div className="flex gap-1 mb-4 flex-wrap">
        {([['system', 'System'], ['all', 'All']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
                : 'bg-muted text-muted-foreground hover:bg-input border border-input'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground font-mono">
          <p className="text-sm">{filter === 'all' ? 'No activity yet' : 'No system activity yet'}</p>
        </div>
      ) : (
        <div className="space-y-0 border border-input rounded-lg overflow-hidden">
          {visible.map((item) => {
            const typeIcon = item.type === 'call' ? '📞' : item.type === 'email' ? '📧' : item.type === 'text' ? '💬' : item.type === 'note' ? '📝' : null
            const typeLabel = item.type === 'call' ? 'Call' : item.type === 'email' ? 'Email' : item.type === 'text' ? 'Text' : item.type === 'note' ? 'Note' : null
            const isManual = !item.action.includes('.')
            const isExpanded = expandedIds.has(item.id)
            const isDeleting = deletingIds.has(item.id)
            const { label, detail } = formatActivityAction(item)
            const summaryText = item.summary && item.summary !== item.action ? item.summary : null
            const previewText = summaryText
              ? summaryText.replace(/\n+/g, ' ').slice(0, 80) + (summaryText.length > 80 ? '…' : '')
              : detail
                ? detail.slice(0, 80) + (detail.length > 80 ? '…' : '')
                : null
            const dateStr = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              + ' at '
              + new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

            return (
              <div key={item.id} className="border-b border-input last:border-b-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="shrink-0">
                    {typeIcon ? (
                      <span className="text-sm">{typeIcon}</span>
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isManual ? 'bg-zinc-400' : 'bg-[#4ADE80]'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {typeLabel && <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground shrink-0">{typeLabel}</span>}
                        <p className="text-sm font-mono text-foreground truncate">{label}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-muted-foreground">{dateStr}</span>
                        <ChevronDown size={11} className="text-muted-foreground transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                      </div>
                    </div>
                    {!isExpanded && previewText && (
                      <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{previewText}</p>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 pl-11">
                    {summaryText && (
                      <p className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap mb-2">{summaryText}</p>
                    )}
                    {detail && !summaryText && (
                      <p className="text-xs font-mono text-muted-foreground mb-2">{detail}</p>
                    )}
                    {isManual && (
                      <button
                        onClick={() => handleDeleteActivity(item.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-red-500 border border-red-500/30 rounded px-2 py-0.5 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 size={10} /> {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </>
      )}
    </div>
  )
}

// ── Email history tab ─────────────────────────────────────────────────────────

const DRAFT_COLORS: Record<string, string> = {
  pre_approval:      'bg-amber-900/40 text-amber-400 border-amber-800',
  contract_received: 'bg-blue-900/40 text-blue-400 border-blue-800',
  final_cd:          'bg-amber-900/40 text-amber-400 border-amber-800',
  review_request:    'bg-purple-900/40 text-purple-400 border-purple-800',
  referral_intro:    'bg-orange-900/40 text-orange-400 border-orange-800',
  milestone:         'bg-muted/60 text-foreground/80 border-input',
}

const DRAFT_LABELS: Record<string, string> = {
  pre_approval: 'Pre-Approval', contract_received: 'Contract', final_cd: 'Final CD',
  review_request: 'Review Request', referral_intro: 'Referral Intro', milestone: 'Milestone',
}

const STATUS_CLASSES: Record<string, string> = {
  pending:   'bg-amber-900/40 text-amber-400 border-amber-800',
  sent:      'bg-green-900/40 text-[#4ADE80] border-green-800',
  discarded: 'bg-muted text-muted-foreground border-input',
}

function EmailHistoryTab({ drafts, contactEmails, inboundEmails, onRefresh }: { drafts: EmailDraftRow[]; contactEmails: ContactEmailRow[]; inboundEmails: InboundEmailRow[]; onRefresh: () => void }) {
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

  if (drafts.length === 0 && contactEmails.length === 0 && inboundEmails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground font-mono">
        <Inbox size={24} />
        <p className="text-sm">No emails logged yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {drafts.length > 0 && (
      <div className="space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Draft Queue</p>
      {drafts.map(draft => {
        const colorClass = DRAFT_COLORS[draft.automation_name] || 'bg-input text-foreground/80 border-input'
        const label = DRAFT_LABELS[draft.automation_name] || draft.automation_name
        const isOpen = expanded === draft.id
        return (
          <div key={draft.id} className="border border-input rounded-lg bg-card hover:border-input transition-colors">
            <button onClick={() => setExpanded(isOpen ? null : draft.id)} className="w-full text-left p-4 focus:outline-none">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLASSES[draft.status] ?? STATUS_CLASSES.pending}`}>{draft.status}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(draft.created_at)}</span>
                </div>
                {isOpen ? <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="text-sm font-mono font-medium text-foreground mb-1 truncate">{draft.subject}</div>
              <div className="text-xs font-mono text-muted-foreground truncate">To: {draft.recipient_name ? `${draft.recipient_name} <${draft.recipient_email}>` : draft.recipient_email}</div>
              {!isOpen && draft.body_preview && <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{draft.body_preview}</div>}
            </button>
            {isOpen && (
              <div className="border-t border-input">
                <div className="bg-muted rounded-b-lg">
                  <iframe
                    ref={el => { iframeRefs.current[draft.id] = el }}
                    className="w-full border-0 rounded-b-lg"
                    style={{ minHeight: '180px', maxHeight: '400px' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
                {draft.status === 'pending' && (
                  <div className="flex gap-2 p-3 border-t border-input">
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(draft.id, 'sent') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800 rounded-md transition-colors"
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
      )}

      {/* Inbound emails from n8n / Outlook sync */}
      {inboundEmails.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Inbound</p>
          {inboundEmails.map(email => {
            const fromName = (email.metadata?.from_name as string) || null
            const isOpen = expanded === email.id
            return (
              <div key={email.id} className="border border-input rounded-lg bg-card hover:border-input transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : email.id)} className="w-full text-left p-4 focus:outline-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-900/30 text-amber-400 border-amber-800">INBOUND</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(email.occurred_at || email.created_at)}</span>
                    </div>
                    {isOpen ? <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="text-sm font-mono font-medium text-foreground truncate mb-1">{email.subject || '(no subject)'}</div>
                  <div className="text-xs font-mono text-muted-foreground truncate">From: {fromName ? `${fromName} <${email.from_address}>` : (email.from_address || '—')}</div>
                  {!isOpen && email.body_snippet && (
                    <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{email.body_snippet}</div>
                  )}
                </button>
                {isOpen && email.body_snippet && (
                  <div className="border-t border-input p-4 text-xs text-foreground/80 font-mono whitespace-pre-wrap bg-muted/50 rounded-b-lg max-h-64 overflow-y-auto">
                    {email.body_snippet}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Permanent audit log from contact_emails */}
      {contactEmails.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Email Log</p>
          {contactEmails.map(ce => {
            const src = ce.automation_source ?? 'unknown'
            const colorClass = DRAFT_COLORS[src] || 'bg-input text-foreground/80 border-input'
            const label = DRAFT_LABELS[src] || src.replace(/_/g, ' ')
            const isOpen = expanded === ce.id
            return (
              <div key={ce.id} className="border border-input rounded-lg bg-card hover:border-input transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : ce.id)} className="w-full text-left p-4 focus:outline-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(ce.sent_at)}</span>
                    </div>
                    {isOpen ? <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="text-sm font-mono font-medium text-foreground truncate">{ce.subject}</div>
                </button>
                {isOpen && (ce.body_html || ce.body_text) && (
                  <div className="border-t border-input p-4 text-xs text-foreground/80 font-mono whitespace-pre-wrap bg-muted/50 rounded-b-lg max-h-64 overflow-y-auto">
                    {ce.body_html
                      ? <div dangerouslySetInnerHTML={{ __html: ce.body_html }} />
                      : ce.body_text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_HEX_DETAIL: Record<string, string> = {
  'LOAN_SETUP': '#64748B', 'Loan Setup': '#64748B',
  'DISCLOSURE_SENT': '#7C3AED', 'Disclosed': '#7C3AED',
  'UNDERWRITING_SUBMITTED': '#2563EB', 'Submitted to UW': '#2563EB', 'Submitted': '#2563EB',
  'Loan in Process': '#D97706', 'In Process': '#D97706', 'processing': '#D97706', 'Processing': '#D97706',
  'RE_SUBMITTAL': '#DC2626', 'Resubmitted': '#DC2626', 'Resubmit': '#DC2626',
  'CLEAR_TO_CLOSE': '#16A34A', 'clear_to_close': '#16A34A', 'Clear to Close': '#16A34A', 'CTC': '#16A34A',
  'APPROVED': '#0891B2', 'Approved': '#0891B2', 'APPROVED_WITH_CONDITIONS': '#0891B2',
  'Approved with Conditions': '#0891B2', 'Approved w/ Conditions': '#0891B2', 'Conditional Approval': '#0891B2',
  'underwriting': '#0E7490', 'Underwriting': '#0E7490',
  'Closed': '#C9A84C', 'closed': '#C9A84C', 'funded': '#C9A84C', 'Funded': '#C9A84C',
  'Started': '#A855F7', 'Pre-Approved': '#818CF8', 'pre_approved': '#818CF8',
  'Application': '#6366F1', 'application_intake': '#6366F1', 'New Application': '#60A5FA',
  'under_contract': '#34D399', 'Lead': '#6B7280', 'lead': '#6B7280',
  'On Hold': '#F59E0B', 'Suspended': '#F59E0B',
  'Cancelled': '#71717A', 'Dead': '#52525B', 'Denied': '#EF4444', 'Withdrawn': 'var(--muted)',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs font-mono">—</span>
  const hex = STATUS_HEX_DETAIL[status] ?? STATUS_HEX_DETAIL[status.toLowerCase()] ?? '#52525B'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium whitespace-nowrap"
      style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}44` }}
    >
      {status}
    </span>
  )
}

// Clickable status badge that opens an inline dropdown to change loan status
function InlineStatusSelect({ status, loanId, onUpdate }: {
  status: string | null
  loanId: string
  onUpdate: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { organizationId } = useOrg()

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (!newStatus || newStatus === status || !organizationId) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    await supabase.from('loans').update({ status: newStatus }).eq('id', loanId).eq('organization_id', organizationId)
    onUpdate(newStatus)
    setSaving(false)
  }

  if (open) {
    return (
      <select
        autoFocus
        defaultValue={status ?? ''}
        onChange={handleChange}
        onBlur={() => setOpen(false)}
        className="text-xs font-mono bg-muted border border-[#C9A84C]/60 rounded px-2 py-1 text-foreground focus:outline-none focus:border-[#C9A84C]"
      >
        <option value="">— Select Status —</option>
        {LOAN_STATUS_OPTS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      title="Click to change status"
      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
    >
      <StatusBadge status={saving ? '...' : status} />
      <ChevronDown size={10} className="text-muted-foreground" />
    </button>
  )
}

// Format an activity_log row into a human-readable label + optional detail line
function formatActivityAction(item: ActivityRow): { label: string; detail: string | null } {
  const meta = (item.metadata ?? {}) as Record<string, string>
  const action = item.action ?? ''

  if (action === 'email.received' || action === 'email_received') {
    const subject = meta.subject ?? meta.email_subject ?? null
    const from = meta.from_address ?? meta.from ?? meta.sender ?? null
    return {
      label: 'Email Received',
      detail: subject ?? from ?? null,
    }
  }
  if (action === 'status_updated' || action === 'status.updated') {
    const from = meta.old_status ?? meta.from ?? null
    const to = meta.new_status ?? meta.to ?? meta.status ?? null
    if (from && to) return { label: 'Status Updated', detail: `${from} → ${to}` }
    if (to) return { label: 'Status Updated', detail: `→ ${to}` }
    return { label: 'Status Updated', detail: null }
  }
  if (action === 'contact_created') return { label: 'Contact Created', detail: null }
  if (action === 'loan_created')    return { label: 'Loan Created', detail: null }
  if (action === 'note_added')      return { label: 'Note Added', detail: null }
  if (action === 'doc_uploaded')    return { label: 'Document Uploaded', detail: meta.file_name ?? null }

  // Generic humanize: "email.received" → "Email Received", "arive.status_update" → "Arive: Status Update"
  const humanized = action
    .replace(/^arive\./, 'Arive: ')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
  return { label: humanized, detail: null }
}
