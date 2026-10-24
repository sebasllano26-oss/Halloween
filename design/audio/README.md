# Música de Halloween

**Tocata de medianoche** es una pieza de 60 segundos en re menor que se repite sin cortes. Tiene dos actos:

1. **La tocata.** Empieza con un trueno. Después suena en órgano de tubos el comienzo de la *Tocata y fuga en re menor, BWV 565* de J. S. Bach (dominio público), la música de órgano más asociada a Halloween y a las películas de terror. Se oyen las tres caídas La–Sol–La, Sol–Fa–Mi–Re–Do♯–Re en octavas, el Re grave del pedal y el acorde disminuido que se arma nota a nota y se resuelve en re menor.
2. **La danza macabra.** Es una danza original sobre un bajo descendente (Re–Do♯–Do–Si–Si♭–La). La melodía la toca un theremín y la acompañan cuerdas pulsadas y campanas. En la segunda vuelta se suma un xilófono seco, los "huesos" de los esqueletos que bailan. A mitad de la danza ulula un búho.
3. **Medianoche.** Al final suenan un acorde de órgano, tres campanadas y un aullido de lobo antes de que vuelva el trueno. El viento silba de fondo durante toda la pieza.

Todos los instrumentos y efectos se sintetizan con `scripts/create-soundtrack.mjs`: órgano aditivo con registros de 16', 8', 4', 2⅔' y 2' más mixtura, cuerdas Karplus-Strong, campana con parciales de campana de iglesia y reverberación tipo Freeverb. No usa grabaciones ni muestras. Las colas de las notas y de la reverberación pasan al inicio del bucle para que la repetición no tenga costura.

- Archivo público: `public/assets/ambiente-halloween.mp3`.
- Fuente sin comprimir: `design/audio/tocata-de-medianoche.wav`.
- Muestra corta: `design/audio/preview.mp3` (los primeros 12 segundos).
- Duración: 60 segundos; estéreo; 44.100 Hz; MP3 a 128 kbps; 961.009 bytes.
- El pico del WAV está normalizado a 0,89. El MP3 decodificado tiene un máximo de −1,6 dBFS y una media de −17,9 dBFS, sin saturación. El acto 1, el acto 2 y el final quedan a menos de 3 dB entre sí.
- Volumen fijo del reproductor: 25 %.

La página no muestra botones de música ni de animación. La música intenta empezar al abrir la página. Si el navegador exige una interacción (`NotAllowedError`), empieza con el primer clic, toque o tecla de escritura y no se reinicia con los siguientes. La tecla Tab sigue reservada para navegar. Si la persona vuelve a la página con el botón Atrás, la música se reanuda. Los errores de reproducción no bloquean la encuesta. Para bajar o quitar el sonido se usa el volumen del dispositivo. Las animaciones solo se desactivan si el dispositivo tiene activada la opción de reducir movimiento.

La página precarga la pista y lleva una versión en la URL (`?v=tocata-medianoche-1`) para que los navegadores no sigan usando la pista anterior desde la caché. [Las políticas de reproducción automática](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) pueden impedir el sonido hasta la primera interacción.

Para regenerar la fuente: `node scripts/create-soundtrack.mjs`.

Conversión con FFmpeg:

```sh
ffmpeg -y -i design/audio/tocata-de-medianoche.wav -codec:a libmp3lame -b:a 128k -ar 44100 -metadata title="Tocata de medianoche - Halloween" -metadata artist="Halloween Velez Lopez" public/assets/ambiente-halloween.mp3
ffmpeg -y -i public/assets/ambiente-halloween.mp3 -t 12 -af "afade=t=out:st=11:d=1" -codec:a libmp3lame -b:a 128k design/audio/preview.mp3
```

Verificación: formato, duración, tamaño y ausencia de saturación con FFprobe y FFmpeg. Un análisis Goertzel del WAV confirmó las notas de la tocata y de la melodía en los tiempos previstos. Las pruebas cubren el inicio automático permitido o bloqueado, la recuperación con una interacción, la ausencia de inicios duplicados, el bucle, el volumen fijo, que preferencias antiguas de volumen o animación no se apliquen y la ausencia de los controles retirados. Las pruebas de interfaz simulan HTMLMediaElement; no certifican la escucha en un altavoz ni la política de cada dispositivo.
