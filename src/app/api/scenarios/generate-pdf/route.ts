import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// PDF generation using server-side rendering
// For V1, we generate a simple HTML-to-PDF approach
// @react-pdf/renderer can be added for richer output in V2

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenarioId } = await req.json()
    if (!scenarioId) return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 })

    // Fetch scenario data
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

    // Generate HTML for PDF
    const html = generatePDFHTML(scenario, userSettings)

    // For V1: Return HTML that can be printed to PDF via browser
    // The client will open this in a new tab and use window.print()
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('[scenarios/generate-pdf] error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

function generatePDFHTML(scenario: Record<string, unknown>, settings: Record<string, string> | null): string {
  const type = scenario.scenario_type as string
  const borrower = scenario.borrower_name as string || ''
  const address = scenario.property_address as string || ''
  const narrative = scenario.narrative as string || ''
  const scenarios = scenario.scenarios_data as Record<string, unknown>[]
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const loName = settings?.lo_name || 'Adam Styer'
  const nmls = settings?.nmls || '513013'
  const company = settings?.company || 'Adam Styer | Mortgage Solutions LP'
  const phone = settings?.phone || ''
  const email = settings?.email || ''

  const scenarioRows = scenarios.map((s: Record<string, unknown>) => {
    return `<td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px;">
      ${s.label || 'Option'}<br/>
      ${(s as Record<string, unknown>).loanType ? String((s as Record<string, unknown>).loanType).toUpperCase() : ''}
    </td>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${type === 'purchase' ? 'Purchase' : 'Refinance'} Analysis — ${borrower}</title>
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
    th { text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #999; border-bottom: 1px solid #e5e5e5; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
    tr:nth-child(even) { background: #fafafa; }
    .narrative { margin-bottom: 24px; line-height: 1.7; font-size: 12px; color: #333; }
    .disclaimer { font-size: 9px; color: #999; border-top: 1px solid #e5e5e5; padding-top: 12px; margin-top: 32px; line-height: 1.5; }
    .mono { font-family: 'IBM Plex Mono', monospace; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${type === 'purchase' ? 'Purchase' : 'Refinance'} Analysis</h1>
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
        ${scenarioRows}
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="${scenarios.length + 1}" style="text-align:center;color:#999;padding:16px;">
        Full comparison data included when calculation results are saved.
      </td></tr>
    </tbody>
  </table>

  ${narrative ? `
  <h3 style="font-size:13px;font-weight:600;margin-bottom:8px;">Analysis</h3>
  <div class="narrative">${narrative.replace(/\n/g, '<br/>')}</div>
  ` : ''}

  <div class="disclaimer">
    This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
    Consult with your loan officer for personalized guidance.
    This analysis was generated with AI assistance and reviewed by ${loName}.
    Equal Housing Lender.
  </div>
</body>
</html>`
}
