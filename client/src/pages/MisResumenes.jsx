import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trash2, FileText, Calendar, Building2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatFecha, formatImporte } from '../utils/format.js'
import '../styles/resumen-md.css'
import '../styles/pages/MisResumenes.css'

function ConfirmModal({ titulo, onConfirm, onCancel }) {
  return (
    <div className="mr-modal-overlay">
      <div className="mr-modal">
        <div className="mr-modal__header">
          <AlertTriangle size={20} color="var(--rojo)" />
          <h3 className="mr-modal__titulo">Eliminar resumen</h3>
        </div>
        <p className="mr-modal__desc">
          ¿Seguro que quieres eliminar el resumen de <strong className="mr-modal__strong">"{titulo}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="mr-modal__acciones">
          <button onClick={onCancel} className="mr-btn-cancelar">Cancelar</button>
          <button onClick={onConfirm} className="mr-btn-confirmar">Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function MisResumenes() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esSuperadmin = usuario?.rol === 'superadmin'
  const [resumenes, setResumenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    fetch('/api/resumenes-ia', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => setResumenes(d.resumenes || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const eliminar = async (expediente) => {
    await fetch(`/api/resumenes-ia/${encodeURIComponent(expediente)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    setResumenes(prev => prev.filter(r => r.expediente !== expediente))
    if (expandido === expediente) setExpandido(null)
    setConfirmarEliminar(null)
  }

  const toggleExpandido = (expediente) => {
    setExpandido(prev => prev === expediente ? null : expediente)
  }

  return (
    <DashboardLayout title="Resúmenes IA">
      <div className="mr-cabecera">
        <h1 className="mr-titulo">Resúmenes IA</h1>
        <p className="mr-subtitulo">Historial de licitaciones analizadas con IA</p>
      </div>

      {cargando && (
        <div className="mr-spinner-wrap">
          <div className="mr-spinner" />
          <span className="mr-spinner-text">Cargando resúmenes...</span>
        </div>
      )}

      {!cargando && resumenes.length === 0 && (
        <div className="mr-vacio">
          <Sparkles size={36} color="var(--n300)" />
          <p className="mr-vacio__texto">
            Todavía no hay resúmenes generados.<br />Ve a Licitaciones y pulsa "Resumen IA" en cualquier tarjeta.
          </p>
          <button onClick={() => navigate('/dashboard/licitaciones')} className="mr-btn-ir">
            Ir a Licitaciones
          </button>
        </div>
      )}

      {!cargando && resumenes.length > 0 && (
        <div className="mr-lista">
          {resumenes.map(item => {
            const abierto = expandido === item.expediente
            return (
              <div key={item.expediente} className={`mr-tarjeta${abierto ? ' mr-tarjeta--abierta' : ''}`}>
                {/* Cabecera de la tarjeta */}
                <div className="mr-tarjeta__header">
                  <div className={`mr-tarjeta__icon${abierto ? ' mr-tarjeta__icon--abierto' : ''}`}>
                    <Sparkles size={17} />
                  </div>

                  <div className="mr-tarjeta__info">
                    <div className="mr-tarjeta__titulo-row">
                      <div className="mr-tarjeta__titulo">
                        {item.titulo || <span className="mr-tarjeta__sin-titulo">{item.expediente}</span>}
                      </div>
                      {esSuperadmin && item.empresa_nombre && (
                        <span className="mr-empresa-badge">{item.empresa_nombre}</span>
                      )}
                    </div>
                    <div className="mr-tarjeta__meta">
                      {item.organismo && (
                        <span className="mr-tarjeta__meta-item">
                          <Building2 size={10} /> {item.organismo}
                        </span>
                      )}
                      {item.fecha_limite && (
                        <span className="mr-tarjeta__meta-item">
                          <Calendar size={10} /> {formatFecha(item.fecha_limite)}
                        </span>
                      )}
                      <span className="mr-tarjeta__meta-item mr-tarjeta__meta-item--tenue">
                        <FileText size={10} /> {item.expediente}
                      </span>
                    </div>
                  </div>

                  <div className="mr-tarjeta__acciones">
                    {esSuperadmin && item.coste_euros != null && (
                      <span className="mr-coste-badge">
                        €{Number(item.coste_euros) >= 0.01
                          ? Number(item.coste_euros).toFixed(3)
                          : Number(item.coste_euros).toFixed(5)}
                      </span>
                    )}
                    <span className="mr-tarjeta__fecha">
                      {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </span>
                    <button
                      onClick={() => setConfirmarEliminar(item)}
                      title="Eliminar resumen"
                      className="mr-btn-eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => toggleExpandido(item.expediente)}
                      className={`mr-btn-ver ${abierto ? 'mr-btn-ver--abierto' : 'mr-btn-ver--cerrado'}`}
                    >
                      {abierto ? <><ChevronUp size={13} /> Cerrar</> : <><ChevronDown size={13} /> Ver</>}
                    </button>
                  </div>
                </div>

                {/* Contenido desplegable */}
                {abierto && (
                  <div className="mr-tarjeta__cuerpo">
                    <div className="resumen-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.resumen || ''}</ReactMarkdown>
                    </div>
                    <div className="mr-tarjeta__pie">
                      <button onClick={() => setExpandido(null)} className="mr-btn-cerrar">
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
    </DashboardLayout>
  )
}
