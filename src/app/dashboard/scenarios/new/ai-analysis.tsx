'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Pencil, Loader2 } from 'lucide-react'
import { ScenarioData, calculateResults } from './types'

interface AIAnalysisProps {
  scenarios: ScenarioData[]
}

export function AIAnalysis({ scenarios }: AIAnalysisProps) {
  const [analysisText, setAnalysisText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const generateAnalysis = () => {
    setIsGenerating(true)
    setIsEditing(false)
    setAnalysisText('')
    
    // Generate analysis based on scenarios
    const results = scenarios.map((s) => ({
      label: s.label,
      results: calculateResults(s, scenarios[0]),
    }))

    const bestMonthly = results.reduce((prev, curr) => 
      curr.results.totalMonthly < prev.results.totalMonthly ? curr : prev
    )
    const bestTotal = results.reduce((prev, curr) => 
      curr.results.totalCost < prev.results.totalCost ? curr : prev
    )
    const bestCashToClose = results.reduce((prev, curr) => 
      curr.results.cashToClose < prev.results.cashToClose ? curr : prev
    )

    const analysis = `Based on the ${scenarios.length} loan scenarios provided, here is my analysis:

**Monthly Payment Comparison**
${bestMonthly.label} offers the lowest monthly payment at ${formatCurrency(bestMonthly.results.totalMonthly)}/month. This could be advantageous if monthly cash flow is your primary concern.

**Total Cost Analysis**
Over the life of the loan, ${bestTotal.label} has the lowest total cost at ${formatCurrency(bestTotal.results.totalCost)}. ${bestTotal.label !== bestMonthly.label ? `While this scenario has a higher monthly payment than ${bestMonthly.label}, the total interest savings make it more cost-effective long-term.` : 'This scenario also has the lowest monthly payment, making it attractive from both perspectives.'}

**Cash to Close**
${bestCashToClose.label} requires the least cash upfront at ${formatCurrency(bestCashToClose.results.cashToClose)}.${scenarios.length > 2 ? ` Consider this option if minimizing initial out-of-pocket expenses is a priority.` : ''}

**Recommendation**
${generateRecommendation(results)}

*This analysis is AI-generated and should be verified by a licensed mortgage professional.*`

    // Simulate streaming text
    let index = 0
    const interval = setInterval(() => {
      if (index < analysis.length) {
        setAnalysisText(analysis.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        setIsGenerating(false)
        setHasGenerated(true)
      }
    }, 5)

    return () => clearInterval(interval)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const generateRecommendation = (results: { label: string; results: ReturnType<typeof calculateResults> }[]) => {
    const sorted = [...results].sort((a, b) => a.results.totalMonthly - b.results.totalMonthly)
    const monthlyDiff = sorted[1]?.results.totalMonthly - sorted[0].results.totalMonthly
    
    if (monthlyDiff && monthlyDiff > 200) {
      return `For most borrowers, ${sorted[0].label} provides the best balance of affordability and long-term value with monthly savings of ${formatCurrency(monthlyDiff)} compared to other options.`
    }
    return `The scenarios are relatively comparable in terms of monthly payment. Your decision may depend on other factors such as loan flexibility, lender reputation, or specific closing cost details.`
  }

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--gold)]" />
          <h3 className="text-sm font-medium text-[var(--foreground)]">AI Analysis</h3>
        </div>
        
        {hasGenerated && !isGenerating && (
          <div className="flex items-center gap-2">
            <button
              onClick={generateAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {!hasGenerated && !isGenerating ? (
        <button
          onClick={generateAnalysis}
          className="w-full py-8 border border-dashed border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--gold)] transition-colors flex flex-col items-center gap-2"
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-sm">Generate AI Analysis</span>
        </button>
      ) : isEditing ? (
        <textarea
          value={analysisText}
          onChange={(e) => setAnalysisText(e.target.value)}
          className="w-full h-64 bg-[var(--surface-2)] border border-[var(--border)] rounded p-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none font-sans"
        />
      ) : (
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {analysisText.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={i} className="font-semibold text-[var(--gold)] mt-4 mb-2">
                    {line.replace(/\*\*/g, '')}
                  </p>
                )
              }
              if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                return (
                  <p key={i} className="text-xs text-[var(--muted)] italic mt-4">
                    {line.replace(/\*/g, '')}
                  </p>
                )
              }
              return line ? <p key={i} className="mb-2">{line}</p> : null
            })}
            {isGenerating && (
              <span className="inline-block w-2 h-4 bg-[var(--gold)] animate-pulse ml-0.5" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
