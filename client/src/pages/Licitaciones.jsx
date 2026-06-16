import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX, WifiOff, Sparkles, Bookmark, BookmarkCheck, Hash, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import Badge from '../components/ui/Badge.jsx'
import SlideOver from '../components/ui/SlideOver.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { tipoBadge, diasRestantes, formatImporte } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'

const BADGE_VARIANT = {
  urgente:  'urgente',
  proximo:  'proximo',
  enplazo:  'enplazo',
  sinplazo: 'sinplazo',
}

const IMPORTES = [
  { value: '',       label: 'Todos los importes' },
  { value: 'menos50', label: '< 50.000 €' },
  { value: '50a200',  label: '50.000 – 200.000 €' },
  { value: '200a1m',  label: '200.000 – 1.000.000 €' },
  { value: 'mas1m',   label: '> 1.000.000 €' },
]

function DetalleLicitacion({ licitacion: l, guardada, onToggleGuardar, onResumenIA }) {
  if (!l) return null
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)
  const variant = BADGE_VARIANT[tipoBadge(l.fechaLimite)] ?? 'neutral'

  const campo = (label, valor) => (
    <div className="py-3 border-b border-border last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-1">{label}</p>
      <p className="text-sm text-ink leading-relaxed">{valor || '—'}</p>
    </div>
  )

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <Badge variant={variant}>
          {tipoBadge(l.fechaLimite)}{dias !== null ? ` · ${dias}d` : ''}
        </Badge>
      </div>

      <h3 className="text-base font-semibold text-ink leading-snug mb-5">{l.titulo}</h3>

      <div className="flex gap-2 mb-6">
        <button
          onClick={onResumenIA}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-colors"
        >
          <Sparkles size={13} />
          Resumen IA
        </button>
        <button
          onClick={onToggleGuardar}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors',
            guardada
              ? 'bg-brand-light text-brand border-brand-mid hover:bg-brand-mid'
              : 'bg-subtle text-ink-2 border-border hover:bg-muted',
          ].join(' ')}
        >
          {guardada ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {guardada ? 'Guardada' : 'Guardar'}
        </button>
      </div>

      <div>
        {campo('Organismo', l.organismo)}
        {campo('Provincia', l.provincia)}
        {campo('Presupuesto', importe ? `${importe} €` : null)}
        {campo('Fecha límite', l.fechaLimite)}
        {campo('Expediente', l.expediente)}
        {campo('Código CPV', l.cpv)}
        {l.descripcion && campo('Descripción', l.descripcion)}
      </div>
    </div>
  )
}

export default function Licitaciones() {
  const navigate = useNavigate()
  const { licitacionesGuardadas, guardarLicitacion, quitarLicitacion } = useApp()

  const [licitaciones, setLicitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroImporte, setFiltroImporte] = useState('')
  const [filtroProvincia, setFiltroProvincia] = useState('')

  const [cpvQuery, setCpvQuery] = useState('')
  const [cpvResultados, setCpvResultados] = useState(null)
  const [cpvCargando, setCpvCargando] = useState(false)
  const [cpvBuscadoCodigo, setCpvBuscadoCodigo] = useState('')
  const [cpvError, setCpvError] = useState(null)

  const cargarDatos = useCallback(() => {
    fetch('/api/licitaciones')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLicitaciones(d.licitaciones || []); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    document.title = 'LiciTraker · Licitaciones'
    cargarDatos()
    return () => { document.title = 'LiciTraker' }
  }, [cargarDatos])

  const actualizar = () => {
    setCargando(true); setError(null)
    fetch('/api/licitaciones?refresh=1')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLicitaciones(d.licitaciones || []) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }

  const buscarCPV = useCallback(() => {
    const codigo = cpvQuery.trim()
    if (!codigo) { setCpvResultados(null); setCpvBuscadoCodigo(''); setCpvError(null); return }
    if (!/^\d{2,}$/.test(codigo)) { setCpvError('Código CPV inválido (solo números, mínimo 2 dígitos)'); return }
    setCpvError(null); setCpvCargando(true)
    fetch(`/api/buscar-cpv?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setCpvResultados(d.licitaciones || []); setCpvBuscadoCodigo(codigo) })
      .catch(e => setCpvError(e.message))
      .finally(() => setCpvCargando(false))
  }, [cpvQuery])

  const provincias = useMemo(() => [...new Set(licitaciones.map(l => l.provincia).filter(Boolean))].sort(), [licitaciones])

  const licitacionesFiltradas = useMemo(() => {
    return licitaciones.filter(l => {
      if (l.fechaLimite) {
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        if (new Date(l.fechaLimite + 'T00:00:00') <= hoy) return false
      }
      if (textoBusqueda) {
        const t = textoBusqueda.toLowerCase()
        if (!l.titulo?.toLowerCase().includes(t) && !l.organismo?.toLowerCase().includes(t)) return false
      }
      if (filtroUrgencia && tipoBadge(l.fechaLimite) !== filtroUrgencia) return false
      if (filtroImporte && l.importe != null) {
        const imp = parseFloat(l.importe)
        if (filtroImporte === 'menos50' && imp >= 50000) return false
        if (filtroImporte === '50a200'  && (imp < 50000  || imp >= 200000)) return false
        if (filtroImporte === '200a1m'  && (imp < 200000 || imp >= 1000000)) return false
        if (filtroImporte === 'mas1m'   && imp < 1000000) return false
      }
      if (filtroProvincia && l.provincia !== filtroProvincia) return false
      return true
    })
  }, [licitaciones, textoBusqueda, filtroUrgencia, filtroImporte, filtroProvincia])

  const listaActiva = cpvResultados !== null ? cpvResultados : licitacionesFiltradas

  const isGuardada = (l) => licitacionesGuardadas.some(g => g.expediente === l.expediente)
  const toggleGuardar = (l) => isGuardada(l) ? quitarLicitacion(l.expediente) : guardarLicitacion(l)

  const columns = [
    {
      key: 'fechaLimite',
      label: '',
      render: (v) => {
        const tipo = tipoBadge(v)
        return <Badge variant={BADGE_VARIANT[tipo] ?? 'neutral'} showDot={false} className="text-[10px]">{tipo}</Badge>
      },
    },
    {
      key: 'titulo',
      label: 'Licitación',
      render: (v, row) => (
        <div>
          <p className="font-medium text-ink text-sm line-clamp-2 max-w-sm">{v || 'Sin título'}</p>
          <p className="text-xs text-ink-3 mt-0.5">{row.organismo || '—'}</p>
        </div>
      ),
    },
    {
      key: 'importe',
      label: 'Presupuesto',
      align: 'right',
      mono: true,
      sortable: true,
      render: (v) => {
        const f = formatImporte(v)
        return f ? <span className="text-ink font-medium">{f} €</span> : <span className="text-ink-3 text-xs">—</span>
      },
    },
    {
      key: 'fechaLimite',
      label: 'Días',
      align: 'right',
      sortable: true,
      render: (v) => {
        const d = diasRestantes(v)
        if (d === null) return <span className="text-ink-3 text-xs">—</span>
        const variant = d < 3 ? 'urgente' : d <= 7 ? 'proximo' : 'enplazo'
        return <Badge variant={variant}>{d}d</Badge>
      },
    },
    {
      key: '_acciones',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => navigate('/dashboard/resumen', { state: { licitacion: row } })}
            className="p-1.5 rounded text-ink-3 hover:text-brand hover:bg-brand-light transition-colors"
            title="Resumen IA"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={() => toggleGuardar(row)}
            className={`p-1.5 rounded transition-colors ${isGuardada(row) ? 'text-brand' : 'text-ink-3 hover:text-brand hover:bg-brand-light'}`}
            title={isGuardada(row) ? 'Quitar' : 'Guardar'}
          >
            {isGuardada(row) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Licitaciones">
      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-surface border border-border rounded-lg">
        <SearchInput
          value={textoBusqueda}
          onChange={setTextoBusqueda}
          placeholder="Buscar título u organismo..."
          onClear={() => setTextoBusqueda('')}
          className="flex-1 min-w-48"
        />

        {/* CPV search */}
        <div className="relative flex items-center min-w-44">
          <Hash size={14} className="absolute left-3 text-ink-3 pointer-events-none" />
          <input
            type="text"
            value={cpvQuery}
            onChange={e => setCpvQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarCPV()}
            placeholder="Código CPV..."
            className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>

        <select
          value={filtroProvincia}
          onChange={e => setFiltroProvincia(e.target.value)}
          className="py-2 px-3 bg-surface border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        >
          <option value="">Todas las provincias</option>
          {provincias.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filtroImporte}
          onChange={e => setFiltroImporte(e.target.value)}
          className="py-2 px-3 bg-surface border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        >
          {IMPORTES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          onClick={cpvResultados !== null ? buscarCPV : actualizar}
          disabled={cargando || cpvCargando}
          className="p-2 rounded-md text-ink-3 hover:text-brand hover:bg-brand-light border border-border transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={15} className={(cargando || cpvCargando) ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Estado: errores */}
      {(error || cpvError) && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-danger-light border border-danger-border rounded-lg text-sm text-danger">
          <WifiOff size={16} className="shrink-0" />
          {error || cpvError}
        </div>
      )}

      {/* Estado: cargando */}
      {(cargando || cpvCargando) && <Spinner />}

      {/* Contador CPV */}
      {cpvResultados !== null && !cpvCargando && (
        <p className="text-xs text-ink-3 mb-3">
          {cpvResultados.length} licitaciones para CPV {cpvBuscadoCodigo}
          {' · '}
          <button
            onClick={() => { setCpvResultados(null); setCpvQuery(''); setCpvBuscadoCodigo('') }}
            className="text-brand hover:underline"
          >
            Limpiar
          </button>
        </p>
      )}

      {/* Estado vacío */}
      {!cargando && !cpvCargando && !error && listaActiva.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-ink-3">
          <SearchX size={36} className="opacity-40" />
          <p className="font-medium text-sm">No hay licitaciones con estos filtros</p>
          <p className="text-xs">Prueba a ampliar la búsqueda</p>
        </div>
      )}

      {/* Tabla */}
      {!cargando && !cpvCargando && listaActiva.length > 0 && (
        <DataTable
          columns={columns}
          data={listaActiva}
          onRowClick={setSeleccionada}
          emptyMessage="Sin licitaciones"
        />
      )}

      {/* SlideOver de detalle */}
      <SlideOver
        open={seleccionada !== null}
        onClose={() => setSeleccionada(null)}
        title={seleccionada?.titulo ?? ''}
      >
        <DetalleLicitacion
          licitacion={seleccionada}
          guardada={seleccionada ? isGuardada(seleccionada) : false}
          onToggleGuardar={() => seleccionada && toggleGuardar(seleccionada)}
          onResumenIA={() => { navigate('/dashboard/resumen', { state: { licitacion: seleccionada } }); setSeleccionada(null) }}
        />
      </SlideOver>
    </DashboardLayout>
  )
}
