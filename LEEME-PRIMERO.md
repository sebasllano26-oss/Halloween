# Activar Halloween en Vercel con Supabase

La aplicación incluye fotos, música, animaciones, las 22 preguntas proporcionadas y el voto final. Presentación y encuesta están en una sola página. El tema de esta edición es **Objetos de cocina**.

**La instalación actual ya está activada con Supabase en Vercel.** Entra al administrador, usa la clave del archivo privado entregado y crea las invitaciones. Los pasos de conexión siguientes sirven para reinstalar o cambiar de proyecto; no necesitas repetirlos.

## 1. Repositorio y despliegue

El proyecto está en [GitHub](https://github.com/sebasllano26-oss/Halloween) y la página se publica en [Vercel](https://vele-rouge.vercel.app/). La estructura que causaba el error 404 ya está corregida: `package.json`, `vercel.json`, `api`, `public`, `scripts` y `src` quedan en la raíz.

Si haces una instalación nueva, sube **el contenido** de `SUBIR-A-GITHUB` a la raíz del repositorio. En Vercel deja **Root Directory: `./`** y **Framework Preset: Other**. El proyecto ya configura la construcción y la salida `dist`.

## 2. Conectar Supabase

En Supabase abre tu proyecto y selecciona **Connect → Transaction pooler**. Copia la cadena PostgreSQL del puerto **6543**, con la contraseña de esa base y `sslmode=require`.

En Vercel, dentro del proyecto `vele`, abre **Settings → Environment Variables** y agrega para **Production**:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | La conexión Transaction pooler de Supabase con SSL. |
| `ADMIN_PASSWORD` | Tu clave inicial del administrador, de 12 a 256 caracteres. |

Vuelve a desplegar después de guardarlas. Estas credenciales son privadas: no se suben a GitHub. `.env.example` es una plantilla vacía.

El servidor crea su tabla y activa la seguridad por filas. La migración equivalente está en `supabase/migrations/202610230001_halloween_state.sql`. No es necesario cambiar el cliente ni instalar Apps Script.

Si Codex configura la base mediante MCP, primero debes autorizar una organización a la que pertenezca tu cuenta. Un enlace que muestre **Organization unavailable** no permite continuar: se necesita una autorización sin el proyecto ajeno preseleccionado.

## 3. Crear las invitaciones

Abre [el administrador](https://vele-rouge.vercel.app/admin), ingresa tu clave y crea las invitaciones. Cada enlace ya lleva su código; el familiar escribe su nombre y responde en la misma página. El administrador cierra las votaciones y revela al ganador.

Para practicar sin registrar votos reales, abre [la demostración](https://vele-rouge.vercel.app/demo).

## 4. Hoja de cálculo opcional

Supabase conserva los votos aunque no conectes Google. Puedes descargar las respuestas en CSV desde el panel y abrirlas en una hoja de cálculo.

Si quieres una copia automática en [la hoja del proyecto](https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit), sigue los pasos de Google Sheets en [README.md](README.md). Esa conexión utiliza la API de Google, sin Apps Script, y necesita una cuenta de servicio con permiso de edición.

## 5. Comprobar el envío real

La autorización de Supabase y las variables de producción deben estar listas antes de probar votos reales. Cuando confirmes que todo está en línea, se harán varias participaciones identificadas como pruebas y se contrastarán con la base. También se comprobará que reintentar un envío no lo duplique.

El texto original de las preguntas está en `test/fixtures/preguntas-halloween.txt`. La evidencia de pruebas y sus límites están en [VERIFICACION.md](VERIFICACION.md).
