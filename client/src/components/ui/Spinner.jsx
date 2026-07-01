import '../../styles/components/ui/Spinner.css'

export default function Spinner() {
  return (
    <div className="spinner-page">
      <div className="spinner-page__ring" />
      <div className="spinner-page__texto">
        <span className="spinner-page__titulo">Consultando licitaciones...</span>
        <span className="spinner-page__sub">Conectando con el Gobierno de España</span>
      </div>
    </div>
  )
}
