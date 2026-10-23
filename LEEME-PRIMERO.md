# Halloween listo para compartir

El enlace para toda la familia es https://vele-rouge.vercel.app/ . Todos abren la misma dirección, escriben su nombre completo y apellidos, responden las 23 preguntas y envían. No hay invitaciones ni códigos.

El servidor admite una participación por nombre completo e ignora diferencias de tildes, mayúsculas y espacios. Un reintento del mismo envío recupera el comprobante. Dos personas pueden usar el mismo teléfono: al terminar, pulsa **Responder para otra persona**.

Este control usa el nombre declarado; no verifica documentos ni identidad. Si dos familiares tienen exactamente el mismo nombre completo, consulta al organizador para distinguirlos antes de votar.

El administrador entra en https://vele-rouge.vercel.app/admin con la clave del archivo privado entregado. Puede copiar el enlace común, revisar las respuestas, descargar CSV, cerrar la urna y revelar el ganador. La clave no se sube a GitHub.

La música de Halloween intenta empezar al abrir el enlace. Si el navegador requiere un toque, comienza con la primera interacción. La barra visible permite silenciarla y ajustar el volumen; después de silenciarla, no vuelve a sonar por pulsar las respuestas.

## Probar y reiniciar los ensayos

Entra como anfitrión y abre **Pruebas → Probar el formulario**. Puedes llenarlo a mano o pulsar **Completar con respuestas de prueba**, cambiar cualquier selección y enviarlo. El comprobante confirma el guardado y la copia a **Halloween_Pruebas**. Los ensayos no cuentan para el ganador y no aparecen en el CSV de votos reales.

En **Pruebas → Eliminar registros de prueba**, confirma **Eliminar los ensayos** para limpiar únicamente las pruebas de la base y de Google. Los votos reales se conservan. Si Google no confirma el borrado, el panel conserva los registros para reintentar.

## Base de datos y hoja de cálculo

**Supabase ya está conectado y guarda las respuestas.** La descarga CSV del panel se puede abrir en Excel o importar en Google Sheets.

La copia automática ya está conectada a [Encuesta halloween](https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit#gid=873274653). Las pestañas del sistema son Halloween_Respuestas, Halloween_Resultados y Halloween_Evento. Cada respuesta se guarda primero en Supabase y después se copia a la hoja. El panel permite sincronizar pendientes si Google falla. La pestaña original se conserva. Las credenciales están protegidas en Vercel y fuera del repositorio.

## Despliegue

El repositorio ya está actualizado en https://github.com/sebasllano26-oss/Halloween . Para una instalación nueva, sube el contenido de esta carpeta a la raíz de GitHub. En Vercel usa Root Directory ./, Framework Other y las variables privadas DATABASE_URL y ADMIN_PASSWORD. El proyecto incluye la configuración y el certificado público de Supabase.
