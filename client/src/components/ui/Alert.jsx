import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const VARIANTS = {
  info:    { cls: 'bg-blue-50 border-blue-200 text-blue-900',                      icon: Info,           iconCls: 'text-blue-500' },
  success: { cls: 'bg-success-light border-success-border text-success',           icon: CheckCircle2,   iconCls: 'text-success' },
  warning: { cls: 'bg-warning-light border-warning-border text-warning',           icon: AlertTriangle,  iconCls: 'text-warning' },
  error:   { cls: 'bg-danger-light border-danger-border text-danger',              icon: AlertCircle,    iconCls: 'text-danger' },
}

export default function Alert({ variant = 'info', title, children, className = '' }) {
  const { cls, icon: Icon, iconCls } = VARIANTS[variant] ?? VARIANTS.info
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${cls} ${className}`} role="alert">
      <Icon size={16} className={`shrink-0 mt-0.5 ${iconCls}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        {children && <p className="text-sm opacity-80 leading-relaxed">{children}</p>}
      </div>
    </div>
  )
}
