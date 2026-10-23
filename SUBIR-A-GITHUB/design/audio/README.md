# Música de Halloween

Pieza instrumental original para este proyecto: **El baile de las sombras**. Síntesis local de campanillas tipo celesta, ecos suaves y una base armónica cálida en tonalidad menor. No usa grabaciones, muestras ni una canción de terceros.

- Archivo público: `public/assets/ambiente-halloween.mp3`.
- Fuente sin comprimir: `design/audio/el-baile-de-las-sombras.wav`.
- Muestra corta: `design/audio/preview.mp3`.
- Generador: `scripts/create-soundtrack.mjs`.
- Duración: 32 segundos; mono; 22.050 Hz; MP3 a 96 kbps.
- Pico del WAV normalizado a 0,65 para evitar saturación.
- Volumen inicial del reproductor: 18 %, ajustable entre 0 y 100 %.

El reproductor empieza en silencio. Una pulsación en **Activar música** inicia el bucle. **Silenciar música** lo pausa; se conserva el punto de reproducción para continuar. Los errores de reproducción no bloquean la encuesta. El MP3 ya está incluido para desplegar en Vercel.

Para reproducir la generación, ejecutar `node scripts/create-soundtrack.mjs`. El WAV puede convertirse con FFmpeg: `ffmpeg -i design/audio/el-baile-de-las-sombras.wav -codec:a libmp3lame -b:a 96k public/assets/ambiente-halloween.mp3`.

Verificación realizada: formato, duración, tamaño y pruebas del control de reproducción y volumen. No se dispuso de escucha de audio ni de un navegador conectado para auditar el sonido en un dispositivo real.
