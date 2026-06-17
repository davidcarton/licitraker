# Visión general del negocio — Rediseño visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `VisionNegocio.jsx` (la pantalla "Inicio" del superadmin) con una cabecera (nombre/fecha/reloj en vivo), dos tarjetas héroe con desglose real al lado, y dos gráficas reales (crecimiento mensual de empresas, ingresos por plan), eliminando las tarjetas KPI sueltas que quedaban redundantes.

**Architecture:** El endpoint `GET /api/admin/negocio` cambia su contrato para sustituir `planMasContratado` por `desglosePorPlan` y añadir `crecimientoMensual`. `VisionNegocio.jsx` se reescribe con componentes locales nuevos (`Reloj`, `TarjetaHeroe`, `LineaDetalle`, `GraficaCrecimiento`, `GraficaIngresosPorPlan`) sin ninguna librería nueva — mismo patrón de barras con `div`/CSS que ya usa `GraficaResultados` en `Dashboard.jsx`. Se extrae `fechaLarga()` de `Dashboard.jsx` a `utils/format.js` como `formatFechaLarga()` para reutilizarla.

**Tech Stack:** Node.js + Express 5, Knex/PostgreSQL, React 19 + Vite, sin framework de tests (verificación manual con `node -e`, ESLint, `npm run build`).

## Global Constraints

- Cero datos inventados — cualquier número o barra debe venir de una consulta real a la BD. Si no hay datos, se muestra un estado vacío explícito ("Sin empresas de pago activas todavía"), nunca un valor relleno.
- Sin ninguna dependencia npm nueva — las gráficas se construyen con `div`/CSS, igual que `GraficaResultados` en `client/src/pages/Dashboard.jsx`.
- Todas las consultas de negocio siguen excluyendo `plan = 'admin'` (`whereNot('plan', 'admin')`).
- `desglosePorPlan` solo contiene planes que de verdad tienen ≥1 empresa activa — no se rellenan planes inexistentes con 0 (no hay tabla/enum de planes fijo).
- `crecimientoMensual` siempre tiene exactamente 6 entradas (mes actual + 5 anteriores), en orden cronológico ascendente, con `altas: 0` real para meses sin altas (nunca se omite un mes).
- `Dashboard.jsx` no cambia de comportamiento — solo pasa a importar `formatFechaLarga` desde `utils/format.js` en vez de definir `fechaLarga()` localmente.

---

### Task 1: Endpoint `GET /api/admin/negocio` — nuevo contrato

**Files:**
- Modify: `backend/src/routes/admin.js`

**Interfaces:**
- Produces: `GET /api/admin/negocio` → JSON:
  ```json
  {
    "totalEmpresas": 0, "totalActivas": 0, "totalInactivas": 0, "altasEstaSemana": 0,
    "mrr": 0,
    "desglosePorPlan": [{ "plan": "profesional", "empresasActivas": 3, "mrr": 149.7 }],
    "crecimientoMensual": [{ "mes": "2026-01", "etiqueta": "ene 26", "altas": 0 }]
  }
  ```
  Usado por `VisionNegocio.jsx` en las Tareas 3 y 4. `planMasContratado` deja de existir en la respuesta.

- [ ] **Step 1: Sustituir la ruta `/negocio`**

En `backend/src/routes/admin.js`, sustituir la ruta `router.get('/negocio', ...)` completa (la que calcula `filaPlan`/`planMasContratado`) por esta versión:

```js
router.get('/negocio', async (req, res) => {
  try {
    const baseQuery = () => db('empresas').whereNot('plan', 'admin')

    const [{ count: totalEmpresas }] = await baseQuery().count('id as count')
    const [{ count: totalActivas }] = await baseQuery().where('activa', true).count('id as count')
    const [{ count: totalInactivas }] = await baseQuery().where('activa', false).count('id as count')

    const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [{ count: altasEstaSemana }] = await baseQuery()
      .where('created_at', '>=', haceSieteDias)
      .count('id as count')

    const [{ suma }] = await baseQuery().where('activa', true).sum({ suma: 'precio_mensual' })

    const filasPlan = await baseQuery()
      .where('activa', true)
      .groupBy('plan')
      .select('plan')
      .count('id as empresasActivas')
      .sum({ mrr: 'precio_mensual' })
      .orderBy('empresasActivas', 'desc')

    const desglosePorPlan = filasPlan.map(fila => ({
      plan: fila.plan,
      empresasActivas: Number(fila.empresasActivas),
      mrr: Number(fila.mrr) || 0,
    }))

    const ahora = new Date()
    const crecimientoMensual = []
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
      const [{ count: altas }] = await baseQuery()
        .where('created_at', '>=', inicio)
        .where('created_at', '<', fin)
        .count('id as count')
      const etiqueta = inicio.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
      crecimientoMensual.push({
        mes: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`,
        etiqueta,
        altas: Number(altas),
      })
    }

    res.json({
      totalEmpresas: Number(totalEmpresas),
      totalActivas: Number(totalActivas),
      totalInactivas: Number(totalInactivas),
      altasEstaSemana: Number(altasEstaSemana),
      mrr: Number(suma) || 0,
      desglosePorPlan,
      crecimientoMensual,
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener visión de negocio: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener la visión de negocio' })
  }
})
```

- [ ] **Step 2: Verificar manualmente con datos de prueba reales**

Run (desde `backend/`):
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')

async function main() {
  const ahora = new Date()
  const haceDosMeses = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 10)
  const haceCincoMeses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 5)

  const [e1] = await db('empresas').insert({ nombre: 'Test Pro 1', plan: 'profesional', activa: true, precio_mensual: 49.90, created_at: ahora }).returning('id')
  const [e2] = await db('empresas').insert({ nombre: 'Test Pro 2', plan: 'profesional', activa: true, precio_mensual: 49.90, created_at: haceDosMeses }).returning('id')
  const [e3] = await db('empresas').insert({ nombre: 'Test Starter', plan: 'starter', activa: true, precio_mensual: 19.90, created_at: haceCincoMeses }).returning('id')
  const ids = [e1, e2, e3].map(r => r.id)

  const baseQuery = () => db('empresas').whereNot('plan', 'admin')
  const filasPlan = await baseQuery().where('activa', true).groupBy('plan').select('plan').count('id as empresasActivas').sum({ mrr: 'precio_mensual' }).orderBy('empresasActivas', 'desc')
  console.log('desglosePorPlan:', filasPlan.map(f => ({ plan: f.plan, empresasActivas: Number(f.empresasActivas), mrr: Number(f.mrr) })))

  const crecimientoMensual = []
  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
    const [{ count }] = await baseQuery().where('created_at', '>=', inicio).where('created_at', '<', fin).count('id as count')
    crecimientoMensual.push({ mes: \`\${inicio.getFullYear()}-\${String(inicio.getMonth()+1).padStart(2,'0')}\`, altas: Number(count) })
  }
  console.log('crecimientoMensual:', crecimientoMensual)

  await db('empresas').whereIn('id', ids).del()
  const restante = await db('empresas').select('id', 'nombre')
  console.log('empresas restantes tras limpiar:', restante)
}

main().catch(console.error).finally(() => db.destroy())
"
```
Expected: `desglosePorPlan` muestra `profesional` con `empresasActivas: 2` y `mrr: 99.8`, y `starter` con `empresasActivas: 1` y `mrr: 19.9`, en ese orden (profesional primero, por tener más empresas). `crecimientoMensual` tiene 6 entradas; el mes actual tiene `altas: 1` (la empresa creada con `created_at: ahora`), el mes de hace 2 meses tiene `altas: 1`, el de hace 5 meses tiene `altas: 1`, el resto `altas: 0`. Al final, `empresas restantes tras limpiar` solo debe mostrar la fila original de la cuenta admin (las 3 filas de prueba se borraron).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/admin.js
git commit -m "feat: el endpoint de negocio devuelve desglosePorPlan y crecimientoMensual"
```

---

### Task 2: Mover `fechaLarga()` a `utils/format.js`

**Files:**
- Modify: `client/src/utils/format.js`
- Modify: `client/src/pages/Dashboard.jsx`

**Interfaces:**
- Produces: `formatFechaLarga()` (export de `client/src/utils/format.js`) — usada por `Dashboard.jsx` (esta tarea) y por `VisionNegocio.jsx` (Tarea 3).

- [ ] **Step 1: Añadir `formatFechaLarga` a `format.js`**

En `client/src/utils/format.js`, añadir esta función al final del archivo (después de `iniciales`):

```js
export function formatFechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}
```

- [ ] **Step 2: Quitar la copia local de `Dashboard.jsx` y usar la importada**

En `client/src/pages/Dashboard.jsx`:

1. Cambiar la línea de import (línea 9):
```jsx
import { diasRestantes, formatImporte, formatFechaLarga } from '../utils/format.js'
```

2. Eliminar por completo estas líneas (la función local `fechaLarga`, líneas 11-16):
```jsx
function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}
```

3. En el JSX de la cabecera del componente `Dashboard`, cambiar:
```jsx
<p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>{fechaLarga()}</p>
```
por:
```jsx
<p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>{formatFechaLarga()}</p>
```

- [ ] **Step 3: Verificar que compila y pasa el linter**

Run (desde `client/`):
```bash
npm run lint
npm run build
```
Expected: ambos sin errores. Confirma también, leyendo el archivo, que no queda ninguna otra referencia a `fechaLarga()` sin el prefijo `format`.

- [ ] **Step 4: Commit**

```bash
git add client/src/utils/format.js client/src/pages/Dashboard.jsx
git commit -m "refactor: extraer formatFechaLarga a utils/format.js"
```

---

### Task 3: `VisionNegocio.jsx` — cabecera y tarjetas héroe

**Files:**
- Modify: `client/src/pages/VisionNegocio.jsx`

**Interfaces:**
- Consumes: `formatFechaLarga` y `formatImporte` de `client/src/utils/format.js` (Tarea 2); `negocio.totalEmpresas`, `negocio.totalActivas`, `negocio.totalInactivas`, `negocio.altasEstaSemana`, `negocio.mrr`, `negocio.desglosePorPlan` de `GET /api/admin/negocio` (Tarea 1).
- Produces: componentes locales `Reloj`, `TarjetaHeroe`, `LineaDetalle` — el siguiente paso (Tarea 4) añade más contenido al mismo archivo después de la fila de tarjetas héroe que esta tarea crea.

- [ ] **Step 1: Reemplazar el archivo completo**

Sustituir todo el contenido de `client/src/pages/VisionNegocio.jsx` por:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, Building2, Wallet, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFechaLarga } from '../utils/format.js'

function Reloj() {
  const [hora, setHora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--n400)' }}>
      {hora.toLocaleTimeString('es-ES')}
    </span>
  )
}

function LineaDetalle({ label, valor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--n500)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--negro)' }}>{valor}</span>
    </div>
  )
}

function TarjetaHeroe({ icon: Icon, valor, label, detalle }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)', padding: '24px 28px',
      display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(160px, 1.2fr)',
      gap: 24, alignItems: 'center',
    }}>
      <div>
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--r-md)', background: 'var(--verde-claro)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        }}>
          <Icon size={20} color="var(--verde)" />
        </div>
        <div style={{ fontFamily: 'var(--font-titulo)', fontSize: 36, fontWeight: 700, color: 'var(--negro)', lineHeight: 1 }}>
          {valor}
        </div>
        <div style={{ fontSize: 13, color: 'var(--n500)', marginTop: 8 }}>{label}</div>
      </div>
      <div style={{ borderLeft: '1px solid var(--n100)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {detalle}
      </div>
    </div>
  )
}

export default function VisionNegocio() {
  const { authFetch, usuario } = useAuth()
  const [negocio, setNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/negocio')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar la visión de negocio')
        return
      }
      setNegocio(datos)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Visión general del negocio'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la visión de negocio al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Visión general del negocio">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 24, fontWeight: 700, color: '#000', margin: 0 }}>
            {usuario?.empresa?.nombre || 'Mi empresa'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>{formatFechaLarga()}</p>
          <div style={{ marginTop: 4 }}>
            <Reloj />
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--r-md)',
            background: 'var(--verde)', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            opacity: cargando ? 0.7 : 1,
            transition: 'background var(--transition), opacity var(--transition)',
          }}
          onMouseEnter={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde-medio)')}
          onMouseLeave={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde)')}
        >
          <RefreshCw size={15} style={{ animation: cargando ? 'spin 0.8s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)',
          borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600,
          marginBottom: 20,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <TarjetaHeroe
          icon={Wallet}
          valor={negocio ? `${formatImporte(negocio.mrr)} €` : '—'}
          label="Ingresos recurrentes del mes (MRR)"
          detalle={!negocio ? null : negocio.desglosePorPlan.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--n400)' }}>Sin empresas de pago activas todavía</span>
          ) : (
            negocio.desglosePorPlan.map(p => (
              <LineaDetalle
                key={p.plan}
                label={`${p.plan} · ${p.empresasActivas} ${p.empresasActivas === 1 ? 'empresa' : 'empresas'}`}
                valor={`${formatImporte(p.mrr)} €/mes`}
              />
            ))
          )}
        />
        <TarjetaHeroe
          icon={Building2}
          valor={negocio?.totalEmpresas ?? '—'}
          label="Empresas registradas"
          detalle={!negocio ? null : (
            <>
              <LineaDetalle label="Activas" valor={negocio.totalActivas} />
              <LineaDetalle label="Inactivas" valor={negocio.totalInactivas} />
              <LineaDetalle label="Altas esta semana" valor={negocio.altasEstaSemana} />
            </>
          )}
        />
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Verificar que compila y pasa el linter**

Run (desde `client/`):
```bash
npm run lint
npm run build
```
Expected: ambos sin errores. La página todavía no muestra gráficas (eso es la Tarea 4) — solo cabecera y las dos tarjetas héroe.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/VisionNegocio.jsx
git commit -m "feat: cabecera y tarjetas héroe en VisionNegocio.jsx"
```

---

### Task 4: `VisionNegocio.jsx` — gráficas de crecimiento e ingresos por plan

**Files:**
- Modify: `client/src/pages/VisionNegocio.jsx`

**Interfaces:**
- Consumes: `negocio.crecimientoMensual` y `negocio.desglosePorPlan` de `GET /api/admin/negocio` (Tarea 1); `formatImporte` de `utils/format.js`.
- Produces: componentes locales `GraficaCrecimiento` y `GraficaIngresosPorPlan`, montados debajo de la fila de tarjetas héroe de la Tarea 3.

- [ ] **Step 1: Añadir los dos componentes de gráfica**

En `client/src/pages/VisionNegocio.jsx`, añadir estas dos funciones nuevas justo después de la función `TarjetaHeroe` (antes de `export default function VisionNegocio()`):

```jsx
function GraficaCrecimiento({ datos }) {
  const max = Math.max(...datos.map(d => d.altas), 1)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
        Crecimiento de empresas
      </h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 90 }}>
        {datos.map(d => {
          const altura = Math.max(Math.round((d.altas / max) * 70), 2)
          return (
            <div key={d.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n500)' }}>{d.altas}</div>
              <div style={{ width: 22, height: altura, background: 'var(--g500)', borderRadius: '3px 3px 0 0' }} />
              <div style={{ fontSize: 10, color: 'var(--n300)' }}>{d.etiqueta}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GraficaIngresosPorPlan({ datos }) {
  if (datos.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
          Ingresos por plan
        </h3>
        <p style={{ fontSize: 13, color: 'var(--n400)' }}>Sin empresas de pago activas todavía</p>
      </div>
    )
  }

  const max = Math.max(...datos.map(d => d.mrr), 1)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--n100)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', margin: '0 0 18px 0' }}>
        Ingresos por plan
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {datos.map(d => {
          const ancho = Math.max(Math.round((d.mrr / max) * 100), 4)
          return (
            <div key={d.plan}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--negro)', marginBottom: 6 }}>
                <span>{d.plan}</span>
                <span>{formatImporte(d.mrr)} €/mes</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--n100)', overflow: 'hidden' }}>
                <div style={{ width: `${ancho}%`, height: '100%', background: 'var(--g500)', borderRadius: 5 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Montar las gráficas debajo de la fila de tarjetas héroe**

En el mismo archivo, dentro de `return (...)` de `VisionNegocio`, justo después del `</div>` que cierra la fila `gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'` (la que contiene las dos `TarjetaHeroe`) y antes del `</DashboardLayout>` final, añadir:

```jsx
      {negocio && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
          <GraficaCrecimiento datos={negocio.crecimientoMensual} />
          <GraficaIngresosPorPlan datos={negocio.desglosePorPlan} />
        </div>
      )}
```

El final del archivo debe quedar así (desde el cierre de la fila de héroes hasta el final):

```jsx
        <TarjetaHeroe
          icon={Building2}
          valor={negocio?.totalEmpresas ?? '—'}
          label="Empresas registradas"
          detalle={!negocio ? null : (
            <>
              <LineaDetalle label="Activas" valor={negocio.totalActivas} />
              <LineaDetalle label="Inactivas" valor={negocio.totalInactivas} />
              <LineaDetalle label="Altas esta semana" valor={negocio.altasEstaSemana} />
            </>
          )}
        />
      </div>

      {negocio && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
          <GraficaCrecimiento datos={negocio.crecimientoMensual} />
          <GraficaIngresosPorPlan datos={negocio.desglosePorPlan} />
        </div>
      )}
    </DashboardLayout>
  )
}
```

- [ ] **Step 3: Verificar que compila y pasa el linter**

Run (desde `client/`):
```bash
npm run lint
npm run build
```
Expected: ambos sin errores.

- [ ] **Step 4: Verificación manual end-to-end**

1. Arrancar backend (`npm run dev` en `backend/`) y frontend (`npm run dev` en `client/`).
2. Login como `david.carton@benco.es` (contraseña local: `12345678`, ver `backend/scripts/crear-superadmin.js` — distinta de la contraseña de producción).
3. Confirmar que "Inicio" muestra: cabecera con nombre de empresa + fecha + reloj corriendo (observar que cambia tras unos segundos), dos tarjetas héroe (MRR con "Sin empresas de pago activas todavía", Empresas registradas con su desglose de activas/inactivas/altas), y debajo las dos gráficas (crecimiento con 6 meses, todos en 0 si no hay empresas de prueba; ingresos por plan con el mismo mensaje de vacío que la tarjeta MRR).
4. Pulsar "Actualizar" y confirmar que no hay errores en la consola del navegador.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/VisionNegocio.jsx
git commit -m "feat: gráficas de crecimiento e ingresos por plan en VisionNegocio.jsx"
```

---

## Nota sobre actualizar el README

El README no necesita cambios de contenido por este rediseño (la estructura de archivos y los endpoints no cambian de nombre, solo de contenido interno). Confirmar esto en la revisión final de toda la rama en vez de asumirlo — si algo en el README describe el contrato anterior de `/api/admin/negocio` (p. ej. menciona `planMasContratado` explícitamente), corregirlo entonces.
