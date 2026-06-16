import { motion } from 'framer-motion'

function LogoMark({ size = 44 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 13,
      background: 'rgba(255,255,255,0.14)',
      border: '1.5px solid rgba(255,255,255,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    </div>
  )
}

export default function AuthLayout({ children, titulo, subtitulo }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Panel marca */}
      <div
        className="hidden md:flex flex-col justify-between p-10 flex-none"
        style={{
          width: '44%',
          background: 'var(--brand)',
          color: 'var(--text-inverse)',
        }}
      >
        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              LiciTraker
            </p>
            <p style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.02em', marginTop: 2 }}>
              Licitaciones públicas
            </p>
          </div>
        </div>

        {/* Copy central */}
        <div>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.22,
              letterSpacing: '-0.03em',
              marginBottom: 16,
              maxWidth: 340,
            }}
          >
            Licitaciones públicas de obra, sin perder tiempo
          </h2>
          <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.7, maxWidth: 300 }}>
            Datos oficiales del Gobierno de España actualizados 3 veces al día.
            Resúmenes con IA para decidir en segundos.
          </p>
        </div>

        <p style={{ fontSize: 11, opacity: 0.35, letterSpacing: '0.01em' }}>
          Datos de PLACSP — Plataforma de Contratación del Sector Público
        </p>
      </div>

      {/* Panel formulario */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-12"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Logo móvil */}
        <div className="flex md:hidden items-center gap-2.5 mb-10">
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            LiciTraker
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
          style={{ maxWidth: 380 }}
        >
          <h1
            className="text-ink"
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}
          >
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-ink-3 text-sm" style={{ marginBottom: 28 }}>
              {subtitulo}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  )
}
