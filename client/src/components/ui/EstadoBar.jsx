import { Building2, RefreshCw, Clock } from 'lucide-react'

function fmtHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function EstadoBar({ total, actualizacion, proximaActualizacion }) {
  return (
    <div style={{
      background: 'var(--g800)',
      padding: '8px clamp(1.25rem, 4vw, 2.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      position: 'sticky',
      top: '58px',
      zIndex: 49,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Building2 size={14} color="#7FC99A" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          {total} licitaciones de construcción en plazo
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={13} color="rgba(255,255,255,0.35)" />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
          Actualizado hoy a las {fmtHora(actualizacion)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={13} color="rgba(255,255,255,0.35)" />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
          Próxima actualización: {fmtHora(proximaActualizacion)}
        </span>
      </div>
    </div>
  )
}
