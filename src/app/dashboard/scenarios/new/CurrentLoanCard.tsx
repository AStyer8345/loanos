'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CurrentLoanInput, DebtItem, LoanTerm } from '@/lib/scenarios/types'
import { monthlyPayment, remainingBalance, monthsElapsed } from '@/lib/scenarios/calculations'
import { CurrencyField, PercentField, SelectField } from './FormFields'

const LOAN_TERMS = [
  { value: '30', label: '30 Year' },
  { value: '25', label: '25 Year' },
  { value: '20', label: '20 Year' },
  { value: '15', label: '15 Year' },
  { value: '10', label: '10 Year' },
]

export default function CurrentLoanCard({ currentLoan, onUpdate }: {
  currentLoan: CurrentLoanInput
  onUpdate: (updates: Partial<CurrentLoanInput>) => void
}) {
  const [showDebts, setShowDebts] = useState(false)

  // Auto-calculated values
  const calcPI = useMemo(() =>
    monthlyPayment(currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalLoanTerm),
    [currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalLoanTerm]
  )

  const elapsed = useMemo(() => monthsElapsed(currentLoan.loanStartDate), [currentLoan.loanStartDate])

  const calcBalance = useMemo(() =>
    remainingBalance(currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalLoanTerm, elapsed),
    [currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalLoanTerm, elapsed]
  )

  const remainingMonths = currentLoan.originalLoanTerm * 12 - elapsed
  const remainingYears = Math.floor(Math.max(remainingMonths, 0) / 12)
  const remainingMo = Math.max(remainingMonths, 0) % 12

  const displayPI = currentLoan.currentMonthlyPI > 0 ? currentLoan.currentMonthlyPI : calcPI
  const displayBalance = currentLoan.currentPayoffBalance > 0 ? currentLoan.currentPayoffBalance : calcBalance
  const totalMonthly = displayPI + currentLoan.propertyTaxes + currentLoan.insurance + currentLoan.hoa + currentLoan.pmi
  const totalDebtPayments = currentLoan.debts.reduce((s, d) => s + d.monthlyPayment, 0)

  // Debt management
  const addDebt = () => {
    onUpdate({ debts: [...currentLoan.debts, { id: crypto.randomUUID(), description: '', monthlyPayment: 0, balance: 0 }] })
  }

  const updateDebt = (id: string, updates: Partial<DebtItem>) => {
    onUpdate({ debts: currentLoan.debts.map(d => d.id === id ? { ...d, ...updates } : d) })
  }

  const removeDebt = (id: string) => {
    onUpdate({ debts: currentLoan.debts.filter(d => d.id !== id) })
  }

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--sc-card)', border: '2px solid var(--sc-blue)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sc-blue)' }}>
        Current Loan
      </h3>

      <div className="space-y-3">
        <CurrencyField label="Original Loan Amount" value={currentLoan.originalLoanAmount} onChange={v => onUpdate({ originalLoanAmount: v })} />

        {/* Month/Year Picker */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>Loan Start Date</label>
          <input
            type="month"
            value={currentLoan.loanStartDate}
            onChange={e => onUpdate({ loanStartDate: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm border outline-none"
            style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-card)' }}
          />
        </div>

        <SelectField label="Original Loan Term" value={currentLoan.originalLoanTerm.toString()} onChange={v => onUpdate({ originalLoanTerm: parseInt(v) as LoanTerm })} options={LOAN_TERMS} />
        <PercentField label="Interest Rate" value={currentLoan.interestRate} onChange={v => onUpdate({ interestRate: v })} />

        {/* Auto-calculated P&I */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>Current Monthly P&I</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              ${displayPI > 0 ? displayPI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </span>
            {calcPI > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>(auto-calculated)</span>
            )}
          </div>
          <CurrencyField label="Override P&I" value={currentLoan.currentMonthlyPI} onChange={v => onUpdate({ currentMonthlyPI: v })} />
        </div>

        {/* Auto-calculated Payoff Balance */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>Estimated Payoff Balance</label>
          <div className="text-lg font-semibold" style={{ color: 'var(--sc-blue)', fontFamily: "'IBM Plex Mono', monospace" }}>
            ${displayBalance > 0 ? displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </div>
          {calcBalance > 0 && (
            <span className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>
              Amortized from start date to today
            </span>
          )}
          <CurrencyField label="Override Balance" value={currentLoan.currentPayoffBalance} onChange={v => onUpdate({ currentPayoffBalance: v })} />
        </div>

        {/* Remaining Term */}
        {remainingMonths > 0 && (
          <div className="text-xs" style={{ color: 'var(--sc-muted)' }}>
            Remaining: <span style={{ color: 'var(--sc-text)' }}>{remainingYears} years, {remainingMo} months</span>
          </div>
        )}

        <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--sc-border)' }}>
          <CurrencyField label="Monthly Property Taxes" value={currentLoan.propertyTaxes} onChange={v => onUpdate({ propertyTaxes: v })} />
          <div className="mt-3"><CurrencyField label="Monthly Insurance" value={currentLoan.insurance} onChange={v => onUpdate({ insurance: v })} /></div>
          <div className="mt-3"><CurrencyField label="Monthly HOA" value={currentLoan.hoa} onChange={v => onUpdate({ hoa: v })} /></div>
          <div className="mt-3"><CurrencyField label="Monthly PMI/MIP" value={currentLoan.pmi} onChange={v => onUpdate({ pmi: v })} /></div>
        </div>

        {/* Total Monthly */}
        <div className="p-3 rounded-md mt-3" style={{ background: 'var(--sc-blue-dim)' }}>
          <span className="text-xs" style={{ color: 'var(--sc-muted)' }}>Current Total Monthly Payment</span>
          <div className="text-xl font-bold" style={{ color: 'var(--sc-blue)', fontFamily: "'IBM Plex Mono', monospace" }}>
            ${totalMonthly > 0 ? totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </div>
        </div>

        {/* Debts to Consolidate */}
        <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--sc-border)' }}>
          <button onClick={() => setShowDebts(!showDebts)} className="text-xs font-medium" style={{ color: 'var(--sc-muted)' }}>
            {showDebts ? '▾' : '▸'} Debts to Consolidate
          </button>

          {showDebts && (
            <div className="mt-3 space-y-3">
              {currentLoan.debts.map(d => (
                <div key={d.id} className="p-2 rounded border space-y-2" style={{ borderColor: 'var(--sc-border)' }}>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={d.description}
                      onChange={e => updateDebt(d.id, { description: e.target.value })}
                      placeholder="Chase Visa, Auto Loan..."
                      className="bg-transparent text-xs border-none outline-none flex-1"
                      style={{ color: 'var(--sc-text)' }}
                    />
                    <button onClick={() => removeDebt(d.id)} className="p-0.5" style={{ color: 'var(--sc-red)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <CurrencyField label="Monthly Pmt" value={d.monthlyPayment} onChange={v => updateDebt(d.id, { monthlyPayment: v })} />
                    <CurrencyField label="Balance" value={d.balance} onChange={v => updateDebt(d.id, { balance: v })} />
                  </div>
                </div>
              ))}

              <button onClick={addDebt} className="flex items-center gap-1 text-xs" style={{ color: 'var(--sc-gold)' }}>
                <Plus size={12} /> Add Debt
              </button>

              {currentLoan.debts.length > 0 && (
                <div className="text-xs" style={{ color: 'var(--sc-muted)' }}>
                  Total Monthly Debt Payments: <span style={{ color: 'var(--sc-red)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${totalDebtPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
