import { Building2, RefreshCw, Clock } from 'lucide-react'
import '../../styles/components/ui/EstadoBar.css'

function fmtHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function EstadoBar({ total, actualizacion, proximaActualizacion }) {
  return (
    <div className="estado-bar">
      <div className="estado-bar__item">
        <Building2 size={14} color="#7FC99A" />
        <span className="estado-bar__total">{total} licitaciones de construcción en plazo</span>
      </div>

      <div className="estado-bar__item">
        <RefreshCw size={13} color="rgba(255,255,255,0.35)" />
        <span className="estado-bar__meta">Actualizado hoy a las {fmtHora(actualizacion)}</span>
      </div>

      <div className="estado-bar__item">
        <Clock size={13} color="rgba(255,255,255,0.35)" />
        <span className="estado-bar__meta">Próxima actualización: {fmtHora(proximaActualizacion)}</span>
      </div>
    </div>
  )
}
