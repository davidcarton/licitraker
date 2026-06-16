# LiciTraker

Aplicación SaaS para empresas constructoras españolas que rastrea licitaciones públicas en tiempo real desde el feed ATOM del PLACSP (Plataforma de Contratación del Sector Público).

Demo en producción: **http://187.33.144.208:3002**

---

## Qué hace

- Descarga y filtra automáticamente las licitaciones de obra del feed oficial del Estado
- Muestra solo las licitaciones activas (plazo no vencido) con CPV 45 u obras del tipo 3
- Permite guardar licitaciones por empresa y marcarlas como presentadas
- Genera resúmenes con IA (Claude Haiku) de cada licitación
- Panel de administración para el superadmin con estado del sistema y logs
- Multi-empresa: cada empresa registrada tiene sus propios usuarios y licitaciones guardadas

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
| IA | Anthropic SDK — modelo `claude-haiku-4-5-20251001` |
| Tareas programadas | `node-cron` |
| Servidor | VPS Clouding — PM2 como gestor de procesos |

---

## Estructura del proyecto

```
licitraker/
├── backend/
│   ├── server.js                  # Servidor principal Express
│   ├── knexfile.js                # Configuración Knex (dev/prod)
│   ├── scripts/
│   │   └── crear-superadmin.js    # Script para crear usuario superadmin
│   └── src/
│       ├── cache.js               # Caché en memoria del feed PLACSP
│       ├── db/
│       │   ├── index.js           # Instancia Knex exportada
│       │   ├── schema.sql         # DDL de referencia (no se ejecuta, usar migraciones)
│       │   └── migrations/        # Migraciones Knex (001-004)
│       ├── middleware/
│       │   ├── auth.js            # Middleware JWT → req.user
│       │   └── admin.js           # Middleware rol superadmin
│       ├── routes/
│       │   ├── auth.js            # /api/auth — login, register, logout, me
│       │   ├── licitaciones.js    # /api/licitaciones-guardadas — CRUD por empresa
│       │   └── admin.js           # /api/admin — estado y logs (solo superadmin)
│       └── utils/
│           └── logger.js          # Logger en memoria (últimas 200 entradas)
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                # Rutas (HashRouter)
        ├── main.jsx
        ├── context/
        │   ├── AuthContext.jsx    # Estado de sesión global
        │   └── AppContext.jsx     # Licitaciones guardadas y presentadas
        ├── pages/
        │   ├── Login.jsx
        │   ├── Registro.jsx
        │   ├── Dashboard.jsx      # KPIs + paneles expandibles
        │   ├── Licitaciones.jsx   # Listado del feed PLACSP con filtros
        │   ├── ResumenIA.jsx      # Resumen generado por IA
        │   ├── Configuracion.jsx  # Ajustes de la empresa
        │   └── Admin.jsx          # Panel superadmin
        ├── components/
        │   ├── auth/              # AuthLayout, FormInput, RutaProtegida
        │   ├── dashboard/         # DashboardLayout, Sidebar, Header, KPICard, TablaUrgentes
        │   ├── cards/             # LicitacionCard, LicitacionModal
        │   └── ui/                # Alert, Badge, DataTable, FiltroBarra, Spinner, etc.
        ├── styles/
        │   └── global.css         # Variables CSS + estilos base
        └── utils/
            └── format.js          # diasRestantes, formatImporte
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
npm run migrate          # Ejecuta las 4 migraciones en orden
```

Las migraciones crean las tablas:
- `empresas` — CIF, nombre, plan (starter/pro/enterprise), activa
- `usuarios` — email, password_hash (bcrypt), rol (user/admin/superadmin), empresa_id
- `preferencias` — CPVs de interés, provincias, importes mín/máx por empresa
- `licitaciones_guardadas` — licitaciones guardadas por empresa, con estado (nueva/seguimiento/presentada/descartada)

### Crear superadmin

```bash
cd backend
node scripts/crear-superadmin.js
```

El script pedirá nombre, email y contraseña por consola.

### Cuenta de demo

| Campo | Valor |
|---|---|
| Empresa | Constructoras del Norte S.L. (plan: pro) |
| Email | maria@constructorasnorte.es |
| Contraseña | Demo2024! |
| Rol | admin |

---

## API — Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/licitaciones` | Feed PLACSP filtrado y cacheado. `?refresh=1` fuerza recarga |
| `GET` | `/api/buscar-cpv?codigo=45` | Busca en el feed por código CPV (sin caché) |
| `GET` | `/api/estado` | Estado del servidor: última actualización, total en caché |
| `POST` | `/api/resumen-ia` | Genera resumen con Claude Haiku. Body: `{titulo, organismo, importe, fechaLimite, cpv, enlace}` |

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
| `POST` | `/api/licitaciones-guardadas` | Guarda una licitación |
| `PATCH` | `/api/licitaciones-guardadas/:id` | Actualiza estado o notas |
| `DELETE` | `/api/licitaciones-guardadas/:id` | Elimina una guardada |

### Admin (`/api/admin`) — requiere JWT + rol superadmin

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/estado` | Métricas del servidor, caché y BD |
| `GET` | `/api/admin/logs` | Últimas 200 entradas del logger en memoria |

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| `user` | Acceso al dashboard y licitaciones de su empresa |
| `admin` | Igual que user + puede gestionar usuarios de su empresa |
| `superadmin` | Todo lo anterior + panel `/dashboard/admin` con estado del sistema y logs |

El primer usuario registrado en una empresa tiene rol `admin`. Los superadmin se crean manualmente con el script.

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
**Ruta de la app**: `/var/www/licitaplus-demo`  
**Proceso PM2**: `LiciTraker` (id 2)  
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
cd /var/www/licitaplus-demo
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

- **Bug en Sidebar.jsx**: `usuario?.empresa` es un objeto, no un string. Renderizarlo directamente provoca pantalla en blanco. La corrección es `usuario?.empresa?.nombre`. Pendiente de arreglar.
- **Límite de importe en BD**: La columna `importe` en producción es `NUMERIC(8,2)` — máximo 999,999.99 €. Importes mayores provocan error al guardar.
- **IA opcional**: Si no hay `ANTHROPIC_API_KEY` en el `.env`, el botón de resumen devuelve error 500 pero el resto de la app funciona con normalidad.
