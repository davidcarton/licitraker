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
        'text-left w-full transition-all duration-200',
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default',
      ].join(' ')}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '22px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        {Icon && (
          <div style={{
            width: 40, height: 40,
            borderRadius: 11,
            background: 'var(--brand-light)',
            border: '1px solid var(--brand-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={19} strokeWidth={1.75} style={{ color: 'var(--brand)' }} />
          </div>
        )}
        {trendLabel && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600,
            color: isUp ? 'var(--success)' : isDown ? 'var(--danger)' : 'var(--text-muted)',
          }}>
            {isUp && <TrendingUp size={11} />}
            {isDown && <TrendingDown size={11} />}
            {trendLabel}
          </span>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 32,
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
        marginBottom: 7,
      }}>
        {value}
      </p>

      <p style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}>
        {label}
      </p>
    </button>
  )
}
