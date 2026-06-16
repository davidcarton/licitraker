import { motion } from 'framer-motion'

export default function AuthLayout({ children, titulo, subtitulo }) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel marca */}
      <div
        className="hidden md:flex flex-col justify-between p-10 flex-none"
        style={{
          width: '44%',
          background: 'var(--brand)',
          color: 'var(--text-inverse)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">L</span>
          <span className="font-semibold text-[15px]">LiciTraker</span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight mb-3" style={{ maxWidth: 360 }}>
            Licitaciones públicas de obra, sin perder tiempo
          </h2>
          <p className="text-sm opacity-70 leading-relaxed" style={{ maxWidth: 320 }}>
            Datos oficiales del Gobierno de España actualizados 3 veces al día. Resúmenes con IA para decidir en segundos.
          </p>
        </div>

        <p className="text-xs opacity-40">
          Datos de PLACSP — Plataforma de Contratación del Sector Público
        </p>
      </div>

      {/* Panel formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10" style={{ background: 'var(--bg-base)' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
          style={{ maxWidth: 380 }}
        >
          <h1 className="text-2xl font-semibold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-sm text-ink-3 mb-7">{subtitulo}</p>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  )
}
