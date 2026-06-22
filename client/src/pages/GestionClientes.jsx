import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, RefreshCw, ArrowLeft, Mail, Building2 } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha } from '../utils/format.js'

function BadgeEstado({ activa }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: activa ? 'var(--verde-claro)' : 'var(--rojo-bg)',
      color: activa ? 'var(--verde)' : 'var(--rojo)',
      fontSize: 11, fontWeight: 700,
    }}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

function iniciales(nombre) {
  return (nombre || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
}

function DetalleCliente({ clienteId, onVolver, onGuardado }) {
  const { authFetch } = useAuth()
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [plan, setPlan] = useState('')
  const [activa, setActiva] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState('')

  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensajeEmail, setMensajeEmail] = useState('')

  const cargarDetalle = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`)
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el cliente')
        return
      }
      setDetalle(datos)
      setPlan(datos.plan)
      setActiva(datos.activa)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch, clienteId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del detalle al montar
    cargarDetalle()
  }, [cargarDetalle])

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    setMensajeGuardado('')
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, activa }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido guardar')
        return
      }
      setMensajeGuardado('Cambios guardados')
      onGuardado()
      setTimeout(() => setMensajeGuardado(''), 3000)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const enviarEmail = async () => {
    if (!asunto.trim() || !cuerpo.trim()) {
      setMensajeEmail('El asunto y el mensaje son obligatorios')
      return
    }
    setEnviando(true)
    setMensajeEmail('')
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asunto, cuerpo }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setMensajeEmail(datos.error || 'No se ha podido enviar el email')
        return
      }
      setMensajeEmail('Email enviado correctamente')
      setAsunto('')
      setCuerpo('')
    } catch {
      setMensajeEmail('No se ha podido conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onVolver}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--n500)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft size={16} />
          Volver a la lista
        </button>
        {detalle && <BadgeEstado activa={detalle.activa} />}
      </div>

      {detalle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--verde-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={22} color="var(--verde)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 20, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>{detalle.nombre}</h2>
            <span style={{ fontSize: 12, color: 'var(--n400)' }}>Alta: {formatFecha(detalle.createdAt) || '—'}</span>
          </div>
        </div>
      )}

      {cargando && <p style={{ fontSize: 13, color: 'var(--n400)' }}>Cargando...</p>}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {detalle && (
        <>
          {/* Plan y estado de la cuenta */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>Cuenta</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan</label>
                <input
                  type="text"
                  value={plan}
                  maxLength={50}
                  onChange={(e) => setPlan(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--n500)', whiteSpace: 'nowrap' }}>{activa ? 'Activa' : 'Inactiva'}</span>
                  <button
                    onClick={() => setActiva(a => !a)}
                    style={{ width: 44, height: 24, borderRadius: 100, background: activa ? 'var(--verde)' : 'var(--n100)', position: 'relative', transition: 'background var(--transition)', flexShrink: 0 }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: activa ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left var(--transition)' }} />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={guardar}
                disabled={guardando}
                style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {mensajeGuardado && <span style={{ fontSize: 13, color: 'var(--verde)', fontWeight: 600 }}>{mensajeGuardado}</span>}
            </div>
          </div>

          {/* Email */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>Enviar email al cliente</h3>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Asunto</label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del email"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mensaje</label>
              <textarea
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Escribe aquí el mensaje para el cliente..."
                rows={5}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={enviarEmail}
                disabled={enviando}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', opacity: enviando ? 0.7 : 1 }}
              >
                <Mail size={15} />
                {enviando ? 'Enviando...' : 'Enviar email'}
              </button>
              {mensajeEmail && (
                <span style={{ fontSize: 13, fontWeight: 600, color: mensajeEmail.includes('correctamente') ? 'var(--verde)' : 'var(--rojo)' }}>
                  {mensajeEmail}
                </span>
              )}
            </div>
          </div>

          {/* Preferencias */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>Preferencias configuradas</h3>
            {!detalle.preferencias ? (
              <p style={{ fontSize: 13, color: 'var(--n400)', margin: 0 }}>Sin preferencias configuradas todavía.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13 }}>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tipos de obra</span>
                  {(detalle.preferencias.tiposObra || []).join(', ') || '—'}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Provincias</span>
                  {(detalle.preferencias.provincias || []).join(', ') || '—'}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Importe mínimo</span>
                  {detalle.preferencias.importeMin != null ? `${formatImporte(detalle.preferencias.importeMin)} €` : '—'}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Importe máximo</span>
                  {detalle.preferencias.importeMax != null ? `${formatImporte(detalle.preferencias.importeMax)} €` : '—'}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Frecuencia de alerta</span>
                  {detalle.preferencias.frecuenciaAlerta || '—'}
                </div>
              </div>
            )}
          </div>

          {/* Usuarios */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
              Usuarios ({detalle.usuarios.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detalle.usuarios.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--verde-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--verde)', flexShrink: 0 }}>
                    {iniciales(u.nombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{u.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--n400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n400)', background: 'var(--n100)', padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>{u.rol}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.activo ? 'var(--verde)' : 'var(--rojo)', flexShrink: 0 }} title={u.activo ? 'Activo' : 'Inactivo'} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function GestionClientes() {
  const { authFetch, usuario } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/clientes')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se han podido cargar los clientes')
        return
      }
      setClientes(datos.empresas)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Gestión de clientes'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la lista de clientes al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Gestión de clientes">
      {clienteSeleccionado != null ? (
        <DetalleCliente
          clienteId={clienteSeleccionado}
          onVolver={() => setClienteSeleccionado(null)}
          onGuardado={cargar}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
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

          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gris-fondo)' }}>
                  {['Nombre', 'Plan', 'Precio', 'Estado', 'Fecha de alta'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--n400)', fontSize: 13 }}>
                      No hay clientes registrados todavía.
                    </td>
                  </tr>
                ) : (
                  clientes.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setClienteSeleccionado(c.id)}
                      style={{ borderTop: '1px solid var(--n100)', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gris-fondo)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--negro)' }}>{c.nombre}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.plan}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.precioMensual != null ? `${formatImporte(c.precioMensual)} €` : '—'}</td>
                      <td style={{ padding: '12px 16px' }}><BadgeEstado activa={c.activa} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{formatFecha(c.createdAt) || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
