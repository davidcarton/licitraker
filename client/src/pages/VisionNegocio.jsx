import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { RefreshCw, Building2, Wallet, AlertCircle, TrendingUp, Database } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha, formatFechaLarga, iniciales } from '../utils/format.js'

function GraficaCrecimiento({ datos }) {
  const max = Math.max(...datos.map(d => d.altas), 1)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '22px 24px', boxShadow: 'var(--shadow-card)', height: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 22px 0' }}>
        Nuevos clientes · últimos 6 meses
      </h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 110 }}>
        {datos.map((d, i) => {
          const esActual = i === datos.length - 1
          const altura = Math.max(Math.round((d.altas / max) * 88), 3)
          return (
            <div key={d.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: esActual ? 'var(--verde)' : 'var(--n400)' }}>
                {d.altas}
              </div>
              <div style={{
                width: '100%', maxWidth: 36, height: altura,
                background: esActual ? 'var(--verde)' : 'var(--g200)',
                borderRadius: '4px 4px 0 0',
              }} />
              <div style={{ fontSize: 10, color: esActual ? 'var(--verde)' : 'var(--n300)', fontWeight: esActual ? 700 : 400, whiteSpace: 'nowrap' }}>
                {d.etiqueta}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PanelCuentasYPlanes({ planes, totalActivas, totalInactivas }) {
  const total = totalActivas + totalInactivas
  const pctActivas = total > 0 ? Math.round((totalActivas / total) * 100) : 0
  const maxMrr = Math.max(...planes.map(p => p.mrr), 1)

  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '22px 24px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Estado de cuentas */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            Estado de cuentas
          </h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)' }}>{pctActivas}% activas</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--n100)', overflow: 'hidden' }}>
          <div style={{ width: `${pctActivas}%`, height: '100%', background: 'var(--verde)', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--n500)' }}>
            <b style={{ color: 'var(--verde)', fontWeight: 700 }}>{totalActivas}</b> activas
          </span>
          <span style={{ color: 'var(--n500)' }}>
            <b style={{ color: 'var(--rojo)', fontWeight: 700 }}>{totalInactivas}</b> inactivas
          </span>
        </div>
      </div>

      {/* Desglose por plan */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 14px 0' }}>
          Ingresos por plan
        </h3>
        {planes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--n400)', margin: 0 }}>Sin empresas de pago activas todavía.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {planes.map(p => (
              <div key={p.plan}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>
                    {p.plan}
                    <span style={{ fontWeight: 400, color: 'var(--n400)', fontSize: 11, marginLeft: 6 }}>
                      {p.empresasActivas} {p.empresasActivas === 1 ? 'empresa' : 'empresas'}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)' }}>
                    {formatImporte(p.mrr)} €
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--n100)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(Math.round((p.mrr / maxMrr) * 100), 4)}%`, height: '100%', background: 'var(--g400)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientesRecientes({ clientes, onVer }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '22px 24px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
          Últimas incorporaciones
        </h3>
        <button
          onClick={onVer}
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)', fontFamily: 'var(--font-body)' }}
        >
          Ver todos →
        </button>
      </div>
      {clientes.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--n400)', margin: 0 }}>Sin clientes registrados todavía.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {clientes.map((c, i) => (
            <div
              key={c.id}
              onClick={onVer}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 6px', cursor: 'pointer',
                borderBottom: i < clientes.length - 1 ? '1px solid var(--n50)' : 'none',
                borderRadius: 'var(--r-md)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gris-fondo)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--verde-claro)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--verde)', flexShrink: 0,
              }}>
                {iniciales(c.nombre)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--negro)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.nombre}
                </div>
                <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 1 }}>
                  {c.plan} · Alta {formatFecha(c.createdAt)}
                </div>
              </div>
              <span style={{
                padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: c.activa ? 'var(--verde-claro)' : 'var(--rojo-bg)',
                color: c.activa ? 'var(--verde)' : 'var(--rojo)',
              }}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaludSistema({ estado }) {
  const cpu = estado.sistemaOperativo?.cpu
  const mem = estado.sistemaOperativo?.memoria
  const disco = estado.sistemaOperativo?.disco

  const fila = (label, valor, alerta = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--n50)' }}>
      <span style={{ fontSize: 13, color: 'var(--n500)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: alerta ? 'var(--rojo)' : 'var(--negro)' }}>{valor ?? '—'}</span>
    </div>
  )

  const uptimeH = estado.servidor?.uptimeSegundos != null
    ? Math.floor(estado.servidor.uptimeSegundos / 3600) + 'h ' + Math.floor((estado.servidor.uptimeSegundos % 3600) / 60) + 'm'
    : null

  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '22px 24px', boxShadow: 'var(--shadow-card)' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 4px 0' }}>
        Estado del sistema
      </h3>
      <div>
        {fila('CPU', cpu?.porcentajeAprox != null ? `${cpu.porcentajeAprox}%` : null, (cpu?.porcentajeAprox ?? 0) > 80)}
        {fila('RAM', mem?.porcentajeUso != null ? `${mem.porcentajeUso}% de ${mem.totalMB} MB` : null, (mem?.porcentajeUso ?? 0) > 85)}
        {fila('Disco', disco?.porcentajeUso != null ? `${disco.porcentajeUso}% de ${disco.totalGB} GB` : null, (disco?.porcentajeUso ?? 0) > 85)}
        {fila('Latencia API', estado.api?.latenciaMediaMs != null ? `${estado.api.latenciaMediaMs} ms` : null, (estado.api?.latenciaMediaMs ?? 0) > 500)}
        {fila('Licitaciones en caché', estado.cache?.totalLicitaciones ?? null, (estado.cache?.totalLicitaciones ?? 1) === 0)}
        {fila('Uptime servidor', uptimeH)}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
          <span style={{ fontSize: 13, color: 'var(--n500)' }}>Última actualización feed</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>
            {estado.cache?.ultimaActualizacion ? formatFecha(estado.cache.ultimaActualizacion) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function saludo() {
  const h = new Date().getHours()
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function VisionNegocio() {
  const { authFetch, usuario } = useAuth()
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [estado, setEstado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resNegocio, resEstado, resClientes] = await Promise.all([
        authFetch('/api/admin/negocio'),
        authFetch('/api/admin/estado'),
        authFetch('/api/admin/clientes'),
      ])
      const [datosNegocio, datosEstado, datosClientes] = await Promise.all([
        resNegocio.json(),
        resEstado.json(),
        resClientes.json(),
      ])
      if (!resNegocio.ok) {
        setError(datosNegocio.error || 'No se han podido cargar los datos')
        return
      }
      setNegocio(datosNegocio)
      if (resEstado.ok) setEstado(datosEstado)
      if (resClientes.ok) setClientes((datosClientes.empresas || []).slice(0, 5))
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Visión general del negocio'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Visión general del negocio">
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 22, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            {saludo()}, {usuario?.nombre?.split(' ')[0] || 'admin'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--n400)', margin: '4px 0 0' }}>
            {formatFechaLarga()}
          </p>
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

      {/* Fila 1 — KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KPICard
          icon={Wallet}
          value={negocio ? `${formatImporte(negocio.mrr)} €` : '—'}
          label="MRR mensual"
        />
        <KPICard
          icon={Building2}
          value={negocio?.totalActivas ?? '—'}
          label={negocio ? `Activos de ${negocio.totalEmpresas} clientes` : 'Clientes activos'}
        />
        <KPICard
          icon={TrendingUp}
          value={negocio?.altasEstaSemana ?? '—'}
          label="Altas esta semana"
        />
        <KPICard
          icon={Database}
          value={estado?.base_datos?.licitacionesGuardadas ?? '—'}
          label="Licitaciones guardadas"
        />
      </div>

      {/* Fila 2 — Gráfica + Planes */}
      {negocio && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          <GraficaCrecimiento datos={negocio.crecimientoMensual} />
          <PanelCuentasYPlanes
            planes={negocio.desglosePorPlan}
            totalActivas={negocio.totalActivas}
            totalInactivas={negocio.totalInactivas}
          />
        </div>
      )}

      {/* Fila 3 — Clientes recientes + Salud del sistema */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ClientesRecientes
          clientes={clientes}
          onVer={() => navigate('/dashboard/admin/clientes')}
        />
        {estado && <SaludSistema estado={estado} />}
      </div>
    </DashboardLayout>
  )
}
