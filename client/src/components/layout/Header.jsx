export default function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 58,
        background: "var(--g900)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.2)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        padding: "0 clamp(1.25rem, 4vw, 2.5rem)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <polygon
            points="14,2 25,8 25,20 14,26 3,20 3,8"
            fill="none"
            stroke="var(--g500)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            Licitraker
          </span>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.38)",
              fontWeight: 400,
            }}
          >
            por Benco
          </span>
        </div>
      </div>

      {/* Subtítulo centrado — solo >900px */}
      <span
        className="header-subtitle"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-body)",
          pointerEvents: "none",
        }}
      >
        Licitaciones de obra pública · Datos oficiales del Gobierno de España
      </span>

      {/* Badge En directo */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(90,154,110,0.12)",
          border: "1px solid rgba(90,154,110,0.3)",
          borderRadius: 100,
          padding: "5px 12px",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--g500)",
            animation: "pulse-glow 2.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--g500)",
            letterSpacing: "0.04em",
          }}
        >
          En directo
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) { .header-subtitle { display: none !important; } }
      `}</style>
    </header>
  );
}
