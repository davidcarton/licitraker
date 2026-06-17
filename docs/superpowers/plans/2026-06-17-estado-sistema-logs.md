# Estado del sistema y Logs/errores — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la página única "Administración" del panel superadmin por dos páginas separadas — "Estado del sistema" (CPU/RAM/disco reales, Docker, feed PLACSP, latencia API) y "Logs y errores" (incluyendo peticiones HTTP fallidas capturadas automáticamente) — según el diseño aprobado en `docs/superpowers/specs/2026-06-17-estado-sistema-logs-design.md`.

**Architecture:** Backend: un módulo nuevo `sistema.js` con funciones puras para leer métricas del sistema operativo (CPU/RAM/disco vía `os` y `df`) y de Docker (`docker ps`), más un middleware de Express que mide latencia y registra peticiones fallidas en el logger existente. El endpoint `GET /api/admin/estado` se amplía sin romper su contrato actual. Frontend: `Admin.jsx` se divide en `EstadoSistema.jsx` y `LogsErrores.jsx`, cada una con su propio enlace de sidebar.

**Tech Stack:** Node.js + Express 5 (backend), React 19 + Vite (frontend) — sin dependencias npm nuevas, todo con módulos built-in de Node (`os`, `child_process`).

## Global Constraints

- Las dos páginas nuevas solo son visibles y accesibles para `usuario.rol === 'superadmin'` (igual que hoy) — verificado en sidebar, página y backend (`requireAdmin`).
- No se introducen dependencias npm nuevas; toda la recolección de métricas usa módulos built-in de Node.
- El contrato actual de `GET /api/admin/estado` (campos `servidor`, `cache`, `base_datos`) se mantiene; solo se añaden campos nuevos (`sistemaOperativo`, `docker`, `placsp`, `api`).
- Cualquier métrica no disponible en el entorno (Docker sin permisos, `df` inexistente en Windows) debe devolver `null` o `{disponible: false}` — nunca debe lanzar una excepción que rompa el endpoint.
- Umbral de alerta visual para CPU/RAM/disco: 85% de uso.
- Despliegue a producción sigue el flujo incremental ya establecido (commit → push → SSH al VPS → pull → build → `pm2 restart`), confirmando con David antes de cada paso de despliegue real.

---

## Mapa de archivos

**Creados:**
- `backend/src/sistema.js`
- `backend/src/middleware/metricas.js`
- `client/src/pages/EstadoSistema.jsx`
- `client/src/pages/LogsErrores.jsx`

**Modificados:**
- `backend/src/cache.js`
- `backend/server.js`
- `backend/src/routes/admin.js`
- `client/src/components/dashboard/Sidebar.jsx`
- `client/src/App.jsx`

**Eliminados:**
- `client/src/pages/Admin.jsx` (sustituida por `EstadoSistema.jsx` + `LogsErrores.jsx`)

---

### Task 1: Backend — módulo `sistema.js` (CPU, memoria, disco, Docker)

**Files:**
- Create: `backend/src/sistema.js`

**Interfaces:**
- Produces: `obtenerCPU(): {carga1m, carga5m, nucleos, porcentajeAprox}`, `obtenerMemoriaSistema(): {totalMB, libreMB, porcentajeUso}`, `obtenerDisco(): {totalGB, usadoGB, porcentajeUso} | null`, `obtenerDocker(): {disponible: boolean, contenedores: [{nombre, estado}]}` — todas usadas por Task 4.

- [ ] **Step 1: Crear `backend/src/sistema.js`**

```js
const os = require('os')
const { execSync } = require('child_process')

function obtenerCPU() {
  const carga = os.loadavg()
  const nucleos = os.cpus().length
  const porcentajeAprox = nucleos > 0 ? Math.min(100, Math.round((carga[0] / nucleos) * 100)) : null
  return {
    carga1m: Number(carga[0].toFixed(2)),
    carga5m: Number(carga[1].toFixed(2)),
    nucleos,
    porcentajeAprox,
  }
}

function obtenerMemoriaSistema() {
  const totalMB = Math.round(os.totalmem() / 1024 / 1024)
  const libreMB = Math.round(os.freemem() / 1024 / 1024)
  const usadoMB = totalMB - libreMB
  const porcentajeUso = totalMB > 0 ? Math.round((usadoMB / totalMB) * 100) : null
  return { totalMB, libreMB, porcentajeUso }
}

function convertirAGB(valor) {
  const match = String(valor).match(/^([\d.]+)([KMGT]?)$/i)
  if (!match) return null
  const numero = parseFloat(match[1])
  const unidad = (match[2] || '').toUpperCase()
  const factores = { K: 1 / (1024 * 1024), M: 1 / 1024, G: 1, T: 1024 }
  return Number((numero * (factores[unidad] ?? 1)).toFixed(1))
}

function obtenerDisco() {
  try {
    const salida = execSync('df -h /').toString()
    const lineas = salida.trim().split('\n')
    const columnas = lineas[1].trim().split(/\s+/)
    const totalGB = convertirAGB(columnas[1])
    const usadoGB = convertirAGB(columnas[2])
    const porcentajeUso = parseInt(columnas[4], 10)
    return { totalGB, usadoGB, porcentajeUso: isNaN(porcentajeUso) ? null : porcentajeUso }
  } catch {
    return null
  }
}

function obtenerDocker() {
  try {
    const salida = execSync('docker ps --format "{{.Names}}|{{.Status}}"').toString()
    const contenedores = salida.trim().split('\n').filter(Boolean).map(linea => {
      const [nombre, estado] = linea.split('|')
      return { nombre, estado }
    })
    return { disponible: true, contenedores }
  } catch {
    return { disponible: false, contenedores: [] }
  }
}

module.exports = { obtenerCPU, obtenerMemoriaSistema, obtenerDisco, obtenerDocker }
```

- [ ] **Step 2: Verificar manualmente con un script de una línea**

```bash
cd backend
node -e "const s = require('./src/sistema'); console.log('CPU:', JSON.stringify(s.obtenerCPU())); console.log('Memoria:', JSON.stringify(s.obtenerMemoriaSistema())); console.log('Disco:', JSON.stringify(s.obtenerDisco())); console.log('Docker:', JSON.stringify(s.obtenerDocker()))"
```

Expected: `CPU` y `Memoria` muestran objetos con números reales. `Disco` es `null` en Windows local (el comando `df` no existe) — en el VPS Linux devolverá un objeto con `totalGB`/`usadoGB`/`porcentajeUso`. `Docker` devuelve `{"disponible":false,"contenedores":[]}` si no tienes Docker CLI accesible localmente, o `{"disponible":true,...}` si sí.

- [ ] **Step 3: Commit**

```bash
git add backend/src/sistema.js
git commit -m "feat: añadir módulo de métricas del sistema operativo (CPU, RAM, disco, Docker)"
```

---

### Task 2: Backend — middleware de latencia y peticiones fallidas

**Files:**
- Create: `backend/src/middleware/metricas.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `logger.warn(contexto, mensaje)` de `backend/src/utils/logger.js` (ya existe).
- Produces: `medirLatencia(req, res, next)`, `registrarPeticionesFallidas(logger)(req, res, next)`, `obtenerLatenciaMedia(): {latenciaMediaMs, muestras} | null` — usado por Task 4.

- [ ] **Step 1: Crear `backend/src/middleware/metricas.js`**

```js
const MAX_MUESTRAS = 100
const muestrasLatencia = []

function registrarLatencia(ms) {
  muestrasLatencia.push(ms)
  if (muestrasLatencia.length > MAX_MUESTRAS) muestrasLatencia.shift()
}

function obtenerLatenciaMedia() {
  if (muestrasLatencia.length === 0) return null
  const suma = muestrasLatencia.reduce((acc, v) => acc + v, 0)
  return { latenciaMediaMs: Math.round(suma / muestrasLatencia.length), muestras: muestrasLatencia.length }
}

function medirLatencia(req, res, next) {
  const inicio = Date.now()
  res.on('finish', () => registrarLatencia(Date.now() - inicio))
  next()
}

function registrarPeticionesFallidas(logger) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        logger.warn('http', `${req.method} ${req.originalUrl} → ${res.statusCode}`)
      }
    })
    next()
  }
}

module.exports = { medirLatencia, registrarPeticionesFallidas, obtenerLatenciaMedia }
```

- [ ] **Step 2: Verificar el middleware de forma aislada (sin levantar el servidor completo)**

```bash
cd backend
node -e "
const { EventEmitter } = require('events');
const logger = require('./src/utils/logger');
const { medirLatencia, registrarPeticionesFallidas, obtenerLatenciaMedia } = require('./src/middleware/metricas');

const req = { method: 'GET', originalUrl: '/api/prueba' };
const res = new EventEmitter();
res.statusCode = 500;

medirLatencia(req, res, () => {});
registrarPeticionesFallidas(logger)(req, res, () => {});
res.emit('finish');

console.log('latencia:', JSON.stringify(obtenerLatenciaMedia()));
console.log('ultimoLog:', JSON.stringify(logger.getEntradas()[0]));
"
```

Expected:
```
latencia: {"latenciaMediaMs":0,"muestras":1}
ultimoLog: {"fecha":"...","nivel":"warn","contexto":"http","mensaje":"GET /api/prueba → 500"}
```

- [ ] **Step 3: Registrar los middlewares en `backend/server.js`**

En `backend/server.js:13-17`, añadir el require junto a los demás:

```js
const authRoutes = require('./src/routes/auth')
const licitacionesRoutes = require('./src/routes/licitaciones')
const adminRoutes = require('./src/routes/admin')
const logger = require('./src/utils/logger')
const cache = require('./src/cache')
const { medirLatencia, registrarPeticionesFallidas } = require('./src/middleware/metricas')
```

En `backend/server.js:21-27`, registrar los middlewares antes de montar las rutas:

```js
const app = express()
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : { origin: true, credentials: true }))

app.use(express.json())
app.use(medirLatencia)
app.use(registrarPeticionesFallidas(logger))
app.use('/api/auth', authRoutes)
app.use('/api/licitaciones-guardadas', licitacionesRoutes)
app.use('/api/admin', adminRoutes)
```

- [ ] **Step 4: Verificar que el servidor sigue arrancando y respondiendo**

```bash
cd backend
npm start &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/estado
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/no-existe
kill %1
```

Expected: primera línea `200`, segunda línea `404` — el servidor arranca sin errores con los middlewares activos.

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/metricas.js backend/server.js
git commit -m "feat: registrar latencia media y peticiones fallidas en el logger"
```

---

### Task 3: Backend — `ultimoTotalDescargado` en la caché de PLACSP

**Files:**
- Modify: `backend/src/cache.js`
- Modify: `backend/server.js`

**Interfaces:**
- Produces: `cache.ultimoTotalDescargado: number | null` — usado por Task 4.

- [ ] **Step 1: Añadir el campo a `backend/src/cache.js`**

```js
module.exports = {
  datos: null,
  ultimaActualizacion: null,
  proximaActualizacion: null,
  ultimoTotalDescargado: null,
}
```

- [ ] **Step 2: Asignarlo en `descargarYProcesar()` de `backend/server.js:299-312`**

```js
async function descargarYProcesar() {
  try {
    console.log('[placsp] Descargando ATOM...')
    const todasObras = await descargarTodasLicitaciones()

    const ahora = new Date()
    cache.datos = ordenar(todasObras)
    cache.ultimaActualizacion = ahora.toISOString()
    cache.proximaActualizacion = getProximaActualizacion().toISOString()
    cache.ultimoTotalDescargado = todasObras.length
    console.log(`[placsp] OK — ${todasObras.length} obras en plazo`)
  } catch (err) {
    logger.error('placsp', 'Error en descarga: ' + err.message)
  }
}
```

- [ ] **Step 3: Verificar el cambio**

```bash
cd backend
node -e "const cache = require('./src/cache'); console.log(Object.keys(cache))"
grep -n "ultimoTotalDescargado" server.js
```

Expected: la primera línea incluye `'ultimoTotalDescargado'` en el array de claves; `grep` encuentra la línea añadida en `descargarYProcesar`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/cache.js backend/server.js
git commit -m "feat: registrar cuántas licitaciones se descargaron en la última actualización PLACSP"
```

---

### Task 4: Backend — ampliar `GET /api/admin/estado`

**Files:**
- Modify: `backend/src/routes/admin.js`

**Interfaces:**
- Consumes: `obtenerCPU`, `obtenerMemoriaSistema`, `obtenerDisco`, `obtenerDocker` de `../sistema` (Task 1); `obtenerLatenciaMedia` de `../middleware/metricas` (Task 2); `cache.ultimoTotalDescargado` (Task 3).

- [ ] **Step 1: Reescribir `backend/src/routes/admin.js`**

```js
const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')
const cache = require('../cache')
const { obtenerCPU, obtenerMemoriaSistema, obtenerDisco, obtenerDocker } = require('../sistema')
const { obtenerLatenciaMedia } = require('../middleware/metricas')

router.use(auth, requireAdmin)

router.get('/estado', async (req, res) => {
  try {
    const [{ count: totalEmpresas }] = await db('empresas').count('id as count')
    const [{ count: totalUsuarios }] = await db('usuarios').count('id as count')
    const [{ count: totalGuardadas }] = await db('licitaciones_guardadas').count('id as count')

    const latencia = obtenerLatenciaMedia()

    res.json({
      servidor: {
        fecha: new Date().toISOString(),
        uptimeSegundos: Math.round(process.uptime()),
        memoria: process.memoryUsage(),
        nodeVersion: process.version,
      },
      sistemaOperativo: {
        cpu: obtenerCPU(),
        memoria: obtenerMemoriaSistema(),
        disco: obtenerDisco(),
      },
      docker: obtenerDocker(),
      placsp: {
        ultimaActualizacion: cache.ultimaActualizacion,
        proximaActualizacion: cache.proximaActualizacion,
        ultimoTotalDescargado: cache.ultimoTotalDescargado,
      },
      api: {
        latenciaMediaMs: latencia ? latencia.latenciaMediaMs : null,
        muestras: latencia ? latencia.muestras : 0,
      },
      cache: {
        totalLicitaciones: cache.datos ? cache.datos.length : 0,
        ultimaActualizacion: cache.ultimaActualizacion,
        proximaActualizacion: cache.proximaActualizacion,
      },
      base_datos: {
        empresas: Number(totalEmpresas),
        usuarios: Number(totalUsuarios),
        licitacionesGuardadas: Number(totalGuardadas),
      },
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener estado: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener el estado del sistema' })
  }
})

router.get('/logs', (req, res) => {
  res.json({ logs: logger.getEntradas() })
})

module.exports = router
```

- [ ] **Step 2: Verificar que la ruta sigue protegida y no rompe el arranque**

```bash
cd backend
npm start &
sleep 2
curl -s http://localhost:3000/api/admin/estado
kill %1
```

Expected: `{"error":"No autorizado"}` con status 401 — confirma que la ruta monta correctamente con los nuevos `require` y no lanza un error 500 al arrancar. La verificación con datos reales (con el token de superadmin) se hace en la Tarea 8, junto con David.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/admin.js
git commit -m "feat: ampliar /api/admin/estado con CPU, RAM, disco, Docker, PLACSP y latencia"
```

---

### Task 5: Frontend — página `EstadoSistema.jsx`

**Files:**
- Create: `client/src/pages/EstadoSistema.jsx`

**Interfaces:**
- Consumes: `useAuth()` de `client/src/context/AuthContext.jsx` (ya existe, expone `authFetch` y `usuario`); `DashboardLayout` y `KPICard` ya existentes; consume `GET /api/admin/estado` (Task 4).

- [ ] **Step 1: Crear `client/src/pages/EstadoSistema.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Clock, Cpu, Database, Building2, Users, FileText,
  AlertCircle, Box, Gauge,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const UMBRAL_ALERTA = 85

function Card({ title, subtitle, children }) {
  return (
    <section style={{
      background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)', padding: '22px 24px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>{subtitle}</p>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </section>
  )
}

function InfoItem({ label, value, alerta }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: alerta ? 'var(--rojo)' : 'var(--negro)' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function formatUptime(segundos) {
  if (!segundos) return '—'
  const dias = Math.floor(segundos / 86400)
  const horas = Math.floor((segundos % 86400) / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  if (dias > 0) return `${dias}d ${horas}h`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

function formatMB(bytes) {
  if (!bytes) return '—'
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })
}

function formatPorcentaje(valor) {
  return valor == null ? '—' : `${valor}%`
}

export default function EstadoSistema() {
  const { authFetch, usuario } = useAuth()
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/estado')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el estado del sistema')
        return
      }
      setEstado(datos)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Estado del sistema'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del estado del sistema al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  const cpu = estado?.sistemaOperativo?.cpu
  const memoria = estado?.sistemaOperativo?.memoria
  const disco = estado?.sistemaOperativo?.disco
  const docker = estado?.docker
  const placsp = estado?.placsp
  const api = estado?.api

  return (
    <DashboardLayout title="Estado del sistema">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard icon={Clock} value={estado ? formatUptime(estado.servidor.uptimeSegundos) : '—'} label="Tiempo activo del servidor" />
        <KPICard icon={Cpu} value={estado ? formatMB(estado.servidor.memoria.rss) : '—'} label="Memoria del proceso (RSS)" />
        <KPICard icon={Gauge} value={api && api.latenciaMediaMs != null ? `${api.latenciaMediaMs} ms` : '—'} label="Tiempo medio de respuesta API" />
        <KPICard icon={Database} value={estado ? estado.cache.totalLicitaciones : '—'} label="Licitaciones en caché" />
        <KPICard icon={Building2} value={estado ? estado.base_datos.empresas : '—'} label="Empresas registradas" />
        <KPICard icon={Users} value={estado ? estado.base_datos.usuarios : '—'} label="Usuarios registrados" />
        <KPICard icon={FileText} value={estado ? estado.base_datos.licitacionesGuardadas : '—'} label="Licitaciones guardadas (total)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title="Recursos del servidor" subtitle="Uso real de CPU, memoria y disco del sistema operativo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <InfoItem
              label="CPU"
              value={cpu ? `${formatPorcentaje(cpu.porcentajeAprox)} (carga ${cpu.carga1m})` : '—'}
              alerta={cpu?.porcentajeAprox >= UMBRAL_ALERTA}
            />
            <InfoItem
              label="Memoria del sistema"
              value={memoria ? `${formatPorcentaje(memoria.porcentajeUso)} (${memoria.libreMB} MB libres de ${memoria.totalMB} MB)` : '—'}
              alerta={memoria?.porcentajeUso >= UMBRAL_ALERTA}
            />
            <InfoItem
              label="Disco"
              value={disco ? `${formatPorcentaje(disco.porcentajeUso)} (${disco.usadoGB} GB de ${disco.totalGB} GB)` : '—'}
              alerta={disco?.porcentajeUso >= UMBRAL_ALERTA}
            />
          </div>
        </Card>

        <Card title="Contenedores Docker" subtitle="postgres y pgadmin">
          {!docker || !docker.disponible ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No se ha podido consultar Docker en este servidor.</p>
          ) : docker.contenedores.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No hay contenedores en ejecución.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docker.contenedores.map((c) => (
                <div key={c.nombre} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Box size={16} color="var(--n400)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{c.nombre}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                    background: c.estado.toLowerCase().startsWith('up') ? 'var(--verde-claro)' : 'var(--rojo-bg)',
                    color: c.estado.toLowerCase().startsWith('up') ? 'var(--verde)' : 'var(--rojo)',
                  }}>
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Feed PLACSP" subtitle="Última descarga de licitaciones del Estado">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <InfoItem label="Última actualización" value={formatFechaHora(placsp?.ultimaActualizacion)} />
            <InfoItem label="Próxima actualización programada" value={formatFechaHora(placsp?.proximaActualizacion)} />
            <InfoItem label="Licitaciones descargadas la última vez" value={placsp?.ultimoTotalDescargado ?? '—'} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Verificar con ESLint**

```bash
cd client
npx eslint src/pages/EstadoSistema.jsx
```

Expected: sin errores (el archivo aún no está importado en ninguna ruta, así que no afecta al resto de la app).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/EstadoSistema.jsx
git commit -m "feat: crear página EstadoSistema.jsx con recursos, Docker y feed PLACSP"
```

---

### Task 6: Frontend — página `LogsErrores.jsx`

**Files:**
- Create: `client/src/pages/LogsErrores.jsx`

**Interfaces:**
- Consumes: `useAuth()` (igual que Task 5); consume `GET /api/admin/logs` (ya existente, sin cambios de contrato).

- [ ] **Step 1: Crear `client/src/pages/LogsErrores.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NIVEL_CONFIG = {
  error: { bg: 'var(--rojo-bg)', color: 'var(--rojo)', border: 'var(--rojo-borde)', Icon: AlertCircle, label: 'Error' },
  warn: { bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)', Icon: AlertTriangle, label: 'Aviso' },
  info: { bg: 'var(--g50)', color: 'var(--g700)', border: 'var(--g200)', Icon: Info, label: 'Info' },
}

function NivelBadge({ nivel }) {
  const c = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.info
  const { bg, color, border, Icon, label } = c
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 100,
      border: `1px solid ${border}`, background: bg, color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0,
    }}>
      <Icon size={12} />
      {label}
    </span>
  )
}

function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function LogsErrores() {
  const { authFetch, usuario } = useAuth()
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/logs')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el registro de actividad')
        return
      }
      setLogs(datos.logs || [])
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Logs y errores'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de logs al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Logs y errores">
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

      <section style={{
        background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
        boxShadow: 'var(--shadow-card)', padding: '22px 24px',
      }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
          Registro de actividad
        </h3>
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>
          Errores, avisos y peticiones fallidas del backend (máximo 200)
        </p>
        <div style={{ marginTop: 18 }}>
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No hay registros todavía. Todo funciona correctamente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)',
                }}>
                  <NivelBadge nivel={log.nivel} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--negro)' }}>
                      [{log.contexto}] {log.mensaje}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>
                      {formatFechaHora(log.fecha)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}
```

- [ ] **Step 2: Verificar con ESLint**

```bash
cd client
npx eslint src/pages/LogsErrores.jsx
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LogsErrores.jsx
git commit -m "feat: crear página LogsErrores.jsx separada del estado del sistema"
```

---

### Task 7: Frontend — conectar sidebar, rutas, y eliminar `Admin.jsx`

**Files:**
- Modify: `client/src/components/dashboard/Sidebar.jsx`
- Modify: `client/src/App.jsx`
- Delete: `client/src/pages/Admin.jsx`

**Interfaces:**
- Consumes: `EstadoSistema` (Task 5), `LogsErrores` (Task 6).

- [ ] **Step 1: Actualizar `client/src/components/dashboard/Sidebar.jsx`**

Reemplazar la línea 2 (import de iconos):

```js
import { LayoutDashboard, FileText, Settings, LogOut, Activity, ScrollText } from 'lucide-react'
```

Reemplazar las líneas 12 (`NAV_ITEM_ADMIN`) por dos entradas:

```js
const NAV_ITEMS_ADMIN = [
  { to: '/dashboard/admin/estado', label: 'Estado del sistema', icon: Activity, end: false },
  { to: '/dashboard/admin/logs', label: 'Logs y errores', icon: ScrollText, end: false },
]
```

Y la línea 18 (construcción de `navItems`):

```js
const navItems = usuario?.rol === 'superadmin' ? [...NAV_ITEMS, ...NAV_ITEMS_ADMIN] : NAV_ITEMS
```

- [ ] **Step 2: Actualizar `client/src/App.jsx`**

```jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import RutaProtegida from './components/auth/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Dashboard from './pages/Dashboard.jsx'
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
            <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
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

- [ ] **Step 3: Eliminar `client/src/pages/Admin.jsx`**

```bash
git rm client/src/pages/Admin.jsx
```

- [ ] **Step 4: Verificar lint y build completos**

```bash
cd client
npm run lint
npm run build
```

Expected: ambos comandos terminan sin errores (el lint puede mostrar warnings preexistentes no relacionados; no debe haber errores nuevos ni referencias rotas a `Admin.jsx`).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/dashboard/Sidebar.jsx client/src/App.jsx
git commit -m "feat: dividir el enlace de Administración en Estado del sistema y Logs y errores"
```

---

### Task 8: Verificación manual end-to-end y despliegue

**Files:** ninguno (solo verificación y despliegue)

- [ ] **Step 1: Arrancar backend y frontend en local**

```bash
cd backend && npm start &
cd client && npm run dev &
```

- [ ] **Step 2: Verificar como superadmin**

Iniciar sesión en `http://localhost:5173` con `david.carton@benco.es` (David, con su contraseña real). Confirmar:
- El sidebar muestra "Estado del sistema" y "Logs y errores" como dos enlaces separados.
- "Estado del sistema" carga CPU/RAM/memoria del sistema, y muestra "—" o el estado real de Docker/disco según el entorno.
- "Logs y errores" muestra la lista de logs (puede estar vacía si no ha habido errores).

- [ ] **Step 3: Verificar como usuario no-superadmin**

Iniciar sesión con `maria@constructorasnorte.es` / `Demo2024!` (rol `admin`, no `superadmin`). Confirmar que no aparecen los enlaces de administración en el sidebar, y que navegar manualmente a `#/dashboard/admin/estado` redirige a `/dashboard`.

- [ ] **Step 4: Detener los servidores locales**

```bash
kill %1 %2
```

- [ ] **Step 5: Despliegue a producción**

Seguir el flujo de despliegue incremental habitual — confirmar con David antes de ejecutar el push y el despliegue real en el VPS:

```bash
git push
ssh -i ~/.ssh/id_rsa_clouding root@187.33.144.208
cd /var/www/licitaplus-demo
git pull
cd client && npm run build
cd ..
pm2 restart LiciTraker
```

- [ ] **Step 6: Verificar en producción**

Abrir `http://187.33.144.208:3002`, iniciar sesión como superadmin, y repetir la comprobación del Step 2 — en el VPS (Linux), Docker y disco deberían mostrar datos reales en vez de "no disponible".
