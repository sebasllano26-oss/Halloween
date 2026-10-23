import { productionRepository } from '../src/server/repository.js';
import { createRuntime } from '../src/server/runtime.js';
import { AppError } from '../src/server/service.js';
import { DEFAULT_EVENT, QUESTIONS } from '../src/shared/content.js';

let runtime;
function getRuntime() {
  runtime ||= createRuntime({ repository: productionRepository(), mode: 'vercel', initialPassword: process.env.ADMIN_PASSWORD, serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey: process.env.GOOGLE_PRIVATE_KEY });
  return runtime;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, value) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { ok: false, error: { code: 'METHOD_INVALID', message: 'Esta ruta usa POST.' } }); }
  const expected = `https://${req.headers.host}`;
  if (req.headers.origin !== expected || !String(req.headers['content-type'] || '').startsWith('application/json')) return send(403, { ok: false, error: { code: 'ORIGIN_INVALID', message: 'Solicitud de origen no permitido.' } });
  try {
    let input = req.body;
    if (typeof input === 'string' || Buffer.isBuffer(input)) input = JSON.parse(String(input));
    if (!input || Array.isArray(input) || typeof input !== 'object' || Buffer.byteLength(JSON.stringify(input)) > 65536) return send(400, { ok: false, error: { code: 'INVALID_INPUT', message: 'La solicitud no es válida.' } });
    if (input.action === 'public' && !process.env.DATABASE_URL) return send(200, { ok: true, data: { event: DEFAULT_EVENT, questions: QUESTIONS, configured: false, mode: 'vercel' } });
    const data = await getRuntime().call(input.action, input.payload);
    return send(200, { ok: true, data });
  } catch (error) {
    return send(error instanceof AppError ? 400 : 503, { ok: false, error: { code: error instanceof AppError ? error.code : 'SERVER_ERROR', message: error instanceof AppError ? error.message : 'No pudimos confirmar la operación. Tus respuestas siguen en este dispositivo; vuelve a intentarlo.' } });
  }
}
