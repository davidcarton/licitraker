import { useState } from 'react'
import { motion } from 'framer-motion'

export default function KPICard({ icon: Icon, value, label, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 'var(--r-xl)',
        border: `1px solid ${hovered ? 'var(--g200)' : 'var(--n100)'}`,
        padding: '22px 24px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hovered ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 'var(--r-md)',
          background: 'var(--verde-claro)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color="var(--verde)" />
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-titulo)',
            fontSize: 34,
            fontWeight: 700,
            color: 'var(--negro)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--n500)', marginTop: 8, lineHeight: 1.4 }}>
          {label}
        </div>
      </div>
    </motion.div>
  )
}
