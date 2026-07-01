import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Save, CheckCircle, X,
  BarChart2, TrendingUp, Database, Cloud, Table2, Mail, Trash2,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/pages/Configuracion.css'

const TABS = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'preferencias', label: 'Preferencias' },
  { id: 'crm', label: 'Integrar CRM' },
]

const TIPOS_OBRA = [
  'Obra civil', 'Pavimentación', 'Urbanización',
  'Edificación', 'Rehabilitación', 'Instalaciones',
  'Demolición', 'Ingeniería civil', 'Obras especiales',
]

const PROVINCIAS = [
  'Navarra', 'La Rioja', 'País Vasco', 'Aragón', 'Madrid',
  'Cataluña', 'Andalucía', 'Valencia', 'Galicia', 'Castilla y León',
]

const PROVINCIAS_ACTIVAS_INICIAL = ['Navarra', 'La Rioja', 'País Vasco']

const PLAZOS = [
  { value: 'urgente', label: 'Urgente (menos de 7 días)' },
  { value: 'proximo', label: 'Próximo (7 a 14 días)' },
  { value: 'enplazo', label: 'En plazo (más de 14 días)' },
  { value: 'todos', label: 'Todos' },
]

const NOTIFICACIONES_INICIAL = [
  { id: 'email-nuevas', label: 'Nuevas licitaciones por email', descripcion: 'Recibe un correo cuando aparezcan licitaciones que coincidan con tus preferencias', valor: true },
  { id: 'alertas-plazo', label: 'Alertas de fechas próximas (3 días)', descripcion: 'Aviso cuando el plazo de una licitación guardada esté a 3 días o menos de vencer', valor: true },
  { id: 'resumen-semanal', label: 'Resumen semanal', descripcion: 'Un correo semanal con un resumen de la actividad y nuevas oportunidades', valor: false },
  { id: 'notif-navegador', label: 'Notificaciones en el navegador', descripcion: 'Avisos emergentes mientras tienes LiciTracker abierto', valor: true },
]

const CONECTORES = [
  { nombre: 'HubSpot', icon: BarChart2, color: '#FF7A59', descripcion: 'El más usado en España', accion: 'Conectar' },
  { nombre: 'Pipedrive', icon: TrendingUp, color: '#28A745', descripcion: 'Ideal para equipos pequeños', accion: 'Conectar' },
  { nombre: 'Zoho CRM', icon: Database, color: '#E42527', descripcion: 'Opción económica para pymes', accion: 'Conectar' },
  { nombre: 'Salesforce', icon: Cloud, color: '#00A1E0', descripcion: 'Para empresas grandes', accion: 'proximamente' },
  { nombre: 'Excel / Sheets', icon: Table2, color: '#217346', descripcion: 'Exportar a hoja de cálculo', accion: 'Exportar' },
  { nombre: 'Solo email', icon: Mail, color: '#3D7A4F', descripcion: 'Ya está activado', accion: 'activo' },
]

function formatMiles(valor) {
  if (!valor) return ''
  return Number(valor).toLocaleString('es-ES')
}

function soloDigitos(texto) {
  return texto.replace(/\D/g, '')
}

function Card({ title, subtitle, children }) {
  return (
    <section className="cfg-card">
      <h3 className="cfg-card__titulo">{title}</h3>
      {subtitle && <p className="cfg-card__subtitulo">{subtitle}</p>}
      <div className="cfg-card__body">{children}</div>
    </section>
  )
}

function Campo({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="cfg-campo-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="cfg-input" />
    </div>
  )
}

function BotonGuardar({ onClick }) {
  return (
    <div className="cfg-btn-guardar-wrap">
      <button onClick={onClick} className="cfg-btn-guardar">
        <Save size={16} />
        Guardar cambios
      </button>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`cfg-toggle ${checked ? 'cfg-toggle--on' : 'cfg-toggle--off'}`}
    >
      <span className={`cfg-toggle__thumb ${checked ? 'cfg-toggle__thumb--on' : 'cfg-toggle__thumb--off'}`} />
    </button>
  )
}

function TabPerfil({ mostrarToast }) {
  const { authFetch, logout } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('Constructora García S.L.')
  const [cif, setCif] = useState('B12345678')
  const [email, setEmail] = useState('info@constructoragarcia.es')
  const [telefono, setTelefono] = useState('948 123 456')

  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const eliminarCuenta = async () => {
    setEliminando(true)
    setErrorEliminar('')
    try {
      const res = await authFetch('/api/mi-cuenta', { method: 'DELETE' })
      const datos = await res.json()
      if (!res.ok) { setErrorEliminar(datos.error || 'No se ha podido eliminar la cuenta'); return }
      logout()
      navigate('/login', { replace: true })
    } catch {
      setErrorEliminar('No se ha podido conectar con el servidor')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="cfg-perfil">
      <Card title="Datos de la empresa" subtitle="Esta información se usa para personalizar tu panel">
        <div className="cfg-campos-grid">
          <Campo label="Nombre de la empresa" value={nombre} onChange={setNombre} />
          <Campo label="CIF" value={cif} onChange={setCif} />
          <Campo label="Email de contacto" value={email} onChange={setEmail} type="email" />
          <Campo label="Teléfono" value={telefono} onChange={setTelefono} />
        </div>
        <div className="cfg-campos-mt">
          <BotonGuardar onClick={() => mostrarToast('Datos de la empresa guardados')} />
        </div>
      </Card>

      {/* Eliminar cuenta */}
      <div className="cfg-card cfg-card--peligro">
        <h3 className="cfg-card__titulo--rojo">Eliminar cuenta</h3>
        <p className="cfg-eliminar-desc">
          Elimina permanentemente tu cuenta y todos los datos asociados: usuarios, licitaciones guardadas y resúmenes IA. Esta acción no se puede deshacer.
        </p>
        {!confirmarEliminar ? (
          <button onClick={() => setConfirmarEliminar(true)} className="cfg-btn-eliminar">
            <Trash2 size={15} />
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="cfg-eliminar-confirmar">
            <p className="cfg-eliminar-aviso">
              ¿Estás seguro? Esta acción eliminará todos tus datos de forma permanente.
            </p>
            <div className="cfg-eliminar-acciones">
              <button
                onClick={() => { setConfirmarEliminar(false); setErrorEliminar('') }}
                disabled={eliminando}
                className="cfg-btn-cancelar"
              >
                Cancelar
              </button>
              <button onClick={eliminarCuenta} disabled={eliminando} className="cfg-btn-confirmar-rojo">
                {eliminando ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </button>
            </div>
            {errorEliminar && <span className="cfg-error-eliminar">{errorEliminar}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function TabPreferencias({ mostrarToast }) {
  const [tiposObra, setTiposObra] = useState(
    () => Object.fromEntries(TIPOS_OBRA.map(t => [t, true]))
  )
  const [provinciasActivas, setProvinciasActivas] = useState(
    () => Object.fromEntries(PROVINCIAS.map(p => [p, PROVINCIAS_ACTIVAS_INICIAL.includes(p)]))
  )
  const [importeDesde, setImporteDesde] = useState('30000')
  const [importeHasta, setImporteHasta] = useState('500000')
  const [plazo, setPlazo] = useState('todos')
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_INICIAL)

  const toggleTipo = (tipo) => setTiposObra(prev => ({ ...prev, [tipo]: !prev[tipo] }))
  const toggleProvincia = (provincia) => setProvinciasActivas(prev => ({ ...prev, [provincia]: !prev[provincia] }))
  const toggleNotificacion = (id) => setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, valor: !n.valor } : n))

  return (
    <div>
      <div className="cfg-pref-cabecera">
        <h2 className="cfg-pref-titulo">Qué te interesa recibir por email</h2>
        <p className="cfg-pref-subtitulo">
          Define los criterios de las licitaciones que quieres que LiciTracker te avise por correo,
          y cómo quieres recibir esos avisos.
        </p>
      </div>

      <div className="cfg-pref-layout">
        {/* Columna principal */}
        <div className="cfg-pref-col">
          <Card title="Tipo de obra" subtitle="Selecciona los tipos de licitación que te interesan">
            <div className="cfg-tipos-grid">
              {TIPOS_OBRA.map(tipo => (
                <label key={tipo} className="cfg-tipo-label">
                  <input
                    type="checkbox"
                    checked={tiposObra[tipo]}
                    onChange={() => toggleTipo(tipo)}
                    className="cfg-tipo-checkbox"
                  />
                  {tipo}
                </label>
              ))}
            </div>
          </Card>

          <Card title="Provincias" subtitle="Elige las provincias donde buscar licitaciones">
            <div className="cfg-provincias-wrap">
              {PROVINCIAS.map(p => {
                const activa = provinciasActivas[p]
                return (
                  <button
                    key={p}
                    onClick={() => toggleProvincia(p)}
                    className={`cfg-provincia-btn ${activa ? 'cfg-provincia-btn--activa' : 'cfg-provincia-btn--inactiva'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="cfg-importe-plazos-grid">
            <Card title="Importe de la licitación" subtitle="Rango de presupuesto que te interesa">
              <div className="cfg-importe-row">
                <div className="cfg-importe-col">
                  <label className="cfg-campo-label">Desde</label>
                  <div className="cfg-importe-input-wrap">
                    <input
                      value={formatMiles(importeDesde)}
                      onChange={(e) => setImporteDesde(soloDigitos(e.target.value))}
                      className="cfg-input cfg-input--pr"
                      inputMode="numeric"
                    />
                    <span className="cfg-importe-euro">€</span>
                  </div>
                </div>
                <div className="cfg-importe-col">
                  <label className="cfg-campo-label">Hasta</label>
                  <div className="cfg-importe-input-wrap">
                    <input
                      value={formatMiles(importeHasta)}
                      onChange={(e) => setImporteHasta(soloDigitos(e.target.value))}
                      className="cfg-input cfg-input--pr"
                      inputMode="numeric"
                    />
                    <span className="cfg-importe-euro">€</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Plazo de presentación" subtitle="¿Con cuánta antelación quieres verlas?">
              <div className="cfg-plazos">
                {PLAZOS.map(p => (
                  <label key={p.value} className="cfg-plazo-label">
                    <input
                      type="radio"
                      name="plazo"
                      value={p.value}
                      checked={plazo === p.value}
                      onChange={() => setPlazo(p.value)}
                      className="cfg-plazo-radio"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <BotonGuardar onClick={() => mostrarToast('Preferencias guardadas')} />
        </div>

        {/* Columna lateral */}
        <Card title="Notificaciones" subtitle="Cómo quieres que te avisemos">
          <div className="cfg-notif-lista">
            {notificaciones.map((n, i) => (
              <div
                key={n.id}
                className={`cfg-notif-item${i < notificaciones.length - 1 ? ' cfg-notif-item--separado' : ''}`}
              >
                <div>
                  <div className="cfg-notif-label">{n.label}</div>
                  <div className="cfg-notif-desc">{n.descripcion}</div>
                </div>
                <Toggle checked={n.valor} onChange={() => toggleNotificacion(n.id)} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ConectorCard({ conector, onConectar }) {
  const Icon = conector.icon
  return (
    <div className="cfg-conector-card">
      <div
        className="cfg-conector-icon-wrap"
        style={{ background: `${conector.color}1A` }}
      >
        <Icon size={20} color={conector.color} />
      </div>
      <div>
        <div className="cfg-conector-nombre">{conector.nombre}</div>
        <div className="cfg-conector-desc">{conector.descripcion}</div>
      </div>

      {conector.accion === 'proximamente' && (
        <span className="cfg-badge-proximo">Próximamente</span>
      )}
      {conector.accion === 'activo' && (
        <span className="cfg-badge-activo">✓ Activo</span>
      )}
      {(conector.accion === 'Conectar' || conector.accion === 'Exportar') && (
        <button
          onClick={() => onConectar(conector)}
          className="cfg-btn-conectar"
          style={{ background: conector.color }}
        >
          {conector.accion}
        </button>
      )}
    </div>
  )
}

function ModalConectar({ conector, onCerrar }) {
  return (
    <AnimatePresence>
      {conector && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCerrar}
            className="cfg-modal-overlay"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="cfg-modal"
          >
            <button onClick={onCerrar} className="cfg-modal__cerrar" aria-label="Cerrar">
              <X size={18} />
            </button>

            <div className="cfg-modal__header">
              <div className="cfg-modal__icon-wrap" style={{ background: `${conector.color}1A` }}>
                <conector.icon size={20} color={conector.color} />
              </div>
              <h3 className="cfg-modal__titulo">Conectar con {conector.nombre}</h3>
            </div>

            <p className="cfg-modal__desc">
              Para conectar LiciTracker con {conector.nombre}, haz clic en el botón de abajo.
              Te pedirá que inicies sesión en {conector.nombre} y aceptes los permisos. Tarda 2 minutos.
            </p>

            <button onClick={onCerrar} className="cfg-modal__btn">Ir a conectar</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function TabCRM() {
  const [conector, setConector] = useState(null)

  return (
    <div>
      <h2 className="cfg-crm-titulo">Conecta tu programa de gestión</h2>
      <p className="cfg-crm-subtitulo">
        Si ya usas un programa, conéctalo aquí en 2 minutos. Si no tienes ninguno, LiciTracker ya incluye su propio panel.
      </p>

      <div className="cfg-crm-grid">
        {CONECTORES.map(c => (
          <ConectorCard key={c.nombre} conector={c} onConectar={setConector} />
        ))}
      </div>

      <ModalConectar conector={conector} onCerrar={() => setConector(null)} />
    </div>
  )
}

export default function Configuracion() {
  const [tab, setTab] = useState('perfil')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Configuración'
    return () => { document.title = tituloPrevio }
  }, [])

  const mostrarToast = (mensaje) => {
    setToast(mensaje)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <DashboardLayout title="Configuración">
      <div className="cfg-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`cfg-tab${tab === t.id ? ' cfg-tab--activo' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && <TabPerfil mostrarToast={mostrarToast} />}
      {tab === 'preferencias' && <TabPreferencias mostrarToast={mostrarToast} />}
      {tab === 'crm' && <TabCRM />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="cfg-toast"
          >
            <CheckCircle size={16} color="var(--g500)" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
