'use client'

interface NavDropdownItem {
  label: string
  onClick: () => void
}

interface NavDropdownProps {
  label: string
  icon?: string
  isOpen: boolean
  onToggle: () => void
  items: NavDropdownItem[]
}

export function NavDropdown({
  label,
  icon,
  isOpen,
  onToggle,
  items,
}: NavDropdownProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-colors
          ${isOpen
            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}
        `}
      >
        {icon && <span className="text-base leading-none">{icon}</span>}
        <span className="leading-none whitespace-nowrap">{label}</span>
        <span
          className={`text-[10px] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-52 rounded-md bg-card border border-input py-1 z-40">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="block w-full px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted hover:text-amber-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

