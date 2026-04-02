'use client'

import { useEffect } from 'react'

export default function ScenarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ScenarioBuilder] Render error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sc-bg, var(--bg))', color: 'var(--sc-text, #e5e5e5)' }}>
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm" style={{ color: 'var(--sc-muted, #888)' }}>
          {error.message || 'An unexpected error occurred in the Scenario Builder.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--sc-accent, #C9A84C)', color: '#ffffff' }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
