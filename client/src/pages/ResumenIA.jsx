import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Bookmark, BookmarkCheck, Download, AlertTriangle } from 'lucide-react'
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: licitacion.titulo,
        organismo: licitacion.organismo,
        importe: licitacion.importe,
        fechaLimite: licitacion.fechaLimite,
        cpv: licitacion.cpv,
        enlace: licitacion.enlace,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setResumen(data.resumen)
      })
      .catch(() => setError('No se ha podido generar el resumen con IA. Inténtalo de nuevo en unos minutos.'))
  }, [licitacion])

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
          <div style={{ fontSize: 14, color: 'var(--n700)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {resumen}
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

        <button
          onClick={() => window.print()}
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
      </div>
    </DashboardLayout>
  )
}
