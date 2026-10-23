import { icon, avatar as vectorAvatar } from './art.js';
import { SECTION_LABELS } from '../shared/content.js';
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function portrait(character = 'ghost', extra = '') {
  const name = ['witch', 'vampire', 'ghost'].includes(character) ? character : 'ghost';
  return `<span class="portrait portrait-${name} ${extra}" aria-hidden="true">${vectorAvatar(name)}<img src="/assets/${name}-v2.webp" width="480" height="960" alt="" loading="lazy" decoding="async"></span>`;
}

const photos = {
  antonia: { width: 900, height: 1351 },
  guillermo: { width: 667, height: 1000 },
  andrea: { width: 898, height: 1600 },
};
export function participantPhoto(candidate, decorative = false) {
  const name = String(candidate.name || '').trim();
  const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const photo = photos[key], initials = name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('');
  return `<span class="participant-photo ${photo ? 'person-' + key : 'photo-placeholder'}" ${decorative ? 'aria-hidden="true"' : ''}><span class="photo-initials" aria-hidden="true">${e(initials)}</span>${photo ? `<img src="/assets/${key}.webp" width="${photo.width}" height="${photo.height}" alt="${decorative ? '' : e('Fotografía de ' + name)}" loading="lazy" decoding="async">` : ''}</span>`;
}

export function nightScene() {
  return '<picture class="hero-poster"><source media="(max-width:760px)" srcset="/assets/mansion-v2-mobile.webp" type="image/webp"><source srcset="/assets/mansion-v2.webp" type="image/webp"><img src="/assets/mansion-v2.jpg" width="1536" height="1024" fetchpriority="high" alt="Una mansión encantada con ventanas doradas, luna naranja, calabazas y fantasmas amigables"></picture>';
}
const countWord = n => n === 3 ? 'Tres' : String(n);

export function homeView({ publicData, draft, runtime, testMode = false, linked = false, invitationError = '' }) {
  const event = publicData.event, localSetup = runtime === 'local' && !publicData.configured;
  const action = localSetup
    ? `<a class="btn btn-primary hero-cta" href="/demo">Probar la encuesta ${icon('arrow')}</a>`
    : `<button class="btn btn-primary hero-cta" data-action="start">${draft.receipt ? 'Ver mi comprobante' : Object.keys(draft.answers).length ? 'Ir a mis respuestas' : 'Ir a la encuesta'} ${icon('arrow')}</button>`;
  return `<section class="cinema-hero" id="experiencia">
    ${nightScene()}<div class="hero-vignette" aria-hidden="true"></div><div class="mist-layer mist-one" aria-hidden="true"></div><div class="mist-layer mist-two" aria-hidden="true"></div>
    <div class="fireflies" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="left:${9 + (i * 37) % 84}%;top:${24 + (i * 19) % 64}%"></i>`).join('')}</div>
    <div class="cinema-copy"><div class="cinema-kicker"><span class="tiny-star">✦</span> ${e(event.title)} <span class="kicker-year">${e(event.edition)}</span></div>
      <h1><span class="title-line">El baile de</span><span class="title-line"><em>las sombras.</em></span></h1>
      <p class="cinema-description">Una familia. ${countWord(event.candidates.length).toLowerCase()} sospechosos.<br>Y una corona que no se gana <em>por pesar.</em></p>
      <div class="cinema-actions">${action}<a class="hero-secondary" href="#sospechosos" data-anchor="sospechosos">Conocer a los participantes ${icon('arrow')}</a></div>
      <div class="hero-assurance">${icon('clock')} ${publicData.questions.length} preguntas <span>·</span> Todo en esta página</div>
      <div class="family-cast"><span class="cast-faces">${event.candidates.slice(0, 3).map(c => participantPhoto(c, true)).join('')}</span><p>${e(event.candidates.slice(0, 3).map(c => c.name).join(', '))}<br><strong>ya están bajo sospecha.</strong></p></div>
    </div>
    <div class="hero-spirit" aria-hidden="true">${portrait('ghost')}</div><div class="gold-ticket" aria-label="Premio al mejor disfraz"><span class="ticket-kicker">PASE A UNA NOCHE DE LEYENDA</span>${icon('crown')}<strong>El mejor<br><em>disfraz.</em></strong><span class="ticket-serial">UNA CORONA · MUCHAS SOSPECHAS</span><span class="ticket-stamp">VL<br>${e(event.edition)}</span></div>
    <div class="hero-floor"><span class="live-pill ${event.open ? '' : 'closed'}"><span class="live-dot"></span>${publicData.configured ? event.open ? 'La fiesta está recibiendo votos' : 'La urna está cerrada' : 'La experiencia está por comenzar'}</span><span class="hero-floor-copy">Esta noche, la última palabra la tienes tú.</span><a href="#sospechosos" data-anchor="sospechosos" class="scroll-cue" aria-label="Conocer a los participantes">${icon('back')}</a></div>
  </section>
  <div class="container v2-content">
    <section id="sospechosos" class="nominees-section real-participants">
      <div class="section-header"><div><span class="eyebrow">LOS PROTAGONISTAS DE LA NOCHE</span><h2>Conoce a<br><em>los participantes.</em></h2></div><p>Primero las caras conocidas.<br>Más abajo, tus respuestas y tu voto.</p></div>
      <div class="nominee-grid">${event.candidates.map((c, i) => `<button class="nominee-card nominee-${e(c.color)}" data-candidate="${e(c.id)}" aria-label="Conocer a ${e(c.name)}"><span class="nominee-badge">PARTICIPANTE ${String(i + 1).padStart(2, '0')}</span><div class="nominee-stage">${participantPhoto(c)}</div><div class="nominee-info"><span><h3>${e(c.name)}</h3><p>${e(c.tagline)}</p></span><span class="nominee-open">${icon('arrow')}</span></div></button>`).join('')}</div>
      <p class="participants-caption">Al final de la encuesta, elige tu disfraz favorito de la fiesta.</p>
    </section>
    <section class="theme-note"><span class="theme-symbol">${icon('leaf')}</span><div><small>EL TEMA DE ESTA EDICIÓN</small><h3>${e(event.theme)}</h3><p>Creatividad, familia y muchas ganas de pasarla bien.</p></div><span class="theme-edition">${e(event.edition)}</span></section>
    <section id="como-funciona" class="simple-guide"><div><span>1</span><p>Escribe tu nombre.</p></div><div><span>2</span><p>Baja y toca tus respuestas.</p></div><div><span>3</span><p>Elige tu favorito y envía.</p></div></section>
  </div>
  <div id="survey-region">${surveyView({ publicData, draft, runtime, testMode, linked, invitationError })}</div>`;
}

function questionView(q, index, event, draft) {
  const selected = draft.answers[q.id];
  const choices = q.id === 'vote'
    ? `<div class="ballot-options">${event.candidates.map(c => `<label class="ballot-option"><input type="radio" id="answer-${q.id}-${e(c.id)}" name="${q.id}" value="${e(c.id)}" ${selected === c.id ? 'checked' : ''} required>${participantPhoto(c, true)}<span class="ballot-name">${e(c.name)}</span><span class="ballot-caption">Votar por ${e(c.name)}</span><span class="ballot-check" aria-hidden="true">${icon('check')}</span></label>`).join('')}</div>`
    : `<div class="options">${q.options.map(o => `<label class="option"><input type="radio" id="answer-${q.id}-${e(o.value)}" name="${q.id}" value="${e(o.value)}" ${selected === o.value ? 'checked' : ''} required><span class="option-label">${e(o.label)}</span><span class="selection-mark" aria-hidden="true">${icon('check')}</span></label>`).join('')}</div>`;
  return `<fieldset id="question-${q.id}" class="survey-question ${q.id === 'vote' ? 'survey-vote' : ''}" data-question="${q.id}" data-complete="${selected !== undefined}" aria-describedby="error-${q.id}">
    <legend><span class="survey-question-number">${index + 1}</span><span>${e(q.prompt)}</span></legend>
    ${q.aside ? `<p class="survey-context">${e(q.aside)}</p>` : ''}
    ${choices}<p id="error-${q.id}" class="field-error" hidden></p>
  </fieldset>`;
}

export function receiptView({ draft, runtime }) {
  const when = new Date(draft.receipt.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  if (draft.receipt.test) return `<section id="survey-receipt" class="inline-receipt" tabindex="-1" aria-labelledby="receipt-heading"><div class="receipt-heading-icon">${icon('check')}</div><h3 id="receipt-heading">Prueba registrada</h3><p>Este ensayo <strong>no cuenta como voto real</strong> y no modifica al ganador.</p><div class="receipt"><strong>Guardada en la base de datos</strong><span>${draft.receipt.sheet?.connected && !draft.receipt.sheet.pending ? 'Copia confirmada en Halloween_Pruebas' : 'Copia a Google pendiente o sin conectar'}</span><span>${e(when)} · Colombia</span><small>Comprobante de prueba: ${e(draft.receipt.id)}</small></div><div class="receipt-actions"><button type="button" class="btn btn-primary" data-action="start-test">Nueva prueba</button><button type="button" class="btn btn-secondary" data-action="exit-test">Volver al panel de pruebas</button></div></section>`;
  return `<section id="survey-receipt" class="inline-receipt" tabindex="-1" aria-labelledby="receipt-heading"><div class="receipt-heading-icon">${icon('check')}</div><h3 id="receipt-heading">¡Tu voto quedó registrado!</h3><p>Gracias, ${e(draft.name)}. El anfitrión anunciará al ganador al final de la fiesta.</p><div class="receipt"><strong>Participación confirmada</strong><span>${e(when)} · Colombia</span><small>Comprobante: ${e(draft.receipt.id)}</small></div><div class="receipt-actions"><button type="button" class="btn btn-secondary" data-action="download-receipt">${icon('download')} Guardar comprobante</button>${runtime === 'demo' ? '<button type="button" class="btn btn-primary" data-action="demo-reset">Probar otra vez</button>' : '<button type="button" class="btn btn-primary" data-action="another-person">Responder para otra persona</button>'}</div>${runtime === 'demo' ? '<p class="receipt-demo-note">Esta fue una demostración. No se enviaron votos reales.</p>' : ''}</section>`;
}

export function surveyView({ publicData, draft, runtime, testMode = false, linked = false, invitationError = '' }) {
  const { event, questions } = publicData;
  const count = questions.filter(q => q.options.some(o => o.value === draft.answers[q.id])).length;
  const locked = Boolean(draft.pending || draft.receipt || !publicData.configured || !event.open);
  const voted = event.candidates.find(c => c.id === draft.answers.vote);
  return `<section class="container survey-section" id="encuesta" aria-labelledby="survey-title">
    <div class="survey-heading"><span class="eyebrow">AHORA TE TOCA A TI</span><h2 id="survey-title">La encuesta<br><em>de esta noche.</em></h2><p>Escribe tu nombre y responde las preguntas bajando por esta página.<br>Cuando termines, pulsa <strong>Enviar mis respuestas y mi voto</strong>.</p></div>
    <form id="survey-form" class="survey-paper question-paper" novalidate>
      <div class="survey-progress"><div><strong data-survey-count>${count} de ${questions.length} respondidas</strong><span>${testMode ? 'MODO DE PRUEBA · No cuenta como voto.' : 'Tu avance se guarda en este dispositivo.'}</span></div><div class="progress-track" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${count}"><div class="progress-fill" data-survey-fill style="transform:scaleX(${count / questions.length})"></div></div></div>
      ${!publicData.configured ? '<div id="survey-unavailable" class="survey-notice">El anfitrión está preparando la fiesta. No tienes que configurar nada. Vuelve a abrir esta página en un momento.</div>' : !event.open && !draft.receipt && !draft.pending ? '<div class="survey-notice">La urna está cerrada. Gracias por acompañarnos esta noche.</div>' : ''}
      <div id="survey-feedback" class="survey-feedback" role="alert" ${draft.pending ? '' : 'hidden'}>${draft.pending ? 'Necesitamos confirmar tu envío anterior. Tus respuestas están protegidas. Pulsa Confirmar mi envío para recuperar el comprobante sin duplicar el voto.' : ''}</div>
      <fieldset id="survey-fields" class="survey-fields" ${locked ? 'disabled' : ''}>
        <legend class="sr-only">Tu nombre y las ${questions.length} respuestas de Halloween</legend>
        <section class="survey-identity" aria-labelledby="guest-heading"><h3 id="guest-heading">Primero, tu nombre</h3><p>Solo necesitamos saber quién participa. Todas las preguntas son obligatorias.</p>
          <div class="field"><label for="guest-name">Tu nombre completo y apellidos</label><input id="guest-name" name="name" autocomplete="name" maxlength="80" required aria-describedby="error-name" value="${e(draft.name)}" placeholder="Escribe tu nombre aquí"><p id="error-name" class="field-error" hidden></p></div>
        </section>
        ${Object.entries(SECTION_LABELS).map(([section, label], i) => {
          const group = questions.filter(q => q.section === section);
          return `<section class="survey-chapter" aria-labelledby="chapter-${section}"><header class="survey-chapter-heading"><span>${String(i + 1).padStart(2, '0')}</span><div><small>${section === 'vote' ? 'EL VOTO QUE DECIDE AL GANADOR' : `${group.length} PREGUNTAS`}</small><h3 id="chapter-${section}">${e(label)}</h3></div>${icon(section === 'vote' ? 'crown' : i < 3 ? 'ghost' : 'spark')}</header>${group.map(q => questionView(q, questions.indexOf(q), event, draft)).join('')}</section>`;
        }).join('')}
      </fieldset>
      <div class="survey-finish"><div id="vote-summary" class="vote-summary">${voted ? `Tu voto al mejor disfraz es para <strong>${e(voted.name)}</strong>.` : 'Al final, elige quién merece la corona al mejor disfraz.'}</div>
        ${draft.receipt ? receiptView({ draft, runtime }) : `<p class="survey-final-note">${testMode ? 'Es un ensayo del formulario completo. Se guardará separado de los votos reales.' : 'Puedes cambiar cualquier respuesta antes de enviar. Cada persona puede votar una sola vez con su nombre completo.'}</p><button id="send-survey" class="btn btn-primary wide" type="submit" ${!publicData.configured || !event.open && !draft.pending ? 'disabled' : ''}>${draft.pending ? 'Confirmar mi envío' : testMode ? 'Enviar registro de prueba' : 'Enviar mis respuestas y mi voto'} ${icon('lock')}</button><p class="survey-private-note">${icon('lock')} ${testMode ? 'Solo el anfitrión puede registrar ensayos. No cuentan para el ganador.' : 'El resultado lo revela el anfitrión cuando cierre las votaciones.'}</p>`}
      </div>
    </form>
  </section>`;
}
