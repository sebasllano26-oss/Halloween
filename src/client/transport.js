const runtime = document.documentElement.dataset.runtime;
let demoPromise;
export class RemoteError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function unwrap(result) {
  if (!result || result.ok !== true) throw new RemoteError(result?.error?.code || 'SERVER_ERROR', result?.error?.message || 'No se pudo confirmar la operación. Vuelve a intentarlo.');
  return result.data;
}
export async function rpc(action, payload = {}) {
  if (__ALLOW_DEMO__ && runtime === 'demo') {
    demoPromise ||= import('./demo.js');
    return (await demoPromise).callDemo(action, payload);
  }
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), 45000) : null;
  try {
    const result = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }), signal: controller?.signal });
    return unwrap(await result.json());
  } catch (e) {
    if (e.code) throw e;
    throw new RemoteError('NETWORK_ERROR', 'La conexión con la urna se interrumpió. Conservamos tus respuestas; puedes reintentar.');
  } finally { if (timeout) clearTimeout(timeout); }
}
export async function setupLocal(password) {
  if (runtime !== 'local') throw new RemoteError('FORBIDDEN', 'La configuración inicial se realiza desde la cuenta del organizador.');
  const response = await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  return unwrap(await response.json());
}
export async function demoLogin() {
  if (__ALLOW_DEMO__ && runtime === 'demo') { demoPromise ||= import('./demo.js'); return (await demoPromise).loginDemo(); }
  throw new RemoteError('FORBIDDEN', 'Esta acción solo existe en la demostración.');
}
export async function resetDemo() {
  if (__ALLOW_DEMO__ && runtime === 'demo') { demoPromise ||= import('./demo.js'); return (await demoPromise).resetDemo(); }
  throw new RemoteError('FORBIDDEN', 'Esta acción solo existe en la demostración.');
}
