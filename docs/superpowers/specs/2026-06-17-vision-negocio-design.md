# Visión general del negocio — Diseño

## Contexto

Continuación del roadmap del panel superadmin ampliado de LiciTraker (ver
`docs/superpowers/plans/2026-06-17-estado-sistema-logs.md` y la sección 1 ya
completada). Esta es la sección 1 original de la propuesta de David
("Visión general del negocio"), pero redefinida durante el brainstorming:
en vez de ser una sección más bajo "Administración", **sustituye la
pantalla "Inicio" que ve el superadmin al iniciar sesión**, reemplazando el
Dashboard de empresa (vacío e irrelevante para una cuenta superadmin) por un
resumen de negocio.

## Alcance

**Incluye:**
- Endpoint backend `GET /api/admin/negocio` con 6 métricas de negocio
- Página frontend `VisionNegocio.jsx` con 6 KPICards simples (sin gráficas,
  sin tablas)
- Lógica de enrutado: la ruta `/dashboard` ("Inicio") muestra esta pantalla
  para `usuario.rol === 'superadmin'`, y el `Dashboard.jsx` normal para
  cualquier otro rol
- Columna nueva `precio_mensual` en `empresas` (nullable, sin relleno
  automático)

**Excluye explícitamente (fuera de este sub-proyecto):**
- Cualquier UI para fijar o editar precios — eso es parte de "Gestión de
  empresas" (siguiente sub-proyecto del roadmap)
- Tracking histórico de bajas/cancelaciones por fecha — no existe columna
  `fecha_baja`; el KPI correspondiente muestra el total de empresas
  inactivas *ahora*, no "bajas esta semana"
- Cualquier cambio a las cuentas de `empresas`/`usuarios` que ya muestra
  "Estado del sistema" (sección ya entregada, fuera de alcance)
- Gráficas de evolución, históricos, o desglose por empresa del MRR (eso
  es "Uso de la IA"/"Licitaciones admin", sub-proyectos posteriores, en lo
  que aplique)

## Arquitectura

### Backend

**Migración `005_add_precio_mensual_empresas.js`** (Knex, mismo patrón que
las migraciones 001-004):
```js
exports.up = knex => knex.schema.table('empresas', t => {
  t.decimal('precio_mensual', 10, 2).nullable()
})

exports.down = knex => knex.schema.table('empresas', t => {
  t.dropColumn('precio_mensual')
})
```
Sin valor por defecto, sin script de relleno. Queda en `NULL` hasta que
David lo rellene manualmente en la base de datos (directamente por SQL/
cliente de BD), tarea explícitamente fuera de este sub-proyecto.

**Endpoint `GET /api/admin/negocio`** en `backend/src/routes/admin.js`,
bajo el mismo `router.use(auth, requireAdmin)` ya existente en el archivo
(mismo guard que `/estado` y `/logs`). Todas las consultas excluyen las
empresas con `plan = 'admin'` (la empresa interna creada junto con la
cuenta superadmin, ver "Casos límite"):

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

    const [{ suma: mrr }] = await baseQuery()
      .where('activa', true)
      .sum({ suma: db.raw('COALESCE(precio_mensual, 0)') })

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
      mrr: Number(mrr) || 0,
      planMasContratado: filaPlan ? filaPlan.plan : null,
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener visión de negocio: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener la visión de negocio' })
  }
})
```

(El código anterior fija el contrato y la forma de las consultas; el plan
de implementación puede ajustar sintaxis Knex exacta si hace falta, pero el
resultado JSON y el filtro `plan != 'admin'` son vinculantes.)

### Frontend

**`client/src/pages/VisionNegocio.jsx`** (nuevo): mismo esqueleto que
`EstadoSistema.jsx` — guard de rol, `authFetch('/api/admin/negocio')` al
montar, botón "Actualizar", bloque de error rojo en fallo. Grid de 6
`KPICard` (`repeat(auto-fit, minmax(180px, 1fr))`):

1. Empresas registradas → `totalEmpresas`
2. Empresas activas → `totalActivas`
3. Empresas inactivas → `totalInactivas`
4. Nuevas altas esta semana → `altasEstaSemana`
5. Ingresos recurrentes del mes (MRR) → `formatImporte(mrr)` + "€" (reusa
   `client/src/utils/format.js`, igual que `Dashboard.jsx`)
6. Plan más contratado → `planMasContratado ?? '—'`

Guard de rol idéntico al de `EstadoSistema.jsx`:
```jsx
if (usuario && usuario.rol !== 'superadmin') {
  return <Navigate to="/dashboard" replace />
}
```
(Este guard es redundante una vez integrado en `Inicio.jsx`, pero se
mantiene por si en el futuro se accede a esta página por otra vía, igual
que en `EstadoSistema.jsx`/`LogsErrores.jsx`.)

**`client/src/pages/Inicio.jsx`** (nuevo, wrapper mínimo):
```jsx
import { useAuth } from '../context/AuthContext.jsx'
import Dashboard from './Dashboard.jsx'
import VisionNegocio from './VisionNegocio.jsx'

export default function Inicio() {
  const { usuario } = useAuth()
  return usuario?.rol === 'superadmin' ? <VisionNegocio /> : <Dashboard />
}
```

**`client/src/App.jsx`**: la ruta `/dashboard` pasa de
`<RutaProtegida><Dashboard /></RutaProtegida>` a
`<RutaProtegida><Inicio /></RutaProtegida>`. El import de `Dashboard` se
sustituye por el de `Inicio` (Dashboard se sigue usando, pero ahora
indirectamente vía `Inicio.jsx`). Ninguna otra ruta cambia.

**Sidebar**: sin cambios — "Inicio" ya apunta a `/dashboard` para todos los
roles (`NAV_ITEMS` en `Sidebar.jsx`).

## Casos límite

- **Sin precios definidos:** todos los `precio_mensual` son `NULL` →
  `mrr = 0` vía `COALESCE`, nunca `null` ni error en el frontend.
- **Sin empresas no-admin en la tabla:** `planMasContratado = null` →
  frontend muestra `—`; el resto de contadores son `0`.
- **Empresa interna del superadmin (`plan = 'admin'`):** excluida de
  *todas* las consultas de este endpoint mediante `whereNot('plan', 'admin')`.
  Esto es necesario porque `crear-superadmin.js` crea automáticamente una
  fila en `empresas` (`LiciTracker Admin`, plan `admin`) junto con la
  cuenta del superadmin — sin esta exclusión, los KPIs de negocio
  contarían una empresa que no es un cliente real.
- **Acceso directo al endpoint sin ser superadmin:** ya cubierto por el
  middleware `requireAdmin` existente (403), sin cambios necesarios.
- **Fallo de conexión a BD:** el endpoint responde 500 y loguea el error
  vía `logger.error('admin', ...)`, igual que `/estado`; el frontend
  muestra el mismo bloque de error que ya usa `EstadoSistema.jsx`.
- **Usuario no-superadmin navega a `/dashboard`:** `Inicio.jsx` renderiza
  `Dashboard.jsx` sin cambios de comportamiento respecto a hoy.

## Testing (sin framework de tests en el repo)

- **Backend:** aplicar la migración con `npx knex migrate:latest --knexfile backend/knexfile.js`;
  verificar con un script `node -e` que llama directamente a la lógica de
  agregación contra la base de datos local, comprobando que excluye
  `plan = 'admin'` y que `mrr` es `0` cuando todos los precios son `NULL`.
- **Frontend:** `npm run build` sin errores, `eslint` limpio (mismo
  comando usado en el sub-proyecto anterior).
- **Verificación manual:** login como superadmin → "Inicio" debe mostrar
  `VisionNegocio` con los 6 KPIs; si existe una cuenta de prueba con rol
  `user`, login con ella → "Inicio" debe seguir mostrando el `Dashboard`
  normal sin cambios.

## Decisiones tomadas durante el brainstorming

- MRR requiere un campo de precio que no existía — se añade
  `precio_mensual` (nullable) en vez de usar una constante en código, para
  permitir precios distintos por empresa en el futuro (ej. descuentos).
  Sin UI de edición todavía; David lo rellena a mano en la BD.
- "Bajas o cancelaciones" se redefine como "Empresas inactivas" (total
  actual), no "bajas de esta semana", porque no existe columna de fecha de
  baja y no se quiere fabricar un dato falso.
- Esta pantalla sustituye el "Inicio" del superadmin en vez de ser una
  sección adicional bajo "Administración" — decisión explícita de David
  durante el brainstorming, motivada por que el Dashboard de empresa no
  tiene sentido para una cuenta sin licitaciones propias.
- Se excluye la empresa interna del superadmin (`plan = 'admin'`) de todos
  los cálculos de negocio.
