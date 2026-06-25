# Resumen IA con lectura de pliegos + botones en tarjeta — Diseño

## Contexto

Hoy la tarjeta de licitación (`LicitacionCard.jsx`) solo tiene dentro el
botón "Ver licitación oficial". Los botones "Resumen IA" y "Guardar" viven
fuera de la tarjeta, en `Licitaciones.jsx` (componente `TarjetaLicitacion`).

Además, el resumen con IA (`POST /api/resumen-ia` en `backend/server.js`)
genera el resumen **solo a partir de los metadatos** de la licitación
(título, organismo, importe, fecha límite, CPV, enlace) — nunca entra a la
página oficial ni lee los pliegos reales del expediente.

David quiere que el usuario no tenga que leer los pliegos de cada
licitación: con un clic en "Resumen IA" debe obtener un resumen con los
detalles básicos **más** las características técnicas clave de lo que hay
que construir (medidas, volúmenes, materiales...) y la documentación que
hay que presentar — información que solo está en los pliegos reales, no en
los metadatos del feed.

### Validación real contra PLACSP (previa a este diseño)

Antes de diseñar el scraper se ha probado contra 10 licitaciones reales de
PLACSP (organismos distintos: Mercamadrid, ayuntamientos, etc.) para
confirmar cómo se comporta esta plataforma en la práctica. Hallazgos:

1. La ficha de detalle (`l.enlace`, formato
   `https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=...`)
   es HTML estático servido por GET simple (sin JS), con una tabla de
   documentos con columna `tipoDocumento` (valores observados: "Anuncio de
   Licitación", "Pliego", "Rectificación de Pliego", "Adjudicación",
   "Formalización", "Modificación de Contrato"...) y enlaces a
   `https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?...`.

2. **La fila "Pliego" de esa tabla NO es el pliego real.** Es un documento
   envoltorio autogenerado por PLACSP ("Documento de Pliegos") que repite
   los metadatos del contrato (importe, plazos, CPV...), disponible en 3
   formatos paralelos con el mismo contenido (`.html`, `.xml`, `.pdf`).

3. **Los pliegos reales están anidados dentro de la versión HTML de ese
   envoltorio**, como enlaces de verdad subidos por el organismo: "Pliego
   Prescripciones Técnicas", "Pliego Cláusulas Administrativas", y a veces
   anexos sueltos ("ANEXO I...pdf", incluso un `.zip`). Confirmado
   descargando uno real: 1,19 MB, PDF auténtico con contenido real (no el
   resumen de metadatos).

4. Filtrar por la cabecera `Content-Type: application/pdf` de la respuesta
   (no por la extensión del nombre) separa correctamente los PDFs reales
   de los duplicados `.html`/`.xml` y de los `.zip` — confirmado con casos
   reales.

5. **Las rectificaciones complican la selección de fila**: cuando un
   pliego se rectifica, pueden aparecer varias filas tipo "Pliego" /
   "Rectificación de Pliego", pero las versiones superseded quedan con su
   enlace principal roto (`#`, sin documentos reales detrás). La fila
   vigente es la que tiene de verdad sus 3 enlaces funcionando
   (html/xml/pdf) — ese es el criterio fiable para elegir cuál usar, no el
   texto exacto del tipo ni el orden en la tabla.

Esto implica que el scraper necesita **dos saltos** (ficha → envoltorio
"Pliego" vigente → documentos reales filtrados por `Content-Type`), no
uno solo como se asumió inicialmente.

## Alcance

> **Importante — alcance por licitación individual:** el flujo de "Resumen
> IA" es siempre 1 a 1. Aunque LiciTraker pueda tener cientos de
> licitaciones cargadas a la vez, pulsar el botón de una tarjeta concreta
> solo descarga y analiza los pliegos **de esa licitación** (su `enlace` y
> su `expediente`), nunca los de otras. El caché en `resumenes_ia` también
> es por `expediente`, así que el resumen de una licitación nunca se
> reutiliza ni se mezcla con el de otra.

**Incluye:**
- Mover los botones "Resumen IA" y "Guardar" de `Licitaciones.jsx` a
  dentro de `LicitacionCard.jsx`, debajo del botón "Ver licitación
  oficial" (ancho completo arriba, los otros dos en una fila debajo —
  igual disposición que hoy, solo que dentro de la tarjeta).
- Nuevo módulo de backend que, dado el `enlace` de una licitación:
  1. Descarga la ficha PLACSP y localiza, entre las filas de la tabla de
     documentos cuyo `tipoDocumento` coincide con `/pliego/i` (cubre
     "Pliego" y "Rectificación de Pliego"), la fila **vigente**: la que
     tiene sus 3 enlaces de envoltorio (html/xml/pdf) funcionando, no
     rota (`#`). Si hay varias rectificaciones vigentes a la vez (caso
     raro), se usan todas.
  2. Descarga la versión `.html` del envoltorio "Documento de Pliegos" de
     esa fila y extrae todos sus enlaces internos a
     `GetDocumentByIdServlet` (los pliegos reales y anexos).
  3. Para cada enlace, hace un GET y se queda solo con los que respondan
     `Content-Type: application/pdf` (descarta duplicados html/xml y
     cualquier `.zip` u otro formato — ver "Fuera de alcance").
- El endpoint `POST /api/resumen-ia` pasa a:
  1. Buscar primero en la tabla `resumenes_ia` por `expediente`. Si existe,
     devolver el resumen cacheado sin descargar nada ni llamar a Claude.
  2. Si no existe, intentar descargar los pliegos (máx. **6 documentos /
     30MB** combinados; si se supera el límite, se toman los primeros 6 o
     hasta agotar los 30MB, lo que ocurra antes).
  3. Llamar a Claude con los metadatos + los PDFs descargados como bloques
     `document` (si se encontró al menos uno), o solo metadatos si la
     ficha no se pudo descargar / no se encontró ningún PDF de tipo
     "Pliego" (fallback al comportamiento actual).
  4. Guardar el resumen resultante en `resumenes_ia` (keyed por
     `expediente`) y devolverlo.
- Nueva migración knex `resumenes_ia` (expediente único, resumen,
  pliegos_encontrados, timestamps), siguiendo el patrón de
  `004_crear_licitaciones_guardadas.js`.
- Nuevo prompt de Claude con estructura ampliada:
  1. Tipo de obra y descripción
  2. **Características técnicas clave** (medidas, volúmenes, materiales,
     plazos de ejecución) — extraídas de los pliegos, no inventadas
  3. **Documentación a presentar** (lo que exige el pliego administrativo)
  4. Requisitos principales (solvencia, clasificación...)
  5. Observaciones relevantes
  6. Línea final "Recomendación:"

  Si no se pudo leer ningún pliego, el resumen debe indicar explícitamente
  que se basa solo en los metadatos públicos (no inventar características
  técnicas que no están disponibles).

**Excluye explícitamente:**
- **Extracción de texto de Word/ZIP/otros formatos no-PDF** — si un
  documento del envoltorio viene en `.doc`/`.docx`/`.zip` o cualquier
  formato no-PDF (confirmado: los anexos a veces vienen empaquetados en
  un `.zip`), se omite (no se añaden librerías de extracción ni
  descompresión). Si en el futuro se detecta que esto deja fuera
  información relevante con frecuencia, será un sub-proyecto aparte.
- **Plataformas distintas de PLACSP** — los enlaces de licitaciones de
  LiciTraker son siempre de `contrataciondelestado.es` (confirmado), así
  que no se generaliza el scraper para otras plataformas de contratación
  autonómicas/municipales.
- **Generación de PDF en backend** — el botón "Descargar PDF" que ya
  existe en `ResumenIA.jsx` usa `window.print()` del navegador; sigue
  cubriendo la exportación, no se construye un generador de PDF en el
  servidor.
- **Invalidación/regeneración manual del resumen cacheado** — una vez
  generado el resumen para un expediente, se sirve siempre desde caché. No
  se añade un botón "regenerar" en esta iteración.
- **Navegador headless (Puppeteer)** — descartado porque la ficha PLACSP
  es HTML estático accesible por GET simple; no hace falta renderizado JS.

## Componentes y cambios

### Frontend

- `client/src/components/cards/LicitacionCard.jsx`
  - Nuevas props: `onResumenIA(licitacion)`, `onToggleGuardar(licitacion)`,
    `guardada` (boolean).
  - Debajo del bloque actual del botón "Ver licitación oficial", se añade
    la fila de 2 botones que hoy está en `Licitaciones.jsx`
    (`TarjetaLicitacion`), con los mismos estilos e iconos (`Sparkles` /
    `Bookmark`/`BookmarkCheck`) y `e.stopPropagation()` en el click para no
    disparar `onClick` de la tarjeta (abrir el modal de detalle).

- `client/src/pages/Licitaciones.jsx`
  - `TarjetaLicitacion` se simplifica: solo envuelve `LicitacionCard` con
    la animación `motion.div` de entrada, pasándole las nuevas props en
    vez de renderizar los botones por fuera.
  - El `onClick` de "Resumen IA" (`navigate('/dashboard/resumen', {
    state: { licitacion: l } })`) y el de "Guardar" (`onToggleGuardar`) se
    pasan tal cual a `LicitacionCard`, sin cambiar su lógica.

- `client/src/pages/ResumenIA.jsx` — sin cambios funcionales: sigue
  llamando a `POST /api/resumen-ia` con los mismos metadatos en el body;
  el backend decide internamente si usa pliegos o no.

### Backend

- `backend/src/db/migrations/007_crear_resumenes_ia.js` (nueva)

  ```js
  exports.up = knex => knex.schema.createTable('resumenes_ia', t => {
    t.increments('id').primary()
    t.string('expediente', 200).notNullable().unique()
    t.text('resumen').notNullable()
    t.integer('pliegos_encontrados').defaultTo(0)
    t.timestamps(true, true)
  })

  exports.down = knex => knex.schema.dropTable('resumenes_ia')
  ```

- `backend/src/utils/pliegos.js` (nuevo módulo)
  - `obtenerPliegosPDF(enlace)`: implementa el flujo de 2 saltos validado
    (ver "Validación real contra PLACSP"):
    1. GET a la ficha de detalle (mismo `User-Agent`/timeout que ya usa
       `descargarYParsear` en `server.js`) y parseo con `cheerio` (nueva
       dependencia ligera) de la tabla de documentos, para localizar la
       fila vigente de tipo `/pliego/i` (con sus 3 enlaces de envoltorio
       funcionando, no `#`).
    2. GET a la versión `.html` de esa fila (el envoltorio "Documento de
       Pliegos") y extracción de todos sus `<a href>` hacia
       `GetDocumentByIdServlet` (resolviendo URLs relativas contra
       `https://contrataciondelestado.es/`, que es donde se ha encontrado
       el bug más relevante al probar: algunos hrefs vienen sin dominio).
    3. Para cada enlace, GET con cabecera `Connection: close` (evitar
       reuso de socket keep-alive entre peticiones distintas — causó
       timeouts intermitentes durante las pruebas) y filtro por
       `Content-Type: application/pdf`.
    Devuelve un array de `{ filename, base64 }` para los PDFs encontrados,
    respetando el límite de 6 documentos / 30MB combinados. Si cualquier
    paso falla (ficha no descargable, fila no encontrada, sin PDFs),
    devuelve un array vacío — nunca lanza un error que rompa el resumen
    (fallback a metadatos).

- `backend/server.js` — endpoint `POST /api/resumen-ia`
  - Antes de construir el prompt: `SELECT resumen FROM resumenes_ia WHERE
    expediente = ?`. Si hay fila, responder `{ resumen }` directamente.
  - Si no hay fila: llamar a `obtenerPliegosPDF(enlace)`, construir el
    prompt ampliado (ver sección "Alcance"), y si hay pliegos añadir cada
    uno como bloque `{ type: 'document', source: { type: 'base64',
    media_type: 'application/pdf', data } }` en el `content` del mensaje
    a Claude junto al texto del prompt.
  - Tras la respuesta de Claude, `INSERT INTO resumenes_ia (expediente,
    resumen, pliegos_encontrados)` y devolver `{ resumen }`.
  - El body del request necesita ahora también `expediente` (ya lo manda
    `ResumenIA.jsx`... revisar: **actualmente no lo manda**, hay que
    añadirlo al `fetch` en `client/src/pages/ResumenIA.jsx` para poder
    cachear por expediente).

## Manejo de errores

- Si la descarga de la ficha PLACSP falla (timeout, 404, cambio de
  estructura del HTML) → se loguea con `logger.warn('pliegos', ...)` y se
  continúa con el resumen basado solo en metadatos, igual que el
  comportamiento actual. El usuario nunca ve un error por esto.
- Si Claude falla (como hoy) → se devuelve el mismo mensaje de error
  genérico (`'No se ha podido generar el resumen con IA'`), sin guardar
  nada en `resumenes_ia`.
- Si un documento supera el límite de tamaño combinado a mitad de
  descarga, se corta ahí y se usan los pliegos ya descargados (no se
  reintenta ni se informa al usuario del corte — es un límite técnico
  interno, no un error).

## Testing

- Test manual: una licitación con pliegos PDF reales en PLACSP →
  comprobar que el resumen generado menciona medidas/características
  técnicas concretas (no genéricas) y la lista de documentación a
  presentar.
- Test manual: una licitación cuyo `enlace` ya no esté accesible (caducada
  o cambiada) → comprobar que el resumen se genera igual con el fallback
  de metadatos, sin romper la petición.
- Test manual: una licitación con un pliego rectificado (varias filas
  "Pliego"/"Rectificación de Pliego" en la ficha) → comprobar que se usan
  los documentos de la versión vigente, no los de una versión superseded
  con enlace roto.
- Comprobar que pedir el resumen dos veces de la misma licitación la
  segunda vez es instantáneo (servido desde `resumenes_ia`, sin llamar a
  Claude ni a PLACSP).
- Comprobar visualmente que los 3 botones quedan dentro de la tarjeta en
  el listado de `/dashboard/licitaciones`, con el mismo aspecto que tenían
  antes (solo cambia la posición, no el estilo).
