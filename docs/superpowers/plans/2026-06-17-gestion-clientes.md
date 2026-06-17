# Gestión de clientes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al superadmin una pantalla "Gestión de clientes" para ver todas las empresas clientes, cambiar su plan/precio/estado, ver sus preferencias configuradas, y resetear la contraseña de cualquiera de sus usuarios.

**Architecture:** Nuevo archivo de rutas backend `clientes.js` montado en `/api/admin/clientes` (mismo middleware `auth, requireAdmin` que el resto de rutas admin). Nueva página frontend `GestionClientes.jsx` con una tabla y un modal de detalle/edición (mismo patrón de overlay+panel deslizante que ya usa `LicitacionModal.jsx`). El sidebar sustituye "Configuración" por "Gestión de clientes" solo para el rol `superadmin`.

**Tech Stack:** Node.js + Express 5, Knex/PostgreSQL, bcryptjs, React 19 + Vite, framer-motion (ya en el proyecto), sin framework de tests (verificación manual con `node -e`, ESLint, `npm run build`).

## Global Constraints

- La empresa interna del superadmin (`plan = 'admin'`) nunca aparece en la lista de clientes ni es accesible por su `id` (404 si se intenta).
- El campo `plan` es texto libre (sin lista cerrada/enum) — máximo 50 caracteres tras la migración de esta tarea.
- `precio_mensual` vacío se guarda como `null`, nunca como `0`.
- Reseteo de contraseña: el superadmin escribe la contraseña nueva directamente (mínimo 8 caracteres, mismo mensaje de error que `auth.js`); no hay envío de email.
- Sin paginación de la lista de clientes en esta versión.
- Sin ninguna dependencia npm nueva — bcryptjs y framer-motion ya están en el proyecto.
- Todas las rutas nuevas siguen el mismo patrón try/catch + `logger.error('clientes', ...)` + 500 que ya usa `admin.js`.

---

### Task 1: Ampliar la columna `empresas.plan` a 50 caracteres

**Files:**
- Create: `backend/src/db/migrations/006_ampliar_plan_empresas.js`
- Modify: `backend/src/db/schema.sql`

**Interfaces:**
- Produces: columna `empresas.plan` como `VARCHAR(50)` — usada por las Tareas 2 y 3 al guardar valores de plan más largos.

- [ ] **Step 1: Crear la migración**

```js
// backend/src/db/migrations/006_ampliar_plan_empresas.js
exports.up = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 50).alter()
})

exports.down = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 20).alter()
})
```

- [ ] **Step 2: Aplicar la migración**

Run (desde `backend/`): `npm run migrate`
Expected: salida incluye `Batch N run: 1 migrations` y el nombre `006_ampliar_plan_empresas.js`.

- [ ] **Step 3: Verificar la longitud de la columna**

Run (desde `backend/`):
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')
db.raw(\"SELECT character_maximum_length FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'plan'\")
  .then(r => { console.log(r.rows); return db.destroy() })
  .catch(e => { console.error(e); db.destroy() })
"
```
Expected: `[ { character_maximum_length: 50 } ]`.

- [ ] **Step 4: Actualizar el DDL de referencia**

En `backend/src/db/schema.sql`, cambiar:
```sql
  plan VARCHAR(20) DEFAULT 'starter',
```
por:
```sql
  plan VARCHAR(50) DEFAULT 'starter',
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/migrations/006_ampliar_plan_empresas.js backend/src/db/schema.sql
git commit -m "feat: ampliar empresas.plan a 50 caracteres"
```

---

### Task 2: Backend — listar y obtener detalle de clientes

**Files:**
- Create: `backend/src/routes/clientes.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: columna `empresas.plan` ampliada (Tarea 1, no estrictamente necesaria para esta tarea pero ya aplicada en la BD).
- Produces:
  - `GET /api/admin/clientes` → `{ empresas: [{ id, nombre, plan, precioMensual, activa, createdAt }] }`
  - `GET /api/admin/clientes/:id` → `{ id, nombre, plan, precioMensual, activa, createdAt, usuarios: [{id, nombre, email, rol, activo}], preferencias: {tiposObra, provincias, importeMin, importeMax, frecuenciaAlerta} | null }`, 404 si no existe o es la empresa interna.
  Usado por `GestionClientes.jsx` en las Tareas 4 y 5.

- [ ] **Step 1: Crear el archivo de rutas**

```js
// backend/src/routes/clientes.js
const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')

router.use(auth, requireAdmin)

router.get('/', async (req, res) => {
  try {
    const empresas = await db('empresas')
      .whereNot('plan', 'admin')
      .select('id', 'nombre', 'plan', 'precio_mensual', 'activa', 'created_at')
      .orderBy('created_at', 'desc')

    res.json({
      empresas: empresas.map(e => ({
        id: e.id,
        nombre: e.nombre,
        plan: e.plan,
        precioMensual: e.precio_mensual != null ? Number(e.precio_mensual) : null,
        activa: e.activa,
        createdAt: e.created_at,
      })),
    })
  } catch (err) {
    logger.error('clientes', 'Error al listar clientes: ' + err.message)
    res.status(500).json({ error: 'No se han podido obtener los clientes' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const empresa = await db('empresas')
      .whereNot('plan', 'admin')
      .where('id', req.params.id)
      .first()

    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const usuarios = await db('usuarios')
      .where('empresa_id', empresa.id)
      .select('id', 'nombre', 'email', 'rol', 'activo')

    const preferencias = await db('preferencias')
      .where('empresa_id', empresa.id)
      .first()

    res.json({
      id: empresa.id,
      nombre: empresa.nombre,
      plan: empresa.plan,
      precioMensual: empresa.precio_mensual != null ? Number(empresa.precio_mensual) : null,
      activa: empresa.activa,
      createdAt: empresa.created_at,
      usuarios,
      preferencias: preferencias ? {
        tiposObra: preferencias.tipos_obra,
        provincias: preferencias.provincias,
        importeMin: preferencias.importe_min != null ? Number(preferencias.importe_min) : null,
        importeMax: preferencias.importe_max != null ? Number(preferencias.importe_max) : null,
        frecuenciaAlerta: preferencias.frecuencia_alerta,
      } : null,
    })
  } catch (err) {
    logger.error('clientes', 'Error al obtener cliente: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener el cliente' })
  }
})

module.exports = router
```

- [ ] **Step 2: Montar las rutas en `server.js`**

En `backend/server.js`, junto a los demás `require` de rutas (línea 15, después de `const adminRoutes = require('./src/routes/admin')`), añadir:
```js
const clientesRoutes = require('./src/routes/clientes')
```

Y junto a los demás `app.use` de rutas (línea 30, después de `app.use('/api/admin', adminRoutes)`), añadir:
```js
app.use('/api/admin/clientes', clientesRoutes)
```

- [ ] **Step 3: Verificación manual end-to-end con datos de prueba reales**

Run (desde `backend/`):
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')

async function main() {
  const [empresa] = await db('empresas').insert({
    nombre: 'Cliente de Prueba SL', plan: 'profesional', precio_mensual: 49.90, activa: true,
  }).returning('*')
  const [usuario] = await db('usuarios').insert({
    empresa_id: empresa.id, nombre: 'Usuario Prueba', email: 'prueba-clientes@example.com',
    password_hash: 'x', rol: 'admin',
  }).returning('*')
  await db('preferencias').insert({
    empresa_id: empresa.id, tipos_obra: ['Edificación'], provincias: ['Madrid'],
    importe_min: 1000, importe_max: 50000, frecuencia_alerta: 'inmediata',
  })

  console.log('empresa creada:', empresa.id)
  await db.destroy()
}
main().catch(console.error)
"
```
Expected: imprime el `id` de la empresa creada (anótalo, lo necesitas en el siguiente paso).

Arranca el backend en segundo plano (`npm run dev &` desde `backend/`), confirma que arrancó, y ejecuta:
```bash
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d '{"email":"david.carton@benco.es","password":"12345678"}' | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).token))")
curl -s http://localhost:3002/api/admin/clientes -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3002/api/admin/clientes/ID_DE_LA_EMPRESA -H "Authorization: Bearer $TOKEN"
```
(sustituye `ID_DE_LA_EMPRESA` por el id anotado, y el puerto `3002` por el de tu `backend/.env` si es distinto)

Expected: el primer `curl` devuelve `{"empresas":[...]}` incluyendo la fila "Cliente de Prueba SL" con `precioMensual: 49.9`; el segundo devuelve el detalle completo con `usuarios` (1 elemento, "Usuario Prueba") y `preferencias` (no `null`, con `tiposObra: ["Edificación"]`).

Limpia los datos de prueba y detén el backend:
```bash
node -e "
require('dotenv').config()
const db = require('./src/db')
db('empresas').where({ nombre: 'Cliente de Prueba SL' }).del().then(() => db.destroy())
"
```
(el `ON DELETE CASCADE` de `usuarios.empresa_id` y `preferencias.empresa_id` borra también esas filas — confirma con un `SELECT` posterior que no quedan restos si quieres estar seguro).

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/clientes.js backend/server.js
git commit -m "feat: añadir GET /api/admin/clientes y GET /api/admin/clientes/:id"
```

---

### Task 3: Backend — editar cliente y resetear contraseña

**Files:**
- Modify: `backend/src/routes/clientes.js`

**Interfaces:**
- Produces:
  - `PATCH /api/admin/clientes/:id` con body `{ plan?, precio_mensual?, activa? }` → `{ ok: true }`, 400/404 en error.
  - `PATCH /api/admin/clientes/:id/usuarios/:usuarioId/password` con body `{ password }` → `{ ok: true }`, 400/404 en error.
  Usado por `ModalCliente` en la Tarea 5.

- [ ] **Step 1: Añadir `bcryptjs` al require y las dos rutas nuevas**

En `backend/src/routes/clientes.js`, añadir al principio del archivo (después de `const logger = require('../utils/logger')`):
```js
const bcrypt = require('bcryptjs')
```

Y añadir estas dos rutas justo antes de `module.exports = router`:

```js
router.patch('/:id', async (req, res) => {
  try {
    const empresa = await db('empresas').whereNot('plan', 'admin').where('id', req.params.id).first()
    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const cambios = {}
    if (req.body.plan !== undefined) {
      const plan = String(req.body.plan).trim()
      if (!plan) {
        return res.status(400).json({ error: 'El plan no puede estar vacío' })
      }
      if (plan.length > 50) {
        return res.status(400).json({ error: 'El plan no puede tener más de 50 caracteres' })
      }
      cambios.plan = plan
    }
    if (req.body.precio_mensual !== undefined) {
      const precio = req.body.precio_mensual
      if (precio === null || precio === '') {
        cambios.precio_mensual = null
      } else {
        const num = Number(precio)
        if (isNaN(num) || num < 0) {
          return res.status(400).json({ error: 'El precio mensual debe ser un número positivo' })
        }
        cambios.precio_mensual = num
      }
    }
    if (req.body.activa !== undefined) {
      cambios.activa = Boolean(req.body.activa)
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: 'No se ha indicado ningún cambio' })
    }

    cambios.updated_at = db.fn.now()
    await db('empresas').where('id', empresa.id).update(cambios)

    res.json({ ok: true })
  } catch (err) {
    logger.error('clientes', 'Error al actualizar cliente: ' + err.message)
    res.status(500).json({ error: 'No se ha podido actualizar el cliente' })
  }
})

router.patch('/:id/usuarios/:usuarioId/password', async (req, res) => {
  try {
    const empresa = await db('empresas').whereNot('plan', 'admin').where('id', req.params.id).first()
    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const usuario = await db('usuarios')
      .where('id', req.params.usuarioId)
      .where('empresa_id', empresa.id)
      .first()
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const { password } = req.body || {}
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await db('usuarios').where('id', usuario.id).update({ password_hash: passwordHash })

    res.json({ ok: true })
  } catch (err) {
    logger.error('clientes', 'Error al resetear contraseña: ' + err.message)
    res.status(500).json({ error: 'No se ha podido actualizar la contraseña' })
  }
})
```

- [ ] **Step 2: Verificación manual end-to-end**

Run (desde `backend/`), crea de nuevo datos de prueba (mismo bloque del Step 3 de la Tarea 2), anota el `id` de la empresa y el `id` del usuario (`console.log('usuario creado:', usuario.id)` — añádelo al script de creación), arranca el backend en segundo plano, obtén el `TOKEN` igual que en la Tarea 2, y ejecuta:

```bash
curl -s -X PATCH http://localhost:3002/api/admin/clientes/ID_DE_LA_EMPRESA \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"plan":"mantenimiento mensual","precio_mensual":89.5,"activa":false}'

curl -s -X PATCH http://localhost:3002/api/admin/clientes/ID_DE_LA_EMPRESA/usuarios/ID_DEL_USUARIO/password \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"password":"nuevaPassword123"}'

curl -s -X PATCH http://localhost:3002/api/admin/clientes/ID_DE_LA_EMPRESA/usuarios/ID_DEL_USUARIO/password \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"password":"corta"}'
```

Expected: el primer `curl` devuelve `{"ok":true}` (confirma con un `SELECT` que `plan = 'mantenimiento mensual'`, `precio_mensual = 89.5`, `activa = false` — el plan de 21 caracteres se guarda sin error gracias a la Tarea 1); el segundo devuelve `{"ok":true}`; el tercero devuelve 400 con el mensaje de "al menos 8 caracteres" (no se actualiza la contraseña).

Verifica el hash de la nueva contraseña:
```bash
node -e "
require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./src/db')
db('usuarios').where({ id: ID_DEL_USUARIO }).first()
  .then(u => bcrypt.compare('nuevaPassword123', u.password_hash))
  .then(coincide => { console.log('coincide:', coincide); return db.destroy() })
"
```
Expected: `coincide: true`.

Limpia los datos de prueba (mismo `del()` por nombre de empresa que en la Tarea 2) y detén el backend.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/clientes.js
git commit -m "feat: añadir PATCH de cliente y de contraseña de usuario"
```

---

### Task 4: Frontend — sidebar, ruta y lista de clientes

**Files:**
- Modify: `client/src/components/dashboard/Sidebar.jsx`
- Modify: `client/src/App.jsx`
- Create: `client/src/pages/GestionClientes.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/clientes` (Tarea 2) vía `authFetch`; `formatImporte`, `formatFecha` de `client/src/utils/format.js`; `DashboardLayout` de `client/src/components/dashboard/DashboardLayout.jsx`.
- Produces: componente `GestionClientes` (export default) montado en `/dashboard/admin/clientes` — la Tarea 5 añade el modal de detalle al mismo archivo.

- [ ] **Step 1: Sustituir "Configuración" por "Gestión de clientes" solo para superadmin**

En `client/src/components/dashboard/Sidebar.jsx`, cambiar el import de iconos (línea 2):
```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut, Activity, ScrollText, Users } from 'lucide-react'
```

Y sustituir el bloque de constantes (líneas 6-15) por:
```jsx
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/dashboard/licitaciones', label: 'Licitaciones', icon: FileText, end: false },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings, end: false },
]

const ITEM_CLIENTES_SUPERADMIN = { to: '/dashboard/admin/clientes', label: 'Gestión de clientes', icon: Users, end: false }

const NAV_ITEMS_ADMIN = [
  { to: '/dashboard/admin/estado', label: 'Estado del sistema', icon: Activity, end: false },
  { to: '/dashboard/admin/logs', label: 'Logs y errores', icon: ScrollText, end: false },
]
```

Y cambiar la línea que construye `navItems` dentro de `export default function Sidebar()`:
```jsx
  const navItems = usuario?.rol === 'superadmin'
    ? [
        ...NAV_ITEMS.map(item => item.label === 'Configuración' ? ITEM_CLIENTES_SUPERADMIN : item),
        ...NAV_ITEMS_ADMIN,
      ]
    : NAV_ITEMS
```

- [ ] **Step 2: Añadir la ruta en `App.jsx`**

En `client/src/App.jsx`, añadir el import:
```jsx
import GestionClientes from './pages/GestionClientes.jsx'
```

Y añadir esta ruta nueva justo antes de la ruta `/dashboard/admin/estado`:
```jsx
            <Route path="/dashboard/admin/clientes" element={<RutaProtegida><GestionClientes /></RutaProtegida>} />
```

- [ ] **Step 3: Crear la página de lista**

```jsx
// client/src/pages/GestionClientes.jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha } from '../utils/format.js'

function BadgeEstado({ activa }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: activa ? 'var(--verde-claro)' : 'var(--rojo-bg)',
      color: activa ? 'var(--verde)' : 'var(--rojo)',
      fontSize: 11, fontWeight: 700,
    }}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

export default function GestionClientes() {
  const { authFetch, usuario } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/clientes')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se han podido cargar los clientes')
        return
      }
      setClientes(datos.empresas)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Gestión de clientes'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la lista de clientes al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Gestión de clientes">
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

      <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gris-fondo)' }}>
              {['Nombre', 'Plan', 'Precio', 'Estado', 'Fecha de alta'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--n400)', fontSize: 13 }}>
                  No hay clientes registrados todavía.
                </td>
              </tr>
            ) : (
              clientes.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--n100)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--negro)' }}>{c.nombre}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.plan}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.precioMensual != null ? `${formatImporte(c.precioMensual)} €` : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><BadgeEstado activa={c.activa} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{formatFecha(c.createdAt) || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Step 4: Verificar que compila y pasa el linter**

Run (desde `client/`):
```bash
npm run lint
npm run build
```
Expected: ambos sin errores. Las filas todavía no son clicables de verdad (sin `onClick`, eso es la Tarea 5).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/dashboard/Sidebar.jsx client/src/App.jsx client/src/pages/GestionClientes.jsx
git commit -m "feat: sidebar y lista de Gestión de clientes para superadmin"
```

---

### Task 5: Frontend — modal de detalle, edición y reseteo de contraseña

**Files:**
- Modify: `client/src/pages/GestionClientes.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/clientes/:id`, `PATCH /api/admin/clientes/:id`, `PATCH /api/admin/clientes/:id/usuarios/:usuarioId/password` (Tareas 2 y 3).
- Produces: comportamiento completo de la pantalla (no hay tareas posteriores que dependan de esto).

- [ ] **Step 1: Reemplazar el archivo completo**

Sustituir todo el contenido de `client/src/pages/GestionClientes.jsx` por:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha } from '../utils/format.js'

function BadgeEstado({ activa }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: activa ? 'var(--verde-claro)' : 'var(--rojo-bg)',
      color: activa ? 'var(--verde)' : 'var(--rojo)',
      fontSize: 11, fontWeight: 700,
    }}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

function ModalCliente({ clienteId, onCerrar, onGuardado }) {
  const { authFetch } = useAuth()
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [plan, setPlan] = useState('')
  const [precio, setPrecio] = useState('')
  const [activa, setActiva] = useState(true)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [mensajePassword, setMensajePassword] = useState('')

  const cargarDetalle = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`)
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el cliente')
        return
      }
      setDetalle(datos)
      setPlan(datos.plan)
      setPrecio(datos.precioMensual != null ? String(datos.precioMensual) : '')
      setActiva(datos.activa)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch, clienteId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del detalle al abrir el modal
    cargarDetalle()
  }, [cargarDetalle])

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          precio_mensual: precio.trim() === '' ? null : Number(precio),
          activa,
        }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido guardar')
        return
      }
      onGuardado()
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const resetearPassword = async (usuarioId) => {
    setMensajePassword('')
    if (nuevaPassword.length < 8) {
      setMensajePassword('La contraseña debe tener al menos 8 caracteres')
      return
    }
    try {
      const res = await authFetch(`/api/admin/clientes/${clienteId}/usuarios/${usuarioId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      })
      const datos = await res.json()
      if (!res.ok) {
        setMensajePassword(datos.error || 'No se ha podido actualizar la contraseña')
        return
      }
      setMensajePassword('Contraseña actualizada')
      setNuevaPassword('')
    } catch {
      setMensajePassword('No se ha podido conectar con el servidor')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCerrar}
        style={{ position: 'fixed', inset: 0, background: 'rgba(17,25,23,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 100 }}
      />
      <motion.div
        key="panel"
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)',
          background: '#fff', boxShadow: '-8px 0 48px rgba(0,0,0,0.16)', zIndex: 101,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--n100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            {detalle?.nombre || 'Cliente'}
          </h3>
          <button onClick={onCerrar} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n400)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {cargando && <p style={{ fontSize: 13, color: 'var(--n400)' }}>Cargando...</p>}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {detalle && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan</label>
                  <input
                    type="text"
                    value={plan}
                    maxLength={50}
                    onChange={(e) => setPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Precio mensual (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="Sin precio definido"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 14, background: 'var(--gris-fondo)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--negro)' }}>Cuenta activa</span>
                  <button
                    onClick={() => setActiva(a => !a)}
                    style={{
                      width: 44, height: 24, borderRadius: 100, background: activa ? 'var(--verde)' : 'var(--n100)',
                      position: 'relative', transition: 'background var(--transition)',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: activa ? 23 : 3, width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'left var(--transition)',
                    }} />
                  </button>
                </div>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff',
                    fontSize: 13, fontWeight: 700, opacity: guardando ? 0.7 : 1,
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-titulo)', fontSize: 13, fontWeight: 700, color: 'var(--negro)', margin: '0 0 10px 0' }}>
                  Preferencias configuradas
                </h4>
                {!detalle.preferencias ? (
                  <p style={{ fontSize: 13, color: 'var(--n400)' }}>Sin preferencias configuradas todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: 'var(--n500)' }}>Tipos de obra: </span>{(detalle.preferencias.tiposObra || []).join(', ') || '—'}</div>
                    <div><span style={{ color: 'var(--n500)' }}>Provincias: </span>{(detalle.preferencias.provincias || []).join(', ') || '—'}</div>
                    <div><span style={{ color: 'var(--n500)' }}>Importe: </span>{detalle.preferencias.importeMin ?? '—'} – {detalle.preferencias.importeMax ?? '—'} €</div>
                    <div><span style={{ color: 'var(--n500)' }}>Frecuencia de alerta: </span>{detalle.preferencias.frecuenciaAlerta || '—'}</div>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-titulo)', fontSize: 13, fontWeight: 700, color: 'var(--negro)', margin: '0 0 10px 0' }}>
                  Usuarios
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detalle.usuarios.map(u => (
                    <div key={u.id} style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{u.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--n400)' }}>{u.email} · {u.rol}</div>
                        </div>
                        <button
                          onClick={() => { setUsuarioEditando(usuarioEditando === u.id ? null : u.id); setMensajePassword(''); setNuevaPassword('') }}
                          style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)', whiteSpace: 'nowrap' }}
                        >
                          Resetear contraseña
                        </button>
                      </div>
                      {usuarioEditando === u.id && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                          <input
                            type="password"
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            placeholder="Nueva contraseña (mín. 8 caracteres)"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--n100)', fontSize: 13 }}
                          />
                          <button
                            onClick={() => resetearPassword(u.id)}
                            style={{ padding: '8px 14px', borderRadius: 'var(--r-md)', background: 'var(--verde)', color: '#fff', fontSize: 12, fontWeight: 700 }}
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                      {usuarioEditando === u.id && mensajePassword && (
                        <p style={{ fontSize: 12, marginTop: 6, color: mensajePassword === 'Contraseña actualizada' ? 'var(--verde)' : 'var(--rojo)' }}>
                          {mensajePassword}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function GestionClientes() {
  const { authFetch, usuario } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/clientes')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se han podido cargar los clientes')
        return
      }
      setClientes(datos.empresas)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Gestión de clientes'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la lista de clientes al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Gestión de clientes">
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

      <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gris-fondo)' }}>
              {['Nombre', 'Plan', 'Precio', 'Estado', 'Fecha de alta'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--n400)', fontSize: 13 }}>
                  No hay clientes registrados todavía.
                </td>
              </tr>
            ) : (
              clientes.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setClienteSeleccionado(c.id)}
                  style={{ borderTop: '1px solid var(--n100)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--negro)' }}>{c.nombre}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.plan}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.precioMensual != null ? `${formatImporte(c.precioMensual)} €` : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><BadgeEstado activa={c.activa} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{formatFecha(c.createdAt) || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {clienteSeleccionado != null && (
        <ModalCliente
          clienteId={clienteSeleccionado}
          onCerrar={() => setClienteSeleccionado(null)}
          onGuardado={() => { setClienteSeleccionado(null); cargar() }}
        />
      )}
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
Expected: ambos sin errores.

- [ ] **Step 3: Verificación manual end-to-end**

1. Crea datos de prueba igual que en el Step 3 de la Tarea 2 (empresa + usuario + preferencias), anota los `id`.
2. Arranca backend (`npm run dev` en `backend/`) y frontend (`npm run dev` en `client/`).
3. Login como `david.carton@benco.es` (contraseña local `12345678`).
4. Confirma que el sidebar muestra "Gestión de clientes" en el lugar donde antes estaba "Configuración".
5. Entra a "Gestión de clientes", confirma que aparece la empresa de prueba en la tabla.
6. Haz click en la fila → se abre el modal con plan, precio, toggle de activa, las preferencias de prueba, y el usuario de prueba.
7. Cambia el plan a algo de más de 20 caracteres (ej. "mantenimiento mensual completo"... no, máximo 50 — usa algo como "mantenimiento mensual"), cambia el precio, pulsa "Guardar cambios" → el modal se cierra y la tabla se recarga con los nuevos valores.
8. Abre de nuevo el cliente, pulsa "Resetear contraseña" en el usuario de prueba, escribe una contraseña de menos de 8 caracteres → ves el mensaje de error sin guardar; escribe una de 8+ caracteres → ves "Contraseña actualizada".
9. Limpia los datos de prueba (Step 3 de la Tarea 2) cuando termines.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/GestionClientes.jsx
git commit -m "feat: modal de edición y reseteo de contraseña en Gestión de clientes"
```

---

## Nota sobre actualizar el README

El README documenta la estructura de `client/src/pages/`, los endpoints de `/api/admin`, y la tabla de roles del superadmin. Antes del merge, en la revisión final de toda la rama, comprobar si necesita: una fila nueva para `/api/admin/clientes` en la tabla de endpoints, una entrada para `GestionClientes.jsx` en el árbol de archivos, y una mención de que el sidebar del superadmin muestra "Gestión de clientes" en vez de "Configuración".
