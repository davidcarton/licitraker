import { RefreshCw, AlertCircle, Banknote, ChevronDown, MapPin } from 'lucide-react'
import '../../styles/components/ui/FiltroBarra.css'

function FilterWrapper({ icon, children }) {
  return (
    <div className="filtro-barra__wrap">
      <span className="filtro-barra__icon">{icon}</span>
      {children}
      <ChevronDown size={13} className="filtro-barra__chevron" />
    </div>
  )
}

export default function FiltroBarra({ onFiltroUrgencia, onFiltroImporte, onFiltroProvincia, provincias = [], onActualizar, cargando }) {
  return (
    <div className="filtro-barra">
      <div className="filtro-barra__inner">
        <FilterWrapper icon={<AlertCircle size={14} />}>
          <select className="filtro-barra__select" onChange={e => onFiltroUrgencia(e.target.value)}>
            <option value="">Todos los plazos</option>
            <option value="urgente">Urgente — menos de 7 días</option>
            <option value="proximo">Plazo próximo — 7 a 14 días</option>
            <option value="enplazo">Más de 14 días</option>
            <option value="sinplazo">Sin plazo definido</option>
          </select>
        </FilterWrapper>

        <FilterWrapper icon={<Banknote size={14} />}>
          <select className="filtro-barra__select" onChange={e => onFiltroImporte(e.target.value)}>
            <option value="">Todos los importes</option>
            <option value="menos50">Hasta 50.000 €</option>
            <option value="50a200">50.000 € — 200.000 €</option>
            <option value="200a1m">200.000 € — 1.000.000 €</option>
            <option value="mas1m">Más de 1.000.000 €</option>
          </select>
        </FilterWrapper>

        <FilterWrapper icon={<MapPin size={14} />}>
          <select className="filtro-barra__select" onChange={e => onFiltroProvincia(e.target.value)}>
            <option value="">Todas las provincias</option>
            {provincias.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FilterWrapper>

        <button className="filtro-barra__btn-actualizar" onClick={onActualizar}>
          <RefreshCw size={14} className={cargando ? 'spin-icon' : ''} />
          Actualizar
        </button>
      </div>
    </div>
  )
}
