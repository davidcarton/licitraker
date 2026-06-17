# Visión general del negocio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la pantalla "Inicio" del superadmin (hoy el Dashboard de empresa, vacío e irrelevante para esa cuenta) por un resumen de 6 métricas de negocio: empresas registradas/activas/inactivas, altas de la última semana, MRR y plan más contratado.

**Architecture:** Nueva columna `precio_mensual` (nullable) en `empresas`; nuevo endpoint `GET /api/admin/negocio` que agrega esas métricas excluyendo la empresa interna del superadmin (`plan = 'admin'`); nueva página `VisionNegocio.jsx` con KPICards; un wrapper `Inicio.jsx` que decide entre `VisionNegocio` y `Dashboard` según el rol, montado en la ruta `/dashboard` existente.

**Tech Stack:** Node.js + Express 5, PostgreSQL + Knex, React 19 + Vite, sin framework de tests (verificación manual con `node -e`, ESLint, `npm run build`).

## Global Constraints

- Sin frameworks de test en el repo — verificar con scripts `node -e`, `npm run lint` (client), `npm run build` (client), y comprobación manual en navegador.
- Todas las consultas de `/api/admin/negocio` deben excluir las empresas con `plan = 'admin'` (la empresa interna creada por `crear-superadmin.js`).
- `precio_mensual` es nullable, sin valor por defecto, sin script de relleno automático — David lo rellena a mano en la BD.
- `VisionNegocio.jsx` solo muestra KPICards (sin gráficas, sin tablas), mismo patrón visual que `EstadoSistema.jsx`.
- `Dashboard.jsx` no se modifica. La decisión de qué mostrar en "Inicio" vive en un componente nuevo (`Inicio.jsx`), no dentro de `Dashboard.jsx` ni de `App.jsx` directamente.
- El endpoint nuevo es aditivo — no se modifica `/api/admin/estado` ni `/api/admin/logs`.

---

### Task 1: Columna `precio_mensual` en `empresas`

**Files:**
- Create: `backend/src/db/migrations/005_agregar_precio_mensual_empresas.js`
- Modify: `backend/src/db/schema.sql` (añadir la columna a la definición de referencia de `empresas`)

**Interfaces:**
- Produces: columna `empresas.precio_mensual` (`DECIMAL(10,2)`, nullable, sin default) — usada por la consulta de MRR en Task 2.

- [ ] **Step 1: Crear el archivo de migración**

```js
// backend/src/db/migrations/005_agregar_precio_mensual_empresas.js
exports.up = knex => knex.schema.table('empresas', t => {
  t.decimal('precio_mensual', 10, 2).nullable()
})

exports.down = knex => knex.schema.table('empresas', t => {
  t.dropColumn('precio_mensual')
})
```

- [ ] **Step 2: Aplicar la migración**

Run (desde `backend/`): `npm run migrate`
Expected: salida incluye `Batch N run: 1 migrations` y el nombre del archivo `005_agregar_precio_mensual_empresas.js`.

- [ ] **Step 3: Verificar que la columna existe**

Run (desde `backend/`):
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')
db.raw(\"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'precio_mensual'\")
  .then(r => { console.log(r.rows); return db.destroy() })
  .catch(e => { console.error(e); db.destroy() })
"
```
Expected: una fila `{ column_name: 'precio_mensual', data_type: 'numeric', is_nullable: 'YES' }`.

- [ ] **Step 4: Actualizar el DDL de referencia**

En `backend/src/db/schema.sql`, dentro de `CREATE TABLE IF NOT EXISTS empresas (...)`, añadir la columna justo después de `plan VARCHAR(20) DEFAULT 'starter',`:

```sql
  plan VARCHAR(20) DEFAULT 'starter',
  precio_mensual NUMERIC(10,2),
  activa BOOLEAN DEFAULT true,
```

- [ ] **Step 5: Probar el rollback y volver a aplicar (verificación de seguridad, no deja la BD en rollback)**

Run (desde `backend/`):
```bash
npm run migrate:rollback
npm run migrate
```
Expected: el rollback elimina la migración 005 sin error, y al volver a aplicar `npm run migrate` la columna vuelve a existir (repetir Step 3 si quieres confirmar).

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/005_agregar_precio_mensual_empresas.js backend/src/db/schema.sql
git commit -m "feat: añadir columna precio_mensual a empresas"
```

---

### Task 2: Endpoint `GET /api/admin/negocio`

**Files:**
- Modify: `backend/src/routes/admin.js`

**Interfaces:**
- Consumes: columna `empresas.precio_mensual` (Task 1), tabla `empresas` (columnas `plan`, `activa`, `created_at`).
- Produces: `GET /api/admin/negocio` → JSON:
  ```json
  {
    "totalEmpresas": 0,
    "totalActivas": 0,
    "totalInactivas": 0,
    "altasEstaSemana": 0,
    "mrr": 0,
    "planMasContratado": null
  }
  ```
  Usado por `VisionNegocio.jsx` en Task 3.

- [ ] **Step 1: Añadir la ruta**

En `backend/src/routes/admin.js`, añadir esta ruta nueva después de la ruta `/estado` existente (antes de `router.get('/logs', ...)`):

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

    const filaPlan = await baseQuery()
      .where('activa', true)
      .groupBy('plan')
      .count('id as total')
      .orderBy('total', 'desc')
      .select('plan')
      .first()

    res.json({
      totalEmpresas: Number(totalEmpresas),
      totalActivas: Number(totalActivas),
      totalInactivas: Number(totalInactivas),
      altasEstaSemana: Number(altasEstaSemana),
      mrr: Number(suma) || 0,
      planMasContratado: filaPlan ? filaPlan.plan : null,
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener visión de negocio: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener la visión de negocio' })
  }
})
```

Esta ruta queda bajo el mismo `router.use(auth, requireAdmin)` ya declarado al principio del archivo — no se necesita ningún middleware nuevo.

- [ ] **Step 2: Verificar manualmente la lógica de agregación contra la BD local**

Run (desde `backend/`):
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')

async function main() {
  const baseQuery = () => db('empresas').whereNot('plan', 'admin')
  const [{ count: totalEmpresas }] = await baseQuery().count('id as count')
  const [{ count: totalActivas }] = await baseQuery().where('activa', true).count('id as count')
  const [{ count: totalInactivas }] = await baseQuery().where('activa', false).count('id as count')
  const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [{ count: altasEstaSemana }] = await baseQuery().where('created_at', '>=', haceSieteDias).count('id as count')
  const [{ suma }] = await baseQuery().where('activa', true).sum({ suma: 'precio_mensual' })
  const filaPlan = await baseQuery().where('activa', true).groupBy('plan').count('id as total').orderBy('total', 'desc').select('plan').first()

  console.log({
    totalEmpresas: Number(totalEmpresas),
    totalActivas: Number(totalActivas),
    totalInactivas: Number(totalInactivas),
    altasEstaSemana: Number(altasEstaSemana),
    mrr: Number(suma) || 0,
    planMasContratado: filaPlan ? filaPlan.plan : null,
  })
}

main().catch(console.error).finally(() => db.destroy())
"
```
Expected: un objeto impreso con los 6 campos, sin lanzar excepción. `totalEmpresas` y `totalActivas` NO deben incluir la empresa con `plan = 'admin'` — compáralo con:
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')
db('empresas').select('id','nombre','plan','activa','created_at')
  .then(r => { console.table(r); return db.destroy() })
  .catch(e => { console.error(e); db.destroy() })
"
```
y confirma a mano que la fila con `plan = 'admin'` no está contada en `totalEmpresas`/`totalActivas`/`totalInactivas`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/admin.js
git commit -m "feat: añadir endpoint GET /api/admin/negocio"
```

---

### Task 3: Página `VisionNegocio.jsx`

**Files:**
- Create: `client/src/pages/VisionNegocio.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/negocio` (Task 2) vía `authFetch` de `useAuth()` (`client/src/context/AuthContext.jsx`); `formatImporte` de `client/src/utils/format.js`; `KPICard` de `client/src/components/dashboard/KPICard.jsx`; `DashboardLayout` de `client/src/components/dashboard/DashboardLayout.jsx`.
- Produces: componente `VisionNegocio` (export default) — usado por `Inicio.jsx` en Task 4.

- [ ] **Step 1: Crear la página**

```jsx
// client/src/pages/VisionNegocio.jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Building2, CheckCircle2, XCircle, UserPlus, Wallet, Award, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte } from '../utils/format.js'

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard icon={Building2} value={negocio?.totalEmpresas ?? '—'} label="Empresas registradas" />
        <KPICard icon={CheckCircle2} value={negocio?.totalActivas ?? '—'} label="Empresas activas" />
        <KPICard icon={XCircle} value={negocio?.totalInactivas ?? '—'} label="Empresas inactivas" />
        <KPICard icon={UserPlus} value={negocio?.altasEstaSemana ?? '—'} label="Nuevas altas esta semana" />
        <KPICard icon={Wallet} value={negocio ? `${formatImporte(negocio.mrr)} €` : '—'} label="Ingresos recurrentes del mes (MRR)" />
        <KPICard icon={Award} value={negocio?.planMasContratado ?? '—'} label="Plan más contratado" />
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
Expected: ambos comandos terminan sin errores. `VisionNegocio.jsx` todavía no está enlazado a ninguna ruta — eso ocurre en Task 4 — así que no hay verificación visual en este paso.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/VisionNegocio.jsx
git commit -m "feat: crear página VisionNegocio.jsx con KPIs de negocio"
```

---

### Task 4: `Inicio.jsx` y enrutado del superadmin

**Files:**
- Create: `client/src/pages/Inicio.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `Dashboard` (export default de `client/src/pages/Dashboard.jsx`), `VisionNegocio` (export default de `client/src/pages/VisionNegocio.jsx`, Task 3), `useAuth()` de `client/src/context/AuthContext.jsx` (campo `usuario.rol`).
- Produces: componente `Inicio` (export default) montado en la ruta `/dashboard`.

- [ ] **Step 1: Crear el wrapper**

```jsx
// client/src/pages/Inicio.jsx
import { useAuth } from '../context/AuthContext.jsx'
import Dashboard from './Dashboard.jsx'
import VisionNegocio from './VisionNegocio.jsx'

export default function Inicio() {
  const { usuario } = useAuth()
  return usuario?.rol === 'superadmin' ? <VisionNegocio /> : <Dashboard />
}
```

- [ ] **Step 2: Enlazarlo en `App.jsx`**

En `client/src/App.jsx`, sustituir el import de `Dashboard` por el de `Inicio`:

```jsx
import Inicio from './pages/Inicio.jsx'
```

(elimina la línea `import Dashboard from './pages/Dashboard.jsx'`)

Y cambiar la ruta `/dashboard`:

```jsx
<Route path="/dashboard" element={<RutaProtegida><Inicio /></RutaProtegida>} />
```

El archivo completo de rutas debe quedar:

```jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import RutaProtegida from './components/auth/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Inicio from './pages/Inicio.jsx'
import Licitaciones from './pages/Licitaciones.jsx'
import ResumenIA from './pages/ResumenIA.jsx'
import Configuracion from './pages/Configuracion.jsx'
import EstadoSistema from './pages/EstadoSistema.jsx'
import LogsErrores from './pages/LogsErrores.jsx'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/dashboard" element={<RutaProtegida><Inicio /></RutaProtegida>} />
            <Route path="/dashboard/licitaciones" element={<RutaProtegida><Licitaciones /></RutaProtegida>} />
            <Route path="/dashboard/resumen" element={<RutaProtegida><ResumenIA /></RutaProtegida>} />
            <Route path="/dashboard/configuracion" element={<RutaProtegida><Configuracion /></RutaProtegida>} />
            <Route path="/dashboard/admin/estado" element={<RutaProtegida><EstadoSistema /></RutaProtegida>} />
            <Route path="/dashboard/admin/logs" element={<RutaProtegida><LogsErrores /></RutaProtegida>} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Verificar que compila y pasa el linter**

Run (desde `client/`):
```bash
npm run lint
npm run build
```
Expected: ambos comandos terminan sin errores.

- [ ] **Step 4: Verificación manual completa**

1. Arrancar backend (`npm run dev` en `backend/`) y frontend (`npm run dev` en `client/`).
2. Login como `david.carton@benco.es` → la pantalla "Inicio" debe mostrar `VisionNegocio` (6 KPICards de negocio), no el Dashboard de empresa.
3. Pulsar "Actualizar" → los KPIs se recargan sin error.
4. Si existe alguna cuenta de prueba con rol `user`, login con ella → "Inicio" debe seguir mostrando el `Dashboard` normal de empresa, sin cambios visibles respecto a antes de este plan.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Inicio.jsx client/src/App.jsx
git commit -m "feat: la pantalla Inicio del superadmin muestra Visión de negocio"
```

---

## Nota sobre actualizar el README

El README documenta la estructura de `client/src/pages/` y el comportamiento de "Inicio". Tras completar las 4 tareas, antes del merge final, revisar y actualizar (si aplica):
- La tabla de estructura del proyecto (línea ~73, `Dashboard.jsx`) para mencionar `Inicio.jsx` y `VisionNegocio.jsx`.
- Cualquier mención de qué ve el superadmin al iniciar sesión.

Esto se confirma en la revisión final de toda la rama (whole-branch review), igual que en el sub-proyecto anterior.
