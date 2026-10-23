import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUESTIONS, SECTION_LABELS, DEFAULT_EVENT } from '../src/shared/content.js';

test('conserva literalmente las 22 preguntas y todas las opciones entregadas por el usuario', () => {
  const source = readFileSync(new URL('./fixtures/preguntas-halloween.txt', import.meta.url), 'utf8');
  const supplied = [];
  for (const line of source.split(/\r?\n/)) {
    const prompt = line.match(/^(\d+)\. (.+\?)$/);
    if (prompt) supplied.push({ id: `q${prompt[1]}`, prompt: prompt[2], labels: [] });
    else if (line.startsWith('* ')) supplied.at(-1).labels.push(line.slice(2));
  }
  assert.equal(supplied.length, 22);
  assert.equal(QUESTIONS.length, 23);
  assert.deepEqual(QUESTIONS.slice(0, -1).map(q => ({ id: q.id, prompt: q.prompt, labels: q.options.map(o => o.label) })), supplied);
});

test('mantiene los seis bloques del archivo y el voto decisivo al final', () => {
  assert.deepEqual(Object.values(SECTION_LABELS).slice(0, -1), [
    'Sobre Guillermo, el eterno ganador sospechoso',
    'Sobre Andrea, la eterna incomprendida',
    'Sobre Antonia y su club de fans',
    'Preguntas para poner incómodos a los votantes',
    'Preguntas de cultura general familiar',
    'Mi favorita para cerrar el formulario',
  ]);
  assert.deepEqual(Object.keys(SECTION_LABELS).map(section => QUESTIONS.filter(q => q.section === section).length), [4, 4, 3, 4, 5, 2, 1]);
  const vote = QUESTIONS.at(-1);
  assert.equal(vote.id, 'vote');
  assert.deepEqual(vote.options.map(o => o.value), DEFAULT_EVENT.candidates.map(c => c.id));
});
