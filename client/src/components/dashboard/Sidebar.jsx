import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileSearch, Settings, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Inicio',       icon: LayoutDashboard, path: '/dashboard' },
  { key: 'licitaciones', label: 'Licitaciones', icon: FileSearch,      path: '/dashboard/licitaciones' },
  { key: 'configuracion',label: 'Configuración',icon: Settings,        path: '/dashboard/configuracion' },
]
const ADMIN_ITEM = { key: 'admin', label: 'Admin', icon: ShieldCheck, path: '/dashboard/admin' }

const GRADIENT = 'linear-gradient(180deg, #3d9465 0%, #1e5538 42%, #0f2d1c 100%)'

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
        transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        position: 'fixed',
        left: 0, top: 0,
        zIndex: 30,
        background: GRADIENT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div style={{
        height: 56,
        padding: collapsed ? '0' : '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={15} color="white" strokeWidth={2} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Building2 size={15} color="white" strokeWidth={2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.025em', color: 'white' }}>
              LiciTraker
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto',
      }}>
        {items.map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <NavItem
              key={item.key}
              icon={Icon}
              label={item.label}
              active={active}
              collapsed={collapsed}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
            />
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.10)',
        padding: '8px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', marginBottom: 4,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 600, color: 'white',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {usuario?.nombre ?? 'Usuario'}
              </p>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.50)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {usuario?.empresa?.nombre ?? ''}
              </p>
            </div>
          </div>
        )}

        <FooterBtn
          icon={<LogOut size={13} />}
          label="Cerrar sesión"
          collapsed={collapsed}
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          danger
        />
        <FooterBtn
          icon={collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          label="Colapsar"
          collapsed={collapsed}
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          rightAlign
        />
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active, collapsed, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 8,
        border: active ? 'none' : 'none',
        cursor: 'pointer',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.62)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        fontFamily: 'inherit',
        boxShadow: active ? 'inset 2.5px 0 0 #86efac' : 'none',
        textAlign: 'left',
        transition: 'background 0.13s, color 0.13s',
      }}
      onMouseEnter={e => {
        if (active) return
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.88)'
      }}
      onMouseLeave={e => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'rgba(255,255,255,0.62)'
      }}
    >
      <Icon size={15} strokeWidth={active ? 2.2 : 1.75} style={{ flexShrink: 0 }} />
      {!collapsed && label}
    </button>
  )
}

function FooterBtn({ icon, label, collapsed, onClick, title, danger, rightAlign }) {
  const baseColor = danger ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.38)'
  const hoverBg = danger ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)'
  const hoverColor = danger ? '#fca5a5' : 'rgba(255,255,255,0.72)'

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 7,
        border: 'none',
        cursor: 'pointer',
        justifyContent: collapsed ? 'center' : (rightAlign ? 'space-between' : 'flex-start'),
        background: 'transparent',
        color: baseColor,
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        transition: 'background 0.13s, color 0.13s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = baseColor
      }}
    >
      {!rightAlign && icon}
      {!collapsed && label}
      {rightAlign && !collapsed && icon}
      {collapsed && rightAlign && icon}
    </button>
  )
}
