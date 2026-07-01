# LiciTraker

Aplicación SaaS para empresas constructoras españolas que rastrea licitaciones públicas en tiempo real desde el feed ATOM del PLACSP (Plataforma de Contratación del Sector Público).

Demo en producción: **http://187.33.144.208:3002**

---

## Qué hace

- Descarga y filtra automáticamente las licitaciones de obra del feed oficial del Estado
- Muestra solo las licitaciones activas (plazo no vencido) con CPV 45 u obras del tipo 3
- Permite guardar licitaciones por empresa, marcarlas como presentadas y registrar el resultado (aceptada/denegada), con gráfica de evolución en el Dashboard
- Genera resúmenes con IA de cada licitación: descarga los pliegos PDF del perfil del contratante, los procesa con Claude Haiku (por bloques si son grandes) y sintetiza el resultado final con Claude Sonnet
- Historial de resúmenes generados por empresa (`/dashboard/resumenes`) — cada empresa ve solo los suyos; el superadmin ve todos los de todas las empresas
- Coste real de cada llamada a la API de Anthropic calculado en euros y almacenado por resumen — solo visible para el superadmin
- Panel de administración para el superadmin con visión de negocio, logs y gestión de clientes
- Multi-empresa: cada empresa registrada tiene sus propios usuarios, licitaciones guardadas y resúmenes IA

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite, HashRouter, Framer Motion, Lucide React |
| Estilos | CSS custom con variables (no Tailwind) — paleta verde `#2A5938` |
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL + Knex.js (query builder + migraciones) |
| Autenticación | JWT (HS256), token en `localStorage` bajo la clave `licitaplus_token` |
| Feed de datos | PLACSP ATOM XML — parseo con `axios` + `xml2js` |
| IA — síntesis final | Anthropic SDK — `claude-sonnet-4-6` (`MODELO_RESUMEN`) |
| IA — bloques PDF | Anthropic SDK — `claude-haiku-4-5-20251001` (`MODELO_BLOQUE`) |
| PDF processing | `pdf-lib` — split de PDFs grandes en bloques de 80 páginas |
| Tareas programadas | `node-cron` |
| Email | `nodemailer` (SMTP) — envío de emails a clientes desde el panel admin |
| Servidor | VPS Clouding — PM2 como gestor de procesos |

---

## Estructura del proyecto

```
licitraker/
├── backend/
│   ├── server.js                  # Servidor principal Express + endpoints IA + DELETE /api/mi-cuenta
│   ├── knexfile.js                # Configuración Knex (dev/prod)
│   ├── scripts/
│   │   ├── crear-superadmin.js    # Script para crear usuario superadmin
│   │   └── crear-constructora-garcia.js  # Script de alta de un cliente real (rol user)
│   └── src/
│       ├── cache.js               # Caché en memoria del feed PLACSP
│       ├── db/
│       │   ├── index.js           # Instancia Knex exportada
│       │   ├── schema.sql         # DDL de referencia (no se ejecuta, usar migraciones)
│       │   └── migrations/        # Migraciones Knex (001-011)
│       │       ├── 001_crear_empresas.js
│       │       ├── 002_crear_usuarios.js
│       │       ├── 003_crear_preferencias.js
│       │       ├── 004_crear_licitaciones_guardadas.js
│       │       ├── 005_agregar_precio_mensual_empresas.js
│       │       ├── 006_ampliar_plan_empresas.js
│       │       ├── 007_crear_resumenes_ia.js
│       │       ├── 008_ampliar_resumenes_ia.js
│       │       ├── 009_tokens_resumenes_ia.js
│       │       ├── 010_coste_resumenes_ia.js
│       │       └── 011_empresa_resumenes_ia.js
│       ├── middleware/
│       │   ├── auth.js            # Middleware JWT → req.user {id, empresa_id, rol, email}
│       │   ├── admin.js           # Middleware rol superadmin
│       │   └── metricas.js        # medirLatencia + registrarPeticionesFallidas
│       ├── routes/
│       │   ├── auth.js            # /api/auth — login, register, logout, me
│       │   ├── licitaciones.js    # /api/licitaciones-guardadas — CRUD por empresa
│       │   ├── admin.js           # /api/admin — estado, negocio y logs (solo superadmin)
│       │   └── clientes.js        # /api/admin/clientes — listado, detalle, edición, reseteo, email y DELETE
│       ├── utils/
│       │   ├── logger.js          # Logger en memoria (últimas 200 entradas)
│       │   └── pliegos.js         # obtenerPliegosPDF — descarga PDFs del perfil del contratante
│       └── sistema.js             # obtenerCPU / Memoria / Disco / Docker
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                # Rutas (HashRouter)
        ├── main.jsx
        ├── context/
        │   ├── AuthContext.jsx    # Estado de sesión global + useAuth
        │   └── AppContext.jsx     # Licitaciones guardadas/presentadas + useApp
        ├── pages/
        │   ├── Login.jsx
        │   ├── Registro.jsx
        │   ├── Inicio.jsx          # Router: VisionNegocio (superadmin) o Dashboard (resto)
        │   ├── Dashboard.jsx       # KPIs + secciones guardadas/presentadas + gráfica resultados
        │   ├── VisionNegocio.jsx   # Panel superadmin — 4 KPIs (MRR, clientes activos, altas semana, Coste IA API),
        │   │                       # gráfica crecimiento mensual, estado cuentas + ingresos por plan,
        │   │                       # últimas incorporaciones
        │   ├── Licitaciones.jsx    # Listado del feed PLACSP; barra de búsqueda por CPV en la parte
        │   │                       # superior + filtros debajo (FiltroBarra); sin búsqueda por texto libre
        │   ├── ResumenIA.jsx       # Generación de resumen IA de una licitación (ruta /dashboard/resumen)
        │   ├── MisResumenes.jsx    # Historial de resúmenes guardados (ruta /dashboard/resumenes)
        │   ├── Configuracion.jsx   # Perfil / Preferencias / Integrar CRM + sección "Eliminar cuenta"
        │   │                       # en tab Perfil (confirmación en dos pasos) — solo usuarios no-superadmin
        │   ├── EstadoSistema.jsx   # Panel superadmin — CPU/RAM/disco, Docker, feed PLACSP, latencia API
        │   │                       # (ruta /dashboard/admin/estado — accesible por URL, no en sidebar)
        │   ├── LogsErrores.jsx     # Panel superadmin — errores, avisos y peticiones HTTP fallidas
        │   └── GestionClientes.jsx # Panel superadmin — lista de clientes; detalle inline con edición,
        │                           # email directo, preferencias, usuarios y card "Eliminar cliente"
        │                           # con modal de confirmación
        ├── components/
        │   ├── auth/              # AuthLayout, FormInput, RutaProtegida
        │   ├── layout/            # Header.jsx — header fijo de la app pública (logo + nav)
        │   ├── dashboard/         # DashboardLayout, Sidebar, Header, KPICard, TablaUrgentes (sin usar)
        │   ├── cards/             # LicitacionCard, LicitacionModal
        │   └── ui/                # Alert, Badge, BlueprintFrame, DataTable, EstadoBar, FiltroBarra,
        │                          # SearchInput, SlideOver, Spinner, Tabs, etc.
        ├── styles/
        │   └── global.css         # Variables CSS + estilos base
        └── utils/
            └── format.js          # diasRestantes, formatImporte, formatFecha, descripcionCPV, iniciales
```

---

## Variables de entorno

Crear `backend/.env` (ver `.env.example`):

```env
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_NAME=licitracker_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=7d

# CORS (dejar vacío para permitir todo, en producción poner la URL del frontend)
CORS_ORIGINS=

# Resumen IA (opcional — sin esto el botón de resumen devuelve error)
ANTHROPIC_API_KEY=sk-ant-...

# Email (SMTP) — opcional, necesario para enviar emails a clientes desde Gestión de clientes
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## Instalación y arranque local

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+ corriendo en el puerto configurado
- La base de datos creada (ver siguiente sección)

### Backend

```bash
cd backend
npm install
npm start          # Node en :3000 — sirve también el build de React
```

Para desarrollo con recarga automática usar `nodemon`:

```bash
npx nodemon server.js
```

### Frontend (modo desarrollo)

```bash
cd client
npm install
npm run dev        # Vite en :5173 con proxy al backend en :3000
```

### Build de producción

```bash
cd client
npm run build      # Genera client/dist/
# Luego node backend/server.js sirve todo desde :3000
```

---

## Base de datos

### Crear la BD por primera vez

```bash
# Desde backend/
npm run migrate          # Ejecuta las 11 migraciones en orden
```

### Ejecutar migraciones en el VPS (producción)

```bash
cd /var/www/licitraker/backend
DB_HOST=localhost DB_PORT=5433 DB_NAME=licitaplus_db DB_USER=licitaplus DB_PASSWORD=licitaplus_2026_secure npx knex migrate:latest
```

> Importante: ejecutar siempre desde `/var/www/licitraker/backend/`, no desde la raíz del proyecto.

### Tablas creadas por las migraciones

| Migración | Tabla / cambio | Descripción |
|---|---|---|
| 001 | `empresas` | CIF, nombre, plan (starter/pro/enterprise), activa |
| 002 | `usuarios` | email, password_hash (bcrypt), rol, empresa_id |
| 003 | `preferencias` | CPVs de interés, provincias, importes mín/máx por empresa |
| 004 | `licitaciones_guardadas` | licitaciones guardadas por empresa, con campo `estado` |
| 005 | `empresas` | añade `precio_mensual` |
| 006 | `empresas` | amplía el enum de planes |
| 007 | `resumenes_ia` | tabla principal: expediente, resumen, pliegos_encontrados, created_at |
| 008 | `resumenes_ia` | añade `titulo`, `organismo`, `importe`, `fecha_limite` |
| 009 | `resumenes_ia` | añade `tokens_input`, `tokens_output` |
| 010 | `resumenes_ia` | añade `coste_euros DECIMAL(10,6)` |
| 011 | `resumenes_ia` | añade `empresa_id FK→empresas(id)`, cambia índice único de `(expediente)` a `(expediente, empresa_id)` |

El campo `estado` de `licitaciones_guardadas` acepta: `guardada`, `en_estudio`, `presentada`, `descartada`, `ganada`, `perdida`, `aceptada`, `denegada` (ver `ESTADOS_VALIDOS` en `backend/src/routes/licitaciones.js`).

### Crear superadmin

```bash
cd backend
node scripts/crear-superadmin.js
```

El script pedirá nombre, email y contraseña por consola.

### Cuentas existentes

| Empresa | Email | Contraseña | Rol | Tipo |
|---|---|---|---|---|
| — | david.carton@benco.es | (la suya) | `superadmin` | Único superadmin actual |
| Constructoras del Norte S.L. (plan: pro) | maria@constructorasnorte.es | Demo2024! | `admin` | Cuenta de demo / pruebas |
| Constructora García (plan: pro) | info@constructoragarcia.com | nuria2026 | `user` | Cliente real (alta vía `crear-constructora-garcia.js`) |

**Política de roles actual**: por el momento solo `david.carton@benco.es` tiene rol `admin`/`superadmin`. Todas las nuevas altas de clientes deben crearse con rol `user` salvo indicación expresa. El sistema soporta conceder `admin`/`superadmin` a otros usuarios en el futuro sin cambios de código — basta con actualizar el campo `rol` en la tabla `usuarios`.

---

## API — Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/licitaciones` | Feed PLACSP filtrado y cacheado. `?refresh=1` fuerza recarga |
| `GET` | `/api/buscar-cpv?codigo=45` | Busca en el feed por código CPV (sin caché) |
| `GET` | `/api/estado` | Estado del servidor: última actualización, total en caché |

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro — crea empresa + usuario admin en una transacción |
| `POST` | `/api/auth/login` | Login — devuelve JWT + datos del usuario |
| `POST` | `/api/auth/logout` | Logout (stateless, limpia token en cliente) |
| `GET` | `/api/auth/me` | Devuelve usuario actual (requiere JWT) |

El token JWT se envía en la cabecera `Authorization: Bearer <token>`.

El objeto `usuario` devuelto tiene la forma:
```json
{
  "id": 1,
  "nombre": "María García",
  "email": "maria@ejemplo.com",
  "rol": "admin",
  "empresa": { "id": 2, "nombre": "Mi Empresa S.L.", "plan": "pro" }
}
```

### Licitaciones guardadas (`/api/licitaciones-guardadas`) — requiere JWT

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/licitaciones-guardadas` | Lista las guardadas de la empresa del usuario |
| `POST` | `/api/licitaciones-guardadas/guardar` | Guarda una licitación (upsert por `empresa_id` + `licitacion_id`) |
| `PATCH` | `/api/licitaciones-guardadas/:id/estado` | Cambia el `estado` (debe ser uno de `ESTADOS_VALIDOS`) |
| `DELETE` | `/api/licitaciones-guardadas/:id` | Elimina una guardada |

El frontend (`AppContext.jsx`) separa las guardadas en dos listas según el estado: `licitacionesGuardadas` (resto) y `licitacionesPresentadas` (`presentada`, `aceptada`, `denegada`). Las funciones `marcarPresentada`, `marcarAceptada` y `marcarDenegada` usan el endpoint `PATCH .../estado`.

### Resúmenes IA — requiere JWT

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/resumen-ia` | Genera resumen IA para una licitación. Comprueba caché por `(expediente, empresa_id)`. Body: `{titulo, organismo, importe, fechaLimite, cpv, enlace, expediente}` |
| `GET` | `/api/resumenes-ia` | Lista el historial de resúmenes. Superadmin: todos + `empresa_nombre`. Usuario normal: solo los de su empresa |
| `GET` | `/api/resumenes-ia/:expediente` | Devuelve un resumen concreto |
| `DELETE` | `/api/resumenes-ia/:expediente` | Elimina un resumen. Superadmin puede borrar cualquiera; usuario normal solo los de su empresa |

El campo `coste_euros` solo se persiste y devuelve; la visibilidad en el frontend está restringida al superadmin.

#### Lógica de generación de resúmenes

1. Comprueba caché en BD por `(expediente, empresa_id)` — si existe, devuelve el resumen guardado sin llamar a la API.
2. Descarga los pliegos PDF del perfil del contratante (vía `obtenerPliegosPDF`).
3. Intenta pasar todos los PDFs directamente a `claude-sonnet-4-6`.
4. Si la llamada falla por tamaño (error 400): reintenta sin el PDF más grande; si falla de nuevo, procesa el PDF grande en bloques de 80 páginas con `claude-haiku-4-5-20251001` y sintetiza con Sonnet.
5. Guarda el resumen, metadatos, tokens consumidos y coste en euros en `resumenes_ia`.

#### Cálculo de coste

```js
const PRECIO = {
  sonnet: { input: 3.00, output: 15.00 },  // USD por millón de tokens
  haiku:  { input: 0.80, output: 4.00  },
}
const USD_A_EUR = 0.92
```

El coste final combina los tokens de Haiku (bloques) y Sonnet (síntesis) cuando se usa la ruta de bloques.

### Admin (`/api/admin`) — requiere JWT + rol superadmin

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/estado` | Métricas del servidor, caché y BD |
| `GET` | `/api/admin/negocio` | Métricas de negocio: MRR, clientes activos, altas semana, `costeIA` (suma total `coste_euros` de todos los resúmenes en €), desglose por plan y crecimiento mensual |
| `GET` | `/api/admin/logs` | Últimas 200 entradas del logger en memoria |
| `GET` | `/api/admin/clientes` | Lista de clientes (empresas, excluidas las de plan "admin") |
| `GET` | `/api/admin/clientes/:id` | Detalle de un cliente con sus usuarios y preferencias configuradas |
| `PATCH` | `/api/admin/clientes/:id` | Edita plan, precio_mensual y/o activa de un cliente |
| `PATCH` | `/api/admin/clientes/:id/usuarios/:usuarioId/password` | Resetea la contraseña de un usuario dentro de un cliente |
| `POST` | `/api/admin/clientes/:id/email` | Envía un email a todos los usuarios del cliente vía SMTP |
| `DELETE` | `/api/admin/clientes/:id` | Elimina un cliente (empresa) y todo en cascada — excluye empresas con plan `admin` |

### Cuenta propia — requiere JWT

| Método | Ruta | Descripción |
|---|---|---|
| `DELETE` | `/api/mi-cuenta` | El propio usuario elimina su cuenta (y su empresa + datos en cascada) |

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| `user` | Acceso al dashboard y licitaciones de su empresa |
| `admin` | Igual que user + puede gestionar usuarios de su empresa |
| `superadmin` | Su "Inicio" muestra la Visión general del negocio (VisionNegocio) en vez del dashboard de empresa. Accede además a Gestión de clientes y Logs y errores |

### Navegación en el Sidebar

| Elemento | Usuarios normales | Superadmin |
|---|---|---|
| Inicio | ✓ | ✓ (→ VisionNegocio) |
| Licitaciones | ✓ | ✓ |
| Resúmenes IA | ✓ (solo su empresa) | ✓ (todas las empresas) |
| Configuración | ✓ | — (sustituido por Gestión de clientes) |
| Gestión de clientes | — | ✓ |
| Logs y errores | — | ✓ |

> `EstadoSistema.jsx` sigue existiendo y es accesible en `/dashboard/admin/estado` pero no aparece en el sidebar; se accede directamente por URL.

El primer usuario registrado en una empresa (vía `/api/auth/register`) recibe rol `admin` automáticamente. Los `superadmin` se crean manualmente (script `crear-superadmin.js` o UPDATE directo en BD).

La visibilidad del módulo de administración está protegida en 3 capas: el Sidebar oculta los enlaces si `usuario.rol !== 'superadmin'`, las páginas `LogsErrores.jsx` y `GestionClientes.jsx` redirigen a `/dashboard` si no es superadmin, y el backend (`middleware/admin.js`) devuelve 403 si `req.user.rol !== 'superadmin'`.

---

## Lógica del feed PLACSP

El backend descarga el feed ATOM de contratación pública y filtra:

1. **Solo obras**: TypeCode `3` (obras puras) o cualquier tipo con CPV que empiece por `45`
2. **Solo en plazo**: fecha límite ≥ hoy
3. **Paginación**: hasta 5 páginas del feed, objetivo 300 resultados

Los datos se guardan en memoria (`cache.js`). Se actualizan automáticamente:
- L-V a las 7:00, 12:00 y 18:00 (hora de Madrid)
- Sábados a las 7:00
- Limpieza horaria: cada hora elimina del caché las licitaciones cuyo plazo ha vencido

Si el caché está vacío al arrancar, se descarga de inmediato.

---

## Despliegue en producción (VPS Clouding)

**Servidor**: `root@187.33.144.208`  
**Ruta de la app**: `/var/www/licitraker`  
**Proceso PM2**: `LiciTraker` (id 3)  
**Puerto**: 3002

### Conexión SSH

```bash
ssh -i ~/.ssh/id_rsa_clouding root@187.33.144.208
```

La clave pública está en `D:\David\proyectos\Pc_Casa.pub`.

### Flujo de despliegue

```bash
# Local — subir cambios
git add .
git commit -m "descripción"
git push

# Servidor — actualizar y reconstruir
ssh -i ~/.ssh/id_rsa_clouding root@187.33.144.208
cd /var/www/licitraker
git pull
cd client && npm run build
cd ..
pm2 restart LiciTraker
```

### Comandos PM2 útiles

```bash
pm2 status                  # Estado de todos los procesos
pm2 logs LiciTraker         # Logs en tiempo real
pm2 restart LiciTraker      # Reiniciar
pm2 stop LiciTraker         # Parar
```

---

## Notas conocidas

- **Límite de importe en BD**: La columna `importe` en producción es `NUMERIC(8,2)` — máximo 999,999.99 €. Importes mayores provocan error al guardar.
- **IA opcional**: Si no hay `ANTHROPIC_API_KEY` en el `.env`, el botón de resumen devuelve error 500 pero el resto de la app funciona con normalidad.
- **`usuario.empresa` es un objeto** (`{id, nombre, plan}`), no un string. Siempre acceder con `usuario?.empresa?.nombre`. El Sidebar y el Dashboard ya lo hacen correctamente — tenerlo en cuenta en cualquier componente nuevo que muestre el nombre de empresa.
- **Resúmenes IA sin empresa_id**: Los resúmenes generados antes de la migración 011 tienen `empresa_id = NULL`. No aparecen en ninguna vista de usuario normal (filtro por `empresa_id` excluye los nulos), pero sí son visibles para el superadmin en el historial.
- **Coste IA (badge €)**: solo visible para el superadmin, tanto en las tarjetas de `MisResumenes.jsx` como en el KPI "Coste IA (API)" de `VisionNegocio.jsx`. Los usuarios normales nunca ven información de coste.
- **`TablaUrgentes.jsx`** (`client/src/components/dashboard/`) quedó sin uso tras el rediseño del Dashboard. No se ha borrado por si se quiere recuperar esa vista.
- **Búsqueda en Licitaciones**: la barra de búsqueda por texto libre fue eliminada. En su lugar hay una barra de búsqueda específica por código CPV (`BarraBusquedaCPV`, definida inline en `Licitaciones.jsx`) en la parte superior; los filtros habituales (FiltroBarra) van debajo. El endpoint `GET /api/buscar-cpv?codigo=` gestiona estas búsquedas.
- **Header del dashboard**: el Header del dashboard (`components/dashboard/Header.jsx`) ya no tiene barra de búsqueda ni botón "nueva alerta" — es un componente simplificado. Existe también `components/layout/Header.jsx`, un header estático con logo y navegación para las páginas públicas.
- **Eliminación de clientes**: el endpoint `DELETE /api/admin/clientes/:id` borra en cascada toda la empresa. La UI en `GestionClientes.jsx` muestra una card "Eliminar cliente" con modal de confirmación al final del detalle del cliente.
- **Eliminación de cuenta propia**: el endpoint `DELETE /api/mi-cuenta` (en `server.js`) permite al propio usuario borrar su cuenta. La UI en `Configuracion.jsx` (tab Perfil) implementa confirmación en dos pasos. No disponible para superadmin.
- **Fuentes**: `--font-display` (Syne 800) es un display font pesado, poco legible en tamaños pequeños/densos. Usar `--font-titulo` (Inter) o `'DM Sans'` para títulos de tarjeta e importes; reservar Syne para titulares grandes.
- **Gráfica de resultados del Dashboard** (`GraficaResultados` en `Dashboard.jsx`) se construye con divs CSS (sin librería de gráficos), agrupando por mes a partir de `fechaResolucion`. Solo se muestra el desglose mensual si hay datos de más de un mes.
- **Envío de email sin SMTP configurado**: si `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` no están en el `.env`, el endpoint `POST /api/admin/clientes/:id/email` devuelve 500 pero el resto del panel funciona con normalidad.
- **Token JWT en el frontend**: todos los endpoints de resúmenes IA requieren autenticación. El token se lee de `localStorage.getItem('token')` y se envía como `Authorization: Bearer <token>` en todas las llamadas a `/api/resumen-ia` y `/api/resumenes-ia`.
