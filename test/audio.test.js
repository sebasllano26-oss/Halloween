import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundtrack } from '../src/client/audio.js';

test('el control manual respeta el volumen y se puede pausar', async () => {
  let plays = 0, pauses = 0;
  const element = { play: async () => { plays++; }, pause: () => { pauses++; }, addEventListener() {} };
  const music = createSoundtrack(element);
  assert.equal(plays, 0); assert.equal(music.playing, false);
  await music.toggle(); assert.equal(plays, 1); assert.equal(music.playing, true);
  assert.equal(element.loop, true); assert.equal(element.volume, .18);
  music.setVolume(.07); assert.equal(element.volume, .07);
  music.setVolume(4); assert.equal(element.volume, 1);
  await music.toggle(); assert.equal(music.playing, false); assert.equal(pauses, 1);
});

test('intenta reproducir automáticamente sin esperar una interacción', async () => {
  let plays = 0;
  const changes = [], target = new EventTarget();
  const element = { play: async () => { plays++; }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element, { onChange: value => changes.push(value) });
  assert.equal(await music.autoplay(target), true);
  assert.equal(plays, 1); assert.equal(music.playing, true);
  assert.deepEqual(changes, [true]);
  target.dispatchEvent(new Event('click'));
  assert.equal(plays, 1);
});

test('si el navegador bloquea el inicio, el primer clic, toque o tecla inicia la música', async () => {
  for (const gesture of ['click', 'touchend', 'keydown']) {
    let plays = 0;
    const target = new EventTarget();
    const element = { play: async () => { if (++plays === 1) throw new DOMException('Interacción requerida', 'NotAllowedError'); }, pause() {}, addEventListener() {} };
    const music = createSoundtrack(element);
    assert.equal(await music.autoplay(target), false);
    assert.equal(music.playing, false);
    target.dispatchEvent(new Event(gesture));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(plays, 2, gesture); assert.equal(music.playing, true, gesture);
    target.dispatchEvent(new Event(gesture));
    assert.equal(plays, 2, 'La música no vuelve a iniciarse en cada interacción');
  }
});

test('silenciar cancela cualquier inicio pendiente por interacción', async () => {
  let plays = 0;
  const target = new EventTarget();
  const element = { play: async () => { plays++; throw new DOMException('Bloqueado', 'NotAllowedError'); }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element);
  await music.autoplay(target);
  music.pause();
  target.dispatchEvent(new Event('click'));
  target.dispatchEvent(new Event('touchend'));
  target.dispatchEvent(new Event('keydown'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plays, 1); assert.equal(music.playing, false);
});

test('no duplica el arranque ni indica reproducción si se pausa mientras carga', async () => {
  let resolvePlay, plays = 0;
  const changes = [], target = new EventTarget();
  const element = { play: () => { plays++; return new Promise(resolve => { resolvePlay = resolve; }); }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element, { onChange: value => changes.push(value) });
  const pending = music.autoplay(target);
  target.dispatchEvent(new Event('click'));
  assert.equal(plays, 1);
  await music.toggle();
  resolvePlay(); await pending;
  assert.equal(music.playing, false); assert.deepEqual(changes, [false]);
});

test('un archivo no reproducible no provoca reintentos en cada clic del formulario', async () => {
  let plays = 0;
  const target = new EventTarget();
  const element = { play: async () => { plays++; throw new DOMException('Formato no compatible', 'NotSupportedError'); }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element);
  assert.equal(await music.autoplay(target), false);
  target.dispatchEvent(new Event('click'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plays, 1); assert.equal(music.playing, false);
});

test('un fallo de reproducción no indica que la música esté sonando', async () => {
  const element = { play: async () => { throw new Error('No se pudo reproducir'); }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element);
  await assert.rejects(() => music.toggle(), /reproducir/);
  assert.equal(music.playing, false);
});
