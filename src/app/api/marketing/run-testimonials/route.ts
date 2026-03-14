import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE           = 'https://styer.app.n8n.cloud/api/v1'
const SOCIAL_WORKFLOW_ID = 'eJG4wckrj6SmSpm1'

/**
 * Triggers the LoanOS — Weekly Social Post n8n workflow.
 * Requires N8N_API_KEY env variable (or apiKey in request body).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { apiKey?: string }
  const apiKey = body.apiKey || process.env.N8N_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'N8N_API_KEY not configured. Add it to Vercel env vars.' },
      { status: 400 },
    )
  }

  try {
    // First activate the workflow (it may be inactive)
    await fetch(`${N8N_BASE}/workflows/${SOCIAL_WORKFLOW_ID}/activate`, {
      method: 'PATCH',
      headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    })

    // Execute the workflow
    const execRes = await fetch(`${N8N_BASE}/workflows/${SOCIAL_WORKFLOW_ID}/run`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ runData: {}, startNodes: [], destinationNode: '' }),
    })

    if (!execRes.ok) {
      const err = await execRes.json().catch(() => ({})) as { message?: string }
      return NextResponse.json(
        { error: err.message ?? `n8n returned HTTP ${execRes.status}` },
        { status: 400 },
      )
    }

    const data = await execRes.json() as { id?: string }
    return NextResponse.json({ ok: true, executionId: data.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
