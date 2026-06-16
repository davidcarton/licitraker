import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header({ title, sidebarWidth = 220 }) {
  const { usuario } = useAuth()
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header
      className="fixed top-0 right-0 bg-surface border-b border-border flex items-center px-6 gap-4 z-20"
      style={{
        left: sidebarWidth,
        height: 56,
        transition: 'left 0.2s var(--ease)',
      }}
    >
      <h1 className="font-semibold text-ink text-[15px] shrink-0">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button className="p-1.5 rounded-md text-ink-3 hover:text-ink-2 hover:bg-subtle transition-colors">
          <Bell size={17} />
        </button>
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold">
          {initials}
        </div>
      </div>
    </header>
  )
}
