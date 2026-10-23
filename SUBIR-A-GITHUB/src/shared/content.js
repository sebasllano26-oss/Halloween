const question = (id, prompt, labels, section, aside = '') => ({
  id, prompt, section, aside, options: labels.map((label, i) => ({ value: String(i), label })),
});

export const DEFAULT_EVENT = {
  title: 'Halloween Vélez López', edition: '2026',
  theme: 'Animales de la selva tropical', open: true, revealedAt: null,
  candidates: [
    { id: 'antonia', name: 'Antonia', character: 'witch', color: 'purple', tagline: 'Creatividad bajo sospecha' },
    { id: 'guillermo', name: 'Guillermo', character: 'vampire', color: 'orange', tagline: 'La leyenda de Doña Gloria' },
    { id: 'andrea', name: 'Andrea', character: 'ghost', color: 'green', tagline: 'El espíritu más original' },
  ],
};

export const QUESTIONNAIRE_VERSION = 'familia-2026-v2';

export const QUESTIONS = [
  question("q1", "¿Por qué Guillermo siempre gana el concurso de disfraces?", ["Porque tiene un talento sobrenatural.","Porque Doña Gloria debería estar nominada, no él.","Porque tiene comprado al jurado desde 2020.","Porque en esta familia no existe la democracia."], "guillermo"),
  question("q2", "Si Doña Gloria renuncia, ¿qué pasaría con Guillermo?", ["Se presenta en pijama.","Se cancela Halloween por falta de talento.","Contrata a otra Gloria.","Por primera vez conocemos su verdadera creatividad (cero)."], "guillermo"),
  question("q3", "¿Cuál es el mayor miedo de Guillermo en Halloween?", ["Los fantasmas.","Que Doña Gloria se vaya de vacaciones.","Que Andrea gane.","Que alguien pida una auditoría de los votos."], "guillermo"),
  question("q4", "¿Qué debería hacer Guillermo si pierde este año?", ["Exigir un recuento de votos.","Llamar a Doña Gloria para pedir explicaciones.","Aceptar que su época de gloria terminó.","Pedirle a Andrea consejos para perder con dignidad."], "guillermo"),
  question("q5", "¿Por qué Andrea nunca gana Halloween?", ["Porque la envidia es muy atrevida.","Porque la familia no está preparada para tanto talento.","Porque sus disfraces necesitan explicación.","Porque Guillermo controla la Registraduría."], "andrea"),
  question("q6", "¿Qué hace Andrea después de perder?", ["Felicita al ganador con una sonrisa falsa.","Dice que el concurso está arreglado.","Promete no volver a participar (mentira).","Todas las anteriores."], "andrea"),
  question("q7", "Si Andrea ganara Halloween, ¿qué pasaría?", ["Se declara festivo nacional.","Guillermo pide revisión del resultado.","Antonia deja de hablarle por tres días.","Doña Gloria presenta una demanda."], "andrea"),
  question("q8", "¿Cuál es el verdadero talento de Andrea?", ["Gastarse más plata en el disfraz que en el mercado.","Creer todos los años que va a ganar.","Hacer campaña electoral por WhatsApp.","Perder y seguir participando con entusiasmo."], "andrea"),
  question("q9", "¿Por qué las amigas de Antonia siempre votan por ella?", ["Porque son amigas de verdad.","Porque tienen miedo de perder la amistad.","Porque Antonia les revisa el formulario antes de enviarlo.","Porque les prometió papas BBQ."], "antonia"),
  question("q10", "¿Qué pasaría si Antonia pierde?", ["Dice que no le importa (sí le importa).","Bloquea a todos los votantes.","Exige repetir las elecciones.","Se come todos los dulces para superar el trauma."], "antonia"),
  question("q11", "¿Cuál es la estrategia electoral de Antonia?", ["Hacer campaña en TikTok.","Comprar votos con gomitas.","Convencer a sus amigas de que es obligatorio votar por ella.","Todas las anteriores."], "antonia"),
  question("q12", "¿Cuánto te pagaron por tu voto?", ["Nada, soy una persona íntegra.","Un aguacate de Guillermo.","Una bolsa de gomitas de Antonia.","Andrea me prometió una transferencia por Nequi."], "votantes"),
  question("q13", "¿Qué tan transparente consideras este concurso?", ["Más transparente que las elecciones presidenciales.","Necesitamos observadores internacionales.","Los resultados ya estaban decididos.","¿Transparente? JAJAJAJA."], "votantes"),
  question("q14", "Si tuvieras que eliminar a un participante, ¿a quién sacarías?", ["Guillermo, por abuso de poder.","Andrea, por insistir.","Antonia, por manipulación electoral.","A ninguno, necesito este espectáculo todos los años."], "votantes"),
  question("q15", "¿Qué debería recibir el peor disfraz?", ["Una cita urgente con Doña Gloria.","Una prohibición de participar durante cinco años.","Un bono para comprar creatividad.","Un aplauso por tener el descaro de presentarse."], "votantes"),
  question("q16", "¿Cuál es el verdadero secreto de juventud de Guillermo?", ["Dormir ocho horas.","Comer aguacate.","No tener pelo que se le ponga blanco.","Delegarle todos los problemas a Doña Gloria."], "familia"),
  question("q17", "¿Qué tienen en común Guillermo, Andrea y Antonia?", ["Una creatividad extraordinaria.","Un ego más grande que sus disfraces.","Que ninguno sabe perder.","Que los tres creen que son los favoritos de la familia."], "familia"),
  question("q18", "Si los Vélez López fueran un reality, ¿cómo se llamaría?", ["Keeping Up with the Vélez.","La casa de los tramposos.","Desafío Halloween: todos contra Guillermo.","Yo me llamo Doña Gloria."], "familia"),
  question("q19", "¿Quién necesita más terapia después de Halloween?", ["Andrea, por perder otro año.","Guillermo, si no gana.","Antonia, por no recibir suficientes votos.","El resto de la familia, por aguantarlos."], "familia"),
  question("q20", "¿Cuál es la verdadera razón por la que seguimos haciendo este concurso?", ["Por amor a la tradición.","Para ver a Andrea perder.","Para que Guillermo tenga su momento de fama.","Porque es la única noche del año en la que podemos insultarnos democráticamente."], "familia"),
  question("q21", "Después de responder este formulario, ¿qué opinas de la familia Vélez López?", ["Necesitan ayuda profesional.","Guillermo debería estar investigado por fraude electoral.","Andrea necesita aprender a perder.","Antonia debería dejar de amenazar a sus amigas.","Quiero que me adopten, esta familia está buenísima."], "cierre"),
  question("q22", "¿Quién es la verdadera víctima de esta tradición?", ["Guillermo, porque lo acusan injustamente.","Andrea, porque nadie reconoce su talento.","Antonia, porque tiene que conseguir votos todos los años.","Doña Gloria, porque trabaja y otro se lleva el premio."], "cierre"),
  { id: 'vote', prompt: '¿Quién se lleva la corona al mejor disfraz?', section: 'vote', aside: 'Este es el voto que decide al ganador. Que gane la creatividad… ¡y que los aguacates no te distraigan!', options: DEFAULT_EVENT.candidates.map(c => ({ value: c.id, label: c.name })) },
];

export const SECTION_LABELS = {
  "guillermo": "Sobre Guillermo, el eterno ganador sospechoso",
  "andrea": "Sobre Andrea, la eterna incomprendida",
  "antonia": "Sobre Antonia y su club de fans",
  "votantes": "Preguntas para poner incómodos a los votantes",
  "familia": "Preguntas de cultura general familiar",
  "cierre": "Mi favorita para cerrar el formulario",
  "vote": "La urna embrujada"
};
