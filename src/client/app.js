import { icon } from './art.js';
import { participantPhoto, homeView, surveyView } from './views-v2.js';
import { mountMotion } from './motion.js';
import { createSoundtrack } from './audio.js';
import { createDraft, restoreDraft, chooseAnswer, isComplete, submissionId, reconcileDraft, invitationCode } from './model.js';
import { rpc, setupLocal, demoLogin, resetDemo } from './transport.js';
import { QUESTIONNAIRE_VERSION } from '../shared/content.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const runtime = document.documentElement.dataset.runtime;
let publicData, draft, view = location.pathname === '/admin' || location.hash === '#admin' ? 'login' : 'home';
let token = null, adminData = null, adminTab = 'overview', revealData = null, feedbackAudio, invitationError = '';
let testMode = false;
let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches, reading = false, keyboardNavigation = false;
let cleanMotion = () => {};
try { if (localStorage.getItem('halloween-motion') === 'off') motion = false; reading = localStorage.getItem('halloween-reading') === 'on'; } catch { /* Optional preferences. */ }
let storageKey, toastTimer, prefetchedCode = new URLSearchParams(location.search).get('invite') || '';
const main = $('#main');
let preferredVolume = .18;
try { const saved = localStorage.getItem('halloween-volume'); if (saved !== null) preferredVolume = Math.max(0, Math.min(1, Number(saved) || 0)); } catch {}
const soundtrack = createSoundtrack($('#soundtrack'), { volume: preferredVolume, onChange: updateMusicControls });
function updateMusicControls() {
  document.querySelectorAll('[data-action=sound]').forEach(button => {
    button.setAttribute('aria-pressed', String(soundtrack.playing));
    button.setAttribute('aria-label', soundtrack.playing ? 'Silenciar música de Halloween' : 'Activar música de Halloween');
    button.innerHTML = `${icon(soundtrack.playing ? 'sound' : 'muted')} <span>${soundtrack.playing ? 'Silenciar música' : 'Activar música'}</span>`;
  });
  document.querySelectorAll('[data-music-volume]').forEach(input => { if (document.activeElement !== input) input.value = String(Math.round(soundtrack.volume * 100)); });
  document.querySelectorAll('[data-volume-value]').forEach(span => { span.textContent = Math.round(soundtrack.volume * 100) + '%'; });
}
function saveDraft() { try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The current page still retains responses. */ } }
function restoreGuestDraft() {
  storageKey = `halloween-draft-${runtime}-${publicData.event.edition}-${QUESTIONNAIRE_VERSION}`;
  let saved; try { saved = localStorage.getItem(storageKey); } catch {}
  draft = reconcileDraft(restoreDraft(saved, publicData.event.edition), publicData.questions, publicData.event.edition);
  if (runtime === 'demo' && !draft.code) draft.code = 'HALLOWEEN-DEMO';
  saveDraft();
}
function announce(message) { $('#announcer').textContent = message; }
function notify(message) { const toast = $('#toast'); toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4000); }
function showError(error) {
  if (error.code === 'AUTH_REQUIRED' && token) { token = null; view = 'login'; render(); }
  const box = $('#page-error');
  if (box) { box.hidden = false; box.textContent = error.message || 'No se pudo completar la operación. Vuelve a intentarlo.'; box.scrollIntoView({ block: 'nearest' }); }
  else notify(error.message || 'No se pudo completar la operación.');
}
async function busy(button, work) {
  if (button?.disabled) return;
  const previous = button?.innerHTML;
  if (button) { button.disabled = true; button.innerHTML = `${icon('refresh', 'loading-icon')} Un momento…`; }
  const box = $('#page-error'); if (box) box.hidden = true;
  try { return await work(); } catch (error) { showError(error); }
  finally { if (button?.isConnected) { button.disabled = false; button.innerHTML = previous; } }
}
function tone(frequencies = [392, 523]) {
  if (!soundtrack.playing) return;
  try {
    feedbackAudio ||= new (window.AudioContext || window.webkitAudioContext)(); feedbackAudio.resume();
    frequencies.forEach((frequency, i) => { const oscillator = feedbackAudio.createOscillator(), gain = feedbackAudio.createGain(), at = feedbackAudio.currentTime + i * .12;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.035, at); gain.gain.exponentialRampToValueAtTime(.001, at + .18); oscillator.connect(gain); gain.connect(feedbackAudio.destination); oscillator.start(at); oscillator.stop(at + .2);
    });
  } catch { /* Sound is optional. */ }
}
const errorBox = () => '<div id="page-error" class="page-error" role="alert" hidden></div>';
const pill = () => `<span class="live-pill ${publicData.event.open ? '' : 'closed'}"><span class="live-dot"></span>${publicData.event.open ? 'La urna está abierta' : 'Votación cerrada'}</span>`;
function renderChrome() {
  document.documentElement.classList.toggle('motion-off', !motion);
  document.documentElement.classList.toggle('comfortable-reading', reading);
  const event = publicData.event;
  $('#header').innerHTML = `<button class="brand" data-action="home" aria-label="Volver al inicio"><span class="brand-mark">${icon('ghost')}</span><span><strong>El baile de las sombras</strong><small>HALLOWEEN · VÉLEZ LÓPEZ</small></span></button><nav class="header-links" aria-label="Navegación principal"><a href="#sospechosos" data-anchor="sospechosos">Los participantes</a><a href="#encuesta" data-anchor="encuesta">La encuesta</a></nav><div class="header-tools"><span class="edition-badge">EDICIÓN ${escape(event.edition)}</span><button class="text-button header-admin" data-action="admin">${icon('lock')} Anfitrión</button></div>`;
  $('#experience-tools').innerHTML = `<div class="experience-tools-inner"><button type="button" class="tool-button music-toggle" data-action="sound" aria-pressed="${soundtrack.playing}"></button><label class="volume-control"><span>Volumen</span><input type="range" min="0" max="100" value="${Math.round(soundtrack.volume * 100)}" data-music-volume aria-label="Volumen de la música"><span data-volume-value>${Math.round(soundtrack.volume * 100)}%</span></label><span class="tools-spacer"></span><button type="button" class="tool-button" data-action="reading" aria-pressed="${reading}">Aa <span>${reading ? 'Letra habitual' : 'Letra grande'}</span></button><button type="button" class="tool-button" data-action="motion" aria-pressed="${!motion}">${icon('spark')} <span>${motion ? 'Pausar animación' : 'Activar animación'}</span></button></div>`;
  updateMusicControls();
  $('#footer').innerHTML = `<span class="footer-left">${icon('ghost')} ${escape(event.title)} · ${escape(event.edition)} <span aria-hidden="true">/</span> Una tradición de otro mundo.</span><button class="text-button" data-action="admin">${icon('lock')} Acceso del anfitrión</button>`;
  const environment = $('#environment');
  environment.hidden = runtime === 'vercel' && !testMode;
  environment.innerHTML = testMode
    ? '<span><strong>MODO DE PRUEBA.</strong> Estos envíos no cuentan para el ganador.</span><span class="environment-actions"><button class="text-button" data-action="fill-test">Completar con respuestas de prueba</button><button class="text-button" data-action="exit-test">Volver al panel de pruebas</button></span>'
    : runtime === 'demo'
    ? '<span><strong>Demostración interactiva.</strong> Todo queda en este navegador.</span><span class="environment-actions"><button class="text-button" data-action="demo-reset">Reiniciar prueba</button><button class="text-button" data-action="demo-admin">Ver panel de prueba</button></span>'
    : '<span><strong>Vista previa local.</strong></span><span class="environment-actions"><a href="/demo">Probar como invitado</a><button class="text-button" data-action="admin">Preparar evento real</button></span>';
}
function animateScreen() {
  cleanMotion();
  cleanMotion = mountMotion(main, { enabled: motion, view, keyboard: keyboardNavigation });
}
function guestViewData() { return { publicData: testMode ? { ...publicData, event: { ...publicData.event, open: true, opensAt: null } } : publicData, draft, runtime, testMode, linked: Boolean(prefetchedCode && draft.code) || runtime === 'demo', invitationError }; }
function home() { return homeView(guestViewData()); }
function pageTop() { return `<div class="page-top"><button class="text-button" data-action="home">${icon('back')} Volver a la fiesta</button><span class="live-pill">${publicData.event.open ? 'Urna abierta' : 'Urna cerrada'}</span></div>`; }
function answerLabel(q, answers = draft.answers) { return q.options.find(o => o.value === answers[q.id])?.label || 'Sin responder'; }

function loginPage() {
  const setup = !publicData.configured && runtime === 'local';
  return `<div class="container">${pageTop()}<form class="login-card" id="login-form"><div class="login-icon">${icon('lock')}</div><div class="eyebrow">SOLO PARA EL ANFITRIÓN</div><h1>${setup ? 'Tu primera llave.' : 'Abre la cripta.'}</h1><p>${setup ? 'Crea la clave del administrador para esta versión local. Después podrás compartir el enlace y probar el formulario.' : 'Entra para consultar las respuestas, cerrar la urna y descubrir al ganador.'}</p>${errorBox()}${!publicData.configured && runtime === 'vercel' ? '<div class="page-error">Falta configurar ADMIN_PASSWORD y DATABASE_URL en Vercel. Consulta la guía de despliegue incluida en el proyecto.</div>' : ''}<div class="field"><label for="admin-password">${setup ? 'Crea tu clave' : 'Clave del anfitrión'}</label><input type="password" id="admin-password" name="password" ${setup ? 'minlength="12"' : ''} maxlength="256" autocomplete="${setup ? 'new-password' : 'current-password'}" required placeholder="${setup ? 'Mínimo 12 caracteres' : 'Tu clave secreta'}"></div>${setup ? '<div class="field"><label for="confirm-password">Repite tu clave</label><input type="password" id="confirm-password" name="confirm" minlength="12" maxlength="256" autocomplete="new-password" required></div>' : ''}<button class="btn btn-primary wide" type="submit">${setup ? 'Crear mi clave' : 'Entrar al panel'} ${icon('arrow')}</button>${runtime === 'demo' ? '<div class="divider">ESTÁS EN LA DEMOSTRACIÓN</div><button class="btn btn-secondary wide" type="button" data-action="demo-admin">Entrar al panel de prueba</button>' : ''}<p class="fine-print">La clave solo la necesita el anfitrión. Todos responden desde el mismo enlace.</p></form></div>`;
}
function render() {
  cleanMotion();
  document.body.dataset.view = view;
  renderChrome();
  const renderers = { home, login: loginPage, admin: adminPage, winner: winnerPage };
  main.innerHTML = (renderers[view] || home)();
  document.body.dataset.view = view;
  const heading = main.querySelector('h1');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  bindForms();
  animateScreen();
}
async function loadAdmin() {
  adminData = await rpc('admin', { token }); publicData.event = adminData.event;
}
async function startGuest() {
  if (view !== 'home') { view = 'home'; render(); }
  const target = $(draft.receipt ? '#survey-receipt' : '#encuesta');
  target?.scrollIntoView({ behavior: motion && !keyboardNavigation ? 'smooth' : 'auto', block: 'start' });
  if (!draft.name && !draft.receipt) $('#guest-name')?.focus({ preventScroll: true });
}
function refreshSurvey() {
  const region = $('#survey-region');
  if (!region) return;
  region.innerHTML = surveyView(guestViewData());
  bindSurvey();
  updateSurveyProgress();
  document.querySelectorAll('[data-action=start]').forEach(button => { button.innerHTML = `${draft.receipt ? 'Ver mi comprobante' : 'Ir a mis respuestas'} ${icon('arrow')}`; });
}
function surveyError(key, message) {
  const error = $('#error-' + key);
  if (error) { error.hidden = false; error.textContent = message; }
  const input = key === 'name' || key === 'code' ? $('#guest-' + key) : main.querySelector('input[name="' + key + '"]');
  input?.setAttribute('aria-invalid', 'true');
  $('#question-' + key)?.classList.add('has-error');
}
function focusSurveyField(key) {
  const input = key === 'name' || key === 'code' ? $('#guest-' + key) : main.querySelector('input[name="' + key + '"]');
  const target = $('#question-' + key) || input;
  target?.scrollIntoView({ behavior: 'auto', block: 'center' });
  input?.focus({ preventScroll: true });
}
function clearFieldError(key) {
  const error = $('#error-' + key); if (error) { error.hidden = true; error.textContent = ''; }
  main.querySelectorAll('input[name="' + key + '"]').forEach(input => input.removeAttribute('aria-invalid'));
  $('#question-' + key)?.classList.remove('has-error');
}
function updateSurveyProgress() {
  if (!$('#survey-form')) return;
  const count = publicData.questions.filter(q => q.options.some(o => o.value === draft.answers[q.id])).length;
  $('[data-survey-count]').textContent = `${count} de ${publicData.questions.length} respondidas`;
  const progress = $('#survey-form [role=progressbar]');
  progress.setAttribute('aria-valuenow', String(count));
  $('[data-survey-fill]').style.transform = `scaleX(${count / publicData.questions.length})`;
  for (const q of publicData.questions) {
    const field = $('#question-' + q.id);
    if (field) field.dataset.complete = String(q.options.some(o => o.value === draft.answers[q.id]));
  }
  const candidate = publicData.event.candidates.find(c => c.id === draft.answers.vote);
  $('#vote-summary').innerHTML = candidate ? `Tu voto al mejor disfraz es para <strong>${escape(candidate.name)}</strong>.` : 'Al final, elige quién merece la corona al mejor disfraz.';
}
function bindSurvey() {
  const form = $('#survey-form'); if (!form) return;
  form.addEventListener('input', event => {
    if (draft.pending || draft.receipt) return;
    if (event.target.name === 'name') { draft.name = event.target.value.slice(0, 80); clearFieldError('name'); saveDraft(); }
    if (event.target.name === 'code') { draft.code = invitationCode(event.target.value); invitationError = ''; clearFieldError('code'); saveDraft(); }
  });
  form.addEventListener('change', event => {
    if (draft.pending || draft.receipt) return;
    const q = publicData.questions.find(q => q.id === event.target.name);
    if (!q || !q.options.some(o => o.value === event.target.value)) return;
    draft = chooseAnswer(draft, q.id, event.target.value); clearFieldError(q.id); saveDraft(); updateSurveyProgress();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (draft.receipt || !publicData.configured) return;
    if (!draft.pending) {
      form.querySelectorAll('.field-error').forEach(box => { box.hidden = true; box.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      form.querySelectorAll('.has-error').forEach(field => field.classList.remove('has-error'));
      $('#survey-feedback').hidden = true;
      draft.name = form.elements.name.value.trim();
      const data = new FormData(form);
      draft.answers = Object.fromEntries(publicData.questions.filter(q => q.options.some(o => o.value === data.get(q.id))).map(q => [q.id, data.get(q.id)]));
      saveDraft();
      const errors = [];
      if (draft.name.length < 2) errors.push(['name', 'Escribe tu nombre y apellido para saber quién participa.']);
      for (const q of publicData.questions) if (!q.options.some(o => o.value === draft.answers[q.id])) errors.push([q.id, 'Elige una respuesta para esta pregunta.']);
      if (errors.length) {
        for (const [key, message] of errors) surveyError(key, message);
        focusSurveyField(errors[0][0]); announce('Faltan respuestas. Te llevamos al primer campo pendiente.'); return;
      }
    }
    void submitVote($('#send-survey'));
  });
}
async function submitVote(button) {
  await busy(button, async () => {
    draft.id ||= submissionId(); draft.pending = true; saveDraft();
    const fields = $('#survey-fields'); if (fields) fields.disabled = true;
    try {
      const result = await rpc(testMode ? 'submitTest' : 'submit', { id: draft.id, name: draft.name, answers: draft.answers, ...(testMode ? { token } : {}) });
      if (result.status !== 'recorded' || !result.receipt?.id) throw new Error('No llegó el comprobante. Vuelve a confirmar el mismo envío.');
      if (testMode && !result.receipt.test) throw new Error('No se confirmó el registro como prueba.');
      draft.receipt = { ...result.receipt, ...(testMode ? { sheet: result.sheet } : {}) }; draft.pending = false; invitationError = ''; saveDraft(); refreshSurvey();
      const receipt = $('#survey-receipt'); receipt?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' }); receipt?.focus({ preventScroll: true });
      announce(testMode ? 'Prueba registrada. No cuenta como voto real.' : 'Participación confirmada. Tu voto quedó registrado.'); tone([392, 523, 659]); celebrate();
    } catch (error) {
      if (['INVALID_INPUT', 'INVALID_ANSWERS', 'EVENT_CLOSED', 'INVITE_INVALID', 'INVITE_USED', 'VOTE_ALREADY_RECORDED', 'NOT_CONFIGURED', 'AUTH_REQUIRED'].includes(error.code)) draft.pending = false;
      if (['INVITE_INVALID', 'INVITE_USED'].includes(error.code)) invitationError = error.message;
      if (error.code === 'EVENT_CLOSED') publicData.event.open = false;
      if (error.code === 'NOT_CONFIGURED') publicData.configured = false;
      saveDraft(); refreshSurvey();
      const box = $('#survey-feedback');
      box.hidden = false;
      box.textContent = (draft.pending ? 'Necesitamos confirmar tu envío anterior. Tus respuestas están protegidas; vuelve a pulsar Confirmar mi envío. ' : '') + (error.message || 'No pudimos completar el envío. Vuelve a intentarlo.');
      if (error.code === 'VOTE_ALREADY_RECORDED') { surveyError('name', error.message); focusSurveyField('name'); } else box.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  });
}

function celebrate() {
  if (!motion || keyboardNavigation) return;
  const confetti = document.createElement('div'); confetti.className = 'confetti'; confetti.setAttribute('aria-hidden', 'true');
  confetti.innerHTML = Array.from({ length: 35 }, (_, i) => `<i style="left:${(i * 17.3) % 100}%;animation-delay:${(i % 7) * .11}s;background:${['#edaa69', '#b9a0d4', '#a9c99b', '#eee3be'][i % 4]};transform:rotate(${i * 14}deg)"></i>`).join('');
  document.body.append(confetti); setTimeout(() => confetti.remove(), 4300);
}
function openDialog(title, body) { const modal = $('#modal'); modal.innerHTML = `<button class="icon-button modal-close" data-action="close-dialog" aria-label="Cerrar ventana">${icon('x')}</button><h2 id="modal-title">${escape(title)}</h2>${body}`; modal.showModal(); }
async function copy(text) { try { await navigator.clipboard.writeText(text); notify('Enlace copiado. Ya puedes compartirlo con toda la familia.'); } catch { openDialog('Copia el enlace', `<div class="field"><label for="copy-link">Enlace para todos</label><textarea id="copy-link" readonly>${escape(text)}</textarea></div><p>Selecciona el enlace y cópialo para compartirlo.</p>`); $('#copy-link').select(); } }
function download(content, filename, type = 'text/csv;charset=utf-8') { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); }

function sheetSummary() {
  const sheet = adminData.sheet || {};
  return `<div class="status-box ${sheet.connected && sheet.pending ? 'warn' : ''}"><span>${sheet.connected ? 'Google Sheets' : 'Supabase'}</span><strong>${sheet.connected ? sheet.pending ? `${sheet.pending} pendientes` : 'Sincronizada' : 'Guardado activo'}</strong></div>${sheet.lastError ? `<p class="fine-print">${escape(sheet.lastError)}</p>` : ''}<p class="fine-print">${sheet.connected ? 'Los votos se conservan aunque Google no responda. Puedes reintentar la copia a la hoja.' : 'Enlaza tu hoja en Configuración para recibir allí todas las respuestas.'}</p>`;
}
function overview() {
  const available = adminData.invitations.filter(i => !i.used).length;
  return `<div class="stats-grid"><div class="stat-card"><span class="stat-label">${icon('ticket')} Participaciones</span><strong>${adminData.total}</strong><small>Votos guardados y confirmados</small></div><div class="stat-card"><span class="stat-label">${icon('users')} Acceso para la familia</span><strong style="font-size:26px">Un solo enlace</strong><small>Un voto por nombre completo</small></div><div class="stat-card"><span class="stat-label">${icon('lock')} Estado de la urna</span><strong style="font-size:31px">${adminData.event.open ? 'Abierta' : 'Cerrada'}</strong><small>${adminData.event.open ? 'Los invitados pueden participar' : 'Ya puedes revelar el resultado'}</small></div></div><div class="admin-grid"><section class="panel crown-panel">${icon('crown')}<div class="eyebrow">EL GRAN MOMENTO</div><h2 style="margin-top:12px">La corona espera<br><em>a su próximo dueño.</em></h2><p>${adminData.event.open ? 'Cuando todos hayan participado, cierra la urna para contar los votos y abrir el sobre del ganador.' : 'La urna está sellada. Descubre quién conquistó a la familia esta noche.'}</p><div class="panel-actions"><button class="btn btn-primary" data-action="${adminData.event.open ? 'confirm-close' : 'reveal'}">${adminData.event.open ? 'Cerrar las votaciones' : 'Revelar al ganador'} ${icon(adminData.event.open ? 'lock' : 'crown')}</button>${!adminData.event.open ? '<button class="text-button" data-action="confirm-open">Volver a abrir</button>' : ''}</div></section><section class="panel"><h2>Todo bajo control.</h2><p>Revisa las respuestas, comparte el enlace y conserva una copia de la noche.</p>${sheetSummary()}<div class="panel-actions"><button class="btn btn-secondary btn-small" data-action="export">${icon('download')} Descargar respuestas</button><button class="text-button" data-tab="settings">Enlazar hoja ${icon('arrow')}</button></div></section></div><div class="subheading"><div><h2>Las últimas apariciones.</h2><p>Participaciones recibidas esta noche.</p></div><button class="text-button" data-tab="responses">Ver todas ${icon('arrow')}</button></div>${responsesTable(adminData.responses.slice(-5).reverse())}`;
}
function responsesTable(responses) {
  if (!responses.length) return `<div class="empty-state">${icon('ghost')}<h2>Ni un fantasma por aquí… todavía.</h2><p>Comparte el enlace del formulario y las respuestas aparecerán en este panel.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Invitado</th><th>Recibido · Colombia</th><th>Participación</th></tr></thead><tbody>${responses.map(r => `<tr><td>${escape(r.name)}</td><td>${escape(new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }))}</td><td><button class="text-button" data-response="${escape(r.id)}">${icon('eye')} Ver respuestas</button></td></tr>`).join('')}</tbody></table></div>`;
}
function sharePage() {
  const url = new URL(runtime === 'demo' ? '/demo' : '/', location.origin).href;
  return `<section class="panel"><h2>Un enlace para toda la familia.</h2><p>Compártelo por WhatsApp o como prefieras. Cada persona escribe su nombre completo, responde y envía su voto.</p><div class="field"><label for="shared-link">Enlace del formulario</label><input id="shared-link" readonly value="${escape(url)}"></div><button class="btn btn-primary" data-action="copy-shared">${icon('copy')} Copiar enlace para todos</button><p class="fine-print">No se necesitan invitaciones, códigos ni cuentas. Se admite una participación por nombre completo.</p></section>`;
}
function settingsPage() {
  const event = adminData.event, sheet = adminData.sheet || {};
  return `<div class="settings-layout"><section class="panel"><h2>Los detalles de la noche.</h2><p>Personaliza el evento. Los participantes se pueden cambiar antes del primer voto.</p><form id="event-form" style="margin-top:23px"><div class="field-inline"><div class="field"><label for="event-title">Nombre del evento</label><input id="event-title" name="title" maxlength="100" required value="${escape(event.title)}"></div><div class="field"><label for="event-edition">Edición</label><input id="event-edition" name="edition" type="number" min="2000" max="2099" required value="${escape(event.edition)}"></div></div><div class="field"><label for="event-theme">Tema de los disfraces</label><input id="event-theme" name="theme" maxlength="180" required value="${escape(event.theme)}"></div><div class="field"><label for="event-candidates">Participantes · uno por línea</label><textarea id="event-candidates" name="candidates" ${adminData.total ? 'readonly' : ''} required>${escape(event.candidates.map(c => c.name).join('\n'))}</textarea><small>${adminData.total ? 'Los participantes están protegidos porque ya hay votos.' : 'Puedes incluir entre 2 y 12 participantes.'}</small></div><button class="btn btn-primary" type="submit">Guardar cambios ${icon('check')}</button></form></section><section class="panel"><div class="eyebrow">CONEXIÓN DIRECTA · SIN APPS SCRIPT</div><h2 style="margin-top:13px">Copia opcional en tu hoja.</h2><p>La conexión se hace una sola vez. Tus invitados solo usarán el formulario.</p>${sheet.connected ? `<div class="connection-state">${icon('check')} Hoja enlazada · ${sheet.pending || 0} respuestas pendientes</div>` : ''}${sheet.serviceEmail ? `<ol class="help-steps"><li>Abre la hoja de Google Sheets que usarás para el evento.</li><li>Compártela como <strong>Editor</strong> con esta cuenta:</li></ol><code class="integration-email">${escape(sheet.serviceEmail)}</code><p style="margin-bottom:20px">Después pega el enlace de la hoja aquí. La aplicación creará sus propias pestañas sin tocar las demás.</p>` : '<div class="survey-notice">El guardado en Supabase ya funciona. La copia automática a Google Sheets necesita las credenciales de Google; mientras tanto, usa Descargar respuestas (CSV).</div>'}<form id="sheet-form" style="margin-top:22px"><div class="field"><label for="sheet-url">Enlace de Google Sheets</label><input id="sheet-url" name="url" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value="${escape(sheet.url || sheet.suggestedUrl || '')}" required><small>Las respuestas y los resultados se copiarán a pestañas con el prefijo Halloween_.</small></div><div class="panel-actions"><button type="submit" class="btn btn-primary" ${sheet.credentialsConfigured ? '' : 'disabled'}>${sheet.connected ? 'Verificar y enlazar' : 'Enlazar mi hoja'} ${icon('arrow')}</button>${sheet.connected ? '<button type="button" class="btn btn-secondary" data-action="sync">'+icon('refresh')+' Sincronizar pendientes</button>' : ''}</div></form>${sheet.lastError ? `<div class="page-error">${escape(sheet.lastError)}</div>` : ''}${sheet.lastSyncAt ? `<p class="fine-print">Última sincronización: ${escape(new Date(sheet.lastSyncAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }))}</p>` : ''}${sheet.url ? `<a class="text-button" href="${escape(sheet.url)}" target="_blank" rel="noopener noreferrer">Abrir Google Sheets ${icon('arrow')}</a>` : ''}<details class="integration-details" style="margin-top:15px"><summary>¿Qué pasa si Google deja de responder?</summary><p>La aplicación guarda primero cada voto en su base de datos. Las respuestas pendientes se reintentan con la siguiente participación y cuando actualizas el panel. También puedes pulsar “Sincronizar pendientes”. El conteo del ganador siempre usa los votos confirmados.</p></details></section></div>`;
}
function testsPage() {
  const tests = adminData.tests || { total: 0, responses: [] }, sheet = tests.sheet || {};
  return `<section class="panel test-panel"><div class="eyebrow">ENSAYOS · SIN VOTOS REALES</div><h2>Comprueba todo antes de abrir.</h2><p>Usa el mismo formulario. Los ensayos se guardan aparte y se copian a <strong>Halloween_Pruebas</strong>. No modifican el ganador ni las respuestas reales.</p><div class="connection-state" data-test-summary>${tests.total} ensayos · ${sheet.connected ? sheet.pending ? `${sheet.pending} pendientes de copiar a Google` : 'Copia a Google al día' : 'Guardados en la base de datos'}</div>${sheet.lastError ? `<p class="page-error">${escape(sheet.lastError)}</p>` : ''}<div class="panel-actions"><button class="btn btn-primary" data-action="start-test">Probar el formulario ${icon('arrow')}</button>${sheet.connected ? `<button class="btn btn-secondary" data-action="sync">${icon('refresh')} Sincronizar pendientes</button>` : ''}<button class="text-button" data-action="confirm-reset-tests" ${tests.total ? '' : 'disabled'}>Eliminar registros de prueba</button></div><p class="fine-print">El reinicio elimina únicamente los ensayos de la aplicación y de Halloween_Pruebas. Los ${adminData.total} votos reales se conservan.</p></section><div class="subheading"><div><h2>Registros de prueba.</h2><p>Solo el anfitrión puede crearlos o eliminarlos.</p></div></div>${tests.total ? responsesTable(tests.responses.slice().reverse()) : '<div class="empty-state"><h2>Sin ensayos guardados.</h2><p>Pulsa Probar el formulario para verificar un envío completo.</p></div>'}`;
}
function adminPage() {
  if (!adminData) return loginPage();
  return `<div class="container"><div class="admin-head"><div><div class="eyebrow">EL CUARTEL DEL ANFITRIÓN</div><h1>Aquí se guarda <em>el misterio.</em></h1><p>${escape(adminData.event.title)} · ${escape(adminData.event.edition)}</p></div><div class="admin-head-actions"><button class="btn btn-secondary btn-small" data-action="refresh-admin">${icon('refresh')} Actualizar</button><button class="text-button" data-action="logout">Salir ${icon('lock')}</button></div></div><nav class="admin-tabs" aria-label="Secciones del panel">${[['overview', 'Resumen'], ['share', 'Compartir enlace'], ['responses', 'Respuestas'], ...(runtime !== 'demo' ? [['tests', 'Pruebas']] : []), ['settings', 'Configuración']].map(([key, name]) => `<button class="tab ${key === adminTab ? 'active' : ''}" data-tab="${key}" ${key === adminTab ? 'aria-current="page"' : ''}>${name}</button>`).join('')}</nav>${errorBox()}${adminTab === 'overview' ? overview() : adminTab === 'share' ? sharePage() : adminTab === 'tests' ? testsPage() : adminTab === 'settings' ? settingsPage() : `<div class="subheading"><div><h2>El archivo de la noche.</h2><p>${adminData.total} participaciones registradas.</p></div><button class="btn btn-secondary btn-small" data-action="export">${icon('download')} Descargar CSV</button></div>${responsesTable(adminData.responses.slice().reverse())}`}<div style="height:45px"></div></div>`;
}
function winnerPage() {
  if (!revealData) return adminPage();
  const result = revealData;
  return `<section class="winner-page container"><div class="eyebrow" style="justify-content:center">EL VEREDICTO DE LA FAMILIA</div><h1>${result.kind === 'tie' ? 'La magia también <em>se comparte.</em>' : result.kind === 'empty' ? 'Aún no hay <em>una leyenda.</em>' : 'Esta noche tiene <em>su leyenda.</em>'}</h1><p>${result.kind === 'tie' ? 'Hay un empate. La corona se comparte entre quienes recibieron la mayor cantidad de votos.' : result.kind === 'empty' ? 'No se registraron votos válidos en este evento. Puedes volver a abrir la urna desde el panel.' : 'La urna habló. Este es el disfraz favorito de la familia.'}</p><div class="winner-card">${icon('crown', 'winner-crown')}<div class="winner-art">${result.winners.map(c => participantPhoto(c)).join('')}</div><h2>${escape(result.winners.map(c => c.name).join(' y ') || 'Sin ganador')}</h2><p>${result.total ? `${result.winners[0].votes} ${result.winners[0].votes === 1 ? 'voto' : 'votos'}${result.kind === 'tie' ? ' para cada uno' : ''} · ${result.winners[0].percentage}% del total` : 'No hubo participaciones'}</p><div class="ranking">${result.ranking.map(c => `<div class="rank-line"><div class="rank-label"><span>${escape(c.name)}</span><span>${c.votes} ${c.votes === 1 ? 'voto' : 'votos'} <small>(${c.percentage}%)</small></span></div><div class="rank-track"><div class="rank-fill" style="width:${c.percentage}%"></div></div></div>`).join('')}</div></div><div class="winner-actions"><button class="btn btn-primary" data-action="export">${icon('download')} Descargar respuestas</button><button class="btn btn-secondary" data-action="back-admin">Volver al panel ${icon('back')}</button></div><p class="winner-footnote">${result.total} votos válidos · Solo cuenta la selección de “Mejor disfraz”.<br>Las preguntas de humor no modifican el resultado.</p>${errorBox()}</section>`;
}
function invitationUrl(code) { const url = new URL(runtime === 'demo' ? '/demo' : '/', location.origin); url.searchParams.set('invite', code); return url.href; }
function bindForms() {
  bindSurvey();
  $('#login-form')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget;
    void busy(form.querySelector('button[type=submit]'), async () => {
      const password = form.elements.password.value;
      if (!publicData.configured && runtime === 'local') {
        if (password !== form.elements.confirm.value) throw new Error('Las claves no coinciden. Vuelve a escribirlas.');
        await setupLocal(password); publicData.configured = true;
      }
      const session = await rpc('login', { password }); token = session.token; form.reset(); await loadAdmin(); view = 'admin'; render();
    });
  });
  $('#invites-form')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget;
    void busy(form.querySelector('button[type=submit]'), async () => {
      const names = form.elements.names.value.split('\n').map(x => x.trim()).filter(Boolean);
      const result = await rpc('createInvites', { token, names, count: Number(form.elements.count.value) });
      await loadAdmin(); render(); notify(`${result.invitations.length} invitaciones creadas. Ya puedes copiar sus enlaces.`);
    });
  });
  $('#event-form')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget;
    void busy(form.querySelector('button[type=submit]'), async () => {
      const names = form.elements.candidates.value.split('\n').map(x => x.trim()).filter(Boolean);
      const candidates = adminData.total ? adminData.event.candidates : names.map((name, i) => ({ ...(adminData.event.candidates[i] || { id: `participante-${i + 1}` }), name }));
      await rpc('updateEvent', { token, title: form.elements.title.value, edition: form.elements.edition.value, theme: form.elements.theme.value, candidates });
      await loadAdmin(); publicData = await rpc('public'); render(); notify('Los detalles del evento quedaron guardados.');
    });
  });
  $('#sheet-form')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget;
    void busy(form.querySelector('button[type=submit]'), async () => { await rpc('connectSheet', { token, url: form.elements.url.value }); await loadAdmin(); render(); notify('La hoja quedó enlazada y se verificó su acceso.'); });
  });
}
document.addEventListener('click', async event => {
  const control = event.target.closest('[data-action],[data-anchor],[data-candidate],[data-edit],[data-tab],[data-response],[data-invite],[data-set-status]');
  if (!control || control.disabled) return;
  try {
    if (control.dataset.anchor) { event.preventDefault(); if (view !== 'home') { view = 'home'; render(); } document.getElementById(control.dataset.anchor)?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant' }); return; }
    if (control.dataset.candidate) {
      const c = publicData.event.candidates.find(c => c.id === control.dataset.candidate);
      openDialog(`Expediente: ${c.name}`, `${participantPhoto(c)}<p>${escape(c.tagline)}. Una presencia que nunca pasa desapercibida en nuestra noche de Halloween.</p><p style="margin-top:14px">La creatividad y la originalidad están bajo la lupa. Tu voto al mejor disfraz se decide al final del recorrido.</p><button class="btn btn-primary wide" style="margin-top:24px" data-action="dialog-start">Ir a la encuesta ${icon('arrow')}</button>`); return;
    }
    if (control.dataset.tab) { adminTab = control.dataset.tab; view = 'admin'; render(); return; }
    if (control.dataset.invite) return await copy(invitationUrl(control.dataset.invite));
    if (control.dataset.response) {
      const r = [...adminData.responses, ...(adminData.tests?.responses || [])].find(r => r.id === control.dataset.response);
      openDialog(`Respuestas de ${r.name}`, `<div class="response-detail">${publicData.questions.map((q, i) => `<div class="review-row"><small>${i + 1}. ${escape(q.prompt)}</small><p>${escape(answerLabel(q, r.answers))}</p></div>`).join('')}</div>`); return;
    }
    if (control.dataset.setStatus !== undefined) {
      $('#modal').close(); return await busy($('#main [data-action="confirm-close"]') || $('#main [data-action="confirm-open"]'), async () => { await rpc('setStatus', { token, open: control.dataset.setStatus === 'true' }); await loadAdmin(); render(); notify(adminData.event.open ? 'La urna volvió a abrirse.' : 'Votación cerrada. Ya puedes revelar el resultado.'); });
    }
    switch (control.dataset.action) {
      case 'start-test':
        if (!token || runtime === 'demo') break;
        testMode = true; storageKey = `halloween-test-${runtime}-${publicData.event.edition}-${QUESTIONNAIRE_VERSION}`;
        draft = createDraft(publicData.event.edition); draft.name = 'PRUEBA · ' + new Date().toLocaleTimeString('es-CO');
        saveDraft(); view = 'home'; render(); await startGuest(); break;
      case 'fill-test':
        if (!testMode || draft.pending || draft.receipt) break;
        draft.answers = Object.fromEntries(publicData.questions.map((q, i) => [q.id, q.options[i % q.options.length].value]));
        saveDraft(); refreshSurvey(); break;
      case 'exit-test':
        testMode = false; publicData = await rpc('public'); restoreGuestDraft();
        await loadAdmin(); adminTab = 'tests'; view = 'admin'; render(); break;
      case 'confirm-reset-tests':
        openDialog('Eliminar registros de prueba', `<p>Se eliminarán ${adminData.tests?.total || 0} ensayos de la aplicación y de <strong>Halloween_Pruebas</strong>. Los ${adminData.total} votos reales se conservarán.</p><div class="panel-actions"><button class="btn btn-primary" data-action="reset-tests">Eliminar los ensayos</button><button class="btn btn-secondary" data-action="close-dialog">Cancelar</button></div>`); break;
      case 'reset-tests':
        await busy(control, async () => { await rpc('resetTests', { token }); $('#modal').close(); await loadAdmin(); adminTab = 'tests'; view = 'admin'; render(); notify('Registros de prueba eliminados. Los votos reales se conservaron.'); }); break;
      case 'home': if (view !== 'home') { view = 'home'; render(); } else window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' }); break;
      case 'start': await startGuest(); break;
      case 'dialog-start': $('#modal').close(); await startGuest(); break;
      case 'close-dialog': $('#modal').close(); break;
      case 'sound': try { await soundtrack.toggle(); } catch { notify('No se pudo activar la música. Puedes seguir respondiendo y volver a intentarlo.'); } break;
      case 'motion': motion = !motion; try { localStorage.setItem('halloween-motion', motion ? 'on' : 'off'); } catch {} renderChrome(); animateScreen(); if (keyboardNavigation) $('[data-action=motion]')?.focus(); notify(motion ? 'Animaciones activadas.' : 'Animaciones en pausa.'); break;
      case 'reading': reading = !reading; try { localStorage.setItem('halloween-reading', reading ? 'on' : 'off'); } catch {} renderChrome(); if (keyboardNavigation) $('[data-action=reading]')?.focus(); announce(reading ? 'Letra ampliada.' : 'Tamaño de letra habitual.'); break;
      case 'demo-reset': if (runtime !== 'demo') break; await resetDemo(); token = null; adminData = null; revealData = null; invitationError = ''; draft = createDraft(publicData.event.edition); draft.code = 'HALLOWEEN-DEMO'; saveDraft(); prefetchedCode = ''; history.replaceState(null, '', '/demo'); view = 'home'; await boot(); notify('La prueba está lista para empezar otra vez.'); break;
      case 'download-receipt': if (draft.receipt) download(`${runtime === 'demo' ? 'DEMOSTRACIÓN · Sin voto real\n\n' : ''}${publicData.event.title} · ${publicData.event.edition}\nParticipación confirmada\n\nInvitado: ${draft.name}\nComprobante: ${draft.receipt.id}\nFecha: ${new Date(draft.receipt.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Colombia\n`, `comprobante-halloween-${publicData.event.edition}.txt`, 'text/plain;charset=utf-8'); break;
      case 'admin': if (testMode) { testMode = false; restoreGuestDraft(); } if (token) { await busy(control, async () => { await loadAdmin(); view = 'admin'; render(); }); } else { view = 'login'; render(); } break;
      case 'demo-admin': await busy(control, async () => { const session = await demoLogin(); token = session.token; await loadAdmin(); view = 'admin'; render(); }); break;
      case 'refresh-admin': await busy(control, async () => { await loadAdmin(); render(); notify('Panel actualizado.'); }); break;
      case 'logout': await busy(control, async () => { await rpc('logout', { token }); token = null; adminData = null; testMode = false; restoreGuestDraft(); view = 'login'; render(); }); break;
      case 'export': await busy(control, async () => { const data = await rpc('export', { token }); download(data.csv, data.filename); notify('Descarga preparada.'); }); break;
      case 'sync': await busy(control, async () => { await rpc('syncSheet', { token }); await loadAdmin(); render(); notify('Sincronización terminada.'); }); break;
      case 'copy-shared': await copy(new URL(runtime === 'demo' ? '/demo' : '/', location.origin).href); break;
      case 'another-person': draft = createDraft(publicData.event.edition); saveDraft(); refreshSurvey(); $('#guest-name')?.focus(); break;
      case 'copy-all': { const available = adminData.invitations.filter(i => !i.used); if (!available.length) return notify('No hay invitaciones disponibles para copiar.'); await copy(available.map(i => `${i.name || 'Invitación personal'}: ${invitationUrl(i.code)}`).join('\n')); break; }
      case 'confirm-close': openDialog('¿Sellamos la urna?', `<p>Hay ${adminData.total} participaciones. Al cerrar, se detienen los nuevos votos y podrás revelar al ganador.</p><div class="panel-actions"><button class="btn btn-primary" data-set-status="false">Sí, cerrar votaciones ${icon('lock')}</button><button class="btn btn-secondary" data-action="close-dialog">Seguir recibiendo votos</button></div>`); break;
      case 'confirm-open': openDialog('¿Volvemos a abrir?', `<p>Se permitirán nuevos votos desde el enlace compartido. Tendrás que cerrar la urna de nuevo para revelar un resultado actualizado.</p><div class="panel-actions"><button class="btn btn-primary" data-set-status="true">Volver a abrir ${icon('ticket')}</button><button class="btn btn-secondary" data-action="close-dialog">Cancelar</button></div>`); break;
      case 'reveal': await busy(control, async () => { revealData = await rpc('reveal', { token }); view = 'winner'; render(); tone([392, 523, 659, 784]); if (revealData.total) celebrate(); }); break;
      case 'back-admin': await loadAdmin(); view = 'admin'; render(); break;
      case 'retry-boot': await boot(); break;
    }
  } catch (error) { showError(error); }
});
async function boot() {
  try {
    publicData = await rpc('public'); restoreGuestDraft(); render();
  } catch (error) {
    main.innerHTML = `<section class="success-page"><div class="success-emblem">${icon('ghost')}</div><h1>La puerta está<br><em>un poquito atascada.</em></h1><p>${escape(error.message || 'No pudimos cargar el formulario. Vuelve a intentarlo en un momento.')}</p><button class="btn btn-primary" data-action="retry-boot" style="margin-top:25px">Volver a intentar ${icon('refresh')}</button></section>`;
  }
}
document.addEventListener('input', event => {
  if (!event.target.matches('[data-music-volume]')) return;
  soundtrack.setVolume(Number(event.target.value) / 100); updateMusicControls();
  try { localStorage.setItem('halloween-volume', String(soundtrack.volume)); } catch {}
});
document.addEventListener('keydown', () => {
  if (!keyboardNavigation) { keyboardNavigation = true; document.documentElement.classList.add('keyboard-navigation'); cleanMotion(); }
});
document.addEventListener('pointerdown', () => { keyboardNavigation = false; document.documentElement.classList.remove('keyboard-navigation'); }, { passive: true });
document.addEventListener('error', event => { if (event.target.tagName === 'IMG' && event.target.closest('.portrait, .participant-photo')) event.target.closest('.portrait, .participant-photo').classList.add('asset-unavailable'); }, true);
window.addEventListener('pagehide', () => soundtrack.pause());
void soundtrack.autoplay(document);
void boot();
