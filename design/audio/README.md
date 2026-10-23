# Música de Halloween

Pieza instrumental original para este proyecto: **El baile de las sombras · Vals de Halloween**. Órgano, campanas graves, caja de música, cuerdas pulsadas, theremín suave y una brisa discreta. La melodía usa re menor armónica, acordes disminuidos y pequeños pasos cromáticos para dar un ambiente de casa encantada. Todos los instrumentos se sintetizan localmente; no usa grabaciones, muestras ni melodías de terceros.

- Archivo público: `public/assets/ambiente-halloween.mp3`.
- Fuente sin comprimir: `design/audio/el-baile-de-las-sombras.wav`.
- Muestra corta: `design/audio/preview.mp3`.
- Generador: `scripts/create-soundtrack.mjs`.
- Duración: 48 segundos; estéreo; 32.000 Hz; MP3 a 128 kbps; 769.669 bytes.
- Pico del WAV normalizado a 0,78. El MP3 decodificado tiene un máximo de −2,6 dBFS, sin saturación.
- Volumen inicial del reproductor: 18 %, ajustable entre 0 y 100 %.

El reproductor intenta iniciar el bucle al abrir la página. Si el navegador exige una interacción (`NotAllowedError`), se inicia con el primer clic, toque o tecla de escritura; no hace falta encontrar el botón de música. La tecla Tab sigue reservada para navegar. El estado del botón solo cambia cuando `play()` confirma la reproducción. **Silenciar música** pausa y cancela el inicio pendiente; otros clics del formulario no vuelven a activarla. **Activar música** permite continuar desde el mismo punto. Los errores de reproducción no bloquean la encuesta.

La página precarga la pista y utiliza una versión en su URL para renovar la caché anterior. No se alteran las preferencias del navegador: [las políticas de reproducción automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) pueden impedir sonido antes de una interacción.

Para regenerar la fuente: `node scripts/create-soundtrack.mjs`.

Conversión con FFmpeg:

```sh
ffmpeg -y -i design/audio/el-baile-de-las-sombras.wav -codec:a libmp3lame -b:a 128k -ar 32000 -metadata title="El baile de las sombras - Vals de Halloween" -metadata artist="Halloween Velez Lopez" public/assets/ambiente-halloween.mp3
ffmpeg -y -i public/assets/ambiente-halloween.mp3 -t 12 -af "afade=t=out:st=11:d=1" -codec:a libmp3lame -b:a 128k design/audio/preview.mp3
```

Verificación: formato, duración, tamaño, ausencia de saturación y pruebas de inicio automático permitido/bloqueado, recuperación por interacción, silencio, carga pendiente, volumen y fallos del archivo. Las pruebas de interfaz simulan HTMLMediaElement; no certifican la escucha en un altavoz ni la política de cada dispositivo.
