# Rediseño Premium LiciTraker — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar la interfaz de LiciTraker a nivel premium con estilo light editorial, tipografía Geist única, paleta verde refinada y componentes inspirados en 21st.dev integrados con Tailwind CSS v4.

**Architecture:** Reskin completo del sistema de tokens (global.css) + restructuración de layouts. Se añade Tailwind CSS v4 al proyecto Vite existente. Los componentes UI se reescriben usando clases Tailwind + CSS custom properties. Toda la lógica de negocio (contextos, API calls, routing) se preserva intacta.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Geist + Geist Mono (CDN Vercel), Framer Motion (ya instalado), Lucide React (ya instalado)

---

## Mapa de archivos

**Creados:**
- `client/src/components/ui/DataTable.jsx`
- `client/src/components/ui/SearchInput.jsx`
- `client/src/components/ui/Tabs.jsx`
- `client/src/components/ui/Alert.jsx`
- `client/src/components/ui/SlideOver.jsx`
- `client/src/components/auth/FormInput.jsx`

**Reescritos completamente:**
- `client/src/styles/global.css`
- `client/src/components/ui/Badge.jsx`
- `client/src/components/ui/Spinner.jsx`
- `client/src/components/dashboard/Sidebar.jsx`
- `client/src/components/dashboard/Header.jsx`
- `client/src/components/dashboard/KPICard.jsx`
- `client/src/components/dashboard/DashboardLayout.jsx`
- `client/src/components/dashboard/TablaUrgentes.jsx`
- `client/src/components/auth/AuthLayout.jsx`
- `client/src/pages/Login.jsx`
- `client/src/pages/Registro.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/Licitaciones.jsx`
- `client/src/pages/ResumenIA.jsx`
- `client/src/pages/Configuracion.jsx`
- `client/src/pages/Admin.jsx`

**Modificados:**
- `client/index.html` (añadir Geist fonts)
- `client/vite.config.js` (añadir plugin Tailwind)
- `client/package.json` (via npm install)

**Eliminados:**
- `client/src/components/cards/LicitacionCard.jsx`
- `client/src/components/cards/LicitacionModal.jsx` (sustituido por SlideOver)
- `client/src/components/ui/BlueprintFrame.jsx` (sustituido por estado vacío inline)
- `client/src/components/ui/FiltroBarra.jsx` (sustituido por SearchInput + chips)

---

## Task 1: Setup — Tailwind CSS v4 + Geist fonts

**Files:**
- Modify: `client/package.json` (via npm)
- Modify: `client/vite.config.js`
- Modify: `client/index.html`

- [ ] **Step 1: Instalar dependencias**

Desde `client/`:
```bash
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Actualizar vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: Añadir Geist fonts en index.html**

Añadir dentro de `<head>`, antes del cierre `</head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

> Nota: Geist está disponible en Google Fonts desde 2024. Si la URL no carga, usar el fallback: `https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-sans/style.css` y `geist-mono/style.css` — en ese caso el family name es `'Geist Sans'` y `'Geist Mono'`.

- [ ] **Step 4: Verificar que el servidor de dev arranca sin errores**

```bash
cd client && npm run dev
```
Esperado: servidor en http://localhost:5173 sin errores de compilación.

- [ ] **Step 5: Commit**

```bash
git add client/vite.config.js client/index.html client/package.json client/package-lock.json
git commit -m "feat: añadir Tailwind CSS v4 y fuentes Geist"
```

---

## Task 2: Nuevo sistema de tokens (global.css)

**Files:**
- Rewrite: `client/src/styles/global.css`

- [ ] **Step 1: Reemplazar global.css completamente**

```css
@import "tailwindcss";

/* ─── Tema Tailwind v4 ──────────────────────────────────────────────────────── */
@theme {
  /* Marca */
  --color-brand:       #2A5938;
  --color-brand-hover: #1E3F28;
  --color-brand-light: #F0FDF4;
  --color-brand-mid:   #BBF7D0;

  /* Fondos */
  --color-surface: #FFFFFF;
  --color-subtle:  #F5F5F4;
  --color-muted:   #E7E5E4;

  /* Estados */
  --color-danger:         #DC2626;
  --color-danger-light:   #FEF2F2;
  --color-danger-border:  #FECACA;
  --color-warning:        #D97706;
  --color-warning-light:  #FFFBEB;
  --color-warning-border: #FDE68A;
  --color-success:        #16A34A;
  --color-success-light:  #F0FDF4;
  --color-success-border: #BBF7D0;

  /* Bordes */
  --color-border:       #E7E5E4;
  --color-border-strong: #D6D3D1;

  /* Texto */
  --color-ink:       #1C1917;
  --color-ink-2:     #57534E;
  --color-ink-3:     #A8A29E;
  --color-ink-inv:   #FAFAF9;

  /* Tipografía */
  --font-sans: 'Geist', 'Geist Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'Fira Code', monospace;

  /* Radios */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* ─── Custom properties (para uso en style={} de React) ─────────────────────── */
:root {
  --bg-base:    #FAFAF9;
  --bg-surface: #FFFFFF;
  --bg-subtle:  #F5F5F4;
  --bg-muted:   #E7E5E4;

  --text-primary:   #1C1917;
  --text-secondary: #57534E;
  --text-muted:     #A8A29E;
  --text-inverse:   #FAFAF9;

  --brand:       #2A5938;
  --brand-hover: #1E3F28;
  --brand-light: #F0FDF4;
  --brand-mid:   #BBF7D0;

  --danger:        #DC2626;
  --danger-bg:     #FEF2F2;
  --danger-border: #FECACA;
  --warning:       #D97706;
  --warning-bg:    #FFFBEB;
  --warning-border: #FDE68A;
  --success:        #16A34A;
  --success-bg:     #F0FDF4;
  --success-border: #BBF7D0;

  --border:        #E7E5E4;
  --border-strong: #D6D3D1;

  --font-sans: 'Geist', 'Geist Sans', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  --r-xs: 4px;
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02);

  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --transition: 0.18s var(--ease);
}

/* ─── Reset y base ──────────────────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

/* ─── Scrollbar personalizada ───────────────────────────────────────────────── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ─── Animaciones ───────────────────────────────────────────────────────────── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Verificar que el build compila**

```bash
cd client && npm run build
```
Esperado: build exitoso sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/global.css
git commit -m "feat: nuevo sistema de tokens premium (Geist + paleta editorial)"
```

---

## Task 3: Componente Badge

**Files:**
- Rewrite: `client/src/components/ui/Badge.jsx`

- [ ] **Step 1: Reescribir Badge.jsx**

```jsx
const VARIANTS = {
  urgente:  { cls: 'bg-danger-light text-danger border border-danger-border',  dot: 'bg-danger' },
  proximo:  { cls: 'bg-warning-light text-warning border border-warning-border', dot: 'bg-warning' },
  enplazo:  { cls: 'bg-success-light text-success border border-success-border', dot: 'bg-success' },
  sinplazo: { cls: 'bg-subtle text-ink-3 border border-border',                 dot: 'bg-ink-3' },
  neutral:  { cls: 'bg-subtle text-ink-3 border border-border',                 dot: 'bg-ink-3' },
  guardada: { cls: 'bg-brand-light text-brand border border-brand-mid',         dot: 'bg-brand' },
  presentada: { cls: 'bg-blue-50 text-blue-700 border border-blue-200',         dot: 'bg-blue-500' },
}

export default function Badge({ variant = 'neutral', children, showDot = true, className = '' }) {
  const { cls, dot } = VARIANTS[variant] ?? VARIANTS.neutral
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium leading-tight ${cls} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/Badge.jsx
git commit -m "feat: Badge premium con variantes de punto de estado"
```

---

## Task 4: Componente Alert

**Files:**
- Create: `client/src/components/ui/Alert.jsx`

- [ ] **Step 1: Crear Alert.jsx**

```jsx
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const VARIANTS = {
  info:    { cls: 'bg-blue-50 border-blue-200 text-blue-900',    icon: Info,          iconCls: 'text-blue-500' },
  success: { cls: 'bg-success-light border-success-border text-success', icon: CheckCircle2, iconCls: 'text-success' },
  warning: { cls: 'bg-warning-light border-warning-border text-warning', icon: AlertTriangle, iconCls: 'text-warning' },
  error:   { cls: 'bg-danger-light border-danger-border text-danger',   icon: AlertCircle,   iconCls: 'text-danger' },
}

export default function Alert({ variant = 'info', title, children }) {
  const { cls, icon: Icon, iconCls } = VARIANTS[variant] ?? VARIANTS.info
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${cls}`} role="alert">
      <Icon size={16} className={`shrink-0 mt-0.5 ${iconCls}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        {children && <p className="text-sm opacity-80 leading-relaxed">{children}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/Alert.jsx
git commit -m "feat: Alert con variantes info/success/warning/error"
```

---

## Task 5: Componente Tabs

**Files:**
- Create: `client/src/components/ui/Tabs.jsx`

- [ ] **Step 1: Crear Tabs.jsx**

```jsx
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-border">
      <nav className="flex" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
              active === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-2 hover:text-ink hover:border-border-strong',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/Tabs.jsx
git commit -m "feat: Tabs horizontal premium"
```

---

## Task 6: Componente SearchInput

**Files:**
- Create: `client/src/components/ui/SearchInput.jsx`

- [ ] **Step 1: Crear SearchInput.jsx**

```jsx
import { Search, X } from 'lucide-react'

export default function SearchInput({
  value, onChange, placeholder = 'Buscar...', onClear, className = ''
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={14} className="absolute left-3 text-ink-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-8 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 text-ink-3 hover:text-ink-2 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/SearchInput.jsx
git commit -m "feat: SearchInput con clear button"
```

---

## Task 7: Componente DataTable

**Files:**
- Create: `client/src/components/ui/DataTable.jsx`

- [ ] **Step 1: Crear DataTable.jsx**

```jsx
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export default function DataTable({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Sin resultados',
  className = '',
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-border bg-surface ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-subtle">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                className={[
                  'px-4 py-2.5 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : '',
                  col.sortable ? 'cursor-pointer select-none hover:text-ink-2' : '',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? <ChevronUp size={11} />
                        : <ChevronDown size={11} />
                      : <ChevronsUpDown size={11} className="opacity-40" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-16 text-center text-ink-3 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={row.id ?? row.expediente ?? i}
                onClick={() => onRowClick?.(row)}
                className={[
                  'border-b border-border last:border-0 transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-subtle' : '',
                ].join(' ')}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3 text-ink-2',
                      col.align === 'right' ? 'text-right' : '',
                      col.mono ? 'font-mono text-ink' : '',
                      col.className ?? '',
                    ].join(' ')}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/DataTable.jsx
git commit -m "feat: DataTable densa con ordenación por columna"
```

---

## Task 8: Componente SlideOver

**Files:**
- Create: `client/src/components/ui/SlideOver.jsx`

- [ ] **Step 1: Crear SlideOver.jsx**

```jsx
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function SlideOver({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-surface shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-ink text-base leading-snug pr-4">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-ink-3 hover:text-ink-2 hover:bg-subtle transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/SlideOver.jsx
git commit -m "feat: SlideOver panel lateral con animación spring"
```

---

## Task 9: Componente FormInput

**Files:**
- Create: `client/src/components/auth/FormInput.jsx`

- [ ] **Step 1: Crear FormInput.jsx**

```jsx
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  error,
}) {
  const [showPwd, setShowPwd] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPwd = type === 'password'
  const inputType = isPwd ? (showPwd ? 'text' : 'password') : type
  const floated = focused || value

  return (
    <div className="relative">
      <label
        className={[
          'absolute left-3 transition-all duration-150 pointer-events-none z-10',
          floated
            ? 'top-1.5 text-[11px] text-ink-3 font-medium'
            : 'top-1/2 -translate-y-1/2 text-sm text-ink-3',
        ].join(' ')}
      >
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        type={inputType}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={[
          'w-full pt-5 pb-2 px-3 bg-surface border rounded-md text-sm text-ink outline-none transition-all duration-150',
          isPwd ? 'pr-10' : '',
          error
            ? 'border-danger-border focus:ring-2 focus:ring-danger/20 focus:border-danger'
            : 'border-border focus:ring-2 focus:ring-brand/20 focus:border-brand',
        ].join(' ')}
      />
      {isPwd && (
        <button
          type="button"
          onClick={() => setShowPwd(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
        >
          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/auth/FormInput.jsx
git commit -m "feat: FormInput con label flotante y toggle de contraseña"
```

---

## Task 10: Componente Spinner

**Files:**
- Rewrite: `client/src/components/ui/Spinner.jsx`

- [ ] **Step 1: Reescribir Spinner.jsx**

```jsx
export default function Spinner({ message = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-8 h-8 rounded-full border-2 border-border border-t-brand"
        style={{ animation: 'spin 0.7s linear infinite' }}
      />
      <p className="text-sm text-ink-3">{message}</p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ui/Spinner.jsx
git commit -m "feat: Spinner minimalista"
```

---

## Task 11: KPICard (Stats Card)

**Files:**
- Rewrite: `client/src/components/dashboard/KPICard.jsx`

- [ ] **Step 1: Reescribir KPICard.jsx**

```jsx
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({
  icon: Icon,
  value,
  label,
  trend,
  trendLabel,
  onClick,
}) {
  const isUp = trend === 'up'
  const isDown = trend === 'down'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left w-full bg-surface border border-border rounded-lg p-5 transition-all duration-200',
        onClick ? 'hover:shadow-md hover:border-border-strong cursor-pointer' : 'cursor-default',
      ].join(' ')}
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="p-2 bg-subtle rounded-md">
            <Icon size={16} className="text-ink-2" />
          </div>
        )}
        {trendLabel && (
          <span className={[
            'inline-flex items-center gap-0.5 text-xs font-medium',
            isUp ? 'text-success' : isDown ? 'text-danger' : 'text-ink-3',
          ].join(' ')}>
            {isUp && <TrendingUp size={12} />}
            {isDown && <TrendingDown size={12} />}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="font-mono text-2xl font-semibold text-ink leading-none mb-1.5">
        {value}
      </p>
      <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">
        {label}
      </p>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/KPICard.jsx
git commit -m "feat: KPICard stats premium con indicador de tendencia"
```

---

## Task 12: Sidebar rediseñado

**Files:**
- Rewrite: `client/src/components/dashboard/Sidebar.jsx`

- [ ] **Step 1: Reescribir Sidebar.jsx**

```jsx
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileSearch, Settings, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Inicio',          icon: LayoutDashboard, path: '/dashboard' },
  { key: 'licitaciones', label: 'Licitaciones',     icon: FileSearch,      path: '/dashboard/licitaciones' },
  { key: 'configuracion',label: 'Configuración',    icon: Settings,        path: '/dashboard/configuracion' },
]
const ADMIN_ITEM = { key: 'admin', label: 'Admin', icon: ShieldCheck, path: '/dashboard/admin' }

export default function Sidebar({ collapsed, onToggle }) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const items = usuario?.rol === 'superadmin' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  function isActive(item) {
    if (item.path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(item.path)
  }

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        transition: 'width 0.2s var(--ease)',
        minHeight: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 30,
      }}
      className="bg-surface border-r border-border flex flex-col"
    >
      {/* Logo */}
      <div
        className="flex items-center border-b border-border shrink-0"
        style={{ height: 56, padding: collapsed ? '0' : '0 16px', justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        {collapsed ? (
          <span className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white text-xs font-bold">L</span>
        ) : (
          <span className="font-semibold text-ink text-[15px] tracking-tight">LiciTraker</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150',
                active ? 'bg-brand-light text-brand' : 'text-ink-2 hover:text-ink hover:bg-subtle',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{usuario?.nombre ?? 'Usuario'}</p>
              <p className="text-[11px] text-ink-3 truncate">{usuario?.empresa ?? ''}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={[
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-3 hover:text-danger hover:bg-danger-light transition-colors',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOut size={14} />
          {!collapsed && 'Cerrar sesión'}
        </button>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={[
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-ink-3 hover:text-ink-2 hover:bg-subtle transition-colors',
            collapsed ? 'justify-center' : 'justify-between',
          ].join(' ')}
        >
          {!collapsed && <span>Colapsar</span>}
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/Sidebar.jsx
git commit -m "feat: Sidebar blanco colapsable con nav limpia"
```

---

## Task 13: Header rediseñado

**Files:**
- Rewrite: `client/src/components/dashboard/Header.jsx`

- [ ] **Step 1: Reescribir Header.jsx**

```jsx
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header({ title, sidebarWidth = 220 }) {
  const { usuario } = useAuth()
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header
      className="fixed top-0 right-0 bg-surface border-b border-border flex items-center px-6 gap-4 z-20"
      style={{
        left: sidebarWidth,
        height: 56,
        transition: 'left 0.2s var(--ease)',
      }}
    >
      <h1 className="font-semibold text-ink text-[15px] shrink-0">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button className="p-1.5 rounded-md text-ink-3 hover:text-ink-2 hover:bg-subtle transition-colors">
          <Bell size={17} />
        </button>
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold">
          {initials}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/Header.jsx
git commit -m "feat: Header blanco con avatar y notificaciones"
```

---

## Task 14: DashboardLayout rediseñado

**Files:**
- Rewrite: `client/src/components/dashboard/DashboardLayout.jsx`

- [ ] **Step 1: Reescribir DashboardLayout.jsx**

```jsx
import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function DashboardLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const sw = collapsed ? 56 : 220

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        style={{
          marginLeft: sw,
          transition: 'margin-left 0.2s var(--ease)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header title={title} sidebarWidth={sw} />
        <main
          style={{
            flex: 1,
            paddingTop: 56,
            padding: '80px clamp(1rem, 3vw, 2rem) 2rem',
            maxWidth: 1400,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
```

> Nota: se elimina la prop `filtros` — los filtros de Licitaciones se mueven dentro de la propia página.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/DashboardLayout.jsx
git commit -m "feat: DashboardLayout con sidebar colapsable y header reactivo"
```

---

## Task 15: TablaUrgentes rediseñada

**Files:**
- Rewrite: `client/src/components/dashboard/TablaUrgentes.jsx`

- [ ] **Step 1: Reescribir TablaUrgentes.jsx**

```jsx
import { Check } from 'lucide-react'
import DataTable from '../ui/DataTable.jsx'
import Badge from '../ui/Badge.jsx'
import { diasRestantes, formatImporte } from '../../utils/format.js'

const ESTADO_VARIANT = {
  Guardada:   'guardada',
  Estudiando: 'proximo',
  Presentada: 'presentada',
  Nueva:      'neutral',
}

function diasVariant(dias) {
  if (dias === null) return 'neutral'
  if (dias < 3) return 'urgente'
  if (dias <= 7) return 'proximo'
  return 'enplazo'
}

export default function TablaUrgentes({ items, estados, onMarcarPresentada }) {
  const columns = [
    {
      key: 'titulo',
      label: 'Licitación',
      render: (v) => (
        <span className="font-medium text-ink line-clamp-2 max-w-xs block">{v || 'Sin título'}</span>
      ),
    },
    {
      key: 'provincia',
      label: 'Provincia',
      render: (v) => <span className="text-ink-2">{v || '—'}</span>,
    },
    {
      key: 'importe',
      label: 'Presupuesto',
      align: 'right',
      mono: true,
      sortable: true,
      render: (v) => {
        const f = formatImporte(v)
        return f
          ? <span className="text-brand font-medium">{f} €</span>
          : <span className="text-ink-3 text-xs italic">Consultar</span>
      },
    },
    {
      key: 'fechaLimite',
      label: 'Días',
      align: 'right',
      sortable: true,
      render: (v) => {
        const d = diasRestantes(v)
        if (d === null) return <span className="text-ink-3 text-xs">—</span>
        return <Badge variant={diasVariant(d)}>{d}d</Badge>
      },
    },
    {
      key: 'expediente',
      label: 'Estado',
      render: (v) => {
        const estado = estados[v] || 'Nueva'
        return <Badge variant={ESTADO_VARIANT[estado] ?? 'neutral'}>{estado}</Badge>
      },
    },
    {
      key: '_accion',
      label: '',
      render: (_, row) => {
        const estado = estados[row.expediente] || 'Nueva'
        if (estado === 'Presentada') return null
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onMarcarPresentada(row.expediente) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-light text-brand border border-brand-mid hover:bg-brand-mid transition-colors"
          >
            <Check size={12} />
            Marcar presentada
          </button>
        )
      },
    },
  ]

  if (!items.length) {
    return (
      <p className="text-sm text-ink-3 py-8 text-center">
        No hay licitaciones guardadas con plazo próximo.
      </p>
    )
  }

  return <DataTable columns={columns} data={items} />
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/TablaUrgentes.jsx
git commit -m "feat: TablaUrgentes con DataTable premium"
```

---

## Task 16: AuthLayout + Login + Registro

**Files:**
- Rewrite: `client/src/components/auth/AuthLayout.jsx`
- Rewrite: `client/src/pages/Login.jsx`
- Rewrite: `client/src/pages/Registro.jsx`

- [ ] **Step 1: Reescribir AuthLayout.jsx**

```jsx
import { motion } from 'framer-motion'

export default function AuthLayout({ children, titulo, subtitulo }) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel marca */}
      <div
        className="auth-brand hidden md:flex flex-col justify-between p-10 flex-none"
        style={{
          width: '44%',
          background: 'var(--brand)',
          color: 'var(--text-inverse)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">L</span>
          <span className="font-semibold text-[15px]">LiciTraker</span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight mb-3" style={{ maxWidth: 360 }}>
            Licitaciones públicas de obra, sin perder tiempo
          </h2>
          <p className="text-sm opacity-70 leading-relaxed" style={{ maxWidth: 320 }}>
            Datos oficiales del Gobierno de España actualizados 3 veces al día. Resúmenes con IA para decidir en segundos.
          </p>
        </div>

        <p className="text-xs opacity-40">
          Datos de PLACSP — Plataforma de Contratación del Sector Público
        </p>
      </div>

      {/* Panel formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10" style={{ background: 'var(--bg-base)' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
          style={{ maxWidth: 380 }}
        >
          <h1 className="text-2xl font-semibold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-sm text-ink-3 mb-7">{subtitulo}</p>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Reescribir Login.jsx**

> Preservar toda la lógica de `useAuth().login()`, estados `error` y `enviando`, y la navegación a `/dashboard`.

```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormInput from '../components/auth/FormInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Bienvenido de nuevo" subtitulo="Accede a tu cuenta para continuar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <FormInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-xs text-danger bg-danger-light border border-danger-border rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-60 transition-colors duration-150 mt-2"
        >
          <LogIn size={15} />
          {enviando ? 'Accediendo...' : 'Acceder'}
        </button>

        <p className="text-center text-xs text-ink-3 pt-1">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-brand font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 3: Reescribir Registro.jsx**

> Preservar la lógica de validación (contraseñas coinciden, mínimo 8 caracteres), `useAuth().register()`, y la navegación post-registro.

```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormInput from '../components/auth/FormInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Registro() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [empresa, setEmpresa] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }
    setEnviando(true)
    try {
      await register({ empresa, nombre, email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Crear cuenta" subtitulo="Empieza a gestionar licitaciones hoy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Empresa" value={empresa} onChange={setEmpresa} required />
        <FormInput label="Nombre" value={nombre} onChange={setNombre} required autoComplete="name" />
        <FormInput label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <FormInput label="Contraseña" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
        <FormInput label="Confirmar contraseña" type="password" value={confirmar} onChange={setConfirmar} required autoComplete="new-password" />

        {error && (
          <p className="text-xs text-danger bg-danger-light border border-danger-border rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-60 transition-colors duration-150 mt-2"
        >
          <UserPlus size={15} />
          {enviando ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-xs text-ink-3 pt-1">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 4: Eliminar archivos obsoletos del auth**

No hay archivos de auth adicionales que eliminar en este task.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/auth/AuthLayout.jsx client/src/pages/Login.jsx client/src/pages/Registro.jsx
git commit -m "feat: Auth rediseñado — split panel, FormInput flotante, Geist"
```

---

## Task 17: Dashboard rediseñado

**Files:**
- Rewrite: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Reescribir Dashboard.jsx**

> Preservar: `useApp()` hooks, `fetch('/api/licitaciones')`, lógica de `atencion`, `togglePanel`, `marcarPresentada`.

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Bookmark, Send, Check } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import TablaUrgentes from '../components/dashboard/TablaUrgentes.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { diasRestantes, formatImporte } from '../utils/format.js'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function TarjetaCompacta({ licitacion: l, accion }) {
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)
  const diasColor = dias === null ? 'var(--text-muted)' : dias < 3 ? 'var(--danger)' : dias <= 7 ? 'var(--warning)' : 'var(--brand)'

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-border rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-ink truncate">{l.titulo || 'Sin título'}</p>
        <p className="text-xs text-ink-3 mt-0.5 flex gap-3">
          <span>{l.provincia || '—'}</span>
          <span>{importe ? `${importe} €` : 'Consultar'}</span>
          {dias !== null && <span style={{ color: diasColor, fontWeight: 600 }}>{dias}d</span>}
        </p>
      </div>
      {accion}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { licitacionesGuardadas, licitacionesPresentadas, marcarPresentada } = useApp()
  const [total, setTotal] = useState(0)
  const [panel, setPanel] = useState(null)

  const empresa = usuario?.empresa || 'Tu empresa'

  useEffect(() => {
    document.title = 'LiciTraker · Dashboard'
    fetch('/api/licitaciones')
      .then(r => r.json())
      .then(d => setTotal(d.total || 0))
      .catch(() => {})
    return () => { document.title = 'LiciTraker' }
  }, [])

  const atencion = licitacionesGuardadas.filter(l => {
    const d = diasRestantes(l.fechaLimite)
    return d !== null && d >= 0 && d <= 7
  })
  const estadosAtencion = Object.fromEntries(
    atencion.map(l => [l.expediente, 'Guardada'])
  )

  return (
    <DashboardLayout title="Inicio">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
          {empresa}
        </h2>
        <p className="text-sm text-ink-3 mt-1">{fechaLarga()}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <KPICard
          icon={Building2}
          value={total}
          label="Licitaciones activas"
          onClick={() => navigate('/dashboard/licitaciones')}
        />
        <KPICard
          icon={Bookmark}
          value={licitacionesGuardadas.length}
          label="Licitaciones guardadas"
          onClick={() => setPanel(p => p === 'guardadas' ? null : 'guardadas')}
        />
        <KPICard
          icon={Send}
          value={licitacionesPresentadas.length}
          label="Ofertas presentadas"
          onClick={() => setPanel(p => p === 'presentadas' ? null : 'presentadas')}
        />
      </div>

      {/* Panel expandible */}
      <AnimatePresence>
        {panel && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden mb-8"
          >
            <h3 className="text-base font-semibold text-ink mb-4">
              {panel === 'guardadas' ? 'Licitaciones guardadas' : 'Ofertas presentadas'}
            </h3>
            <div className="space-y-2">
              {panel === 'guardadas' && (
                licitacionesGuardadas.length === 0
                  ? <p className="text-sm text-ink-3">Aún no has guardado ninguna licitación.</p>
                  : licitacionesGuardadas.map(l => (
                      <TarjetaCompacta
                        key={l.expediente}
                        licitacion={l}
                        accion={
                          <button
                            onClick={() => marcarPresentada(l.expediente)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-light text-brand border border-brand-mid hover:bg-brand-mid transition-colors shrink-0"
                          >
                            <Check size={12} />
                            Marcar presentada
                          </button>
                        }
                      />
                    ))
              )}
              {panel === 'presentadas' && (
                licitacionesPresentadas.length === 0
                  ? <p className="text-sm text-ink-3">Aún no has marcado ninguna oferta como presentada.</p>
                  : licitacionesPresentadas.map(l => (
                      <TarjetaCompacta key={l.expediente} licitacion={l} />
                    ))
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Atención requerida */}
      {atencion.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-ink mb-1">Atención requerida</h3>
          <p className="text-sm text-ink-3 mb-4">Licitaciones guardadas con plazo próximo</p>
          <TablaUrgentes items={atencion} estados={estadosAtencion} onMarcarPresentada={marcarPresentada} />
        </section>
      )}
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "feat: Dashboard rediseñado con KPIs premium y tabla de urgentes"
```

---

## Task 18: Licitaciones rediseñada

**Files:**
- Rewrite: `client/src/pages/Licitaciones.jsx`
- Delete: `client/src/components/cards/LicitacionCard.jsx`
- Delete: `client/src/components/cards/LicitacionModal.jsx`
- Delete: `client/src/components/ui/FiltroBarra.jsx`
- Delete: `client/src/components/ui/BlueprintFrame.jsx`

- [ ] **Step 1: Reescribir Licitaciones.jsx**

> Preservar: todos los estados (licitaciones, cargando, error, cpvQuery, cpvResultados, filtros), todos los fetch calls, la lógica de filtrado (`licitacionesFiltradas`), `useApp()` para guardar/quitar.

```jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX, WifiOff, Sparkles, Bookmark, BookmarkCheck, Hash, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import Badge from '../components/ui/Badge.jsx'
import SlideOver from '../components/ui/SlideOver.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { tipoBadge, diasRestantes, formatImporte } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'

const BADGE_VARIANT = {
  urgente:  'urgente',
  proximo:  'proximo',
  enplazo:  'enplazo',
  sinplazo: 'sinplazo',
}

const IMPORTES = [
  { value: '',       label: 'Todos los importes' },
  { value: 'menos50', label: '< 50.000 €' },
  { value: '50a200',  label: '50.000 – 200.000 €' },
  { value: '200a1m',  label: '200.000 – 1.000.000 €' },
  { value: 'mas1m',   label: '> 1.000.000 €' },
]

function DetalleLicitacion({ licitacion: l, guardada, onToggleGuardar, onResumenIA }) {
  if (!l) return null
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)
  const variant = BADGE_VARIANT[tipoBadge(l.fechaLimite)] ?? 'neutral'

  const campo = (label, valor) => (
    <div className="py-3 border-b border-border last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-1">{label}</p>
      <p className="text-sm text-ink leading-relaxed">{valor || '—'}</p>
    </div>
  )

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <Badge variant={variant}>
          {tipoBadge(l.fechaLimite)}{dias !== null ? ` · ${dias}d` : ''}
        </Badge>
      </div>

      <h3 className="text-base font-semibold text-ink leading-snug mb-5">{l.titulo}</h3>

      <div className="flex gap-2 mb-6">
        <button
          onClick={onResumenIA}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-colors"
        >
          <Sparkles size={13} />
          Resumen IA
        </button>
        <button
          onClick={onToggleGuardar}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors',
            guardada
              ? 'bg-brand-light text-brand border-brand-mid hover:bg-brand-mid'
              : 'bg-subtle text-ink-2 border-border hover:bg-muted',
          ].join(' ')}
        >
          {guardada ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {guardada ? 'Guardada' : 'Guardar'}
        </button>
      </div>

      <div>
        {campo('Organismo', l.organismo)}
        {campo('Provincia', l.provincia)}
        {campo('Presupuesto', importe ? `${importe} €` : null)}
        {campo('Fecha límite', l.fechaLimite)}
        {campo('Expediente', l.expediente)}
        {campo('Código CPV', l.cpv)}
        {l.descripcion && campo('Descripción', l.descripcion)}
      </div>
    </div>
  )
}

export default function Licitaciones() {
  const navigate = useNavigate()
  const { licitacionesGuardadas, guardarLicitacion, quitarLicitacion } = useApp()

  const [licitaciones, setLicitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroImporte, setFiltroImporte] = useState('')
  const [filtroProvincia, setFiltroProvincia] = useState('')

  const [cpvQuery, setCpvQuery] = useState('')
  const [cpvResultados, setCpvResultados] = useState(null)
  const [cpvCargando, setCpvCargando] = useState(false)
  const [cpvBuscadoCodigo, setCpvBuscadoCodigo] = useState('')
  const [cpvError, setCpvError] = useState(null)

  const cargarDatos = useCallback(() => {
    fetch('/api/licitaciones')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLicitaciones(d.licitaciones || []); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    document.title = 'LiciTraker · Licitaciones'
    cargarDatos()
    return () => { document.title = 'LiciTraker' }
  }, [cargarDatos])

  const actualizar = () => {
    setCargando(true); setError(null)
    fetch('/api/licitaciones?refresh=1')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLicitaciones(d.licitaciones || []) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }

  const buscarCPV = useCallback(() => {
    const codigo = cpvQuery.trim()
    if (!codigo) { setCpvResultados(null); setCpvBuscadoCodigo(''); setCpvError(null); return }
    if (!/^\d{2,}$/.test(codigo)) { setCpvError('Código CPV inválido (solo números, mínimo 2 dígitos)'); return }
    setCpvError(null); setCpvCargando(true)
    fetch(`/api/buscar-cpv?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setCpvResultados(d.licitaciones || []); setCpvBuscadoCodigo(codigo) })
      .catch(e => setCpvError(e.message))
      .finally(() => setCpvCargando(false))
  }, [cpvQuery])

  const provincias = useMemo(() => [...new Set(licitaciones.map(l => l.provincia).filter(Boolean))].sort(), [licitaciones])

  const licitacionesFiltradas = useMemo(() => {
    return licitaciones.filter(l => {
      if (l.fechaLimite) {
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        if (new Date(l.fechaLimite + 'T00:00:00') <= hoy) return false
      }
      if (textoBusqueda) {
        const t = textoBusqueda.toLowerCase()
        if (!l.titulo?.toLowerCase().includes(t) && !l.organismo?.toLowerCase().includes(t)) return false
      }
      if (filtroUrgencia && tipoBadge(l.fechaLimite) !== filtroUrgencia) return false
      if (filtroImporte && l.importe != null) {
        const imp = parseFloat(l.importe)
        if (filtroImporte === 'menos50' && imp >= 50000) return false
        if (filtroImporte === '50a200'  && (imp < 50000  || imp >= 200000)) return false
        if (filtroImporte === '200a1m'  && (imp < 200000 || imp >= 1000000)) return false
        if (filtroImporte === 'mas1m'   && imp < 1000000) return false
      }
      if (filtroProvincia && l.provincia !== filtroProvincia) return false
      return true
    })
  }, [licitaciones, textoBusqueda, filtroUrgencia, filtroImporte, filtroProvincia])

  const listaActiva = cpvResultados !== null ? cpvResultados : licitacionesFiltradas

  const isGuardada = (l) => licitacionesGuardadas.some(g => g.expediente === l.expediente)
  const toggleGuardar = (l) => isGuardada(l) ? quitarLicitacion(l.expediente) : guardarLicitacion(l)

  const columns = [
    {
      key: 'fechaLimite',
      label: '',
      render: (v) => {
        const tipo = tipoBadge(v)
        return <Badge variant={BADGE_VARIANT[tipo] ?? 'neutral'} showDot={false} className="text-[10px]">{tipo}</Badge>
      },
    },
    {
      key: 'titulo',
      label: 'Licitación',
      render: (v, row) => (
        <div>
          <p className="font-medium text-ink text-sm line-clamp-2 max-w-sm">{v || 'Sin título'}</p>
          <p className="text-xs text-ink-3 mt-0.5">{row.organismo || '—'}</p>
        </div>
      ),
    },
    {
      key: 'importe',
      label: 'Presupuesto',
      align: 'right',
      mono: true,
      sortable: true,
      render: (v) => {
        const f = formatImporte(v)
        return f ? <span className="text-ink font-medium">{f} €</span> : <span className="text-ink-3 text-xs">—</span>
      },
    },
    {
      key: 'fechaLimite',
      label: 'Días',
      align: 'right',
      sortable: true,
      render: (v) => {
        const d = diasRestantes(v)
        if (d === null) return <span className="text-ink-3 text-xs">—</span>
        const variant = d < 3 ? 'urgente' : d <= 7 ? 'proximo' : 'enplazo'
        return <Badge variant={variant}>{d}d</Badge>
      },
    },
    {
      key: '_acciones',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => navigate('/dashboard/resumen', { state: { licitacion: row } })}
            className="p-1.5 rounded text-ink-3 hover:text-brand hover:bg-brand-light transition-colors"
            title="Resumen IA"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={() => toggleGuardar(row)}
            className={`p-1.5 rounded transition-colors ${isGuardada(row) ? 'text-brand' : 'text-ink-3 hover:text-brand hover:bg-brand-light'}`}
            title={isGuardada(row) ? 'Quitar' : 'Guardar'}
          >
            {isGuardada(row) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Licitaciones">
      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-surface border border-border rounded-lg">
        <SearchInput
          value={textoBusqueda}
          onChange={setTextoBusqueda}
          placeholder="Buscar título u organismo..."
          onClear={() => setTextoBusqueda('')}
          className="flex-1 min-w-48"
        />

        {/* CPV search */}
        <div className="relative flex items-center min-w-44">
          <Hash size={14} className="absolute left-3 text-ink-3 pointer-events-none" />
          <input
            type="text"
            value={cpvQuery}
            onChange={e => setCpvQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarCPV()}
            placeholder="Código CPV..."
            className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>

        <select
          value={filtroProvincia}
          onChange={e => setFiltroProvincia(e.target.value)}
          className="py-2 px-3 bg-surface border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        >
          <option value="">Todas las provincias</option>
          {provincias.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filtroImporte}
          onChange={e => setFiltroImporte(e.target.value)}
          className="py-2 px-3 bg-surface border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        >
          {IMPORTES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          onClick={cpvResultados !== null ? buscarCPV : actualizar}
          disabled={cargando || cpvCargando}
          className="p-2 rounded-md text-ink-3 hover:text-brand hover:bg-brand-light border border-border transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={15} className={(cargando || cpvCargando) ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Estado: errores */}
      {(error || cpvError) && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-danger-light border border-danger-border rounded-lg text-sm text-danger">
          <WifiOff size={16} className="shrink-0" />
          {error || cpvError}
        </div>
      )}

      {/* Estado: cargando */}
      {(cargando || cpvCargando) && <Spinner />}

      {/* Contador CPV */}
      {cpvResultados !== null && !cpvCargando && (
        <p className="text-xs text-ink-3 mb-3">
          {cpvResultados.length} licitaciones para CPV {cpvBuscadoCodigo}
          {' · '}
          <button
            onClick={() => { setCpvResultados(null); setCpvQuery(''); setCpvBuscadoCodigo('') }}
            className="text-brand hover:underline"
          >
            Limpiar
          </button>
        </p>
      )}

      {/* Estado vacío */}
      {!cargando && !cpvCargando && !error && listaActiva.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-ink-3">
          <SearchX size={36} className="opacity-40" />
          <p className="font-medium text-sm">No hay licitaciones con estos filtros</p>
          <p className="text-xs">Prueba a ampliar la búsqueda</p>
        </div>
      )}

      {/* Tabla */}
      {!cargando && !cpvCargando && listaActiva.length > 0 && (
        <DataTable
          columns={columns}
          data={listaActiva}
          onRowClick={setSeleccionada}
          emptyMessage="Sin licitaciones"
        />
      )}

      {/* SlideOver de detalle */}
      <SlideOver
        open={seleccionada !== null}
        onClose={() => setSeleccionada(null)}
        title={seleccionada?.titulo ?? ''}
      >
        <DetalleLicitacion
          licitacion={seleccionada}
          guardada={seleccionada ? isGuardada(seleccionada) : false}
          onToggleGuardar={() => seleccionada && toggleGuardar(seleccionada)}
          onResumenIA={() => { navigate('/dashboard/resumen', { state: { licitacion: seleccionada } }); setSeleccionada(null) }}
        />
      </SlideOver>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Eliminar archivos obsoletos**

```bash
rm client/src/components/cards/LicitacionCard.jsx
rm client/src/components/cards/LicitacionModal.jsx
rm client/src/components/ui/FiltroBarra.jsx
rm client/src/components/ui/BlueprintFrame.jsx
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Licitaciones con DataTable, SlideOver y filtros premium"
```

---

## Task 19: ResumenIA rediseñado

**Files:**
- Rewrite: `client/src/pages/ResumenIA.jsx`

- [ ] **Step 1: Reescribir ResumenIA.jsx**

> Preservar: `useLocation().state.licitacion`, `useNavigate()`, y todos los campos mostrados.

```jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { formatImporte, diasRestantes } from '../utils/format.js'

function Campo({ label, valor, mono = false }) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-1.5">{label}</p>
      <p className={`text-sm text-ink leading-relaxed ${mono ? 'font-mono' : ''}`}>
        {valor ?? '—'}
      </p>
    </div>
  )
}

export default function ResumenIA() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const l = state?.licitacion

  if (!l) {
    return (
      <DashboardLayout title="Resumen IA">
        <p className="text-sm text-ink-3">No hay licitación seleccionada.</p>
      </DashboardLayout>
    )
  }

  const importe = formatImporte(l.importe)
  const dias = diasRestantes(l.fechaLimite)

  return (
    <DashboardLayout title="Resumen IA">
      <div style={{ maxWidth: 720 }}>
        {/* Volver */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        {/* Título */}
        <h2 className="text-xl font-semibold text-ink mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.35 }}>
          {l.titulo || 'Sin título'}
        </h2>
        {dias !== null && (
          <p className="text-sm text-ink-3 mb-6">
            {dias < 3 ? '⚠️' : dias <= 7 ? '⏳' : '📅'} {dias} días restantes
          </p>
        )}

        {/* Campos */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <Campo label="Organismo" valor={l.organismo} />
          <Campo label="Provincia" valor={l.provincia} />
          <Campo label="Presupuesto" valor={importe ? `${importe} €` : null} mono />
          <Campo label="Fecha límite" valor={l.fechaLimite} mono />
          <Campo label="Expediente" valor={l.expediente} mono />
          <Campo label="Código CPV" valor={l.cpv} mono />
          {l.descripcion && <Campo label="Descripción" valor={l.descripcion} />}
          {l.organismo_url && (
            <div className="py-4 border-b border-border last:border-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-1.5">Enlace oficial</p>
              <a
                href={l.organismo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline break-all"
              >
                {l.organismo_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/ResumenIA.jsx
git commit -m "feat: ResumenIA con layout 1 columna editorial"
```

---

## Task 20: Configuración rediseñada

**Files:**
- Rewrite: `client/src/pages/Configuracion.jsx`

- [ ] **Step 1: Reescribir Configuracion.jsx**

> Preservar todos los estados: `tab`, `provinciasActivas`, `tiposActivos`, `plazosActivos`, `notificaciones`, `importeMin`. Preservar la lógica de toggle de checkboxes.

```jsx
import { useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import { Save } from 'lucide-react'

const TABS = [
  { id: 'perfil',          label: 'Perfil' },
  { id: 'preferencias',    label: 'Preferencias' },
  { id: 'notificaciones',  label: 'Notificaciones' },
  { id: 'crm',             label: 'Integrar CRM' },
]

const TIPOS_OBRA = [
  'Obra civil','Pavimentación','Urbanización','Edificación',
  'Rehabilitación','Instalaciones','Demolición','Ingeniería civil','Obras especiales',
]

const PROVINCIAS = [
  'Navarra','La Rioja','País Vasco','Aragón','Madrid',
  'Cataluña','Andalucía','Valencia','Galicia','Castilla y León',
]

const PROVINCIAS_ACTIVAS_INICIAL = ['Navarra','La Rioja','País Vasco']

const PLAZOS = [
  { value: 'urgente', label: 'Urgente (menos de 7 días)' },
  { value: 'proximo', label: 'Próximo (7 a 14 días)' },
  { value: 'enplazo', label: 'En plazo (más de 14 días)' },
  { value: 'todos',   label: 'Todos' },
]

const NOTIFS_INICIAL = [
  { id: 'email-nuevas',    label: 'Nuevas licitaciones por email', descripcion: 'Recibe un correo cuando aparezcan licitaciones que coincidan con tus preferencias', valor: true },
  { id: 'alertas-plazo',   label: 'Alertas de fechas próximas (3 días)', descripcion: 'Aviso cuando el plazo de una licitación guardada esté a 3 días o menos de vencer', valor: true },
  { id: 'resumen-semanal', label: 'Resumen semanal', descripcion: 'Un correo semanal con un resumen de actividad y nuevas oportunidades', valor: false },
  { id: 'notif-navegador', label: 'Notificaciones en el navegador', descripcion: 'Avisos emergentes mientras tienes LiciTraker abierto', valor: true },
]

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">{children}</p>
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150',
        active
          ? 'bg-brand-light text-brand border-brand-mid'
          : 'bg-surface text-ink-2 border-border hover:border-border-strong',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors duration-150',
          checked ? 'bg-brand' : 'bg-muted',
        ].join(' ')}
      >
        <span className={[
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150',
          checked ? 'left-[18px]' : 'left-0.5',
        ].join(' ')} />
      </button>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  )
}

function SaveButton() {
  return (
    <div className="flex justify-end pt-4 mt-4 border-t border-border">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors"
      >
        <Save size={14} />
        Guardar cambios
      </button>
    </div>
  )
}

export default function Configuracion() {
  const [tab, setTab] = useState('perfil')
  const [provinciasActivas, setProvinciasActivas] = useState(new Set(PROVINCIAS_ACTIVAS_INICIAL))
  const [tiposActivos, setTiposActivos] = useState(new Set(['Obra civil', 'Pavimentación']))
  const [plazosActivos, setPlazosActivos] = useState(new Set(['todos']))
  const [notificaciones, setNotificaciones] = useState(NOTIFS_INICIAL)
  const [importeMin, setImporteMin] = useState('30000')

  function toggleSet(setter, value) {
    setter(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  function toggleNotif(id) {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, valor: !n.valor } : n))
  }

  return (
    <DashboardLayout title="Configuración">
      <div style={{ maxWidth: 720 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        <div className="pt-6">
          {tab === 'perfil' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Nombre de empresa</label>
                <input
                  type="text"
                  defaultValue="Constructora García"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Nombre de contacto</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <SaveButton />
            </div>
          )}

          {tab === 'preferencias' && (
            <div className="space-y-7">
              <div>
                <SectionLabel>Tipos de obra</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_OBRA.map(t => (
                    <Chip key={t} active={tiposActivos.has(t)} onClick={() => toggleSet(setTiposActivos, t)}>{t}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Provincias de interés</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {PROVINCIAS.map(p => (
                    <Chip key={p} active={provinciasActivas.has(p)} onClick={() => toggleSet(setProvinciasActivas, p)}>{p}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Plazos de urgencia</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {PLAZOS.map(p => (
                    <Chip key={p.value} active={plazosActivos.has(p.value)} onClick={() => toggleSet(setPlazosActivos, p.value)}>{p.label}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Importe mínimo (€)</SectionLabel>
                <input
                  type="number"
                  value={importeMin}
                  onChange={e => setImporteMin(e.target.value)}
                  className="w-40 px-3 py-2 border border-border rounded-md text-sm font-mono text-ink outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>

              <SaveButton />
            </div>
          )}

          {tab === 'notificaciones' && (
            <div>
              {notificaciones.map(n => (
                <Toggle
                  key={n.id}
                  checked={n.valor}
                  onChange={() => toggleNotif(n.id)}
                  label={n.label}
                  description={n.descripcion}
                />
              ))}
              <SaveButton />
            </div>
          )}

          {tab === 'crm' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-3">
                Conecta LiciTraker con tu CRM para sincronizar licitaciones automáticamente.
              </p>
              {['HubSpot', 'Salesforce', 'Pipedrive'].map(crm => (
                <div key={crm} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <p className="text-sm font-medium text-ink">{crm}</p>
                  <button className="px-3 py-1.5 rounded-md text-xs font-semibold border border-border text-ink-2 hover:border-brand hover:text-brand transition-colors">
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Configuracion.jsx
git commit -m "feat: Configuración con Tabs premium, Chips y Toggles"
```

---

## Task 21: Admin rediseñado

**Files:**
- Rewrite: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Reescribir Admin.jsx**

> Preservar: el fetch a `/api/admin/stats`, los estados `stats` y `cargando`, la verificación de superadmin.

```jsx
import { useEffect, useState } from 'react'
import { Database, Cpu, HardDrive, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import Alert from '../components/ui/Alert.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Admin() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (usuario?.rol !== 'superadmin') return
    document.title = 'LiciTraker · Admin'
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setStats(d) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
    return () => { document.title = 'LiciTraker' }
  }, [usuario])

  if (usuario?.rol !== 'superadmin') {
    return (
      <DashboardLayout title="Admin">
        <Alert variant="error" title="Acceso denegado">
          Esta sección está restringida a administradores del sistema.
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Administración">
      {error && (
        <Alert variant="error" title="Error al cargar estadísticas" className="mb-6">
          {error}
        </Alert>
      )}

      {cargando && (
        <p className="text-sm text-ink-3 mb-6 flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Cargando estadísticas...
        </p>
      )}

      {stats && (
        <>
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <KPICard icon={Database} value={stats.totalLicitaciones ?? '—'} label="Licitaciones en BD" />
            <KPICard icon={Cpu} value={stats.procesadasHoy ?? '—'} label="Procesadas hoy" />
            <KPICard icon={HardDrive} value={stats.cacheSize ?? '—'} label="Tamaño caché" />
          </div>

          {stats.alertas?.length > 0 && (
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-semibold text-ink">Alertas del sistema</h3>
              {stats.alertas.map((a, i) => (
                <Alert key={i} variant={a.tipo ?? 'info'} title={a.titulo}>
                  {a.mensaje}
                </Alert>
              ))}
            </div>
          )}

          {stats.logs?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Últimas actualizaciones</h3>
              <DataTable
                columns={[
                  { key: 'fecha', label: 'Fecha', mono: true },
                  { key: 'fuente', label: 'Fuente' },
                  { key: 'total', label: 'Registros', align: 'right', mono: true },
                  {
                    key: 'estado',
                    label: 'Estado',
                    render: v => {
                      const variant = v === 'ok' ? 'enplazo' : v === 'error' ? 'urgente' : 'neutral'
                      return <Badge variant={variant}>{v}</Badge>
                    },
                  },
                ]}
                data={stats.logs}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
```

> Nota: si `stats.alertas` o `stats.logs` no existen en la API actual, se renderizan silenciosamente (los arrays vacíos no muestran nada). Adaptar a la estructura real que devuelva `/api/admin/stats`.

- [ ] **Step 2: Añadir import de Badge en Admin.jsx** (necesario para la columna estado en logs)

```jsx
import Badge from '../components/ui/Badge.jsx'
```
Añadir junto a los demás imports.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Admin.jsx
git commit -m "feat: Admin rediseñado con KPIs, Alert y DataTable de logs"
```

---

## Task 22: Build de producción, verify y deploy

**Files:**
- Build output: `client/dist/`

- [ ] **Step 1: Build de producción**

```bash
cd client && npm run build
```
Esperado: `dist/` generado sin errores. Puede haber warnings de `unused vars` de imports eliminados — revisar y limpiar si los hay.

- [ ] **Step 2: Verificar que no quedan imports rotos**

```bash
npm run build 2>&1 | grep -E "error|Error|not found|Cannot find"
```
Esperado: sin salida (cero errores).

- [ ] **Step 3: Commit del build**

```bash
git add client/dist
git commit -m "build: producción con rediseño premium"
```

- [ ] **Step 4: Push a GitHub**

```bash
git push origin main
```

- [ ] **Step 5: Deploy al servidor Clouding**

```bash
ssh -i "C:\Users\Familia Carton Saera\.ssh\id_rsa_clouding" root@187.33.144.208 "cd /var/www/licitaplus-demo && git pull origin main && cd client && npm run build && pm2 restart LiciTraker"
```

- [ ] **Step 6: Verificar que la app responde**

```bash
ssh -i "C:\Users\Familia Carton Saera\.ssh\id_rsa_clouding" root@187.33.144.208 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/api/estado"
```
Esperado: `200`

- [ ] **Step 7: Commit final de cierre**

```bash
git add -A
git commit -m "feat: rediseño premium LiciTraker — Geist + Tailwind + 21st.dev components

- Tipografía unificada Geist Sans + Geist Mono
- Paleta light editorial con brand verde refinado
- DataTable, Badge, Alert, Tabs, SlideOver, FormInput, SearchInput, KPICard
- Sidebar colapsable, Header blanco, AuthLayout simplificado
- Licitaciones en tabla densa con SlideOver de detalle
- Deploy en producción (187.33.144.208:3002)"
git push origin main
```
