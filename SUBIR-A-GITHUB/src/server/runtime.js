import { randomUUID } from 'node:crypto';
import { createService, AppError } from './service.js';
import { createGoogleRequest, createSheetsClient, parseSpreadsheetId } from './sheets.js';

const SUGGESTED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_ypZV39tfxp4yRpLB3uYyQP7s9r3QhFGP0D0sY04bfs/edit';

export function createRuntime({ repository, mode = 'vercel', initialPassword, passwordIterations, sheetsClient, serviceEmail = '', privateKey = '' }) {
  const request = createGoogleRequest({ email: serviceEmail, privateKey });
  const sheets = sheetsClient || (request ? createSheetsClient({ request }) : null);
  const sheetStatus = state => ({
    connected: Boolean(state.sheet?.spreadsheetId), url: state.sheet?.url || null, suggestedUrl: SUGGESTED_SHEET_URL, serviceEmail,
    credentialsConfigured: Boolean(sheets), pending: state.responses.filter(r => !state.sheet?.syncedIds?.includes(r.id)).length,
    lastSyncAt: state.sheet?.lastSyncAt || null, lastError: state.sheet?.lastError || null,
  });
  async function transact(work) {
    let error;
    const value = await repository.transaction(async state => {
      state.sheet ||= { spreadsheetId: null, url: null, syncedIds: [], lastSyncAt: null, lastError: null };
      const service = createService({ store: { transaction: fn => fn(state) }, mode, randomId: randomUUID, passwordIterations, sheetUrl: state.sheet.url });
      if (initialPassword && !state.auth) service.initialize(initialPassword);
      if (state.auth) delete state.auth.sourceDigest;
      try { return await work(state, service); }
      catch (err) { if (!(err instanceof AppError)) throw err; error = err; return null; }
    });
    if (error) throw error;
    return value;
  }
  async function syncState(state, strict = false) {
    if (!state.sheet.spreadsheetId || !sheets) {
      if (strict) throw new AppError('SHEETS_NOT_CONFIGURED', 'Enlaza una hoja y configura las credenciales de Google antes de sincronizar.');
      return { synced: state.sheet.syncedIds.length, pending: state.responses.length - state.sheet.syncedIds.length };
    }
    try { return await sheets.sync(state); }
    catch (error) {
      state.sheet.lastError = error instanceof AppError ? error.message : 'Google no respondió. Los votos siguen guardados; vuelve a sincronizar desde este panel.';
      if (strict) throw new AppError(error.code || 'SHEETS_UNAVAILABLE', state.sheet.lastError);
      return { synced: state.sheet.syncedIds.length, pending: state.responses.length - state.sheet.syncedIds.length };
    }
  }
  return {
    setup(password) { if (mode !== 'local' && mode !== 'test') throw new AppError('FORBIDDEN', 'La clave inicial se configura en Vercel.'); return transact((state, service) => service.initialize(password)); },
    async call(action, payload = {}) {
      const value = await transact(async (state, service) => {
        if (action === 'connectSheet' || action === 'syncSheet') {
          service.handle('admin', { token: payload.token });
          if (action === 'syncSheet') return await syncState(state, true);
          const id = parseSpreadsheetId(payload.url);
          if (!sheets) throw new AppError('SHEETS_NOT_CONFIGURED', 'Configura GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY en Vercel.');
          const connection = await sheets.connect(id, state.config);
          state.sheet = { ...connection, syncedIds: [], lastSyncAt: null, lastError: null };
          await syncState(state, true); return { connected: true, ...sheetStatus(state) };
        }
        const data = service.handle(action, payload);
        if (action === 'admin') { await syncState(state); data.sheet = sheetStatus(state); }
        return data;
      });
      // Commit the ballot before attempting Google. A failure never reverses a confirmed vote.
      if (['submit', 'setStatus', 'reveal', 'createInvites', 'updateEvent'].includes(action)) {
        try { await transact(state => syncState(state)); } catch { /* Durable responses remain available for retry. */ }
      }
      return value;
    },
  };
}
