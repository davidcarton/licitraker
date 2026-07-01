import '../../styles/components/ui/BlueprintFrame.css'

// Marco de "marcas de registro" estilo plano técnico, para enmarcar
// iconos de estado (vacío / sin conexión) con el lenguaje visual del fondo.
export default function BlueprintFrame({ children, size = 96, color = 'var(--n100)' }) {
  const m = Math.round(size * 0.18)
  const s = size - 0.5

  return (
    <div className="blueprint-frame" style={{ '--bf-size': `${size}px` }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        className="blueprint-frame__svg"
        aria-hidden="true"
      >
        <path d={`M0.5 ${m}V0.5H${m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${size - m} 0.5H${s}V${m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${s} ${size - m}V${s}H${size - m}`} stroke={color} strokeWidth="1.5" />
        <path d={`M${m} ${s}H0.5V${size - m}`} stroke={color} strokeWidth="1.5" />
      </svg>
      <div className="blueprint-frame__inner">{children}</div>
    </div>
  )
}
