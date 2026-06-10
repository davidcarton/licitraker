import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, MapPin, Calendar, Tag, FileText,
  ExternalLink, Shield, HardHat, Info, TrendingUp,
} from 'lucide-react'
import Badge from '../ui/Badge.jsx'

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

function formatFecha(fechaStr) {
  if (!fechaStr) return 'Sin plazo'
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const d = new Date(fechaStr)
  if (isNaN(d)) return fechaStr
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function formatImporte(valor) {
  if (!valor && valor !== 0) return null
  const n = parseFloat(valor)
  if (isNaN(n)) return null
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function descripcionCPV(cpvStr) {
  if (!cpvStr) return 'Obra de construcción'
  const p = String(cpvStr).split(/\s+/).find(c => c.startsWith('45')) || ''
  const t = {
    '450':'Construcción general','451':'Demolición y preparación del terreno',
    '452':'Ingeniería civil','453':'Instalaciones en edificios',
    '454':'Acabados de construcción','455':'Alquiler de maquinaria de construcción',
  }
  return t[p.substring(0,3)] || 'Obra de construcción'
}

const franjaColor = {
  urgente: 'var(--rojo)',
  proximo: 'var(--ambar)',
  enplazo: 'var(--g500)',
  sinplazo: 'var(--n100)',
}

function Campo({ icon, label, value, colSpan, mono }) {
  return (
    <div style={{
      gridColumn: colSpan ? '1 / -1' : undefined,
      padding: '12px 0',
      borderBottom: '1px solid var(--n50)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--n300)',
      }}>
        <span style={{ color: 'var(--g500)' }}>{icon}</span>
        {label}
      </div>
      <div style={{
        marginTop: 4,
        fontSize: 13, fontWeight: 500, color: 'var(--n700)',
        fontFamily: mono ? 'ui-monospace, monospace' : undefined,
        fontSize: mono ? 12 : 13,
        wordBreak: 'break-word',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

export default function LicitacionModal({ licitacion: l, onCerrar }) {
  if (!l) return null
  const tipo = tipoBadge(l.fechaLimite)
  const dias = diasRestantes(l.fechaLimite)
  const importeNum = formatImporte(l.importe)
  const tieneEnlace = l.enlace && l.enlace !== '#'

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(17,25,23,0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 100,
        }}
      />

      <motion.div
        key="panel"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 'min(500px, 100vw)',
          background: '#fff',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.16)',
          zIndex: 101,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Franja superior */}
        <div style={{ height: 6, background: franjaColor[tipo], flexShrink: 0 }} />

        {/* Cabecera */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--n100)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge tipo={tipo} dias={dias} />
            <button
              onClick={onCerrar}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--n50)', color: 'var(--n500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background var(--transition), color var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--n100)'; e.currentTarget.style.color = 'var(--n900)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--n50)'; e.currentTarget.style.color = 'var(--n500)' }}
            >
              <X size={17} />
            </button>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18, fontWeight: 800,
            color: 'var(--n900)', lineHeight: 1.25,
            marginTop: 12,
          }}>
            {l.titulo || 'Sin título'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Building2 size={14} color="var(--n300)" />
            <span style={{ fontSize: 13, color: 'var(--n500)', fontFamily: 'var(--font-body)' }}>
              {l.organismo || 'No especificado'}
            </span>
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Importe destacado */}
          {importeNum && (
            <div style={{
              background: 'var(--g50)',
              border: '1px solid var(--g100)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--g500)',
                }}>
                  Presupuesto base
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28, fontWeight: 800,
                  color: 'var(--g800)', lineHeight: 1,
                  marginTop: 4,
                }}>
                  {importeNum} €
                </div>
              </div>
              <TrendingUp size={24} color="var(--g200)" />
            </div>
          )}

          {/* Grid de campos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <Campo icon={<MapPin size={11}/>} label="Municipio" value={l.municipio || 'No especificado'} />
            <Campo icon={<MapPin size={11}/>} label="Provincia" value={l.provincia || 'España'} />
            <Campo icon={<Calendar size={11}/>} label="Fecha límite" value={formatFecha(l.fechaLimite)} />
            <Campo icon={<HardHat size={11}/>} label="Tipo de obra" value={descripcionCPV(l.cpv)} colSpan />
            <Campo icon={<FileText size={11}/>} label="Expediente" value={l.expediente} colSpan mono />
            <Campo icon={<Tag size={11}/>} label="Código CPV" value={l.cpv} colSpan mono />
            <Campo icon={<Calendar size={11}/>} label="Publicado" value={formatFecha(l.fechaPublicacion)} />
          </div>

          {/* Aviso */}
          <div style={{
            marginTop: 16,
            background: 'var(--g50)', border: '1px solid var(--g100)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Info size={15} color="var(--g500)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--n700)', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
              Para ver los pliegos de condiciones y presentar tu oferta,
              accede a la documentación oficial en la web del Gobierno.
            </p>
          </div>
        </div>

        {/* Pie */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--n50)', flexShrink: 0 }}>
          {tieneEnlace ? (
            <a
              href={l.enlace}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: 13,
                background: 'var(--g700)', color: '#fff',
                borderRadius: 'var(--r-md)',
                fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--g800)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--g700)'}
            >
              Ver documentación oficial
              <ExternalLink size={14} />
            </a>
          ) : (
            <button disabled style={{
              width: '100%', padding: 13,
              background: 'var(--n100)', color: 'var(--n300)',
              borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: 700, cursor: 'not-allowed',
            }}>
              Enlace no disponible
            </button>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            marginTop: 10,
          }}>
            <Shield size={11} color="var(--n300)" />
            <span style={{ fontSize: 11, color: 'var(--n300)', fontFamily: 'var(--font-body)' }}>
              Abrirá la web oficial del Gobierno de España
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
