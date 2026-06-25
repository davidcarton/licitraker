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

6. **Hay (al menos) dos endpoints distintos que sirven documentos en
   PLACSP** — `GetDocumentByIdServlet` (documentos nativos de PLACSP) y
   `/wps/wcm/connect/.../docAccCmpnt?...cmpntname=GetDocumentsById...`
   (usado cuando los pliegos vienen de una plataforma autonómica federada,
   confirmado con un caso real de Castilla-La Mancha). Filtrar los enlaces
   candidatos del envoltorio por patrón de URL es un error — se probaron
   los 23 casos con fila "Pliego" vigente de la muestra de validación y 3
   de ellos (13%) usaban este segundo patrón; un filtro por URL los
   habría descartado por completo, tratándolos como "sin pliego" cuando
   sí lo tenían. La solución es **probar todos los `<a href>` del
   envoltorio sin filtrar por URL**, y decidir solo por el `Content-Type`
   real de la respuesta.

7. **Hay licitaciones sin ninguna fila "Pliego" en absoluto** (confirmado
   en una muestra de 25 licitaciones reales: 2 de 25, 8%) — anuncios
   previos publicados antes de que exista pliego, o adjudicaciones
   antiguas donde la fila ya no aparece en la ficha. El fallback a
   metadatos (ya contemplado) es necesario en la práctica, no solo
   teórico.

8. **Tamaños reales observados**: hasta 22 MB un solo PDF (memoria/planos
   técnicos), 23,56 MB combinados en una licitación de la muestra. Un caso
   multi-lote real tenía 10 PDFs válidos (anexos técnicos + proyectos por
   lote) — un límite de "máx. N documentos" puede dejar fuera anexos
   técnicos relevantes en licitaciones complejas.

9. **Límite real de la API de Claude para documentos PDF: 32 MB por
   petición y 100 páginas por PDF** (en modelos de contexto de 200K, como
   `claude-haiku-4-5`, el que ya usa este endpoint). Como el contenido se
   envía en base64 (~33% más pesado que el PDF en bruto), un límite de
   "30 MB de PDFs en bruto" puede traducirse en ~40 MB en la petición real
   y disparar un error 400 por tamaño — hay que dejar margen.

10. **Prueba a fondo sobre 34 licitaciones reales tipo obra y en plazo**
    (replicando exactamente el filtro `esObra()`/`estaEnPlazo()` de
    `server.js`, para no mezclar servicios/suministros que el usuario
    nunca vería con el botón): 33 de 34 (97%) tienen pliego vigente con
    PDFs reales descargables; la única sin pliego es un caso normal (solo
    "Anuncio de Licitación" en la ficha, pliegos aún no publicados). 0
    expedientes vacíos o duplicados en la muestra. De 87 PDFs descargados,
    **9 (10%) superaban las 100 páginas** (máximo encontrado: 375
    páginas) — el límite de 100 páginas de Claude Haiku **no es un caso
    raro, es frecuente** en pliegos de obra reales (memorias, mediciones,
    proyectos completos). Además, al combinar varios documentos hasta el
    tope de tamaño, **cortar un PDF a mitad de descarga lo deja con
    estructura inválida** (confirmado: 9 de los 87 PDFs quedaban
    corruptos tras el corte) — enviar ese PDF truncado a Claude lo haría
    rechazarlo como archivo inválido, y el reintento "quitar el PDF más
    grande" no siempre lo soluciona porque el documento truncado no
    siempre es el más grande del lote.

11. **El límite de 100 páginas por PDF depende del *context window* del
    modelo, no es un tope fijo de la API**: la documentación oficial dice
    "32 MB por petición, 600 páginas por PDF (100 páginas solo en modelos
    de contexto 200K)". `claude-haiku-4-5` tiene 200K de contexto → de ahí
    el límite de 100 páginas que se está viendo. `claude-sonnet-4-6` tiene
    1M de contexto → el límite sube a **600 páginas por PDF**. Con ese
    cambio de modelo, ninguno de los 87 PDFs reales de la muestra (máximo
    375 páginas) se habría rechazado por límite de páginas. El límite de
    32 MB por petición (~24 MB en bruto considerando la inflación de
    base64) no cambia con el modelo — el tope de diseño de 20 MB ya
    descrito sigue siendo válido y seguro.

Esto implica que el scraper necesita **dos saltos** (ficha → envoltorio
"Pliego" vigente → documentos reales filtrados por `Content-Type`, sin
filtrar por patrón de URL), no uno solo como se asumió inicialmente. Y que
el modelo de Claude usado en este endpoint debe cambiar de
`claude-haiku-4-5` a `claude-sonnet-4-6` para evitar que el límite de
páginas sea un problema frecuente en la práctica.

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
     esa fila y extrae **todos** sus enlaces internos `<a href>` — sin
     filtrar por patrón de URL (hay al menos 2 endpoints distintos que
     sirven documentos reales en PLACSP, ver hallazgo 6).
  3. Para cada enlace, hace un GET y se queda solo con los que respondan
     `Content-Type: application/pdf` (descarta duplicados html/xml y
     cualquier `.zip` u otro formato — ver "Fuera de alcance").
- El endpoint `POST /api/resumen-ia` pasa a:
  1. Buscar primero en la tabla `resumenes_ia` por `expediente`. Si existe,
     devolver el resumen cacheado sin descargar nada ni llamar a Claude.
  2. Si no existe, intentar descargar los pliegos: se procesan todos los
     PDFs encontrados en el envoltorio, en el orden en que aparecen, hasta
     agotar un tope de **20MB combinados en bruto** (deja margen frente al
     límite real de la API de 32MB por petición una vez los PDFs se
     codifican en base64 — ver hallazgo 9). Sin límite de cantidad de
     documentos. **Si un documento no entra completo en el cupo restante,
     se descarta entero (no se trunca a mitad)** — un PDF cortado queda
     con estructura inválida y Claude lo rechazaría como archivo corrupto
     (ver hallazgo 10).
  3. Llamar a **`claude-sonnet-4-6`** (cambio respecto al modelo actual
     `claude-haiku-4-5` — ver hallazgo 11: el límite de páginas por PDF
     depende del context window del modelo, 100 páginas en modelos de
     200K como Haiku, 600 páginas en modelos de 1M como Sonnet 4.6; con
     375 páginas como máximo real encontrado, Sonnet 4.6 cubre todos los
     casos de la muestra de validación) con los metadatos + los PDFs
     descargados como bloques `document` (si se encontró al menos uno), o
     solo metadatos si la ficha no se pudo descargar / no se encontró
     ningún PDF (fallback al comportamiento actual). Si Claude rechaza la
     petición por tamaño o páginas de algún documento, se reintenta una
     vez quitando el PDF más grande; si vuelve a fallar, se activa el
     resumen por bloques (ver más abajo) y, si ese también falla,
     fallback a metadatos.
  4. **Resumen por bloques (map-reduce) como último recurso** — solo se
     activa si, tras los pasos anteriores, sigue habiendo un documento
     que Claude rechaza por páginas (caso extremo, no encontrado en la
     muestra real de validación pero posible): se divide ese PDF en
     bloques de páginas dentro del límite del modelo, se pide a Claude un
     resumen de cada bloque por separado, y se hace una llamada final a
     Claude pidiéndole que sintetice esos resúmenes parciales en el
     resumen único de la licitación. Garantiza que nunca se pierda
     información aunque el documento sea muy grande, a costa de varias
     llamadas a Claude en vez de una.
  5. Guardar el resumen resultante en `resumenes_ia` (keyed por
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
       Pliegos") y extracción de **todos** sus `<a href>` (resolviendo
       URLs relativas contra `https://contrataciondelestado.es/`, que es
       donde se ha encontrado el bug más relevante al probar: algunos
       hrefs vienen sin dominio) — sin filtrar por patrón de servlet, ya
       que se han confirmado al menos 2 endpoints distintos que sirven
       documentos reales (`GetDocumentByIdServlet` y `docAccCmpnt`).
    3. Para cada enlace, GET con cabecera `Connection: close` (evitar
       reuso de socket keep-alive entre peticiones distintas — causó
       timeouts intermitentes durante las pruebas) y filtro por
       `Content-Type: application/pdf`.
    Devuelve un array de `{ filename, base64, bytes }` para los PDFs
    encontrados, en el orden en que aparecen en el envoltorio, **parando
    al alcanzar 20MB combinados en bruto sin incluir el documento que
    haría superar el tope** (se descarta entero ese documento, nunca se
    trunca a mitad — un PDF cortado queda con estructura inválida, ver
    hallazgo 10). Sin límite de cantidad de documentos. Si cualquier paso
    falla (ficha no descargable, fila no encontrada, sin PDFs), devuelve
    un array vacío — nunca lanza un error que rompa el resumen (fallback
    a metadatos).

- `backend/server.js` — endpoint `POST /api/resumen-ia`
  - Antes de construir el prompt: `SELECT resumen FROM resumenes_ia WHERE
    expediente = ?`. Si hay fila, responder `{ resumen }` directamente.
  - Si no hay fila: llamar a `obtenerPliegosPDF(enlace)`, construir el
    prompt ampliado (ver sección "Alcance"), y si hay pliegos añadir cada
    uno como bloque `{ type: 'document', source: { type: 'base64',
    media_type: 'application/pdf', data } }` en el `content` del mensaje
    a Claude junto al texto del prompt.
  - **Modelo: `claude-sonnet-4-6`** (cambio respecto a `claude-haiku-4-5`,
    que es el modelo actual de este endpoint) — su context window de 1M
    eleva el límite de páginas por PDF de 100 a 600 (ver hallazgo 11),
    cubriendo los casos reales encontrados en la validación (máximo 375
    páginas).
  - Si la llamada a Claude falla por tamaño/páginas de un documento
    (`invalid_request_error`), se reintenta una vez quitando de la lista
    el PDF con más bytes y volviendo a llamar a Claude. Si vuelve a
    fallar por páginas de un documento concreto, se activa el resumen por
    bloques (map-reduce, ver sección "Alcance") solo para ese documento;
    si también falla, se cae al prompt basado solo en metadatos (sin
    pliegos).
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
- Si Claude falla por un motivo distinto a tamaño/páginas (como hoy) → se
  devuelve el mismo mensaje de error genérico (`'No se ha podido generar
  el resumen con IA'`), sin guardar nada en `resumenes_ia`.
- Si Claude rechaza la petición por tamaño/páginas → se reintenta una vez
  sin el PDF más grande (ver "Componentes y cambios"); si vuelve a fallar
  por páginas de un documento concreto, se activa el resumen por bloques
  (map-reduce) solo para ese documento; si también falla, se genera el
  resumen solo con metadatos en vez de devolver un error al usuario.
- Si un documento no entra completo en el tope de tamaño combinado (20MB
  en bruto), se descarta entero y se sigue con el resto de documentos que
  sí entran — nunca se trunca un PDF a mitad de descarga (un PDF cortado
  queda con estructura inválida, ver hallazgo 10). No se informa al
  usuario de los documentos descartados por tamaño — es un límite técnico
  interno, no un error.

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
- Test manual: una licitación cuyo envoltorio de pliegos use el endpoint
  `docAccCmpnt` en vez de `GetDocumentByIdServlet` (caso confirmado con
  organismos de Castilla-La Mancha) → comprobar que los PDFs se detectan
  igual, sin depender del patrón de URL.
- Test manual: una licitación con un PDF de planos/memoria muy grande
  (cerca del límite de tamaño o de páginas) → comprobar que, si Claude lo
  rechaza, el resumen se genera igual tras el reintento sin ese documento,
  en vez de fallar.
- Test manual (caso extremo, no encontrado en la muestra real pero a
  cubrir): un PDF que supere las 600 páginas incluso con `claude-sonnet-4-6`
  → comprobar que se activa el resumen por bloques (map-reduce) y el
  resumen final menciona contenido de todo el documento, no solo del
  primer bloque.
- Comprobar que pedir el resumen dos veces de la misma licitación la
  segunda vez es instantáneo (servido desde `resumenes_ia`, sin llamar a
  Claude ni a PLACSP).
- Comprobar visualmente que los 3 botones quedan dentro de la tarjeta en
  el listado de `/dashboard/licitaciones`, con el mismo aspecto que tenían
  antes (solo cambia la posición, no el estilo).
