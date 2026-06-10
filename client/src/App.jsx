// DECISIONES DE DISEÑO
// Arquetipo: SaaS datos públicos — claro, confiable, gubernamental pero moderno
// Paleta: verde oscuro g900/g800 / fondo neutro n50 / blanco
// Tipografía display: Syne 700/800 — cuerpo: Inter 400/600
// Diferenciador visual: franja superior de color en tarjeta según urgencia
//   + importe en Syne grande + badge días restantes compacto
// CTA principal: "Ver licitación oficial" en tarjeta + modal drawer lateral

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchX, WifiOff } from 'lucide-react'
import Header from './components/layout/Header.jsx'
import EstadoBar from './components/ui/EstadoBar.jsx'
import FiltroBarra from './components/ui/FiltroBarra.jsx'
import LicitacionCard from './components/cards/LicitacionCard.jsx'
import LicitacionModal from './components/cards/LicitacionModal.jsx'
import Spinner from './components/ui/Spinner.jsx'
import './styles/global.css'

function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  return Math.ceil((new Date(fechaStr + 'T00:00:00') - hoy) / (1000*60*60*24))
}

function tipoBadge(fechaStr) {
  const d = diasRestantes(fechaStr)
  if (d === null) return 'sinplazo'
  if (d < 7) return 'urgente'
  if (d <= 14) return 'proximo'
  return 'enplazo'
}

export default function App() {
  const [licitaciones, setLicitaciones] = useState([])
  const [meta, setMeta] = useState({ total: 0, actualizacion: null, proximaActualizacion: null })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroImporte, setFiltroImporte] = useState('')
  const [filtroProvincia, setFiltroProvincia] = useState('')

  const cargar = useCallback(async (forzar = false) => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(forzar ? '/api/licitaciones?refresh=1' : '/api/licitaciones')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLicitaciones(data.licitaciones || [])
      setMeta({ total: data.total || 0, actualizacion: data.actualizacion, proximaActualizacion: data.proximaActualizacion })
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const provincias = useMemo(() => {
    return [...new Set(
      licitaciones
        .map(l => l.provincia)
        .filter(Boolean)
    )].sort()
  }, [licitaciones])

  const licitacionesFiltradas = useMemo(() => {
    return licitaciones.filter(l => {
      // Filtrar expiradas en cliente
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

  // Offset: header (58px) + estadoBar (~36px) = 94px
  const HEADER_H = 58
  const ESTADO_H = 36

  return (
    <div style={{ minHeight: '100vh', background: 'var(--n50)' }}>
      <Header />

      <div style={{ paddingTop: HEADER_H }}>
        {!cargando && !error && (
          <EstadoBar
            total={licitacionesFiltradas.length}
            actualizacion={meta.actualizacion}
            proximaActualizacion={meta.proximaActualizacion}
          />
        )}

        <div style={{ position: 'sticky', top: HEADER_H + (cargando || error ? 0 : ESTADO_H), zIndex: 40 }}>
          <FiltroBarra
            onBuscar={setTextoBusqueda}
            onFiltroUrgencia={setFiltroUrgencia}
            onFiltroImporte={setFiltroImporte}
            onFiltroProvincia={setFiltroProvincia}
            provincias={provincias}
            onActualizar={() => cargar(true)}
            cargando={cargando}
          />
        </div>

        <main style={{
          maxWidth: 1300, margin: '0 auto',
          padding: '24px clamp(1.25rem, 4vw, 2.5rem)',
        }}>
          {cargando && <Spinner />}

          {error && !cargando && (
            <div style={{
              background: 'var(--rojo-bg)',
              border: '1px solid var(--rojo-borde)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <WifiOff size={18} color="var(--rojo)" style={{ flexShrink: 0 }} />
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
              <SearchX size={40} color="var(--n100)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--n500)' }}>
                No hay licitaciones con estos filtros
              </span>
              <span style={{ fontSize: 13, color: 'var(--n300)' }}>
                Prueba a ampliar la búsqueda o eliminar algún filtro
              </span>
            </div>
          )}

          {!cargando && !error && licitacionesFiltradas.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {licitacionesFiltradas.map((l, i) => (
                <motion.div
                  key={l.expediente || `${l.titulo}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
                >
                  <LicitacionCard licitacion={l} onClick={() => setSeleccionada(l)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        <footer style={{
          background: 'var(--g900)',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          padding: '20px 24px',
          fontSize: 11,
          lineHeight: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontFamily: 'var(--font-body)',
        }}>
          <p>
            Datos extraídos de la{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>
              Plataforma de Contratación del Sector Público (PLACSP)
            </strong>
            {' '}· Ministerio de Hacienda · Gobierno de España
          </p>
          <p>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>LicitaPlus</strong>
            {' '}· Un servicio de{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Benco</strong>
            {' '}· benco.es
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {seleccionada && (
          <LicitacionModal licitacion={seleccionada} onCerrar={() => setSeleccionada(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
