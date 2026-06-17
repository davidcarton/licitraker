# Gestión de clientes — Diseño

## Contexto

Tercer sub-proyecto del roadmap del panel superadmin ampliado de LiciTraker
(ver `docs/superpowers/specs/2026-06-17-vision-negocio-design.md` y
`docs/superpowers/specs/2026-06-17-vision-negocio-rediseno-design.md` para
los dos anteriores). David quiere poder gestionar las empresas clientes
desde el panel: ver su plan/precio/estado, cambiarlos, ver sus preferencias
configuradas, y resetear la contraseña de cualquier usuario.

Esta sección cumple además un compromiso pendiente de la sección anterior
("Visión general del negocio"): el campo `empresas.precio_mensual` (añadido
entonces, vacío en producción) por fin se puede rellenar desde un panel en
vez de a mano en la base de datos, lo que hará que el MRR deje de mostrar
0€ cuando David fije precios reales.

## Alcance

**Incluye:**
- Sustituir, solo para el rol `superadmin`, el enlace "Configuración" del
  sidebar por "Gestión de clientes" (misma posición en la lista).
- Página nueva con: lista de empresas (excluyendo la empresa interna del
  superadmin) y, al hacer click en una, un modal de detalle/edición con:
  cambiar plan (texto libre) y precio mensual, activar/desactivar la
  cuenta, ver sus preferencias configuradas (solo lectura), y resetear la
  contraseña de cualquiera de sus usuarios.
- Ampliar la columna `empresas.plan` de `VARCHAR(20)` a `VARCHAR(50)` para
  admitir descripciones como "mantenimiento mensual" sin que el guardado
  falle por longitud.

**Excluye explícitamente:**
- **Impersonation** ("acceder como cualquier empresa para dar soporte") —
  se trata como un sub-proyecto separado posterior, con su propio diseño de
  seguridad (auditoría, indicador visual, alcance de lo que se puede hacer
  mientras se suplanta a un cliente). No se diseña ni se implementa aquí.
- **Lista cerrada/enum de planes** — el campo `plan` sigue siendo texto
  libre porque David todavía no ha decidido si el modelo de negocio será
  por planes con nombre o por una cuota de mantenimiento negociada por
  cliente. No bloquea nada: si más adelante se fija un modelo concreto, se
  puede añadir una lista cerrada sin romper los valores ya guardados.
- **Reseteo de contraseña vía email** (flujo de "olvidé mi contraseña" con
  verificación) — no existe infraestructura de envío de correo en el
  proyecto. Por ahora el superadmin escribe directamente la contraseña
  nueva del usuario. El flujo por email queda pendiente para cuando el
  proyecto sea aceptado por el cliente final.
- **Paginación de la lista de empresas** — la lista es pequeña hoy; se
  añadiría más adelante si crece mucho.
- Cualquier cambio a `Dashboard.jsx`, `Configuración` (para roles
  distintos de superadmin), o a las páginas de Estado del sistema/Logs/
  Visión de negocio ya entregadas.

## Arquitectura

### Backend

**Migración** `006_ampliar_plan_empresas.js`:
```js
exports.up = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 50).alter()
})

exports.down = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 20).alter()
})
```
Actualizar también `backend/src/db/schema.sql` (`plan VARCHAR(50)`).

**Nuevo archivo** `backend/src/routes/clientes.js`, montado en
`server.js` como `app.use('/api/admin/clientes', clientesRoutes)`, con el
mismo `router.use(auth, requireAdmin)` que ya usan `admin.js` y demás rutas
de administración. Endpoints:

- `GET /api/admin/clientes` — lista de empresas con
  `whereNot('plan', 'admin')` (mismo criterio de exclusión que el endpoint
  de Visión de negocio), columnas `id, nombre, plan, precio_mensual,
  activa, created_at`, ordenadas por `created_at` descendente.
- `GET /api/admin/clientes/:id` — detalle de una empresa: sus datos +
  `usuarios` (`id, nombre, email, rol, activo`, sin `password_hash`) +
  `preferencias` (o `null` si la empresa no tiene fila en esa tabla). 404
  si el `id` no existe o pertenece a la empresa interna (`plan = 'admin'`).
- `PATCH /api/admin/clientes/:id` — body `{ plan?, precio_mensual?, activa? }`,
  actualiza solo los campos presentes. Validaciones: `plan` (si se envía)
  no vacío tras `trim()` y ≤50 caracteres; `precio_mensual` (si se envía)
  numérico ≥0 o `null`; `activa` (si se envía) booleano. 400 con mensaje
  claro si alguna validación falla, mismo estilo que `auth.js`.
- `PATCH /api/admin/clientes/:id/usuarios/:usuarioId/password` — body
  `{ password }`, valida `password.length >= 8` (mismo mensaje que
  `auth.js`: "La contraseña debe tener al menos 8 caracteres"), hashea con
  `bcrypt.hash(password, 10)` y actualiza `usuarios.password_hash`. 404 si
  el usuario no pertenece a esa empresa.

Todas las rutas envueltas en try/catch con `logger.error('clientes', ...)`
y 500 en caso de fallo, igual que el resto de rutas admin.

### Frontend

**`client/src/components/dashboard/Sidebar.jsx`**: para `usuario?.rol ===
'superadmin'`, el array de navegación sustituye la entrada de
Configuración por una de "Gestión de clientes" → `/dashboard/admin/clientes`,
en la misma posición. Para el resto de roles, sin cambios.

**`client/src/App.jsx`**: nueva ruta
`/dashboard/admin/clientes` → `GestionClientes` (protegida igual que las
demás, `RutaProtegida`).

**`client/src/pages/GestionClientes.jsx`** (nuevo): guard de rol superadmin
igual que `EstadoSistema.jsx`. Carga `GET /api/admin/clientes` al montar.
Tabla con las 5 columnas acordadas (Nombre, Plan, Precio, Estado con badge
de color activa/inactiva, Fecha de alta), fila clicable que abre un modal
(componente local `ModalCliente`) con:
- Formulario: input de texto para `plan` (maxLength 50), input numérico
  para `precio_mensual`, toggle Activa/Inactiva. Botón "Guardar" → `PATCH
  /api/admin/clientes/:id`, recarga la lista al guardar.
- Bloque "Preferencias configuradas" de solo lectura, o el mensaje "Sin
  preferencias configuradas todavía" si `preferencias` es `null`.
- Lista de usuarios de la empresa, cada uno con un botón "Resetear
  contraseña" que despliega un input + botón "Guardar" → `PATCH
  /api/admin/clientes/:id/usuarios/:usuarioId/password`. Tras guardar,
  muestra una confirmación breve ("Contraseña actualizada") y cierra el
  campo.

## Casos límite

- Empresa sin fila en `preferencias`: mensaje explícito de "sin
  preferencias", nunca un objeto vacío disfrazado de datos reales.
- `precio_mensual` vacío en el formulario al guardar: se envía `null`, no
  `0` — un precio en blanco no es lo mismo que un precio de 0€.
- La empresa interna del superadmin (`plan = 'admin'`) nunca aparece en la
  lista ni es accesible por `GET /api/admin/clientes/:id` (404).
- Validaciones de backend rechazan `plan` vacío/demasiado largo,
  `precio_mensual` negativo, y contraseñas de menos de 8 caracteres, con
  mensajes de error claros reutilizados del estilo ya usado en `auth.js`.
- Cambiar el plan o el precio de una empresa no afecta a sus usuarios ni a
  sus licitaciones guardadas — solo toca la fila de `empresas`.

## Testing (sin framework de tests en el repo)

- Backend: `node -e` para verificar la migración (columna ampliada a 50
  caracteres) y la lógica de cada endpoint contra la BD local, incluyendo
  inserción/borrado de una empresa y usuario de prueba para probar
  edición de plan/precio/activa y reseteo de contraseña con verificación
  `bcrypt.compare` posterior.
- Frontend: `npm run lint` y `npm run build` en `client/`.
- Verificación manual: login real como superadmin, confirmar que el
  sidebar muestra "Gestión de clientes" en vez de "Configuración", que la
  lista carga, que el modal de una empresa real (o de prueba) permite
  editar y guardar, y que el reseteo de contraseña de un usuario de prueba
  funciona (login posterior con la nueva contraseña).
