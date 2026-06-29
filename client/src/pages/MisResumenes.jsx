import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trash2, FileText, Calendar, Building2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { formatFecha, formatImporte } from '../utils/format.js'

function ConfirmModal({ titulo, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--r-xl)', padding: '28px 32px',
        maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <AlertTriangle size={20} color="var(--rojo)" />
          <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            Eliminar resumen
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--n500)', lineHeight: 1.6, marginBottom: 24 }}>
          ¿Seguro que quieres eliminar el resumen de <strong style={{ color: 'var(--negro)' }}>"{titulo}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--n100)', background: '#fff',
              color: 'var(--n500)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px', borderRadius: 'var(--r-md)',
              background: 'var(--rojo)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MisResumenes() {
  const navigate = useNavigate()
  const [resumenes, setResumenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    fetch('/api/resumenes-ia')
      .then(r => r.json())
      .then(d => setResumenes(d.resumenes || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const eliminar = async (expediente) => {
    await fetch(`/api/resumenes-ia/${encodeURIComponent(expediente)}`, { method: 'DELETE' })
    setResumenes(prev => prev.filter(r => r.expediente !== expediente))
    if (expandido === expediente) setExpandido(null)
    setConfirmarEliminar(null)
  }

  const toggleExpandido = (expediente) => {
    setExpandido(prev => prev === expediente ? null : expediente)
  }

  return (
    <DashboardLayout title="Resúmenes IA">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-titulo)', fontSize: 20, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
          Resúmenes IA
        </h1>
        <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>
          Historial de licitaciones analizadas con IA
        </p>
      </div>

      {cargando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 32 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '3px solid var(--n100)', borderTopColor: 'var(--verde)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 13, color: 'var(--n400)' }}>Cargando resúmenes...</span>
        </div>
      )}

      {!cargando && resumenes.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, minHeight: 260, textAlign: 'center',
        }}>
          <Sparkles size={36} color="var(--n200)" />
          <p style={{ fontSize: 14, color: 'var(--n400)', margin: 0 }}>
            Todavía no hay resúmenes generados.<br />Ve a Licitaciones y pulsa "Resumen IA" en cualquier tarjeta.
          </p>
          <button
            onClick={() => navigate('/dashboard/licitaciones')}
            style={{
              padding: '10px 20px', borderRadius: 'var(--r-md)',
              background: 'var(--verde)', color: '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            }}
          >
            Ir a Licitaciones
          </button>
        </div>
      )}

      {!cargando && resumenes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resumenes.map(item => {
            const abierto = expandido === item.expediente
            return (
              <div
                key={item.expediente}
                style={{
                  background: '#fff', borderRadius: 'var(--r-xl)',
                  border: abierto ? '1px solid #3D7A4F' : '1px solid var(--n100)',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Cabecera de la tarjeta */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--r-md)',
                    background: abierto ? '#3D7A4F' : '#EAF4EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background 0.15s',
                  }}>
                    <Sparkles size={17} color={abierto ? '#fff' : '#3D7A4F'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700,
                      color: 'var(--negro)', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.titulo || <span style={{ color: 'var(--n400)', fontWeight: 400 }}>{item.expediente}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                      {item.organismo && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                          <Building2 size={10} /> {item.organismo}
                        </span>
                      )}
                      {item.fecha_limite && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                          <Calendar size={10} /> {formatFecha(item.fecha_limite)}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n300)' }}>
                        <FileText size={10} /> {item.expediente}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.coste_euros != null && (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: '#3D7A4F',
                        background: '#EAF4EE',
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontFamily: 'var(--font-body)',
                      }}>
                        €{Number(item.coste_euros) >= 0.01
                          ? Number(item.coste_euros).toFixed(3)
                          : Number(item.coste_euros).toFixed(5)}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--n300)' }}>
                      {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </span>
                    <button
                      onClick={() => setConfirmarEliminar(item)}
                      title="Eliminar resumen"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 'var(--r-md)',
                        border: '1px solid var(--rojo-borde)', background: 'var(--rojo-bg)',
                        color: 'var(--rojo)', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => toggleExpandido(item.expediente)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 'var(--r-md)',
                        background: abierto ? 'var(--verde-claro)' : 'var(--verde)',
                        color: abierto ? 'var(--verde)' : '#fff',
                        border: abierto ? '1px solid var(--g200)' : 'none',
                        fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font-body)', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      {abierto ? <><ChevronUp size={13} /> Cerrar</> : <><ChevronDown size={13} /> Ver</>}
                    </button>
                  </div>
                </div>

                {/* Contenido desplegable */}
                {abierto && (
                  <div style={{
                    borderTop: '1px solid #C9E2D2',
                    padding: '20px 24px',
                    background: '#FAFDFB',
                  }}>
                    <div className="resumen-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.resumen || ''}</ReactMarkdown>
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setExpandido(null)}
                        style={{
                          padding: '7px 16px', borderRadius: 'var(--r-md)',
                          border: '1px solid var(--n100)', background: '#fff',
                          color: 'var(--n500)', fontSize: 12, fontWeight: 600,
                          fontFamily: 'var(--font-body)', cursor: 'pointer',
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {confirmarEliminar && (
        <ConfirmModal
          titulo={confirmarEliminar.titulo || confirmarEliminar.expediente}
          onConfirm={() => eliminar(confirmarEliminar.expediente)}
          onCancel={() => setConfirmarEliminar(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .resumen-md { font-size: 14px; color: var(--n700); line-height: 1.75; }
        .resumen-md h2, .resumen-md h3 {
          font-family: var(--font-titulo); font-weight: 700;
          color: #1a3d28; margin: 20px 0 6px;
        }
        .resumen-md h2 { font-size: 15px; }
        .resumen-md h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #2A5938; }
        .resumen-md p { margin-bottom: 10px; }
        .resumen-md ul, .resumen-md ol { padding-left: 20px; margin-bottom: 10px; }
        .resumen-md li { margin-bottom: 4px; }
        .resumen-md strong { font-weight: 700; color: #1a3d28; }
        .resumen-md table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
        .resumen-md th { background: #EAF4EE; color: #1a3d28; font-weight: 700; padding: 8px 12px; text-align: left; border: 1px solid #C9E2D2; }
        .resumen-md td { padding: 7px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
        .resumen-md tr:nth-child(even) td { background: #f9fafb; }
      `}</style>
    </DashboardLayout>
  )
}
