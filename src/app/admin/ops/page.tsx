import { readFileSync } from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'LoanOS Ops — System Map + Email Sequences',
}

// Read the static HTML at module load. next.config.mjs adds this file to
// outputFileTracingIncludes for the /admin/ops route so Vercel bundles it
// into the serverless function output.
const opsHtml = readFileSync(
  path.join(process.cwd(), 'src/app/admin/ops/ops-content.html'),
  'utf8'
)

export default function OpsPage() {
  // Break out of the layout's px-6 py-8 padding so the iframe is full-bleed.
  // Iframe height = viewport minus the 56px (h-14) fixed admin nav.
  return (
    <div className="-mx-6 -my-8">
      <iframe
        srcDoc={opsHtml}
        title="LoanOS Ops"
        className="block w-full border-0"
        style={{ height: 'calc(100vh - 56px)' }}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  )
}
