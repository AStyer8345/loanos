import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type {
  PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput,
  ClosingCostBreakdown, PurchaseCalculatedResult, RefiCalculatedResult,
} from '@/lib/scenarios/types'

interface ScenarioResultData {
  label: string
  loanType: string
  heroLabel: string
  heroValue: string
  rows: [string, string][]
  closingCosts: ClosingCostBreakdown | null
  loanAmount: number
  interestRate: number
  pointsPercent: number
  creditsPercent: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenarioId } = await req.json()
    if (!scenarioId) return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { data: scenario, error } = await serviceClient
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .single()

    if (error || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    const { data: settings } = await serviceClient
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    const userSettings = settings?.settings as Record<string, string> | null
    const mode = scenario.scenario_type as string
    const propertyValue = scenario.property_value as number || 0
    const scenarioInputs = scenario.scenarios_data as Record<string, unknown>[]

    let scenarioResults: ScenarioResultData[] = []

    if (mode === 'purchase') {
      scenarioResults = scenarioInputs.map(s => {
        const input = s as unknown as PurchaseScenarioInput
        const calc: PurchaseCalculatedResult = calculatePurchaseScenario(input, propertyValue)
        return {
          label: input.label || 'Option',
          loanType: input.loanType.toUpperCase(),
          heroLabel: 'Total Monthly Payment',
          heroValue: fmtCurrency(calc.totalMonthlyPayment),
          loanAmount: input.loanAmount,
          interestRate: input.interestRate,
          pointsPercent: input.pointsPercent,
          creditsPercent: input.creditsPercent,
          closingCosts: input.closingCostBreakdown || null,
          rows: [
            ['Loan Amount', fmtCurrency(input.loanAmount)],
            ['Interest Rate', `${input.interestRate.toFixed(3)}%`],
            ['Loan Term', `${input.loanTerm} years`],
            ['Down Payment', `${fmtCurrency(input.downPaymentAmount)} (${input.downPaymentPercent.toFixed(1)}%)`],
            ['Monthly P&I', fmtCurrency(calc.monthlyPI)],
            ['APR', `${calc.apr.toFixed(3)}%`],
            ['Cash to Close', fmtCurrency(calc.cashToClose)],
            ['LTV', `${calc.ltv.toFixed(1)}%`],
            ['Total Interest (life)', fmtCurrency(calc.totalInterest)],
            ['5-Year Total Cost', fmtCurrency(calc.totalCost5Year)],
            ['10-Year Total Cost', fmtCurrency(calc.totalCost10Year)],
            ['Lifetime Total Cost', fmtCurrency(calc.totalCostLifetime)],
            ['Equity Year 1', fmtCurrency(calc.equityYear1)],
            ['Equity Year 5', fmtCurrency(calc.equityYear5)],
            ['Equity Year 10', fmtCurrency(calc.equityYear10)],
          ],
        }
      })
    } else if (mode === 'refinance') {
      const currentLoan = scenario.current_loan_data as unknown as CurrentLoanInput
      const currentCalc = calculateCurrentLoan(currentLoan)

      scenarioResults = scenarioInputs.map(s => {
        const input = s as unknown as RefiScenarioInput
        const calc: RefiCalculatedResult = calculateRefiScenario(input, currentLoan, currentCalc, propertyValue)
        return {
          label: input.label || 'Option',
          loanType: input.loanType.toUpperCase(),
          heroLabel: 'Monthly Savings',
          heroValue: fmtCurrency(calc.monthlySavings),
          loanAmount: input.newLoanAmount,
          interestRate: input.interestRate,
          pointsPercent: input.pointsPercent,
          creditsPercent: input.creditsPercent,
          closingCosts: input.closingCostBreakdown || null,
          rows: [
            ['New Loan Amount', fmtCurrency(input.newLoanAmount)],
            ['Interest Rate', `${input.interestRate.toFixed(3)}%`],
            ['Loan Term', `${input.loanTerm} years`],
            ['Current Payment', fmtCurrency(calc.currentMonthlyPayment)],
            ['New Monthly P&I', fmtCurrency(calc.newMonthlyPI)],
            ['New Total Payment', fmtCurrency(calc.newTotalMonthlyPayment)],
            ['Annual Savings', fmtCurrency(calc.annualSavings)],
            ['Break-Even', `${calc.breakEvenMonth} months`],
            ['APR', `${calc.apr.toFixed(3)}%`],
            ['3-Year Savings', fmtCurrency(calc.totalSavings3Year)],
            ['5-Year Savings', fmtCurrency(calc.totalSavings5Year)],
            ['10-Year Savings', fmtCurrency(calc.totalSavings10Year)],
            ['Lifetime Interest Savings', fmtCurrency(calc.lifetimeInterestSavings)],
            ['New LTV', `${calc.newLtv.toFixed(1)}%`],
          ],
        }
      })
    }

    const html = generatePDFHTML(scenario, userSettings, scenarioResults, mode)

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('[scenarios/generate-pdf] error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

function fmtCurrency(v: number): string {
  return '$' + Math.round(v).toLocaleString('en-US')
}

function renderNarrativeHTML(narrative: string): string {
  // Convert markdown-style bullets and bold headers to HTML
  const lines = narrative.split('\n')
  let html = ''
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false }
      continue
    }

    // Bold headers like **Bottom Line**
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false }
      const text = trimmed.replace(/\*\*/g, '')
      html += `<h4 class="analysis-header">${text}</h4>`
      continue
    }

    // Bullet points (• or - or *)
    if (/^[•\-\*]\s/.test(trimmed)) {
      if (!inList) { html += '<ul class="analysis-list">'; inList = true }
      let text = trimmed.replace(/^[•\-\*]\s+/, '')
      // Bold within bullets
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      html += `<li>${text}</li>`
      continue
    }

    // Plain text
    if (inList) { html += '</ul>'; inList = false }
    const text = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html += `<p class="analysis-text">${text}</p>`
  }

  if (inList) html += '</ul>'
  return html
}

function renderClosingCostsHTML(cc: ClosingCostBreakdown, loanAmount: number, interestRate: number, pointsPct: number, creditsPct: number): string {
  const lenderFees = [
    ['Origination Fee', cc.originationFee],
    ['Underwriting Fee', cc.underwritingFee],
    ['Processing Fee', cc.processingFee],
    ...(cc.applicationFee > 0 ? [['Application Fee', cc.applicationFee]] : []),
    ...(cc.adminFee > 0 ? [['Admin Fee', cc.adminFee]] : []),
  ] as [string, number][]

  const thirdParty = [
    ['Appraisal', cc.appraisal],
    ['Credit Report', cc.creditReport],
    ['Doc Preparation', cc.docPrepFee],
    ['Flood Certification', cc.floodCert],
    ['TX Attorney Fee', cc.attorneyFee],
    ['Settlement Fee', cc.settlementFee],
    ['Title Search', cc.titleSearch],
    ['Title Endorsements', cc.titleEndorsements],
    ['Recording Fee', cc.recordingFee],
    ["Lender's Title Policy", cc.lendersTitlePolicy],
  ] as [string, number][]

  const dailyRate = loanAmount > 0 && interestRate > 0 ? (loanAmount * (interestRate / 100)) / 365 : 0
  const prepaidInterest = Math.round(dailyRate * cc.prepaidInterestDays)

  const prepaids = [
    [`Prepaid Interest (${cc.prepaidInterestDays} days)`, prepaidInterest],
    ...(cc.annualHazardInsurance > 0 ? [['Hazard Insurance (annual)', cc.annualHazardInsurance]] : []),
  ] as [string, number][]

  const pointsDollar = Math.round(loanAmount * (pointsPct / 100))
  const creditsDollar = Math.round(loanAmount * (creditsPct / 100))

  const lenderTotal = lenderFees.reduce((s, [, v]) => s + v, 0)
  const thirdPartyTotal = thirdParty.reduce((s, [, v]) => s + v, 0)
  const prepaidTotal = prepaids.reduce((s, [, v]) => s + v, 0)

  const renderSection = (title: string, items: [string, number][], total: number) => {
    const rows = items.filter(([, v]) => v > 0).map(([label, val]) =>
      `<tr><td class="cc-label">${label}</td><td class="cc-val">${fmtCurrency(val)}</td></tr>`
    ).join('')
    return `
      <tr class="cc-section-header"><td colspan="2">${title}<span class="cc-section-total">${fmtCurrency(total)}</span></td></tr>
      ${rows}
    `
  }

  const grandTotal = lenderTotal + thirdPartyTotal + prepaidTotal + pointsDollar
  const netTotal = grandTotal - creditsDollar

  return `
    <table class="cc-table">
      <tbody>
        ${renderSection('Lender Fees', lenderFees, lenderTotal)}
        ${renderSection('Third Party Fees', thirdParty, thirdPartyTotal)}
        ${renderSection('Prepaids', prepaids, prepaidTotal)}
        ${pointsDollar > 0 ? `<tr><td class="cc-label">Discount Points (${pointsPct}%)</td><td class="cc-val">${fmtCurrency(pointsDollar)}</td></tr>` : ''}
        ${creditsDollar > 0 ? `<tr><td class="cc-label">Lender Credits (${creditsPct}%)</td><td class="cc-val credit">-${fmtCurrency(creditsDollar)}</td></tr>` : ''}
        <tr class="cc-total"><td>Total Closing Costs</td><td class="cc-val">${fmtCurrency(netTotal)}</td></tr>
      </tbody>
    </table>
  `
}

function generatePDFHTML(
  scenario: Record<string, unknown>,
  settings: Record<string, string> | null,
  results: ScenarioResultData[],
  mode: string
): string {
  const borrower = scenario.borrower_name as string || ''
  const address = scenario.property_address as string || ''
  const narrative = scenario.narrative as string || ''
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const loName = settings?.lo_name || 'Adam Styer'
  const nmls = settings?.nmls || '513013'
  const company = settings?.company || 'Adam Styer | Mortgage Solutions LP'
  const phone = settings?.phone || ''
  const email = settings?.email || ''

  // Build scenario cards
  const scenarioCardsHTML = results.map(r => {
    const metricsRows = r.rows.map(([label, val], i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}"><td class="metric-label">${label}</td><td class="metric-val">${val}</td></tr>`
    ).join('')

    const ccHTML = r.closingCosts ? renderClosingCostsHTML(r.closingCosts, r.loanAmount, r.interestRate, r.pointsPercent, r.creditsPercent) : ''

    return `
      <div class="scenario-card">
        <div class="card-header">
          <span class="card-title">${r.label}</span>
          <span class="card-badge">${r.loanType}</span>
        </div>
        <div class="card-hero">
          <div class="hero-label">${r.heroLabel}</div>
          <div class="hero-value">${r.heroValue}</div>
        </div>
        <table class="metrics-table">
          <tbody>${metricsRows}</tbody>
        </table>
        ${ccHTML ? `<div class="cc-section"><div class="section-title">Closing Costs Breakdown</div>${ccHTML}</div>` : ''}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis — ${borrower}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0A1628;
      --gold: #C9A84C;
      --gold-lt: #F0D98A;
      --light-bg: #F2F0EB;
      --mid-gray: #8A8A8A;
      --green: #2A7A4B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 0; }

    /* Fixed Header Bar */
    .top-bar { background: var(--navy); padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; }
    .top-bar .company-name { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 0.01em; }
    .top-bar .date { color: var(--gold-lt); font-size: 10px; font-weight: 500; }
    .gold-line { height: 3px; background: var(--gold); }
    .sub-bar { background: var(--navy); padding: 6px 40px; display: flex; justify-content: center; gap: 16px; }
    .sub-bar span { color: var(--gold-lt); font-size: 9px; font-weight: 500; letter-spacing: 0.03em; }

    .page { max-width: 900px; margin: 0 auto; padding: 32px 40px 24px; }

    /* Title Section */
    .title-section { margin-bottom: 24px; }
    .title-section h1 { font-size: 24px; font-weight: 700; color: var(--navy); letter-spacing: -0.02em; }
    .title-section .prepared { font-size: 11px; color: var(--mid-gray); margin-top: 4px; }
    .gold-divider { height: 2px; background: var(--gold); margin: 16px 0 20px; }

    /* Meta Row */
    .meta-row { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: var(--light-bg); border-radius: 6px; border-left: 3px solid var(--gold); }
    .meta-item { font-size: 11px; color: #666; }
    .meta-item strong { color: #1a1a1a; font-weight: 600; }

    /* Scenario Cards */
    .scenarios-grid { display: grid; grid-template-columns: repeat(${Math.min(results.length, 3)}, 1fr); gap: 16px; margin-bottom: 28px; }
    .scenario-card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #3a3a3a; }
    .card-header .card-title { font-size: 13px; font-weight: 700; color: #fff; }
    .card-header .card-badge { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold); border: 1px solid var(--gold); padding: 2px 8px; border-radius: 4px; }
    .card-hero { padding: 16px; border-bottom: 2px solid var(--gold); text-align: center; background: var(--light-bg); }
    .hero-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mid-gray); font-weight: 600; margin-bottom: 4px; }
    .hero-value { font-size: 28px; font-weight: 700; color: var(--navy); font-family: 'IBM Plex Mono', monospace; letter-spacing: -0.02em; }

    /* Metrics Table */
    .metrics-table { width: 100%; border-collapse: collapse; }
    .metrics-table td { padding: 6px 16px; font-size: 10.5px; border-bottom: 1px solid #f0f0f0; }
    .metric-label { color: #666; font-weight: 500; }
    .metric-val { text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: #1a1a1a; }

    /* Closing Costs */
    .cc-section { padding: 12px 16px 16px; border-top: 1px solid #e5e5e5; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold); margin-bottom: 8px; }
    .cc-table { width: 100%; border-collapse: collapse; }
    .cc-table td { padding: 3px 0; font-size: 10px; }
    .cc-label { color: #888; }
    .cc-val { text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: #1a1a1a; }
    .cc-val.credit { color: var(--green); }
    .cc-section-header td { padding: 8px 0 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #999; border-bottom: 1px solid #e5e5e5; }
    .cc-section-total { float: right; font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: #1a1a1a; text-transform: none; letter-spacing: 0; }
    .cc-total td { padding: 8px 0 0; font-size: 11px; font-weight: 700; border-top: 2px solid var(--gold); }
    .cc-total .cc-val { font-size: 12px; font-weight: 700; color: var(--gold); }

    /* Analysis */
    .analysis-section { margin-bottom: 24px; padding: 20px; background: var(--light-bg); border-radius: 8px; border: 1px solid #ddd; }
    .analysis-section h3 { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--gold); }
    .analysis-header { font-size: 11px; font-weight: 700; color: var(--navy); margin: 14px 0 4px; }
    .analysis-header:first-child { margin-top: 0; }
    .analysis-list { list-style: none; padding: 0; margin: 0 0 8px; }
    .analysis-list li { font-size: 11px; color: #444; line-height: 1.7; padding: 3px 0 3px 18px; position: relative; }
    .analysis-list li::before { content: '•'; position: absolute; left: 0; color: var(--gold); font-weight: 700; font-size: 14px; line-height: 1.4; }
    .analysis-list li strong { color: var(--navy); }
    .analysis-text { font-size: 11px; color: #444; line-height: 1.6; margin: 4px 0; }

    /* Footer Bar */
    .footer-bar { background: var(--navy); padding: 16px 40px; margin-top: 24px; }
    .footer-bar .cta { text-align: center; padding: 10px; border: 1px solid var(--gold); border-radius: 6px; margin-bottom: 12px; }
    .footer-bar .cta-text { color: #fff; font-size: 12px; font-weight: 600; }
    .footer-bar .cta-contact { color: var(--gold-lt); font-size: 10px; margin-top: 4px; }
    .footer-bar .disclaimer-text { text-align: center; font-size: 8px; color: var(--mid-gray); line-height: 1.6; }

    @media print {
      body { padding: 0; }
      @page { margin: 0; size: letter; }
      .top-bar, .gold-line, .sub-bar, .footer-bar { position: relative; }
      .scenario-card { break-inside: avoid; }
      .analysis-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Branded Header -->
  <div class="top-bar">
    <span class="company-name">${company}</span>
    <span class="date">${date}</span>
  </div>
  <div class="gold-line"></div>
  <div class="sub-bar">
    <span>NMLS #${nmls}</span>
    ${phone ? `<span>${phone}</span>` : ''}
    ${email ? `<span>${email}</span>` : ''}
    <span>styermortgage.com</span>
  </div>

  <div class="page">
    <div class="title-section">
      <h1>${borrower ? `${borrower} — ` : ''}${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis</h1>
      <div class="prepared">Prepared by ${loName} on ${date}</div>
    </div>
    <div class="gold-divider"></div>

    <div class="meta-row">
      ${borrower ? `<div class="meta-item">Borrower: <strong>${borrower}</strong></div>` : ''}
      ${address ? `<div class="meta-item">Property: <strong>${address}</strong></div>` : ''}
      <div class="meta-item">Type: <strong>${mode === 'purchase' ? 'Purchase' : 'Refinance'}</strong></div>
    </div>

    <div class="scenarios-grid">
      ${scenarioCardsHTML}
    </div>

    ${narrative ? `
    <div class="analysis-section">
      <h3>Here's how I'd think about it:</h3>
      ${renderNarrativeHTML(narrative)}
    </div>
    ` : ''}
  </div>

  <!-- Branded Footer -->
  <div class="footer-bar">
    <div class="cta">
      <div class="cta-text">Questions? Let's talk.</div>
      <div class="cta-contact">${loName} · ${phone || '(512) 956-6010'} · ${email || 'adam@styermortgage.com'} · styermortgage.com</div>
    </div>
    <div class="disclaimer-text">
      This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
      Consult with your loan officer for personalized guidance. This analysis was generated with AI assistance and reviewed by ${loName}.
      Equal Housing Lender | ${company} | NMLS #${nmls}
    </div>
  </div>
</body>
</html>`
}
