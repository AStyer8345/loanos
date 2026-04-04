'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LenderFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  channelFilter: string
  onChannelChange: (channel: string) => void
  productFilter: string
  onProductChange: (product: string) => void
  allChannels: string[]
  allProducts: string[]
}

export default function LenderFilters({
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelChange,
  productFilter,
  onProductChange,
  allChannels,
  allProducts,
}: LenderFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search lenders, contacts, products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange('')}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Channel filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChannelChange('')}
          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
            channelFilter === ''
              ? 'border-primary/50 bg-primary/15 text-primary'
              : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          All
        </button>
        {allChannels.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => onChannelChange(channelFilter === ch ? '' : ch)}
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              channelFilter === ch
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Product filter pills */}
      {allProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allProducts.map((prod) => (
            <Badge
              key={prod}
              variant={productFilter === prod ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onProductChange(productFilter === prod ? '' : prod)}
            >
              {prod}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
