// Original haunted waltz: pipe organ, music box, tolling bells and theremin.
// All instruments are synthesized here; no samples or third-party melodies.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sampleRate = 32000, duration = 48, beat = 2 / 3, barLength = beat * 3;
const left = new Float64Array(sampleRate * duration), right = new Float64Array(left.length);
const tau = 2 * Math.PI;
const chords = [
  [50,57,62,65], [45,55,61,64,70], [50,57,62,65], [49,55,58,64],
  [43,55,58,62], [50,57,62,65], [46,58,62,65], [45,57,61,67],
  [50,57,62,65], [43,55,58,62], [40,55,58,64], [45,55,61,64,70],
];
const melody = [
  [74,77,81,80,81,77], [76,73,70,69,70,73], [74,77,81,86,85,81],
  [76,73,70,67,70,73], [79,82,86,85,86,82], [81,77,74,73,74,77],
  [82,77,74,77,82,81], [80,81,76,73,70,73], [74,77,81,86,81,77],
  [79,82,86,82,79,77], [76,79,82,85,82,79], [81,79,76,73,70,73],
];
let seed = 0x48414c4c;
function noise() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; }
function mix(index, value, pan) {
  const at = ((index % left.length) + left.length) % left.length;
  left[at] += value * Math.sqrt((1 - pan) / 2);
  right[at] += value * Math.sqrt((1 + pan) / 2);
}
function voice(start, length, midi, amplitude, timbre, pan = 0) {
  const frequency = 440 * 2 ** ((midi - 69) / 12), offset = Math.round(start * sampleRate);
  for (let i = 0; i < length * sampleRate; i++) {
    const t = i / sampleRate, release = Math.min(1, (length - t) / .18);
    let phase = tau * frequency * t, envelope, wave;
    if (timbre === 'organ') {
      phase += .055 * Math.sin(tau * 4.6 * t);
      envelope = Math.min(1, t / .12) * release * (.92 + .08 * Math.sin(tau * 3.2 * t));
      wave = Math.sin(phase) + .43 * Math.sin(phase * 2) + .24 * Math.sin(phase * 3) + .12 * Math.sin(phase * 4) + .06 * Math.sin(phase * 6);
    } else if (timbre === 'bell') {
      envelope = (1 - Math.exp(-65 * t)) * Math.exp(-1.05 * t) * release;
      wave = Math.sin(phase) + .55 * Math.sin(phase * 2.76) * Math.exp(-.7 * t) + .2 * Math.sin(phase * 5.4) * Math.exp(-1.3 * t) + .065 * Math.sin(phase * 8.93) * Math.exp(-2 * t);
    } else if (timbre === 'theremin') {
      phase += .65 * Math.sin(tau * 5.1 * t) + 1.6 * Math.exp(-3 * t);
      envelope = Math.sin(Math.PI * t / length) ** 1.8;
      wave = Math.sin(phase) + .13 * Math.sin(phase * 2);
    } else if (timbre === 'plucked') {
      envelope = Math.min(1, t / .007) * Math.exp(-7 * t) * release;
      wave = Math.sin(phase) + .37 * Math.sin(phase * 2) + .21 * Math.sin(phase * 3) + .1 * Math.sin(phase * 5);
    } else {
      envelope = (1 - Math.exp(-90 * t)) * Math.exp(-3.7 * t) * release;
      wave = Math.sin(phase) + .32 * Math.sin(phase * 2.002) * Math.exp(-2 * t) + .09 * Math.sin(phase * 4.01) * Math.exp(-3 * t);
    }
    const value = amplitude * envelope * wave;
    mix(offset + i, value, pan);
    // Wrapped tails and echoes keep the harmony continuous across the loop.
    mix(offset + i + Math.round(.23 * sampleRate), value * .17, -pan);
    mix(offset + i + Math.round(.47 * sampleRate), value * .08, pan * .5);
  }
}

for (let bar = 0; bar < 24; bar++) {
  const chord = chords[bar % chords.length], start = bar * barLength;
  chord.slice(1).forEach((note, i) => voice(start, barLength + .15, note, .025, 'organ', (i - 1.5) * .16));
  voice(start, 1.65, chord[0] - 12, .065, 'organ');
  for (let step = 1; step < 3; step++) {
    chord.slice(1, 4).forEach(note => voice(start + step * beat, .48, note, .023, 'plucked', -.28));
  }
  melody[bar % melody.length].forEach((note, i) => {
    // A brief breath at the end of alternating bars leaves room for the bells.
    if (i === 5 && bar % 4 === 2) return;
    const octave = bar >= 12 && bar % 4 === 1 ? -12 : 0;
    voice(start + i * beat / 2, 1.15, note + octave, i % 2 ? .073 : .092, 'music-box', .25);
  });
  if (bar % 4 === 0) voice(start, 4.3, chord[0] + 12, .075, 'bell', -.3);
  if (bar % 4 === 2) voice(start + beat, 2.3, melody[bar % melody.length][0] - 12, .027, 'theremin', .38);
}

// A quiet filtered breeze adds atmosphere without voices or sudden effects.
let breeze = 0;
for (let i = 0; i < left.length; i++) {
  const t = i / sampleRate;
  breeze = breeze * .985 + noise() * .015;
  mix(i, breeze * .025 * (.65 + .35 * Math.sin(tau * t / 12)), Math.sin(tau * t / 24) * .5);
}
let peak = 0, power = 0;
for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const pcm = Buffer.alloc(left.length * 4), normalizedPeak = .78;
for (let i = 0; i < left.length; i++) {
  // Only a 12 ms boundary taper; the score resolves when it repeats.
  const fade = Math.min(1, i / (sampleRate * .012), (left.length - 1 - i) / (sampleRate * .012));
  const l = left[i] / peak * normalizedPeak * fade, r = right[i] / peak * normalizedPeak * fade;
  pcm.writeInt16LE(Math.round(l * 32767), i * 4); pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  power += l * l + r * r;
}
const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const destination = resolve(root, 'design/audio'); await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, 'el-baile-de-las-sombras.wav'), Buffer.concat([header, pcm]));
console.log(JSON.stringify({ duration, sampleRate, channels: 2, normalizedPeak, rmsDb: +(20 * Math.log10(Math.sqrt(power / (left.length * 2)))).toFixed(2), bytes: pcm.length + 44, source: 'original haunted waltz synthesis, no samples' }));
