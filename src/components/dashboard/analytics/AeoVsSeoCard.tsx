/**
 * AeoVsSeoCard — side-by-side AI search vs. traditional search performance.
 *
 * Adam's hypothesis: AI-assistant referrals (AEO) convert at a different rate
 * than classical SEO referrals, and the two should be tracked separately so he
 * can invest where the signal is strongest.
 */

import { Card } from '@/components/ui/card'
import { fmtK, fmtPct } from '@/lib/formatters'

interface Bucket {
  leads: number
  funded: number
  volume: number
}

interface AeoVsSeoCardProps {
  aeo: Bucket
  seo: Bucket
}

function conversionRate(b: Bucket): number {
  return b.leads > 0 ? (b.funded / b.leads) * 100 : 0
}

function Column({
  label,
  color,
  bucket,
}: {
  label: string
  color: string
  bucket: Bucket
}) {
  const rate = conversionRate(bucket)
  const avg = bucket.funded > 0 ? bucket.volume / bucket.funded : 0
  return (
    <div className="flex-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono">
        <div className="text-muted-foreground">Leads</div>
        <div className="text-right text-foreground">{bucket.leads}</div>

        <div className="text-muted-foreground">Funded</div>
        <div className="text-right text-emerald-400">{bucket.funded}</div>

        <div className="text-muted-foreground">Conv. Rate</div>
        <div className="text-right" style={{ color }}>
          {fmtPct(rate)}
        </div>

        <div className="text-muted-foreground">Volume</div>
        <div className="text-right text-foreground">{fmtK(bucket.volume)}</div>

        <div className="text-muted-foreground">Avg Loan</div>
        <div className="text-right text-muted-foreground">
          {avg > 0 ? fmtK(avg) : '—'}
        </div>
      </div>
    </div>
  )
}

export default function AeoVsSeoCard({ aeo, seo }: AeoVsSeoCardProps) {
  const aeoRate = conversionRate(aeo)
  const seoRate = conversionRate(seo)
  const winner =
    aeoRate === seoRate ? null : aeoRate > seoRate ? 'AEO' : 'SEO'
  const gap = Math.abs(aeoRate - seoRate)

  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          AEO vs. SEO
        </h3>
        {winner && (
          <span className="text-[10px] font-mono text-muted-foreground">
            <span className="text-primary font-semibold">{winner}</span> converts{' '}
            {fmtPct(gap)} better
          </span>
        )}
      </div>
      <div className="flex divide-x divide-input">
        <Column label="AEO (AI search)" color="#8b5cf6" bucket={aeo} />
        <Column label="SEO (classic search)" color="#10b981" bucket={seo} />
      </div>
    </Card>
  )
}
