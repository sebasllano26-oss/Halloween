import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createPostgresRepository } from '../src/server/repository.js';
import { createRuntime } from '../src/server/runtime.js';
import { randomUUID } from 'node:crypto';
import { QUESTIONS } from '../src/shared/content.js';

test('PostgreSQL: esquema, transacciones y votos atómicos en un motor PostgreSQL local WASM', async t => {
  const db = new PGlite(); t.after(() => db.close());
  let queue = Promise.resolve();
  const pool = { async connect() {
    let release; const previous = queue; queue = new Promise(resolve => { release = resolve; }); await previous;
    return { query: (query, values) => db.query(query, values), release };
  } };
  const repository = createPostgresRepository(pool);
  const runtime = createRuntime({ repository, mode: 'test', initialPassword: 'La clave segura del anfitrion!', passwordIterations: 1000 });
  const { token } = await runtime.call('login', { password: 'La clave segura del anfitrion!' });
  const admin = await runtime.call('admin', { token });
  assert.equal(admin.sheet.suggestedUrl, 'https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit');
  assert.equal(admin.sheet.connected, false, 'Sugerir la hoja no debe indicar que ya tiene permiso para escribir');
  assert.equal(JSON.stringify(await runtime.call('public')).includes('1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs'), false);
  const code = (await runtime.call('createInvites', { token, count: 1 })).invitations[0].code;
  const payload = { id: randomUUID(), name: 'Invitado PostgreSQL', code, answers: Object.fromEntries(QUESTIONS.map(q => [q.id, q.id === 'vote' ? 'antonia' : '0'])) };
  const results = await Promise.allSettled([runtime.call('submit', payload), runtime.call('submit', { ...payload, id: randomUUID() })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'INVITE_USED');
  const reloaded = createRuntime({ repository: createPostgresRepository(pool), mode: 'test', passwordIterations: 1000 });
  assert.equal((await reloaded.call('admin', { token })).total, 1);
  const stored = (await db.query('SELECT state FROM public.halloween_app_state WHERE id = $1', ['main'])).rows[0].state;
  assert.equal(stored.auth.sourceDigest, undefined, 'No debe conservar una huella rápida que evite el coste de PBKDF2');
  await assert.rejects(reloaded.call('connectSheet', { token: 'falso', url: 'https://docs.google.com/spreadsheets/d/no' }), error => error.code === 'AUTH_REQUIRED');
  await assert.rejects(reloaded.call('syncSheet', { token: 'falso' }), error => error.code === 'AUTH_REQUIRED');
  for (let i = 0; i < 5; i++) await assert.rejects(reloaded.call('login', { password: 'equivocada' }), error => error.code === 'LOGIN_INVALID');
  await assert.rejects(runtime.call('login', { password: 'La clave segura del anfitrion!' }), error => error.code === 'LOGIN_LOCKED');
});
