import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Bookmark, BookmarkCheck, Download, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatFecha, formatImporte, descripcionCPV } from '../utils/format.js'

function CampoDato({ label, valor, sublinea, destacado, span }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : 'auto' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--n400)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: destacado ? 17 : 14,
        fontWeight: destacado ? 700 : 500,
        fontFamily: destacado ? 'var(--font-titulo)' : 'var(--font-body)',
        color: 'var(--negro)',
        lineHeight: 1.4,
      }}>
        {valor}
      </div>
      {sublinea && (
        <div style={{ fontSize: 12, color: 'var(--n400)', marginTop: 2 }}>
          {sublinea}
        </div>
      )}
    </div>
  )
}

const printStyles = `
#resumen-print-area { position: fixed; top: -9999px; left: -9999px; }
@media print {
  body * { visibility: hidden !important; }
  #resumen-print-area, #resumen-print-area * { visibility: visible !important; }
  #resumen-print-area {
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: 100% !important; height: auto !important;
    background: #fff !important; padding: 48px 64px;
    font-family: Georgia, serif; color: #111;
    font-size: 13px; line-height: 1.7;
  }
  #resumen-print-area h1 { font-size: 20px; font-weight: 700; margin-bottom: 6px; color: #1a3d28; }
  #resumen-print-area .meta { font-size: 11px; color: #555; margin-bottom: 28px; border-bottom: 1px solid #ddd; padding-bottom: 14px; }
  #resumen-print-area h2 { font-size: 14px; font-weight: 700; margin: 20px 0 6px; color: #2A5938; text-transform: uppercase; letter-spacing: 0.05em; }
  #resumen-print-area p { margin-bottom: 10px; }
  #resumen-print-area ul, #resumen-print-area ol { padding-left: 20px; margin-bottom: 10px; }
  #resumen-print-area li { margin-bottom: 4px; }
  #resumen-print-area strong { font-weight: 700; }
  #resumen-print-area table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
  #resumen-print-area th { background: #EAF4EE; font-weight: 700; padding: 6px 10px; text-align: left; border: 1px solid #ccc; }
  #resumen-print-area td { padding: 5px 10px; border: 1px solid #ddd; }
}
`

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
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, minHeight: 300, textAlign: 'center',
        }}>
          <AlertTriangle size={32} color="var(--n300)" />
          <p style={{ fontSize: 14, color: 'var(--n400)', margin: 0 }}>
            No se ha seleccionado ninguna licitación. Vuelve al listado y elige una para generar su resumen con IA.
          </p>
          <button
            onClick={() => navigate('/dashboard/licitaciones')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 'var(--r-md)',
              background: 'var(--verde)', color: '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            }}
          >
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
      <style>{printStyles}</style>

      {/* Área oculta que se imprime como PDF */}
      <div id="resumen-print-area">
        <h1>{licitacion.titulo || 'Sin título'}</h1>
        <div className="meta">
          {licitacion.organismo || ''}  ·  {formatFecha(licitacion.fechaLimite) || 'Sin plazo'}  ·  Exp. {licitacion.expediente || '—'}
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumen || ''}</ReactMarkdown>
      </div>

      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 'var(--r-md)',
          border: '1px solid var(--n100)', background: '#fff',
          color: 'var(--n500)', fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-body)', marginBottom: 20,
        }}
      >
        <ArrowLeft size={15} />
        Volver
      </button>

      <section style={{
        background: '#fff', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)',
        padding: '24px 28px',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px 28px',
        }}>
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

      <section style={{
        marginTop: 20,
        background: '#EAF4EE',
        border: '1px solid #3D7A4F',
        borderRadius: 'var(--r-xl)',
        padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cargando || error ? 16 : 18 }}>
          <Sparkles size={18} color="#3D7A4F" />
          <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: '#2A5938', margin: 0 }}>
            {cargando ? 'Generando resumen con IA...' : 'Resumen IA'}
          </h3>
        </div>

        {cargando && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '3px solid #C9E2D2', borderTopColor: '#3D7A4F',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: '#2A5938' }}>
              La IA está analizando la licitación...
            </span>
          </div>
        )}

        {error && !cargando && (
          <p style={{ fontSize: 13, color: 'var(--rojo)', margin: 0 }}>
            {error}
          </p>
        )}

        {resumen && !cargando && (
          <div className="resumen-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumen}</ReactMarkdown>
          </div>
        )}
      </section>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => (guardada ? quitarLicitacion(licitacion.expediente) : guardarLicitacion(licitacion))}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 'var(--r-md)',
            background: guardada ? 'var(--verde-claro)' : 'var(--verde)',
            color: guardada ? 'var(--verde)' : '#fff',
            border: guardada ? '1px solid var(--g200)' : 'none',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}
        >
          {guardada ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {guardada ? 'Licitación guardada' : 'Guardar licitación'}
        </button>

        {resumen && (
          <button
            onClick={descargarPDF}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 'var(--r-md)',
              background: '#fff', color: 'var(--n500)',
              border: '1px solid var(--n100)',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            }}
          >
            <Download size={16} />
            Descargar PDF
          </button>
        )}
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
        .resumen-md table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
        .resumen-md th { background: #EAF4EE; color: #1a3d28; font-weight: 700; padding: 8px 12px; text-align: left; border: 1px solid #C9E2D2; }
        .resumen-md td { padding: 7px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
        .resumen-md tr:nth-child(even) td { background: #f9fafb; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  )
}
