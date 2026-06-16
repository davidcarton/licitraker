const VARIANTS = {
  urgente:    { cls: 'bg-danger-light text-danger border border-danger-border',     dot: 'bg-danger' },
  proximo:    { cls: 'bg-warning-light text-warning border border-warning-border',  dot: 'bg-warning' },
  enplazo:    { cls: 'bg-success-light text-success border border-success-border',  dot: 'bg-success' },
  sinplazo:   { cls: 'bg-subtle text-ink-3 border border-border',                   dot: 'bg-ink-3' },
  neutral:    { cls: 'bg-subtle text-ink-3 border border-border',                   dot: 'bg-ink-3' },
  guardada:   { cls: 'bg-brand-light text-brand border border-brand-mid',           dot: 'bg-brand' },
  presentada: { cls: 'bg-blue-50 text-blue-700 border border-blue-200',             dot: 'bg-blue-500' },
}

export default function Badge({ variant = 'neutral', children, showDot = true, className = '' }) {
  const { cls, dot } = VARIANTS[variant] ?? VARIANTS.neutral
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium leading-tight ${cls} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      {children}
    </span>
  )
}
