'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput, LoanType, LoanTerm, BuydownType } from '@/lib/scenarios/types'
import { CurrencyField, PercentField, SelectField } from './ScenarioBuilder'

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

// ─── Closing Cost Templates ───────────────────────────────────────
const PURCHASE_CC_TEMPLATES = [
  { label: '~2% of loan', pct: 0.02 },
  { label: '~2.5% of loan', pct: 0.025 },
  { label: '~3% of loan', pct: 0.03 },
]

const REFI_CC_TEMPLATES = [
  { label: '~1.5% of loan', pct: 0.015 },
  { label: '~2% of loan', pct: 0.02 },
  { label: '~2.5% of loan', pct: 0.025 },
]

function Collapsible({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--sc-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-xs font-semibold py-1 transition-colors"
        style={{ color: 'var(--sc-muted)', fontFamily: "'Inter', sans-serif" }}
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
              style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}>
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
              className="text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-accent)' }}
              title="Copy all fields from Option A"
            >
              Copy A
            </button>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/5"
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
        <CurrencyField label="Points / Credits" value={scenario.points} onChange={v => onUpdate({ points: v })} />
      </div>

      {/* Monthly Costs — collapsed by default (progressive disclosure) */}
      <Collapsible title="Monthly Costs">
        <CurrencyField label="Property Taxes" value={scenario.propertyTaxes} onChange={v => onUpdate({ propertyTaxes: v })} />
        <CurrencyField label="Homeowner's Insurance" value={scenario.homeownersInsurance} onChange={v => onUpdate({ homeownersInsurance: v })} />
        <CurrencyField label="HOA" value={scenario.hoa} onChange={v => onUpdate({ hoa: v })} />
        <CurrencyField label="PMI/MIP" value={scenario.pmi} onChange={v => onUpdate({ pmi: v })} />
        {scenario.loanType === 'conventional' && (
          <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)' }}>Auto-removes at 78% LTV for conventional</p>
        )}
      </Collapsible>

      {/* Closing Costs */}
      <Collapsible title="Closing Costs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium" style={{ color: 'var(--sc-muted)' }}>Template:</span>
          {PURCHASE_CC_TEMPLATES.map(t => (
            <button
              key={t.pct}
              onClick={() => onUpdate({ totalClosingCosts: Math.round(scenario.loanAmount * t.pct) })}
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-border)' }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CurrencyField label="Total Closing Costs" value={scenario.totalClosingCosts} onChange={v => onUpdate({ totalClosingCosts: v })} />
        <CurrencyField label="Seller Credits" value={scenario.sellerCredits} onChange={v => onUpdate({ sellerCredits: v })} />
        {scenario.points < 0 && (
          <div className="text-xs" style={{ color: 'var(--sc-green)' }}>
            Lender Credits: ${Math.abs(scenario.points).toLocaleString()}
          </div>
        )}
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
            After buydown period, payment returns to {scenario.interestRate.toFixed(3)}%
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
              style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}>
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
              className="text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-accent)' }}
              title="Copy all fields from Option 1"
            >
              Copy 1
            </button>
          )}
          {canRemove && (
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/5" style={{ color: 'var(--sc-muted)' }}>
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
        <CurrencyField label="Points / Credits" value={scenario.points} onChange={v => onUpdate({ points: v })} />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-medium" style={{ color: 'var(--sc-muted)' }}>Template:</span>
            {REFI_CC_TEMPLATES.map(t => (
              <button
                key={t.pct}
                onClick={() => onUpdate({ closingCosts: Math.round(scenario.newLoanAmount * t.pct) })}
                className="text-[10px] px-2.5 py-1 rounded-md transition-colors hover:bg-white/10"
                style={{ color: 'var(--sc-accent)', border: '1px solid var(--sc-border)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <CurrencyField label="Closing Costs" value={scenario.closingCosts} onChange={v => onUpdate({ closingCosts: v })} />
        </div>
      </div>

      {/* Progressive disclosure sections */}
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
