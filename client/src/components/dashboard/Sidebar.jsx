import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut, ScrollText, Users, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { iniciales } from '../../utils/format.js'
import '../../styles/components/dashboard/Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/dashboard/licitaciones', label: 'Licitaciones', icon: FileText, end: false },
  { to: '/dashboard/resumenes', label: 'Resúmenes IA', icon: Sparkles, end: false },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings, end: false },
]

const ITEM_CLIENTES_SUPERADMIN = { to: '/dashboard/admin/clientes', label: 'Gestión de clientes', icon: Users, end: false }

const NAV_ITEMS_ADMIN = [
  { to: '/dashboard/admin/logs', label: 'Logs y errores', icon: ScrollText, end: false },
]

export default function Sidebar({ abierto }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const nombreEmpresa = usuario?.empresa?.nombre || 'Mi empresa'
  const navItems = usuario?.rol === 'superadmin'
    ? [
        ...NAV_ITEMS.map(item => item.label === 'Configuración' ? ITEM_CLIENTES_SUPERADMIN : item),
        ...NAV_ITEMS_ADMIN,
      ]
    : NAV_ITEMS

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`dash-sidebar${abierto ? ' dash-sidebar--open' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <svg
          width="26" height="26" viewBox="0 0 28 28" fill="none"
          aria-hidden="true" className="sidebar__logo-svg"
        >
          <polygon
            points="14,2 25,8 25,20 14,26 3,20 3,8"
            fill="none" stroke="var(--g500)" strokeWidth="1.5" strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
        </svg>
        <span className="sidebar__logo-texto dash-sidebar-label">LiciTracker</span>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `sidebar__nav-link${isActive ? ' sidebar__nav-link--activo' : ''}`
            }
          >
            <Icon size={18} />
            <span className="sidebar__nav-label dash-sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Avatar empresa */}
      <div className="sidebar__footer" title={nombreEmpresa}>
        <div className="sidebar__avatar">{iniciales(nombreEmpresa)}</div>
        <span className="sidebar__nombre dash-sidebar-label">{nombreEmpresa}</span>
        <button
          className="sidebar__btn-logout dash-sidebar-label"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
