'use client'

import { useState, useMemo } from 'react'
import LenderFilters from '@/components/lenders/LenderFilters'
import LenderCard, { type Lender } from '@/components/lenders/LenderCard'

export default function LendersClient({ lenders }: { lenders: Lender[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')

  const allChannels = useMemo(() => {
    const set = new Set<string>()
    lenders.forEach((l) => { if (l.channel) set.add(l.channel) })
    return Array.from(set).sort()
  }, [lenders])

  const allProducts = useMemo(() => {
    const freq = new Map<string, number>()
    lenders.forEach((l) => {
      l.specialty_products.forEach((p) => {
        freq.set(p, (freq.get(p) || 0) + 1)
      })
    })
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p)
  }, [lenders])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return lenders.filter((l) => {
      // Channel filter
      if (channelFilter && l.channel !== channelFilter) return false
      // Product filter
      if (productFilter && !l.specialty_products.includes(productFilter)) return false
      // Text search
      if (q) {
        const haystack = [
          l.name,
          ...l.contacts.map((c) => [c.name, c.email, c.role].join(' ')),
          ...l.specialty_products,
          l.notes || '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [lenders, searchQuery, channelFilter, productFilter])

  return (
    <div className="space-y-6">
      <LenderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        productFilter={productFilter}
        onProductChange={setProductFilter}
        allChannels={allChannels}
        allProducts={allProducts}
      />

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {lenders.length} lenders
      </p>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-input p-12">
          <p className="text-sm text-muted-foreground">
            No lenders match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lender) => (
            <LenderCard key={lender.id} lender={lender} />
          ))}
        </div>
      )}
    </div>
  )
}
