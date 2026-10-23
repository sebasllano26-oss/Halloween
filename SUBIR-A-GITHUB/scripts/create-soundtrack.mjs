// Original instrumental: soft celesta, warm pads and a gentle minor-key waltz.
// No samples, recordings or third-party compositions are used.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sampleRate = 22050, duration = 32, samples = new Float64Array(sampleRate * duration);
const chords = [[50,57,62,65],[46,53,58,62],[48,53,57,60],[48,55,60,64],[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,62]];
const melody = [[74,77,81,77],[74,77,82,77],[72,77,81,79],[72,76,79,76],[74,77,81,86],[77,74,70,74],[74,79,82,79],[73,76,81,73]];
function voice(start, length, midi, amplitude, timbre) {
  const frequency = 440 * 2 ** ((midi - 69) / 12), offset = Math.round(start * sampleRate);
  for (let i = 0; i < length * sampleRate && i + offset < samples.length; i++) {
    const t = i / sampleRate, phase = 2 * Math.PI * frequency * t;
    const envelope = timbre === 'bell' ? (1 - Math.exp(-55 * t)) * Math.exp(-2.7 * t) : Math.sin(Math.PI * t / length) ** 1.25;
    const wave = timbre === 'bell' ? Math.sin(phase) + .23 * Math.sin(phase * 2.003) * Math.exp(-2 * t) + .055 * Math.sin(phase * 3.01) * Math.exp(-3 * t) : Math.sin(phase) + .12 * Math.sin(phase * 2) + .035 * Math.sin(phase * 3);
    samples[i + offset] += amplitude * envelope * wave;
  }
}
for (let bar = 0; bar < chords.length; bar++) {
  for (const note of chords[bar]) voice(bar * 4, 4, note, .025, 'pad');
  for (let beat = 0; beat < 4; beat++) {
    const start = bar * 4 + [0, 2/3, 2, 8/3][beat];
    voice(start, 2.1, melody[bar][beat], beat === 0 ? .095 : .073, 'bell');
    voice(start + .19, 1.5, melody[bar][beat], .011, 'bell');
  }
}
const peak = Math.max(...Array.from({ length: 128 }, (_, block) => {
  let high = 0; for (let i = block; i < samples.length; i += 128) high = Math.max(high, Math.abs(samples[i])); return high;
}));
const pcm = Buffer.alloc(samples.length * 2);
for (let i = 0; i < samples.length; i++) {
  const t = i / sampleRate, fade = Math.min(1, t / .18, (duration - t) / .25);
  pcm.writeInt16LE(Math.round(samples[i] / peak * .65 * fade * 32767), i * 2);
}
const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const destination = resolve(root, 'design/audio'); await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, 'el-baile-de-las-sombras.wav'), Buffer.concat([header, pcm]));
console.log(JSON.stringify({ duration, sampleRate, channels: 1, normalizedPeak: .65, bytes: pcm.length + 44, source: 'original synthesis, no samples' }));
