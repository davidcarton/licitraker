import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({
  icon: Icon,
  value,
  label,
  trend,
  trendLabel,
  onClick,
}) {
  const isUp = trend === 'up'
  const isDown = trend === 'down'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left w-full bg-surface border border-border rounded-lg p-5 transition-all duration-200',
        onClick ? 'hover:shadow-md hover:border-border-strong cursor-pointer' : 'cursor-default',
      ].join(' ')}
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="p-2 bg-subtle rounded-md">
            <Icon size={16} className="text-ink-2" />
          </div>
        )}
        {trendLabel && (
          <span className={[
            'inline-flex items-center gap-0.5 text-xs font-medium',
            isUp ? 'text-success' : isDown ? 'text-danger' : 'text-ink-3',
          ].join(' ')}>
            {isUp && <TrendingUp size={12} />}
            {isDown && <TrendingDown size={12} />}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="font-mono text-2xl font-semibold text-ink leading-none mb-1.5">
        {value}
      </p>
      <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">
        {label}
      </p>
    </button>
  )
}
