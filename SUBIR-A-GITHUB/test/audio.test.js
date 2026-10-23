import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundtrack } from '../src/client/audio.js';

test('la música empieza por acción del invitado, respeta el volumen y se puede pausar', async () => {
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

test('un fallo de reproducción no indica que la música esté sonando', async () => {
  const element = { play: async () => { throw new Error('No se pudo reproducir'); }, pause() {}, addEventListener() {} };
  const music = createSoundtrack(element);
  await assert.rejects(() => music.toggle(), /reproducir/);
  assert.equal(music.playing, false);
});
