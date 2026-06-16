import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Save, Search, Info, CheckCircle, X,
  BarChart2, TrendingUp, Database, Cloud, Table2, Mail,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'

const TABS = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'preferencias', label: 'Preferencias' },
  { id: 'notificaciones', label: 'Notificaciones' },
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

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--n100)',
  fontSize: 14,
  color: 'var(--n900)',
  background: 'var(--gris-fondo)',
}

function Card({ title, subtitle, children }) {
  return (
    <section style={{
      background: '#fff',
      borderRadius: 'var(--r-xl)',
      border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)',
      padding: '22px 24px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: 18 }}>
        {children}
      </div>
    </section>
  )
}

function Campo({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function BotonGuardar({ onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 28px',
          borderRadius: 'var(--r-md)',
          background: 'var(--verde)',
          color: '#fff',
          fontSize: 14, fontWeight: 700,
          fontFamily: 'var(--font-body)',
          transition: 'background var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde-medio)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde)')}
      >
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
      style={{
        width: 44, height: 24, borderRadius: 100, flexShrink: 0,
        border: 'none', position: 'relative',
        background: checked ? 'var(--verde)' : 'var(--n100)',
        transition: 'background var(--transition)',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left var(--transition)',
      }} />
    </button>
  )
}

function TabPerfil({ mostrarToast }) {
  const [nombre, setNombre] = useState('Constructora García S.L.')
  const [cif, setCif] = useState('B12345678')
  const [email, setEmail] = useState('info@constructoragarcia.es')
  const [telefono, setTelefono] = useState('948 123 456')

  return (
    <Card title="Datos de la empresa" subtitle="Esta información se usa para personalizar tu panel">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Campo label="Nombre de la empresa" value={nombre} onChange={setNombre} />
        <Campo label="CIF" value={cif} onChange={setCif} />
        <Campo label="Email de contacto" value={email} onChange={setEmail} type="email" />
        <Campo label="Teléfono" value={telefono} onChange={setTelefono} />
      </div>
      <div style={{ marginTop: 20 }}>
        <BotonGuardar onClick={() => mostrarToast('Datos de la empresa guardados')} />
      </div>
    </Card>
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
  const [cpvQuery, setCpvQuery] = useState('')
  const [cpvResultados, setCpvResultados] = useState(null)
  const [licitaciones, setLicitaciones] = useState([])

  useEffect(() => {
    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => setLicitaciones(data.licitaciones || []))
      .catch(() => {})
  }, [])

  const toggleTipo = (tipo) => {
    setTiposObra(prev => ({ ...prev, [tipo]: !prev[tipo] }))
  }

  const toggleProvincia = (provincia) => {
    setProvinciasActivas(prev => ({ ...prev, [provincia]: !prev[provincia] }))
  }

  const buscarCPV = () => {
    const q = cpvQuery.trim()
    if (!q) { setCpvResultados([]); return }
    setCpvResultados(licitaciones.filter(l => l.cpv?.includes(q)).slice(0, 8))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      <Card title="Tipo de obra" subtitle="Selecciona los tipos de licitación que te interesan">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 16px' }}>
          {TIPOS_OBRA.map(tipo => (
            <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--n700)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={tiposObra[tipo]}
                onChange={() => toggleTipo(tipo)}
                style={{ width: 16, height: 16, accentColor: '#3D7A4F' }}
              />
              {tipo}
            </label>
          ))}
        </div>
      </Card>

      <Card title="Provincias" subtitle="Elige las provincias donde buscar licitaciones">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROVINCIAS.map(p => {
            const activa = provinciasActivas[p]
            return (
              <button
                key={p}
                onClick={() => toggleProvincia(p)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  border: `1px solid ${activa ? 'var(--verde)' : 'var(--n100)'}`,
                  background: activa ? 'var(--verde-claro)' : '#fff',
                  color: activa ? 'var(--verde)' : 'var(--n500)',
                  transition: 'all var(--transition)',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="Importe de la licitación" subtitle="Define el rango de presupuesto que te interesa">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Desde
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={formatMiles(importeDesde)}
                onChange={(e) => setImporteDesde(soloDigitos(e.target.value))}
                style={{ ...inputStyle, paddingRight: 32 }}
                inputMode="numeric"
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--n400)' }}>€</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Hasta
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={formatMiles(importeHasta)}
                onChange={(e) => setImporteHasta(soloDigitos(e.target.value))}
                style={{ ...inputStyle, paddingRight: 32 }}
                inputMode="numeric"
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--n400)' }}>€</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Plazo de presentación" subtitle="¿Con cuánta antelación quieres ver las licitaciones?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLAZOS.map(p => (
            <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--n700)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="plazo"
                value={p.value}
                checked={plazo === p.value}
                onChange={() => setPlazo(p.value)}
                style={{ width: 16, height: 16, accentColor: '#3D7A4F' }}
              />
              {p.label}
            </label>
          ))}
        </div>
      </Card>

      <Card title="Búsqueda por código CPV" subtitle="Filtra licitaciones del radar por código CPV concreto">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={cpvQuery}
            onChange={(e) => setCpvQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') buscarCPV() }}
            placeholder="Ej. 45000000"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          />
          <button
            onClick={buscarCPV}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--r-md)',
              background: 'var(--verde-medio)',
              color: '#fff',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-body)',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde-medio)')}
          >
            <Search size={15} />
            Buscar
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
          <Info size={14} color="var(--n400)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--n400)', margin: 0, lineHeight: 1.5 }}>
            Los códigos CPV identifican el tipo de obra (por ejemplo, 72000000 corresponde a servicios
            de tecnologías de la información). Puedes buscar por el código completo o solo por su prefijo.
          </p>
        </div>

        {cpvResultados !== null && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cpvResultados.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--n400)' }}>
                No se han encontrado licitaciones con ese código CPV.
              </span>
            ) : cpvResultados.map((l, i) => (
              <div
                key={l.expediente || i}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--gris-fondo)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--negro)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {l.titulo || 'Sin título'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--n400)', flexShrink: 0 }}>
                  {l.provincia || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BotonGuardar onClick={() => mostrarToast('Preferencias guardadas')} />
    </div>
  )
}

function TabNotificaciones({ mostrarToast }) {
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_INICIAL)

  const toggle = (id) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, valor: !n.valor } : n))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <Card title="Notificaciones" subtitle="Elige cómo quieres que LiciTracker te avise">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {notificaciones.map((n, i) => (
            <div
              key={n.id}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                paddingBottom: i < notificaciones.length - 1 ? 18 : 0,
                borderBottom: i < notificaciones.length - 1 ? '1px solid var(--n50)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{n.label}</div>
                <div style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4 }}>{n.descripcion}</div>
              </div>
              <Toggle checked={n.valor} onChange={() => toggle(n.id)} />
            </div>
          ))}
        </div>
      </Card>

      <BotonGuardar onClick={() => mostrarToast('Preferencias de notificaciones guardadas')} />
    </div>
  )
}

function ConectorCard({ conector, onConectar }) {
  const Icon = conector.icon
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-lg)',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-md)',
        background: `${conector.color}1A`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={conector.color} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-titulo)', fontWeight: 700, fontSize: 14, color: 'var(--negro)' }}>
          {conector.nombre}
        </div>
        <div style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4 }}>
          {conector.descripcion}
        </div>
      </div>

      {conector.accion === 'proximamente' && (
        <span style={{
          alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 100,
          background: 'var(--n100)', color: 'var(--n400)', fontSize: 11, fontWeight: 700,
        }}>
          Próximamente
        </span>
      )}

      {conector.accion === 'activo' && (
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)' }}>
          ✓ Activo
        </span>
      )}

      {(conector.accion === 'Conectar' || conector.accion === 'Exportar') && (
        <button
          onClick={() => onConectar(conector)}
          style={{
            alignSelf: 'flex-start', padding: '7px 16px',
            borderRadius: 'var(--r-md)', background: conector.color, color: '#fff',
            fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}
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
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(17,25,23,0.55)',
              backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
              zIndex: 100,
            }}
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(440px, 90vw)', background: '#fff', borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-hover)', zIndex: 101, padding: '28px 28px 24px',
            }}
          >
            <button
              onClick={onCerrar}
              style={{ position: 'absolute', top: 16, right: 16, color: 'var(--n300)' }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r-md)',
                background: `${conector.color}1A`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <conector.icon size={20} color={conector.color} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
                Conectar con {conector.nombre}
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--n500)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Para conectar LiciTracker con {conector.nombre}, haz clic en el botón de abajo.
              Te pedirá que inicies sesión en {conector.nombre} y aceptes los permisos. Tarda 2 minutos.
            </p>

            <button
              onClick={onCerrar}
              style={{
                width: '100%', padding: '11px', borderRadius: 'var(--r-md)',
                background: 'var(--verde)', color: '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              }}
            >
              Ir a conectar
            </button>
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
      <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 20, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
        Conecta tu programa de gestión
      </h2>
      <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 6, marginBottom: 24, maxWidth: 640 }}>
        Si ya usas un programa, conéctalo aquí en 2 minutos. Si no tienes ninguno, LiciTracker ya incluye su propio panel.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
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
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--n100)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 20px', marginBottom: -1,
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              color: tab === t.id ? 'var(--negro)' : 'var(--n400)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--verde)' : 'transparent'}`,
              transition: 'color var(--transition), border-color var(--transition)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && <TabPerfil mostrarToast={mostrarToast} />}
      {tab === 'preferencias' && <TabPreferencias mostrarToast={mostrarToast} />}
      {tab === 'notificaciones' && <TabNotificaciones mostrarToast={mostrarToast} />}
      {tab === 'crm' && <TabCRM />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 24, right: 24,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--negro)', color: '#fff',
              padding: '12px 20px',
              borderRadius: 'var(--r-md)',
              fontSize: 13, fontWeight: 600,
              boxShadow: 'var(--shadow-hover)',
              zIndex: 100,
            }}
          >
            <CheckCircle size={16} color="var(--g500)" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
