import { Bell, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { iniciales } from '../../utils/format.js'
import '../../styles/components/dashboard/Header.css'

export default function Header({ title, onToggleSidebar }) {
  const { usuario } = useAuth()
  const nombreEmpresa = usuario?.empresa?.nombre || 'Mi empresa'

  return (
    <header className="dash-header">
      <button
        className="dash-header-hamburger"
        aria-label="Abrir menú"
        onClick={onToggleSidebar}
      >
        <Menu size={18} color="#fff" />
      </button>

      <h1 className="dash-header__titulo">{title}</h1>

      <div className="dash-header__spacer" />

      <div className="dash-header__actions">
        <button aria-label="Notificaciones" className="dash-header__notif-btn">
          <Bell size={17} color="#fff" />
        </button>

        <div className="dash-header__user">
          <div className="dash-header__avatar">{iniciales(nombreEmpresa)}</div>
          <span className="dash-header-empresa">{nombreEmpresa}</span>
        </div>
      </div>
    </header>
  )
}
