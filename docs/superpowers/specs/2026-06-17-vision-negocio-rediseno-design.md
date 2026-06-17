# Visión general del negocio — Rediseño visual

## Contexto

`VisionNegocio.jsx` (entregado y desplegado el 2026-06-17, ver
`docs/superpowers/specs/2026-06-17-vision-negocio-design.md`) muestra hoy 6
`KPICard` idénticas en una sola fila, sin nada debajo. David pidió un
aspecto más profesional: tamaños de tarjeta variados con información de
contexto al lado, gráficas reales (sin ningún dato inventado), y recuperar
la cabecera con el nombre/fecha/hora que tenía el Dashboard normal antes de
que el superadmin dejara de verlo.

## Alcance

**Incluye:**
- Nueva cabecera en `VisionNegocio.jsx`: nombre de la empresa del usuario
  (dato real ya existente, `usuario.empresa.nombre`), fecha larga, reloj en
  vivo (hora del navegador, sin llamadas al backend).
- Dos tarjetas "héroe" (más grandes que una KPICard normal) con información
  de contexto al lado del número principal:
  - **MRR** + desglose real de ingresos por plan.
  - **Empresas registradas** + desglose real de actividad (activas /
    inactivas / altas de esta semana).
- Dos gráficas, sin librería nueva (mismo patrón de barras con `div`/CSS que
  ya usa `GraficaResultados` en `client/src/pages/Dashboard.jsx`):
  - **Crecimiento de empresas**: barras verticales, altas reales por mes,
    últimos 6 meses (incluye meses con 0 altas reales — nunca se inventa un
    valor).
  - **Ingresos por plan**: barras horizontales con el mismo dato que el
    desglose de la tarjeta MRR, visualizado como gráfica.
- Cambio del contrato de `GET /api/admin/negocio`: se sustituye el campo
  `planMasContratado` por `desglosePorPlan` (ya contiene esa información de
  forma más completa) y se añade `crecimientoMensual`.
- Se eliminan las tarjetas KPI sueltas de "Empresas activas", "Empresas
  inactivas" y "Plan más contratado" — su información pasa a vivir dentro de
  las tarjetas héroe y las gráficas.
- Mover `fechaLarga()` (hoy una función local de `Dashboard.jsx`) a
  `client/src/utils/format.js` como `formatFechaLarga()`, para reutilizarla
  en la nueva cabecera sin duplicar código. `Dashboard.jsx` pasa a importarla
  de ahí.

**Excluye explícitamente:**
- Cualquier gráfica de evolución temporal de ingresos — no existe ningún
  histórico de `precio_mensual` guardado (solo el valor actual), y crear uno
  ahora (snapshots periódicos) es trabajo adicional fuera de este rediseño;
  David lo descartó explícitamente a favor de la gráfica de barras por plan.
  Si se quiere en el futuro, sería un sub-proyecto propio.
- Cualquier dato de "uso" que no sean las fechas de alta de empresas (uso de
  IA, logins, etc. — eso pertenece al sub-proyecto futuro "Uso de la IA" del
  roadmap).
- Cambios a `Dashboard.jsx` más allá de pasar a importar `formatFechaLarga`
  desde `utils/format.js` en vez de definirla localmente (mismo
  comportamiento, sin cambio visual).
- Cualquier nueva dependencia npm — las gráficas se construyen con
  `div`/CSS, igual que `GraficaResultados`.

## Arquitectura

### Backend — `GET /api/admin/negocio`

Nuevo contrato de respuesta (sustituye al actual, sin preocupación de
compatibilidad porque solo lo consume `VisionNegocio.jsx`, que se actualiza
en el mismo cambio):

```json
{
  "totalEmpresas": 0,
  "totalActivas": 0,
  "totalInactivas": 0,
  "altasEstaSemana": 0,
  "mrr": 0,
  "desglosePorPlan": [
    { "plan": "profesional", "empresasActivas": 3, "mrr": 149.7 }
  ],
  "crecimientoMensual": [
    { "mes": "2026-01", "etiqueta": "ene 26", "altas": 0 },
    { "mes": "2026-06", "etiqueta": "jun 26", "altas": 1 }
  ]
}
```

- `totalEmpresas`, `totalActivas`, `totalInactivas`, `altasEstaSemana`,
  `mrr`: sin cambios respecto a la versión actual (mismas consultas, mismo
  filtro `whereNot('plan', 'admin')`).
- `desglosePorPlan`: `GROUP BY plan` sobre empresas activas y no-admin,
  `count(id)` y `sum(precio_mensual)`, ordenado por `empresasActivas` desc.
  **Importante:** como `plan` es un campo de texto libre (sin tabla ni enum
  de planes), esta lista solo contiene los planes que de verdad tienen al
  menos una empresa activa — no se "rellenan" planes inexistentes con 0,
  porque no hay ninguna lista fija de qué planes existen. Si no hay ninguna
  empresa activa, la lista es `[]`.
- `crecimientoMensual`: siempre exactamente 6 entradas, una por cada uno de
  los últimos 6 meses naturales (mes actual + 5 anteriores), en orden
  cronológico ascendente. Para cada mes, cuenta real de empresas (no-admin)
  con `created_at` dentro de ese mes — `0` si no hubo altas ese mes (un cero
  real, no un hueco).

### Frontend — `VisionNegocio.jsx`

**Cabecera** (nueva, reemplaza el bloque actual de solo botón "Actualizar"):
- `<h2>{usuario?.empresa?.nombre || 'Mi empresa'}</h2>` — mismo patrón que
  `Dashboard.jsx`.
- `<p>{formatFechaLarga()}</p>` debajo, usando la función movida a
  `utils/format.js`.
- Reloj en vivo debajo de la fecha: componente local `Reloj` con
  `useState`/`useEffect`/`setInterval(1000)`, muestra
  `new Date().toLocaleTimeString('es-ES')`, limpia el intervalo al
  desmontar.
- El botón "Actualizar" se mantiene, alineado a la derecha de la cabecera.

**Tarjetas héroe** (componente local `TarjetaHeroe`, nuevo): tarjeta más
ancha/alta que una `KPICard` normal, con el número principal a la izquierda
y una lista de 2-4 líneas de contexto a la derecha (en columna en pantallas
estrechas). Dos instancias:
1. MRR (`negocio.mrr`, formateado con `formatImporte` + "€") + lista de
   `desglosePorPlan` (`{plan}: {empresasActivas} empresas — {mrr} €/mes`).
   Si `desglosePorPlan` está vacío: "Sin empresas de pago activas todavía".
2. Empresas registradas (`negocio.totalEmpresas`) + lista de 3 líneas:
   Activas (`totalActivas`), Inactivas (`totalInactivas`), Altas esta
   semana (`altasEstaSemana`).

**Gráficas** (debajo de las tarjetas héroe, grid de 2 columnas):
1. `GraficaCrecimiento`: barras verticales, una por mes de
   `crecimientoMensual`, altura proporcional a `altas` (igual patrón que
   `GraficaResultados` en `Dashboard.jsx`: `Math.max(altura, 2)` para que un
   mes en 0 siga mostrando una barra mínima visible, etiqueta del mes
   debajo).
2. `GraficaIngresosPorPlan`: barras horizontales, una por entrada de
   `desglosePorPlan`, longitud proporcional a `mrr` sobre el máximo del
   conjunto, nombre del plan a la izquierda y `{mrr} €/mes` a la derecha de
   la barra. Si `desglosePorPlan` está vacío: mismo mensaje que en la
   tarjeta héroe.

Se eliminan del grid actual las `KPICard` de `totalActivas`, `totalInactivas`
y `planMasContratado` (este último campo deja de existir en la respuesta).

### `utils/format.js`

Nueva función exportada:
```js
export function formatFechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}
```
(Es el cuerpo exacto de la función `fechaLarga()` que hoy vive solo en
`Dashboard.jsx`.) `Dashboard.jsx` elimina su copia local y pasa a importar
`formatFechaLarga` desde `utils/format.js`; el resto del archivo no cambia.

## Casos límite

- **Sin ninguna empresa de pago activa** (situación real hoy en
  producción): `desglosePorPlan = []`, `mrr = 0` → ambas tarjetas/gráficas
  de ingresos muestran el mensaje de "sin empresas de pago todavía" en vez
  de una barra vacía confusa.
- **Mes sin altas reales**: aparece igualmente en `crecimientoMensual` con
  `altas: 0` — la barra se ve con altura mínima visible, nunca se omite el
  mes ni se inventa un valor.
- **Reloj**: se basa en la hora del navegador del usuario, no en la del
  servidor — aceptable porque es solo una referencia visual, no un dato de
  negocio.
- **`desglosePorPlan` con un solo plan**: la gráfica de barras horizontales
  sigue funcionando (una sola barra al 100% de su propio máximo).

## Testing (sin framework de tests en el repo)

- Backend: script `node -e` que ejecuta la lógica de `desglosePorPlan` y
  `crecimientoMensual` contra la BD local, igual que se hizo para el
  endpoint original (incluyendo inserción y borrado de datos de prueba
  temporales para validar agregaciones con datos no triviales).
- Frontend: `npm run lint` y `npm run build` en `client/`.
- Verificación manual: confirmar que `Dashboard.jsx` sigue mostrando la
  misma fecha que antes tras el cambio de import (sin regresión visual), y
  que `VisionNegocio.jsx` renderiza cabecera, tarjetas héroe y gráficas sin
  errores con los datos reales actuales de la BD (que hoy están vacíos de
  empresas de pago — los mensajes de estado vacío deben verse, no un error).
