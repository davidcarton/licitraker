import { motion } from 'framer-motion'
import '../../styles/components/dashboard/KPICard.css'

export default function KPICard({ icon: Icon, value, label, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      className={`kpi-card${onClick ? ' kpi-card--clickable' : ''}`}
    >
      <div className="kpi-card__icon">
        <Icon size={20} color="var(--verde)" />
      </div>

      <div>
        <div className="kpi-card__valor">{value}</div>
        <div className="kpi-card__label">{label}</div>
      </div>
    </motion.div>
  )
}
