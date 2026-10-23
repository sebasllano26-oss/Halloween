import { Pool } from 'pg';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emptyState, AppError } from './service.js';

export function createFileRepository(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = join(directory, 'state.json'); let queue = Promise.resolve();
  return { transaction(fn) {
    const operation = queue.then(async () => {
      const state = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : emptyState();
      const result = await fn(state);
      writeFileSync(filename + '.tmp', JSON.stringify(state), { mode: 0o600 }); renameSync(filename + '.tmp', filename);
      return result;
    });
    queue = operation.catch(() => {}); return operation;
  } };
}
export function createPostgresRepository(pool) {
  return { async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '12s'");
      await client.query("SET LOCAL statement_timeout = '55s'");
      // Serialize schema initialization as well as application writes across Vercel instances.
      await client.query('SELECT pg_advisory_xact_lock(842615701)');
      await client.query('CREATE TABLE IF NOT EXISTS public.halloween_app_state (id TEXT PRIMARY KEY, state JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
      await client.query('ALTER TABLE public.halloween_app_state ENABLE ROW LEVEL SECURITY');
      await client.query('INSERT INTO public.halloween_app_state (id, state) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', ['main', JSON.stringify(emptyState())]);
      const row = await client.query('SELECT state FROM public.halloween_app_state WHERE id = $1 FOR UPDATE', ['main']);
      const state = row.rows[0].state;
      const result = await fn(state);
      await client.query('UPDATE public.halloween_app_state SET state = $1::jsonb, updated_at = now() WHERE id = $2', [JSON.stringify(state), 'main']);
      await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  } };
}
export function postgresConnectionOptions(connectionString) {
  const url = new URL(connectionString);
  const supabase = url.hostname.endsWith('.pooler.supabase.com') || /^db\.[a-z0-9]+\.supabase\.co$/.test(url.hostname);
  if (!supabase) return { connectionString };
  // pg's URL SSL options replace the ssl object, including its trusted CA.
  for (const option of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(option);
  return {
    connectionString: url.toString(),
    ssl: { ca: readFileSync(new URL('./certs/supabase-root-2021.crt', import.meta.url), 'utf8'), rejectUnauthorized: true },
  };
}
let productionPool;
export function productionRepository() {
  if (!process.env.DATABASE_URL) throw new AppError('NOT_READY', 'El organizador todavía está preparando el formulario. Intenta de nuevo en un momento.');
  productionPool ||= new Pool({ ...postgresConnectionOptions(process.env.DATABASE_URL), max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000, allowExitOnIdle: true });
  return createPostgresRepository(productionPool);
}
