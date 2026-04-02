'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput, LoanType, LoanTerm, BuydownType, ClosingCostBreakdown } from '@/lib/scenarios/types'
import { CurrencyField, PercentField, SelectField } from './FormFields'
import { sumClosingCosts } from './ScenarioBuilder'

const LOAN_TYPES: { value: string; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'non-qm', label: 'Non-QM' },
]

const LOAN_TERMS: { value: string; label: string }[] = [
  { value: '30', label: '30 Year' },
  { value: '25', label: '25 Year' },
  { value: '20', label: '20 Year' },
  { value: '15', label: '15 Year' },
  { value: '10', label: '10 Year' },
]

const BUYDOWN_TYPES: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: '2-1', label: '2-1 Buydown' },
  { value: '3-2-1', label: '3-2-1 Buydown' },
  { value: '1-0', label: '1-0 Buydown' },
]

interface ScenarioCardProps {
  // Purchase mode
  scenario?: PurchaseScenarioInput
  onUpdate?: (updates: Partial<PurchaseScenarioInput>) => void
  // Refi mode
  refiScenario?: RefiScenarioInput
  onUpdateRefi?: (updates: Partial<RefiScenarioInput>) => void
  currentLoan?: CurrentLoanInput
  isRefi?: boolean
  // Shared
  index: number
  propertyValue: number
  canRemove: boolean
  onRemove: () => void
  // Copy from first scenario
  copySource?: PurchaseScenarioInput | RefiScenarioInput | null
  onCopyFrom?: () => void
}

// ─── Inline Currency Input (compact, no label) ─────────────────────
function InlineCurrency({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const display = value > 0 ? value.toLocaleString('en-US') : ''
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--sc-muted)' }}>$</span>
      <input
        type="text"
        value={display}
        onChange={e => {
          const raw = e.target.value.replace(/[^0-9.]/g, '')
          onChange(parseFloat(raw) || 0)
        }}
        className="w-full pl-5 pr-2 py-1.5 rounded-md text-xs border outline-none focus:ring-1 text-right"
        style={{
          borderColor: 'var(--sc-border)',
          color: 'var(--sc-text)',
          background: 'var(--sc-bg)',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      />
    </div>
  )
}

// ─── Closing Cost Line Item ─────────────────────────────────────────
function CCLineItem({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-[11px] shrink-0" style={{ color: 'var(--sc-muted)' }}>{label}</span>
      <div className="w-28">
        <InlineCurrency value={value} onChange={onChange} />
      </div>
    </div>
  )
}

// ─── Closing Cost Category ──────────────────────────────────────────
function CCCategory({ title, total, children }: { title: string; total: number; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sc-accent)' }}>{title}</span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          ${total.toLocaleString()}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

// ─── Itemized Closing Costs Panel ───────────────────────────────────
function ClosingCostsPanel({
  breakdown,
  onChange,
  loanAmount,
  interestRate,
  pointsPercent,
  creditsPercent,
  onPointsChange,
  onCreditsChange,
  sellerCredits,
  onSellerCreditsChange,
}: {
  breakdown: ClosingCostBreakdown
  onChange: (updates: Partial<ClosingCostBreakdown>) => void
  loanAmount: number
  interestRate: number
  pointsPercent: number
  creditsPercent: number
  onPointsChange: (pct: number) => void
  onCreditsChange: (pct: number) => void
  sellerCredits?: number
  onSellerCreditsChange?: (v: number) => void
}) {
  const lenderTotal = breakdown.originationFee + breakdown.underwritingFee + breakdown.processingFee + breakdown.applicationFee + breakdown.adminFee
  const thirdPartyTotal = breakdown.appraisal + breakdown.creditReport + breakdown.docPrepFee + breakdown.floodCert + breakdown.attorneyFee + breakdown.settlementFee + breakdown.titleSearch + breakdown.titleEndorsements + breakdown.recordingFee + breakdown.lendersTitlePolicy

  // Prepaids calculation
  const dailyRate = loanAmount > 0 && interestRate > 0 ? (loanAmount * (interestRate / 100)) / 365 : 0
  const prepaidInterest = Math.round(dailyRate * breakdown.prepaidInterestDays)
  const prepaidTotal = prepaidInterest + breakdown.annualHazardInsurance

  const pointsDollar = Math.round(loanAmount * (pointsPercent / 100))
  const creditsDollar = Math.round(loanAmount * (creditsPercent / 100))

  const grandTotal = lenderTotal + thirdPartyTotal + prepaidTotal + pointsDollar

  return (
    <div>
      {/* Points & Credits */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--sc-border)' }}>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <PercentField label="Discount Points" value={pointsPercent} onChange={onPointsChange} decimals={3} />
          <PercentField label="Lender Credits" value={creditsPercent} onChange={onCreditsChange} decimals={3} />
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--sc-muted)' }}>
          <span>Points: <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>${pointsDollar.toLocaleString()}</span></span>
          <span>Credits: <span style={{ color: 'var(--sc-green)', fontFamily: "'IBM Plex Mono', monospace" }}>-${creditsDollar.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Lender Fees */}
      <CCCategory title="Lender Fees" total={lenderTotal}>
        <CCLineItem label="Origination Fee" value={breakdown.originationFee} onChange={v => onChange({ originationFee: v })} />
        <CCLineItem label="Underwriting Fee" value={breakdown.underwritingFee} onChange={v => onChange({ underwritingFee: v })} />
        <CCLineItem label="Processing Fee" value={breakdown.processingFee} onChange={v => onChange({ processingFee: v })} />
        <CCLineItem label="Application Fee" value={breakdown.applicationFee} onChange={v => onChange({ applicationFee: v })} />
        <CCLineItem label="Admin Fee" value={breakdown.adminFee} onChange={v => onChange({ adminFee: v })} />
      </CCCategory>

      {/* Third Party Fees */}
      <CCCategory title="Third Party Fees" total={thirdPartyTotal}>
        <CCLineItem label="Appraisal" value={breakdown.appraisal} onChange={v => onChange({ appraisal: v })} />
        <CCLineItem label="Credit Report" value={breakdown.creditReport} onChange={v => onChange({ creditReport: v })} />
        <CCLineItem label="Doc Preparation" value={breakdown.docPrepFee} onChange={v => onChange({ docPrepFee: v })} />
        <CCLineItem label="Flood Certification" value={breakdown.floodCert} onChange={v => onChange({ floodCert: v })} />
        <CCLineItem label="TX Attorney Fee" value={breakdown.attorneyFee} onChange={v => onChange({ attorneyFee: v })} />
        <CCLineItem label="Settlement Fee" value={breakdown.settlementFee} onChange={v => onChange({ settlementFee: v })} />
        <CCLineItem label="Title Search" value={breakdown.titleSearch} onChange={v => onChange({ titleSearch: v })} />
        <CCLineItem label="Title Endorsements" value={breakdown.titleEndorsements} onChange={v => onChange({ titleEndorsements: v })} />
        <CCLineItem label="Recording Fee" value={breakdown.recordingFee} onChange={v => onChange({ recordingFee: v })} />
        <CCLineItem label="Lender's Title Policy" value={breakdown.lendersTitlePolicy} onChange={v => onChange({ lendersTitlePolicy: v })} />
      </CCCategory>

      {/* Prepaids */}
      <CCCategory title="Prepaids" total={prepaidTotal}>
        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-[11px]" style={{ color: 'var(--sc-muted)' }}>Prepaid Interest</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={31}
              value={breakdown.prepaidInterestDays}
              onChange={e => onChange({ prepaidInterestDays: parseInt(e.target.value) || 0 })}
              className="w-12 px-1.5 py-1.5 rounded-md text-xs border outline-none text-center"
              style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <span className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>days</span>
            <span className="text-xs w-20 text-right" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              ${prepaidInterest.toLocaleString()}
            </span>
          </div>
        </div>
        <CCLineItem label="Hazard Insurance (annual)" value={breakdown.annualHazardInsurance} onChange={v => onChange({ annualHazardInsurance: v })} />
      </CCCategory>

      {/* Credits / Seller Credits */}
      {onSellerCreditsChange && sellerCredits !== undefined && (
        <div className="mb-3">
          <CurrencyField label="Seller Credits" value={sellerCredits} onChange={onSellerCreditsChange} />
        </div>
      )}

      {/* Grand Total */}
      <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: '2px solid var(--sc-accent)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--sc-text)' }}>Total Closing Costs</span>
        <span className="text-sm font-bold" style={{ color: 'var(--sc-accent)', fontFamily: "'IBM Plex Mono', monospace" }}>
          ${grandTotal.toLocaleString()}
        </span>
      </div>
      {creditsDollar > 0 && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>After Lender Credits</span>
          <span className="text-xs font-medium" style={{ color: 'var(--sc-green)', fontFamily: "'IBM Plex Mono', monospace" }}>
            ${Math.max(0, grandTotal - creditsDollar).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

function Collapsible({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--sc-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-xs font-semibold py-1 transition-colors"
        style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  )
}

export default function ScenarioCard({
  scenario, onUpdate, refiScenario, onUpdateRefi,
  currentLoan, isRefi, index, canRemove, onRemove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  copySource: _copySource, onCopyFrom,
}: ScenarioCardProps) {
  const [editingLabel, setEditingLabel] = useState(false)

  if (isRefi && refiScenario && onUpdateRefi) {
    return (
      <RefiCard
        scenario={refiScenario}
        onUpdate={onUpdateRefi}
        currentLoan={currentLoan}
        index={index}
        canRemove={canRemove}
        onRemove={onRemove}
        onCopyFrom={onCopyFrom}
      />
    )
  }

  if (!scenario || !onUpdate) return null

  const label = scenario.label || `Option ${String.fromCharCode(65 + index)}`

  // Auto-calc down payment / loan amount
  const handlePurchasePriceChange = (v: number) => {
    const dp = v * (scenario.downPaymentPercent / 100)
    onUpdate({ purchasePrice: v, downPaymentAmount: Math.round(dp), loanAmount: Math.round(v - dp) })
  }

  const handleDownPaymentPercentChange = (v: number) => {
    const dp = scenario.purchasePrice * (v / 100)
    onUpdate({ downPaymentPercent: v, downPaymentAmount: Math.round(dp), loanAmount: Math.round(scenario.purchasePrice - dp) })
  }

  const handleDownPaymentAmountChange = (v: number) => {
    const pct = scenario.purchasePrice > 0 ? (v / scenario.purchasePrice) * 100 : 0
    onUpdate({ downPaymentAmount: v, downPaymentPercent: Math.round(pct * 100) / 100, loanAmount: Math.round(scenario.purchasePrice - v) })
  }

  // Points/credits percentage -> dollar amount sync
  const handlePointsPercentChange = (pct: number) => {
    const dollars = Math.round(scenario.loanAmount * (pct / 100))
    onUpdate({ pointsPercent: pct, points: dollars })
  }

  const handleCreditsPercentChange = (pct: number) => {
    onUpdate({ creditsPercent: pct })
  }

  // Closing cost breakdown change — auto-recompute total
  const handleCCChange = (updates: Partial<ClosingCostBreakdown>) => {
    const newBreakdown = { ...scenario.closingCostBreakdown, ...updates }
    onUpdate({ closingCostBreakdown: newBreakdown, totalClosingCosts: sumClosingCosts(newBreakdown) })
  }

  return (
    <div className="rounded-[14px] p-5 relative group" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {editingLabel ? (
            <input
              autoFocus
              value={scenario.label}
              onChange={e => onUpdate({ label: e.target.value })}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingLabel(false)}
              className="bg-transparent border-b text-sm font-semibold outline-none px-1 py-0.5"
              style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {label}
            </button>
          )}
          <select
            value={scenario.loanType}
            onChange={e => onUpdate({ loanType: e.target.value as LoanType })}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md border uppercase tracking-wider"
            style={{ background: 'var(--sc-accent-dim)', borderColor: 'var(--sc-accent)', color: 'var(--sc-accent)' }}
          >
            {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && onCopyFrom && (
            <button
              onClick={onCopyFrom}
              className="text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors hover:bg-muted/60"
              style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-accent)' }}
              title="Copy all fields from Option A"
            >
              Copy A
            </button>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/60"
              style={{ color: 'var(--sc-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Core Fields — always visible */}
      <div className="space-y-4">
        <CurrencyField label="Purchase Price" value={scenario.purchasePrice} onChange={handlePurchasePriceChange} />

        <div className="grid grid-cols-2 gap-3">
          <CurrencyField label="Down Payment ($)" value={scenario.downPaymentAmount} onChange={handleDownPaymentAmountChange} />
          <PercentField label="Down Payment (%)" value={scenario.downPaymentPercent} onChange={handleDownPaymentPercentChange} decimals={1} />
        </div>

        <CurrencyField label="Loan Amount" value={scenario.loanAmount} onChange={v => onUpdate({ loanAmount: v })} />
        <PercentField label="Interest Rate" value={scenario.interestRate} onChange={v => onUpdate({ interestRate: v })} />
        <SelectField label="Loan Term" value={scenario.loanTerm.toString()} onChange={v => onUpdate({ loanTerm: parseInt(v) as LoanTerm })} options={LOAN_TERMS} />
      </div>

      {/* Monthly Costs — collapsed by default */}
      <Collapsible title="Monthly Costs">
        <CurrencyField label="Property Taxes" value={scenario.propertyTaxes} onChange={v => onUpdate({ propertyTaxes: v })} />
        <CurrencyField label="Homeowner's Insurance" value={scenario.homeownersInsurance} onChange={v => onUpdate({ homeownersInsurance: v })} />
        <CurrencyField label="HOA" value={scenario.hoa} onChange={v => onUpdate({ hoa: v })} />
        <CurrencyField label="PMI/MIP" value={scenario.pmi} onChange={v => onUpdate({ pmi: v })} />
        {scenario.loanType === 'conventional' && (
          <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)' }}>Auto-removes at 78% LTV for conventional</p>
        )}
      </Collapsible>

      {/* Closing Costs — Itemized Template */}
      <Collapsible title="Closing Costs">
        <ClosingCostsPanel
          breakdown={scenario.closingCostBreakdown}
          onChange={handleCCChange}
          loanAmount={scenario.loanAmount}
          interestRate={scenario.interestRate}
          pointsPercent={scenario.pointsPercent}
          creditsPercent={scenario.creditsPercent}
          onPointsChange={handlePointsPercentChange}
          onCreditsChange={handleCreditsPercentChange}
          sellerCredits={scenario.sellerCredits}
          onSellerCreditsChange={v => onUpdate({ sellerCredits: v })}
        />
      </Collapsible>

      {/* Buydown */}
      <Collapsible title="Buydown">
        <SelectField
          label="Buydown Type"
          value={scenario.buydownType}
          onChange={v => onUpdate({ buydownType: v as BuydownType, buydownYearRates: [] })}
          options={BUYDOWN_TYPES}
        />
        {scenario.buydownType !== 'none' && (
          <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)' }}>
            After buydown period, payment returns to full rate
          </p>
        )}
      </Collapsible>

      {/* Extra Payment */}
      <Collapsible title="Extra Payment">
        <CurrencyField label="Extra Monthly Payment" value={scenario.extraMonthlyPayment} onChange={v => onUpdate({ extraMonthlyPayment: v })} />
        {scenario.extraMonthlyPayment > 0 && (
          <p className="text-[10px]" style={{ color: 'var(--sc-green)' }}>
            Calculate to see payoff acceleration
          </p>
        )}
      </Collapsible>
    </div>
  )
}

// ─── Refinance Scenario Card ──────────────────────────────────────

function RefiCard({ scenario, onUpdate, currentLoan, index, canRemove, onRemove, onCopyFrom }: {
  scenario: RefiScenarioInput
  onUpdate: (updates: Partial<RefiScenarioInput>) => void
  currentLoan?: CurrentLoanInput
  index: number
  canRemove: boolean
  onRemove: () => void
  onCopyFrom?: () => void
}) {
  const [editingLabel, setEditingLabel] = useState(false)
  const label = scenario.label || `Option ${index + 1}`

  const handlePointsPercentChange = (pct: number) => {
    const dollars = Math.round(scenario.newLoanAmount * (pct / 100))
    onUpdate({ pointsPercent: pct, points: dollars })
  }

  const handleCreditsPercentChange = (pct: number) => {
    onUpdate({ creditsPercent: pct })
  }

  const handleCCChange = (updates: Partial<ClosingCostBreakdown>) => {
    const newBreakdown = { ...scenario.closingCostBreakdown, ...updates }
    onUpdate({ closingCostBreakdown: newBreakdown, closingCosts: sumClosingCosts(newBreakdown) })
  }

  return (
    <div className="rounded-[14px] p-5 relative group" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-accent)', borderWidth: '1px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {editingLabel ? (
            <input
              autoFocus
              value={scenario.label}
              onChange={e => onUpdate({ label: e.target.value })}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingLabel(false)}
              className="bg-transparent border-b text-sm font-semibold outline-none px-1 py-0.5"
              style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {label}
            </button>
          )}
          <select
            value={scenario.loanType}
            onChange={e => onUpdate({ loanType: e.target.value as LoanType })}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md border uppercase tracking-wider"
            style={{ background: 'var(--sc-accent-dim)', borderColor: 'var(--sc-accent)', color: 'var(--sc-accent)' }}
          >
            {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && onCopyFrom && (
            <button
              onClick={onCopyFrom}
              className="text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors hover:bg-muted/60"
              style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-accent)' }}
              title="Copy all fields from Option 1"
            >
              Copy 1
            </button>
          )}
          {canRemove && (
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/60" style={{ color: 'var(--sc-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Core Fields */}
      <div className="space-y-4">
        <CurrencyField label="New Loan Amount" value={scenario.newLoanAmount} onChange={v => onUpdate({ newLoanAmount: v })} />
        <PercentField label="Interest Rate" value={scenario.interestRate} onChange={v => onUpdate({ interestRate: v })} />
        <SelectField label="Loan Term" value={scenario.loanTerm.toString()} onChange={v => onUpdate({ loanTerm: parseInt(v) as LoanTerm })} options={LOAN_TERMS} />
      </div>

      {/* Closing Costs — Itemized Template */}
      <Collapsible title="Closing Costs" defaultOpen>
        <ClosingCostsPanel
          breakdown={scenario.closingCostBreakdown}
          onChange={handleCCChange}
          loanAmount={scenario.newLoanAmount}
          interestRate={scenario.interestRate}
          pointsPercent={scenario.pointsPercent}
          creditsPercent={scenario.creditsPercent}
          onPointsChange={handlePointsPercentChange}
          onCreditsChange={handleCreditsPercentChange}
        />
      </Collapsible>

      {/* Cash Out */}
      <Collapsible title="Cash Out">
        <CurrencyField label="Cash Out Amount" value={scenario.cashOutAmount} onChange={v => onUpdate({ cashOutAmount: v })} />
        {currentLoan && currentLoan.debts.length > 0 && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer text-xs" style={{ color: 'var(--sc-muted)' }}>
            <input
              type="checkbox"
              checked={scenario.payOffDebts}
              onChange={e => onUpdate({ payOffDebts: e.target.checked })}
              className="rounded"
            />
            Pay off listed debts with cash out
          </label>
        )}
      </Collapsible>

      <Collapsible title="Monthly Costs">
        <CurrencyField label="Property Taxes" value={scenario.propertyTaxes} onChange={v => onUpdate({ propertyTaxes: v })} />
        <CurrencyField label="Insurance" value={scenario.insurance} onChange={v => onUpdate({ insurance: v })} />
        <CurrencyField label="HOA" value={scenario.hoa} onChange={v => onUpdate({ hoa: v })} />
        <CurrencyField label="PMI/MIP" value={scenario.pmi} onChange={v => onUpdate({ pmi: v })} />
      </Collapsible>

      <Collapsible title="Extra Payment">
        <CurrencyField label="Extra Monthly Payment" value={scenario.extraMonthlyPayment} onChange={v => onUpdate({ extraMonthlyPayment: v })} />
      </Collapsible>
    </div>
  )
}
