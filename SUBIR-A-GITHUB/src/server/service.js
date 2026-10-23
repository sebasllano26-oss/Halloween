import { DEFAULT_EVENT, QUESTIONS } from '../shared/content.js';
import { createPasswordRecord, verifyPassword, digest, safeCsvCell, PASSWORD_ITERATIONS } from './security.js';

export class AppError extends Error {
  constructor(code, message) { super(message); this.name = 'AppError'; this.code = code; }
}
const fail = (code, message) => { throw new AppError(code, message); };
const clone = value => JSON.parse(JSON.stringify(value));
export const emptyState = () => ({ config: clone(DEFAULT_EVENT), invitations: [], responses: [], sessions: [], auth: null, attempts: {} });
const normalizeCode = code => String(code ?? '').toUpperCase().replace(/[\s-]/g, '');
const prettyCode = code => normalizeCode(code).match(/.{1,6}/g)?.join('-') ?? '';
const cleanText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ? value.trim() : fail('INVALID_INPUT', 'Revisa los campos: faltan datos o hay un texto demasiado largo.');
const publicQuestions = config => QUESTIONS.map(q => q.id === 'vote' ? { ...q, options: config.candidates.map(c => ({ value: c.id, label: c.name })) } : q);
export function tally(state) {
  const ranking = state.config.candidates.map(c => ({ ...c, votes: state.responses.filter(r => r.answers.vote === c.id).length }));
  const total = ranking.reduce((sum, c) => sum + c.votes, 0);
  for (const c of ranking) c.percentage = total ? Math.round(c.votes * 1000 / total) / 10 : 0;
  ranking.sort((a, b) => b.votes - a.votes);
  const winners = total ? ranking.filter(c => c.votes === ranking[0].votes) : [];
  return { total, ranking, winners, kind: !total ? 'empty' : winners.length > 1 ? 'tie' : 'winner' };
}
export function createService({ store, now = Date.now, randomId, passwordIterations = PASSWORD_ITERATIONS, mode = 'vercel', sheetUrl = null }) {
  if (typeof randomId !== 'function') throw new Error('Falta una fuente de identificadores aleatorios.');
  const random = () => randomId().replace(/-/g, '') + randomId().replace(/-/g, '');
  function authorized(state, token) {
    if (typeof token !== 'string' || token.length > 200) fail('AUTH_REQUIRED', 'Tu sesión terminó. Ingresa de nuevo con la clave del anfitrión.');
    const session = state.sessions.find(s => s.hash === digest(token) && s.expiresAt > now());
    if (!session) fail('AUTH_REQUIRED', 'Tu sesión terminó. Ingresa de nuevo con la clave del anfitrión.');
  }
  function invitations(state) {
    const used = new Set(state.responses.map(r => normalizeCode(r.code)));
    return state.invitations.map(i => ({ ...i, code: prettyCode(i.code), used: used.has(normalizeCode(i.code)) }));
  }
  function validInvite(state, code) {
    if (!state.invitations.some(i => normalizeCode(i.code) === code)) fail('INVITE_INVALID', 'Ese código no aparece en la lista. Revisa tu invitación o consulta al anfitrión.');
    if (state.responses.some(r => normalizeCode(r.code) === code)) fail('INVITE_USED', 'Esta invitación ya participó. Cada código permite un solo voto.');
  }
  function validateBallot(state, payload) {
    const id = cleanText(payload.id, 100);
    if (!/^[a-zA-Z0-9_-]{12,100}$/.test(id)) fail('INVALID_INPUT', 'El identificador de envío no es válido.');
    const name = cleanText(payload.name, 80);
    const code = normalizeCode(cleanText(payload.code, 80));
    const input = payload.answers;
    const questions = publicQuestions(state.config);
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== questions.length) fail('INVALID_ANSWERS', `Responde las ${questions.length} preguntas antes de enviar.`);
    const answers = {};
    for (const q of questions) {
      if (typeof input[q.id] !== 'string' || !q.options.some(o => o.value === input[q.id])) fail('INVALID_ANSWERS', 'Una respuesta no es válida. Revisa tu selección antes de enviar.');
      answers[q.id] = input[q.id];
    }
    return { id, name, code, answers, fingerprint: digest(JSON.stringify({ name, code, answers })) };
  }
  function dispatch(state, action, payload) {
    state.sessions = state.sessions.filter(s => s.expiresAt > now());
    if (action === 'public') return { event: clone(state.config), questions: publicQuestions(state.config), configured: Boolean(state.auth), mode };
    if (action === 'login') {
      if (!state.auth) fail('NOT_CONFIGURED', 'El anfitrión todavía no ha activado el formulario.');
      if (state.attempts.lockedUntil > now()) fail('LOGIN_LOCKED', 'Demasiados intentos. Espera 15 minutos antes de volver a entrar.');
      if (!verifyPassword(payload.password, state.auth)) {
        if (!state.attempts.startedAt || now() - state.attempts.startedAt > 15 * 60 * 1000) state.attempts = { failures: 0, startedAt: now() };
        state.attempts.failures += 1;
        if (state.attempts.failures >= 5) state.attempts.lockedUntil = now() + 15 * 60 * 1000;
        fail('LOGIN_INVALID', 'Esa clave no abre la cripta. Revisa e inténtalo de nuevo.');
      }
      state.attempts = {};
      const token = random(); const expiresAt = now() + 2 * 60 * 60 * 1000;
      state.sessions = [...state.sessions.slice(-9), { hash: digest(token), expiresAt }];
      return { token, expiresAt };
    }
    if (action === 'checkInvite') {
      if (!state.auth) fail('NOT_CONFIGURED', 'El anfitrión todavía no ha activado el formulario.');
      if (!state.config.open) fail('EVENT_CLOSED', 'La urna ya está cerrada. Gracias por ser parte de esta noche.');
      validInvite(state, normalizeCode(payload.code)); return { valid: true };
    }
    if (action === 'submit') {
      if (!state.auth) fail('NOT_CONFIGURED', 'El anfitrión todavía no ha activado el formulario.');
      const ballot = validateBallot(state, payload);
      const prior = state.responses.find(r => r.id === ballot.id);
      if (prior) {
        if (prior.fingerprint !== ballot.fingerprint) fail('ID_CONFLICT', 'Este envío ya fue registrado con otras respuestas. Consulta al anfitrión.');
        return { status: 'recorded', receipt: { id: prior.id, createdAt: prior.createdAt } };
      }
      if (!state.config.open) fail('EVENT_CLOSED', 'La urna ya está cerrada. Tu voto no se registró.');
      validInvite(state, ballot.code);
      const response = { ...ballot, createdAt: new Date(now()).toISOString() };
      state.responses.push(response);
      return { status: 'recorded', receipt: { id: response.id, createdAt: response.createdAt } };
    }
    const adminActions = ['admin', 'createInvites', 'setStatus', 'updateEvent', 'reveal', 'export', 'logout'];
    if (!adminActions.includes(action)) fail('UNKNOWN_ACTION', 'Esta acción no está disponible.');
    authorized(state, payload.token);
    if (action === 'logout') { state.sessions = state.sessions.filter(s => s.hash !== digest(payload.token)); return { loggedOut: true }; }
    if (action === 'admin') return { event: clone(state.config), total: state.responses.length, invitations: invitations(state), responses: clone(state.responses), sheetUrl, result: state.config.revealedAt && !state.config.open ? tally(state) : null, mode };
    if (action === 'createInvites') {
      const names = Array.isArray(payload.names) ? payload.names.map(n => cleanText(n, 80)) : [];
      const count = names.length || payload.count;
      if (!Number.isInteger(count) || count < 1 || count > 100 || state.invitations.length + count > 2000) fail('INVALID_INPUT', 'Crea entre 1 y 100 invitaciones por vez; máximo 2.000 para este evento.');
      const created = [];
      for (let i = 0; i < count; i++) {
        let code;
        do { code = random().slice(0, 24).toUpperCase(); } while (state.invitations.some(x => normalizeCode(x.code) === code));
        const invite = { code, name: names[i] || '', createdAt: new Date(now()).toISOString() };
        state.invitations.push(invite); created.push({ ...invite, code: prettyCode(code), used: false });
      }
      return { invitations: created };
    }
    if (action === 'setStatus') {
      if (typeof payload.open !== 'boolean') fail('INVALID_INPUT', 'Selecciona un estado válido para la urna.');
      state.config.open = payload.open;
      if (payload.open) state.config.revealedAt = null;
      return { event: clone(state.config) };
    }
    if (action === 'updateEvent') {
      const title = cleanText(payload.title, 100); const theme = cleanText(payload.theme, 180); const edition = String(payload.edition);
      if (!/^20\d{2}$/.test(edition)) fail('INVALID_INPUT', 'La edición debe ser un año entre 2000 y 2099.');
      if (state.responses.length && JSON.stringify(payload.candidates) !== JSON.stringify(state.config.candidates)) fail('CANDIDATES_LOCKED', 'Ya hay votos. Los participantes quedan protegidos para conservar el resultado.');
      if (!Array.isArray(payload.candidates) || payload.candidates.length < 2 || payload.candidates.length > 12) fail('INVALID_INPUT', 'El evento necesita entre 2 y 12 participantes.');
      const ids = new Set(); const names = new Set();
      const candidates = payload.candidates.map((c, i) => {
        const name = cleanText(c.name, 40); const id = c.id;
        if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id) || ids.has(id) || names.has(name.toLowerCase())) fail('INVALID_INPUT', 'Los participantes deben tener nombres e identificadores distintos.');
        ids.add(id); names.add(name.toLowerCase());
        return { id, name, character: ['witch', 'vampire', 'ghost'][i % 3], color: ['purple', 'orange', 'green'][i % 3], tagline: ['Creatividad bajo sospecha', 'Una leyenda de la noche', 'El espíritu más original'][i % 3] };
      });
      state.config = { ...state.config, title, theme, edition, candidates: state.responses.length ? state.config.candidates : candidates };
      return { event: clone(state.config) };
    }
    if (action === 'reveal') {
      if (state.config.open) fail('EVENT_OPEN', 'Cierra las votaciones antes de abrir el sobre del ganador.');
      state.config.revealedAt = new Date(now()).toISOString(); return tally(state);
    }
    if (action === 'export') {
      const questions = publicQuestions(state.config);
      const rows = [['Comprobante', 'Fecha del servidor (UTC)', 'Nombre', 'Invitación', ...questions.map(q => q.id === 'vote' ? 'El mejor disfraz' : q.prompt)]];
      for (const response of state.responses) rows.push([response.id, response.createdAt, response.name, prettyCode(response.code), ...questions.map(q => q.options.find(o => o.value === response.answers[q.id])?.label || '')]);
      const csv = '\uFEFF' + rows.map(row => row.map(value => '"' + safeCsvCell(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      return { filename: `halloween-${state.config.edition}-respuestas.csv`, csv };
    }
  }
  return {
    initialize(password) {
      if (typeof password !== 'string' || password.length < 12 || password.length > 256) fail('WEAK_PASSWORD', 'Elige una clave de al menos 12 caracteres y máximo 256.');
      return store.transaction(state => {
        if (state.auth) fail('ALREADY_CONFIGURED', 'El administrador ya está configurado.');
        state.auth = createPasswordRecord(password, random(), passwordIterations);
        return { configured: true };
      });
    },
    handle(action, payload = {}) {
      let error;
      const result = store.transaction(state => {
        try { return dispatch(state, action, payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}); }
        catch (err) { if (!(err instanceof AppError)) throw err; error = err; return null; }
      });
      if (error) throw error;
      return result;
    },
  };
}
