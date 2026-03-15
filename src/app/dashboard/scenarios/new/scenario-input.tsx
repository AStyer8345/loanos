'use client'

import { X, DollarSign, Percent } from 'lucide-react'
import { ScenarioData } from './types'

interface ScenarioInputProps {
  scenario: ScenarioData
  canRemove: boolean
  onUpdate: (updates: Partial<ScenarioData>) => void
  onRemove: () => void
}

export function ScenarioInput({ scenario, canRemove, onUpdate, onRemove }: ScenarioInputProps) {
  const loanTypes = [
    { value: 'conventional', label: 'Conventional' },
    { value: 'fha', label: 'FHA' },
    { value: 'va', label: 'VA' },
    { value: 'usda', label: 'USDA' },
    { value: 'jumbo', label: 'Jumbo' },
  ]

  const loanTerms = [
    { value: 30, label: '30 years' },
    { value: 20, label: '20 years' },
    { value: 15, label: '15 years' },
    { value: 10, label: '10 years' },
  ]

  return (
    <div className="flex-1 min-w-[280px] bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={scenario.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="bg-transparent border-b border-[var(--border)] text-[var(--foreground)] font-medium text-sm px-1 py-0.5 focus:outline-none focus:border-[var(--gold)]"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Remove scenario"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Loan Amount */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Loan Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
            <input
              type="number"
              value={scenario.loanAmount}
              onChange={(e) => onUpdate({ loanAmount: Number(e.target.value) })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 pl-7 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>

        {/* Purchase Price */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Purchase Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
            <input
              type="number"
              value={scenario.purchasePrice}
              onChange={(e) => onUpdate({ purchasePrice: Number(e.target.value) })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 pl-7 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>

        {/* Down Payment with Toggle */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Down Payment</label>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                {scenario.downPaymentMode === 'dollar' ? '$' : '%'}
              </span>
              <input
                type="number"
                value={scenario.downPayment}
                onChange={(e) => onUpdate({ downPayment: Number(e.target.value) })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 pl-7 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
            <div className="flex border border-[var(--border)] rounded overflow-hidden">
              <button
                onClick={() => {
                  if (scenario.downPaymentMode === 'percent') {
                    const dollarValue = (scenario.downPayment / 100) * scenario.purchasePrice
                    onUpdate({ downPaymentMode: 'dollar', downPayment: Math.round(dollarValue) })
                  }
                }}
                className={`p-2 ${scenario.downPaymentMode === 'dollar' ? 'bg-[var(--gold)] text-[var(--background)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}
                aria-label="Dollar mode"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (scenario.downPaymentMode === 'dollar') {
                    const percentValue = (scenario.downPayment / scenario.purchasePrice) * 100
                    onUpdate({ downPaymentMode: 'percent', downPayment: Math.round(percentValue * 10) / 10 })
                  }
                }}
                className={`p-2 ${scenario.downPaymentMode === 'percent' ? 'bg-[var(--gold)] text-[var(--background)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}
                aria-label="Percent mode"
              >
                <Percent className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Interest Rate (%)</label>
          <input
            type="number"
            step="0.125"
            value={scenario.interestRate}
            onChange={(e) => onUpdate({ interestRate: Number(e.target.value) })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>

        {/* Loan Term */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Loan Term</label>
          <select
            value={scenario.loanTerm}
            onChange={(e) => onUpdate({ loanTerm: Number(e.target.value) })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
          >
            {loanTerms.map((term) => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loan Type */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Loan Type</label>
          <select
            value={scenario.loanType}
            onChange={(e) => onUpdate({ loanType: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
          >
            {loanTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Points/Credits */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Points / Credits</label>
          <input
            type="number"
            step="0.125"
            value={scenario.pointsCredits}
            onChange={(e) => onUpdate({ pointsCredits: Number(e.target.value) })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
            placeholder="Negative for credits"
          />
        </div>

        {/* Monthly Costs Section */}
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)] mb-2 font-medium">Monthly Costs</p>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Property Taxes</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">$</span>
                <input
                  type="number"
                  value={scenario.propertyTaxes}
                  onChange={(e) => onUpdate({ propertyTaxes: Number(e.target.value) })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 pl-5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Home Insurance</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">$</span>
                <input
                  type="number"
                  value={scenario.homeInsurance}
                  onChange={(e) => onUpdate({ homeInsurance: Number(e.target.value) })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 pl-5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">HOA Dues</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">$</span>
                <input
                  type="number"
                  value={scenario.hoaDues}
                  onChange={(e) => onUpdate({ hoaDues: Number(e.target.value) })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 pl-5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">PMI</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">$</span>
                <input
                  type="number"
                  value={scenario.pmi}
                  onChange={(e) => onUpdate({ pmi: Number(e.target.value) })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 pl-5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Closing Costs */}
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Closing Costs</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
            <input
              type="number"
              value={scenario.closingCosts}
              onChange={(e) => onUpdate({ closingCosts: Number(e.target.value) })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 pl-7 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
