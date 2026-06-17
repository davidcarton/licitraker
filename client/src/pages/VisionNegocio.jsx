import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, Building2, Wallet, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFechaLarga } from '../utils/format.js'

function Reloj() {
  const [hora, setHora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--n400)' }}>
      {hora.toLocaleTimeString('es-ES')}
    </span>
  )
}

function LineaDetalle({ label, valor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--n500)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--negro)' }}>{valor}</span>
    </div>
  )
}

function TarjetaHeroe({ icon: Icon, valor, label, detalle }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)', padding: '24px 28px',
      display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(160px, 1.2fr)',
      gap: 24, alignItems: 'center',
    }}>
      <div>
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--r-md)', background: 'var(--verde-claro)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        }}>
          <Icon size={20} color="var(--verde)" />
        </div>
        <div style={{ fontFamily: 'var(--font-titulo)', fontSize: 36, fontWeight: 700, color: 'var(--negro)', lineHeight: 1 }}>
          {valor}
        </div>
        <div style={{ fontSize: 13, color: 'var(--n500)', marginTop: 8 }}>{label}</div>
      </div>
      <div style={{ borderLeft: '1px solid var(--n100)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {detalle}
      </div>
    </div>
  )
}

function GraficaCrecimiento({ datos }) {
  const max = Math.max(...datos.map(d => d.altas), 1)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
        Crecimiento de empresas
      </h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 90 }}>
        {datos.map(d => {
          const altura = Math.max(Math.round((d.altas / max) * 70), 2)
          return (
            <div key={d.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n500)' }}>{d.altas}</div>
              <div style={{ width: 22, height: altura, background: 'var(--g500)', borderRadius: '3px 3px 0 0' }} />
              <div style={{ fontSize: 10, color: 'var(--n300)' }}>{d.etiqueta}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GraficaIngresosPorPlan({ datos }) {
  if (datos.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
          Ingresos por plan
        </h3>
        <p style={{ fontSize: 13, color: 'var(--n400)' }}>Sin empresas de pago activas todavía</p>
      </div>
    )
  }

  const max = Math.max(...datos.map(d => d.mrr), 1)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
        Ingresos por plan
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {datos.map(d => {
          const ancho = Math.max(Math.round((d.mrr / max) * 100), 4)
          return (
            <div key={d.plan}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--negro)', marginBottom: 6 }}>
                <span>{d.plan}</span>
                <span>{formatImporte(d.mrr)} €/mes</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--n100)', overflow: 'hidden' }}>
                <div style={{ width: `${ancho}%`, height: '100%', background: 'var(--g500)', borderRadius: 5 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VisionNegocio() {
  const { authFetch, usuario } = useAuth()
  const [negocio, setNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/negocio')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar la visión de negocio')
        return
      }
      setNegocio(datos)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Visión general del negocio'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la visión de negocio al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Visión general del negocio">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 24, fontWeight: 700, color: '#000', margin: 0 }}>
            {usuario?.empresa?.nombre || 'Mi empresa'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>{formatFechaLarga()}</p>
          <div style={{ marginTop: 4 }}>
            <Reloj />
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--r-md)',
            background: 'var(--verde)', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            opacity: cargando ? 0.7 : 1,
            transition: 'background var(--transition), opacity var(--transition)',
          }}
          onMouseEnter={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde-medio)')}
          onMouseLeave={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde)')}
        >
          <RefreshCw size={15} style={{ animation: cargando ? 'spin 0.8s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)',
          borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600,
          marginBottom: 20,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <TarjetaHeroe
          icon={Wallet}
          valor={negocio ? `${formatImporte(negocio.mrr)} €` : '—'}
          label="Ingresos recurrentes del mes (MRR)"
          detalle={!negocio ? null : negocio.desglosePorPlan.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--n400)' }}>Sin empresas de pago activas todavía</span>
          ) : (
            negocio.desglosePorPlan.map(p => (
              <LineaDetalle
                key={p.plan}
                label={`${p.plan} · ${p.empresasActivas} ${p.empresasActivas === 1 ? 'empresa' : 'empresas'}`}
                valor={`${formatImporte(p.mrr)} €/mes`}
              />
            ))
          )}
        />
        <TarjetaHeroe
          icon={Building2}
          valor={negocio?.totalEmpresas ?? '—'}
          label="Empresas registradas"
          detalle={!negocio ? null : (
            <>
              <LineaDetalle label="Activas" valor={negocio.totalActivas} />
              <LineaDetalle label="Inactivas" valor={negocio.totalInactivas} />
              <LineaDetalle label="Altas esta semana" valor={negocio.altasEstaSemana} />
            </>
          )}
        />
      </div>

      {negocio && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
          <GraficaCrecimiento datos={negocio.crecimientoMensual} />
          <GraficaIngresosPorPlan datos={negocio.desglosePorPlan} />
        </div>
      )}
    </DashboardLayout>
  )
}
