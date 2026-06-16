import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchX, WifiOff, AlertTriangle, Sparkles, Bookmark, BookmarkCheck, Hash, Search } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import FiltroBarra from '../components/ui/FiltroBarra.jsx'
import LicitacionCard from '../components/cards/LicitacionCard.jsx'
import LicitacionModal from '../components/cards/LicitacionModal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import BlueprintFrame from '../components/ui/BlueprintFrame.jsx'
import { tipoBadge } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'

const inputBase = {
  width: '100%',
  padding: '9px 12px 9px 34px',
  border: '1.5px solid var(--n100)',
  borderRadius: 'var(--r-md)',
  fontSize: 13,
  background: 'var(--n50)',
  color: 'var(--n900)',
  transition: 'border-color var(--transition), box-shadow var(--transition), background var(--transition)',
}

function BarraBusquedaCPV({ valor, onChange, onBuscar, cargando }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid var(--n100)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '12px clamp(1.25rem, 4vw, 2.5rem)',
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Hash size={15} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--n300)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={valor}
            placeholder="Buscar por código CPV (ej: 45233141)"
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onBuscar() }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              ...inputBase,
              ...(focused ? { borderColor: 'var(--g500)', background: '#fff', boxShadow: '0 0 0 3px var(--g100)' } : {}),
            }}
          />
        </div>

        <button
          onClick={onBuscar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--g700)', color: '#fff',
            borderRadius: 'var(--r-md)', padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            transition: 'background var(--transition), transform var(--transition)',
            whiteSpace: 'nowrap',
            opacity: cargando ? 0.7 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--g800)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--g700)'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <Search size={14} />
          {cargando ? 'Buscando...' : 'Buscar CPV'}
        </button>
      </div>
    </div>
  )
}

function TarjetaLicitacion({ licitacion: l, index: i, guardada, onSeleccionar, onToggleGuardar, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 380 }}
    >
      <LicitacionCard licitacion={l} onClick={() => onSeleccionar(l)} />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/dashboard/resumen', { state: { licitacion: l } }) }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: '#EAF4EE',
            color: '#2A5938',
            border: '1px solid #3D7A4F',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-body)',
          }}
        >
          <Sparkles size={13} />
          Resumen IA
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleGuardar(l) }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: guardada ? 'var(--verde-claro)' : 'var(--n100)',
            color: guardada ? 'var(--verde)' : 'var(--n500)',
            border: guardada ? '1px solid var(--g200)' : '1px solid transparent',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-body)',
          }}
        >
          {guardada ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {guardada ? 'Guardada' : 'Guardar'}
        </button>
      </div>
    </motion.div>
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
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setLicitaciones(data.licitaciones || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Licitaciones'
    cargarDatos()
    return () => { document.title = tituloPrevio }
  }, [cargarDatos])

  const actualizar = () => {
    setCargando(true)
    setError(null)
    fetch('/api/licitaciones?refresh=1')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setLicitaciones(data.licitaciones || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }

  const handleCpvChange = (valor) => {
    setCpvQuery(valor)
    if (!valor.trim()) {
      setCpvResultados(null)
      setCpvBuscadoCodigo('')
      setCpvError(null)
    }
  }

  const buscarCPV = useCallback(() => {
    const codigo = cpvQuery.trim()

    if (!codigo) {
      setCpvResultados(null)
      setCpvBuscadoCodigo('')
      setCpvError(null)
      return
    }

    if (!/^\d{2,}$/.test(codigo)) {
      setCpvError('Introduce un código CPV válido (solo números, mínimo 2 dígitos)')
      return
    }

    setCpvError(null)
    setCpvCargando(true)
    fetch(`/api/buscar-cpv?codigo=${encodeURIComponent(codigo)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setCpvResultados(data.licitaciones || [])
        setCpvBuscadoCodigo(codigo)
      })
      .catch(e => setCpvError(e.message))
      .finally(() => setCpvCargando(false))
  }, [cpvQuery])

  const provincias = useMemo(() => {
    return [...new Set(
      licitaciones
        .map(l => l.provincia)
        .filter(Boolean)
    )].sort()
  }, [licitaciones])

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
        if (filtroImporte === '50a200'  && (imp < 50000  || imp >= 200000))  return false
        if (filtroImporte === '200a1m'  && (imp < 200000 || imp >= 1000000)) return false
        if (filtroImporte === 'mas1m'   && imp < 1000000) return false
      }
      if (filtroProvincia && l.provincia !== filtroProvincia) return false
      return true
    })
  }, [licitaciones, textoBusqueda, filtroUrgencia, filtroImporte, filtroProvincia])

  const mostrandoCPV = cpvResultados !== null

  const renderGrid = (lista) => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}
    >
      {lista.map((l, i) => (
        <TarjetaLicitacion
          key={l.expediente || `${l.titulo}-${i}`}
          licitacion={l}
          index={i}
          guardada={licitacionesGuardadas.some(g => g.expediente === l.expediente)}
          onSeleccionar={setSeleccionada}
          onToggleGuardar={(lic) => (
            licitacionesGuardadas.some(g => g.expediente === lic.expediente)
              ? quitarLicitacion(lic.expediente)
              : guardarLicitacion(lic)
          )}
          navigate={navigate}
        />
      ))}
    </motion.div>
  )

  return (
    <DashboardLayout
      title="Licitaciones"
      filtros={(
        <>
          <FiltroBarra
            onBuscar={setTextoBusqueda}
            onFiltroUrgencia={setFiltroUrgencia}
            onFiltroImporte={setFiltroImporte}
            onFiltroProvincia={setFiltroProvincia}
            provincias={provincias}
            onActualizar={actualizar}
            cargando={cargando}
          />
          <BarraBusquedaCPV
            valor={cpvQuery}
            onChange={handleCpvChange}
            onBuscar={buscarCPV}
            cargando={cpvCargando}
          />
        </>
      )}
    >
      {mostrandoCPV ? (
        <>
          {cpvCargando && <Spinner />}

          {cpvError && !cpvCargando && (
            <div style={{
              background: 'var(--rojo-bg)',
              border: '1px solid var(--rojo-borde)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <BlueprintFrame size={36} color="var(--rojo-borde)">
                <AlertTriangle size={16} color="var(--rojo)" />
              </BlueprintFrame>
              <span style={{ fontSize: 13, color: 'var(--rojo)', fontWeight: 500 }}>
                {cpvError}
              </span>
            </div>
          )}

          {!cpvCargando && !cpvError && (
            <>
              <p style={{ fontSize: 13, color: 'var(--n500)', fontWeight: 600, marginBottom: 16 }}>
                {cpvResultados.length} licitaciones encontradas para CPV {cpvBuscadoCodigo}
              </p>

              {cpvResultados.length === 0 ? (
                <div style={{
                  minHeight: 300,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12,
                }}>
                  <BlueprintFrame size={96}>
                    <SearchX size={36} color="var(--n300)" />
                  </BlueprintFrame>
                  <span style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--n500)' }}>
                    No hay licitaciones en plazo con ese código CPV
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--n300)' }}>
                    Prueba con un código más corto o distinto
                  </span>
                </div>
              ) : renderGrid(cpvResultados)}
            </>
          )}
        </>
      ) : (
        <>
          {cargando && <Spinner />}

          {error && !cargando && (
            <div style={{
              background: 'var(--rojo-bg)',
              border: '1px solid var(--rojo-borde)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <BlueprintFrame size={36} color="var(--rojo-borde)">
                <WifiOff size={16} color="var(--rojo)" />
              </BlueprintFrame>
              <span style={{ fontSize: 13, color: 'var(--rojo)', fontWeight: 500 }}>
                No se ha podido conectar con el servidor de licitaciones.
                Asegúrate de que el servidor está arrancado e inténtalo de nuevo.
              </span>
            </div>
          )}

          {!cargando && !error && licitacionesFiltradas.length === 0 && (
            <div style={{
              minHeight: 300,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12,
            }}>
              <BlueprintFrame size={96}>
                <SearchX size={36} color="var(--n300)" />
              </BlueprintFrame>
              <span style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--n500)' }}>
                No hay licitaciones con estos filtros
              </span>
              <span style={{ fontSize: 13, color: 'var(--n300)' }}>
                Prueba a ampliar la búsqueda o eliminar algún filtro
              </span>
            </div>
          )}

          {!cargando && !error && licitacionesFiltradas.length > 0 && renderGrid(licitacionesFiltradas)}
        </>
      )}

      <AnimatePresence>
        {seleccionada && (
          <LicitacionModal licitacion={seleccionada} onCerrar={() => setSeleccionada(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
