import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, RefreshCw, ArrowLeft, Mail, Building2, KeyRound, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha } from '../utils/format.js'
import '../styles/pages/GestionClientes.css'

function BadgeEstado({ activa }) {
  return (
    <span className={`gc-badge-estado ${activa ? 'gc-badge-estado--activa' : 'gc-badge-estado--inactiva'}`}>
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

function FilaDato({ label, valor }) {
  if (!valor) return null
  return (
    <div>
      <span className="gc-fila-dato__label">{label}</span>
      <span className="gc-fila-dato__valor">{valor}</span>
    </div>
  )
}

function ResetPasswordRow({ authFetch, clienteId, usuarioId }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  const resetear = async () => {
    if (password.length < 8) { setMsg('Mínimo 8 caracteres'); return }
    setGuardando(true)
    setMsg('')
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}/usuarios/${usuarioId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const datos = await res.json()
      if (!res.ok) { setMsg(datos.error || 'Error'); return }
      setMsg('Contraseña actualizada')
      setPassword('')
      setTimeout(() => { setMsg(''); setAbierto(false) }, 2000)
    } catch {
      setMsg('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="gc-reset-row">
      <button
        onClick={() => { setAbierto(a => !a); setMsg(''); setPassword('') }}
        className="gc-reset-btn"
      >
        <KeyRound size={12} />
        Restablecer contraseña
        {abierto ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {abierto && (
        <div className="gc-reset-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            className="gc-reset-input"
          />
          <button onClick={resetear} disabled={guardando} className="gc-reset-submit">
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
          {msg && (
            <span className={`gc-reset-msg ${msg.includes('actualizada') ? 'gc-reset-msg--ok' : 'gc-reset-msg--error'}`}>
              {msg}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function ModalEliminarCliente({ nombre, eliminando, onConfirm, onCancel }) {
  return (
    <div className="gc-modal-overlay">
      <div className="gc-modal">
        <div className="gc-modal__header">
          <Trash2 size={20} color="var(--rojo)" />
          <h3 className="gc-modal__titulo">Eliminar cliente</h3>
        </div>
        <p className="gc-modal__desc">
          ¿Seguro que quieres eliminar a <strong className="gc-modal__strong">"{nombre}"</strong>?
        </p>
        <p className="gc-modal__aviso">
          Se borrarán todos sus usuarios, licitaciones guardadas y resúmenes IA. Esta acción no se puede deshacer.
        </p>
        <div className="gc-modal__actions">
          <button onClick={onCancel} disabled={eliminando} className="gc-btn-cancelar">Cancelar</button>
          <button onClick={onConfirm} disabled={eliminando} className="gc-btn-confirmar">
            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
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

  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

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

  const eliminarCliente = async () => {
    setEliminando(true)
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`, { method: 'DELETE' })
      const datos = await res.json()
      if (!res.ok) { setError(datos.error || 'No se ha podido eliminar el cliente'); setConfirmarEliminar(false); return }
      onGuardado()
      onVolver()
    } catch {
      setError('No se ha podido conectar con el servidor')
      setConfirmarEliminar(false)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="gc-detalle">
      <div className="gc-detalle__nav">
        <button onClick={onVolver} className="gc-btn-volver">
          <ArrowLeft size={16} />
          Volver a la lista
        </button>
        {detalle && <BadgeEstado activa={detalle.activa} />}
      </div>

      {detalle && (
        <div className="gc-empresa-header">
          <div className="gc-empresa-avatar">
            <Building2 size={22} color="var(--verde)" />
          </div>
          <div>
            <h2 className="gc-empresa-nombre">{detalle.nombre}</h2>
            <span className="gc-empresa-alta">Alta: {formatFecha(detalle.createdAt) || '—'}</span>
          </div>
        </div>
      )}

      {cargando && <p className="gc-cargando">Cargando...</p>}

      {error && (
        <div className="gc-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {detalle && (
        <>
          {/* Cuenta */}
          <div className="gc-card">
            <h3 className="gc-card__titulo">Cuenta</h3>

            <div className="gc-datos-grid">
              <FilaDato label="Nombre empresa" valor={detalle.nombre} />
              <FilaDato label="CIF" valor={detalle.cif} />
              <FilaDato label="Dirección" valor={detalle.direccion} />
              <FilaDato label="Email de contacto" valor={detalle.emailContacto} />
              <FilaDato label="Teléfono" valor={detalle.telefono} />
            </div>

            <div className="gc-plan-grid">
              <div>
                <label className="gc-campo-label">Plan</label>
                <input
                  type="text"
                  value={plan}
                  maxLength={50}
                  onChange={(e) => setPlan(e.target.value)}
                  className="gc-input"
                />
              </div>
              <div className="gc-estado-col">
                <span className="gc-estado-label">Estado</span>
                <div className="gc-estado-row">
                  <span className="gc-estado-text">{activa ? 'Activa' : 'Inactiva'}</span>
                  <button
                    onClick={() => setActiva(a => !a)}
                    className={`gc-toggle ${activa ? 'gc-toggle--on' : 'gc-toggle--off'}`}
                  >
                    <span className={`gc-toggle__thumb ${activa ? 'gc-toggle__thumb--on' : 'gc-toggle__thumb--off'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="gc-acciones-row">
              <button onClick={guardar} disabled={guardando} className="gc-btn-guardar">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {mensajeGuardado && <span className="gc-msg-guardado">{mensajeGuardado}</span>}
            </div>

            {/* Usuarios de la empresa */}
            <div className="gc-usuarios-seccion">
              <h4 className="gc-usuarios-titulo">Usuarios ({detalle.usuarios.length})</h4>
              <div className="gc-usuarios-lista">
                {detalle.usuarios.map(u => (
                  <div key={u.id} className="gc-usuario-fila">
                    <div className="gc-usuario-inner">
                      <div className="gc-usuario-avatar">{iniciales(u.nombre)}</div>
                      <div className="gc-usuario-datos">
                        <div className="gc-usuario-nombre">{u.nombre}</div>
                        <div className="gc-usuario-email">{u.email}</div>
                      </div>
                      <span className="gc-usuario-rol">{u.rol}</span>
                      <span
                        className={`gc-usuario-dot ${u.activo ? 'gc-usuario-dot--activo' : 'gc-usuario-dot--inactivo'}`}
                        title={u.activo ? 'Activo' : 'Inactivo'}
                      />
                    </div>
                    <ResetPasswordRow authFetch={authFetch} clienteId={clienteId} usuarioId={u.id} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div className="gc-card gc-card--gap12">
            <h3 className="gc-card__titulo">Preferencias configuradas</h3>
            {!detalle.preferencias ? (
              <p className="gc-pref-sin-datos">Sin preferencias configuradas todavía.</p>
            ) : (
              <div className="gc-pref-grid">
                <div>
                  <span className="gc-pref-label">Tipos de obra</span>
                  {(detalle.preferencias.tiposObra || []).join(', ') || '—'}
                </div>
                <div>
                  <span className="gc-pref-label">Provincias</span>
                  {(detalle.preferencias.provincias || []).join(', ') || '—'}
                </div>
                <div>
                  <span className="gc-pref-label">Importe mínimo</span>
                  {detalle.preferencias.importeMin != null ? `${formatImporte(detalle.preferencias.importeMin)} €` : '—'}
                </div>
                <div>
                  <span className="gc-pref-label">Importe máximo</span>
                  {detalle.preferencias.importeMax != null ? `${formatImporte(detalle.preferencias.importeMax)} €` : '—'}
                </div>
                <div>
                  <span className="gc-pref-label">Frecuencia de alerta</span>
                  {detalle.preferencias.frecuenciaAlerta || '—'}
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="gc-card gc-email-card">
            <h3 className="gc-card__titulo">Enviar email al cliente</h3>
            <div>
              <label className="gc-email-form-label">Asunto</label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del email"
                className="gc-input"
              />
            </div>
            <div>
              <label className="gc-email-form-label">Mensaje</label>
              <textarea
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Escribe aquí el mensaje para el cliente..."
                rows={5}
                className="gc-textarea"
              />
            </div>
            <div className="gc-email-row">
              <button onClick={enviarEmail} disabled={enviando} className="gc-btn-email">
                <Mail size={15} />
                {enviando ? 'Enviando...' : 'Enviar email'}
              </button>
              {mensajeEmail && (
                <span className={`gc-email-msg ${mensajeEmail.includes('correctamente') ? 'gc-email-msg--ok' : 'gc-email-msg--error'}`}>
                  {mensajeEmail}
                </span>
              )}
            </div>
          </div>

          {/* Eliminar cliente */}
          <div className="gc-card gc-card--peligro">
            <h3 className="gc-card__titulo gc-card__titulo--rojo">Eliminar cliente</h3>
            <p className="gc-eliminar-desc">
              Elimina permanentemente esta empresa y todos sus datos: usuarios, licitaciones guardadas y resúmenes IA.
            </p>
            <div>
              <button onClick={() => setConfirmarEliminar(true)} className="gc-btn-eliminar-trigger">
                <Trash2 size={15} />
                Eliminar cliente
              </button>
            </div>
          </div>
        </>
      )}

      {confirmarEliminar && detalle && (
        <ModalEliminarCliente
          nombre={detalle.nombre}
          eliminando={eliminando}
          onConfirm={eliminarCliente}
          onCancel={() => setConfirmarEliminar(false)}
        />
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
          <div className="gc-lista-header">
            <button onClick={cargar} disabled={cargando} className="gc-btn-actualizar">
              <RefreshCw size={15} className={cargando ? 'spin-icon' : ''} />
              Actualizar
            </button>
          </div>

          {error && (
            <div className="gc-error-banner gc-error-banner--mb">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="gc-tabla-wrap">
            <table className="gc-tabla">
              <thead>
                <tr>
                  {['Nombre', 'Plan', 'Precio', 'Estado', 'Fecha de alta'].map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr className="gc-tabla__fila-vacia">
                    <td colSpan={5}>No hay clientes registrados todavía.</td>
                  </tr>
                ) : (
                  clientes.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setClienteSeleccionado(c.id)}
                      className="gc-tabla__fila"
                    >
                      <td className="gc-tabla__td--nombre">{c.nombre}</td>
                      <td className="gc-tabla__td--gris">{c.plan}</td>
                      <td className="gc-tabla__td--gris">{c.precioMensual != null ? `${formatImporte(c.precioMensual)} €` : '—'}</td>
                      <td><BadgeEstado activa={c.activa} /></td>
                      <td className="gc-tabla__td--gris">{formatFecha(c.createdAt) || '—'}</td>
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
