# Verificación de la encuesta y entrega para GitHub y Vercel

Fecha: 23 de octubre de 2026. Entorno local: Windows y Node.js 24.16.0.

## Resultado de las pruebas

La ejecución de `npm test` construyó ambos clientes y completó **64 pruebas aprobadas, 0 fallidas**, después de añadir los ensayos y su reinicio. Los tamaños de construcción y las verificaciones de la carpeta de entrega se registran al final de este documento.

La construcción verificó que el cliente real no incluye módulos privados del servidor, secretos ni el transporte ficticio de demostración. Se copian las tres fotos y la pista MP3 a la salida de Vercel.

## Experiencia comprobada

- Presentación y participantes antes de la encuesta en el mismo documento.
- Las tres fotos asignadas en el orden indicado por el usuario: Antonia, Guillermo, Andrea.
- Las 22 preguntas y todas sus opciones comparadas literalmente contra el archivo del usuario, conservado en `test/fixtures/preguntas-halloween.txt`.
- Siete secciones: seis bloques del archivo y el voto al mejor disfraz. Las 23 preguntas aparecen simultáneamente, sin pantalla adicional para empezar a responder.
- Borradores y datos de demostración anteriores aislados sin borrarlos ni trasladar sus selecciones a preguntas nuevas.
- Invitación personal prellenada y oculta, sin clave de administrador para los invitados.
- Nombre guardado durante la escritura y letra ampliable sin perderlo.
- Una selección se modifica sin reconstruir la página ni perder las demás.
- Envío incompleto rechazado antes de solicitar el registro al servidor; error junto a la pregunta y foco en el primer campo pendiente.
- Resumen del voto final actualizado al elegir participante.
- Confirmación y comprobante dentro de la misma página; la presentación y las respuestas permanecen presentes.
- Corte de conexión posterior al registro: datos protegidos, reintento del mismo envío y un único voto confirmado.
- Acceso del anfitrión, cierre, revelación con foto real, edición del evento e invitaciones.
- Demostración sin llamadas al servidor real, con reinicio independiente del evento.
- Ciclo de animación GSAP ejercitado en JSDOM con requestAnimationFrame activo.

## Fotos

Se conservaron copias exactas de los tres adjuntos del usuario y se prepararon WebP sin alterar rostros ni contenido. El encuadre de la interfaz se hace con CSS.

| Persona | Original | WebP | Tamaño WebP |
| --- | --- | --- | --- |
| Antonia | 1066 × 1600 | 900 × 1351 | 132.606 bytes |
| Guillermo | 667 × 1000 | 667 × 1000 | 41.178 bytes |
| Andrea | 898 × 1600 | 898 × 1600 | 80.140 bytes |

Los originales están en `design/photos`; las copias públicas en `public/assets`. El registro de recursos está en `design/ASSETS.md`.

## Música

Pista regenerada como **Tocata de medianoche**: comienzo de la Tocata BWV 565 de Bach (dominio público) en órgano sintetizado, danza macabra original, campanas, trueno, viento, búho y lobo. FFprobe verificó MP3, 60 segundos exactos, estéreo, 44.100 Hz y 961.009 bytes. La fuente WAV se normalizó a un pico de 0,89. FFmpeg verificó un máximo del MP3 de −1,6 dBFS y una media de −17,9 dBFS, sin saturación. Un análisis Goertzel del WAV confirmó las notas La–Sol–La, Sol–Fa–Mi–Re–Do♯–Re de la tocata y la melodía del segundo acto.

Las pruebas verifican el intento de inicio automático, la recuperación tras `NotAllowedError` con clic, toque o tecla, que no haya inicios duplicados mientras carga, el bucle, el volumen fijo del 25 % aunque exista una preferencia antigua de volumen, que no se conserve una pausa antigua de animación, que no aparezcan los botones de música, volumen ni animación, y que un fallo de reproducción no indique falsamente que la música está sonando. El archivo se sirve desde el mismo proyecto con una versión en la URL para renovar la caché.

Las pruebas de control usan HTMLMediaElement simulado; no certifican la reproducción audible en un dispositivo real. No hubo capacidad de escucha disponible. La fuente y regeneración están documentadas en `design/audio/README.md`.

## Servidor y persistencia

El modo Pruebas exige sesión del anfitrión, valida las 23 respuestas, mantiene la idempotencia y registra en una colección y pestaña independientes. Las pruebas verifican que no altera el ganador, el total real ni el CSV. La interfaz completa permite llenar, guardar y reiniciar los ensayos sin perder un borrador real. El reinicio conserva los votos reales; si falla el borrado de Google, se conservan los ensayos para reintentar.

Continúan pasando las pruebas de validación de respuestas, invitaciones de un solo uso, idempotencia, sesiones, limitación de intentos, privacidad, cierre, mayoría, empate, ausencia de votos y CSV seguro.

Se verifican persistencia y solicitudes concurrentes mediante HTTP local, PostgreSQL local WASM con PGlite, controlador de Vercel y contrato REST simulado de Google Sheets. Las escrituras de Sheets usan RAW y recuperan interrupciones por comprobante. Las 23 respuestas y cuatro campos de identificación ocupan 27 columnas, hasta AA. La creación de pestañas y la ampliación de una pestaña vacía contemplan ese ancho; se conserva la protección frente a encabezados incompatibles.

La hoja proporcionada por el usuario queda sugerida en la configuración privada del administrador. La portada pública no devuelve su identificador y la interfaz no indica que esté conectada antes de verificar el acceso de escritura.

La vista previa devolvió HTTP 200 para `/demo`, `/admin`, las tres fotos, el MP3, CSS y JavaScript de la demo. Los WebP se sirven como `image/webp` y la pista como `audio/mpeg`. El registro de errores del servidor local está vacío.

## Límites

No hay un navegador conectado disponible para revisar la composición, el recorte de las fotos, el desplazamiento o la fluidez a diferentes anchos. JSDOM verifica comportamiento y estructura, pero no calcula la geometría visual.

La página ya está desplegada en Vercel y conectada a Supabase en producción. Se verificaron la portada, `/demo`, `/admin`, los recursos y la API. La API pública devuelve `configured: true`, las 23 preguntas y el tema **Objetos de cocina**. La hoja real ya está enlazada; la comprobación de producción se documenta al final. Por instrucción del usuario, las pruebas de llenado real quedan pendientes hasta que indique que se realicen.

## Entrega

Se creó la carpeta `SUBIR-A-GITHUB`, con todos los archivos del proyecto para subir directamente a la raíz de un repositorio. La guía breve está en `LEEME-PRIMERO.md`; las instrucciones completas, en `README.md`. La carpeta excluye dependencias instaladas, datos locales y credenciales reales.

En esa carpeta se ejecutó una instalación limpia con `npm ci --no-audit --no-fund`: 85 paquetes instalados. Después, `npm test` volvió a construir ambos clientes y aprobó las 45 pruebas, sin fallos. Se retiró `node_modules` de la entrega después de comprobarla, conservándolo en el área local de validación; Vercel lo instalará desde `package-lock.json`.

El cliente del evento pesa 132.889 bytes; la demostración, 151.906 bytes; el CSS compartido, 91.353 bytes, antes de compresión HTTP. La compilación mantiene fuera del cliente real el código privado del servidor.

Vista previa en este computador: http://localhost:4173/demo. La API local devuelve las 23 preguntas actualizadas; `/demo`, `/admin`, las tres fotos, el MP3, CSS y JavaScript respondieron HTTP 200. El registro de errores local quedó vacío. La aplicación usa conexión directa a Google Sheets y no contiene Apps Script.

## Corrección de estructura para Vercel

El repositorio de GitHub tenía la aplicación dentro de `SUBIR-A-GITHUB`, mientras el despliegue publicaba la carpeta exterior: `/` y `/api/rpc` devolvían 404, pero `/SUBIR-A-GITHUB/dist/index.html` devolvía 200. Se trasladó el proyecto a la raíz del repositorio para que Vercel detecte `package.json`, `vercel.json` y `api` al desplegar con Root Directory `./`.

Se compararon los 82 archivos subidos con el proyecto verificado: no había diferencias de contenido, únicamente normalización de saltos de línea en Git. Se restauraron `.gitignore`, `.vercelignore` y la plantilla vacía `.env.example`. La prueba nueva reprodujo primero la ausencia de `package.json` en la raíz y pasó después del traslado. Una instalación limpia y `npm test` completaron las 46 pruebas antes de publicar la corrección. Las comprobaciones del sitio en línea y sus servicios deben registrarse por separado de estas pruebas locales.

## Preparación para Supabase

Se agregó una migración para la tabla privada del estado del evento, con RLS activada y revocación de permisos para los roles públicos de la API. El repositorio PostgreSQL también activa RLS al inicializar la tabla.

La prueba nueva falló antes del cambio y pasó después: un rol sin políticas no puede ver, insertar, modificar ni borrar el estado, aunque reciba permisos SQL sobre la tabla. Su propietario conserva el acceso para el servidor. Esa ejecución completó las 47 pruebas locales; la comprobación de Supabase real se describe a continuación.

## Supabase real

Después de autorizar una organización propia mediante MCP, se reactivó el proyecto existente `prueba` del plan gratuito. Se crearon una tabla propia y un usuario PostgreSQL dedicado, sin cambiar la contraseña del usuario `postgres`. El estado inicial incluye Antonia, Guillermo y Andrea, el tema **Objetos de cocina** y un verificador privado de la clave del administrador. No se agregaron votos ni invitaciones de prueba.

Se comprobó una transacción real a través del Transaction pooler de Supabase, con la misma implementación del repositorio de la aplicación. El certificado y el nombre del servidor se verificaron contra la CA oficial incluida. El propietario accede a su tabla; RLS está activa y los roles `anon` y `authenticated` carecen de permiso de lectura. La clave generada coincide con el verificador guardado.

La revisión de Supabase devuelve para esta tabla el aviso informativo [RLS activada sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Es intencional: el navegador no consulta esa tabla y el acceso se realiza mediante el servidor propietario. Los roles de la API pública no reciben políticas ni permisos de lectura.

El primer intento de TLS mostró que Node.js no confía por defecto en la CA de Supabase. Dos pruebas nuevas reprodujeron la falta de configuración y comprobaron después que `pg` conserva la CA y la verificación incluso cuando la URL contiene opciones SSL. La ejecución completa pasó las 49 pruebas.

## Activación en Vercel y comprobación publicada

Se configuraron `DATABASE_URL` y `ADMIN_PASSWORD` como variables sensibles exclusivamente de Production en el proyecto `vele`. No se publicaron sus valores en GitHub ni se compartió la base con despliegues de Preview. La función incluye la CA pública de Supabase.

El despliegue del código `13c5684` quedó `READY` y asociado a `https://vele-rouge.vercel.app/`. La API real confirmó la conexión y el tema actualizado. Se verificaron el inicio de sesión del administrador, la consulta privada del panel y el cierre de esa sesión, sin crear votos. El panel devolvió 0 respuestas y 0 invitaciones.

La comprobación JSDOM del código publicado verificó las 23 preguntas habilitadas, siete secciones, 92 opciones, tres fotos y la presentación antes de la encuesta. La demo completó un llenado y produjo su comprobante con datos exclusivos del navegador, sin solicitar registros al servidor real. No se detectaron errores de ejecución en esa comprobación.

La clave del administrador y la conexión permanecen en archivos privados del área `.local`, excluidos de GitHub y de la entrega para subir. Las pruebas con respuestas reales siguen pendientes de la indicación del usuario.

## Acceso público sin invitaciones

Se sustituyó el acceso por invitaciones por un enlace común. El formulario pide nombre completo y las 23 respuestas; no muestra ni envía códigos. El servidor bloquea nombres completos repetidos después de normalizar tildes, mayúsculas, puntuación y espacios. Este mecanismo identifica el nombre declarado, sin verificar identidad legal.

Las 51 pruebas locales aprobaron. Se verifican el envío sin código, el rechazo del mismo nombre desde dos solicitudes concurrentes, el reintento sin duplicación y el uso de un dispositivo por otra persona. El panel ofrece el enlace común y muestra Supabase como guardado activo. La copia automática a Google Sheets quedó activada después de esta comprobación del acceso público; el CSV también se puede descargar.

## Conexión real de Google Sheets

El 23 de octubre de 2026 se validó el JSON de la cuenta de servicio, se habilitó la API en su proyecto y el propietario compartió la hoja con permiso de Editor. Las variables GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY se guardaron como sensibles, solo para Production de Vercel. El archivo y la clave no se incluyen en GitHub ni en la entrega pública.

El despliegue 08b0358 quedó READY. Desde la API de producción se inició sesión como administrador y se enlazó la misma hoja del usuario. Se crearon Halloween_Respuestas, Halloween_Resultados y Halloween_Evento, conservando Hoja 1. El encabezado de respuestas contiene cuatro columnas de identificación y las 23 preguntas, hasta AA; la columna D se llama Identificador de participación. Se retiró la pestaña de invitaciones de las nuevas conexiones.

La lectura posterior verificó los encabezados completos, el total de resultados, la ausencia de comprobantes duplicados y cero pendientes. El sistema y la hoja tenían cero participaciones en ese momento; no se crearon votos ficticios. La sesión usada para comprobarlo se cerró. Se aplicaron encabezados legibles, ajuste de texto y una nota de procedencia en las tres pestañas propias, y se leyeron de nuevo los valores y el formato.

La suite completa aprobó 51 pruebas. Se mantiene pendiente el llenado real que el usuario pidió realizar después de su indicación.
