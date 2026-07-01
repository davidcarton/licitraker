import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Shield,
  HardHat,
  Info,
  TrendingUp,
} from "lucide-react";
import Badge from "../ui/Badge.jsx";
import {
  diasRestantes,
  tipoBadge,
  formatFecha,
  formatImporte,
  descripcionCPV,
} from "../../utils/format.js";
import "../../styles/components/cards/LicitacionModal.css";

function Campo({ icon, label, value, colSpan, mono }) {
  return (
    <div className={`lm-campo${colSpan ? " lm-campo--span" : ""}`}>
      <div className="lm-campo__label">
        <span className="lm-campo__label-icon">{icon}</span>
        {label}
      </div>
      <div className={`lm-campo__value${mono ? " lm-campo__value--mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function LicitacionModal({ licitacion: l, onCerrar }) {
  if (!l) return null;
  const tipo = tipoBadge(l.fechaLimite);
  const dias = diasRestantes(l.fechaLimite);
  const importeNum = formatImporte(l.importe);
  const tieneEnlace = l.enlace && l.enlace !== "#";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
        className="lm-overlay"
      />

      <motion.div
        key="panel"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="lm-panel"
      >
        {/* Franja superior */}
        <div className={`lm-franja lm-franja--${tipo}`} />

        {/* Cabecera */}
        <div className="lm-header">
          <div className="lm-header__top">
            <Badge tipo={tipo} dias={dias} />
            <button onClick={onCerrar} className="lm-btn-cerrar">
              <X size={17} />
            </button>
          </div>
          <h2 className="lm-titulo">{l.titulo || "Sin título"}</h2>
          <div className="lm-organismo">
            <Building2 size={14} color="var(--n300)" />
            <span className="lm-organismo__text">{l.organismo || "No especificado"}</span>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="lm-cuerpo">
          {importeNum && (
            <div className="lm-importe-bloque">
              <div>
                <div className="lm-importe-label">Presupuesto base</div>
                <div className="lm-importe-valor">{importeNum} €</div>
              </div>
              <TrendingUp size={24} color="var(--g200)" />
            </div>
          )}

          <div className="lm-campos-grid">
            <Campo icon={<MapPin size={11} />}    label="Municipio"    value={l.municipio || "No especificado"} />
            <Campo icon={<MapPin size={11} />}    label="Provincia"    value={l.provincia || "España"} />
            <Campo icon={<Calendar size={11} />}  label="Fecha límite" value={formatFecha(l.fechaLimite) || "Sin plazo"} />
            <Campo icon={<HardHat size={11} />}   label="Tipo de obra" value={descripcionCPV(l.cpv)} colSpan />
            <Campo icon={<FileText size={11} />}  label="Expediente"   value={l.expediente} colSpan mono />
            <Campo icon={<Tag size={11} />}        label="Código CPV"   value={l.cpv} colSpan mono />
            <Campo icon={<Calendar size={11} />}  label="Publicado"    value={formatFecha(l.fechaPublicacion)} />
          </div>

          <div className="lm-aviso">
            <Info size={15} color="var(--g500)" />
            <p className="lm-aviso__texto">
              Para ver los pliegos de condiciones y presentar tu oferta, accede
              a la documentación oficial en la web del Gobierno.
            </p>
          </div>
        </div>

        {/* Pie */}
        <div className="lm-pie">
          {tieneEnlace ? (
            <a
              href={l.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="lm-btn-oficial"
            >
              Ver documentación oficial
              <ExternalLink size={14} />
            </a>
          ) : (
            <button disabled className="lm-btn-oficial--disabled">
              Enlace no disponible
            </button>
          )}
          <div className="lm-pie__aviso">
            <Shield size={11} color="var(--n300)" />
            <span className="lm-pie__aviso-text">Abrirá la web oficial del Gobierno de España</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
