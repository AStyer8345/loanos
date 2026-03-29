'use client'

import { useState } from 'react'
import type { PurchaseScenarioInput } from '@/lib/scenarios/types'

// ─── Constants ──────────────────────────────────────────────────────

// Conservative 3% annual appreciation — noted in compliance footer
const APPRECIATION_RATE = 0.03

// ─── Math Helpers ────────────────────────────────────────────────────

function calcPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0
  if (annualRate <= 0) return principal / (termYears * 12)
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
}

// Simulate amortization through a given month, return principal paid and remaining balance
function amortizeThrough(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  throughMonth: number
): { principalPaid: number; balance: number } {
  if (loanAmount <= 0) return { principalPaid: 0, balance: 0 }
  const r = annualRate > 0 ? annualRate / 100 / 12 : 0
  const pi = calcPI(loanAmount, annualRate, termYears)
  let balance = loanAmount
  let principalPaid = 0
  const cap = Math.min(throughMonth, termYears * 12)
  for (let m = 1; m <= cap; m++) {
    const interest = r > 0 ? balance * r : 0
    const pmt = Math.min(pi - interest, balance)
    balance = Math.max(balance - pmt, 0)
    principalPaid += pmt
  }
  return { principalPaid, balance }
}

// Year when cumulative renting cost exceeds cumulative net owning cost
function computeBreakEven(
  monthlyRent: number,
  monthlyPITI: number,
  downPayment: number,
  loanAmount: number,
  annualRate: number,
  termYears: number,
  purchasePrice: number
): number | null {
  if (monthlyRent <= 0 || monthlyPITI <= 0 || loanAmount <= 0 || purchasePrice <= 0) return null
  const r = annualRate > 0 ? annualRate / 100 / 12 : 0
  const pi = calcPI(loanAmount, annualRate, termYears)
  let balance = loanAmount
  let principalPaid = 0
  let cumRent = 0
  let cumPITI = 0

  for (let month = 1; month <= 360; month++) {
    const interest = r > 0 ? balance * r : 0
    const pmt = Math.min(pi - interest, balance)
    balance = Math.max(balance - pmt, 0)
    principalPaid += pmt

    const year = month / 12
    const appreciation = purchasePrice * (Math.pow(1 + APPRECIATION_RATE, year) - 1)
    const equity = downPayment + principalPaid + appreciation
    cumRent += monthlyRent
    cumPITI += monthlyPITI
    // Net owning cost = total cash in - equity returned
    const netOwningCost = downPayment + cumPITI - equity

    if (cumRent > netOwningCost) {
      return Math.ceil(month / 12)
    }
  }
  return null // > 30 years
}

// Snapshot data for year 5, 10, 15
interface YearSnapshot {
  year: number
  cumRent: number
  equity: number
  netOwningCost: number
  advantage: number // positive = owning better
}

function computeSnapshot(
  monthlyRent: number,
  monthlyPITI: number,
  downPayment: number,
  loanAmount: number,
  annualRate: number,
  termYears: number,
  purchasePrice: number,
  snapshotYear: number
): YearSnapshot {
  const { principalPaid } = amortizeThrough(loanAmount, annualRate, termYears, snapshotYear * 12)
  const appreciation = purchasePrice * (Math.pow(1 + APPRECIATION_RATE, snapshotYear) - 1)
  const equity = downPayment + principalPaid + appreciation
  const cumRent = monthlyRent * 12 * snapshotYear
  const cumPITI = monthlyPITI * 12 * snapshotYear
  const netOwningCost = downPayment + cumPITI - equity
  return {
    year: snapshotYear,
    cumRent,
    equity,
    netOwningCost,
    advantage: cumRent - netOwningCost,
  }
}

// ─── Formatting ──────────────────────────────────────────────────────

const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US')
const fmtK = (v: number) => {
  const abs = Math.abs(v)
  if (abs >= 1000) return (v < 0 ? '-$' : '$') + (abs / 1000).toFixed(1) + 'k'
  return fmt(v)
}

// ─── Component ──────────────────────────────────────────────────────

interface RentVsOwnSectionProps {
  purchaseScenarios: PurchaseScenarioInput[]
  propertyValue: number
}

export default function RentVsOwnSection({ purchaseScenarios, propertyValue }: RentVsOwnSectionProps) {
  const [rentInput, setRentInput] = useState('')

  const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setRentInput(raw ? Number(raw).toLocaleString('en-US') : '')
  }

  const base = purchaseScenarios[0]
  if (!base) return null

  const purchasePrice = base.purchasePrice > 0 ? base.purchasePrice : propertyValue
  if (purchasePrice <= 0 || base.interestRate <= 0 || base.loanTerm <= 0 || base.loanAmount <= 0) return null

  const monthlyRent = parseFloat(rentInput.replace(/[^0-9.]/g, '')) || 0

  const pi = calcPI(base.loanAmount, base.interestRate, base.loanTerm)
  const monthlyPITI = pi + base.propertyTaxes + base.homeownersInsurance + base.hoa + base.pmi
  const downPayment = base.downPaymentAmount

  const breakEvenYear = monthlyRent > 0
    ? computeBreakEven(monthlyRent, monthlyPITI, downPayment, base.loanAmount, base.interestRate, base.loanTerm, purchasePrice)
    : null

  const snapshots: YearSnapshot[] = monthlyRent > 0
    ? [5, 10, 15].map(y => computeSnapshot(
        monthlyRent, monthlyPITI, downPayment, base.loanAmount, base.interestRate, base.loanTerm, purchasePrice, y
      ))
    : []

  const monthlyCostDiff = monthlyPITI - monthlyRent // positive = owning costs more per month

  // ─── Styles ────────────────────────────────────────────────────────

  const tdBase: React.CSSProperties = {
    padding: '9px 16px',
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    borderBottom: '1px solid var(--sc-border)',
  }

  const tdLabel: React.CSSProperties = {
    ...tdBase,
    color: 'var(--sc-muted)',
    whiteSpace: 'nowrap',
  }

  const tdVal: React.CSSProperties = {
    ...tdBase,
    textAlign: 'right' as const,
    color: 'var(--sc-text)',
  }

  const tdSection: React.CSSProperties = {
    padding: '7px 16px 4px 16px',
    fontSize: 9,
    fontWeight: 600,
    color: 'rgba(201,168,76,0.6)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--sc-border)',
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Rent vs. Own Analysis
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmt(purchasePrice)} purchase · {base.interestRate.toFixed(3)}% · {base.loanTerm}-yr · {fmt(downPayment)} down
        </p>
      </div>

      {/* ── Rent Input ──────────────────────────────────────────────── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card-alt)', borderTop: '1px solid var(--sc-border)' }}>
        <label
          htmlFor="rvo-rent-input"
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(201,168,76,0.8)',
            marginBottom: 6,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Current Monthly Rent
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--sc-muted)', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>$</span>
          <input
            id="rvo-rent-input"
            type="text"
            inputMode="numeric"
            value={rentInput}
            onChange={handleRentChange}
            placeholder="e.g. 2,500"
            style={{
              background: 'transparent',
              border: '1px solid var(--sc-border)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
              color: 'var(--sc-text)',
              width: 140,
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>/month</span>
        </div>
      </div>

      {/* ── Hero: Break-Even ────────────────────────────────────────── */}
      {monthlyRent > 0 && (
        <div
          className="px-5 py-6"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
            borderTop: '1px solid var(--sc-border)',
            borderBottom: '1px solid var(--sc-border)',
          }}
        >
          {breakEvenYear !== null ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(201,168,76,0.7)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Owning beats renting by
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
                Year {breakEvenYear}
              </div>
              <div style={{ fontSize: 12, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>
                After Year {breakEvenYear}, every month builds wealth renting can&apos;t match
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#ef4444', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
                &gt; 30 yrs
              </div>
              <div style={{ fontSize: 12, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>
                At this rent vs. purchase price, owning does not break even within 30 years
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Monthly Cost Summary ─────────────────────────────────────── */}
      {monthlyRent > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--sc-border)' }}>
          {/* Rent */}
          <div className="px-4 py-4" style={{ borderRight: '1px solid var(--sc-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
              Monthly Rent
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmt(monthlyRent)}
            </div>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>$0 equity built</div>
          </div>

          {/* PITI */}
          <div className="px-4 py-4" style={{ borderRight: '1px solid var(--sc-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
              Monthly PITI
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmt(monthlyPITI)}
            </div>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
              {fmt(pi)} P&amp;I + taxes &amp; ins
            </div>
          </div>

          {/* Monthly Difference */}
          <div className="px-4 py-4" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
              {monthlyCostDiff >= 0 ? 'Owning Costs More' : 'Owning Costs Less'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: monthlyCostDiff >= 0 ? '#ef4444' : '#4CC98A', fontFamily: "'IBM Plex Mono', monospace" }}>
              {monthlyCostDiff >= 0 ? '+' : '-'}{fmt(Math.abs(monthlyCostDiff))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>per month upfront</div>
          </div>
        </div>
      )}

      {/* ── Wealth Snapshot Table ────────────────────────────────────── */}
      {snapshots.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead>
              <tr style={{ background: '#0A1628' }}>
                <th style={{
                  textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '2px solid rgba(255,255,255,0.15)',
                }}>
                  Metric
                </th>
                {snapshots.map(s => (
                  <th key={s.year} style={{
                    textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700,
                    color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.15)',
                  }}>
                    Year {s.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* ── Renting ── */}
              <tr style={{ background: '#0A1628' }}>
                <td colSpan={4} style={tdSection}>Renting</td>
              </tr>

              <tr style={{ background: 'var(--sc-card)' }}>
                <td style={tdLabel}>Total Rent Paid</td>
                {snapshots.map(s => (
                  <td key={s.year} style={{ ...tdVal, color: '#ef4444' }}>
                    {fmtK(s.cumRent)}
                  </td>
                ))}
              </tr>

              <tr style={{ background: 'var(--sc-card-alt)' }}>
                <td style={tdLabel}>Equity Built</td>
                {snapshots.map(s => (
                  <td key={s.year} style={tdVal}>
                    <span style={{ color: 'var(--sc-muted)' }}>$0</span>
                  </td>
                ))}
              </tr>

              {/* ── Owning ── */}
              <tr style={{ background: '#0A1628' }}>
                <td colSpan={4} style={tdSection}>Owning (3% annual appreciation)</td>
              </tr>

              <tr style={{ background: 'var(--sc-card)' }}>
                <td style={tdLabel}>Total PITI Paid</td>
                {snapshots.map(s => (
                  <td key={s.year} style={tdVal}>
                    {fmtK(s.netOwningCost - downPayment + s.equity)}
                  </td>
                ))}
              </tr>

              <tr style={{ background: 'var(--sc-card-alt)' }}>
                <td style={tdLabel}>Equity Built</td>
                {snapshots.map(s => (
                  <td key={s.year} style={{ ...tdVal, color: '#4CC98A', fontWeight: 600 }}>
                    {fmtK(s.equity)}
                  </td>
                ))}
              </tr>

              <tr style={{ background: 'var(--sc-card)' }}>
                <td style={{ ...tdLabel, fontWeight: 600, color: 'var(--sc-text)' }}>Net Owning Cost</td>
                {snapshots.map(s => (
                  <td key={s.year} style={{ ...tdVal, fontWeight: 700 }}>
                    {fmtK(Math.max(s.netOwningCost, 0))}
                  </td>
                ))}
              </tr>

              {/* ── Advantage ── */}
              <tr style={{ background: '#0A1628' }}>
                <td colSpan={4} style={tdSection}>Net Advantage of Owning</td>
              </tr>

              <tr style={{ background: 'var(--sc-card)' }}>
                <td style={{ ...tdLabel, fontWeight: 600, color: 'var(--sc-text)' }}>
                  You Come Out Ahead By
                </td>
                {snapshots.map(s => (
                  <td key={s.year} style={{
                    ...tdVal,
                    fontSize: 13,
                    fontWeight: 700,
                    color: s.advantage >= 0 ? '#C9A84C' : '#ef4444',
                    background: s.advantage >= 0 ? 'rgba(201,168,76,0.07)' : 'rgba(239,68,68,0.07)',
                  }}>
                    {s.advantage >= 0 ? '+' : ''}{fmtK(s.advantage)}
                    {s.advantage >= 0 && (
                      <div style={{ fontSize: 9, color: 'rgba(201,168,76,0.7)', marginTop: 1, fontWeight: 400 }}>owning wins</div>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      )}

      {/* ── Placeholder when no rent entered ──────────────────────── */}
      {monthlyRent === 0 && (
        <div className="px-5 py-8" style={{ textAlign: 'center', borderTop: '1px solid var(--sc-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Enter current monthly rent above to see the comparison
          </p>
        </div>
      )}

      {/* ── Compliance Note ──────────────────────────────────────────── */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          Assumes 3% annual home appreciation — actual appreciation varies by market and is not guaranteed.
          Equity projections use the first scenario&apos;s rate and term. PITI includes P&amp;I, taxes, insurance, HOA, and PMI as entered.
          This comparison is illustrative only and does not constitute financial advice. Approval and eligibility subject to underwriting.
        </p>
      </div>

    </div>
  )
}
