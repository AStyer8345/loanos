import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'

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

    // Fetch user settings for branding
    const { data: settings } = await serviceClient
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    const userSettings = settings?.settings as Record<string, string> | null

    // Recalculate results server-side for accurate PDF data
    const mode = scenario.scenario_type as string
    const propertyValue = scenario.property_value as number || 0
    const scenarioInputs = scenario.scenarios_data as Record<string, unknown>[]

    let purchaseResults: { label: string; rows: [string, string][] }[] = []
    let refiResults: { label: string; rows: [string, string][] }[] = []

    if (mode === 'purchase') {
      purchaseResults = scenarioInputs.map(s => {
        const input = s as unknown as PurchaseScenarioInput
        const calc = calculatePurchaseScenario(input, propertyValue)
        return {
          label: input.label || 'Option',
          rows: [
            ['Loan Amount', fmtCurrency(input.loanAmount)],
            ['Interest Rate', `${input.interestRate.toFixed(3)}%`],
            ['Loan Term', `${input.loanTerm} years`],
            ['Loan Type', input.loanType.toUpperCase()],
            ['Down Payment', `${fmtCurrency(input.downPaymentAmount)} (${input.downPaymentPercent.toFixed(1)}%)`],
            ['Monthly P&I', fmtCurrency(calc.monthlyPI)],
            ['Total Monthly Payment', fmtCurrency(calc.totalMonthlyPayment)],
            ['APR', `${calc.apr.toFixed(3)}%`],
            ['Cash to Close', fmtCurrency(calc.cashToClose)],
            ['LTV', `${calc.ltv.toFixed(1)}%`],
            ['Total Interest (life)', fmtCurrency(calc.totalInterest)],
            ['Total Cost (5 year)', fmtCurrency(calc.totalCost5Year)],
            ['Total Cost (10 year)', fmtCurrency(calc.totalCost10Year)],
            ['Total Cost (lifetime)', fmtCurrency(calc.totalCostLifetime)],
            ['Equity Year 1', fmtCurrency(calc.equityYear1)],
            ['Equity Year 5', fmtCurrency(calc.equityYear5)],
            ['Equity Year 10', fmtCurrency(calc.equityYear10)],
          ],
        }
      })
    } else if (mode === 'refinance') {
      const currentLoan = scenario.current_loan_data as unknown as CurrentLoanInput
      const currentCalc = calculateCurrentLoan(currentLoan)

      refiResults = scenarioInputs.map(s => {
        const input = s as unknown as RefiScenarioInput
        const calc = calculateRefiScenario(input, currentLoan, currentCalc, propertyValue)
        return {
          label: input.label || 'Option',
          rows: [
            ['New Loan Amount', fmtCurrency(input.newLoanAmount)],
            ['Interest Rate', `${input.interestRate.toFixed(3)}%`],
            ['Loan Term', `${input.loanTerm} years`],
            ['New Monthly P&I', fmtCurrency(calc.newMonthlyPI)],
            ['New Total Payment', fmtCurrency(calc.newTotalMonthlyPayment)],
            ['Monthly Savings', fmtCurrency(calc.monthlySavings)],
            ['Annual Savings', fmtCurrency(calc.annualSavings)],
            ['Break-Even', `${calc.breakEvenMonth} months`],
            ['APR', `${calc.apr.toFixed(3)}%`],
            ['Savings (3 year)', fmtCurrency(calc.totalSavings3Year)],
            ['Savings (5 year)', fmtCurrency(calc.totalSavings5Year)],
            ['Savings (10 year)', fmtCurrency(calc.totalSavings10Year)],
            ['Lifetime Interest Savings', fmtCurrency(calc.lifetimeInterestSavings)],
            ['New LTV', `${calc.newLtv.toFixed(1)}%`],
          ],
        }
      })
    }

    const results = mode === 'purchase' ? purchaseResults : refiResults
    const html = generatePDFHTML(scenario, userSettings, results, mode)

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

function generatePDFHTML(
  scenario: Record<string, unknown>,
  settings: Record<string, string> | null,
  results: { label: string; rows: [string, string][] }[],
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

  // Build comparison table HTML
  const colHeaders = results.map(r => `<th style="text-align:right;padding:8px 12px;font-size:11px;font-weight:600;color:#C9A84C;">${r.label}</th>`).join('')

  // Get max rows
  const maxRows = Math.max(...results.map(r => r.rows.length))
  let tableRows = ''
  for (let i = 0; i < maxRows; i++) {
    const label = results[0]?.rows[i]?.[0] || ''
    const cells = results.map(r => {
      const val = r.rows[i]?.[1] || '—'
      return `<td style="text-align:right;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;">${val}</td>`
    }).join('')
    const bgColor = i % 2 === 0 ? '#fff' : '#fafafa'
    tableRows += `<tr style="background:${bgColor}"><td style="padding:8px 12px;font-size:11px;font-weight:500;color:#666;">${label}</td>${cells}</tr>\n`
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis — ${borrower}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #C9A84C; padding-bottom: 16px; }
    .header h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .header .branding { text-align: right; font-size: 11px; color: #666; }
    .header .branding strong { color: #1a1a1a; display: block; font-size: 13px; }
    .meta { display: flex; gap: 32px; margin-bottom: 24px; font-size: 11px; color: #666; }
    .meta span strong { color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #999; border-bottom: 2px solid #C9A84C; }
    td { border-bottom: 1px solid #f0f0f0; }
    .narrative { margin-bottom: 24px; line-height: 1.7; font-size: 12px; color: #333; }
    .narrative h3 { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; }
    .disclaimer { font-size: 9px; color: #999; border-top: 1px solid #e5e5e5; padding-top: 12px; margin-top: 32px; line-height: 1.5; }
    @media print {
      body { padding: 20px; }
      @page { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis</h1>
    </div>
    <div class="branding">
      <strong>${company}</strong>
      ${loName} | NMLS #${nmls}<br/>
      ${phone}${email ? ` | ${email}` : ''}
    </div>
  </div>

  <div class="meta">
    ${borrower ? `<span>Borrower: <strong>${borrower}</strong></span>` : ''}
    ${address ? `<span>Property: <strong>${address}</strong></span>` : ''}
    <span>Date: <strong>${date}</strong></span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Metric</th>
        ${colHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  ${narrative ? `
  <div class="narrative">
    <h3>Analysis</h3>
    <p>${narrative.replace(/\n/g, '<br/>')}</p>
  </div>
  ` : ''}

  <div class="disclaimer">
    This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
    Consult with your loan officer for personalized guidance.
    This analysis was generated with AI assistance and reviewed by ${loName}.
    Equal Housing Lender. | ${company} | NMLS #${nmls}
  </div>
</body>
</html>`
}
