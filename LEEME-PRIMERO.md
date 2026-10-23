# Halloween listo para compartir

El enlace para toda la familia es https://vele-rouge.vercel.app/ . Todos abren la misma dirección, escriben su nombre completo y apellidos, responden las 23 preguntas y envían. No hay invitaciones ni códigos.

El servidor admite una participación por nombre completo e ignora diferencias de tildes, mayúsculas y espacios. Un reintento del mismo envío recupera el comprobante. Dos personas pueden usar el mismo teléfono: al terminar, pulsa **Responder para otra persona**.

Este control usa el nombre declarado; no verifica documentos ni identidad. Si dos familiares tienen exactamente el mismo nombre completo, consulta al organizador para distinguirlos antes de votar.

El administrador entra en https://vele-rouge.vercel.app/admin con la clave del archivo privado entregado. Puede copiar el enlace común, revisar las respuestas, descargar CSV, cerrar la urna y revelar el ganador. La clave no se sube a GitHub.

## Base de datos y hoja de cálculo

**Supabase ya está conectado y guarda las respuestas.** La descarga CSV del panel se puede abrir en Excel o importar en Google Sheets.

La copia automática a la hoja de Google todavía no está conectada: faltan las credenciales de una cuenta de servicio con permiso de edición sobre esa hoja. Esto no impide votar ni consultar los resultados en el panel. Los pasos para esa copia opcional están en README.md.

## Despliegue

El repositorio ya está actualizado en https://github.com/sebasllano26-oss/Halloween . Para una instalación nueva, sube el contenido de esta carpeta a la raíz de GitHub. En Vercel usa Root Directory ./, Framework Other y las variables privadas DATABASE_URL y ADMIN_PASSWORD. El proyecto incluye la configuración y el certificado público de Supabase.
