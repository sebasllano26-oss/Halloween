import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, PASSWORD } from './helpers.js';

function rejectsCode(fn, code) { assert.throws(fn, err => err.code === code); }
test('la configuración pública no filtra votos, invitaciones ni credenciales', () => {
  const f = fixture(); f.codes();
  const value = f.service.handle('public');
  assert.equal(value.questions.length, 23);
  for (const key of ['auth', 'responses', 'invitations', 'sessions', 'total']) assert.equal(value[key], undefined);
  assert.equal(JSON.stringify(value).includes(f.token), false);
});
test('registra todas las respuestas y devuelve un comprobante del servidor', () => {
  const f = fixture(); const code = f.codes()[0];
  const response = f.service.handle('submit', f.ballot(code));
  assert.equal(response.status, 'recorded');
  assert.equal(f.state().responses.length, 1);
  assert.equal(Object.keys(f.state().responses[0].answers).length, 23);
  assert.ok(response.receipt.id); assert.match(response.receipt.createdAt, /2026-10-22/);
});
test('un reintento idéntico devuelve el mismo comprobante sin otro voto', () => {
  const f = fixture(); const payload = f.ballot(f.codes()[0]);
  const first = f.service.handle('submit', payload);
  f.service.handle('setStatus', { token: f.token, open: false });
  assert.deepEqual(f.service.handle('submit', payload), first);
  assert.equal(f.state().responses.length, 1);
});
test('rechaza reutilizar el identificador con otras respuestas', () => {
  const f = fixture(); const payload = f.ballot(f.codes()[0]); f.service.handle('submit', payload);
  rejectsCode(() => f.service.handle('submit', { ...payload, name: 'Otra persona' }), 'ID_CONFLICT');
});
test('el mismo nombre no permite votar desde un segundo dispositivo', () => {
  const f = fixture(); const code = f.codes()[0]; f.service.handle('submit', f.ballot(code));
  rejectsCode(() => f.service.handle('submit', f.ballot(code)), 'VOTE_ALREADY_RECORDED');
});
test('el voto público ignora códigos antiguos y conserva compatibilidad de invitaciones anteriores', () => {
  const f = fixture(); const code = f.codes()[0];
  assert.equal(f.service.handle('submit', f.ballot('NO-EXISTE')).status, 'recorded');
  assert.deepEqual(f.service.handle('checkInvite', { code }), { valid: true });
});
test('rechaza preguntas omitidas, opciones falsas y candidatos inventados', () => {
  const f = fixture(); const ballot = f.ballot(f.codes()[0]);
  const answers = { ...ballot.answers }; delete answers.q1;
  rejectsCode(() => f.service.handle('submit', { ...ballot, answers }), 'INVALID_ANSWERS');
  rejectsCode(() => f.service.handle('submit', { ...ballot, answers: { ...ballot.answers, q1: '999' } }), 'INVALID_ANSWERS');
  rejectsCode(() => f.service.handle('submit', { ...ballot, answers: { ...ballot.answers, vote: 'hacker' } }), 'INVALID_ANSWERS');
  assert.equal(f.state().responses.length, 0);
});
test('rechaza un nuevo envío después de cerrar la urna', () => {
  const f = fixture(); const ballot = f.ballot(f.codes()[0]);
  f.service.handle('setStatus', { token: f.token, open: false });
  rejectsCode(() => f.service.handle('submit', ballot), 'EVENT_CLOSED');
});
test('exige la última pregunta nueva y describe el total actual al faltar respuestas', () => {
  const f = fixture(); const ballot = f.ballot(f.codes()[0]);
  const answers = { ...ballot.answers }; delete answers.q22;
  assert.throws(() => f.service.handle('submit', { ...ballot, answers }), error => error.code === 'INVALID_ANSWERS' && /23 preguntas/.test(error.message));
  assert.equal(f.state().responses.length, 0);
});
test('todas las acciones de administración exigen sesión válida', () => {
  const f = fixture();
  for (const action of ['admin', 'createInvites', 'setStatus', 'updateEvent', 'reveal', 'export', 'logout']) {
    rejectsCode(() => f.service.handle(action, { token: 'falso', count: 1, open: false }), 'AUTH_REQUIRED');
  }
});
test('rechaza claves equivocadas y limita intentos repetidos', () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) rejectsCode(() => f.service.handle('login', { password: 'incorrecta' }), 'LOGIN_INVALID');
  rejectsCode(() => f.service.handle('login', { password: PASSWORD }), 'LOGIN_LOCKED');
  f.advance(16 * 60 * 1000);
  assert.ok(f.login());
});
test('las sesiones vencen y el cierre de sesión revoca el token', () => {
  const f = fixture(); f.service.handle('logout', { token: f.token });
  rejectsCode(() => f.service.handle('admin', { token: f.token }), 'AUTH_REQUIRED');
  const other = f.login(); f.advance(2 * 60 * 60 * 1000 + 1);
  rejectsCode(() => f.service.handle('admin', { token: other }), 'AUTH_REQUIRED');
});
test('no revela el ganador con la urna abierta', () => {
  const f = fixture(); rejectsCode(() => f.service.handle('reveal', { token: f.token }), 'EVENT_OPEN');
});
test('sin votos no inventa un ganador', () => {
  const f = fixture(); f.service.handle('setStatus', { token: f.token, open: false });
  const result = f.service.handle('reveal', { token: f.token });
  assert.equal(result.total, 0); assert.equal(result.kind, 'empty'); assert.deepEqual(result.winners, []);
});
test('la mayoría elige ganador y las preguntas de humor no cuentan', () => {
  const f = fixture(); const codes = f.codes(3);
  ['andrea', 'andrea', 'antonia'].forEach((vote, i) => f.service.handle('submit', f.ballot(codes[i], vote)));
  f.service.handle('setStatus', { token: f.token, open: false });
  const result = f.service.handle('reveal', { token: f.token });
  assert.equal(result.kind, 'winner'); assert.equal(result.winners[0].id, 'andrea'); assert.equal(result.total, 3);
  assert.equal(result.ranking.find(x => x.id === 'andrea').votes, 2);
});
test('muestra todos los empatados y reabrir exige volver a cerrar', () => {
  const f = fixture(); const codes = f.codes(2);
  f.service.handle('submit', f.ballot(codes[0], 'antonia')); f.service.handle('submit', f.ballot(codes[1], 'guillermo'));
  f.service.handle('setStatus', { token: f.token, open: false });
  const result = f.service.handle('reveal', { token: f.token });
  assert.equal(result.kind, 'tie'); assert.equal(result.winners.length, 2);
  f.service.handle('setStatus', { token: f.token, open: true });
  rejectsCode(() => f.service.handle('reveal', { token: f.token }), 'EVENT_OPEN');
});
test('no cambia los participantes después de recibir votos', () => {
  const f = fixture(); f.service.handle('submit', f.ballot(f.codes()[0]));
  rejectsCode(() => f.service.handle('updateEvent', { token: f.token, title: 'Otro título', edition: '2026', theme: 'Selva', candidates: [{ id: 'otro', name: 'Otro' }] }), 'CANDIDATES_LOCKED');
});
test('exporta respuestas como CSV seguro y escapado', () => {
  const f = fixture(); const ballot = f.ballot(f.codes()[0]); ballot.name = '=SUM(1,2)';
  f.service.handle('submit', ballot);
  const { csv } = f.service.handle('export', { token: f.token });
  assert.match(csv, /'\=SUM\(1,2\)/); assert.match(csv, /El mejor disfraz/); assert.match(csv, /Antonia/);
});
test('los límites de invitaciones y operaciones desconocidas se validan', () => {
  const f = fixture();
  rejectsCode(() => f.service.handle('createInvites', { token: f.token, count: 10000 }), 'INVALID_INPUT');
  rejectsCode(() => f.service.handle('__proto__', {}), 'UNKNOWN_ACTION');
});
