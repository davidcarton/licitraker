# Spec: Rediseño Premium — LiciTraker

**Fecha:** 2026-06-16
**Enfoque aprobado:** A+B — Reskin completo de tokens + restructuración de layouts de páginas principales
**Estado:** Aprobado por usuario

---

## 1. Objetivo

Elevar el nivel visual de la app de gestión de licitaciones LiciTraker a un estándar premium de herramienta SaaS profesional. El resultado debe transmitir calidad y credibilidad a constructoras y empresas que la usen para gestionar licitaciones públicas.

**Referencia de estilo:** Light editorial — fondo blanco/crema, tipografía contrastada y funcional, verde de marca solo en elementos clave. Inspiración: Notion, Linear, Stripe Dashboard.

---

## 2. Cambios técnicos de base

### 2.1 Añadir Tailwind CSS v4

Todos los componentes seleccionados de 21st.dev usan Tailwind. Se añade Tailwind CSS v4 al proyecto Vite.

```bash
npm install tailwindcss @tailwindcss/vite
```

Configuración en `vite.config.js`:
```js
import tailwindcss from '@tailwindcss/vite'
// añadir tailwindcss() al array de plugins
```

`index.css` (o equivalente de entrada):
```css
@import "tailwindcss";
```

La paleta de marca se expone como tokens CSS dentro del tema de Tailwind v4 usando `@theme`.

### 2.2 Fuentes: Geist Sans + Geist Mono

Reemplaza el sistema de 3 fuentes actual (Syne + DM Sans + Inter) por una única familia.

```html
<!-- en index.html -->
<link rel="preconnect" href="https://fonts.vercel.com" />
<link href="https://fonts.vercel.com/css2?family=Geist" rel="stylesheet" />
<link href="https://fonts.vercel.com/css2?family=Geist+Mono" rel="stylesheet" />
```

Variables resultantes:
```css
--font-sans: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;
```

### 2.3 Reemplazar global.css con nuevo sistema de tokens

El archivo `client/src/styles/global.css` se reescribe completamente. Los inline styles de los componentes se migran a clases Tailwind + tokens CSS.

---

## 3. Sistema de tokens (Design Tokens)

### Colores

```css
/* Fondos */
--bg-base:    #FAFAF9;   /* página principal — crema muy sutil */
--bg-surface: #FFFFFF;   /* cards, modales, paneles */
--bg-subtle:  #F5F5F4;   /* sidebar, header, zonas de contraste */
--bg-muted:   #E7E5E4;   /* separadores, inputs deshabilitados */

/* Texto */
--text-primary:   #1C1917;   /* casi negro cálido */
--text-secondary: #57534E;   /* labels, descripción */
--text-muted:     #A8A29E;   /* placeholders, metadatos */
--text-inverse:   #FAFAF9;   /* texto sobre verde oscuro */

/* Marca (verde — solo donde importa) */
--brand:       #2A5938;
--brand-hover: #1E3F28;
--brand-light: #F0FDF4;
--brand-mid:   #BBF7D0;

/* Estados */
--danger:      #DC2626;  --danger-bg:  #FEF2F2;  --danger-border:  #FECACA;
--warning:     #D97706;  --warning-bg: #FFFBEB;  --warning-border: #FDE68A;
--success:     #16A34A;  --success-bg: #F0FDF4;  --success-border: #BBF7D0;

/* Bordes */
--border:        #E7E5E4;
--border-strong: #D6D3D1;
```

### Tipografía

| Uso | Tamaño | Peso | Extra |
|---|---|---|---|
| Título de página (h1) | 24px | 600 | tracking -0.02em |
| Título de sección (h2) | 18px | 600 | tracking -0.01em |
| Label / subtítulo (h3) | 14px | 500 | — |
| Cuerpo principal | 14px | 400 | line-height 1.6 |
| Texto secundario / meta | 13px | 400 | color --text-secondary |
| Caption / mínimo | 12px | 400 | color --text-muted |
| Datos técnicos (mono) | 13px | 400 | Geist Mono |
| Importes destacados | 20px | 500 | Geist Mono |

### Bordes y sombras

```css
/* Radios */
--r-xs: 4px;    /* badges, chips */
--r-sm: 6px;    /* botones, inputs */
--r-md: 8px;    /* cards, paneles */
--r-lg: 12px;   /* modales, cards destacadas */

/* Sombras */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02);
```

---

## 4. Componentes de 21st.dev a integrar

Todos se obtienen con `npx shadcn@latest add https://21st.dev/r/[autor]/[componente]` y se colocan en `client/src/components/ui/`.

| Componente | Uso en app | Archivo destino |
|---|---|---|
| Sidebar colapsable | Navegación principal | `components/dashboard/Sidebar.jsx` |
| Stats Card con tendencia | KPIs del Dashboard y Admin | `components/dashboard/KPICard.jsx` |
| Data Table densa | Licitaciones, TablaUrgentes, Admin | `components/ui/DataTable.jsx` |
| Command/Search input | Barra de filtros de Licitaciones | `components/ui/SearchInput.jsx` |
| Badge con punto de estado | Indicadores urgente/próximo/plazo | `components/ui/Badge.jsx` |
| Tabs horizontal | Página de Configuración | `components/ui/Tabs.jsx` |
| Alert con variantes | Página Admin | `components/ui/Alert.jsx` |
| Form inputs con label | Login y Registro | `components/auth/FormInput.jsx` |

**Nota de integración:** Los componentes se instalan via shadcn CLI para obtener el código fuente, que luego se adapta para usar los tokens CSS definidos en la sección 3 (colores `--brand`, `--border`, etc.) y la fuente Geist.

---

## 5. Diseño por pantalla

### 5.1 Login / Registro

**Estructura:** Split panel — 44% izquierda marca + 56% derecha formulario.

**Panel izquierdo:**
- Fondo `--brand` (#2A5938) sólido, sin gradiente
- Logo centrado + tagline en `--text-inverse`
- Sin listas de beneficios — limpio y directo

**Panel derecho:**
- Fondo `--bg-base` (#FAFAF9)
- Formulario centrado, anchura máxima 360px
- Inputs de 21st.dev con labels flotantes
- Tipografía Geist 14px, bordes `--border`
- Botón CTA verde `--brand` full-width, radius `--r-sm`
- Sin decoraciones — foco total en el form

**Responsive:** panel izquierdo oculto en < 860px

---

### 5.2 Sidebar (componente compartido)

- Ancho: 220px (expandido) / 56px (colapsado, solo iconos)
- Fondo: `--bg-surface` (#FFFFFF)
- Borde derecho: `1px solid var(--border)`
- Logo arriba: Geist 600, color `--text-primary`
- Nav items: icono + texto en `--text-secondary`
- Item activo: texto `--brand`, fondo `--brand-light`, sin borde lateral llamativo
- Avatar + nombre empresa + botón logout abajo
- Transición de colapso: 200ms ease

---

### 5.3 Header (componente compartido)

- Altura: 56px fija
- Fondo: `--bg-surface` (#FFFFFF) — ya no verde oscuro
- Borde inferior: `1px solid var(--border)`
- Izquierda: título de la página actual, Geist 600 16px `--text-primary`
- Centro: Command/Search input de 21st.dev (búsqueda global)
- Derecha: icono notificaciones + avatar del usuario

---

### 5.4 Dashboard

**Zona superior:**
- Saludo: "Buenos días, [Empresa]" — Geist 600 24px, tracking -0.02em
- Fecha actual en `--text-muted` 13px debajo

**KPI Row:**
- 4 Stats Cards de 21st.dev en fila horizontal
- Número grande: Geist Mono 28px `--text-primary`
- Label: Geist 12px `--text-secondary`
- Icono: color `--brand`
- Indicador de tendencia (flecha + porcentaje) en `--success` o `--danger`
- Fondo `--bg-surface`, borde `--border`, sombra `--shadow-sm`

**Tabla urgentes:**
- Data Table de 21st.dev con columnas: badge estado | título | organismo | importe (mono) | días | acción
- Filas compactas, altura 40px
- Sin cards — tabla limpia con separadores `--border`

---

### 5.5 Licitaciones

**FiltroBarra (nueva):**
- Command/Search input de 21st.dev como barra principal (búsqueda por CPV / título)
- Filtros secundarios como chips seleccionables: provincia, importe mínimo
- Botón "Actualizar" como icono a la derecha
- Toda la barra sobre fondo `--bg-subtle`, borde inferior `--border`

**Lista de licitaciones:**
- Data Table densa de 21st.dev (reemplaza el grid de cards)
- Columnas: badge urgencia | título (2 líneas max) | organismo | importe mono | días restantes | guardar
- Fila clickable → abre un **slide-over panel** a la derecha (en lugar del modal actual)
- El slide-over muestra el detalle completo sin perder el contexto de la tabla
- Paginación de 21st.dev al pie

---

### 5.6 ResumenIA (detalle de licitación)

- Layout de 1 columna, max-width 720px, centrado
- Cada campo: label en 11px uppercase letter-spacing `--text-muted` + valor en Geist 16px `--text-primary`
- Importes y códigos CPV: Geist Mono
- Separadores `--border` entre bloques
- Botón "Volver" con icono arriba a la izquierda

---

### 5.7 Configuración

- Tabs horizontal de 21st.dev (Perfil | Preferencias | Notificaciones | CRM)
- Cada tab: formulario vertical limpio, labels 12px, inputs Geist 14px
- Sin fondos de color en secciones — separadores `--border` únicamente
- Botón "Guardar" `--brand` alineado a la derecha al pie de cada tab

---

### 5.8 Admin

- KPI Row igual que Dashboard (mismos Stats Cards)
- Alertas del sistema: componente Alert de 21st.dev con variantes `info`, `warning`, `error`
- Tabla de estadísticas: Data Table compacta
- Acceso restringido a superadmin (sin cambios en lógica)

---

## 6. Lo que NO cambia

- Lógica de negocio (contextos, API calls, auth)
- Routing (HashRouter, rutas protegidas)
- Backend / server.js
- Estructura de carpetas
- Datos y estado de la app

---

## 7. Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `client/index.html` | Añadir links de fuentes Geist |
| `client/vite.config.js` | Añadir plugin Tailwind |
| `client/package.json` | Añadir tailwindcss, @tailwindcss/vite |
| `client/src/styles/global.css` | Reescritura completa con nuevos tokens |
| `client/src/components/dashboard/Sidebar.jsx` | Nuevo sidebar 21st.dev adaptado |
| `client/src/components/dashboard/Header.jsx` | Header blanco con search |
| `client/src/components/dashboard/KPICard.jsx` | Stats Card 21st.dev |
| `client/src/components/dashboard/TablaUrgentes.jsx` | Data Table 21st.dev |
| `client/src/components/cards/LicitacionCard.jsx` | Eliminado (reemplazado por tabla) |
| `client/src/components/cards/LicitacionModal.jsx` | Convertido a slide-over panel |
| `client/src/components/ui/Badge.jsx` | Badge 21st.dev adaptado |
| `client/src/components/ui/FiltroBarra.jsx` | Command input 21st.dev |
| `client/src/components/ui/Spinner.jsx` | Spinner minimalista Geist |
| `client/src/components/auth/AuthLayout.jsx` | Split panel simplificado |
| `client/src/components/auth/FormInput.jsx` | Nuevo — input con label flotante |
| `client/src/components/ui/DataTable.jsx` | Nuevo — Data Table 21st.dev |
| `client/src/components/ui/SearchInput.jsx` | Nuevo — Command input 21st.dev |
| `client/src/components/ui/Tabs.jsx` | Nuevo — Tabs 21st.dev |
| `client/src/components/ui/Alert.jsx` | Nuevo — Alert 21st.dev |
| `client/src/components/ui/SlideOver.jsx` | Nuevo — panel lateral detalle |
| `client/src/pages/Login.jsx` | Actualizar a nuevos componentes |
| `client/src/pages/Registro.jsx` | Actualizar a nuevos componentes |
| `client/src/pages/Dashboard.jsx` | Nueva zona hero + KPIs |
| `client/src/pages/Licitaciones.jsx` | Tabla + slide-over |
| `client/src/pages/ResumenIA.jsx` | Layout 1 columna |
| `client/src/pages/Configuracion.jsx` | Tabs 21st.dev |
| `client/src/pages/Admin.jsx` | KPIs + Alert components |

---

## 8. Orden de implementación

1. Setup técnico: Tailwind v4 + Geist fonts + nuevo global.css
2. Componentes de 21st.dev: instalar y adaptar Badge, Alert, Tabs, DataTable, SearchInput, StatsCard, Sidebar, SlideOver, FormInput
3. Componentes compartidos: Sidebar, Header (nueva estética)
4. AuthLayout + Login + Registro
5. Dashboard
6. Licitaciones (tabla + slide-over)
7. ResumenIA
8. Configuración
9. Admin
10. Pruebas visuales, build de producción, commit + deploy
