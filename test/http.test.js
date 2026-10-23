import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../scripts/dev.mjs';
import { QUESTIONS } from '../src/shared/content.js';
import { randomUUID } from 'node:crypto';

test('HTTP real: persistencia, solicitudes simultáneas, sesión y rechazo de origen externo', async t => {
  const dataDirectory = mkdtempSync(join(tmpdir(), 'halloween-http-'));
  let server;
  t.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); rmSync(dataDirectory, { recursive: true, force: true }); });
  async function start() {
    server = createLocalServer({ dataDirectory, passwordIterations: 1000 });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}`;
  }
  let url = await start();
  const demo = await fetch(url + '/demo');
  assert.equal(demo.status, 200);
  const demoHtml = await demo.text();
  assert.match(demoHtml, /data-runtime="demo"/);
  assert.match(demoHtml, /src="\/demo\/assets\/app.js"/);
  assert.doesNotMatch(demoHtml, /data-runtime="local"/);
  const artwork = await fetch(url + '/assets/mansion-v2-mobile.webp');
  assert.equal(artwork.status, 200); assert.equal(artwork.headers.get('content-type'), 'image/webp');
  const realHtml = await (await fetch(url)).text(); assert.match(realHtml, /data-runtime="local"/);
  const post = async (path, body, origin = url) => {
    const res = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  assert.equal((await post('/api/setup', { password: 'Una clave local de pruebas!' })).body.ok, true);
  assert.equal((await post('/api/setup', { password: 'Segunda clave que no sirve' })).body.error.code, 'ALREADY_CONFIGURED');
  const login = await post('/api/rpc', { action: 'login', payload: { password: 'Una clave local de pruebas!' } });
  const token = login.body.data.token;
  const payload = { id: randomUUID(), name: 'Invitado HTTP', answers: Object.fromEntries(QUESTIONS.map(q => [q.id, q.id === 'vote' ? 'antonia' : '0'])) };
  const attempts = await Promise.all([post('/api/rpc', { action: 'submit', payload }), post('/api/rpc', { action: 'submit', payload: { ...payload, id: randomUUID() } })]);
  assert.equal(attempts.filter(x => x.body.ok).length, 1);
  assert.equal(attempts.find(x => !x.body.ok).body.error.code, 'VOTE_ALREADY_RECORDED');
  assert.equal((await post('/api/rpc', { action: 'admin', payload: { token } })).body.data.total, 1);
  assert.equal((await post('/api/rpc', { action: 'public' }, 'https://otro-sitio.invalid')).status, 403);
  assert.equal((await post('/api/rpc', { action: 'admin', payload: { token: 'falso' } })).body.error.code, 'AUTH_REQUIRED');
  await new Promise(resolve => server.close(resolve)); server = null;
  url = await start();
  assert.equal((await post('/api/rpc', { action: 'admin', payload: { token } })).body.data.total, 1);
});
