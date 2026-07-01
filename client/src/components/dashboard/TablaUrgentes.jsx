import { Check } from 'lucide-react'
import { diasRestantes, formatImporte } from '../../utils/format.js'
import '../../styles/components/dashboard/TablaUrgentes.css'

function DiasBadge({ dias }) {
  if (dias === null) return <span className="tu-dias-null">—</span>
  const variant = dias < 3 ? 'urgente' : dias <= 7 ? 'proximo' : 'enplazo'
  return (
    <span className={`tu-dias-badge tu-dias-badge--${variant}`}>{dias}d</span>
  )
}

function EstadoBadge({ estado }) {
  return (
    <span className={`tu-estado-badge tu-estado-badge--${estado.toLowerCase()}`}>
      {estado}
    </span>
  )
}

export default function TablaUrgentes({ items, estados, onMarcarPresentada }) {
  if (!items.length) {
    return (
      <div className="tu-vacio">
        No hay licitaciones guardadas con plazo próximo.
      </div>
    )
  }

  return (
    <div className="tu-tabla-wrap">
      <div className="tu-scroll">
        <table className="tu-tabla">
          <thead className="tu-thead">
            <tr>
              {['Licitación', 'Provincia', 'Presupuesto', 'Días', 'Estado', 'Acción'].map((h, i) => (
                <th key={h} className={`tu-th${i === 2 || i === 3 ? ' tu-th--right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l, i) => {
              const dias = diasRestantes(l.fechaLimite)
              const estado = estados[l.expediente] || 'Nueva'
              const importe = formatImporte(l.importe)
              return (
                <tr key={l.expediente || i} className="tu-tr">
                  <td className="tu-td tu-td--titulo">
                    <div className="tu-titulo-texto">{l.titulo || 'Sin título'}</div>
                  </td>
                  <td className="tu-td tu-td--nowrap tu-provincia">{l.provincia || '—'}</td>
                  <td className="tu-td tu-td--right tu-td--nowrap">
                    {importe
                      ? <span className="tu-importe">{importe} €</span>
                      : <span className="tu-importe-null">Consultar</span>
                    }
                  </td>
                  <td className="tu-td tu-td--right">
                    <DiasBadge dias={dias} />
                  </td>
                  <td className="tu-td">
                    <EstadoBadge estado={estado} />
                  </td>
                  <td className="tu-td tu-td--nowrap">
                    {estado !== 'Presentada' ? (
                      <button
                        className="tu-btn-presentada"
                        onClick={() => onMarcarPresentada(l.expediente)}
                      >
                        <Check size={13} />
                        Marcar presentada
                      </button>
                    ) : (
                      <span className="tu-action-null">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
