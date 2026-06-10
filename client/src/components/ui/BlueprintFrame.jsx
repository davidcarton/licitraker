// Marco de "marcas de registro" estilo plano técnico, para enmarcar
// iconos de estado (vacío / sin conexión) con el lenguaje visual del fondo.
export default function BlueprintFrame({ children, size = 96, color = 'var(--n100)' }) {
  const m = Math.round(size * 0.18)
  const s = size - 0.5

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <path d={`M0.5 ${m}V0.5H${m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${size - m} 0.5H${s}V${m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${s} ${size - m}V${s}H${size - m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${m} ${s}H0.5V${size - m}`} stroke={color} strokeWidth="1.5" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}
