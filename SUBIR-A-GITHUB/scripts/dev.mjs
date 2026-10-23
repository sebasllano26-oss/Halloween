import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileRepository } from '../src/server/repository.js';
import { createRuntime } from '../src/server/runtime.js';
import { AppError } from '../src/server/service.js';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function createLocalServer({ dataDirectory = resolve(project, '.local'), staticDirectory = resolve(project, 'dist'), passwordIterations } = {}) {
  const service = createRuntime({ repository: createFileRepository(dataDirectory), passwordIterations, mode: 'local', initialPassword: process.env.ADMIN_PASSWORD, serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey: process.env.GOOGLE_PRIVATE_KEY });
  const json = (res, code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
  const server = createServer(async (req, res) => {
    const port = server.address()?.port;
    const hosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
    if (!hosts.has(req.headers.host)) return json(res, 403, { ok: false, error: { code: 'HOST_INVALID', message: 'Acceso local únicamente.' } });
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: { code: 'METHOD_INVALID', message: 'Usa POST.' } });
      if (req.headers.origin !== `http://${req.headers.host}` || !String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 403, { ok: false, error: { code: 'ORIGIN_INVALID', message: 'Solicitud de origen no permitido.' } });
      try {
        let body = ''; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 65536) return json(res, 413, { ok: false, error: { code: 'TOO_LARGE', message: 'La solicitud es demasiado grande.' } }); body += chunk.toString('utf8'); }
        let input;
        try { input = JSON.parse(body); } catch { return json(res, 400, { ok: false, error: { code: 'INVALID_JSON', message: 'No se pudo leer la solicitud.' } }); }
        const data = url.pathname === '/api/setup' ? await service.setup(input.password) : url.pathname === '/api/rpc' ? await service.call(input.action, input.payload) : null;
        if (data === null) return json(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Ruta no disponible.' } });
        return json(res, 200, { ok: true, data });
      } catch (err) {
        return json(res, err instanceof AppError ? 400 : 503, { ok: false, error: { code: err instanceof AppError ? err.code : 'SERVER_ERROR', message: err instanceof AppError ? err.message : 'No se pudo confirmar la operación. Conserva tus respuestas y vuelve a intentarlo.' } });
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let relative;
    try { relative = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    const demoPage = relative === '/demo' || relative === '/demo/';
    const filename = resolve(staticDirectory, '.' + (relative === '/' || relative === '/admin' ? '/index.html' : demoPage ? '/demo/index.html' : relative));
    if (!filename.startsWith(resolve(staticDirectory) + sep) || !existsSync(filename) || !statSync(filename).isFile()) { res.writeHead(404); return res.end('No encontrado'); }
    let body = readFileSync(filename);
    if (extname(filename) === '.html') body = Buffer.from(body.toString('utf8').replace('data-runtime="vercel"', 'data-runtime="local"'));
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
    res.writeHead(200, { 'Content-Type': types[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'" });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.HALLOWEEN_PORT || 4173);
  const server = createLocalServer();
  server.listen(port, '127.0.0.1', () => { process.stdout.write(`Halloween listo en http://localhost:${port}\nDatos locales privados: .local/state.json\nPresiona Ctrl+C para cerrar.\n`); });
}
