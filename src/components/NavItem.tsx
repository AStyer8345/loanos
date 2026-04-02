'use client'

interface NavItemProps {
  label: string
  icon?: string
  isActive?: boolean
  onClick: () => void
}

export function NavItem({ label, icon, isActive, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
        transition-colors transition-transform
        ${isActive
          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}
      `}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      <span className="leading-none whitespace-nowrap">{label}</span>
    </button>
  )
}

