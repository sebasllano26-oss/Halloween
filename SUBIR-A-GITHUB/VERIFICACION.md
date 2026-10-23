# Verificación de la encuesta y entrega para GitHub y Vercel

Fecha: 23 de octubre de 2026. Entorno local: Windows y Node.js 24.16.0.

## Resultado de las pruebas

La ejecución de `npm test` construyó ambos clientes y completó **45 pruebas aprobadas, 0 fallidas**. Los tamaños de construcción y las verificaciones de la carpeta de entrega se registran al final de este documento.

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

Pista instrumental original sintetizada localmente. FFprobe verificó MP3, 32 segundos exactos, mono, 22.050 Hz y 385.098 bytes. La fuente WAV se normalizó a un pico de 0,65.

Las pruebas verifican inicio por acción del invitado, bucle, volumen inicial del 18 %, cambio a 9 %, pausa y tratamiento de un fallo de reproducción sin indicar falsamente que la música está sonando. El archivo se sirve desde el mismo proyecto.

Las pruebas de control usan HTMLMediaElement simulado; no certifican la reproducción audible en un dispositivo real. No hubo capacidad de escucha disponible. La fuente y regeneración están documentadas en `design/audio/README.md`.

## Servidor y persistencia

Continúan pasando las pruebas de validación de respuestas, invitaciones de un solo uso, idempotencia, sesiones, limitación de intentos, privacidad, cierre, mayoría, empate, ausencia de votos y CSV seguro.

Se verifican persistencia y solicitudes concurrentes mediante HTTP local, PostgreSQL local WASM con PGlite, controlador de Vercel y contrato REST simulado de Google Sheets. Las escrituras de Sheets usan RAW y recuperan interrupciones por comprobante. Las 23 respuestas y cuatro campos de identificación ocupan 27 columnas, hasta AA. La creación de pestañas y la ampliación de una pestaña vacía contemplan ese ancho; se conserva la protección frente a encabezados incompatibles.

La hoja proporcionada por el usuario queda sugerida en la configuración privada del administrador. La portada pública no devuelve su identificador y la interfaz no indica que esté conectada antes de verificar el acceso de escritura.

La vista previa devolvió HTTP 200 para `/demo`, `/admin`, las tres fotos, el MP3, CSS y JavaScript de la demo. Los WebP se sirven como `image/webp` y la pista como `audio/mpeg`. El registro de errores del servidor local está vacío.

## Límites

No hay un navegador conectado disponible para revisar la composición, el recorte de las fotos, el desplazamiento o la fluidez a diferentes anchos. JSDOM verifica comportamiento y estructura, pero no calcula la geometría visual.

No se desplegó en Vercel ni se enlazó una hoja real: el usuario hará el despliegue y debe configurar sus credenciales. El enlace de la hoja se recibió el 23 de octubre; la consulta web no permitió acceder a su contenido. Las pruebas de Sheets usan transporte simulado y PGlite no sustituye la conexión al PostgreSQL de producción. Por instrucción del usuario, las pruebas de llenado en línea quedan pendientes hasta que confirme que la aplicación está publicada.

## Entrega

Se creó la carpeta `SUBIR-A-GITHUB`, con todos los archivos del proyecto para subir directamente a la raíz de un repositorio. La guía breve está en `LEEME-PRIMERO.md`; las instrucciones completas, en `README.md`. La carpeta excluye dependencias instaladas, datos locales y credenciales reales.

En esa carpeta se ejecutó una instalación limpia con `npm ci --no-audit --no-fund`: 85 paquetes instalados. Después, `npm test` volvió a construir ambos clientes y aprobó las 45 pruebas, sin fallos. Se retiró `node_modules` de la entrega después de comprobarla, conservándolo en el área local de validación; Vercel lo instalará desde `package-lock.json`.

El cliente del evento pesa 132.901 bytes; la demostración, 151.918 bytes; el CSS compartido, 91.353 bytes, antes de compresión HTTP. La compilación mantiene fuera del cliente real el código privado del servidor.

Vista previa en este computador: http://localhost:4173/demo. La API local devuelve las 23 preguntas actualizadas; `/demo`, `/admin`, las tres fotos, el MP3, CSS y JavaScript respondieron HTTP 200. El registro de errores local quedó vacío. La aplicación usa conexión directa a Google Sheets y no contiene Apps Script.
