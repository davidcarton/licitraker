import { AlertCircle, Clock, CheckCircle, HelpCircle } from 'lucide-react'
import '../../styles/components/ui/Badge.css'

const config = {
  urgente:  { Icon: AlertCircle, label: (d) => d !== null ? `Urgente · ${d}d` : 'Urgente' },
  proximo:  { Icon: Clock,       label: (d) => d !== null ? `Plazo próximo · ${d}d` : 'Plazo próximo' },
  enplazo:  { Icon: CheckCircle, label: (d) => d !== null ? `En plazo · ${d}d` : 'En plazo' },
  sinplazo: { Icon: HelpCircle,  label: () => 'Sin plazo definido' },
}

export default function Badge({ tipo, dias }) {
  const { Icon, label } = config[tipo] || config.sinplazo
  return (
    <span className={`badge badge--${tipo || 'sinplazo'}`}>
      <Icon size={12} />
      {label(dias)}
    </span>
  )
}
