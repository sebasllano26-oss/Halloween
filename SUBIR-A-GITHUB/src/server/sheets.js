import { JWT } from 'google-auth-library';
import { AppError, tally } from './service.js';
import { QUESTIONS } from '../shared/content.js';

export const TAB = { responses: 'Halloween_Respuestas', invites: 'Halloween_Invitaciones', results: 'Halloween_Resultados', event: 'Halloween_Evento' };
const HEADERS = ['Comprobante', 'Fecha del servidor (UTC)', 'Nombre', 'Invitación', ...QUESTIONS.map(q => q.id === 'vote' ? 'El mejor disfraz' : q.prompt)];
function columnName(number) {
  let name = '';
  while (number > 0) { number--; name = String.fromCharCode(65 + number % 26) + name; number = Math.floor(number / 26); }
  return name;
}
const LAST_RESPONSE_COLUMN = columnName(HEADERS.length);
export function parseSpreadsheetId(value) {
  const text = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{20,100}$/.test(text)) return text;
  try {
    const url = new URL(text);
    const match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,100})(?:\/|$)/);
    if (url.protocol === 'https:' && url.hostname === 'docs.google.com' && !url.username && !url.password && match) return match[1];
  } catch { /* Report a single clear validation error below. */ }
  throw new AppError('INVALID_SHEET', 'Pega un enlace válido de Google Sheets.');
}
export function createGoogleRequest({ email, privateKey, fetchImpl = fetch }) {
  if (!email || !privateKey) return null;
  const auth = new JWT({ email, key: privateKey.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/spreadsheets'], transporterOptions: { timeout: 8000, retry: false } });
  return async (path, { method = 'GET', json } = {}) => {
    let token;
    try { token = (await auth.getAccessToken()).token; } catch { throw new AppError('SHEETS_CREDENTIALS', 'Google no aceptó las credenciales del servidor. Revisa la cuenta de servicio en Vercel.'); }
    const response = await fetchImpl('https://sheets.googleapis.com/v4' + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: json === undefined ? undefined : JSON.stringify(json), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new AppError(response.status === 403 || response.status === 404 ? 'SHEETS_PERMISSION' : 'SHEETS_UNAVAILABLE', response.status === 403 || response.status === 404 ? 'No se puede escribir en esa hoja. Verifica que esté compartida como Editor con la cuenta de servicio y que Google Sheets API esté habilitada.' : 'Google no respondió correctamente. Los votos siguen guardados y puedes reintentar la sincronización.');
    return response.status === 204 ? {} : await response.json();
  };
}
export function createSheetsClient({ request, now = () => new Date().toISOString() }) {
  const values = (id, range) => `/spreadsheets/${id}/values/${encodeURIComponent(range)}`;
  const batch = (id, data) => request(`/spreadsheets/${id}/values:batchUpdate`, { method: 'POST', json: { valueInputOption: 'RAW', data } });
  return {
    async connect(id, config) {
      const metadata = await request(`/spreadsheets/${id}?fields=sheets.properties`);
      const existing = new Set((metadata.sheets || []).map(s => s.properties.title));
      const responseTab = metadata.sheets?.find(s => s.properties.title === TAB.responses)?.properties;
      const responseColumns = responseTab?.gridProperties?.columnCount ?? HEADERS.length;
      // Existing app-named tabs must belong to this schema before any data is written.
      if (existing.has(TAB.responses)) {
        const first = await request(values(id, `${TAB.responses}!A1:${columnName(Math.min(HEADERS.length, responseColumns))}1`));
        if (first.values?.length && JSON.stringify(first.values[0]) !== JSON.stringify(HEADERS)) throw new AppError('SHEET_CONFLICT', 'La pestaña Halloween_Respuestas ya contiene otra estructura. Usa otra hoja para conservar esos datos.');
      }
      const missing = Object.values(TAB).filter(title => !existing.has(title));
      const requests = missing.map(title => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1, ...(title === TAB.responses ? { columnCount: HEADERS.length } : {}) } } } }));
      if (responseTab && responseColumns < HEADERS.length) requests.push({ updateSheetProperties: { properties: { sheetId: responseTab.sheetId, gridProperties: { columnCount: HEADERS.length } }, fields: 'gridProperties.columnCount' } });
      if (requests.length) await request(`/spreadsheets/${id}:batchUpdate`, { method: 'POST', json: { requests } });
      await batch(id, [
        { range: `${TAB.responses}!A1:${LAST_RESPONSE_COLUMN}1`, values: [HEADERS] },
        { range: TAB.invites + '!A1:D1', values: [['Código', 'Invitado', 'Creada (UTC)', 'Estado']] },
        { range: TAB.results + '!A1:D1', values: [['Participante', 'Votos', 'Porcentaje', 'Urna']] },
        { range: TAB.event + '!A1:B1', values: [['Campo', 'Valor']] },
      ]);
      return { spreadsheetId: id, url: `https://docs.google.com/spreadsheets/d/${id}/edit` };
    },
    async sync(state) {
      const id = state.sheet?.spreadsheetId;
      if (!id) return { synced: 0, pending: state.responses.length };
      const recorded = await request(values(id, TAB.responses + '!A2:A'));
      const known = new Set((recorded.values || []).map(row => String(row[0])));
      const pending = state.responses.filter(r => !known.has(r.id));
      if (pending.length) {
        const rows = pending.map(r => [r.id, r.createdAt, r.name, r.code, ...QUESTIONS.map(q => q.id === 'vote' ? state.config.candidates.find(c => c.id === r.answers.vote)?.name || '' : q.options.find(o => o.value === r.answers[q.id])?.label || '')]);
        await request(values(id, `${TAB.responses}!A:${LAST_RESPONSE_COLUMN}`) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', { method: 'POST', json: { values: rows } });
      }
      const result = tally(state), used = new Set(state.responses.map(r => r.code));
      // Fixed-size ranges clear stale result rows when candidates change before voting.
      const ranking = result.ranking.map(c => [c.name, c.votes, c.percentage + '%', state.config.open ? 'Abierta' : 'Cerrada']);
      while (ranking.length < 12) ranking.push(['', '', '', '']);
      ranking.push(['TOTAL', result.total, result.total ? '100%' : '0%', state.config.open ? 'Abierta' : 'Cerrada']);
      const data = [
        { range: TAB.results + '!A2:D14', values: ranking },
        { range: TAB.event + '!A2:B6', values: [['Evento', state.config.title], ['Edición', state.config.edition], ['Tema', state.config.theme], ['Estado', state.config.open ? 'Abierta' : 'Cerrada'], ['Revelado (UTC)', state.config.revealedAt || 'Todavía no']] },
      ];
      if (state.invitations.length) data.push({ range: TAB.invites + '!A2:D' + (state.invitations.length + 1), values: state.invitations.map(i => [i.code, i.name, i.createdAt, used.has(i.code) ? 'Utilizada' : 'Disponible']) });
      await batch(id, data);
      state.sheet.syncedIds = state.responses.map(r => r.id); state.sheet.lastSyncAt = now(); state.sheet.lastError = null;
      return { synced: state.sheet.syncedIds.length, pending: 0 };
    },
  };
}
