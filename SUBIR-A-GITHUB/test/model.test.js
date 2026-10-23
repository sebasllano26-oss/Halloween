import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, chooseAnswer, nextQuestion, previousQuestion, restoreDraft, isComplete, reconcileDraft, invitationCode } from '../src/client/model.js';
import { QUESTIONS } from '../src/shared/content.js';

test('no avanza sin respuesta y permite volver sin perder selecciones', () => {
  let draft = createDraft();
  assert.equal(nextQuestion(draft, QUESTIONS).index, 0);
  draft = chooseAnswer(draft, 'q1', '0'); draft = nextQuestion(draft, QUESTIONS);
  assert.equal(draft.index, 1); draft = previousQuestion(draft);
  assert.equal(draft.index, 0); assert.equal(draft.answers.q1, '0');
});
test('solo está listo para enviar con las 23 respuestas válidas', () => {
  let draft = createDraft(); assert.equal(isComplete(draft, QUESTIONS), false);
  for (const q of QUESTIONS) draft = chooseAnswer(draft, q.id, q.id === 'vote' ? 'antonia' : '0');
  assert.equal(isComplete(draft, QUESTIONS), true);
});
test('recupera las respuestas finales y descarta borradores del cuestionario anterior', () => {
  const draft = { ...createDraft(), index: 23, name: 'Invitada', answers: { q22: '3', vote: 'andrea' } };
  assert.equal(restoreDraft(JSON.stringify(draft), '2026').index, 23);
  assert.deepEqual(restoreDraft(JSON.stringify({ ...draft, version: 1 }), '2026'), createDraft());
});
test('recupera el avance válido y descarta datos corruptos o de otra edición', () => {
  const draft = { ...createDraft('2026'), name: 'Invitado', index: 4, answers: { q1: '1' } };
  assert.equal(restoreDraft(JSON.stringify(draft), '2026').name, 'Invitado');
  assert.equal(restoreDraft('no json', '2026').index, 0);
  assert.equal(restoreDraft(JSON.stringify(draft), '2027').index, 0);
  assert.equal(restoreDraft(JSON.stringify({ ...draft, index: -20 }), '2026').index, 0);
});
test('retoma en la primera respuesta omitida y descarta opciones que dejaron de existir', () => {
  const draft = { ...createDraft(), index: 18, name: 'Invitado', code: 'CODIGO', answers: { q1: '0', q2: '999', q3: '0' } };
  const recovered = reconcileDraft(draft, QUESTIONS, '2026');
  assert.equal(recovered.index, 1); assert.equal(recovered.answers.q2, undefined); assert.equal(recovered.answers.q1, '0');
  assert.equal(reconcileDraft(draft, QUESTIONS, '2027').edition, '2027');
});
test('no altera las respuestas de un envío cuya confirmación está pendiente', () => {
  const draft = { ...createDraft(), pending: true, index: QUESTIONS.length, answers: { q1: '0' } };
  assert.deepEqual(reconcileDraft(draft, QUESTIONS, '2026'), draft);
});
test('acepta una invitación pegada como enlace o como código', () => {
  assert.equal(invitationCode('https://familia.example/?invite=ABC-DEF'), 'ABC-DEF');
  assert.equal(invitationCode(' ABC-DEF '), 'ABC-DEF');
});
