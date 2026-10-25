// ─────────────────────────────────────────────────────────────
//  INTERPRETACIÓN DE CADA COMPETENCIA SEGÚN SU PUNTAJE
//  Cada competencia tiene 8 reactivos, así que su puntaje va de 8 a 40:
//    Bajo  8-22  ·  Medio 23-32  ·  Alto 33-40
//  Para cambiar un texto, edita la línea correspondiente (conserva las comillas).
// ─────────────────────────────────────────────────────────────
export const RANGOS = {
  bajo: { min: 8, max: 22, label: 'Bajo' },
  medio: { min: 23, max: 32, label: 'Medio' },
  alto: { min: 33, max: 40, label: 'Alto' }
};

export function rangoDe(sum) {
  if (sum <= RANGOS.bajo.max) return 'bajo';
  if (sum <= RANGOS.medio.max) return 'medio';
  return 'alto';
}

export const INTERPRETACIONES = {
  'Capacidad de análisis': {
    bajo: 'Muestra serias dificultades para interpretar datos, desglosar problemas complejos o identificar las causas raíz de un conflicto. Tiende a procesar la información de forma superficial, lo que puede llevarlo a tomar decisiones basadas en suposiciones más que en hechos objetivos.',
    medio: 'Es capaz de examinar datos básicos, comprender situaciones laborales cotidianas y descomponer la información en sus partes esenciales bajo condiciones normales de trabajo. Cumple con el análisis requerido para sus funciones del día a día.',
    alto: 'Destaca por una agudeza mental sobresaliente para interpretar flujos complejos de información, encontrar patrones ocultos, prever escenarios críticos con alta precisión y conectar variables operativas o estratégicas que otros pasan por alto.'
  },
  'Capacidad para resolver problemas': {
    bajo: 'Tiende a bloquearse, frustrarse o depender excesivamente de sus superiores ante imprevistos u obstáculos. Le cuesta trabajo proponer alternativas viables y prefiere delegar el conflicto o aplicar soluciones improvisadas de corto alcance.',
    medio: 'Soluciona las contingencias habituales de su puesto aplicando métodos y procedimientos ya conocidos dentro de la organización. Enfrenta los problemas con una actitud constructiva y lógica dentro de su zona de responsabilidad.',
    alto: 'Encuentra soluciones efectivas, rápidas y sumamente ingeniosas ante crisis o problemas completamente inéditos. Destaca por su pensamiento lateral y su habilidad para transformar una situación caótica en una oportunidad de mejora.'
  },
  'Proactividad': {
    bajo: 'Muestra un perfil meramente reactivo en el trabajo. Requiere supervisión constante y el empuje de sus jefes para avanzar, limitándose a actuar únicamente cuando recibe instrucciones directas o cuando la urgencia de la situación lo obliga.',
    medio: 'Cumple con sus tareas en los tiempos establecidos y, de forma ocasional o cuando el entorno lo propicia, propone mejoras para su área. No se limita a esperar, pero prefiere moverse dentro de los límites seguros de sus funciones.',
    alto: 'Actúa con total autonomía e iniciativa. Se anticipa con éxito a los problemas futuros, detecta necesidades antes de que se vuelvan críticas y genera proyectos propios de alto valor sin necesidad de recibir un mandato superior.'
  },
  'Autocontrol': {
    bajo: 'Perfil impulsivo o de baja tolerancia. Sus emociones (enojo, frustración, ansiedad) interfieren de manera negativa en su desempeño, en la toma de decisiones o en el clima laboral de su equipo, reaccionando de forma visceral ante la crítica.',
    medio: 'Maneja sus reacciones emocionales de manera adecuada en el día a día corporativo. Aunque experimente frustración, es capaz de mantener la compostura y el profesionalismo frente a desacuerdos o momentos de tensión habituales.',
    alto: 'Mantiene una ecuanimidad impecable y una mente fría incluso bajo niveles extremos de hostilidad, crisis o tensión. Domina sus respuestas emocionales por completo, transmitiendo paz a su equipo y decidiendo siempre de manera racional.'
  },
  'Capacidad para afrontar la presión': {
    bajo: 'Su rendimiento y claridad mental disminuyen drásticamente ante altas cargas de trabajo, metas agresivas o plazos de entrega muy ajustados. Tiende al agobio continuo, cometiendo errores por descuidos debido al estrés laboral.',
    medio: 'Tolera los picos de estrés comunes en el mercado laboral mexicano. Sabe administrar sus niveles de energía para cumplir con sus entregas a tiempo, manteniendo un rendimiento estable en periodos normales de alta demanda.',
    alto: 'Incrementa o mantiene al máximo su productividad y enfoque aun en entornos de alta exigencia, caos, cambios de último momento o urgencias extremas. La presión actúa como un catalizador en su desempeño en lugar de ser un freno.'
  },
  'Relaciones sociales': {
    bajo: 'Perfil aislado o con marcadas barreras de comunicación. Se le dificulta establecer vínculos de confianza, entablar conversaciones espontáneas o interactuar fluidamente con compañeros de otras áreas, limitando su red interna.',
    medio: 'Interactúa de manera cordial, educada y funcional con su entorno de trabajo habitual. Sabe integrarse socialmente a los rituales de la oficina y mantiene una convivencia armoniosa y respetuosa con sus colegas.',
    alto: 'Posee una facilidad sobresaliente para hacer networking, generar empatía inmediata y romper el hielo con cualquier perfil jerárquico. Construye de manera natural sólidas redes de apoyo e influencias basadas en la confianza mutua.'
  },
  'Colaboración': {
    bajo: 'Muestra una actitud individualista u hostil hacia las necesidades de los demás. Prioriza exclusivamente su agenda personal, es territorial con su información o recursos, y manifiesta resistencia o quejas cuando se le pide apoyar a otra área.',
    medio: 'Muestra total disposición para cooperar cuando se le solicita formalmente o cuando entiende que el proyecto requiere de su apoyo. Es un miembro del equipo que no obstaculiza el trabajo de los demás y ayuda bajo parámetros razonables.',
    alto: 'Altamente solidario y con un sentido innato de servicio. Busca de manera activa cómo facilitar el éxito de sus compañeros, comparte abiertamente sus conocimientos y promueve una cultura interna de ayuda mutua desinteresada.'
  },
  'Comunicación eficaz': {
    bajo: 'Sus mensajes suelen ser confusos, desorganizados o inoportunos. Presenta problemas para practicar la escucha activa, asume cosas en lugar de preguntar y puede carecer de tacto o asertividad al momento de expresar sus desacuerdos.',
    medio: 'Transmite sus ideas, reportes e instrucciones de forma clara, directa y estructurada en sus labores diarias. Sabe escuchar y utiliza los canales organizacionales idóneos para mantener informados a sus jefes y pares.',
    alto: 'Comunicador de alto impacto y gran elocuencia. Domina el lenguaje verbal y no verbal, posee una escucha activa perfecta y tiene la habilidad de adaptar con maestría su discurso para conectar con audiencias operativas, comerciales o directivas.'
  },
  'Valores': {
    bajo: 'Alerta crítica en reclutamiento. Podría justificar conductas antiéticas, atajos cuestionables o anteponer su beneficio personal por encima de las normas y políticas institucionales. Su comportamiento genera desconfianza en el entorno.',
    medio: 'Respeta firmemente los códigos de ética de la empresa, actúa con honestidad en sus reportes y cuida los recursos de la organización. Es una persona confiable que se alinea a la legalidad y los valores corporativos básicos.',
    alto: 'Un referente moral inquebrantable dentro de la organización. Actúa bajo principios éticos impecables incluso cuando nadie lo está observando y prefiere asumir costos personales antes que comprometer la transparencia o rectitud de sus actos.'
  },
  'Responsabilidad': {
    bajo: 'Informal o inconstante en sus funciones. Suele justificarse o culpar a factores externos cuando se retrasa en sus entregas, evade las consecuencias de sus errores y requiere de recordatorios continuos para cumplir sus compromisos.',
    medio: 'Es una persona formal, cumplida y puntual con las tareas, horarios y objetivos asignados a su puesto. Asume la autoría de sus aciertos y desaciertos, buscando corregir de inmediato cualquier desviación en su trabajo.',
    alto: 'Compromiso institucional absoluto. Asume el rol de "dueño" de sus procesos, responde por los resultados de manera incondicional y siempre está dispuesto a dar un esfuerzo extra con tal de asegurar el éxito impecable de un proyecto.'
  },
  'Orientación al cambio': {
    bajo: 'Perfil sumamente rígido. Muestra resistencia activa o pasiva (quejas, boicot, retrasos) ante la implementación de nuevas directrices, herramientas tecnológicas o reestructuraciones, prefiriendo quedarse anclado a los métodos antiguos.',
    medio: 'Se adapta con una velocidad aceptable al ritmo habitual de transformaciones y modificaciones operativas de la empresa. Una vez entendida la razón del cambio, reajusta sus rutinas sin mayor conflicto.',
    alto: 'Perfil altamente versátil y dinámico. No solo asimila las transformaciones con entusiasmo y rapidez, sino que actúa como un agente de cambio que impulsa, motiva y ayuda a sus compañeros a adoptar las nuevas visiones de la empresa.'
  },
  'Emprendimiento': {
    bajo: 'Pasivo y conforme. Prefiere mantenerse de forma indefinida dentro de los límites estrictos de su zona de confort y procesos preestablecidos, mostrando desinterés por explorar nuevas unidades o áreas de oportunidad corporativas.',
    medio: 'Sabe identificar áreas de oportunidad o mejoras viables dentro de su propia esfera de trabajo cotidiano, buscando eficientar los recursos o proponer pequeños giros que optimicen las tareas actuales de su puesto.',
    alto: 'Perfil intraemprendedor puro. Tiene visión de negocio a largo plazo, detecta nichos de mercado inexplorados, diseña nuevas líneas de servicio o proyectos disruptivos y asume riesgos calculados que generan un alto valor económico y estratégico.'
  },
  'Creatividad': {
    bajo: 'Pensamiento rígido o convencional. Le cuesta trabajo salirse de los manuales de operación o "pensar fuera de la caja", aportando soluciones lineales que repiten fórmulas del pasado que podrían ya no ser efectivas.',
    medio: 'Aporta enfoques frescos, ideas originales o combinaciones diferentes de manera esporádica o cuando se le convoca a sesiones de lluvia de ideas. Cumple de manera estándar con la innovación que requiera su puesto.',
    alto: 'Una mente brillante y disruptiva. Genera ideas fuera de lo común constantemente, propone metodologías artísticas o lógicas completamente novedosas y encuentra conexiones inesperadas para resolver retos que parecían imposibles.'
  },
  'Persuasión': {
    bajo: 'Perfil inseguro, pasivo o excesivamente impositivo al negociar. Tiene serias dificultades para convencer a otros, rebatir objeciones con argumentos sólidos o defender sus puntos de vista, perdiendo credibilidad ante sus interlocutores.',
    medio: 'Logra vender sus proyectos, ideas o propuestas argumentando con lógica, datos reales y un trato respetuoso. Consigue el visto bueno de sus jefes o clientes bajo condiciones normales de negociación laboral.',
    alto: 'Maestro de la influencia y la negociación asertiva. Lee perfectamente las motivaciones de su interlocutor, desarma objeciones con carisma y una retórica impecable, logrando alinear voluntades difíciles y cerrando acuerdos complejos con gran facilidad.'
  },
  'Liderazgo': {
    bajo: 'Carece de autoridad moral o herramientas de gestión. Puede caer en un estilo autoritario basado en el miedo o, por el contrario, en una sumisión extrema que le impide coordinar, delegar o inspirar el esfuerzo de un equipo de trabajo.',
    medio: 'Coordina adecuadamente actividades cotidianas, asigna roles de forma equitativa y supervisa el avance de sus colaboradores de forma funcional. Mantiene al grupo enfocado y resuelve desacuerdos básicos con mediación razonable.',
    alto: 'Líder inspirador y transformacional. Logra movilizar e inyectar entusiasmo a las masas, posee una gran habilidad para detectar y desarrollar el talento de su gente, y unifica los esfuerzos individuales hacia una visión ambiciosa y compartida.'
  },
  'Trabajo en equipo': {
    bajo: 'Genera roces constantes, divisiones o prefiere trabajar de forma completamente aislada. Fractura la sinergia del grupo al anteponer su ego, competir destructivamente con sus pares o desentenderse de las metas colectivas.',
    medio: 'Se integra de forma positiva a las dinámicas del equipo, respeta los roles asignados, participa activamente en las juntas de planeación y cumple con su parte del trabajo para no retrasar el avance de los demás miembros.',
    alto: 'El pegamento del equipo y promotor clave de la sinergia. Sabe capitalizar las fortalezas individuales de cada integrante, media de forma magistral los conflictos internos y crea un ambiente de alta confianza, colaboración y alto rendimiento.'
  },
  'Planificación y organización': {
    bajo: 'Desorganizado e improvisador crónico. Pierde con facilidad el control de sus prioridades, confunde lo urgente con lo importante, satura sus agendas de forma ineficiente y suele verse rebasado por los vencimientos debido a la falta de método.',
    medio: 'Estructura sus actividades diarias, semanales y administra sus recursos de tiempo de forma aceptable. Utiliza herramientas básicas (agendas, listas, cronogramas) que le permiten cumplir con sus planes de trabajo sin mayores contratiempos.',
    alto: 'Un estratega impecable en la gestión del tiempo. Diseña planes maestros con indicadores clave, distribuye los recursos con precisión quirúrgica, anticipa cuellos de botella y coordina proyectos paralelos con un orden y control excepcionales.'
  },
  'Capacidad de aprendizaje': {
    bajo: 'Curva de aprendizaje lenta o resistente. Requiere explicaciones muy repetitivas, manuales demasiado detallados o supervisión estrecha para asimilar una nueva tarea, mostrando dificultad para dejar atrás viejos hábitos operativos.',
    medio: 'Absorbe nuevos procedimientos, metodologías y conocimientos técnicos a un ritmo normal y esperado para el perfil del puesto. Es capaz de autoestudiar si el material es claro y aplicar lo aprendido en un plazo razonable.',
    alto: 'Mente ágil y voracidad intelectual. Asimila conceptos técnicos complejos, softwares avanzados o normativas intrincadas de forma excepcionalmente rápida, dominando nuevas funciones en fracciones del tiempo común.'
  },
  'Orientación al logro': {
    bajo: 'Perfil conforme y de mínimo esfuerzo. Se limita a cumplir a medias las expectativas básicas del puesto, no muestra interés por mejorar sus propios números y se conforma con resultados estándar o mediocres si no hay una presión directa.',
    medio: 'Trabaja firmemente con base en objetivos y se esfuerza por alcanzar las metas mensuales o trimestrales impuestas por la dirección. Busca mantener un nivel de calidad adecuado que valide su permanencia y crecimiento estándar.',
    alto: 'Altamente competitivo y enfocado en la excelencia. No espera a que le impongan metas, él mismo se fija estándares sumamente altos, supera de forma sistemática sus récords anteriores y persigue la mejora continua como un estilo de vida profesional.'
  },
  'Iniciativa': {
    bajo: 'Dependiente absoluto. Requiere recibir la orden explícita e inmediata para comenzar cualquier actividad; si surge un contratiempo menor, prefiere detenerse por completo y esperar a que alguien más le diga exactamente qué hacer.',
    medio: 'Toma el control de situaciones y contingencias cotidianas de su área sin necesidad de esperar la aprobación o el recordatorio de su jefe. Resuelve problemas menores con autonomía y empuja el avance de su propio trabajo diario.',
    alto: 'Auténtico motor propio. Arranca tareas, detecta vacíos operativos y soluciona bloqueos institucionales con audacia de manera inmediata. Es el primero en levantar la mano ante nuevos retos y no descansa hasta ver concretada la acción.'
  }
};

export function interpretar(nombre, sum) {
  const r = rangoDe(sum);
  const t = INTERPRETACIONES[nombre];
  return { rango: r, etiqueta: RANGOS[r].label, texto: t ? t[r] : '' };
}
