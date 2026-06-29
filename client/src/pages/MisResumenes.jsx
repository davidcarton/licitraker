import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trash2, FileText, Calendar, Building2, AlertTriangle, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
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

function ResumenDetalle({ item, onCerrar, onEliminar }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 100, overflowY: 'auto', padding: '32px 16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 720,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--n100)', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={15} color="#3D7A4F" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3D7A4F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Resumen IA
              </span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700,
              color: 'var(--negro)', lineHeight: 1.4, margin: 0,
            }}>
              {item.titulo || item.expediente}
            </h2>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              {item.organismo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                  <Building2 size={11} /> {item.organismo}
                </span>
              )}
              {item.fecha_limite && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                  <Calendar size={11} /> {formatFecha(item.fecha_limite)}
                </span>
              )}
              {item.importe && (
                <span style={{ fontSize: 11, color: 'var(--n400)', fontWeight: 600 }}>
                  {formatImporte(item.importe)} €
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={onEliminar}
              title="Eliminar resumen"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 'var(--r-md)',
                border: '1px solid var(--rojo-borde)', background: 'var(--rojo-bg)',
                color: 'var(--rojo)', cursor: 'pointer',
              }}
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onCerrar}
              style={{
                padding: '7px 14px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--n100)', background: '#fff',
                color: 'var(--n500)', fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-body)', cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="resumen-md">
            <ReactMarkdown>{item.resumen}</ReactMarkdown>
          </div>
        </div>
      </div>

      <style>{`
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
      `}</style>
    </div>
  )
}

export default function MisResumenes() {
  const navigate = useNavigate()
  const [resumenes, setResumenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(null)
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
    setAbierto(null)
    setConfirmarEliminar(null)
  }

  return (
    <DashboardLayout title="Mis Resúmenes IA">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-titulo)', fontSize: 20, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
          Mis Resúmenes IA
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
          {resumenes.map(item => (
            <div
              key={item.expediente}
              style={{
                background: '#fff', borderRadius: 'var(--r-xl)',
                border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--r-md)',
                background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Sparkles size={17} color="#3D7A4F" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700,
                  color: 'var(--negro)', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.titulo || item.expediente}
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
                  onClick={() => setAbierto(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 'var(--r-md)',
                    background: 'var(--verde)', color: '#fff',
                    border: 'none', fontSize: 12, fontWeight: 700,
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                  }}
                >
                  Ver <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {abierto && (
        <ResumenDetalle
          item={abierto}
          onCerrar={() => setAbierto(null)}
          onEliminar={() => setConfirmarEliminar(abierto)}
        />
      )}

      {confirmarEliminar && (
        <ConfirmModal
          titulo={confirmarEliminar.titulo || confirmarEliminar.expediente}
          onConfirm={() => eliminar(confirmarEliminar.expediente)}
          onCancel={() => setConfirmarEliminar(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
