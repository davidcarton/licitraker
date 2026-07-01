import '../../styles/components/layout/Header.css'

export default function Header() {
  return (
    <header className="layout-header">
      {/* Logo */}
      <div className="layout-header__logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <polygon
            points="14,2 25,8 25,20 14,26 3,20 3,8"
            fill="none" stroke="var(--g500)" strokeWidth="1.5" strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
        </svg>
        <div className="layout-header__logo-textos">
          <span className="layout-header__nombre">Licitraker</span>
          <span className="layout-header__sub">por Benco</span>
        </div>
      </div>

      {/* Subtítulo centrado — solo >900px */}
      <span className="header-subtitle">
        Licitaciones de obra pública · Datos oficiales del Gobierno de España
      </span>

      {/* Badge En directo */}
      <div className="layout-header__badge">
        <span className="layout-header__badge-dot" />
        <span className="layout-header__badge-texto">En directo</span>
      </div>
    </header>
  )
}
