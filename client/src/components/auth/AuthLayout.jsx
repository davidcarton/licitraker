import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import '../../styles/components/auth/AuthLayout.css'

const VENTAJAS = [
  'Licitaciones de obra pública actualizadas 3 veces al día',
  'Resúmenes con IA para decidir en segundos',
  'Seguimiento del estado de cada licitación guardada',
]

export default function AuthLayout({ children, titulo, subtitulo }) {
  return (
    <div className="auth-layout">
      {/* Panel de marca */}
      <div className="auth-panel-marca">
        <div className="auth-panel-marca__logo">
          <svg
            width="34" height="34" viewBox="0 0 28 28" fill="none"
            aria-hidden="true" className="auth-panel-marca__logo-svg"
          >
            <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="var(--g500)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
          </svg>
          <span className="auth-panel-marca__logo-texto">LiciTracker</span>
        </div>

        <div>
          <h2 className="auth-panel-marca__titulo">
            Encuentra y gestiona licitaciones de obra pública sin perder tiempo
          </h2>
          <div className="auth-panel-marca__ventajas">
            {VENTAJAS.map((v) => (
              <div key={v} className="auth-panel-marca__ventaja">
                <CheckCircle size={18} className="auth-panel-marca__ventaja-icon" />
                <span className="auth-panel-marca__ventaja-texto">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="auth-panel-marca__footer">
          Datos oficiales de PLACSP — Plataforma de Contratación del Sector Público
        </span>
      </div>

      {/* Panel de formulario */}
      <div className="auth-panel-form">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="auth-form-card"
        >
          <h1 className="auth-form-titulo">{titulo}</h1>
          {subtitulo && <p className="auth-form-subtitulo">{subtitulo}</p>}
          {children}
        </motion.div>
      </div>
    </div>
  )
}
