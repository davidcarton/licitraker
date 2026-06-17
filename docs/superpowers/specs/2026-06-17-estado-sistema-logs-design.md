# Diseño — Estado del sistema y Logs/errores (panel superadmin)

## Contexto

El panel superadmin de LiciTraker es hoy una única página (`Admin.jsx`) con un único enlace
"Administración" en el sidebar, que muestra: uptime y memoria del proceso Node, contadores de
empresas/usuarios/licitaciones, y los últimos 200 logs en memoria.

David tiene en mente un panel superadmin más amplio, organizado en 6 secciones de sidebar:
visión de negocio, estado del sistema, gestión de empresas, uso de IA, licitaciones admin, y
logs/errores. Dado que mezclan piezas de complejidad y madurez muy distinta (algunas no requieren
infraestructura nueva, otras como "uso de IA" o "MRR" necesitan tablas o decisiones de producto que
no existen hoy), se decidió decomponer en sub-proyectos independientes con su propio diseño.

**Este documento cubre únicamente el primer sub-proyecto: Estado del sistema + Logs y errores.**
Quedan explícitamente fuera de este diseño: gestión de empresas, uso de IA, licitaciones admin,
visión de negocio/MRR — se diseñarán por separado más adelante.

## Alcance

### Estado del sistema (página nueva)
- CPU, RAM y disco **reales del servidor** (sistema operativo, no solo el proceso Node — hoy solo
  se muestra `process.memoryUsage()`).
- Estado de los contenedores Docker (`postgres`, `pgadmin`).
- Última actualización del feed PLACSP, próxima programada, y cuántas licitaciones se descargaron
  en la última actualización.
- Tiempo medio de respuesta de la API.
- Se conservan los KPIs actuales (empresas, usuarios, licitaciones guardadas) que ya muestra
  `Admin.jsx`.

### Logs y errores (página nueva, separada)
- Lista de errores/avisos ya existente (logger en memoria, últimas 200 entradas), movida a su
  propia página.
- Peticiones HTTP fallidas (status ≥ 400) registradas automáticamente, sin tocar las rutas
  existentes.
- Alertas de CPU/RAM/disco altas: **no se registran en el logger**, se resaltan visualmente en la
  página de Estado del sistema (umbral 85%) — ver sección de Frontend.

## Arquitectura

### Navegación
`Sidebar.jsx` sustituye el único `NAV_ITEM_ADMIN` actual por dos entradas, visibles solo si
`usuario.rol === 'superadmin'`:

```js
{ to: '/dashboard/admin/estado', label: 'Estado del sistema', icon: Activity, end: false }
{ to: '/dashboard/admin/logs', label: 'Logs y errores', icon: ScrollText, end: false }
```

`App.jsx` añade ambas rutas, protegidas con la misma lógica que hoy (`Navigate` a `/dashboard` si
`usuario.rol !== 'superadmin'`).

### Backend — recolección de métricas

Nuevo módulo `backend/src/sistema.js`, funciones puras sin estado:

- `obtenerCPU()` — `os.loadavg()` (carga 1/5/15 min) + `os.cpus().length`, deriva un % aproximado.
- `obtenerMemoriaSistema()` — `os.totalmem()` / `os.freemem()` (memoria del sistema operativo,
  distinta de `process.memoryUsage()` que ya se usa para el proceso Node).
- `obtenerDisco()` — `child_process.execSync('df -h /')`, parsea la línea de salida. Si falla
  (Windows local, o el binario no existe), devuelve `null`.
- `obtenerDocker()` — `execSync('docker ps --format "{{.Names}}|{{.Status}}"')`, parsea a
  `[{nombre, estado}]`. Si falla (sin permisos, Docker no instalado), devuelve
  `{ disponible: false, contenedores: [] }` sin lanzar excepción.

**Middleware de latencia** (`server.js`, registrado antes de las rutas): escucha `res.on('finish')`
en cada petición, guarda la duración en un array en memoria acotado a las últimas 100 muestras
(mismo patrón que el logger). Expone `obtenerLatenciaMedia()` → `null` si no hay muestras todavía.

**Middleware de peticiones fallidas** (mismo sitio, mismo evento `finish`): si
`res.statusCode >= 400`, llama a
`logger.warn('http', \`${req.method} ${req.originalUrl} → ${res.statusCode}\`)`. No requiere
cambios en ninguna ruta existente.

**`cache.js`**: se añade el campo `ultimoTotalDescargado`, asignado en `descargarYProcesar()`
(`server.js`) junto con `cache.datos` y `cache.ultimaActualizacion`.

### Backend — endpoints

`GET /api/admin/estado` (ya protegido por `requireAdmin`) se amplía manteniendo los campos
actuales (`servidor`, `cache`, `base_datos`) y añadiendo:

```json
{
  "servidor": { "fecha": "...", "uptimeSegundos": 0, "memoria": {}, "nodeVersion": "..." },
  "sistemaOperativo": {
    "cpu": { "carga1m": 0.42, "carga5m": 0.38, "nucleos": 4, "porcentajeAprox": 11 },
    "memoria": { "totalMB": 8192, "libreMB": 3120, "porcentajeUso": 62 },
    "disco": { "totalGB": 40, "usadoGB": 18, "porcentajeUso": 45 }
  },
  "docker": {
    "disponible": true,
    "contenedores": [
      { "nombre": "postgres", "estado": "Up 3 days" },
      { "nombre": "pgadmin", "estado": "Up 3 days" }
    ]
  },
  "placsp": {
    "ultimaActualizacion": "...",
    "proximaActualizacion": "...",
    "ultimoTotalDescargado": 287
  },
  "api": { "latenciaMediaMs": 84, "muestras": 100 },
  "cache": { "totalLicitaciones": 0 },
  "base_datos": { "empresas": 0, "usuarios": 0, "licitacionesGuardadas": 0 }
}
```

Cualquier sub-objeto (`sistemaOperativo.disco`, `docker`, `api`) puede llevar valores `null` si la
métrica no está disponible en ese entorno (ver Casos límite).

`GET /api/admin/logs` no cambia de contrato — ahora también recibirá entradas de contexto `http`
generadas por el middleware de peticiones fallidas.

### Frontend — páginas

**`EstadoSistema.jsx`** (sustituye a `Admin.jsx`): conserva las KPICards actuales y añade:
- Card "Recursos del servidor": CPU/RAM/disco, cada valor resaltado en rojo si supera el 85% de
  uso. Si el valor es `null`, se muestra `—`.
- Card "Contenedores Docker": lista con badge verde "Activo" / rojo "Caído"; si
  `docker.disponible === false`, mensaje "No se ha podido consultar Docker en este servidor".
- Card "Feed PLACSP": última actualización, próxima programada, y licitaciones descargadas en la
  última actualización.
- Nueva KPICard: "Tiempo medio de respuesta API" (o `—` si no hay muestras).

**`LogsErrores.jsx`** (extrae la card de logs de `Admin.jsx` a su propia página): misma lista con
`NivelBadge` ya existente, sin filtros adicionales en esta primera versión.

## Casos límite y manejo de errores

- **Docker no disponible** (sin permisos, comando inexistente, o desarrollo local en Windows):
  `obtenerDocker()` captura la excepción internamente y devuelve
  `{ disponible: false, contenedores: [] }`. Nunca lanza ni rompe el endpoint.
- **`df` no disponible** (Windows local): `obtenerDisco()` devuelve `null` en caso de error;
  frontend muestra `—`.
- **Latencia sin muestras** (servidor recién arrancado): `obtenerLatenciaMedia()` devuelve `null`
  hasta tener al menos 1 muestra; frontend muestra `—` en vez de `0ms`.
- **Permisos de `docker` en el VPS de producción**: riesgo conocido a verificar en la fase de
  implementación — el usuario que ejecuta PM2 debe poder correr `docker ps` sin `sudo` (añadir al
  grupo `docker` si no es así). No es parte del código, es una verificación de entorno.
- **Desarrollo local en Windows**: `df`/`docker ps` con el formato usado son comandos de Linux; en
  local esas dos secciones mostrarán "no disponible". Es el comportamiento esperado y no bloquea el
  desarrollo del resto de la página.

## Testing y verificación

- Backend: prueba manual del endpoint ampliado en local (en Windows, CPU/RAM del sistema
  funcionarán vía `os`; disco y Docker mostrarán "no disponible", lo cual es correcto).
- La verificación real de Docker y disco solo es posible en el VPS — se comprueba tras el
  despliegue, siguiendo el flujo de despliegue incremental ya establecido (cada cambio se commitea,
  sube y despliega individualmente).
- Frontend: verificar visualmente ambas páginas nuevas con el usuario superadmin
  (`david.carton@benco.es`), y confirmar que un usuario no-superadmin sigue sin ver los enlaces del
  sidebar ni puede acceder por URL directa (redirige a `/dashboard`).

## Fuera de alcance (sub-proyectos futuros)

- Gestión de empresas (listado, cambiar plan, activar/desactivar, ver preferencias, resetear
  contraseña, impersonation).
- Uso de IA (tracking de llamadas y coste — requiere tabla nueva).
- Licitaciones admin (forzar actualización manual del feed, logs de descargas).
- Visión de negocio / MRR (requiere decidir de dónde sale el dato de precio por plan, no existe
  sistema de facturación hoy).
