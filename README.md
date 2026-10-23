> **Acceso actualizado:** comparte un solo enlace, https://vele-rouge.vercel.app/ . No se necesitan invitaciones ni códigos. El control de duplicados usa el nombre completo declarado, normalizando tildes, mayúsculas y espacios. Supabase guarda las respuestas; Google Sheets sigue siendo una copia opcional pendiente de credenciales. Consulta LEEME-PRIMERO.md para el uso actual.

# Halloween Vélez López

Aplicación web independiente para Vercel, con la experiencia **El baile de las sombras**, Supabase como base principal y una copia opcional en Google Sheets. No utiliza Apps Script. El tema de esta edición es **Objetos de cocina**.

En este repositorio, la aplicación y `vercel.json` están en la raíz. En Vercel usa **Root Directory: `./`**, **Framework Preset: Other**, **Build Command: `npm run build`** y **Output Directory: `dist`**.

Los invitados ven primero la presentación y las fotos de Antonia, Guillermo y Andrea. En esa misma página, debajo, escriben su nombre y responden las 22 preguntas del archivo proporcionado por el usuario y el voto al mejor disfraz: **23 preguntas en total**, con opciones grandes. Al final hay un único botón para enviar. El administrador entra con su clave, gestiona invitaciones, enlaza la hoja y revela al ganador después de cerrar la urna.

Para subir el proyecto, empieza por [LEEME-PRIMERO.md](LEEME-PRIMERO.md). La carpeta de entrega `SUBIR-A-GITHUB` contiene el proyecto completo y excluye datos locales y credenciales.

## Probar el diseño y el formulario en tu computador

Con Node.js 24 instalado, haz doble clic en `INICIAR.cmd`. También puedes ejecutar:

```powershell
npm ci
npm start
```

Para probar inmediatamente, abre [http://localhost:4173/demo](http://localhost:4173/demo). Verás los participantes y, al bajar, la encuesta completa. **Ir a la encuesta** te lleva al formulario en la misma página. Escribe tu nombre, toca las respuestas y pulsa **Enviar mis respuestas y mi voto** al terminar. No necesitas configurar servicios ni una clave para la prueba. **Ver panel de prueba** permite conocer la administración y **Reiniciar prueba** deja la demostración lista otra vez.

La demostración usa exclusivamente los datos de este navegador, tiene una invitación ficticia y no hace solicitudes al servidor de votos reales. Sigue disponible en `/demo` después de desplegar en Vercel. Reiniciarla no borra votos del evento real.

Para preparar un evento local real, abre [http://localhost:4173/admin](http://localhost:4173/admin) y crea tu clave local de al menos 12 caracteres. En **Invitaciones**, crea una entrada y copia su enlace. La invitación queda incluida automáticamente, de modo que la persona ve la presentación y solo escribe su nombre para participar.

Esta versión guarda sus datos en `.local/state.json`, fuera del código y del paquete de despliegue. Es para pruebas en tu computador. Los enlaces para la familia se compartirán desde el dominio de Vercel después del despliegue.

## Subir a Vercel

Sube **todo el contenido de `SUBIR-A-GITHUB` a la raíz de tu repositorio** e impórtalo en Vercel. `package.json`, `vercel.json`, `api`, `public`, `scripts` y `src` deben quedar en esa raíz. En Vercel deja **Root Directory** en `./`. Si GitHub guarda la carpeta `SUBIR-A-GITHUB` como un nivel adicional, selecciona esa carpeta como Root Directory. No basta con subir únicamente `dist`: las funciones del servidor están en `api`.

El archivo `vercel.json` ya contiene la configuración:

| Opción | Valor |
| --- | --- |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | `npm ci --no-audit --no-fund` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Entrada del administrador | `/admin` o el candado de la página |
| Demostración aislada | `/demo` |

### 1. Conecta Supabase

En tu proyecto de Supabase, abre **Connect → Transaction pooler**, copia la conexión PostgreSQL del puerto **6543** y usa `sslmode=require`. Guárdala en `DATABASE_URL` de Vercel; no uses la URL pública de Supabase ni una clave `anon` en ese campo. [Guía oficial de conexiones de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

La aplicación crea automáticamente `public.halloween_app_state` y activa la seguridad por filas. El servidor se conecta como propietario de esa tabla; los visitantes no acceden a ella mediante la API pública de Supabase. También se incluye la migración en `supabase/migrations/202610230001_halloween_state.sql` para prepararla mediante MCP o el editor SQL. [Seguridad por filas en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Para Supabase, el servidor incluye su certificado público raíz y verifica el certificado y el nombre del servidor al conectarse. Vercel incluye ese archivo en la función; no debes descargarlo ni agregar otra variable. Su procedencia está documentada en `src/server/certs/README.md`.

Supabase guarda el evento, las invitaciones, las respuestas y la verificación de la clave. Permite controlar votos simultáneos entre distintas instancias de Vercel. **Google Sheets es opcional**: no hace falta configurarlo para votar, administrar o revelar al ganador. Si se conecta, recibe una copia de las respuestas y los fallos de sincronización no eliminan el voto.

Usa bases o ramas separadas para pruebas y producción: así los votos de una vista previa no se mezclan con los del evento.

### 2. Google Sheets, solo si quieres la copia

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto y habilita **Google Sheets API**.
2. En **IAM y administración → Cuentas de servicio**, crea una cuenta de servicio. Para esta integración no necesitas concederle el rol de Editor de todo el proyecto ni delegación de dominio: el acceso al archivo se concede compartiendo esa hoja.
3. Abre esa cuenta, entra en **Claves → Agregar clave → Crear clave nueva → JSON** y conserva el archivo en un lugar privado.
4. Del archivo JSON, usarás únicamente `client_email` y `private_key` para las variables de Vercel. No incluyas ese archivo en el repositorio.

Consulta las instrucciones oficiales de [cuentas de servicio para documentos compartidos](https://developers.google.com/workspace/guides/create-credentials#service-account) y [creación de claves JSON](https://docs.cloud.google.com/iam/docs/keys-create-delete).

### 3. Agrega las variables en Vercel

En **Settings → Environment Variables**:

| Variable | Qué debes poner | Necesaria |
| --- | --- | --- |
| `DATABASE_URL` | Conexión Transaction pooler de Supabase, puerto 6543 y SSL. | Sí |
| `ADMIN_PASSWORD` | Tu clave inicial del administrador, de 12 a 256 caracteres. | Sí, al inicializar |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | El valor `client_email` del JSON de Google. | Solo para copiar a Sheets |
| `GOOGLE_PRIVATE_KEY` | El valor completo de `private_key`, sin comillas exteriores. Admite saltos de línea reales o los caracteres `\n` del JSON. | Solo para copiar a Sheets |

Son variables del servidor. No les agregues prefijos `PUBLIC`, `NEXT_PUBLIC` ni `VITE`, y no las pongas en archivos que subas al repositorio. Después de guardarlas, realiza un nuevo despliegue para que estén disponibles.

`ADMIN_PASSWORD` inicializa la clave la primera vez que se prepara la base de datos. Después, el verificador con sal queda guardado en PostgreSQL; no hay una clave predeterminada publicada en el código.

### 4. Enlaza tu hoja desde el panel (opcional)

1. Abre [la hoja enviada para este proyecto](https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit).
2. Compártela como **Editor** con el correo `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
3. Abre la aplicación desplegada y entra al panel con tu clave.
4. En **Configuración**, el enlace enviado ya aparece prellenado. Confírmalo y pulsa **Enlazar mi hoja**. Puedes cambiarlo si prefieres otra hoja. Tener el enlace preparado no significa que el acceso de escritura esté configurado.

Se crean cuatro pestañas propias, sin tocar las demás:

- `Halloween_Respuestas`: una fila por participación, con cuatro columnas de identificación y las 23 respuestas, de A a AA.
- `Halloween_Invitaciones`: códigos, invitados y estado de uso.
- `Halloween_Resultados`: conteo por participante, porcentajes y total.
- `Halloween_Evento`: nombre, edición, tema y estado de las votaciones.

La interfaz muestra si hay respuestas pendientes. **Sincronizar pendientes** vuelve a copiar las filas que hagan falta. También se intenta sincronizar después de cada voto, de los cambios del evento y al actualizar el panel. Los comprobantes permiten recuperar un corte de conexión sin agregar dos veces la misma fila.

Las pestañas son una salida del sistema. Para cambiar el evento o administrar invitaciones, usa el panel: los cambios manuales de esas pestañas no modifican la base de datos ni el conteo oficial.

## Usarlo el día del evento

1. Comparte https://vele-rouge.vercel.app/ con toda la familia.
2. Cada persona escribe su nombre completo y responde las 23 preguntas en la misma página.
3. El servidor bloquea otro voto con el mismo nombre completo, incluso al cambiar tildes, mayúsculas o espacios. No se verifica identidad mediante documentos o cuentas.
4. En un dispositivo compartido, **Responder para otra persona** prepara un formulario vacío después del comprobante.
5. El administrador revisa respuestas y descarga CSV. Al terminar, cierra las votaciones y revela al ganador.

Solo decide el ganador la pregunta **El mejor disfraz**. Si hay empate, se muestran todos los empatados.

## Diseño y accesibilidad

La portada tiene una mansión ilustrada, luna ámbar, niebla, luces y un fantasma flotante. Las fotos reales proporcionadas por el usuario aparecen en la presentación, las opciones del voto y el resultado del ganador. Los originales se conservan en `design/photos`; los WebP optimizados están en `public/assets`. El encuadre se hace con CSS y no se modifican los rostros.

El formulario usa una superficie clara de lectura, opciones grandes y selección marcada. Las 22 preguntas respetan los seis bloques del archivo: Guillermo, Andrea, Antonia, votantes, cultura familiar y cierre; el voto final ocupa la séptima sección. La barra de **Activar música**, **Volumen**, **Letra grande** y **Pausar animación** permanece visible al desplazarte, también en móvil. Puedes seleccionar con Tab y las flechas del teclado. El nombre y las respuestas se guardan en este dispositivo mientras respondes; un refresco puede recuperar el avance cuando el navegador permite almacenamiento local. Los borradores y la demostración se distinguen por versión del cuestionario para evitar trasladar selecciones antiguas a preguntas distintas.

La música es una pieza instrumental original de 32 segundos con campanillas suaves y armonía cálida, preparada para repetirse. Comienza al pulsar **Activar música**, con volumen inicial del 18 %. **Silenciar música** la pausa y el control permite ajustar el volumen. El MP3 se sirve desde el propio proyecto, sin reproductores externos. Su fuente y composición están en `design/audio/README.md`.

GSAP coordina la entrada de la portada, el fantasma flotante, la niebla, las luces y la revelación. Se respeta la preferencia de movimiento reducido del dispositivo y se cancelan los movimientos al usar el teclado. Al terminar, el comprobante aparece debajo de las respuestas, dentro de la misma página, y puede descargarse en texto.

El arte decorativo se generó para este proyecto con la herramienta integrada de imágenes; sus fuentes y derivados están documentados en `design/ASSETS.md`. Las fotos de los participantes son las adjuntadas por el usuario; si falla una foto se muestran sus iniciales. Las tipografías Cormorant Garamond y DM Sans se solicitan a Google Fonts; si no cargan, se usan fuentes del sistema.

## Guardado, privacidad y recuperación

- El nombre completo se verifica en el servidor y permite un solo voto con ese nombre, incluso desde distintos dispositivos.
- Las respuestas se confirman después de guardar el registro en la base de datos.
- Si se interrumpe la conexión, se conservan las respuestas y se reintenta el mismo envío. Mientras falta la confirmación, no se permite cambiar ese envío.
- Las sesiones del administrador duran dos horas y sus tokens se conservan únicamente en memoria en el navegador. Recargar la página exige ingresar de nuevo.
- Hay un límite de cinco intentos de clave incorrecta, seguido de una espera de 15 minutos.
- La hoja es privada. Los invitados no acceden al archivo, a las respuestas ajenas ni a los conteos.
- La descarga CSV escapa textos que podrían interpretarse como fórmulas. Las escrituras a Google Sheets usan `RAW`.
- La aplicación está dimensionada para un evento familiar: máximo 2.000 invitaciones y 12 participantes.

### Cambiar o recuperar la clave

El propietario puede crear un `.env.local` privado con `DATABASE_URL` y la nueva `ADMIN_PASSWORD`, y ejecutar:

```powershell
npm run admin:reset
```

Esto reemplaza el verificador de la clave y cierra las sesiones anteriores. Cambiar solamente `ADMIN_PASSWORD` en Vercel no reemplaza una clave ya inicializada. Conserva la base de datos correcta para no modificar otro evento.

Para un evento nuevo, usa una base de datos nueva y enlaza una hoja nueva. No se incluye un botón que borre las participaciones existentes.

## Desarrollo y pruebas

```powershell
npm ci
npm test
npm start
```

`npm test` construye primero el cliente y ejecuta pruebas de reglas de votación, criptografía, persistencia HTTP, PostgreSQL local mediante PGlite, API de Vercel, contrato de Google Sheets y recorrido de interfaz con JSDOM. Las pruebas no envían datos a una cuenta real de Google.

El cliente del evento real no incluye credenciales ni módulos privados del servidor. La construcción comprueba esta separación. El paquete de `/demo` incorpora una simulación local y una clave ficticia, sin acceso al evento real. Consulta `VERIFICACION.md` para la evidencia de esta entrega y los límites de las comprobaciones.

Referencias de despliegue: [funciones Node.js de Vercel](https://vercel.com/docs/functions/runtimes/node-js), [Node.js 24 en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) y [API oficial de Google Sheets](https://developers.google.com/workspace/sheets/api/guides/values).
