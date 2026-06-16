import { useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import { Save } from 'lucide-react'

const TABS = [
  { id: 'perfil',         label: 'Perfil' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'crm',            label: 'Integrar CRM' },
]

const TIPOS_OBRA = [
  'Obra civil','Pavimentación','Urbanización','Edificación',
  'Rehabilitación','Instalaciones','Demolición','Ingeniería civil','Obras especiales',
]

const PROVINCIAS = [
  'Navarra','La Rioja','País Vasco','Aragón','Madrid',
  'Cataluña','Andalucía','Valencia','Galicia','Castilla y León',
]

const PROVINCIAS_ACTIVAS_INICIAL = ['Navarra','La Rioja','País Vasco']

const PLAZOS = [
  { value: 'urgente', label: 'Urgente (menos de 7 días)' },
  { value: 'proximo', label: 'Próximo (7 a 14 días)' },
  { value: 'enplazo', label: 'En plazo (más de 14 días)' },
  { value: 'todos',   label: 'Todos' },
]

const NOTIFS_INICIAL = [
  { id: 'email-nuevas',    label: 'Nuevas licitaciones por email', descripcion: 'Recibe un correo cuando aparezcan licitaciones que coincidan con tus preferencias', valor: true },
  { id: 'alertas-plazo',   label: 'Alertas de fechas próximas (3 días)', descripcion: 'Aviso cuando el plazo de una licitación guardada esté a 3 días o menos de vencer', valor: true },
  { id: 'resumen-semanal', label: 'Resumen semanal', descripcion: 'Un correo semanal con un resumen de actividad y nuevas oportunidades', valor: false },
  { id: 'notif-navegador', label: 'Notificaciones en el navegador', descripcion: 'Avisos emergentes mientras tienes LiciTraker abierto', valor: true },
]

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">{children}</p>
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150',
        active
          ? 'bg-brand-light text-brand border-brand-mid'
          : 'bg-surface text-ink-2 border-border hover:border-border-strong',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors duration-150',
          checked ? 'bg-brand' : 'bg-muted',
        ].join(' ')}
      >
        <span className={[
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150',
          checked ? 'left-[18px]' : 'left-0.5',
        ].join(' ')} />
      </button>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  )
}

function SaveButton() {
  return (
    <div className="flex justify-end pt-4 mt-4 border-t border-border">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors"
      >
        <Save size={14} />
        Guardar cambios
      </button>
    </div>
  )
}

export default function Configuracion() {
  const [tab, setTab] = useState('perfil')
  const [provinciasActivas, setProvinciasActivas] = useState(new Set(PROVINCIAS_ACTIVAS_INICIAL))
  const [tiposActivos, setTiposActivos] = useState(new Set(['Obra civil', 'Pavimentación']))
  const [plazosActivos, setPlazosActivos] = useState(new Set(['todos']))
  const [notificaciones, setNotificaciones] = useState(NOTIFS_INICIAL)
  const [importeMin, setImporteMin] = useState('30000')

  function toggleSet(setter, value) {
    setter(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  function toggleNotif(id) {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, valor: !n.valor } : n))
  }

  return (
    <DashboardLayout title="Configuración">
      <div style={{ maxWidth: 720 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        <div className="pt-6">
          {tab === 'perfil' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Nombre de empresa</label>
                <input
                  type="text"
                  defaultValue="Constructora García"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Nombre de contacto</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <SaveButton />
            </div>
          )}

          {tab === 'notificaciones' && (
            <div>
              {notificaciones.map(n => (
                <Toggle
                  key={n.id}
                  checked={n.valor}
                  onChange={() => toggleNotif(n.id)}
                  label={n.label}
                  description={n.descripcion}
                />
              ))}
              <SaveButton />
            </div>
          )}

          {tab === 'crm' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-3">
                Conecta LiciTraker con tu CRM para sincronizar licitaciones automáticamente.
              </p>
              {['HubSpot', 'Salesforce', 'Pipedrive'].map(crm => (
                <div key={crm} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <p className="text-sm font-medium text-ink">{crm}</p>
                  <button className="px-3 py-1.5 rounded-md text-xs font-semibold border border-border text-ink-2 hover:border-brand hover:text-brand transition-colors">
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
