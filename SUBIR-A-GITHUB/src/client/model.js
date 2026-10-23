import { QUESTIONS, QUESTIONNAIRE_VERSION } from '../shared/content.js';

export function createDraft(edition = '2026') {
  return { version: QUESTIONNAIRE_VERSION, edition, id: null, name: '', code: '', index: 0, answers: {}, receipt: null, pending: false };
}
export function submissionId(cryptoApi = globalThis.crypto) {
  return Array.from(cryptoApi.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function chooseAnswer(draft, questionId, value) { return { ...draft, answers: { ...draft.answers, [questionId]: value } }; }
export function nextQuestion(draft, questions) {
  const q = questions[draft.index];
  return q && q.options.some(o => o.value === draft.answers[q.id]) ? { ...draft, index: Math.min(draft.index + 1, questions.length) } : draft;
}
export function previousQuestion(draft) { return { ...draft, index: Math.max(0, draft.index - 1) }; }
export function isComplete(draft, questions) { return questions.every(q => q.options.some(o => o.value === draft.answers[q.id])); }
export function restoreDraft(raw, edition) {
  const fresh = createDraft(edition);
  try {
    const stored = JSON.parse(raw);
    if (!stored || stored.version !== QUESTIONNAIRE_VERSION || stored.edition !== edition || typeof stored.answers !== 'object' || Array.isArray(stored.answers)) return fresh;
    const answers = Object.fromEntries(Object.entries(stored.answers).filter(([key, value]) => /^(q\d{1,2}|vote)$/.test(key) && typeof value === 'string' && value.length < 60));
    return { ...fresh, id: typeof stored.id === 'string' ? stored.id.slice(0, 100) : null, name: typeof stored.name === 'string' ? stored.name.slice(0, 80) : '', code: typeof stored.code === 'string' ? stored.code.slice(0, 80) : '', answers, index: Number.isInteger(stored.index) ? Math.max(0, Math.min(QUESTIONS.length, stored.index)) : 0, receipt: stored.receipt && typeof stored.receipt.id === 'string' ? stored.receipt : null, pending: stored.pending === true };
  } catch { return fresh; }
}
export function reconcileDraft(draft, questions, edition) {
  if (draft.pending) return draft;
  if (draft.edition !== edition) return createDraft(edition);
  const answers = Object.fromEntries(questions.filter(q => q.options.some(o => o.value === draft.answers[q.id])).map(q => [q.id, draft.answers[q.id]]));
  const firstMissing = questions.findIndex(q => answers[q.id] === undefined);
  return { ...draft, answers, index: Math.min(draft.index, firstMissing < 0 ? questions.length : firstMissing) };
}
export function invitationCode(value) {
  const raw = String(value || '').trim();
  try { return new URL(raw).searchParams.get('invite') || raw; } catch { return raw; }
}
