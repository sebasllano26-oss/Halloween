import { randomUUID } from 'node:crypto';
import { createService } from '../src/server/service.js';
import { DEFAULT_EVENT, QUESTIONS } from '../src/shared/content.js';

export const PASSWORD = 'Prueba segura de Halloween 2026!';
export function fixture() {
  let state = { config: structuredClone(DEFAULT_EVENT), invitations: [], responses: [], sessions: [], auth: null, attempts: {} };
  let time = Date.UTC(2026, 9, 22, 22);
  const store = {
    transaction(fn) {
      const next = structuredClone(state);
      const result = fn(next);
      state = next;
      return result;
    },
  };
  const service = createService({ store, now: () => time, randomId: randomUUID, passwordIterations: 1000, mode: 'test' });
  service.initialize(PASSWORD);
  const login = () => service.handle('login', { password: PASSWORD }).token;
  const token = login();
  const codes = (count = 1) => service.handle('createInvites', { token, count }).invitations.map(x => x.code);
  const ballot = (code, vote = 'antonia') => ({
    id: randomUUID(), name: 'Invitado de prueba ' + (code || randomUUID()), code,
    answers: Object.fromEntries(QUESTIONS.map(q => [q.id, q.id === 'vote' ? vote : '0'])),
  });
  return { service, token, codes, ballot, login, state: () => state, advance: ms => { time += ms; } };
}
