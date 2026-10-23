import { randomUUID } from 'node:crypto';
import { productionRepository } from '../src/server/repository.js';
import { createPasswordRecord } from '../src/server/security.js';

const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12 || password.length > 256) throw new Error('Configura ADMIN_PASSWORD con una clave de 12 a 256 caracteres y DATABASE_URL en .env.local.');
await productionRepository().transaction(state => {
  state.auth = createPasswordRecord(password, randomUUID() + randomUUID()); state.sessions = []; state.attempts = {};
});
process.stdout.write('Clave actualizada. Se cerraron las sesiones anteriores.\n');
