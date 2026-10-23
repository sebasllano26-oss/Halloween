import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/rpc.js';

async function request({ method = 'POST', origin = 'https://halloween.example', type = 'application/json', body = { action: 'public' } } = {}) {
  const headers = {}; let result;
  const res = { setHeader: (name, value) => { headers[name] = value; }, end: value => { result = JSON.parse(value); } };
  await handler({ method, headers: { host: 'halloween.example', origin, 'content-type': type }, body }, res);
  return { status: res.statusCode, result, headers };
}
test('Vercel: rechaza solicitudes externas y métodos no permitidos antes de tocar la base de datos', async () => {
  assert.equal((await request({ method: 'GET' })).status, 405);
  assert.equal((await request({ origin: 'https://otro-sitio.invalid' })).status, 403);
  assert.equal((await request({ type: 'text/plain' })).status, 403);
});
test('Vercel: la portada sigue mostrando el estado pendiente cuando falta configurar el despliegue', async () => {
  const previous = process.env.DATABASE_URL; delete process.env.DATABASE_URL;
  try {
    const response = await request(); assert.equal(response.status, 200); assert.equal(response.result.data.configured, false);
    assert.equal(response.result.data.questions.length, 23); assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal((await request({ body: { action: 'login', payload: { password: 'no es una clave real' } } })).result.error.code, 'NOT_READY');
  } finally { if (previous !== undefined) process.env.DATABASE_URL = previous; }
});
