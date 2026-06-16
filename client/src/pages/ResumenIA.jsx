import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, ExternalLink, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { formatImporte, diasRestantes } from '../utils/format.js'
import Badge from '../components/ui/Badge.jsx'

function diasVariant(dias) {
  if (dias === null) return 'neutral'
  if (dias < 3) return 'urgente'
  if (dias <= 7) return 'proximo'
  return 'enplazo'
}

function MetaItem({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p style={{
        fontSize: 13, color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value ?? '—'}
      </p>
    </div>
  )
}

export default function ResumenIA() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const l = state?.licitacion

  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!l) return
    generarResumen()
    document.title = 'LiciTraker · Resumen IA'
    return () => { document.title = 'LiciTraker' }
  }, [])

  async function generarResumen() {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/resumen-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: l.titulo,
          organismo: l.organismo,
          importe: l.importe,
          fechaLimite: l.fechaLimite,
          cpv: l.cpv,
          enlace: l.enlace,
        }),
      })
      const datos = await res.json()
      if (!res.ok || datos.error) throw new Error(datos.error || 'Error al generar resumen')
      setResumen(datos.resumen)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  function copiarResumen() {
    if (!resumen) return
    navigator.clipboard.writeText(resumen).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  if (!l) {
    return (
      <DashboardLayout title="Resumen IA">
        <div style={{ maxWidth: 640 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No hay licitación seleccionada. Accede desde el Dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--brand)', cursor: 'pointer',
              background: 'none', border: 'none', fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} /> Volver al Dashboard
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const importe = formatImporte(l.importe)
  const dias = diasRestantes(l.fechaLimite)

  return (
    <DashboardLayout title="Resumen IA">
      <div style={{ maxWidth: 760 }}>
        {/* Volver */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-muted)', marginBottom: 20,
            cursor: 'pointer', background: 'none', border: 'none',
            fontFamily: 'inherit', transition: 'color 0.13s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        {/* Header licitación */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.02em', lineHeight: 1.35, flex: 1,
            }}>
              {l.titulo || 'Sin título'}
            </h2>
            {dias !== null && (
              <Badge variant={diasVariant(dias)} showDot>
                {dias < 0 ? 'Vencida' : `${dias} días`}
              </Badge>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px 24px',
          }}>
            <MetaItem label="Organismo" value={l.organismo} />
            <MetaItem label="Provincia" value={l.provincia} />
            <MetaItem label="Presupuesto" value={importe ? `${importe} €` : null} mono />
            <MetaItem label="Fecha límite" value={l.fechaLimite} mono />
            <MetaItem label="Expediente" value={l.expediente} mono />
            <MetaItem label="Código CPV" value={l.cpv} mono />
          </div>

          {l.enlace && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <a
                href={l.enlace}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: 'var(--brand)', fontWeight: 500,
                }}
              >
                <ExternalLink size={12} />
                Ver en Plataforma de Contratación del Sector Público
              </a>
            </div>
          )}
        </div>

        {/* Resumen IA */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Header resumen */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(42,89,56,0.04) 0%, rgba(61,148,101,0.03) 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #2A5938 0%, #3d9465 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Análisis con Inteligencia Artificial
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {resumen && (
                <button
                  onClick={copiarResumen}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', fontFamily: 'inherit',
                    transition: 'all 0.13s',
                  }}
                >
                  {copiado ? <Check size={12} /> : <Copy size={12} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              )}
              {!cargando && (
                <button
                  onClick={generarResumen}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--brand-light)', color: 'var(--brand)',
                    border: '1px solid var(--brand-mid)', fontFamily: 'inherit',
                    transition: 'all 0.13s',
                  }}
                >
                  <Sparkles size={12} />
                  {resumen ? 'Regenerar' : 'Generar'}
                </button>
              )}
            </div>
          </div>

          {/* Contenido */}
          <div style={{ padding: '20px 24px' }}>
            <AnimatePresence mode="wait">
              {cargando && (
                <motion.div
                  key="cargando"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {[100, 80, 90, 65, 85].map((w, i) => (
                    <div key={i} style={{
                      height: 14, borderRadius: 7,
                      background: 'var(--bg-subtle)',
                      width: `${w}%`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                    }} />
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Claude está analizando la licitación...
                  </p>
                </motion.div>
              )}

              {error && !cargando && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--danger-light)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--danger)',
                  }}
                >
                  {error}
                </motion.div>
              )}

              {resumen && !cargando && (
                <motion.div
                  key="resumen"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {resumen}
                </motion.div>
              )}

              {!resumen && !cargando && !error && (
                <motion.div
                  key="vacio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '24px 0' }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Haz clic en "Generar" para que Claude analice esta licitación
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
