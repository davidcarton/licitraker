import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const VENTAJAS = [
  'Licitaciones de obra pública actualizadas 3 veces al día',
  'Resúmenes con IA para decidir en segundos',
  'Seguimiento del estado de cada licitación guardada',
]

export default function AuthLayout({ children, titulo, subtitulo }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      {/* Panel de marca */}
      <div
        className="auth-panel-marca"
        style={{
          flex: '0 0 44%',
          minHeight: '100vh',
          backgroundColor: 'var(--g900)',
          backgroundImage:
            'linear-gradient(160deg, var(--g900) 0%, var(--verde) 55%, var(--g700) 100%), ' +
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 48px), ' +
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 48px)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(2rem, 5vw, 4rem)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="34" height="34" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="var(--g500)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
            LiciTracker
          </span>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, maxWidth: 420 }}>
            Encuentra y gestiona licitaciones de obra pública sin perder tiempo
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {VENTAJAS.map((v) => (
              <div key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: 'var(--g200)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          Datos oficiales de PLACSP — Plataforma de Contratación del Sector Público
        </span>
      </div>

      {/* Panel de formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--n900)', marginBottom: 6 }}>
            {titulo}
          </h1>
          {subtitulo && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--n500)', marginBottom: 28 }}>
              {subtitulo}
            </p>
          )}
          {children}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-panel-marca { display: none !important; }
        }
        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: var(--r-md);
          border: 1px solid var(--n100);
          background: var(--n50);
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--n900);
          transition: border-color var(--transition), background var(--transition);
        }
        .auth-input:focus {
          border-color: var(--g500);
          background: #fff;
        }
        .auth-label {
          display: block;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--n700);
          margin-bottom: 6px;
        }
        .auth-field {
          margin-bottom: 16px;
        }
        .auth-submit {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--r-md);
          background: var(--verde);
          color: #fff;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background var(--transition);
        }
        .auth-submit:hover:not(:disabled) { background: var(--verde-medio); }
        .auth-submit:disabled { opacity: 0.65; cursor: default; }
        .auth-link {
          color: var(--verde);
          font-weight: 700;
        }
        .auth-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
