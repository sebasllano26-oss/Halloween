import { createService, emptyState } from '../server/service.js';
import { submissionId } from './model.js';
import { QUESTIONNAIRE_VERSION } from '../shared/content.js';
const KEY = `halloween-demostracion-${QUESTIONNAIRE_VERSION}`;
const PASSWORD = 'Clave ficticia solo para esta demostracion!';
export const DEMO_CODE = 'HALLOWEEN-DEMO';
let fallback = null;
const store = { transaction(fn) {
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* Storage can be unavailable inside a private iframe. */ }
  state ||= fallback || emptyState();
  const result = fn(state); fallback = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* In-memory demo still works. */ }
  return result;
} };
const service = createService({ store, randomId: () => submissionId(), mode: 'demo', passwordIterations: 1000 });
function initializeDemo() {
  store.transaction(state => { if (!state.invitations.length) state.invitations.push({ code: DEMO_CODE.replace(/-/g, ''), name: 'Invitación de prueba', createdAt: new Date().toISOString() }); });
  if (!service.handle('public').configured) service.initialize(PASSWORD);
}
initializeDemo();
export function callDemo(action, payload) { return service.handle(action, payload); }
export function loginDemo() { return service.handle('login', { password: PASSWORD }); }
export function resetDemo() {
  try { localStorage.removeItem(KEY); } catch {}
  fallback = null; initializeDemo();
}
