// Halloween soundtrack. Every instrument is synthesized here; no samples or recordings.
// Act 1: the opening of Bach's Toccata in D minor, BWV 565 (public domain), on a pipe organ.
// Act 2: an original danse macabre with theremin, plucked strings, rattling bones and bells.
// Thunder, wind, an owl and a wolf howl frame the loop.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sampleRate = 44100, duration = 60, length = sampleRate * duration, tau = 2 * Math.PI;
const dry = [new Float64Array(length), new Float64Array(length)], send = [new Float64Array(length), new Float64Array(length)];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
let seed = 0x5ca7e;
function noise() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; }
function mix(index, value, pan = 0, wet = .3) {
  // Tails wrap into the start so the loop has no seam.
  const at = ((index % length) + length) % length, l = value * Math.sqrt((1 - pan) / 2), r = value * Math.sqrt((1 + pan) / 2);
  dry[0][at] += l; dry[1][at] += r; send[0][at] += l * wet; send[1][at] += r * wet;
}
function place(start, buffer, amplitude, pan = 0, wet = .3) {
  let peak = 0; for (const v of buffer) peak = Math.max(peak, Math.abs(v));
  const from = Math.round(start * sampleRate); buffer.forEach((v, i) => mix(from + i, amplitude * v / peak, pan, wet));
}

// Principal chorus: 16', 8', 4', 2 2/3', 2' and mixture ranks, slightly detuned like real pipes.
const RANKS = [[.5, .4], [1, 1], [2, .55], [3, .28], [4, .3], [6, .13], [8, .09]];
function organ(start, end, midi, amplitude, pan = 0) {
  const f = hz(midi), hold = end - start, from = Math.round(start * sampleRate);
  const ranks = RANKS.filter(([ratio]) => f * ratio < 8000).map(([ratio, gain], i) => [tau * f * ratio * (1 + (i % 2 ? .0006 : -.0006)), gain]);
  for (let i = 0, n = Math.round((hold + .5) * sampleRate); i < n; i++) {
    const t = i / sampleRate, envelope = Math.min(1, t / .03) * (t < hold ? 1 : Math.exp((hold - t) / .11));
    let wave = t < .04 ? noise() * .3 * (1 - t / .04) : 0; // breathy pipe "chiff"
    for (const [w, gain] of ranks) wave += gain * (Math.sin(w * t) + .2 * Math.sin(2 * w * t));
    mix(from + i, amplitude * envelope * wave, pan, .6);
  }
}
function pluck(start, midi, amplitude, pan = 0) {
  // Karplus-Strong string: a soft noise burst circulating through a damped delay line.
  const period = Math.round(sampleRate / hz(midi)), line = new Float64Array(period), from = Math.round(start * sampleRate), n = Math.round(1.4 * sampleRate);
  let soft = 0; for (let i = 0; i < period; i++) line[i] = soft += (noise() - soft) * .5;
  for (let i = 0; i < n; i++) {
    const at = i % period, value = line[at];
    line[at] = .993 * .5 * (value + line[(at + 1) % period]);
    mix(from + i, amplitude * value * Math.min(1, (n - i) / (.2 * sampleRate)), pan, .3);
  }
}
function bones(start, midi, amplitude, pan = 0) {
  // Dry xylophone: the skeletons' dance from the danse macabre tradition.
  const f = hz(midi), from = Math.round(start * sampleRate);
  for (let i = 0, n = Math.round(.6 * sampleRate); i < n; i++) {
    const t = i / sampleRate;
    const wave = Math.sin(tau * f * t) * Math.exp(-t / .16) + .4 * Math.sin(tau * 3 * f * t) * Math.exp(-t / .05) + .15 * Math.sin(tau * 6.2 * f * t) * Math.exp(-t / .02) + (t < .004 ? noise() * .5 : 0);
    mix(from + i, amplitude * Math.min(1, t / .001) * wave, pan, .25);
  }
}
// Church bell partials relative to the prime: hum, prime, tierce, quint, nominal and upper partials.
const BELL = [[.5, .55, 6], [1, .7, 4], [1.19, .45, 3.2], [1.5, .3, 2.5], [2, .8, 2.8], [2.51, .25, 1.6], [3.01, .2, 1.2], [4.17, .12, .7]];
function bell(start, midi, amplitude, pan = 0) {
  const f = hz(midi), from = Math.round(start * sampleRate);
  for (let i = 0, n = 9 * sampleRate; i < n; i++) {
    const t = i / sampleRate; let wave = t < .006 ? noise() * .4 : 0;
    for (const [ratio, gain, decay] of BELL) wave += gain * Math.sin(tau * f * ratio * t) * Math.exp(-t / decay);
    mix(from + i, amplitude * Math.min(1, t / .002, (n - i) / (1.5 * sampleRate)) * wave, pan, .5);
  }
}
function theremin(phrase, amplitude, pan = 0) {
  const begin = phrase[0][0], end = phrase.at(-1)[1], from = Math.round(begin * sampleRate);
  let phase = 0, frequency = hz(phrase[0][2]), note = 0;
  for (let i = 0, n = Math.round((end - begin + .6) * sampleRate); i < n; i++) {
    const t = begin + i / sampleRate;
    while (note < phrase.length - 1 && t >= phrase[note + 1][0]) note++;
    frequency += (hz(phrase[note][2]) - frequency) * .00035; // the theremin's sliding portamento
    const vibrato = 1 + .016 * Math.sin(tau * 5.5 * t) * Math.min(1, (t - phrase[note][0]) / .4);
    phase += tau * frequency * vibrato / sampleRate;
    const envelope = Math.min(1, (t - begin) / .3, Math.max(0, (end + .5 - t) / .5));
    mix(from + i, amplitude * envelope * (Math.sin(phase) + .15 * Math.sin(2 * phase) + .06 * Math.sin(3 * phase)), pan, .55);
  }
}
function thunder(start, amplitude, pan = 0) {
  const buffer = new Float64Array(7 * sampleRate); let a = 0, b = 0, c = 0, crack = 0;
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate, x = noise();
    a += (x - a) * .03; b += (a - b) * .03; c += (b - c) * .03; // rumble below ~200 Hz
    crack += (x - crack) * .4;
    buffer[i] = 40 * c * (1 - Math.exp(-t / .12)) * Math.exp(-t / 2) * (1 + .5 * Math.sin(tau * .9 * t)) + .5 * crack * Math.exp(-t / .07);
  }
  place(start, buffer, amplitude, pan, .5);
}
function wind(offset, amplitude, pan) {
  // Resonant band-pass noise whose centre wanders, like wind whistling through a window.
  const buffer = new Float64Array(length); let low = 0, band = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate + offset, center = 430 + 220 * Math.sin(tau * t / 15) + 80 * Math.sin(tau * t / 6);
    const f = 2 * Math.sin(Math.PI * center / sampleRate), high = noise() - low - .12 * band;
    band += f * high; low += f * band;
    buffer[i] = band * (.5 + .5 * Math.sin(tau * t / 20) ** 2);
  }
  place(0, buffer, amplitude, pan, .4);
}
function owl(start, amplitude, pan) {
  const buffer = new Float64Array(Math.round(2.4 * sampleRate));
  for (const [at, size] of [[0, .5], [.85, .2], [1.12, .2], [1.42, .75]]) {
    let phase = 0;
    for (let i = 0; i < size * sampleRate; i++) {
      const t = i / sampleRate; phase += tau * 390 * (1.08 - .08 * Math.min(1, 1.6 * t / size)) / sampleRate;
      buffer[Math.round(at * sampleRate) + i] += Math.sin(Math.PI * t / size) ** 2 * (Math.sin(phase) + .05 * noise());
    }
  }
  place(start, buffer, amplitude, pan, .6);
}
function howl(start, amplitude, pan) {
  const buffer = new Float64Array(Math.round(3.4 * sampleRate)); let phase = 0;
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const f = t < .5 ? 300 + 290 * Math.sin(Math.PI / 2 * t / .5) : t < 2 ? 590 + 12 * Math.sin(tau * 5 * t) : 590 - 230 * ((t - 2) / 1.4) ** 1.4;
    phase += tau * f / sampleRate;
    buffer[i] = Math.min(1, t / .35, (buffer.length - i) / (.9 * sampleRate)) * (Math.sin(phase) + .3 * Math.sin(2 * phase) + .1 * Math.sin(3 * phase) + .03 * noise());
  }
  place(start, buffer, amplitude, pan, .7);
}
function reverb(input, spread) {
  // Freeverb-style hall. Two passes over the loop so the tail of the end feeds the start.
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(size => ({ buffer: new Float64Array(size + spread), index: 0, store: 0 }));
  const allpasses = [556, 441, 341, 225].map(size => ({ buffer: new Float64Array(size + spread), index: 0 }));
  const output = new Float64Array(length);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < length; i++) {
    let y = 0;
    for (const c of combs) {
      const out = c.buffer[c.index]; c.store = out * .75 + c.store * .25;
      c.buffer[c.index] = input[i] * .015 + c.store * .9; c.index = (c.index + 1) % c.buffer.length; y += out;
    }
    for (const a of allpasses) { const out = a.buffer[a.index]; a.buffer[a.index] = y + out * .5; a.index = (a.index + 1) % a.buffer.length; y = out - y; }
    if (pass) output[i] = y;
  }
  return output;
}

// Act 1 · Bach, Toccata in D minor: three falling mordent figures in octaves (A G A, G F E D C# D),
// the low D pedal, the diminished chord built note by note and its resolution.
thunder(0, .5, -.2);
const FIGURE = [[0, .1, 0], [.1, .2, -2], [.2, 1.25, 0], [1.45, 1.6, -2], [1.6, 1.75, -4], [1.75, 1.9, -5], [1.9, 2.05, -7], [2.05, 3, -8], [3, 4.1, -7]];
for (let k = 0; k < 3; k++) for (const [a, b, step] of FIGURE) for (const octave of [0, -12]) {
  organ(.8 + k * 4.4 + a, .8 + k * 4.4 + b, 81 - 12 * k + step + octave, .045, octave ? -.25 : .25);
}
organ(13.6, 21.4, 38, .06); organ(13.6, 21.4, 26, .05);
[49, 52, 55, 58, 61, 64, 67, 70].forEach((note, i) => organ(14.1 + i * .17, 17.7, note, .032, (i - 3.5) * .08));
[50, 53, 57, 62, 65, 69, 74].forEach((note, i) => organ(17.8, 21.3, note, .036, (i - 3) * .08));
thunder(17.8, .3, .3); bell(17.8, 50, .12, -.3);

// Act 2 · danse macabre in D minor over a descending lament bass: D C# C B Bb A.
const PROGRESSION = [[38, [62, 65, 69, 74]], [37, [61, 64, 67, 69]], [36, [62, 65, 69, 72]], [35, [62, 65, 67, 71]], [34, [62, 65, 70, 74]], [33, [61, 64, 67, 69]], [38, [62, 65, 69, 74]], [33, [61, 64, 67, 70]]];
const MELODY = [[[74, 2], [77, 1], [81, 1]], [[79, 2], [76, 1], [73, 1]], [[74, 1], [77, 1], [81, 1], [84, 1]], [[79, 2], [77, 1], [74, 1]], [[77, 2], [74, 1], [70, 1]], [[69, 1], [73, 1], [76, 1], [79, 1]], [[77, 2], [76, 1], [74, 1]], [[82, 2], [81, 1], [73, 1]]];
const beat = .5, bar = 4 * beat, act2 = 22, phrase = [];
for (let pass = 0; pass < 2; pass++) PROGRESSION.forEach(([bass, tones], index) => {
  const start = act2 + (pass * 8 + index) * bar;
  organ(start, start + bar - .05, bass, .05);
  [0, 1, 2, 3, 2, 1, 2, 1].forEach((tone, step) => pluck(start + step * beat / 2, tones[tone], step % 2 ? .16 : .2, -.35));
  pluck(start, bass + 12, .22, .1); pluck(start + 2 * beat, bass + 12, .18, .1);
  let at = start;
  for (const [note, beats] of MELODY[index]) {
    phrase.push([at, at + beats * beat, note]);
    if (pass) bones(at, note, .11, .35);
    at += beats * beat;
  }
  if (pass) { bones(start + 3.5 * beat, tones[3] + 12, .07, .5); bones(start + 3.75 * beat, tones[2] + 12, .06, .5); }
  if (index % 4 === 0) bell(start, 50, .1, -.3);
});
theremin(phrase, .07, .15);
owl(36, .06, -.6);

// Midnight: the last chord, three bell tolls and a wolf before the thunder returns.
[38, 50, 53, 57, 62].forEach((note, i) => organ(54, 57.6, note, .035, (i - 2) * .1));
bell(54, 50, .12, -.3); bell(56, 50, .1, .3); bell(58, 50, .08, -.2);
howl(54.6, .09, .5);
wind(0, .03, -.5); wind(7.5, .03, .5);

const wet = send.map((channel, side) => reverb(channel, side * 23));
const rms = (buffer, from = 0, to = buffer.length) => { let sum = 0; for (let i = from; i < to; i++) sum += buffer[i] ** 2; return Math.sqrt(sum / (to - from)); };
const wetGain = .9 * rms(send[0]) / rms(wet[0]);
const out = dry.map((channel, side) => channel.map((v, i) => v + wet[side][i] * wetGain));
let peak = 0; for (const channel of out) for (const v of channel) peak = Math.max(peak, Math.abs(v));
const normalizedPeak = .89, pcm = Buffer.alloc(length * 4);
for (const channel of out) channel.forEach((v, i, all) => { all[i] = v / peak * normalizedPeak; });
for (let i = 0; i < length; i++) { pcm.writeInt16LE(Math.round(out[0][i] * 32767), i * 4); pcm.writeInt16LE(Math.round(out[1][i] * 32767), i * 4 + 2); }
const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const destination = resolve(root, 'design/audio'); await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, 'tocata-de-medianoche.wav'), Buffer.concat([header, pcm]));
const db = value => +(20 * Math.log10(value)).toFixed(2);
console.log(JSON.stringify({ duration, sampleRate, channels: 2, normalizedPeak, rmsDb: db(rms(out[0])), act1RmsDb: db(rms(out[0], 0, 22 * sampleRate)), act2RmsDb: db(rms(out[0], 22 * sampleRate, 54 * sampleRate)), finaleRmsDb: db(rms(out[0], 54 * sampleRate)), bytes: pcm.length + 44, source: 'Bach BWV 565 opening (public domain) + original danse macabre, synthesized, no samples' }));
