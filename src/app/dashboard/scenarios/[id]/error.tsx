'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ScenarioViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ScenarioView] Render error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sc-bg, var(--bg))', color: 'var(--sc-text, #e5e5e5)' }}>
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm" style={{ color: 'var(--sc-muted, #888)' }}>
          {error.message || 'An unexpected error occurred loading this scenario.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--sc-accent, #C9A84C)', color: '#ffffff' }}
          >
            Try Again
          </button>
          <Link
            href="/dashboard/scenarios"
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--sc-card, var(--card))', color: 'var(--sc-text, #e5e5e5)', border: '1px solid var(--sc-border, #333)' }}
          >
            Back to Scenarios
          </Link>
        </div>
      </div>
    </div>
  )
}
