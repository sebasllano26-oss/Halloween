# Subir Halloween a GitHub y Vercel

Esta carpeta contiene la aplicación completa: fotos de Antonia, Guillermo y Andrea, música, animaciones, las 22 preguntas proporcionadas y el voto final al mejor disfraz. Todo el formulario aparece en una sola página. Usa Google Sheets API directa, sin Apps Script.

## 1. Sube el proyecto a GitHub

Crea un repositorio y sube **todo el contenido de `SUBIR-A-GITHUB`**. Al abrir el repositorio deben verse directamente `package.json`, `vercel.json` y las carpetas `api`, `public`, `scripts` y `src`.

La carpeta de entrega excluye `node_modules`, datos de prueba locales, claves privadas y archivos `.env` reales. `.env.example` es únicamente una plantilla vacía. Puedes usar un repositorio privado.

## 2. Importa el repositorio en Vercel

Selecciona el repositorio, deja **Root Directory** en `./` y usa **Framework Preset: Other**. La configuración incluida establece `npm ci --no-audit --no-fund`, `npm run build` y salida `dist`; `package.json` solicita Node.js 24.

Si en GitHub aparece la carpeta `SUBIR-A-GITHUB` y los archivos están dentro, selecciona esa carpeta como Root Directory en Vercel.

## 3. Configura cuatro variables del servidor

En Vercel, abre **Settings → Environment Variables**:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Conexión de PostgreSQL con SSL. Puedes conectar Neon desde Vercel. |
| `ADMIN_PASSWORD` | Clave inicial del administrador, de al menos 12 caracteres. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` del JSON de la cuenta de servicio de Google. |
| `GOOGLE_PRIVATE_KEY` | `private_key` completo del mismo JSON. |

La guía con los pasos para obtener estas credenciales está en [README.md](README.md). Configura las variables para Production y vuelve a desplegar después de agregarlas. El enlace de una hoja por sí solo no concede permiso para escribir en ella.

## 4. Activa tu hoja desde el panel

Abre [la hoja del proyecto](https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit) y compártela como **Editor** con el correo de la cuenta de servicio. No necesita ser pública.

Entra a `https://TU-DOMINIO.vercel.app/admin` con tu clave. En **Configuración**, el enlace ya está prellenado: pulsa **Enlazar mi hoja**. La aplicación verificará el acceso y creará estas pestañas:

- `Halloween_Respuestas`: comprobante, fecha, nombre, invitación y 23 respuestas.
- `Halloween_Invitaciones`: códigos y estado de uso.
- `Halloween_Resultados`: conteo por participante.
- `Halloween_Evento`: detalles y estado de la votación.

Después crea invitaciones en el panel. Cada enlace incluye el código; el familiar escribe su nombre y responde. Para revisar el diseño sin registrar votos reales puedes abrir `/demo`.

## 5. Comprobación en línea pendiente

Cuando confirmes en esta conversación que ya está publicado y compartas la URL de Vercel, se harán varias pruebas de llenado identificadas como pruebas. Se contrastarán los comprobantes y las respuestas completas con las filas de esta hoja, y se verificará que un reintento no duplique el envío. Estas comprobaciones reales todavía no se han ejecutado.

El texto original de las preguntas está en `test/fixtures/preguntas-halloween.txt`. La evidencia local y sus límites están en [VERIFICACION.md](VERIFICACION.md).
