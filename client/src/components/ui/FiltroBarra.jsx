import { RefreshCw, AlertCircle, Banknote, ChevronDown, MapPin } from 'lucide-react'
import { useState } from 'react'

const inputBase = {
  width: '100%',
  padding: '9px 12px 9px 34px',
  border: '1.5px solid var(--n100)',
  borderRadius: 'var(--r-md)',
  fontSize: 13,
  background: 'var(--n50)',
  color: 'var(--n900)',
  transition: 'border-color var(--transition), box-shadow var(--transition), background var(--transition)',
  appearance: 'none',
  WebkitAppearance: 'none',
}

function FilterWrapper({ icon, children }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--n300)', pointerEvents: 'none', display: 'flex',
      }}>
        {icon}
      </span>
      {children}
      <ChevronDown size={13} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--n300)', pointerEvents: 'none',
      }} />
    </div>
  )
}

function useFocusStyle() {
  const [focused, setFocused] = useState(false)
  return {
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: focused
      ? { borderColor: 'var(--g500)', background: '#fff', boxShadow: '0 0 0 3px var(--g100)' }
      : {},
  }
}

export default function FiltroBarra({ onFiltroUrgencia, onFiltroImporte, onFiltroProvincia, provincias = [], onActualizar, cargando }) {
  const urgFocus = useFocusStyle()
  const impFocus = useFocusStyle()
  const provFocus = useFocusStyle()

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid var(--n100)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '12px clamp(1.25rem, 4vw, 2.5rem)',
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Select urgencia */}
        <FilterWrapper icon={<AlertCircle size={14} />}>
          <select
            style={{ ...inputBase, minWidth: 200, paddingRight: 30, cursor: 'pointer', ...urgFocus.style }}
            onChange={e => onFiltroUrgencia(e.target.value)}
            onFocus={urgFocus.onFocus}
            onBlur={urgFocus.onBlur}
          >
            <option value="">Todos los plazos</option>
            <option value="urgente">Urgente — menos de 7 días</option>
            <option value="proximo">Plazo próximo — 7 a 14 días</option>
            <option value="enplazo">Más de 14 días</option>
            <option value="sinplazo">Sin plazo definido</option>
          </select>
        </FilterWrapper>

        {/* Select importe */}
        <FilterWrapper icon={<Banknote size={14} />}>
          <select
            style={{ ...inputBase, minWidth: 200, paddingRight: 30, cursor: 'pointer', ...impFocus.style }}
            onChange={e => onFiltroImporte(e.target.value)}
            onFocus={impFocus.onFocus}
            onBlur={impFocus.onBlur}
          >
            <option value="">Todos los importes</option>
            <option value="menos50">Hasta 50.000 €</option>
            <option value="50a200">50.000 € — 200.000 €</option>
            <option value="200a1m">200.000 € — 1.000.000 €</option>
            <option value="mas1m">Más de 1.000.000 €</option>
          </select>
        </FilterWrapper>

        {/* Select provincia */}
        <FilterWrapper icon={<MapPin size={14} />}>
          <select
            style={{ ...inputBase, minWidth: 200, paddingRight: 30, cursor: 'pointer', ...provFocus.style }}
            onChange={e => onFiltroProvincia(e.target.value)}
            onFocus={provFocus.onFocus}
            onBlur={provFocus.onBlur}
          >
            <option value="">Todas las provincias</option>
            {provincias.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FilterWrapper>

        {/* Botón actualizar */}
        <button
          onClick={onActualizar}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--g700)', color: '#fff',
            borderRadius: 'var(--r-md)', padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            transition: 'background var(--transition), transform var(--transition)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--g800)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--g700)'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <RefreshCw size={14} style={cargando ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Actualizar
        </button>
      </div>
    </div>
  )
}
