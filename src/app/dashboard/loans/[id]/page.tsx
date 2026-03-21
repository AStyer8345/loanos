'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, FileText, Zap, Activity, Download, Upload,
  ChevronRight, AlertCircle, Check, Clock, Inbox, X, ChevronDown,
  GripVertical, EyeOff, Eye, Settings2,
  Mail, Phone, MapPin, Calendar, Users,
} from 'lucide-react'
import LoanOSChat from '@/components/crm/LoanOSChat'
import { normalizeToStageKey } from '@/lib/constants/loan-stages'
import type { StageKey } from '@/lib/constants/loan-stages'

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE ?? 'https://styer.app.n8n.cloud/webhook'

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
  // Commission
  commission_amount: number | null
  // Origination
  aus_result: string | null
  originator_comp: number | null
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
  type: string | null
  summary: string | null
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
    description: 'Upload an executed purchase contract — Claude extracts all key fields, drafts reply-all to transaction parties.',
    triggerLabel: 'Upload Contract PDF',
    triggerType: 'pdf' as const,
    webhookPath: 'loanos-contract-received',
    icon: '📝',
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
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === '1') return `${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`
  return val
}

function PhoneLink({ phone }: { phone: string | null | undefined }) {
  const fmt = fmtPhone(phone)
  if (!fmt) return <span className="text-zinc-600">—</span>
  const digits = (phone ?? '').replace(/\D/g, '')
  return <a href={`tel:${digits}`} className="hover:underline">{fmt}</a>
}

function EmailLink({ email }: { email: string | null | undefined }) {
  if (!email) return <span className="text-zinc-600">—</span>
  return <a href={`mailto:${email}`} className="hover:underline">{email}</a>
}

// ── Pipeline helpers (canonical stage ordering) ──────────────────────────────

const PIPELINE_STAGES = ['Application', 'Processing', 'Underwriting', 'CTC', 'Funding']

// Ordered stage keys from earliest to latest in the pipeline
const STAGE_ORDER: StageKey[] = [
  'lead', 'new_application', 'pre_approval',
  'setup', 'disclosed', 'processing',
  'submitted', 'underwriting', 'approved', 'resubmit',
  'clear_to_close',
  'funded',
]

function getStageIndex(status: string | null): number {
  const key = normalizeToStageKey(status)
  if (key === 'funded') return 4
  if (key === 'clear_to_close') return 3
  if (['submitted', 'underwriting', 'approved', 'resubmit'].includes(key)) return 2
  if (['setup', 'disclosed', 'processing', 'pre_approval'].includes(key)) return 1
  return 0
}

// Milestone completion: a milestone is complete when the loan has reached or passed the target stage
function hasReachedStage(status: string | null, target: StageKey): boolean {
  const key = normalizeToStageKey(status)
  return STAGE_ORDER.indexOf(key) >= STAGE_ORDER.indexOf(target)
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LoanDetailPage() {
  const supabase = createClient()
  const params = useParams()
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automations' | 'activity' | 'emails'>('dashboard')
  const [actionsOpen, setActionsOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null)
  // commission editing moved to CollapsibleDetails > Financials section
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [headerInput, setHeaderInput] = useState('')
  const [referringAgentContactId, setReferringAgentContactId] = useState<string | null>(null)
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
    setLoading(true)
    setReferringAgentContactId(null)
    const [loanRes, docsRes, actRes, draftsRes, contactEmailsRes] = await Promise.all([
      supabase.from('loans').select('*').eq('id', loanId).single(),
      supabase.from('documents').select('id, file_name, file_path, file_size, doc_type, created_at, uploaded_by').eq('loan_id', loanId).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('id, created_at, action, type, summary, entity_type, metadata').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(50),
      supabase.from('email_drafts').select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at').eq('loan_id', loanId).order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_emails').select('id, subject, body_html, body_text, automation_source, sent_at, created_at').eq('loan_id', loanId).order('sent_at', { ascending: false }).limit(100),
    ])

    if (loanRes.data) {
      setLoan(loanRes.data)
      const contactId = loanRes.data.contact_id
      if (contactId) {
        const [{ data: c }, { data: inbound }] = await Promise.all([
          supabase.from('contacts').select('id, first_name, last_name, email, phone, referred_by').eq('id', contactId).single(),
          supabase.from('activity_log')
            .select('id, subject, from_address, body_snippet, occurred_at, created_at, metadata, contact_id, loan_id')
            .eq('type', 'email_inbound')
            .or(`loan_id.eq.${loanId},contact_id.eq.${contactId}`)
            .order('occurred_at', { ascending: false })
            .limit(100),
        ])
        setContact(c)
        setInboundEmails((inbound || []) as InboundEmailRow[])
      } else {
        const { data: inbound } = await supabase.from('activity_log')
          .select('id, subject, from_address, body_snippet, occurred_at, created_at, metadata, contact_id, loan_id')
          .eq('type', 'email_inbound')
          .eq('loan_id', loanId)
          .order('occurred_at', { ascending: false })
          .limit(100)
        setInboundEmails((inbound || []) as InboundEmailRow[])
      }

      // Resolve referring realtor → contact id (email match, then name match within org)
      const ld = loanRes.data as Loan
      let realtorId: string | null = null
      if (organizationId) {
        if (ld.referring_agent_email?.trim()) {
          const em = ld.referring_agent_email.trim()
          const { data: byEmail } = await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', organizationId)
            .ilike('email', em)
            .limit(1)
            .maybeSingle()
          if (byEmail?.id) realtorId = byEmail.id
        }
        if (!realtorId && ld.referring_agent_name?.trim()) {
          const name = ld.referring_agent_name.trim()
          const parts = name.split(/\s+/).filter(Boolean)
          const firstName = parts[0] ?? ''
          const lastName = parts.slice(1).join(' ') || ''
          let q = supabase
            .from('contacts')
            .select('id, first_name, last_name')
            .eq('organization_id', organizationId)
          if (firstName) q = q.ilike('first_name', firstName)
          if (lastName) q = q.ilike('last_name', lastName)
          const { data: list } = await q.limit(50)
          const match = (list ?? []).find(
            c =>
              `${(c.first_name ?? '').trim()} ${(c.last_name ?? '').trim()}`.trim().toLowerCase() === name.toLowerCase()
          )
          if (match?.id) realtorId = match.id
        }
      }
      setReferringAgentContactId(realtorId)
    }
    setDocs(docsRes.data || [])
    setActivity(actRes.data || [])
    setEmailDrafts((draftsRes.data || []) as EmailDraftRow[])
    setContactEmails((contactEmailsRes.data || []) as ContactEmailRow[])
    setLoading(false)
  }, [loanId, supabase, organizationId])

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
  const productLabel = [loan.loan_program || loan.loan_type, loan.loan_term ? `${Math.round(loan.loan_term / 12)}yr` : null].filter(Boolean).join(' ')

  // Header inline edit save helper
  const saveHeaderField = async (field: string, value: string | number | null) => {
    await supabase.from('loans').update({ [field]: value }).eq('id', loanId)
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
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="border-b border-zinc-800 shrink-0" style={{ background: 'linear-gradient(160deg, #0a0a0c 0%, #0d111e 100%)' }}>
        <div className="px-6 pt-4 pb-0">
          {/* Breadcrumb */}
          <Link href="/dashboard/loans" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 font-mono mb-3 transition-colors">
            <ArrowLeft size={12} /> Loans
          </Link>

          {/* Name row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-bold text-zinc-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '30px', lineHeight: '1.15', letterSpacing: '-0.01em' }}>
                {loan.loan_name || displayName}
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {loan.contact_id ? (
                  <Link href={`/dashboard/contacts/${loan.contact_id}`} className="hover:text-[#C9A84C] transition-colors">
                    {displayName}
                  </Link>
                ) : displayName}
                {loan.loan_number ? ` · #${loan.loan_number}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={loan.status} />
              {/* Actions dropdown */}
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={() => setActionsOpen(prev => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#C9A84C] hover:bg-[#B89340] text-zinc-900 rounded transition-colors font-mono font-semibold"
                >
                  Actions <ChevronDown size={11} className={actionsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden max-h-[70vh] overflow-y-auto">
                    <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Automations</p>
                    {[
                      { label: 'Send PA Email', automationId: 'pre-approval' },
                      { label: 'Send CD Email', automationId: 'final-cd' },
                      { label: 'Refi Intake Email', automationId: 'refi-intake' },
                      { label: 'Send Refi Analysis', automationId: 'refi-analysis' },
                      { label: 'Referral Intro Email', automationId: 'referral-intro' },
                      { label: 'Website Lead Follow-up', automationId: 'website-lead' },
                      { label: 'New Application Received', automationId: 'new-application' },
                      { label: 'Contract Received', automationId: 'contract-received' },
                    ].map(({ label, automationId }) => (
                      <button
                        key={label}
                        onClick={() => { setActiveTab('automations'); setSelectedAutomationId(automationId); setActionsOpen(false) }}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
                      >
                        <Zap size={12} className="text-[#C9A84C] shrink-0" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-zinc-800 mt-1 pt-1">
                      <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Tools</p>
                      <Link
                        href={`/dashboard/scenarios/new?loan_id=${loanId}`}
                        onClick={() => setActionsOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
                      >
                        <span className="text-[#C9A84C] shrink-0">📐</span>
                        Create Scenario
                      </Link>
                    </div>
                    <div className="border-t border-zinc-800 mt-1 pt-1">
                      <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">View</p>
                      {[
                        { label: 'Activity Log', tab: 'activity' as const },
                        { label: 'Email History', tab: 'emails' as const },
                        { label: 'Documents', tab: 'dashboard' as const },
                      ].map(({ label, tab }) => (
                        <button
                          key={label}
                          onClick={() => { setActiveTab(tab); setActionsOpen(false) }}
                          className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
                        >
                          <ChevronRight size={12} className="text-zinc-500 shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta chips — single row, tight spacing */}
          <div className="flex flex-nowrap gap-2 mt-3 pb-4 overflow-x-auto">

            {/* Loan Amount — gold highlight */}
            {loan.loan_amount && (
              <div className="shrink-0 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Loan Amount</p>
                <p className="text-[16px] font-mono font-semibold text-[#C9A84C]">{fmtCurrency(loan.loan_amount)}</p>
              </div>
            )}

            {productLabel && (
              <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Product</p>
                <p className="text-[16px] font-mono font-semibold text-zinc-100">{productLabel}</p>
              </div>
            )}

            {/* Rate — gold highlight */}
            {loan.interest_rate && (
              <div className="shrink-0 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Rate</p>
                <p className="text-[16px] font-mono font-semibold text-[#C9A84C]">{fmtPct(loan.interest_rate)}</p>
              </div>
            )}

            {loan.ltv && (
              <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">LTV</p>
                <p className="text-[16px] font-mono font-semibold text-zinc-100">{fmtPct(loan.ltv)}</p>
              </div>
            )}

            {(loan.front_end_dti || loan.back_end_dti) && (
              <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">DTI</p>
                <p className="text-[16px] font-mono font-semibold text-zinc-100">
                  {fmtPct(loan.front_end_dti)} / {fmtPct(loan.back_end_dti)}
                </p>
              </div>
            )}

            {loan.referring_agent_name && (
              <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Realtor</p>
                <Link
                  href={
                    referringAgentContactId
                      ? `/dashboard/contacts/${referringAgentContactId}`
                      : `/dashboard/contacts/by-name/${encodeURIComponent(loan.referring_agent_name.trim())}`
                  }
                  className="text-[16px] font-mono font-semibold text-zinc-100 hover:text-[#C9A84C] transition-colors underline-offset-2 hover:underline block truncate max-w-[11rem]"
                >
                  {loan.referring_agent_name}
                </Link>
              </div>
            )}

            {/* Est. Close Date — editable */}
            <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Est. Close</p>
              {editingHeader === 'estimated_closing_date' ? (
                <input
                  autoFocus
                  type="date"
                  value={headerInput}
                  onChange={e => setHeaderInput(e.target.value)}
                  onBlur={() => saveHeaderField('estimated_closing_date', headerInput || null)}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingHeader(null) }}
                  className="w-36 text-[16px] font-mono font-semibold text-zinc-100 bg-transparent border-b border-zinc-500 outline-none"
                />
              ) : (
                <p
                  className="text-[16px] font-mono font-semibold text-zinc-100 cursor-pointer hover:text-[#C9A84C] transition-colors"
                  onClick={() => { setHeaderInput(loan.estimated_closing_date ?? ''); setEditingHeader('estimated_closing_date') }}
                >
                  {fmtDate(loan.estimated_closing_date)}
                </p>
              )}
            </div>

            {/* Rate Lock Date — editable */}
            <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Rate Lock Date</p>
              {editingHeader === 'rate_lock_date' ? (
                <input
                  autoFocus
                  type="date"
                  value={headerInput}
                  onChange={e => setHeaderInput(e.target.value)}
                  onBlur={() => saveHeaderField('rate_lock_date', headerInput || null)}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingHeader(null) }}
                  className="w-36 text-[16px] font-mono font-semibold text-zinc-100 bg-transparent border-b border-zinc-500 outline-none"
                />
              ) : (
                <p
                  className="text-[16px] font-mono font-semibold text-zinc-100 cursor-pointer hover:text-[#C9A84C] transition-colors"
                  onClick={() => { setHeaderInput(loan.rate_lock_date ?? ''); setEditingHeader('rate_lock_date') }}
                >
                  {fmtDate(loan.rate_lock_date)}
                </p>
              )}
            </div>

            {/* Lock Expiry — editable */}
            <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Lock Expiry</p>
              <div className="flex items-center gap-2">
                {editingHeader === 'rate_lock_expiration' ? (
                  <input
                    autoFocus
                    type="date"
                    value={headerInput}
                    onChange={e => setHeaderInput(e.target.value)}
                    onBlur={() => saveHeaderField('rate_lock_expiration', headerInput || null)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingHeader(null) }}
                    className="w-36 text-[16px] font-mono font-semibold text-zinc-100 bg-transparent border-b border-zinc-500 outline-none"
                  />
                ) : (
                  <p
                    className="text-[16px] font-mono font-semibold text-zinc-100 cursor-pointer hover:text-[#C9A84C] transition-colors"
                    onClick={() => { setHeaderInput(loan.rate_lock_expiration ?? ''); setEditingHeader('rate_lock_expiration') }}
                  >
                    {fmtDate(loan.rate_lock_expiration)}
                  </p>
                )}
                {lockExpiryWarning && (
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    lockExpiryWarning.type === 'expired'
                      ? 'bg-red-900/40 text-red-400 border border-red-800'
                      : 'bg-amber-900/40 text-amber-400 border border-amber-800'
                  }`}>
                    {lockExpiryWarning.text}
                  </span>
                )}
              </div>
            </div>

            {/* Days Locked */}
            {(() => {
              if (!loan.rate_lock_expiration) return (
                <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Days Locked</p>
                  <p className="text-[16px] font-mono font-semibold text-zinc-500">—</p>
                </div>
              )
              const lockStart = loan.rate_lock_date ? new Date(loan.rate_lock_date + 'T00:00:00') : null
              const today = new Date(); today.setHours(0,0,0,0)
              const daysLocked = lockStart ? Math.max(0, Math.floor((today.getTime() - lockStart.getTime()) / 86400000)) : null
              const exp = new Date(loan.rate_lock_expiration + 'T00:00:00')
              const daysUntilExpiry = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
              const expired = daysUntilExpiry < 0
              const display = daysLocked != null ? `${daysLocked} days` : expired ? `${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days`
              return (
                <div className="shrink-0 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Days Locked</p>
                  <p className={`text-[16px] font-mono font-semibold ${expired ? 'text-red-400' : 'text-zinc-100'}`}>
                    {display}
                  </p>
                </div>
              )
            })()}

          </div>

          {/* Pipeline progress bar */}
          <PipelineProgressBar status={loan.status} />
        </div>

        {/* Tab bar */}
        <div className="px-6 flex gap-0">
          {([
            { id: 'dashboard',   label: 'Dashboard' },
            { id: 'automations', label: 'Automations' },
            { id: 'activity',    label: `Activity (${activity.length})` },
            { id: 'emails',      label: `Emails (${emailDrafts.length + inboundEmails.length})` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-mono font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab loan={loan} setLoan={l => setLoan(l)} loanId={loanId} docs={docs} activity={activity} contact={contact} onRefresh={fetchAll} />
        )}
        {activeTab === 'automations' && (
          <div className="p-6"><AutomationsTab loan={loan} onActivityCreated={fetchAll} highlightId={selectedAutomationId} onClearHighlight={() => setSelectedAutomationId(null)} /></div>
        )}
        {activeTab === 'activity' && (
          <div className="p-6"><ActivityTab activity={activity} setActivity={setActivity} loanId={loanId} onRefresh={fetchAll} /></div>
        )}
        {activeTab === 'emails' && (
          <div className="p-6"><EmailHistoryTab drafts={emailDrafts} contactEmails={contactEmails} inboundEmails={inboundEmails} onRefresh={fetchAll} /></div>
        )}
      </div>

      <LoanOSChat recordId={loanId} recordType="loan" recordName={displayName} />
    </div>
  )
}

// ── Pipeline stepped milestone pills ───────────────────────────────────────────

function PipelineProgressBar({ status }: { status: string | null }) {
  const currentIdx = getStageIndex(status)

  return (
    <div className="flex items-center gap-0 py-2">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const isLast = i === PIPELINE_STAGES.length - 1
        return (
          <div key={stage} className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-medium rounded-sm transition-all duration-200 ${
                active
                  ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/50'
                  : done
                  ? 'bg-[#C9A84C]/10 text-zinc-400 border border-[#C9A84C]/20'
                  : 'bg-zinc-800/40 text-zinc-600 border border-zinc-700/50'
              }`}
            >
              {stage}
            </span>
            {!isLast && (
              <ChevronRight
                size={10}
                className={`mx-0.5 shrink-0 ${done ? 'text-[#C9A84C]/40' : 'text-zinc-700'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function DashboardTab({ loan, setLoan, loanId, docs, contact, onRefresh }: {
  loan: Loan
  setLoan: (l: Loan) => void
  loanId: string
  docs: DocRow[]
  activity: ActivityRow[]
  contact: ContactRow | null
  onRefresh: () => void
}) {
  const supabase = createClient()

  const handleSaveField = useCallback(async (field: string, value: string | number | null) => {
    const { error } = await supabase.from('loans').update({ [field]: value }).eq('id', loanId)
    if (!error) setLoan({ ...loan, [field]: value } as Loan)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, loan])

  const handleSaveMultiple = useCallback(async (fields: Record<string, string | null>) => {
    const { error } = await supabase.from('loans').update(fields).eq('id', loanId)
    if (!error) setLoan({ ...loan, ...fields } as Loan)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, loan])

  return (
    <div className="p-6 space-y-8">

      {/* ── 3-column command grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-8">

        {/* ── Col 1 — Dark Identity Sidebar ── */}
        <div className="bg-zinc-900 rounded-xl overflow-hidden flex flex-col">
          <BorrowerProfileCard loan={loan} contact={contact} />
          <LoanEssentialsPanel loan={loan} />
          <PropertySummaryCard loan={loan} />
        </div>

        {/* ── Col 2 — Execution (primary focus) ── */}
        <div className="space-y-6">
          <MilestoneTimeline loan={loan} />
          <LoanTodoList loanId={loanId} />
        </div>

        {/* ── Col 3 — The Pulse ── */}
        <div className="space-y-4">
          <LoanVitalCards loan={loan} />
          <KeyDatesPanel loan={loan} />
          <PartnerContactsPanel loan={loan} />
          <NotesSidebarPanel loanId={loanId} loan={loan} setLoan={setLoan} />
          <DocumentsSidebarPanel loanId={loanId} docs={docs} onRefresh={onRefresh} />
        </div>

      </div>

      {/* ── Full info grid (draggable cards) ── */}
      <LoanInfoGrid loan={loan} loanId={loanId} onSave={handleSaveField} onSaveMultiple={handleSaveMultiple} />

      {/* ── Full editable details (collapsible) ── */}
      <CollapsibleDetails loan={loan} onSave={handleSaveField} onSaveMultiple={handleSaveMultiple} contact={contact} />

    </div>
  )
}

// ── BorrowerProfileCard ───────────────────────────────────────────────────────

function IconContactRow({ icon, value, href }: { icon: React.ReactNode; value: string | null | undefined; href?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-zinc-500 shrink-0">{icon}</span>
      {href ? (
        <a href={href} className="text-xs font-mono text-zinc-300 hover:text-[#C9A84C] transition-colors truncate">{value}</a>
      ) : (
        <span className="text-xs font-mono text-zinc-300 truncate">{value}</span>
      )}
    </div>
  )
}

function BorrowerProfileCard({ loan, contact }: { loan: Loan; contact: ContactRow | null }) {
  const firstName = loan.borrower_first_name ?? ''
  const lastName = loan.borrower_last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || loan.borrower_name || '—'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="p-5 space-y-4">
      {/* Avatar + name + quick actions */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C]/50 flex items-center justify-center shrink-0">
          <span className="text-xl font-mono font-bold text-[#C9A84C]">{initials}</span>
        </div>
        <div className="min-w-0 w-full">
          <p className="text-base font-mono font-semibold text-white truncate">{fullName}</p>
          {loan.contact_id && contact && (
            <Link href={`/dashboard/contacts/${loan.contact_id}`} className="text-[10px] font-mono text-zinc-500 hover:text-[#C9A84C] transition-colors">
              View Contact →
            </Link>
          )}
        </div>
        {/* Quick-action icons */}
        <div className="flex items-center gap-3">
          {loan.borrower_phone && (
            <a
              href={`tel:${loan.borrower_phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-colors"
              title={fmtPhone(loan.borrower_phone) ?? 'Call'}
            >
              <Phone size={13} />
            </a>
          )}
          {loan.borrower_email && (
            <a
              href={`mailto:${loan.borrower_email}`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-colors"
              title={loan.borrower_email}
            >
              <Mail size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Co-borrower */}
      {loan.co_borrower_name && (
        <div className="pt-3 border-t border-zinc-800 space-y-1">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Co-Borrower</p>
          <p className="text-xs font-mono text-zinc-200">{loan.co_borrower_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {loan.co_borrower_phone && (
              <a href={`tel:${loan.co_borrower_phone.replace(/\D/g, '')}`} className="text-zinc-400 hover:text-[#C9A84C] transition-colors">
                <Phone size={11} />
              </a>
            )}
            {loan.co_borrower_email && (
              <a href={`mailto:${loan.co_borrower_email}`} className="text-zinc-400 hover:text-[#C9A84C] transition-colors">
                <Mail size={11} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── LoanEssentialsPanel — key numbers in the dark sidebar ────────────────────

function LoanEssentialsPanel({ loan }: { loan: Loan }) {
  const productLabel = [loan.loan_program || loan.loan_type, loan.loan_term ? `${Math.round(loan.loan_term / 12)}yr` : null].filter(Boolean).join(' ')
  const items = [
    { label: 'Loan Amount', value: fmtCurrency(loan.loan_amount), gold: true },
    { label: 'Rate',        value: loan.interest_rate ? fmtPct(loan.interest_rate) : '—', gold: true },
    { label: 'Program',     value: productLabel || '—', gold: false },
    { label: 'LTV',         value: loan.ltv ? fmtPct(loan.ltv) : '—', gold: false },
  ]

  return (
    <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
      {items.map(item => (
        <div key={item.label} className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">{item.label}</span>
          <span className={`text-sm font-mono font-semibold ${item.gold ? 'text-[#C9A84C]' : 'text-white'}`}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── PropertySummaryCard ───────────────────────────────────────────────────────

function PropertySummaryCard({ loan }: { loan: Loan }) {
  const fullAddress = [loan.property_address, loan.property_city, loan.property_state, loan.property_zip].filter(Boolean).join(', ')
  const downPayment = loan.down_payment
    ? `${fmtCurrency(loan.down_payment)}${loan.down_payment_pct ? ` (${fmtPct(loan.down_payment_pct)})` : ''}`
    : '—'

  const fields = [
    { label: 'Address', value: fullAddress || '—' },
    { label: 'Type', value: loan.property_type || '—' },
    { label: 'Occupancy', value: loan.occupancy_type || loan.occupancy || '—' },
    { label: 'Purchase Price', value: fmtCurrency(loan.purchase_price) },
    { label: 'Appraised', value: fmtCurrency(loan.appraised_value) },
    { label: 'Down Payment', value: downPayment },
    { label: 'LTV', value: fmtPct(loan.ltv) },
  ]

  return (
    <div className="border-t border-zinc-800">
      <div className="px-5 py-3 flex items-center gap-2 border-b border-zinc-800/60">
        <MapPin size={11} className="text-[#C9A84C]" />
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">Property</h3>
      </div>
      <div className="divide-y divide-zinc-800/40">
        {fields.map(f => (
          <div key={f.label} className="flex items-baseline justify-between gap-3 px-5 py-2 min-w-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide shrink-0">{f.label}</span>
            <span className="text-xs font-mono text-zinc-200 text-right truncate">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── LoanVitalCards — stat cards per THEME.md ─────────────────────────────────

function LoanVitalCards({ loan }: { loan: Loan }) {
  const daysToClose = (() => {
    const target = loan.estimated_closing_date || loan.closing_date
    if (!target) return null
    return Math.ceil((new Date(target + 'T00:00:00').getTime() - Date.now()) / 86400000)
  })()

  return (
    <div className="space-y-3">
      {/* Days to Close */}
      <div className="border-l-4 border-l-[#C9A84C] rounded-r-lg bg-zinc-900/80 px-4 py-4">
        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Days to Close</p>
        <p className={`text-3xl font-mono font-bold ${
          daysToClose == null ? 'text-zinc-600'
          : daysToClose < 0 ? 'text-red-400'
          : daysToClose <= 7 ? 'text-amber-300'
          : 'text-amber-400'
        }`}>
          {daysToClose == null ? '—' : Math.abs(daysToClose)}
        </p>
        {daysToClose != null && (
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            {daysToClose < 0 ? 'days past est. close' : daysToClose === 0 ? 'closes today' : 'days remaining'}
          </p>
        )}
      </div>

      {/* Loan Stage */}
      <div className="border-l-4 border-l-[#C9A84C] rounded-r-lg bg-zinc-900/80 px-4 py-4">
        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Loan Stage</p>
        {loan.status ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30">
            {loan.status}
          </span>
        ) : (
          <span className="text-zinc-600 text-xs font-mono">—</span>
        )}
        {loan.milestone && (
          <p className="text-[10px] font-mono text-zinc-500 mt-2 truncate">{loan.milestone}</p>
        )}
      </div>
    </div>
  )
}

// ── KeyDatesPanel ─────────────────────────────────────────────────────────────

function KeyDatesPanel({ loan }: { loan: Loan }) {
  const dates = [
    { label: 'Application', value: fmtDate(loan.application_date) },
    { label: 'Submission', value: fmtDate(loan.submission_date) },
    { label: 'Approval', value: fmtDate(loan.approval_date) },
    { label: 'Est. Close', value: fmtDate(loan.estimated_closing_date) },
    { label: 'Rate Lock', value: fmtDate(loan.rate_lock_date) },
    { label: 'Lock Expiry', value: fmtDate(loan.rate_lock_expiration) },
    { label: 'Funded', value: fmtDate(loan.funding_date) },
  ]

  return (
    <div className="bg-zinc-900/60 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-zinc-800/60">
        <Calendar size={11} className="text-[#C9A84C]" />
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">Key Dates</h3>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {dates.map(d => (
          <div key={d.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar size={9} className="text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">{d.label}</span>
            </div>
            <span className="text-xs font-mono text-zinc-200">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PartnerContactsPanel ──────────────────────────────────────────────────────

function PartnerContactsPanel({ loan }: { loan: Loan }) {
  const partners = [
    { role: 'Realtor', name: loan.referring_agent_name, email: loan.referring_agent_email, phone: loan.referring_agent_phone, color: 'text-amber-400' },
    { role: "Buyer's Agent", name: loan.buyers_agent_name || loan.buyer_agent_name, email: loan.buyers_agent_email || loan.buyer_agent_email, phone: loan.buyers_agent_phone, color: 'text-emerald-400' },
    { role: 'Listing Agent', name: loan.listing_agent_name, email: loan.listing_agent_email, phone: loan.listing_agent_phone, color: 'text-sky-400' },
    { role: 'Title', name: loan.title_company || loan.title_contact, email: loan.title_email, phone: null as string | null, color: 'text-zinc-300' },
  ].filter(p => p.name || p.email)

  if (partners.length === 0) return null

  return (
    <div className="bg-zinc-900/60 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-zinc-800/60">
        <Users size={11} className="text-[#C9A84C]" />
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">Partners</h3>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {partners.map(p => (
          <div key={p.role} className="px-4 py-2.5 space-y-1">
            <p className={`text-[10px] font-mono uppercase tracking-wide ${p.color}`}>{p.role}</p>
            {p.name && <p className="text-xs font-mono text-zinc-200 truncate">{p.name}</p>}
            {p.email && (
              <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-[#C9A84C] transition-colors">
                <Mail size={9} className="shrink-0" /> <span className="truncate">{p.email}</span>
              </a>
            )}
            {p.phone && (
              <a href={`tel:${p.phone.replace(/\D/g, '')}`} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-[#C9A84C] transition-colors">
                <Phone size={9} className="shrink-0" /> {fmtPhone(p.phone)}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── LoanTodoList — localStorage-backed per-loan checklist ────────────────────

interface TodoItem {
  id: string
  text: string
  done: boolean
}

function getDefaultTodos(): TodoItem[] {
  const items = [
    'Collect paystubs (last 30 days)',
    'Collect bank statements (last 2 months)',
    'Order appraisal',
    'Submit to underwriting',
    'Clear UW conditions',
    'Request CTC',
    'Schedule closing date',
    'Confirm wire instructions',
  ]
  return items.map((text, i) => ({ id: String(i), text, done: false }))
}

function LoanTodoList({ loanId }: { loanId: string }) {
  const storageKey = `loanos_todos_${loanId}`
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as TodoItem[]
    } catch { /* ignore */ }
    return getDefaultTodos()
  })
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)

  function persist(items: TodoItem[]) {
    setTodos(items)
    try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch { /* ignore */ }
  }

  const doneCount = todos.filter(t => t.done).length

  return (
    <div className="bg-zinc-900/60 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Inbox size={11} className="text-[#C9A84C]" />
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">To-Do</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{doneCount}/{todos.length}</span>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {todos.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-6 py-3.5 group hover:bg-zinc-800/30 transition-colors">
            <button
              onClick={() => persist(todos.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
              className="shrink-0 text-zinc-500 hover:text-[#C9A84C] transition-colors"
            >
              {t.done
                ? <Check size={14} className="text-[#C9A84C]" />
                : <div className="w-3.5 h-3.5 rounded-sm border border-zinc-600" />
              }
            </button>
            <span className={`flex-1 text-xs font-mono ${t.done ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>{t.text}</span>
            <button
              onClick={() => persist(todos.filter(x => x.id !== t.id))}
              className="shrink-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 px-6 py-3.5 border-t border-zinc-800/60">
          <input
            autoFocus
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const text = newText.trim()
                if (text) persist([...todos, { id: Date.now().toString(), text, done: false }])
                setNewText(''); setAdding(false)
              }
              if (e.key === 'Escape') { setAdding(false); setNewText('') }
            }}
            placeholder="Add task…"
            className="flex-1 text-xs font-mono bg-transparent text-zinc-200 placeholder-zinc-600 border-b border-zinc-600 focus:border-[#C9A84C] outline-none pb-0.5"
          />
          <button
            onClick={() => {
              const text = newText.trim()
              if (text) persist([...todos, { id: Date.now().toString(), text, done: false }])
              setNewText(''); setAdding(false)
            }}
            className="text-[10px] font-mono text-[#C9A84C] hover:text-amber-300"
          >Add</button>
          <button onClick={() => { setAdding(false); setNewText('') }} className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full px-6 py-3 text-left text-[10px] font-mono text-zinc-600 hover:text-zinc-400 border-t border-zinc-800/60 transition-colors"
        >
          + Add task
        </button>
      )}
    </div>
  )
}

// ── Notes sidebar panel ───────────────────────────────────────────────────────

function NotesSidebarPanel({ loanId, loan, setLoan }: { loanId: string; loan: Loan; setLoan: (l: Loan) => void }) {
  const supabase = createClient()
  const [notes, setNotes] = useState(loan.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (value: string) => {
    setSaving(true)
    await supabase.from('loans').update({ notes: value }).eq('id', loanId)
    setLoan({ ...loan, notes: value })
    setSaving(false)
    setLastSaved(new Date())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId, loan])

  const handleChange = (value: string) => {
    setNotes(value)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(value), 500)
  }

  const handleBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    save(notes)
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Notes</h2>
        <span className="text-[10px] font-mono text-zinc-600">
          {saving ? 'Saving…' : lastSaved ? '✓ Saved' : ''}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes about this loan…"
        rows={10}
        className="w-full p-3 text-xs text-zinc-200 bg-zinc-800/50 placeholder-zinc-600 focus:outline-none resize-y font-mono border-0 focus:ring-1 focus:ring-[#C9A84C]/40"
      />
    </div>
  )
}

// ── Documents sidebar panel ───────────────────────────────────────────────────

function DocumentsSidebarPanel({ loanId, docs, onRefresh }: { loanId: string; docs: DocRow[]; onRefresh: () => void }) {
  const supabase = createClient()
  const { userId } = useOrg()
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
    const { error: insertError } = await supabase.from('documents').insert({ user_id: userId, loan_id: loanId, file_name: file.name, file_path: storagePath, file_size: file.size, doc_type: file.type || null })
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
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Documents</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 font-mono">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#C9A84C] hover:text-[#d4b860] disabled:opacity-50 transition-colors"
          >
            <Upload size={10} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
      {docs.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-xs text-zinc-500 font-mono">No documents uploaded</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border border-zinc-700 text-zinc-400 hover:border-[#C9A84C] hover:text-[#C9A84C] rounded transition-colors disabled:opacity-50"
          >
            <Upload size={10} /> Upload Document
          </button>
        </div>
      ) : (
        <div>
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              className={`flex items-center justify-between px-3 py-2 hover:bg-zinc-800/40 transition-colors ${i > 0 ? 'border-t border-zinc-700/50' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={11} className="text-zinc-500 shrink-0" />
                <span className="text-xs font-mono text-zinc-200 truncate">{doc.file_name}</span>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                disabled={signingId === doc.id}
                className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors ml-2 shrink-0"
                title="Download"
              >
                {signingId === doc.id ? <span className="text-[10px] font-mono">…</span> : <Download size={11} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LoanInfoGrid — 6-card 2-column grid ──────────────────────────────────────

function InfoCard({ title, fields }: {
  title: string
  fields: { label: string; value: React.ReactNode }[]
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-700/70">
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">{title}</h3>
      </div>
      <div className="p-4 space-y-2.5">
        {fields.map(f => (
          <div key={f.label} className="flex items-baseline justify-between gap-3 min-w-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide shrink-0">{f.label}</span>
            <span className="text-xs font-mono text-zinc-200 text-right truncate">
              {f.value ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PartiesCard({
  buyerName, buyerContactId, buyerPhone, buyerEmail,
  listingName, listingContactId, listingPhone, listingEmail,
  titleCompany, titleContact, titleEmail,
}: {
  buyerName: string | null
  buyerContactId: string | null
  buyerPhone: string | null
  buyerEmail: string | null
  listingName: string | null
  listingContactId: string | null
  listingPhone: string | null
  listingEmail: string | null
  titleCompany: string | null
  titleContact: string | null
  titleEmail: string | null
}) {
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 min-w-0">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-xs font-mono text-zinc-200 text-right truncate">{value}</span>
    </div>
  )
  const nameLink = (name: string | null, contactId: string | null) =>
    name
      ? contactId
        ? <Link href={`/dashboard/contacts/${contactId}`} className="hover:underline text-zinc-200">{name}</Link>
        : name
      : <span className="text-zinc-600">—</span>

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-700/70">
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C9A84C]">Parties</h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Buyer's Agent — emerald tint */}
        <div className="rounded p-2.5 space-y-1.5 bg-emerald-950/50 border border-emerald-900/40">
          {row("Buyer's Agent", nameLink(buyerName, buyerContactId))}
          {row('BA Phone', <PhoneLink phone={buyerPhone} />)}
          {row('BA Email', <EmailLink email={buyerEmail} />)}
        </div>
        {/* Listing Agent — sky tint */}
        <div className="rounded p-2.5 space-y-1.5 bg-sky-950/50 border border-sky-900/40">
          {row('Listing Agent', nameLink(listingName, listingContactId))}
          {row('LA Phone', <PhoneLink phone={listingPhone} />)}
          {row('LA Email', <EmailLink email={listingEmail} />)}
        </div>
        {/* Title — amber tint */}
        <div className="rounded p-2.5 space-y-1.5 bg-amber-950/50 border border-amber-900/40">
          {row('Title Company', titleCompany ?? <span className="text-zinc-600">—</span>)}
          {row('Title Contact', titleContact ?? <span className="text-zinc-600">—</span>)}
          {row('Title Email', <EmailLink email={titleEmail} />)}
        </div>
      </div>
    </div>
  )
}

// ── Card layout constants ──────────────────────────────────────────────────────

const DEFAULT_CARD_ORDER = ['borrower', 'loan-terms', 'property', 'key-dates', 'origination', 'parties']
const CARD_ORDER_KEY = 'loanos_card_order'
const CARD_HIDDEN_KEY = 'loanos_card_hidden'

// ── SortableCardWrapper ────────────────────────────────────────────────────────

function SortableCardWrapper({
  id, editLayout, isHidden, onToggleHide, children,
}: {
  id: string
  editLayout: boolean
  isHidden: boolean
  onToggleHide: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : isHidden ? 0.35 : 1,
        position: 'relative',
      }}
    >
      {editLayout && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 37, // matches card header height (py-2.5 + text)
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingLeft: 10, paddingRight: 10, zIndex: 10,
          }}
        >
          {/* Drag handle */}
          <button
            {...listeners} {...attributes}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', color: '#71717a', padding: 2, lineHeight: 0 }}
            className="hover:text-zinc-300 transition-colors"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
          {/* Hide / show toggle */}
          <button
            onClick={onToggleHide}
            style={{ color: isHidden ? '#C9A84C' : '#71717a', padding: 2, lineHeight: 0 }}
            className="hover:text-zinc-300 transition-colors"
            title={isHidden ? 'Show card' : 'Hide card'}
          >
            {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

// ── LoanInfoGrid ───────────────────────────────────────────────────────────────

function LoanInfoGrid({ loan, loanId, onSave, onSaveMultiple }: {
  loan: Loan
  loanId: string
  onSave: (field: string, value: string | number | null) => Promise<void>
  onSaveMultiple: (fields: Record<string, string | null>) => Promise<void>
}) {
  void loanId; void onSave; void onSaveMultiple

  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CARD_ORDER_KEY) ?? 'null') ?? DEFAULT_CARD_ORDER }
    catch { return DEFAULT_CARD_ORDER }
  })

  const [hiddenCards, setHiddenCards] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CARD_HIDDEN_KEY) ?? '[]') as string[]) }
    catch { return new Set() }
  })

  const [editLayout, setEditLayout] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = cardOrder.indexOf(active.id as string)
    const newIdx = cardOrder.indexOf(over.id as string)
    const next = arrayMove(cardOrder, oldIdx, newIdx)
    setCardOrder(next)
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(next))
  }

  function toggleHidden(id: string) {
    const next = new Set(hiddenCards)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setHiddenCards(next)
    localStorage.setItem(CARD_HIDDEN_KEY, JSON.stringify([...next]))
  }

  function resetLayout() {
    setCardOrder(DEFAULT_CARD_ORDER)
    setHiddenCards(new Set())
    localStorage.removeItem(CARD_ORDER_KEY)
    localStorage.removeItem(CARD_HIDDEN_KEY)
  }

  const fullAddress = [loan.property_address, loan.property_city, loan.property_state, loan.property_zip].filter(Boolean).join(', ')
  const downPayment = loan.down_payment
    ? `${fmtCurrency(loan.down_payment)}${loan.down_payment_pct ? ` (${fmtPct(loan.down_payment_pct)})` : ''}`
    : null

  function renderCardContent(id: string) {
    switch (id) {
      case 'borrower':
        return <InfoCard title="Borrower" fields={[
          { label: 'Name',          value: [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name },
          { label: 'Co-Borrower',   value: loan.co_borrower_name },
          { label: 'Email',         value: <EmailLink email={loan.borrower_email} /> },
          { label: 'Phone',         value: <PhoneLink phone={loan.borrower_phone} /> },
          { label: 'Co-Borr Email', value: <EmailLink email={loan.co_borrower_email} /> },
          { label: 'Co-Borr Phone', value: <PhoneLink phone={loan.co_borrower_phone} /> },
        ]} />
      case 'loan-terms':
        return <InfoCard title="Loan Terms" fields={[
          { label: 'Loan Amount', value: fmtCurrency(loan.loan_amount) },
          { label: 'Loan Type',   value: loan.loan_type },
          { label: 'Program',     value: loan.loan_program },
          { label: 'Rate / APR',  value: loan.interest_rate ? `${fmtPct(loan.interest_rate)}${loan.apr ? ` / ${fmtPct(loan.apr)}` : ''}` : null },
          { label: 'Term',        value: loan.loan_term ? `${Math.round(loan.loan_term / 12)} years` : null },
          { label: 'Monthly P&I', value: fmtCurrency(loan.monthly_payment) },
        ]} />
      case 'property':
        return <InfoCard title="Property" fields={[
          { label: 'Address',        value: fullAddress || loan.property_address },
          { label: 'County',         value: loan.property_county },
          { label: 'Type',           value: loan.property_type },
          { label: 'Purchase Price', value: fmtCurrency(loan.purchase_price) },
          { label: 'Appraised',      value: fmtCurrency(loan.appraised_value) },
          { label: 'Down Payment',   value: downPayment },
          { label: 'LTV',            value: fmtPct(loan.ltv) },
        ]} />
      case 'key-dates':
        return <InfoCard title="Key Dates" fields={[
          { label: 'Application',  value: fmtDate(loan.application_date) },
          { label: 'Est. Close',   value: fmtDate(loan.estimated_closing_date) },
          { label: 'Rate Lock',    value: fmtDate(loan.rate_lock_date) },
          { label: 'Lock Expiry',  value: fmtDate(loan.rate_lock_expiration) },
          { label: 'Actual Close', value: fmtDate(loan.closing_date) },
        ]} />
      case 'origination':
        return <InfoCard title="Origination" fields={[
          { label: 'AUS Result',              value: loan.aus_result || loan.milestone },
          { label: 'Originator Compensation', value: loan.originator_comp != null ? fmtCurrency(loan.originator_comp) : null },
          { label: 'Credit Score',            value: loan.credit_score != null ? String(loan.credit_score) : null },
          { label: 'DTI (F/B)',               value: (loan.front_end_dti || loan.back_end_dti) ? `${fmtPct(loan.front_end_dti)} / ${fmtPct(loan.back_end_dti)}` : null },
          { label: 'Lender',                  value: loan.lender_name },
        ]} />
      case 'parties':
        return <PartiesCard
          buyerName={loan.buyers_agent_name || loan.buyer_agent_name}
          buyerContactId={loan.buyer_agent_contact_id}
          buyerPhone={loan.buyers_agent_phone}
          buyerEmail={loan.buyers_agent_email || loan.buyer_agent_email}
          listingName={loan.listing_agent_name}
          listingContactId={loan.listing_agent_contact_id}
          listingPhone={loan.listing_agent_phone}
          listingEmail={loan.listing_agent_email}
          titleCompany={loan.title_company}
          titleContact={loan.title_contact}
          titleEmail={loan.title_email}
        />
      default:
        return null
    }
  }

  const visibleInEditMode = cardOrder // show all cards (dimmed if hidden) when editing
  const visibleNormal = cardOrder.filter(id => !hiddenCards.has(id))
  const displayOrder = editLayout ? visibleInEditMode : visibleNormal

  return (
    <div>
      {/* Layout controls */}
      <div className="flex items-center justify-end gap-3 mb-3">
        {editLayout && hiddenCards.size > 0 && (
          <button
            onClick={resetLayout}
            className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Reset
          </button>
        )}
        <button
          onClick={() => setEditLayout(prev => !prev)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
            editLayout
              ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
          }`}
        >
          <Settings2 size={11} />
          {editLayout ? 'Done' : 'Edit layout'}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayOrder.map(id => (
              <SortableCardWrapper
                key={id}
                id={id}
                editLayout={editLayout}
                isHidden={hiddenCards.has(id)}
                onToggleHide={() => toggleHidden(id)}
              >
                {renderCardContent(id)}
              </SortableCardWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── CollapsibleDetails — wraps all EditableSectionCards ───────────────────────

function CollapsibleDetails({ loan, onSave, onSaveMultiple, contact }: {
  loan: Loan
  onSave: (field: string, value: string | number | null) => Promise<void>
  onSaveMultiple: (fields: Record<string, string | null>) => Promise<void>
  contact: ContactRow | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/60 transition-colors"
      >
        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Full Details &amp; Edit</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-700 space-y-5 p-5">
          <EditableSectionCard title="Loan Terms" onSave={onSave} fields={[
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

          <EditableSectionCard title="Property" onSave={onSave} fields={[
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

          <EditableSectionCard title="Borrower" onSave={onSave} fields={[
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
            { label: 'Employer',       displayValue: loan.employer_name, field: 'employer_name', rawValue: loan.employer_name },
          ]} />

          <EditableSectionCard title="Key Dates" onSave={onSave} fields={[
            { label: 'Loan Created',      displayValue: fmtDate(loan.loan_created_date) },
            { label: 'Application',       displayValue: fmtDate(loan.application_date),       field: 'application_date',       rawValue: loan.application_date,       type: 'date' },
            { label: 'Submission',        displayValue: fmtDate(loan.submission_date),        field: 'submission_date',        rawValue: loan.submission_date,        type: 'date' },
            { label: 'Approval',          displayValue: fmtDate(loan.approval_date),          field: 'approval_date',          rawValue: loan.approval_date,          type: 'date' },
            { label: 'Est. Closing',      displayValue: fmtDate(loan.estimated_closing_date), field: 'estimated_closing_date', rawValue: loan.estimated_closing_date, type: 'date' },
            { label: 'Closing',           displayValue: fmtDate(loan.closing_date),           field: 'closing_date',           rawValue: loan.closing_date,           type: 'date' },
            { label: 'Funding',           displayValue: fmtDate(loan.funding_date),           field: 'funding_date',           rawValue: loan.funding_date,           type: 'date' },
            { label: 'First Payment',     displayValue: fmtDate(loan.first_payment_date),     field: 'first_payment_date',     rawValue: loan.first_payment_date,     type: 'date' },
            { label: 'Rate Lock',         displayValue: fmtDate(loan.rate_lock_date),         field: 'rate_lock_date',         rawValue: loan.rate_lock_date,         type: 'date' },
            { label: 'Lock Expiry',       displayValue: fmtDate(loan.rate_lock_expiration),   field: 'rate_lock_expiration',   rawValue: loan.rate_lock_expiration,   type: 'date' },
            { label: 'Appraisal Ordered', displayValue: fmtDate(loan.appraisal_ordered_date), field: 'appraisal_ordered_date', rawValue: loan.appraisal_ordered_date, type: 'date' },
          ]} />

          <EditableSectionCard title="Origination" onSave={onSave} fields={[
            { label: 'AUS Result',              displayValue: loan.aus_result,     field: 'aus_result',     rawValue: loan.aus_result },
            { label: 'Originator Compensation', displayValue: loan.originator_comp != null ? fmtCurrency(loan.originator_comp) : '—', field: 'originator_comp', rawValue: loan.originator_comp, type: 'number', labelColor: 'text-[#C9A84C]' },
          ]} />

          <EditableSectionCard title="Financials" onSave={onSave} fields={[
            { label: 'Commission',      displayValue: loan.commission_amount != null ? fmtCurrency(loan.commission_amount) : '—', field: 'commission_amount', rawValue: loan.commission_amount, type: 'number', labelColor: 'text-[#C9A84C]' },
            { label: 'Monthly Payment', displayValue: fmtCurrency(loan.monthly_payment),     field: 'monthly_payment',     rawValue: loan.monthly_payment,     type: 'number' },
            { label: 'PITI',            displayValue: fmtCurrency(loan.piti),                field: 'piti',                rawValue: loan.piti,                type: 'number' },
            { label: 'Cash to Close',   displayValue: fmtCurrency(loan.cash_to_close),       field: 'cash_to_close',       rawValue: loan.cash_to_close,       type: 'number' },
            { label: 'Seller Credits',  displayValue: fmtCurrency(loan.seller_credits),      field: 'seller_credits',      rawValue: loan.seller_credits,      type: 'number' },
            { label: 'Lender Credits',  displayValue: fmtCurrency(loan.lender_credits),      field: 'lender_credits',      rawValue: loan.lender_credits,      type: 'number' },
            { label: 'Loan Costs',      displayValue: fmtCurrency(loan.loan_costs),          field: 'loan_costs',          rawValue: loan.loan_costs,          type: 'number' },
            { label: 'Total Closing',   displayValue: fmtCurrency(loan.total_closing_costs), field: 'total_closing_costs', rawValue: loan.total_closing_costs, type: 'number' },
            { label: 'HOI Monthly',     displayValue: fmtCurrency(loan.hoi_monthly),         field: 'hoi_monthly',         rawValue: loan.hoi_monthly,         type: 'number' },
            { label: 'Property Taxes',  displayValue: fmtCurrency(loan.property_taxes_monthly), field: 'property_taxes_monthly', rawValue: loan.property_taxes_monthly, type: 'number' },
            { label: 'HOA Dues',        displayValue: fmtCurrency(loan.hoa_dues),            field: 'hoa_dues',            rawValue: loan.hoa_dues,            type: 'number' },
          ]} />

          <EditableSectionCard title="Parties" onSave={onSave} onSaveMultiple={onSaveMultiple} fields={[
            { label: 'Referring Agent',   displayValue: loan.referring_agent_name,  field: 'referring_agent_name',  rawValue: loan.referring_agent_name,  searchContacts: true, relatedFields: { email: 'referring_agent_email', phone: 'referring_agent_phone' }, labelColor: 'text-amber-400' },
            { label: 'Ref Agent Email',   displayValue: loan.referring_agent_email, field: 'referring_agent_email', rawValue: loan.referring_agent_email, labelColor: 'text-amber-400/70' },
            { label: 'Ref Agent Phone',   displayValue: loan.referring_agent_phone, field: 'referring_agent_phone', rawValue: loan.referring_agent_phone, labelColor: 'text-amber-400/70' },
            { label: 'Listing Agent',     displayValue: loan.listing_agent_name,    field: 'listing_agent_name',    rawValue: loan.listing_agent_name,    searchContacts: true, relatedFields: { email: 'listing_agent_email', phone: 'listing_agent_phone' }, labelColor: 'text-sky-400' },
            { label: 'Listing Email',     displayValue: loan.listing_agent_email,   field: 'listing_agent_email',   rawValue: loan.listing_agent_email,   labelColor: 'text-sky-400/70' },
            { label: 'Listing Phone',     displayValue: loan.listing_agent_phone,   field: 'listing_agent_phone',   rawValue: loan.listing_agent_phone,   labelColor: 'text-sky-400/70' },
            { label: "Buyer's Agent",     displayValue: loan.buyers_agent_name || loan.buyer_agent_name, field: 'buyers_agent_name', rawValue: loan.buyers_agent_name || loan.buyer_agent_name, searchContacts: true, relatedFields: { email: 'buyers_agent_email', phone: 'buyers_agent_phone' }, labelColor: 'text-emerald-400' },
            { label: 'Buyer Agent Email', displayValue: loan.buyers_agent_email || loan.buyer_agent_email, field: 'buyers_agent_email', rawValue: loan.buyers_agent_email || loan.buyer_agent_email, labelColor: 'text-emerald-400/70' },
            { label: 'Buyer Agent Phone', displayValue: loan.buyers_agent_phone, field: 'buyers_agent_phone', rawValue: loan.buyers_agent_phone, labelColor: 'text-emerald-400/70' },
            { label: 'Title Company',     displayValue: loan.title_company,    field: 'title_company',    rawValue: loan.title_company },
            { label: 'Title Contact',     displayValue: loan.title_contact,    field: 'title_contact',    rawValue: loan.title_contact },
            { label: 'Title Email',       displayValue: loan.title_email,      field: 'title_email',      rawValue: loan.title_email },
            { label: 'Escrow Officer',    displayValue: loan.escrow_officer,   field: 'escrow_officer',   rawValue: loan.escrow_officer },
            { label: 'Processor',         displayValue: loan.processor_name,   field: 'processor_name',   rawValue: loan.processor_name },
            { label: 'Underwriter',       displayValue: loan.underwriter_name, field: 'underwriter_name', rawValue: loan.underwriter_name },
            { label: 'Lender',            displayValue: loan.lender_name,      field: 'lender_name',      rawValue: loan.lender_name },
          ]} />

          <EditableSectionCard title="Attribution" onSave={onSave} fields={[
            { label: 'Lead Source',        displayValue: loan.lead_source,        field: 'lead_source',        rawValue: loan.lead_source },
            { label: 'Referral Source',    displayValue: loan.referral_source,    field: 'referral_source',    rawValue: loan.referral_source },
            { label: 'Marketing Campaign', displayValue: loan.marketing_campaign, field: 'marketing_campaign', rawValue: loan.marketing_campaign },
          ]} />

          {/* Linked Contact */}
          {contact && (
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700">
                <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Linked Contact</h2>
              </div>
              <div className="p-4">
                <Link href={`/dashboard/contacts?id=${contact.id}`} className="font-mono font-semibold text-zinc-100 hover:text-indigo-400 transition-colors">
                  {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                </Link>
                {contact.email && <p className="text-sm text-zinc-500 mt-1 font-mono">{contact.email}</p>}
                {contact.phone && <p className="text-sm text-zinc-500 font-mono">{contact.phone}</p>}
                {contact.referred_by && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-xs text-zinc-500 font-mono">Referred by</p>
                    <Link href={`/dashboard/referral/${encodeURIComponent(contact.referred_by)}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 mt-0.5">
                      {contact.referred_by}<ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



// ── Milestone timeline ────────────────────────────────────────────────────────

function MilestoneTimeline({ loan }: { loan: Loan }) {
  const currentKey = normalizeToStageKey(loan.status)

  // Each milestone maps to a canonical StageKey — complete when loan has reached or passed that stage
  const milestones: { label: string; date: string | null; est?: string | null; reachedAt: StageKey; activeAt: StageKey }[] = [
    { label: 'Application Received',      date: loan.application_date,      reachedAt: 'new_application', activeAt: 'new_application' },
    { label: 'Disclosures Sent (LE)',      date: null,                       reachedAt: 'disclosed',       activeAt: 'setup' },
    { label: 'Submitted to Processing',   date: loan.submission_date,       reachedAt: 'processing',      activeAt: 'disclosed' },
    { label: 'Submitted to Underwriting', date: null,                       reachedAt: 'submitted',       activeAt: 'processing' },
    { label: 'Approved w/ Conditions',    date: loan.approval_date,         reachedAt: 'approved',        activeAt: 'submitted' },
    { label: 'CTC Issued',               date: null,                       reachedAt: 'clear_to_close',  activeAt: 'approved' },
    { label: 'Closing Docs Drawn',        date: null,                       reachedAt: 'clear_to_close',  activeAt: 'clear_to_close',
      est: loan.estimated_closing_date },
    { label: 'Funded',
      date: loan.funding_date || loan.closing_date,                         reachedAt: 'funded',          activeAt: 'clear_to_close',
      est: loan.closing_date || loan.estimated_closing_date },
  ]

  const gold = '#C9A84C'
  const goldMuted = 'rgba(201,168,76,0.35)'

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="px-3 py-2 bg-zinc-800/80 border-b border-zinc-700">
        <h2 className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Milestones</h2>
      </div>
      <div className="px-2 py-2 overflow-x-auto">
        <div className="flex flex-nowrap items-start min-w-min">
          {milestones.map((m, i) => {
            const isComplete = m.date != null || hasReachedStage(loan.status, m.reachedAt)
            const isActive = !isComplete && (currentKey === m.activeAt || hasReachedStage(loan.status, m.activeAt))
            const isPending = !isComplete && !isActive
            const estDate = m.est ?? null

            const sub =
              isComplete && m.date
                ? fmtDate(m.date)
                : isComplete && !m.date
                  ? 'Completed'
                  : isActive
                    ? (m.date ? `${fmtDate(m.date)} · active` : 'In progress')
                    : isPending && estDate
                      ? `Est. ${fmtDate(estDate)}`
                      : null

            const lineDone = isComplete

            return (
              <div key={m.label} className="contents">
                <div className="flex flex-col items-center shrink-0 w-[4.75rem] sm:w-[5.25rem] px-0.5">
                  <div className="flex justify-center mb-1">
                    {isComplete ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: gold }}
                      >
                        <Check size={9} className="text-zinc-900" strokeWidth={3} />
                      </div>
                    ) : isActive ? (
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: gold }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: gold }} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0 bg-zinc-900/80" />
                    )}
                  </div>
                  <p
                    className={`text-[9px] sm:text-[10px] font-mono font-medium text-center leading-tight line-clamp-2 ${
                      isComplete || isActive ? 'text-zinc-200' : 'text-zinc-500'
                    }`}
                  >
                    {m.label}
                  </p>
                  {sub && (
                    <p className="text-[8px] font-mono text-zinc-500 text-center leading-tight mt-0.5 line-clamp-2 w-full">
                      {sub}
                    </p>
                  )}
                </div>
                {i < milestones.length - 1 && (
                  <div
                    className="shrink-0 self-start mt-[7px] h-0.5 w-2 sm:w-3 rounded-full"
                    style={{ background: lineDone ? goldMuted : '#3f3f46' }}
                  />
                )}
              </div>
            )
          })}
        </div>
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
    <div className={`flex items-start px-4 py-2 text-sm group ${index > 0 ? 'border-t border-zinc-700/60' : ''}`}>
      <span className={`w-40 shrink-0 text-xs font-mono leading-5 mt-0.5 ${labelColor ?? 'text-zinc-500'}`}>{label}</span>
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
              className="text-xs font-mono border border-indigo-500/50 rounded px-2 py-0.5 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full placeholder-zinc-600"
            />
            {(loadingSuggestions || suggestions.length > 0) && dropdownRect && typeof document !== 'undefined' && createPortal(
              <div
                style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: Math.max(dropdownRect.width, 256), zIndex: 9999 }}
                className="bg-zinc-800 border border-zinc-600 rounded shadow-xl max-h-52 overflow-y-auto"
              >
                {loadingSuggestions && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-xs font-mono text-zinc-500">Searching…</div>
                )}
                {suggestions.map(c => (
                  <button
                    key={c.id}
                    onMouseDown={e => { e.preventDefault(); selectContact(c) }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 transition-colors border-b border-zinc-700/50 last:border-0"
                  >
                    <div className="text-xs font-mono text-zinc-100 font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                    </div>
                    {c.email && <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{c.email}</div>}
                    {c.contact_type && <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wide">{c.contact_type}</span>}
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
      <p className="text-sm text-zinc-500 font-mono mb-4">
        Run automations pre-filled with this loan&apos;s details. Output will be an Outlook draft.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKFLOWS.map(wf => (
          <div
            key={wf.id}
            ref={wf.id === highlightId ? highlightRef : undefined}
            className={`bg-zinc-900/80 border rounded-lg shadow-lg shadow-black/50 p-4 transition-colors ${
              wf.id === highlightId ? 'border-[#C9A84C] ring-1 ring-[#C9A84C]/30' : 'border-zinc-700 hover:border-indigo-500/50'
            }`}
          >
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

function ActivityTab({ activity, setActivity, loanId, onRefresh }: { activity: ActivityRow[]; setActivity: (a: ActivityRow[]) => void; loanId: string; onRefresh: () => void }) {
  const supabase = createClient()
  const { userId } = useOrg()
  const [filter, setFilter] = useState<'all' | 'system' | 'manual'>('all')
  const [logModal, setLogModal] = useState<'call' | 'email' | 'text' | null>(null)
  const [logNotes, setLogNotes] = useState('')
  const [logSaving, setLogSaving] = useState(false)

  const handleLogActivity = async () => {
    if (!logModal) return
    setLogSaving(true)

    const newRow: ActivityRow = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      action: `Logged ${logModal}`,
      type: logModal,
      summary: logNotes.trim() || null,
      entity_type: 'loan',
      metadata: { activity_type: logModal },
    }

    // Optimistic update — prepend to feed immediately
    setActivity([newRow, ...activity])
    setLogModal(null)
    setLogNotes('')

    // Persist to Supabase
    const { error } = await supabase.from('activity_log').insert({
      loan_id: loanId,
      action: `Logged ${logModal}`,
      type: logModal,
      summary: logNotes.trim() || null,
      entity_type: 'loan',
      metadata: { activity_type: logModal },
      user_id: userId ?? null,
    })

    setLogSaving(false)

    if (error) {
      // Rollback optimistic update on failure
      setActivity(activity)
      return
    }

    // Background re-fetch to get server-generated id
    onRefresh()
  }

  const INTERNAL_KEYS = new Set(['loan_id', 'contact_id', 'user_id', 'id', 'created_at'])
  const isSystem = (item: ActivityRow) => item.action.includes('.')

  const systemCount = activity.filter(isSystem).length
  const manualCount = activity.filter(i => !isSystem(i)).length
  const visible = filter === 'all'
    ? activity
    : filter === 'system'
      ? activity.filter(isSystem)
      : activity.filter(i => !isSystem(i))

  return (
    <div className="max-w-2xl">
      {/* Log activity buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setLogModal('call')} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-emerald-900/30 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/50 transition-colors">
          <span className="text-sm">📞</span> Log Call
        </button>
        <button onClick={() => setLogModal('email')} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-blue-900/30 text-blue-400 border border-blue-800 hover:bg-blue-900/50 transition-colors">
          <span className="text-sm">📧</span> Log Email
        </button>
        <button onClick={() => setLogModal('text')} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-violet-900/30 text-violet-400 border border-violet-800 hover:bg-violet-900/50 transition-colors">
          <span className="text-sm">💬</span> Log Text
        </button>
      </div>

      {/* Log modal */}
      {logModal && (
        <div className="mb-4 bg-zinc-800/80 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-mono font-semibold text-zinc-100">Log {logModal}</h3>
            <button onClick={() => { setLogModal(null); setLogNotes('') }} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <div className="mb-2">
            <p className="text-[10px] font-mono text-zinc-500 mb-1">Date/Time: {new Date().toLocaleString()}</p>
          </div>
          <textarea
            value={logNotes}
            onChange={e => setLogNotes(e.target.value)}
            placeholder={`Notes about this ${logModal}...`}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] resize-y"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleLogActivity}
              disabled={logSaving || !logNotes.trim()}
              className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-[#C9A84C] text-black hover:bg-[#d4b860] disabled:opacity-50 transition-colors"
            >
              {logSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setLogModal(null); setLogNotes('') }} className="px-3 py-1.5 rounded text-xs font-mono text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 font-mono">
          <Activity size={24} />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
      <>
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
          {visible.map((item, i) => {
            const typeIcon = item.type === 'call' ? '📞' : item.type === 'email' ? '📧' : item.type === 'text' ? '💬' : null
            const typeLabel = item.type === 'call' ? 'Call' : item.type === 'email' ? 'Email' : item.type === 'text' ? 'Text' : null
            const isManual = !isSystem(item)
            return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                {typeIcon ? (
                  <span className="text-sm mt-0.5 shrink-0">{typeIcon}</span>
                ) : (
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isManual ? 'bg-blue-400' : 'bg-emerald-500'}`} />
                )}
                {i !== visible.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-1" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  {typeLabel && <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">{typeLabel}</span>}
                  <p className="text-sm font-mono text-zinc-200">{item.action}</p>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                {item.summary && (
                  <p className="text-xs font-mono text-zinc-300 mt-1">{item.summary}</p>
                )}
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
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 font-mono">
        <Inbox size={24} />
        <p className="text-sm">No emails logged yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {drafts.length > 0 && (
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Draft Queue</p>
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
      )}

      {/* Inbound emails from n8n / Outlook sync */}
      {inboundEmails.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Inbound</p>
          {inboundEmails.map(email => {
            const fromName = (email.metadata?.from_name as string) || null
            const isOpen = expanded === email.id
            return (
              <div key={email.id} className="border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-700 transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : email.id)} className="w-full text-left p-4 focus:outline-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-900/30 text-amber-400 border-amber-800">INBOUND</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(email.occurred_at || email.created_at)}</span>
                    </div>
                    {isOpen ? <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="text-sm font-medium text-zinc-100 truncate mb-1">{email.subject || '(no subject)'}</div>
                  <div className="text-xs text-zinc-400 truncate">From: {fromName ? `${fromName} <${email.from_address}>` : (email.from_address || '—')}</div>
                  {!isOpen && email.body_snippet && (
                    <div className="text-xs text-zinc-500 mt-2 line-clamp-2">{email.body_snippet}</div>
                  )}
                </button>
                {isOpen && email.body_snippet && (
                  <div className="border-t border-zinc-800 p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap bg-zinc-800/50 rounded-b-lg max-h-64 overflow-y-auto">
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
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Email Log</p>
          {contactEmails.map(ce => {
            const src = ce.automation_source ?? 'unknown'
            const colorClass = DRAFT_COLORS[src] || 'bg-zinc-700 text-zinc-300 border-zinc-600'
            const label = DRAFT_LABELS[src] || src.replace(/_/g, ' ')
            const isOpen = expanded === ce.id
            return (
              <div key={ce.id} className="border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-700 transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : ce.id)} className="w-full text-left p-4 focus:outline-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{fmtRelative(ce.sent_at)}</span>
                    </div>
                    {isOpen ? <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="text-sm font-medium text-zinc-100 truncate">{ce.subject}</div>
                </button>
                {isOpen && (ce.body_html || ce.body_text) && (
                  <div className="border-t border-zinc-800 p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap bg-zinc-800/50 rounded-b-lg max-h-64 overflow-y-auto">
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
  'Cancelled': '#71717A', 'Dead': '#52525B', 'Denied': '#EF4444', 'Withdrawn': '#9CA3AF',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-500 text-xs font-mono">—</span>
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

