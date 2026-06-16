import { Check } from 'lucide-react'
import DataTable from '../ui/DataTable.jsx'
import Badge from '../ui/Badge.jsx'
import { diasRestantes, formatImporte } from '../../utils/format.js'

const ESTADO_VARIANT = {
  Guardada:   'guardada',
  Estudiando: 'proximo',
  Presentada: 'presentada',
  Nueva:      'neutral',
}

function diasVariant(dias) {
  if (dias === null) return 'neutral'
  if (dias < 3) return 'urgente'
  if (dias <= 7) return 'proximo'
  return 'enplazo'
}

export default function TablaUrgentes({ items, estados, onMarcarPresentada }) {
  const columns = [
    {
      key: 'titulo',
      label: 'Licitación',
      render: (v) => (
        <span className="font-medium text-ink line-clamp-2 max-w-xs block">{v || 'Sin título'}</span>
      ),
    },
    {
      key: 'provincia',
      label: 'Provincia',
      render: (v) => <span className="text-ink-2">{v || '—'}</span>,
    },
    {
      key: 'importe',
      label: 'Presupuesto',
      align: 'right',
      mono: true,
      sortable: true,
      render: (v) => {
        const f = formatImporte(v)
        return f
          ? <span className="text-brand font-medium">{f} €</span>
          : <span className="text-ink-3 text-xs italic">Consultar</span>
      },
    },
    {
      key: 'fechaLimite',
      label: 'Días',
      align: 'right',
      sortable: true,
      render: (v) => {
        const d = diasRestantes(v)
        if (d === null) return <span className="text-ink-3 text-xs">—</span>
        return <Badge variant={diasVariant(d)}>{d}d</Badge>
      },
    },
    {
      key: 'expediente',
      label: 'Estado',
      render: (v) => {
        const estado = estados[v] || 'Nueva'
        return <Badge variant={ESTADO_VARIANT[estado] ?? 'neutral'}>{estado}</Badge>
      },
    },
    {
      key: '_accion',
      label: '',
      render: (_, row) => {
        const estado = estados[row.expediente] || 'Nueva'
        if (estado === 'Presentada') return null
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onMarcarPresentada(row.expediente) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-light text-brand border border-brand-mid hover:bg-brand-mid transition-colors"
          >
            <Check size={12} />
            Marcar presentada
          </button>
        )
      },
    },
  ]

  if (!items.length) {
    return (
      <p className="text-sm text-ink-3 py-8 text-center">
        No hay licitaciones guardadas con plazo próximo.
      </p>
    )
  }

  return <DataTable columns={columns} data={items} />
}
