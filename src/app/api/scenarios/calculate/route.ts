import { NextRequest, NextResponse } from 'next/server'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
  calculateReinvestment,
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, propertyValue, purchaseScenarios, currentLoan, refiScenarios, reinvestment } = body

    if (mode === 'purchase') {
      const results = (purchaseScenarios as PurchaseScenarioInput[]).map(s =>
        calculatePurchaseScenario(s, propertyValue)
      )

      // Reinvestment: use savings from best scenario vs Option A
      let reinvestmentResult = null
      if (reinvestment && results.length > 1) {
        const basePmt = results[0].totalMonthlyPayment
        const bestPmt = Math.min(...results.map(r => r.totalMonthlyPayment))
        const savings = basePmt - bestPmt
        if (savings > 0) {
          reinvestmentResult = calculateReinvestment(savings, reinvestment.returnRate, reinvestment.horizonYears)
        }
      }

      return NextResponse.json({ purchaseResults: results, reinvestmentResult })
    }

    if (mode === 'refinance') {
      const current = currentLoan as CurrentLoanInput
      const currentCalc = calculateCurrentLoan(current)

      const results = (refiScenarios as RefiScenarioInput[]).map(s =>
        calculateRefiScenario(s, current, currentCalc, propertyValue)
      )

      // Reinvestment: use max monthly savings
      let reinvestmentResult = null
      if (reinvestment) {
        const maxSavings = Math.max(...results.map(r => r.monthlySavings))
        if (maxSavings > 0) {
          reinvestmentResult = calculateReinvestment(maxSavings, reinvestment.returnRate, reinvestment.horizonYears)
        }
      }

      return NextResponse.json({
        refiResults: results,
        currentLoanCalc: currentCalc,
        reinvestmentResult,
      })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (error) {
    console.error('[scenarios/calculate] error:', error)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
