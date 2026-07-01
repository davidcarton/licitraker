import {
  Building2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import Badge from "../ui/Badge.jsx";
import {
  diasRestantes,
  tipoBadge,
  formatFecha,
  formatImporte,
  descripcionCPV,
} from "../../utils/format.js";
import "../../styles/components/cards/LicitacionCard.css";

function MetaCell({ icon, label, value, mono, gris }) {
  return (
    <div className="lc-meta-cell">
      <div className="lc-meta-label">{icon}{label}</div>
      <span className={`lc-meta-value${gris ? " lc-meta-value--gris" : ""}${mono ? " lc-meta-value--mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function LicitacionCard({ licitacion: l, onClick, onResumenIA, onToggleGuardar, guardada }) {
  const tipo = tipoBadge(l.fechaLimite);
  const dias = diasRestantes(l.fechaLimite);
  const importeNum = formatImporte(l.importe);
  const tieneEnlace = l.enlace && l.enlace !== "#";
  const ubicacionPartes = [];
  if (l.municipio) ubicacionPartes.push(l.municipio);
  if (l.provincia) ubicacionPartes.push(l.provincia);
  const ubicacion = ubicacionPartes.join(" · ") || "España";

  return (
    <article onClick={onClick} className="lc-card">
      {/* Franja lateral de color */}
      <div className={`lc-franja lc-franja--${tipo}`} />

      {/* Cuerpo */}
      <div className="lc-body">
        {/* Fila 1: Badge + Importe */}
        <div className="lc-fila1">
          <Badge tipo={tipo} dias={dias} />
          <div className="lc-importe-wrap">
            {importeNum ? (
              <span className="lc-importe">{importeNum} €</span>
            ) : (
              <span className="lc-importe--consultar">Consultar</span>
            )}
          </div>
        </div>

        {/* Título — máximo 2 líneas */}
        <h2 className="lc-titulo">{l.titulo || "Sin título"}</h2>

        {/* Organismo */}
        <div className="lc-organismo">
          <Building2 size={13} color="var(--n300)" />
          <span className="lc-organismo__text">{l.organismo || "No especificado"}</span>
        </div>

        {/* Separador */}
        <div className="lc-separador" />

        {/* Grid de metadatos */}
        <div className="lc-meta-grid">
          <MetaCell icon={<Calendar size={11} />} label="Fecha límite" value={formatFecha(l.fechaLimite) || "Sin plazo"} gris={!l.fechaLimite} />
          <MetaCell icon={<MapPin size={11} />}    label="Ubicación"    value={ubicacion} />
          <MetaCell icon={<Tag size={11} />}        label="Tipo de obra" value={descripcionCPV(l.cpv)} />
          <MetaCell icon={<FileText size={11} />}   label="Expediente"   value={l.expediente || "—"} mono />
        </div>

        {/* Botón Ver licitación */}
        {tieneEnlace ? (
          <a
            href={l.enlace}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="lc-btn-enlace"
          >
            Ver licitación oficial
            <ExternalLink size={13} />
          </a>
        ) : (
          <button disabled className="lc-btn-enlace--disabled">
            Enlace no disponible
          </button>
        )}

        {/* Fila Resumen IA / Guardar */}
        {(onResumenIA || onToggleGuardar) && (
          <div className="lc-acciones">
            {onResumenIA && (
              <button onClick={(e) => { e.stopPropagation(); onResumenIA(l); }} className="lc-btn-ia">
                <Sparkles size={13} />
                Resumen IA
              </button>
            )}
            {onToggleGuardar && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleGuardar(l); }}
                className={`lc-btn-guardar ${guardada ? "lc-btn-guardar--guardada" : "lc-btn-guardar--no-guardada"}`}
              >
                {guardada ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {guardada ? "Guardada" : "Guardar"}
              </button>
            )}
          </div>
        )}

        {/* Fecha publicación */}
        <div className="lc-publicado">
          <Clock size={10} color="var(--n100)" />
          <span className="lc-publicado__text">Publicado: {formatFecha(l.fechaPublicacion) || "—"}</span>
        </div>
      </div>
    </article>
  );
}
