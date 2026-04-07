'use client'

import { useState } from 'react'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import type { ClosingCostBreakdown } from '@/lib/scenarios/types'
import { TEXT, MUTED, CARD_BG, BORDER, GOLD, fmtCurrency } from './constants'

interface CashToCloseBreakdownProps {
  rows: ScenarioDisplayRow[]
  mode: 'purchase' | 'refinance'
}

/** Sum lender-origination fees */
function lenderFees(b: ClosingCostBreakdown): number {
  return (
    b.originationFee + b.underwritingFee + b.processingFee +
    b.applicationFee + b.adminFee
  )
}

/** Sum third-party / title / escrow fees */
function thirdPartyFees(b: ClosingCostBreakdown): number {
  return (
    b.appraisal + b.creditReport + b.docPrepFee + b.floodCert +
    b.attorneyFee + b.settlementFee + b.titleSearch +
    b.titleEndorsements + b.recordingFee + b.lendersTitlePolicy
  )
}

/** Prepaid items — interest days × daily rate not available here, so we use the raw fields */
function prepaidItems(b: ClosingCostBreakdown): number {
  return (
    b.prepaidInterestDays + b.annualHazardInsurance +
    b.taxEscrowMonths + (b.insuranceEscrowMonths ?? 0)
  )
}

function totalFromBreakdown(b: ClosingCostBreakdown): number {
  return lenderFees(b) + thirdPartyFees(b) + prepaidItems(b)
}

/** Lender fees detail items (only non-zero) */
function lenderFeeItems(b: ClosingCostBreakdown): { label: string; value: number }[] {
  return [
    { label: 'Origination Fee', value: b.originationFee },
    { label: 'Underwriting Fee', value: b.underwritingFee },
    { label: 'Processing Fee', value: b.processingFee },
    { label: 'Application Fee', value: b.applicationFee },
    { label: 'Admin Fee', value: b.adminFee },
  ].filter(i => i.value > 0)
}

/** Third-party fee detail items (only non-zero) */
function thirdPartyFeeItems(b: ClosingCostBreakdown): { label: string; value: number }[] {
  return [
    { label: 'Appraisal', value: b.appraisal },
    { label: 'Credit Report', value: b.creditReport },
    { label: 'Doc Prep Fee', value: b.docPrepFee },
    { label: 'Flood Certification', value: b.floodCert },
    { label: 'Attorney Fee', value: b.attorneyFee },
    { label: 'Settlement Fee', value: b.settlementFee },
    { label: 'Title Search', value: b.titleSearch },
    { label: 'Title Endorsements', value: b.titleEndorsements },
    { label: 'Recording Fee', value: b.recordingFee },
    { label: "Lender's Title Policy", value: b.lendersTitlePolicy },
  ].filter(i => i.value > 0)
}

/** Prepaid detail items (only non-zero) */
function prepaidFeeItems(b: ClosingCostBreakdown): { label: string; value: number }[] {
  return [
    { label: 'Prepaid Interest', value: b.prepaidInterestDays },
    { label: 'Hazard Insurance', value: b.annualHazardInsurance },
    { label: 'Tax Escrow', value: b.taxEscrowMonths },
    { label: 'Insurance Escrow', value: b.insuranceEscrowMonths ?? 0 },
  ].filter(i => i.value > 0)
}

interface WaterfallLineProps {
  label: string
  values: number[]
  isSubtract?: boolean
  isTotal?: boolean
  isBold?: boolean
  isSubItem?: boolean
}

function WaterfallLine({ label, values, isSubtract, isTotal, isBold, isSubItem }: WaterfallLineProps) {
  return (
    <div
      className="grid items-center gap-3"
      style={{
        gridTemplateColumns: `1fr repeat(${values.length}, minmax(80px, 100px))`,
        borderTop: isTotal ? `1px solid ${GOLD}40` : undefined,
        paddingTop: isTotal ? 8 : 0,
        marginTop: isTotal ? 4 : 0,
      }}
    >
      <span
        className={`text-[11px] ${isBold || isTotal ? 'font-semibold' : ''}`}
        style={{
          color: isTotal ? GOLD : isBold ? TEXT : MUTED,
          paddingLeft: isSubItem ? 16 : 0,
        }}
      >
        {isSubtract && !isTotal ? '– ' : ''}{label}
      </span>
      {values.map((v, i) => (
        <span
          key={i}
          className={`text-[12px] text-right font-mono ${isBold || isTotal ? 'font-bold' : 'font-medium'}`}
          style={{
            color: isTotal ? GOLD : isSubtract ? '#4ade80' : TEXT,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {isSubtract && v > 0 ? `(${fmtCurrency(v)})` : fmtCurrency(v)}
        </span>
      ))}
    </div>
  )
}

export default function CashToCloseBreakdown({ rows, mode }: CashToCloseBreakdownProps) {
  const [expanded, setExpanded] = useState(false)

  // Only show if at least one row has a closing cost breakdown
  const hasBreakdown = rows.some(r => r.closingCostBreakdown)
  if (!hasBreakdown) return null

  const isPurchase = mode === 'purchase'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Gold accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}20, ${GOLD}60, ${GOLD}20)` }} />

      <div className="p-4 sm:p-6">
        {/* Title — outside scroll area */}
        <div className="mb-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1"
            style={{ color: GOLD }}
          >
            {isPurchase ? 'Cash to Close' : 'Closing Costs'}
          </p>
          <p className="text-xs" style={{ color: MUTED }}>
            {isPurchase
              ? 'How your upfront costs break down for each option.'
              : 'Your closing cost breakdown for each option.'}
          </p>
        </div>

        {/* Scrollable waterfall — overflow-x-auto prevents horizontal blowout on mobile */}
        <div className="overflow-x-auto">
          {/* Scenario column headers */}
          <div
            className="grid items-end gap-3 mb-4"
            style={{ gridTemplateColumns: `1fr repeat(${rows.length}, minmax(80px, 100px))` }}
          >
            <div /> {/* empty label column */}
            {rows.map((r, i) => (
              <div key={i} className="text-right">
                <p className="text-[11px] font-bold" style={{ color: TEXT }}>{r.label}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: MUTED }}>{r.loanType}</p>
              </div>
            ))}
          </div>

          {/* ─── Waterfall Lines ─── */}
          <div className="space-y-2.5">
          {/* Down Payment (purchase only) */}
          {isPurchase && (
            <WaterfallLine
              label="Down Payment"
              values={rows.map(r => r.downPaymentAmount ?? 0)}
              isBold
            />
          )}

          {/* Closing Costs — summary line */}
          <WaterfallLine
            label="Closing Costs"
            values={rows.map(r =>
              r.closingCostBreakdown ? totalFromBreakdown(r.closingCostBreakdown) : 0
            )}
            isBold
          />

          {/* Expandable fee detail */}
          {expanded && rows.some(r => r.closingCostBreakdown) && (
            <div className="space-y-2 ml-1" style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 8 }}>
              {/* Lender Fees group */}
              {rows.some(r => r.closingCostBreakdown && lenderFees(r.closingCostBreakdown) > 0) && (
                <>
                  <WaterfallLine
                    label="Lender Fees"
                    values={rows.map(r => r.closingCostBreakdown ? lenderFees(r.closingCostBreakdown) : 0)}
                    isBold
                    isSubItem
                  />
                  {/* Find all unique non-zero fee items across all rows */}
                  {(() => {
                    const allItems = new Set<string>()
                    rows.forEach(r => {
                      if (r.closingCostBreakdown) {
                        lenderFeeItems(r.closingCostBreakdown).forEach(i => allItems.add(i.label))
                      }
                    })
                    return Array.from(allItems).map(label => (
                      <WaterfallLine
                        key={label}
                        label={label}
                        values={rows.map(r => {
                          if (!r.closingCostBreakdown) return 0
                          return lenderFeeItems(r.closingCostBreakdown).find(i => i.label === label)?.value ?? 0
                        })}
                        isSubItem
                      />
                    ))
                  })()}
                </>
              )}

              {/* Third Party Fees group */}
              {rows.some(r => r.closingCostBreakdown && thirdPartyFees(r.closingCostBreakdown) > 0) && (
                <>
                  <WaterfallLine
                    label="Third Party / Title"
                    values={rows.map(r => r.closingCostBreakdown ? thirdPartyFees(r.closingCostBreakdown) : 0)}
                    isBold
                    isSubItem
                  />
                  {(() => {
                    const allItems = new Set<string>()
                    rows.forEach(r => {
                      if (r.closingCostBreakdown) {
                        thirdPartyFeeItems(r.closingCostBreakdown).forEach(i => allItems.add(i.label))
                      }
                    })
                    return Array.from(allItems).map(label => (
                      <WaterfallLine
                        key={label}
                        label={label}
                        values={rows.map(r => {
                          if (!r.closingCostBreakdown) return 0
                          return thirdPartyFeeItems(r.closingCostBreakdown).find(i => i.label === label)?.value ?? 0
                        })}
                        isSubItem
                      />
                    ))
                  })()}
                </>
              )}

              {/* Prepaids group */}
              {rows.some(r => r.closingCostBreakdown && prepaidItems(r.closingCostBreakdown) > 0) && (
                <>
                  <WaterfallLine
                    label="Prepaids & Escrows"
                    values={rows.map(r => r.closingCostBreakdown ? prepaidItems(r.closingCostBreakdown) : 0)}
                    isBold
                    isSubItem
                  />
                  {(() => {
                    const allItems = new Set<string>()
                    rows.forEach(r => {
                      if (r.closingCostBreakdown) {
                        prepaidFeeItems(r.closingCostBreakdown).forEach(i => allItems.add(i.label))
                      }
                    })
                    return Array.from(allItems).map(label => (
                      <WaterfallLine
                        key={label}
                        label={label}
                        values={rows.map(r => {
                          if (!r.closingCostBreakdown) return 0
                          return prepaidFeeItems(r.closingCostBreakdown).find(i => i.label === label)?.value ?? 0
                        })}
                        isSubItem
                      />
                    ))
                  })()}
                </>
              )}
            </div>
          )}

          {/* Toggle detail button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-semibold uppercase tracking-wider mt-1 hover:opacity-80 transition-opacity print:hidden"
            style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? '▲ Hide fee detail' : '▼ Show fee detail'}
          </button>

          {/* Discount Points (if any) */}
          {rows.some(r => r.pointsPercent > 0) && (
            <WaterfallLine
              label="Discount Points"
              values={rows.map(r => {
                if (r.pointsPercent <= 0) return 0
                return Math.round(r.loanAmount * (r.pointsPercent / 100))
              })}
            />
          )}

          {/* Seller Credits (if any) */}
          {rows.some(r => (r.sellerCredits ?? 0) > 0) && (
            <WaterfallLine
              label="Seller Credits"
              values={rows.map(r => r.sellerCredits ?? 0)}
              isSubtract
            />
          )}

          {/* Lender Credits (if any) */}
          {rows.some(r => r.creditsPercent > 0) && (
            <WaterfallLine
              label="Lender Credits"
              values={rows.map(r => {
                if (r.creditsPercent <= 0) return 0
                return Math.round(r.loanAmount * (r.creditsPercent / 100))
              })}
              isSubtract
            />
          )}

          {/* ═══ TOTAL ═══ */}
          <WaterfallLine
            label={isPurchase ? 'Cash to Close' : 'Net Closing Costs'}
            values={rows.map(r => r.cashToClose)}
            isTotal
          />
          </div>
        </div>{/* end overflow-x-auto */}
      </div>
    </div>
  )
}
