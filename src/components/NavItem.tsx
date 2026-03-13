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
          ? 'bg-emerald-500/20 text-white'
          : 'text-emerald-50/80 hover:text-white hover:bg-white/10'}
      `}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      <span className="leading-none whitespace-nowrap">{label}</span>
    </button>
  )
}

