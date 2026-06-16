import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileSearch, Settings, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Inicio',          icon: LayoutDashboard, path: '/dashboard' },
  { key: 'licitaciones', label: 'Licitaciones',     icon: FileSearch,      path: '/dashboard/licitaciones' },
  { key: 'configuracion',label: 'Configuración',    icon: Settings,        path: '/dashboard/configuracion' },
]
const ADMIN_ITEM = { key: 'admin', label: 'Admin', icon: ShieldCheck, path: '/dashboard/admin' }

export default function Sidebar({ collapsed, onToggle }) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const items = usuario?.rol === 'superadmin' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  function isActive(item) {
    if (item.path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(item.path)
  }

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        transition: 'width 0.2s var(--ease)',
        minHeight: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 30,
      }}
      className="bg-surface border-r border-border flex flex-col"
    >
      {/* Logo */}
      <div
        className="flex items-center border-b border-border shrink-0"
        style={{ height: 56, padding: collapsed ? '0' : '0 16px', justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        {collapsed ? (
          <span className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white text-xs font-bold">L</span>
        ) : (
          <span className="font-semibold text-ink text-[15px] tracking-tight">LiciTraker</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150',
                active ? 'bg-brand-light text-brand' : 'text-ink-2 hover:text-ink hover:bg-subtle',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{usuario?.nombre ?? 'Usuario'}</p>
              <p className="text-[11px] text-ink-3 truncate">{usuario?.empresa ?? ''}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={[
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-3 hover:text-danger hover:bg-danger-light transition-colors',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOut size={14} />
          {!collapsed && 'Cerrar sesión'}
        </button>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={[
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-3 hover:text-ink-2 hover:bg-subtle transition-colors',
            collapsed ? 'justify-center' : 'justify-between',
          ].join(' ')}
        >
          {!collapsed && <span>Colapsar</span>}
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
