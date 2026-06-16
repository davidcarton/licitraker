import { Check } from 'lucide-react'
import { diasRestantes, formatImporte } from '../../utils/format.js'

const ESTADO_ESTILOS = {
  Guardada:   { bg: 'var(--g50)',     color: 'var(--g700)', border: 'var(--g200)' },
  Nueva:      { bg: 'var(--g50)',     color: 'var(--g700)', border: 'var(--g200)' },
  Estudiando: { bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)' },
  Presentada: { bg: '#eff6ff',         color: '#1d4ed8',      border: '#bfdbfe' },
}

function DiasBadge({ dias }) {
  if (dias === null) return <span style={{ color: 'var(--n300)', fontSize: 12 }}>—</span>
  const urgente = dias < 3
  const proximo = dias >= 3 && dias <= 7
  const estilos = urgente
    ? { bg: 'var(--rojo-bg)', color: 'var(--rojo)', border: 'var(--rojo-borde)' }
    : proximo
      ? { bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)' }
      : { bg: 'var(--g50)', color: 'var(--g700)', border: 'var(--g200)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 100,
      border: `1px solid ${estilos.border}`,
      background: estilos.bg, color: estilos.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {dias}d
    </span>
  )
}

function EstadoBadge({ estado }) {
  const e = ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.Nueva
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 100,
      border: `1px solid ${e.border}`,
      background: e.bg, color: e.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {estado}
    </span>
  )
}

export default function TablaUrgentes({ items, estados, onMarcarPresentada }) {
  if (!items.length) {
    return (
      <div style={{
        background: '#fff', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)',
        padding: '32px 24px', textAlign: 'center',
        color: 'var(--n400)', fontSize: 13,
      }}>
        No hay licitaciones guardadas con plazo próximo.
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-xl)',
      border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'var(--gris-fondo)' }}>
              {['Licitación', 'Provincia', 'Presupuesto', 'Días', 'Estado', 'Acción'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 2 || i === 3 ? 'right' : 'left',
                  padding: '12px 18px',
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--n500)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--n100)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l, i) => {
              const dias = diasRestantes(l.fechaLimite)
              const estado = estados[l.expediente] || 'Nueva'
              const importe = formatImporte(l.importe)
              return (
                <tr key={l.expediente || i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--n50)' : 'none' }}>
                  <td style={{ padding: '14px 18px', maxWidth: 320 }}>
                    <div style={{
                      fontFamily: 'var(--font-titulo)', fontWeight: 700, fontSize: 13,
                      color: 'var(--negro)', lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {l.titulo || 'Sin título'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--n500)', whiteSpace: 'nowrap' }}>
                    {l.provincia || '—'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {importe ? (
                      <span style={{ fontFamily: 'var(--font-titulo)', fontWeight: 700, fontSize: 13, color: 'var(--verde)' }}>
                        {importe} €
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--n300)', fontStyle: 'italic' }}>Consultar</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <DiasBadge dias={dias} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <EstadoBadge estado={estado} />
                  </td>
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    {estado !== 'Presentada' ? (
                      <button
                        onClick={() => onMarcarPresentada(l.expediente)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--g200)',
                          background: 'var(--verde-claro)',
                          color: 'var(--verde)',
                          fontSize: 12, fontWeight: 700,
                          fontFamily: 'var(--font-body)',
                          transition: 'background var(--transition)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--g200)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde-claro)')}
                      >
                        <Check size={13} />
                        Marcar presentada
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--n300)' }}>—</span>
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
