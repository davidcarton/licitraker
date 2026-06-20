import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
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

function ModalCliente({ clienteId, onCerrar, onGuardado }) {
  const { authFetch } = useAuth()
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [plan, setPlan] = useState('')
  const [precio, setPrecio] = useState('')
  const [activa, setActiva] = useState(true)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [mensajePassword, setMensajePassword] = useState('')

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
      setPrecio(datos.precioMensual != null ? String(datos.precioMensual) : '')
      setActiva(datos.activa)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch, clienteId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del detalle al abrir el modal
    cargarDetalle()
  }, [cargarDetalle])

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          precio_mensual: precio.trim() === '' ? null : Number(precio),
          activa,
        }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido guardar')
        return
      }
      onGuardado()
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const resetearPassword = async (usuarioId) => {
    setMensajePassword('')
    if (nuevaPassword.length < 8) {
      setMensajePassword('La contraseña debe tener al menos 8 caracteres')
      return
    }
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}/usuarios/${usuarioId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setMensajePassword(datos.error || 'No se ha podido actualizar la contraseña')
        return
      }
      setMensajePassword('Contraseña actualizada')
      setNuevaPassword('')
    } catch {
      setMensajePassword('No se ha podido conectar con el servidor')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCerrar}
        style={{ position: 'fixed', inset: 0, background: 'rgba(17,25,23,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 100 }}
      />
      <motion.div
        key="panel"
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)',
          background: '#fff', boxShadow: '-8px 0 48px rgba(0,0,0,0.16)', zIndex: 101,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            {detalle?.nombre || 'Cliente'}
          </h3>
          <button onClick={onCerrar} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n400)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {cargando && <p style={{ fontSize: 13, color: 'var(--n400)' }}>Cargando...</p>}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {detalle && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan</label>
                  <input
                    type="text"
                    value={plan}
                    maxLength={50}
                    onChange={(e) => setPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Precio mensual (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="Sin precio definido"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--negro)' }}>Cuenta activa</span>
                  <button
                    onClick={() => setActiva(a => !a)}
                    style={{
                      width: 44, height: 24, borderRadius: 100, background: activa ? 'var(--verde)' : 'var(--n100)',
                      position: 'relative', transition: 'background var(--transition)',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: activa ? 23 : 3, width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'left var(--transition)',
                    }} />
                  </button>
                </div>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff',
                    fontSize: 13, fontWeight: 700, opacity: guardando ? 0.7 : 1,
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-titulo)', fontSize: 13, fontWeight: 700, color: 'var(--negro)', margin: '0 0 10px 0' }}>
                  Preferencias configuradas
                </h4>
                {!detalle.preferencias ? (
                  <p style={{ fontSize: 13, color: 'var(--n400)' }}>Sin preferencias configuradas todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: 'var(--n500)' }}>Tipos de obra: </span>{(detalle.preferencias.tiposObra || []).join(', ') || '—'}</div>
                    <div><span style={{ color: 'var(--n500)' }}>Provincias: </span>{(detalle.preferencias.provincias || []).join(', ') || '—'}</div>
                    <div><span style={{ color: 'var(--n500)' }}>Importe: </span>{detalle.preferencias.importeMin ?? '—'} – {detalle.preferencias.importeMax ?? '—'} €</div>
                    <div><span style={{ color: 'var(--n500)' }}>Frecuencia de alerta: </span>{detalle.preferencias.frecuenciaAlerta || '—'}</div>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-titulo)', fontSize: 13, fontWeight: 700, color: 'var(--negro)', margin: '0 0 10px 0' }}>
                  Usuarios
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detalle.usuarios.map(u => (
                    <div key={u.id} style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{u.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--n400)' }}>{u.email} · {u.rol}</div>
                        </div>
                        <button
                          onClick={() => { setUsuarioEditando(usuarioEditando === u.id ? null : u.id); setMensajePassword(''); setNuevaPassword('') }}
                          style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)', whiteSpace: 'nowrap' }}
                        >
                          Resetear contraseña
                        </button>
                      </div>
                      {usuarioEditando === u.id && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                          <input
                            type="password"
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            placeholder="Nueva contraseña (mín. 8 caracteres)"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 13 }}
                          />
                          <button
                            onClick={() => resetearPassword(u.id)}
                            style={{ padding: '8px 14px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff', fontSize: 12, fontWeight: 700 }}
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                      {usuarioEditando === u.id && mensajePassword && (
                        <p style={{ fontSize: 12, marginTop: 6, color: mensajePassword === 'Contraseña actualizada' ? 'var(--verde)' : 'var(--rojo)' }}>
                          {mensajePassword}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
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

      {clienteSeleccionado != null && (
        <ModalCliente
          clienteId={clienteSeleccionado}
          onCerrar={() => setClienteSeleccionado(null)}
          onGuardado={() => { setClienteSeleccionado(null); cargar() }}
        />
      )}
    </DashboardLayout>
  )
}
