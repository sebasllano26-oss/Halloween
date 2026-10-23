# El baile de las sombras · Diseño vigente

Actualización del 23 de octubre de 2026. Se aplica ui-ux-pro-max y la instrucción expresa del usuario: fotos reales, sonido agradable y presentación más encuesta en una misma página, pensada para personas mayores.

## Distribución

1. Portada de Halloween con mansión, luna ámbar, niebla, luces y fantasma decorativo.
2. Presentación con las fotos de Antonia, Guillermo y Andrea, en ese orden.
3. Tema de la edición y tres instrucciones breves.
4. Nombre del invitado y las 22 preguntas del archivo, conservando sus seis bloques y todas sus opciones; después, el voto al mejor disfraz. Son 23 preguntas abiertas en siete secciones.
5. Un botón de envío al final; el comprobante se muestra en la misma página.

Los botones de navegación desplazan a la sección correspondiente. Las preguntas no cambian de pantalla ni requieren abrir acordeones. Las respuestas pueden modificarse directamente antes de enviar. La administración conserva su acceso separado con clave.

## Identidad visual y lectura

- Fondo ciruela #100d16; superficies #1b1621; papel de encuesta #f6eddc.
- Texto sobre papel #302535; secundario #6e5968.
- Acción naranja #ffad66 con texto oscuro #25150e.
- Títulos Cormorant Garamond; preguntas, controles y respuestas DM Sans.
- Preguntas de 20–23 px con peso 600; respuestas de 18–19 px; opción de lectura ampliada a 22–27 px.
- Filas de respuesta de al menos 68–72 px; radios de 24 px; controles de herramientas de al menos 44 px de alto.
- Errores visibles junto a los campos, foco en el primer dato pendiente y selección identificada con radio y marca.
- Una barra superior con música, volumen, letra grande y pausa permanece disponible al bajar.

## Fotografías

Originales adjuntos por el usuario. Las versiones WebP mantienen el contenido y la proporción de origen; el encuadre se hace con CSS. Fotos visibles en presentación, opciones del voto y ganador. Si se añaden nombres distintos, se muestran iniciales en lugar de atribuirles una foto ajena.

## Música y movimiento

Pista instrumental original de 32 segundos, celesta suave y armonía cálida. Archivo local MP3, bucle y volumen inicial 18 %. Empieza tras pulsar Activar música; siempre hay control de volumen y silencio.

GSAP anima entrada de portada, fantasma, niebla, luces, paralaje sutil y revelación. Las preguntas permanecen quietas durante la lectura. Se respeta movimiento reducido y pausa. Los contextos se limpian al cambiar al panel o al usar teclado.

## Fiabilidad

Nombre y respuestas se conservan en el dispositivo. El envío se valida en el servidor y devuelve comprobante. Ante una respuesta de red incierta se protegen los datos y se reintenta el mismo envío sin duplicarlo. La demostración de /demo funciona solo en el navegador y su reinicio no afecta al evento real.

Se mantiene Vercel, PostgreSQL y Google Sheets API directa. La conexión de producción y el despliegue requieren las credenciales del usuario.

## Comprobación

Pruebas del recorrido continuo, asignación de fotos, validación y foco, reintentos, música y administración. No hay navegador conectado disponible para inspección visual; esa limitación se detalla en VERIFICACION.md.
