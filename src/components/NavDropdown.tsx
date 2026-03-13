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
            ? 'bg-white/10 text-white'
            : 'text-emerald-50/80 hover:text-white hover:bg-white/10'}
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
        <div className="absolute left-0 mt-2 w-52 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 z-40">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

