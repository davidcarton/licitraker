import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { formatImporte, diasRestantes } from '../utils/format.js'

function Campo({ label, valor, mono = false }) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-1.5">{label}</p>
      <p className={`text-sm text-ink leading-relaxed ${mono ? 'font-mono' : ''}`}>
        {valor ?? '—'}
      </p>
    </div>
  )
}

export default function ResumenIA() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const l = state?.licitacion

  if (!l) {
    return (
      <DashboardLayout title="Resumen IA">
        <p className="text-sm text-ink-3">No hay licitación seleccionada.</p>
      </DashboardLayout>
    )
  }

  const importe = formatImporte(l.importe)
  const dias = diasRestantes(l.fechaLimite)

  return (
    <DashboardLayout title="Resumen IA">
      <div style={{ maxWidth: 720 }}>
        {/* Volver */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        {/* Título */}
        <h2 className="text-xl font-semibold text-ink mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.35 }}>
          {l.titulo || 'Sin título'}
        </h2>
        {dias !== null && (
          <p className="text-sm text-ink-3 mb-6">
            {dias < 3 ? '⚠️' : dias <= 7 ? '⏳' : '📅'} {dias} días restantes
          </p>
        )}

        {/* Campos */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <Campo label="Organismo" valor={l.organismo} />
          <Campo label="Provincia" valor={l.provincia} />
          <Campo label="Presupuesto" valor={importe ? `${importe} €` : null} mono />
          <Campo label="Fecha límite" valor={l.fechaLimite} mono />
          <Campo label="Expediente" valor={l.expediente} mono />
          <Campo label="Código CPV" valor={l.cpv} mono />
          {l.descripcion && <Campo label="Descripción" valor={l.descripcion} />}
          {l.organismo_url && (
            <div className="py-4 border-b border-border last:border-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-1.5">Enlace oficial</p>
              <a
                href={l.organismo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline break-all"
              >
                {l.organismo_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
