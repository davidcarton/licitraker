import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Bookmark, BookmarkCheck, Download, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatFecha, formatImporte, descripcionCPV } from '../utils/format.js'
import '../styles/resumen-md.css'
import '../styles/pages/ResumenIA.css'

function CampoDato({ label, valor, sublinea, destacado, span }) {
  return (
    <div className={span ? 'ri-campo--span' : undefined}>
      <div className="ri-campo__label">{label}</div>
      <div className={`ri-campo__valor${destacado ? ' ri-campo__valor--destacado' : ''}`}>{valor}</div>
      {sublinea && <div className="ri-campo__sublinea">{sublinea}</div>}
    </div>
  )
}

export default function ResumenIA() {
  const navigate = useNavigate()
  const location = useLocation()
  const licitacion = location.state?.licitacion
  const { licitacionesGuardadas, guardarLicitacion, quitarLicitacion } = useApp()

  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState(null)
  const cargando = !!licitacion && resumen === null && error === null

  useEffect(() => {
    if (!licitacion) return

    fetch('/api/resumen-ia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        titulo: licitacion.titulo,
        organismo: licitacion.organismo,
        importe: licitacion.importe,
        fechaLimite: licitacion.fechaLimite,
        cpv: licitacion.cpv,
        enlace: licitacion.enlace,
        expediente: licitacion.expediente,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setResumen(data.resumen)
      })
      .catch(() => setError('No se ha podido generar el resumen con IA. Inténtalo de nuevo en unos minutos.'))
  }, [licitacion])

  const descargarPDF = () => {
    const area = document.getElementById('resumen-print-area')
    if (area) {
      area.querySelector('.meta').textContent =
        `${licitacion.organismo || ''}  ·  ${formatFecha(licitacion.fechaLimite) || 'Sin plazo'}  ·  Exp. ${licitacion.expediente || '—'}`
      area.querySelector('h1').textContent = licitacion.titulo || 'Sin título'
    }
    window.print()
  }

  if (!licitacion) {
    return (
      <DashboardLayout title="Resumen IA">
        <div className="ri-vacio">
          <AlertTriangle size={32} color="var(--n300)" />
          <p className="ri-vacio__texto">
            No se ha seleccionado ninguna licitación. Vuelve al listado y elige una para generar su resumen con IA.
          </p>
          <button onClick={() => navigate('/dashboard/licitaciones')} className="ri-btn-ir">
            <ArrowLeft size={15} />
            Ir a Licitaciones
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const guardada = licitacionesGuardadas.some(g => g.expediente === licitacion.expediente)
  const importe = formatImporte(licitacion.importe)

  return (
    <DashboardLayout title="Resumen IA">
      {/* Área oculta que se imprime como PDF — estilos de impresión en ResumenIA.css */}
      <div id="resumen-print-area">
        <h1>{licitacion.titulo || 'Sin título'}</h1>
        <div className="meta">
          {licitacion.organismo || ''}  ·  {formatFecha(licitacion.fechaLimite) || 'Sin plazo'}  ·  Exp. {licitacion.expediente || '—'}
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumen || ''}</ReactMarkdown>
      </div>

      <button onClick={() => navigate(-1)} className="ri-btn-volver">
        <ArrowLeft size={15} />
        Volver
      </button>

      <section className="ri-seccion-datos">
        <div className="ri-campos-grid">
          <CampoDato label="Título completo" valor={licitacion.titulo || 'Sin título'} destacado span />
          <CampoDato label="Organismo" valor={licitacion.organismo || '—'} />
          <CampoDato label="Provincia" valor={licitacion.provincia || '—'} />
          <CampoDato label="Importe" valor={importe ? `${importe} €` : 'Consultar'} />
          <CampoDato label="Fecha límite" valor={formatFecha(licitacion.fechaLimite) || 'Sin plazo'} />
          <CampoDato
            label="CPV"
            valor={licitacion.cpv || '—'}
            sublinea={licitacion.cpv ? descripcionCPV(licitacion.cpv) : null}
          />
          <CampoDato label="Expediente" valor={licitacion.expediente || '—'} />
        </div>
      </section>

      <section className="ri-seccion-ia">
        <div className="ri-ia-header">
          <Sparkles size={18} color="#3D7A4F" />
          <h3 className="ri-ia-titulo">
            {cargando ? 'Generando resumen con IA...' : 'Resumen IA'}
          </h3>
        </div>

        {cargando && (
          <div className="ri-ia-spinner-wrap">
            <div className="ri-ia-spinner" />
            <span className="ri-ia-spinner-text">La IA está analizando la licitación...</span>
          </div>
        )}

        {error && !cargando && <p className="ri-ia-error">{error}</p>}

        {resumen && !cargando && (
          <div className="resumen-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumen}</ReactMarkdown>
          </div>
        )}
      </section>

      <div className="ri-acciones">
        <button
          onClick={() => (guardada ? quitarLicitacion(licitacion.expediente) : guardarLicitacion(licitacion))}
          className={`ri-btn-guardar ${guardada ? 'ri-btn-guardar--guardada' : 'ri-btn-guardar--no-guardada'}`}
        >
          {guardada ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {guardada ? 'Licitación guardada' : 'Guardar licitación'}
        </button>

        {resumen && (
          <button onClick={descargarPDF} className="ri-btn-pdf">
            <Download size={16} />
            Descargar PDF
          </button>
        )}
      </div>
    </DashboardLayout>
  )
}
