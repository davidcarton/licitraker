import { useState } from "react";
import {
  Building2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react";
import Badge from "../ui/Badge.jsx";
import {
  diasRestantes,
  tipoBadge,
  formatFecha,
  formatImporte,
  descripcionCPV,
} from "../../utils/format.js";

const barraColor = {
  urgente: "var(--rojo)",
  proximo: "var(--ambar)",
  enplazo: "var(--g500)",
  sinplazo: "var(--n100)",
};

// --- Sub-componente: celda de metadato ────────────────────────────────────────

function MetaCell({ icon, label, value, mono, gris }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          color: "var(--n300)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-body)" /* Fuerza DM Sans */,
        }}
      >
        {icon}
        {label}
      </div>
      <span
        style={{
          fontWeight: 600,
          color: gris ? "var(--n300)" : "var(--n700)",
          fontFamily: mono
            ? "var(--font-mono)"
            : "var(--font-body)" /* Fuerza DM Sans si no es mono */,
          fontSize: mono ? 11 : 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// --- Tarjeta ──────────────────────────────────────────────────────────────────

export default function LicitacionCard({ licitacion: l, onClick }) {
  const [hovered, setHovered] = useState(false);
  const tipo = tipoBadge(l.fechaLimite);
  const dias = diasRestantes(l.fechaLimite);
  const importeNum = formatImporte(l.importe);
  const tieneEnlace = l.enlace && l.enlace !== "#";
  const ubicacionPartes = [];
  if (l.municipio) ubicacionPartes.push(l.municipio);
  if (l.provincia) ubicacionPartes.push(l.provincia);
  const ubicacion = ubicacionPartes.join(" · ") || "España";

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: "var(--r-xl)",
        boxShadow: hovered ? "var(--shadow-hover)" : "var(--shadow-card)",
        border: `1px solid ${hovered ? "var(--g200)" : "var(--n100)"}`,
        overflow: "hidden",
        wordBreak: "break-word",
        cursor: "pointer",
        display: "flex",
        flexDirection: "row",
        transition:
          "transform var(--transition), box-shadow var(--transition), border-color var(--transition)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        width: "100%",
        maxWidth: "380px",
        boxSizing: "border-box",
        fontFamily: "var(--font-body)" /* Fuerza DM Sans en la base */,
      }}
    >
      {/* Franja lateral de color */}
      <div
        style={{
          width: 5,
          background: barraColor[tipo],
          height: "100%",
          flexShrink: 0,
        }}
      />

      {/* Cuerpo */}
      <div
        style={{
          padding: "18px 20px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Fila 1: Badge + Importe */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <Badge tipo={tipo} dias={dias} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {importeNum ? (
              <span
                style={{
                  fontFamily: "var(--font-titulo)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--g700)",
                  lineHeight: 1,
                }}
              >
                {importeNum} €
              </span>
            ) : (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--n300)",
                  fontStyle: "italic",
                  fontFamily: "var(--font-body)",
                }}
              >
                Consultar
              </span>
            )}
          </div>
        </div>

        {/* Fila 2: Título — máximo 2 líneas */}
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.5,
            marginTop: 12,
            minHeight: 44,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            letterSpacing: "-0.01em",
          }}
        >
          {l.titulo || "Sin título"}
        </h2>

        {/* Fila 3: Organismo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 6,
            overflow: "hidden",
          }}
        >
          <Building2 size={13} color="var(--n300)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              color: "var(--n500)",
              fontWeight: 500,
              fontFamily: "var(--font-body)" /* Fuerza DM Sans */,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {l.organismo || "No especificado"}
          </span>
        </div>

        {/* Separador */}
        <div
          style={{
            height: 1,
            background: "var(--n50)",
            width: "100%",
            margin: "14px 0",
          }}
        />

        {/* Grid de metadatos */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 16px",
            minWidth: 0,
          }}
        >
          <MetaCell
            icon={<Calendar size={11} />}
            label="Fecha límite"
            value={formatFecha(l.fechaLimite) || "Sin plazo"}
            gris={!l.fechaLimite}
          />
          <MetaCell
            icon={<MapPin size={11} />}
            label="Ubicación"
            value={ubicacion}
          />
          <MetaCell
            icon={<Tag size={11} />}
            label="Tipo de obra"
            value={descripcionCPV(l.cpv)}
          />
          <MetaCell
            icon={<FileText size={11} />}
            label="Expediente"
            value={l.expediente || "—"}
            mono
          />
        </div>

        {/* Botón Ver licitación */}
        <div style={{ marginTop: 16 }}>
          {tieneEnlace ? (
            <a
              href={l.enlace}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "11px 16px",
                background: "var(--g700)",
                color: "#fff",
                borderRadius: "var(--r-md)",
                fontSize: 13,
                fontWeight: 600,
                transition: "background var(--transition)",
                fontFamily: "var(--font-body)" /* Fuerza DM Sans */,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--g800)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--g700)")
              }
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.98)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Ver licitación oficial
              <ExternalLink size={13} />
            </a>
          ) : (
            <button
              disabled
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "11px 16px",
                background: "var(--n100)",
                color: "var(--n300)",
                borderRadius: "var(--r-md)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "not-allowed",
                fontFamily: "var(--font-body)" /* Fuerza DM Sans */,
              }}
            >
              Enlace no disponible
            </button>
          )}
        </div>

        {/* Fecha publicación */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            marginTop: 10,
          }}
        >
          <Clock size={10} color="var(--n100)" />
          <span
            style={{
              fontSize: 10,
              color: "var(--n300)",
              fontFamily: "var(--font-body)",
            }}
          >
            Publicado: {formatFecha(l.fechaPublicacion) || "—"}
          </span>
        </div>
      </div>
    </article>
  );
}
