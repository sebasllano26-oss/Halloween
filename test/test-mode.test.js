import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { createRuntime } from '../src/server/runtime.js';
import { emptyState } from '../src/server/service.js';
import { createSheetsClient } from '../src/server/sheets.js';

test('las pruebas requieren administrador y nunca cuentan como votos ni aparecen en el CSV real', () => {
  const f = fixture(), ballot = { ...f.ballot(), name: 'PRUEBA Antonia' };
  assert.throws(() => f.service.handle('submitTest', ballot), error => error.code === 'AUTH_REQUIRED');
  f.service.handle('setStatus', { token: f.token, open: false });
  const result = f.service.handle('submitTest', { ...ballot, token: f.token });
  assert.equal(result.status, 'recorded'); assert.equal(result.receipt.test, true);
  const admin = f.service.handle('admin', { token: f.token });
  assert.equal(admin.total, 0); assert.equal(admin.tests.total, 1);
  assert.equal(admin.tests.responses[0].name, ballot.name);
  assert.equal(f.service.handle('reveal', { token: f.token }).kind, 'empty');
  assert.doesNotMatch(f.service.handle('export', { token: f.token }).csv, /PRUEBA Antonia/);
  assert.doesNotMatch(JSON.stringify(f.service.handle('public')), /PRUEBA Antonia|testResponses/);
});

test('un reintento de prueba recupera el mismo comprobante y valida todas las respuestas', () => {
  const f = fixture(), ballot = { ...f.ballot(), token: f.token };
  const first = f.service.handle('submitTest', ballot);
  assert.deepEqual(f.service.handle('submitTest', ballot), first);
  assert.equal(f.service.handle('admin', { token: f.token }).tests.total, 1);
  assert.throws(() => f.service.handle('submitTest', { ...ballot, answers: { ...ballot.answers, q1: '1' } }), error => error.code === 'ID_CONFLICT');
  assert.throws(() => f.service.handle('submitTest', { ...f.ballot(), token: f.token, answers: {} }), error => error.code === 'INVALID_ANSWERS');
});

test('reiniciar requiere administrador, elimina solo las pruebas y conserva los votos reales', () => {
  const f = fixture();
  const real = f.ballot(), trial = f.ballot();
  f.service.handle('submit', real);
  f.service.handle('submitTest', { ...trial, token: f.token });
  assert.throws(() => f.service.handle('resetTests', {}), error => error.code === 'AUTH_REQUIRED');
  assert.equal(f.service.handle('resetTests', { token: f.token }).removed, 1);
  const admin = f.service.handle('admin', { token: f.token });
  assert.equal(admin.tests.total, 0); assert.equal(admin.total, 1);
  assert.equal(admin.responses[0].id, real.id);
});

test('si no se puede borrar la copia de Google, reiniciar conserva las pruebas para reintentar', async () => {
  let state = emptyState(), unavailable = true, clears = 0;
  const repository = { async transaction(fn) { const next = structuredClone(state); const result = await fn(next); state = next; return result; } };
  const runtime = createRuntime({ repository, mode: 'test', initialPassword: 'Prueba privada de Halloween!', passwordIterations: 1000, sheetsClient: {
    async sync() {}, async syncTests() {},
    async clearTests(id) { clears++; assert.equal(id, 'abcdefghijklmnopqrstuvwx'); if (unavailable) throw new Error('Google no disponible'); },
  } });
  const { token } = await runtime.call('login', { password: 'Prueba privada de Halloween!' });
  state.sheet.spreadsheetId = 'abcdefghijklmnopqrstuvwx';
  await runtime.call('submitTest', { ...fixture().ballot(), token });
  await assert.rejects(runtime.call('resetTests', { token }), error => error.code === 'SHEETS_UNAVAILABLE');
  assert.equal(state.testResponses.length, 1);
  unavailable = false;
  const result = await runtime.call('resetTests', { token });
  assert.equal(result.removed, 1); assert.equal(state.testResponses.length, 0);
  assert.equal(state.responses.length, 0); assert.equal(clears, 2);
});

test('la prueba se conserva en la base aunque Google falle y se reintenta aparte de los votos', async () => {
  let state = emptyState(), failGoogle = true, testSyncs = 0;
  const repository = { async transaction(fn) { const next = structuredClone(state); const result = await fn(next); state = next; return result; } };
  const sheetsClient = {
    async sync() { return { pending: 0 }; },
    async syncTests(data) {
      testSyncs++;
      assert.equal(state.testResponses.length, 1, 'Guardar antes de llamar a Google');
      if (failGoogle) throw new Error('Google no disponible');
      data.sheet.testSyncedIds = data.testResponses.map(r => r.id);
      data.sheet.testLastError = null;
      return { pending: 0 };
    },
  };
  const runtime = createRuntime({ repository, mode: 'test', initialPassword: 'Prueba privada de Halloween!', passwordIterations: 1000, sheetsClient });
  const { token } = await runtime.call('login', { password: 'Prueba privada de Halloween!' });
  state.sheet.spreadsheetId = 'hoja-de-prueba-abcdefghijklmnop';
  const result = await runtime.call('submitTest', { ...fixture().ballot(), token });
  assert.equal(result.receipt.test, true); assert.equal(result.sheet.pending, 1);
  assert.equal(state.responses.length, 0); assert.equal(state.testResponses.length, 1);
  failGoogle = false;
  const admin = await runtime.call('admin', { token });
  assert.equal(admin.tests.sheet.pending, 0); assert.equal(admin.total, 0); assert.ok(testSyncs >= 2);
});

test('Google guarda las pruebas en su propia pestaña con 27 columnas y recupera un append interrumpido', async () => {
  const tabs = new Map([['Halloween_Respuestas', { title: 'Halloween_Respuestas', sheetId: 1, gridProperties: { columnCount: 27 } }]]);
  const rows = []; let headers = [], interrupted = true, appends = 0;
  const request = async (path, options = {}) => {
    const range = decodeURIComponent(path.split('/values/')[1]?.split(':append')[0].split(':clear')[0].split('?')[0] || '');
    if (path.includes('?fields=')) return { sheets: [...tabs.values()].map(properties => ({ properties })) };
    if (path.endsWith(':batchUpdate') && !path.includes('/values:')) {
      for (const op of options.json.requests) { const p = op.addSheet.properties; assert.equal(p.title, 'Halloween_Pruebas'); tabs.set(p.title, { ...p, sheetId: 2 }); }
      return {};
    }
    assert.match(range, /^Halloween_Pruebas!/, 'No tocar votos ni resultados reales');
    if (path.endsWith(':clear')) { assert.equal(range, 'Halloween_Pruebas!A2:AA'); rows.length = 0; return {}; }
    if (range.endsWith('A1:AA1')) {
      if (options.method === 'PUT') { assert.match(path, /valueInputOption=RAW/); headers = options.json.values[0]; return {}; }
      return { values: headers.length ? [headers] : [] };
    }
    if (range.endsWith('A2:A')) return { values: rows.map(r => [r[0]]) };
    if (path.includes(':append?')) {
      appends++; assert.match(path, /valueInputOption=RAW/); rows.push(...options.json.values);
      if (interrupted) { interrupted = false; throw new Error('Interrupción después de guardar'); }
      return {};
    }
    throw new Error('Ruta inesperada');
  };
  const f = fixture(); f.service.handle('submitTest', { ...f.ballot(), token: f.token });
  const data = f.state(); data.sheet = { spreadsheetId: 'abcdefghijklmnopqrstuvwx', testSyncedIds: [] };
  const client = createSheetsClient({ request });
  await assert.rejects(client.syncTests(data));
  assert.equal(rows.length, 1);
  await client.syncTests(data);
  assert.equal(rows.length, 1); assert.equal(appends, 1);
  assert.equal(tabs.get('Halloween_Pruebas').gridProperties.columnCount, 27);
  assert.equal(headers.length, 27); assert.equal(rows[0].length, 27);
  assert.equal(rows[0].at(-1), 'Antonia'); assert.match(rows[0][3], /^TEST-/);
  assert.equal(data.sheet.testSyncedIds.length, 1); assert.equal(data.responses.length, 0);
  await client.clearTests(data.sheet.spreadsheetId);
  assert.equal(rows.length, 0); assert.equal(headers.length, 27);
  assert.equal(tabs.has('Halloween_Respuestas'), true);
});
