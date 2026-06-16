import { AlertCircle, Clock, CheckCircle, HelpCircle } from 'lucide-react'

const config = {
  urgente: {
    bg: 'var(--rojo-bg)', color: 'var(--rojo)', border: 'var(--rojo-borde)',
    Icon: AlertCircle,
    label: (d) => d !== null ? `Urgente · ${d}d` : 'Urgente',
  },
  proximo: {
    bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)',
    Icon: Clock,
    label: (d) => d !== null ? `Plazo próximo · ${d}d` : 'Plazo próximo',
  },
  enplazo: {
    bg: 'var(--g50)', color: 'var(--g700)', border: 'var(--g200)',
    Icon: CheckCircle,
    label: (d) => d !== null ? `En plazo · ${d}d` : 'En plazo',
  },
  sinplazo: {
    bg: 'var(--n50)', color: 'var(--n500)', border: 'var(--n100)',
    Icon: HelpCircle,
    label: () => 'Sin plazo definido',
  },
}

export default function Badge({ tipo, dias }) {
  const c = config[tipo] || config.sinplazo
  const { bg, color, border, Icon, label } = c
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px',
      borderRadius: 100,
      border: `1px solid ${border}`,
      background: bg,
      color,
      fontSize: 11, fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      <Icon size={12} />
      {label(dias)}
    </span>
  )
}
