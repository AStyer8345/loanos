'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData } from '@/lib/scenarios/displayData'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'
import SharePageLayout from '@/components/share/SharePageLayout'
import type { ShareBranding } from '@/app/api/share/[token]/route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

export interface BorrowerQAPair {
  q: string
  a: string
}

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: AnyObj | null
  scenarios_data: AnyObj[]
  narrative: string | null
  borrower_qa: BorrowerQAPair[] | null
  lo_note: string | null
  created_at: string
  branding?: ShareBranding
}

function buildDisplayData(data: SharedScenario): DisplayData {
  const propertyValue = data.property_value || 0
  if (data.scenario_type === 'purchase') {
    const inputs = data.scenarios_data as unknown as PurchaseScenarioInput[]
    const results = inputs.map(input => calculatePurchaseScenario(input, propertyValue))
    return buildPurchaseDisplayData(inputs, results)
  } else {
    const currentLoan = data.current_loan_data as unknown as CurrentLoanInput
    const currentCalc = calculateCurrentLoan(currentLoan)
    const inputs = data.scenarios_data as unknown as RefiScenarioInput[]
    const results = inputs.map(input => calculateRefiScenario(input, currentLoan, currentCalc, propertyValue))
    return buildRefiDisplayData(currentLoan, inputs, results)
  }
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<SharedScenario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const isPrint = searchParams.get('print') === '1'

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(res => {
        if (res.status === 410) throw new Error('This share link has expired.')
        if (res.status === 404) throw new Error('Scenario not found.')
        if (!res.ok) throw new Error('Failed to load scenario.')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.token])

  // Auto-trigger print dialog when ?print=1
  const triggerPrint = useCallback(() => {
    if (isPrint && data && !loading) {
      // Small delay to let charts render
      const timer = setTimeout(() => window.print(), 800)
      return () => clearTimeout(timer)
    }
  }, [isPrint, data, loading])

  useEffect(() => {
    return triggerPrint()
  }, [triggerPrint])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#F0EDE860' }}>
        <div className="text-center">
          <div
            className="w-6 h-6 border-2 rounded-full mx-auto mb-3 animate-spin"
            style={{ borderColor: '#C9A84C40', borderTopColor: '#C9A84C' }}
          />
          <p className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Loading analysis\u2026</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center px-6">
          <p className="text-sm mb-2" style={{ color: '#C94C4C' }}>{error}</p>
          <p className="text-xs" style={{ color: '#888' }}>Contact your loan officer for assistance.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const displayData = buildDisplayData(data)

  return <SharePageLayout data={data} displayData={displayData} branding={data.branding} token={params.token} />
}
