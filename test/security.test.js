import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync } from 'node:crypto';
import { createPasswordRecord, verifyPassword, digest, safeCsvCell } from '../src/server/security.js';
import { QUESTIONS, DEFAULT_EVENT } from '../src/shared/content.js';

test('la derivación coincide con PBKDF2-SHA256 de Node', () => {
  const record = createPasswordRecord('Una clave con acentos: murciélago', 'salt1234', 1000);
  assert.equal(record.hash, pbkdf2Sync('Una clave con acentos: murciélago', 'salt1234', 1000, 32, 'sha256').toString('hex'));
  assert.equal(verifyPassword('Una clave con acentos: murciélago', record), true);
  assert.equal(verifyPassword('equivocada', record), false);
  assert.equal(digest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('los textos no se convierten en fórmulas al exportar', () => {
  for (const value of ['=SUM(1,2)', '+cmd', '-1+2', '@SUM(1)', '  =2+2', '\t=2+2']) assert.match(safeCsvCell(value), /^'/);
  assert.equal(safeCsvCell('Antonia'), 'Antonia');
});
test('conserva el voto al mejor disfraz y los tres candidatos del evento', () => {
  assert.equal(QUESTIONS.filter(q => q.section === 'vote').length, 1);
  assert.equal(QUESTIONS.at(-1).id, 'vote');
  assert.deepEqual(DEFAULT_EVENT.candidates.map(c => c.name), ['Antonia', 'Guillermo', 'Andrea']);
});
