# Arte de El baile de las sombras

## Fotos reales incorporadas el 23 de octubre de 2026

Se utilizaron los tres archivos adjuntos del usuario en el orden indicado: **Antonia**, **Guillermo**, **Andrea**. Los originales exactos están en `design/photos/antonia.png`, `guillermo.png` y `andrea.png`. Las copias optimizadas están en `public/assets/antonia.webp`, `guillermo.webp` y `andrea.webp`.

`scripts/prepare-photos.mjs` normaliza la orientación y prepara WebP de hasta 900 px de ancho, conservando la proporción completa. La interfaz encuadra las fotos con CSS. No se generaron reemplazos de las personas ni se alteraron sus rostros. La asignación usa sus nombres y aparece en la presentación, el voto y el resultado; un participante con otro nombre recibe iniciales como respaldo.

El arte descrito a continuación permanece como decoración de Halloween. La música original está documentada en `design/audio/README.md`.

## Decoración generada

Generado con la herramienta integrada `image_gen`, en dos encargos independientes. No se usó CLI ni una clave de API. Los originales se copiaron al proyecto y los archivos públicos conservan la transparencia de los personajes.

## Archivos finales

| Uso | Archivo en el proyecto |
| --- | --- |
| Original de la escena | `design/generated/mansion-v2.png` |
| Original de los tres personajes | `design/generated/mascots-v2.png` |
| Portada de escritorio | `public/assets/mansion-v2.webp` |
| Portada de móvil | `public/assets/mansion-v2-mobile.webp` |
| Respaldo JPEG de la portada | `public/assets/mansion-v2.jpg` |
| Retratos | `public/assets/witch-v2.webp`, `vampire-v2.webp`, `ghost-v2.webp` |

Los PNG originales miden 1536 × 1024. El atlas tiene tres columnas y los retratos públicos miden 480 × 960, con canal alfa verificado. `scripts/prepare-assets.mjs` realiza los recortes de columnas y la compresión con Sharp. No altera el contenido de las ilustraciones. Para regenerar estos derivados: `node scripts/prepare-assets.mjs` y después `npm run build`.

Los originales generados por la herramienta se recibieron en `C:/Users/sebas/.codex/generated_images/01a166d9-f976-7152-a334-5c63080d849a/`: escena `exec-e373ab4d-d7c6-4358-8532-b2ab878752da.png` y personajes `exec-5eaae368-58c4-46f2-9ab1-575cbf4417fe.png`. La aplicación usa las copias del proyecto y no depende de esa ruta.

## Prompts del conjunto, normalizados para documentación

**Escena — stylized-concept / portada web:** ilustración cinematográfica de Halloween para una fiesta familiar llamada “El baile de las sombras”. Mansión encantada en un bosque nocturno, gran luna ámbar, ventanas cálidas, sendero de piedra, calabazas y fantasmas amigables. Acabado detallado de película de animación y cuento ilustrado, tonos ciruela, lavanda, cobre y luz de vela. Composición horizontal: mansión y luna hacia el centro y la derecha; espacio oscuro y despejado a la izquierda para colocar el título en HTML. Sin texto, logotipos ni marcas de agua. Ambiente misterioso, acogedor y apropiado para una familia.

**Personajes — stylized-concept / atlas de ilustraciones:** tres personajes de Halloween originales en columnas separadas, con estilo coherente de cuento y animación tridimensional: brujita de vestido y sombrero ciruela con calabaza iluminada; vampiro con capa oscura y detalles cálidos; fantasma amigable con sombrero verde y calabaza. Textura rica, iluminación suave, ojos expresivos, siluetas completas y fondo transparente. Sin texto, logotipos ni marcas de agua. Mantener cada figura dentro de su columna para obtener tres retratos independientes.

Las imágenes no representan fotografías de los participantes. La interfaz lo indica junto a las tarjetas. Los símbolos de interfaz y las ilustraciones SVG de respaldo están en `src/client/art.js`.
