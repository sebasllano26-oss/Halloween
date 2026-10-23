import test from 'node:test';
import assert from 'node:assert/strict';
import { createSheetsClient, parseSpreadsheetId } from '../src/server/sheets.js';
import { emptyState } from '../src/server/service.js';
import { QUESTIONS } from '../src/shared/content.js';

const ID = 'abcdefghijklmnopqrstuvwxyz0123456789';
function fakeGoogle() {
  const tabs = new Map(), rows = [], reads = [], writes = []; let headers = []; let uncertain = false; let appends = 0;
  const request = async (path, options = {}) => {
    assert.equal(path.startsWith('/spreadsheets/'), true);
    const range = decodeURIComponent(path.split('/values/')[1]?.split(':append')[0] || '');
    if (path.includes('?fields=')) return { sheets: [...tabs.values()].map(properties => ({ properties })) };
    if (path.endsWith(':batchUpdate') && !path.includes('/values:')) {
      for (const r of options.json.requests || []) {
        if (r.addSheet) {
          const properties = structuredClone(r.addSheet.properties);
          properties.sheetId = tabs.size + 1;
          properties.gridProperties.columnCount ??= 26;
          tabs.set(properties.title, properties);
        }
        if (r.updateSheetProperties) {
          const properties = r.updateSheetProperties.properties;
          [...tabs.values()].find(tab => tab.sheetId === properties.sheetId).gridProperties.columnCount = properties.gridProperties.columnCount;
        }
      }
      return {};
    }
    if (path.endsWith('/values:batchUpdate')) {
      writes.push(...options.json.data.map(data => data.range));
      assert.equal(options.json.valueInputOption, 'RAW');
      for (const data of options.json.data) if (data.range.startsWith('Halloween_Respuestas!A1:')) headers = data.values[0];
      return {};
    }
    if (path.includes(':append?')) { assert.match(path, /valueInputOption=RAW/); writes.push(range); appends++; rows.push(...options.json.values); if (uncertain) { uncertain = false; throw new Error('Conexión interrumpida después de guardar'); } return { updates: { updatedRows: options.json.values.length } }; }
    reads.push(range);
    if (range === 'Halloween_Respuestas!A2:A') return { values: rows.map(row => [row[0]]) };
    if (range.startsWith('Halloween_Respuestas!A1:')) return { values: headers.length ? [headers] : [] };
    throw new Error('Ruta inesperada: ' + path);
  };
  return { request, rows, tabs, reads, writes, appends: () => appends, uncertain() { uncertain = true; }, emptyNarrow() { tabs.set('Halloween_Respuestas', { title: 'Halloween_Respuestas', sheetId: 42, gridProperties: { columnCount: 26 } }); }, incompatible() { tabs.set('Halloween_Respuestas', { title: 'Halloween_Respuestas', sheetId: 42, gridProperties: { columnCount: 26 } }); headers = ['Datos de otro proyecto']; } };
}
function state() {
  const state = emptyState(); state.sheet = { spreadsheetId: ID, syncedIds: [], lastSyncAt: null, lastError: null };
  state.responses.push({ id: 'voto1234567890', name: '=FORMULA()', code: 'TEST', createdAt: '2026-10-22T23:00:00.000Z', answers: Object.fromEntries(QUESTIONS.map(q => [q.id, q.id === 'vote' ? 'andrea' : '0'])) });
  return state;
}
test('interpreta únicamente URLs de Google Sheets o identificadores válidos', () => {
  assert.equal(parseSpreadsheetId(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=0`), ID);
  assert.equal(parseSpreadsheetId(ID), ID);
  assert.throws(() => parseSpreadsheetId('https://servidor-malicioso.invalid/hoja'));
});
test('la API directa copia las 23 respuestas hasta AA sin truncar las últimas preguntas', async () => {
  const google = fakeGoogle(), client = createSheetsClient({ request: google.request }), data = state();
  await client.connect(ID, data.config); await client.sync(data);
  assert.equal(google.tabs.size, 4); assert.equal(google.rows.length, 1);
  assert.equal(google.tabs.get('Halloween_Respuestas').gridProperties.columnCount, 27);
  assert.equal(google.rows[0][2], '=FORMULA()'); assert.equal(google.rows[0].length, 27);
  assert.deepEqual(google.rows[0].slice(4, -1), QUESTIONS.slice(0, -1).map(q => q.options[0].label));
  assert.ok(google.writes.includes('Halloween_Respuestas!A1:AA1'));
  assert.ok(google.writes.includes('Halloween_Respuestas!A:AA'));
  await client.connect(ID, data.config);
  assert.ok(google.reads.includes('Halloween_Respuestas!A1:AA1'));
  assert.equal(google.rows[0].at(-1), 'Andrea'); assert.equal(data.sheet.syncedIds.length, 1);
  await client.sync(data); assert.equal(google.appends(), 1);
});
test('amplía una pestaña vacía de 26 columnas antes de guardar las 23 respuestas', async () => {
  const google = fakeGoogle(), client = createSheetsClient({ request: google.request }), data = state();
  google.emptyNarrow();
  await client.connect(ID, data.config); await client.sync(data);
  assert.ok(google.reads.includes('Halloween_Respuestas!A1:Z1'));
  assert.equal(google.tabs.get('Halloween_Respuestas').gridProperties.columnCount, 27);
  assert.equal(google.rows[0].length, 27);
});
test('un timeout después de append se recupera por comprobante sin duplicar filas', async () => {
  const google = fakeGoogle(), client = createSheetsClient({ request: google.request }), data = state();
  await client.connect(ID, data.config); google.uncertain(); await assert.rejects(client.sync(data));
  assert.equal(google.rows.length, 1); assert.equal(data.sheet.syncedIds.length, 0);
  await client.sync(data); assert.equal(google.rows.length, 1); assert.equal(google.appends(), 1);
});
test('no sobreescribe pestañas con encabezados de otro proyecto', async () => {
  const google = fakeGoogle(), client = createSheetsClient({ request: google.request }); google.incompatible();
  await assert.rejects(client.connect(ID, state().config), error => error.code === 'SHEET_CONFLICT');
});
