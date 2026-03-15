'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ScenarioData, defaultScenario } from './types'
import { ScenarioInput } from './scenario-input'
import { ResultsTable } from './results-table'
import { AIAnalysis } from './ai-analysis'
import { MISMOUpload } from './mismo-upload'
import { ActionsBar } from './actions-bar'

type TabType = 'manual' | 'mismo'

export default function ScenarioBuilderPage() {
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [scenarios, setScenarios] = useState<ScenarioData[]>([
    defaultScenario('a', 'Scenario A'),
    defaultScenario('b', 'Scenario B'),
  ])

  const addScenario = () => {
    if (scenarios.length >= 4) return
    const labels = ['A', 'B', 'C', 'D']
    const newLabel = labels[scenarios.length]
    setScenarios([...scenarios, defaultScenario(newLabel.toLowerCase(), `Scenario ${newLabel}`)])
  }

  const removeScenario = (id: string) => {
    if (scenarios.length <= 2) return
    setScenarios(scenarios.filter((s) => s.id !== id))
  }

  const updateScenario = (id: string, updates: Partial<ScenarioData>) => {
    setScenarios(scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const handleMISMOUpload = (file: File) => {
    // In a real implementation, this would parse the MISMO file
    // and create a new scenario with the extracted data
    if (scenarios.length < 4) {
      const labels = ['A', 'B', 'C', 'D']
      const newLabel = labels[scenarios.length]
      const newScenario = {
        ...defaultScenario(newLabel.toLowerCase(), `MISMO Import`),
        // Simulated parsed values
        loanAmount: 375000,
        purchasePrice: 450000,
        downPayment: 75000,
        interestRate: 6.25,
      }
      setScenarios([...scenarios, newScenario])
    }
  }

  const handleDownloadPDF = () => {
    // PDF generation would be implemented here
    alert('PDF download functionality would be implemented here')
  }

  const handleCopyLink = async () => {
    // Share link generation would be implemented here
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    } catch {
      alert('Failed to copy link')
    }
  }

  const handleSave = () => {
    // Save functionality would be implemented here
    alert('Scenario saved!')
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">
            Loan Scenario Builder
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Compare loan options side-by-side and get AI-powered insights
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'manual'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('mismo')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'mismo'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            MISMO Upload
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'manual' ? (
          <div className="space-y-6">
            {/* Scenario Inputs */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {scenarios.map((scenario) => (
                <ScenarioInput
                  key={scenario.id}
                  scenario={scenario}
                  canRemove={scenarios.length > 2}
                  onUpdate={(updates) => updateScenario(scenario.id, updates)}
                  onRemove={() => removeScenario(scenario.id)}
                />
              ))}
              
              {scenarios.length < 4 && (
                <button
                  onClick={addScenario}
                  className="flex-shrink-0 w-[280px] min-h-[400px] border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col items-center justify-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--gold)] transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Add Scenario</span>
                </button>
              )}
            </div>

            {/* Results Table */}
            <ResultsTable scenarios={scenarios} />

            {/* AI Analysis */}
            <AIAnalysis scenarios={scenarios} />
          </div>
        ) : (
          <MISMOUpload onUpload={handleMISMOUpload} />
        )}

        {/* Actions Bar */}
        <ActionsBar
          onDownloadPDF={handleDownloadPDF}
          onCopyLink={handleCopyLink}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
