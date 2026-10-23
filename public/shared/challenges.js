/* Los retos de la Arena (v2). Un mismo archivo para el celular (dibuja) y el servidor (califica).
   - ZONES: seis mundos en orden fijo; dentro de cada mundo el orden de los retos es aleatorio por equipo.
   - Cada reto trae una lección breve (lesson), la pregunta (prompt) y el porqué (why).
   - Los retos con datos se generan con semillas: todos ven lo mismo y el servidor recalcula la verdad.
   - grade() es lo único que conoce las respuestas; publicList() las quita antes de enviarlas al celular. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./stats.js"));
  else root.ArenaChallenges = factory(root.ArenaStats);
})(typeof self !== "undefined" ? self : this, function (S) {
  const PTS_FULL = 100, PTS_HALF = 50, STREAK_BONUS = 25;

  /* ================= MUNDOS ================= */
  const ZONES = [
    { id: "senal", name: "Señal y ruido", emoji: "📡", intro: "Toda prueba estadística hace la misma pregunta: ¿la diferencia que vemos es más grande que lo que el puro azar produciría? La diferencia entre grupos es la SEÑAL; lo que varía la gente dentro de cada grupo es el RUIDO. El estadístico t es, literalmente, señal ÷ ruido.", tip: "Mire siempre dos cosas: qué tan separadas están las medias y qué tan regados están los puntos." },
    { id: "efecto", name: "Tamaño del efecto", emoji: "📏", intro: "“Significativo” no dice cuánto. Para eso está el tamaño del efecto: d de Cohen para comparar grupos (distancia entre medias en desviaciones estándar) y r para relaciones (de −1 a 1). Regla rápida: d .2 pequeño, .5 mediano, .8 grande; r .1 débil, .3 moderada, .5 fuerte.", tip: "p dice si hay algo; d y r dicen cuánto." },
    { id: "muestra", name: "Tamaño de muestra", emoji: "👥", intro: "La POTENCIA es la probabilidad de encontrar un efecto que sí existe. Depende de tres cosas: qué tan grande es el efecto, cuánto ruido hay y cuánta gente. Con poca gente, el azar esconde incluso efectos grandes; con mucha, hasta lo diminuto sale “significativo”.", tip: "Meta habitual: potencia .80. Más n = intervalos más cortos = más certeza." },
    { id: "prueba", name: "¿Qué prueba toca?", emoji: "🧭", intro: "La prueba la decide el DISEÑO, no los datos: ¿cuántos grupos? ¿son las mismas personas o personas distintas? ¿se manipuló algo o solo se midió? Dos grupos distintos → t independiente (Welch). Las mismas personas dos veces → t pareada. Tres o más grupos → ANOVA (F). Dos variables medidas, sin manipular → correlación (r).", tip: "Si la variable que se mide es sí/no, la prueba cambia: chi-cuadrado." },
    { id: "leer", name: "Leer resultados", emoji: "🔍", intro: "Un resultado se lee con cuatro piezas: el estadístico (t, F o r), el valor p (qué tan raro sería ver esto si no hubiera efecto), el tamaño del efecto (cuánto) y su intervalo de confianza (con qué certeza). p < .05 se llama “significativo” y solo quiere decir “difícil de explicar por azar”.", tip: "No significativo ≠ no hay efecto. Significativo ≠ importante." },
    { id: "escribir", name: "Escribir y supuestos", emoji: "✍️", intro: "Antes de la prueba se revisan dos supuestos: si los datos se parecen a una campana (Shapiro-Wilk) y si las varianzas de los grupos son parecidas (Levene). Se reportan como salgan. Luego se escribe: medias y DE de cada grupo, estadístico con grados de libertad, p exacto, d e intervalo. Sin adjetivos.", tip: "Welch siempre: no exige varianzas iguales." },
  ];

  /* ================= RECUERDA LOS CONCEPTOS (glosario) ================= */
  const GLOSSARY = [
    { k: "Señal y ruido", t: "Señal = diferencia entre las medias de los grupos. Ruido = lo que varía la gente dentro de cada grupo (la desviación estándar). Si la señal no supera al ruido, el azar puede explicarlo todo." },
    { k: "Estadístico t", t: "Señal ÷ ruido para comparar DOS medias. t cerca de 0: nada que ver. t lejos de 0 (más de ±2, aprox.): la diferencia es rara por azar. Viene con “grados de libertad” (gl), que es más o menos el número de personas menos dos." },
    { k: "Estadístico F", t: "Lo mismo que t pero para TRES o más grupos (ANOVA): cuánto varían las medias entre grupos ÷ cuánto varía la gente dentro de los grupos. F cerca de 1: las medias se mueven lo que el azar mueve. F grande: al menos una media es distinta." },
    { k: "Valor p", t: "Si en realidad no hubiera ningún efecto, ¿qué tan a menudo saldría una diferencia así de grande por puro azar? p = .03 → 3 de cada 100 veces. Si p < .05 decimos “significativo”. p NO es la probabilidad de que la hipótesis sea cierta, y NO dice cuánto importa el efecto." },
    { k: "d de Cohen", t: "Cuánto importa la diferencia: la distancia entre las medias medida en desviaciones estándar. 0.2 pequeño (hay que medir con cuidado para notarlo), 0.5 mediano (se nota, pero los grupos se traslapan mucho), 0.8 grande (se ve a simple vista)." },
    { k: "Correlación r", t: "Qué tanto dos variables medidas en las mismas personas suben y bajan juntas. Va de −1 (perfecta al revés) a +1 (perfecta). r = 0: nada. .1 débil, .3 moderada, .5 fuerte. Correlación no es causa: no dice quién causa a quién ni descarta una tercera variable." },
    { k: "Intervalo de confianza (IC 95 %)", t: "El rango donde probablemente está el efecto real. Ancho = poca certeza (poca gente). Si el intervalo del d incluye el 0, no se puede descartar que no haya efecto." },
    { k: "Potencia", t: "Probabilidad de encontrar un efecto que sí existe. Sube con más gente, con un efecto más grande y con menos ruido (instrumento más fiable). Meta: .80 (80 de cada 100 estudios lo encontrarían)." },
    { k: "t independiente (Welch)", t: "Para comparar dos grupos de personas DISTINTAS. La versión Welch no exige que las varianzas sean iguales; por eso es la que se usa siempre en el curso." },
    { k: "t pareada", t: "Para comparar a las MISMAS personas en dos momentos o condiciones. Se analiza la diferencia de cada persona consigo misma. Tamaño del efecto: d_z." },
    { k: "ANOVA", t: "Para comparar TRES o más grupos. Da una F y un p. Si sale significativa, las pruebas post hoc (Tukey, Holm) dicen qué pares difieren. Tamaño del efecto: η² (eta cuadrado)." },
    { k: "Supuestos", t: "Normalidad: ¿los datos de cada grupo se parecen a una campana? (Shapiro-Wilk, p ≥ .05 está bien). Homogeneidad: ¿las varianzas son parecidas? (Levene). Se reportan siempre; si fallan, Welch y cautela, no cambiar de prueba." },
    { k: "Chi-cuadrado", t: "Cuando lo que se mide es una categoría (sí/no, eligió/no eligió). Compara proporciones entre grupos. Tamaño del efecto: V de Cramér." },
  ];

  /* ================= GENERADORES ================= */
  const CH = [];
  const add = c => { CH.push(c); return c; };

  /* --- Zona 1: señal y ruido --- */
  const L_SIGNAL = "Cada punto es una persona. La barra gruesa es la media de su grupo con su intervalo de confianza. Pregúntense: ¿las dos medias están más separadas que lo que se regan los puntos? Si sí, t será grande y p pequeño.";
  [[1, 12, 1.0], [3, 5, 1.0], [4, 60, 0.35], [6, 8, 0.3], [9, 20, 0.7], [12, 40, 0.0], [15, 6, 1.5], [18, 30, 0.45], [21, 10, 0.0], [24, 80, 0.25]].forEach(([seed, n, d], i) => add({
    id: `s${i + 1}`, zone: "senal", kind: "signal", title: `¿Hay señal? · ${n} por grupo`,
    lesson: L_SIGNAL, prompt: "Si corren una t de Welch con estos datos, ¿sale significativo (p < .05)?",
    params: { seed, n, d }, opts: ["Sí, p < .05", "No, p ≥ .05"],
    why: d === 0 ? "Aquí el efecto real es CERO: los dos grupos salen de la misma población. Cualquier diferencia que vean es azar puro. Con pocos datos el azar puede parecer señal; con muchos, las medias casi coinciden." : n <= 8 ? "Con tan poca gente el ruido se estima mal: incluso un efecto grande puede quedar escondido. “No significativo” no es “no hay efecto”, es “no alcanzamos a verlo”." : n >= 60 ? "Con mucha gente, hasta un efecto pequeño sale significativo. Significativo no quiere decir grande: para eso miren el d." : "Fíjense en la distancia entre medias comparada con lo regados que están los puntos: eso es t.",
  }));
  add({ id: "vf1", zone: "senal", kind: "vf", title: "Ráfaga: ¿verdadero o falso?", lesson: "Cuatro frases sobre la lógica de las pruebas. Decidan cada una. Cada acierto vale 25.",
    prompt: "Marquen V o F en cada frase.",
    opts: ["t es la diferencia entre medias dividida por el ruido (lo que varía la gente)", "Si dos grupos tienen medias distintas, la diferencia siempre es significativa", "Con más personas, el ruido se estima mejor y la prueba ve mejor la señal", "Un t cerca de 0 quiere decir que la diferencia es enorme"], answer: [true, false, true, false],
    why: "t = señal ÷ ruido. Medias distintas no bastan: hay que compararlas con el ruido. Más gente = mejor estimación del ruido. t cerca de 0 = nada que ver." });
  add({ id: "o1", zone: "senal", kind: "order", title: "Ordenen por señal", lesson: "Cuatro estudios con el mismo número de personas. Mírenlos y ordénenlos del que tiene MENOS señal (grupos más parecidos) al que tiene MÁS (grupos más separados).",
    prompt: "Toquen los estudios en orden: primero el de menos señal, último el de más señal.",
    params: { items: [{ k: "A", seed: 35, n: 15, d: 0.9 }, { k: "B", seed: 40, n: 15, d: 0.0 }, { k: "C", seed: 50, n: 15, d: 1.6 }, { k: "D", seed: 62, n: 15, d: 0.4 }] },
    why: "La señal es la distancia entre las medias frente al ruido. B casi no tiene (d ≈ 0), D poca, A bastante y C mucha. Es exactamente lo que t mide." });

  /* --- Zona 2: tamaño del efecto --- */
  const L_D = "El d de Cohen es la distancia entre las dos medias medida en desviaciones estándar (cuánto suele variar la gente). Truco: miren cuánto se separan las barras de las medias y compárenlo con lo ancho que es cada nube de puntos. Si la separación es como la mitad del ancho de la nube, d ≈ 0.5.";
  [[3, 30, 0.8], [41, 40, 0.3], [42, 30, 1.3], [43, 50, 0.5], [44, 30, 0.1]].forEach(([seed, n, d], i) => add({
    id: `d${i + 1}`, zone: "efecto", kind: "dslider", title: "Midan el efecto a ojo", lesson: L_D,
    prompt: "Muevan el control hasta el d que creen que tiene este par de grupos y envíen.",
    params: { seed, n, d, min: 0, max: 1.6, step: 0.05, tol: 0.5 },
    why: "d = (media experimental − media control) ÷ desviación estándar. Un d de 0.8 es grande y aun así los grupos se traslapan; un d de 0.2 casi no se ve a ojo; con d = 1.5 casi no hay traslape.",
  }));
  const L_R = "Cada punto es una persona con dos medidas (X e Y). r mide qué tanto suben y bajan juntas: nube redonda = r ≈ 0; nube alargada hacia arriba = r positiva; hacia abajo = negativa; casi una línea = r cerca de ±1.";
  [[51, 60, 0.85], [52, 60, 0.3], [53, 60, -0.6], [54, 60, 0.05], [55, 60, 0.55]].forEach(([seed, n, r], i) => add({
    id: `r${i + 1}`, zone: "efecto", kind: "rslider", title: "Estimen la correlación", lesson: L_R,
    prompt: "Muevan el control hasta el r que creen que tiene esta nube y envíen.",
    params: { seed, n, r, min: -1, max: 1, step: 0.05, tol: 0.5 },
    why: "r va de −1 a 1. Regla: .1 débil, .3 moderada, .5 fuerte; el signo dice la dirección. Y recuerden: correlación no es causa.",
  }));
  [[61, 0.8, 62, 0.2], [63, -0.7, 64, 0.3], [65, 0.1, 66, 0.5]].forEach(([sa, ra, sb, rb], i) => add({
    id: `cp${i + 1}`, zone: "efecto", kind: "corrpick", title: "¿Cuál relación es más fuerte?", lesson: "La fuerza de una correlación es qué tan cerca están los puntos de una línea, sin importar la dirección: r = −0.7 es más fuerte que r = +0.3.",
    prompt: "Toquen la nube con la correlación MÁS FUERTE (más cerca de una línea, suba o baje).",
    params: { a: { seed: sa, n: 50, r: ra }, b: { seed: sb, n: 50, r: rb } }, opts: ["Nube A", "Nube B"], answer: Math.abs(ra) >= Math.abs(rb) ? 0 : 1,
    why: `A tiene r ≈ ${ra.toFixed(1)} y B tiene r ≈ ${rb.toFixed(1)}. La fuerza es el valor sin signo: ${Math.abs(ra) >= Math.abs(rb) ? "A" : "B"} está más cerca de una línea.`,
  }));
  add({ id: "vf2", zone: "efecto", kind: "vf", title: "Ráfaga: tamaño del efecto", lesson: "Cuatro frases sobre d y r. Cada acierto vale 25.", prompt: "Marquen V o F.",
    opts: ["d = 0.8 quiere decir que las medias están separadas 0.8 desviaciones estándar", "r = −0.6 es una relación más débil que r = +0.4", "Un efecto pequeño (d = 0.2) necesita mucha más gente para verse que uno grande", "Si p < .05, el efecto es grande"], answer: [true, false, true, false],
    why: "d se mide en desviaciones estándar. La fuerza de r es su valor sin signo (0.6 > 0.4). Efectos pequeños exigen muestras grandes. p no dice cuánto: eso es d." });

  /* --- Zona 3: tamaño de muestra --- */
  const L_N = "La potencia es la probabilidad de encontrar el efecto si existe. La curva muestra cómo sube al agregar personas: los primeros participantes valen muchísimo y los últimos casi nada. La meta habitual es .80.";
  [[0.5, "mediano (d = .5)"], [0.8, "grande (d = .8)"], [0.3, "pequeño (d = .3)"]].forEach(([d, lab], i) => add({
    id: `n${i + 1}`, zone: "muestra", kind: "nslider", title: "Dosifiquen la muestra", lesson: L_N,
    prompt: `Esperan un efecto ${lab}. ¿Cuántas personas por grupo necesitan para una potencia de .80? Muevan el control y envíen.`,
    params: { d, min: 5, max: 200, step: 1, tolFull: 4, tolZero: 40 },
    why: d === 0.5 ? "Con d = .5 la curva cruza .80 cerca de 64 por grupo. Con d = .8 bastan 26; con d = .2 hacen falta 394. Por eso una manipulación fuerte y un instrumento fiable son la forma barata de necesitar menos gente." : d === 0.8 ? "Un efecto grande se ve con poca gente: 26 por grupo. Es la razón para hacer manipulaciones fuertes (video en vez de foto, 30 min en vez de 10)." : "Un efecto pequeño exige muchísima gente (unos 176 por grupo). Si no la tienen, su estudio es un piloto: reporten d con su intervalo y no hablen de “no hubo efecto”.",
  }));
  [[7, 0.6, 20, 16], [8, 0.9, 20, 16]].forEach(([seedBase, d, reps, need], i) => add({
    id: `rep${i + 1}`, zone: "muestra", kind: "replicas", title: "La máquina de réplicas", lesson: "La máquina repite su experimento 20 veces con personas nuevas. Un buen diseño encuentra el efecto casi siempre (al menos 16 de 20 = potencia .80). Prueben con pocas personas y vean cuántas veces falla.",
    prompt: `El efecto real es d = ${d}. Elijan un n por grupo, corran la máquina y envíen cuando logren ${need} o más réplicas significativas. Más puntos con menos personas.`,
    params: { seedBase, d, reps, min: 4, max: 80, need },
    why: "Cuando con cierto n solo aciertan 7 u 8 de 20, eso es potencia baja: el mismo experimento, con gente nueva, fallaría casi siempre. Subir el n sube la potencia; también la subirían un efecto más fuerte o menos ruido.",
  }));
  add({ id: "rep3", zone: "muestra", kind: "mcq", title: "Veinte réplicas, siete aciertos", lesson: "Imaginen que el mismo experimento se repitió 20 veces con gente nueva y solo 7 veces salió p < .05.", prompt: "¿Qué está pasando?",
    params: { sig: 7, reps: 20 }, opts: ["El efecto no existe: 13 de 20 no lo encontraron", "Potencia baja (≈ 35 %): el efecto puede existir, pero el n no alcanza para verlo con fiabilidad", "Siete equipos hicieron trampa", "Hay que publicar solo los siete que salieron significativos"], answer: 1,
    why: "7 de 20 es una potencia de ~35 %. Esconder los 13 es sesgo de publicación. La solución: más n, manipulación más fuerte o instrumento más fiable, y reportar el d con su intervalo." });
  add({ id: "o2", zone: "muestra", kind: "order", title: "Ordenen por certeza", lesson: "Cuatro estudios midieron el mismo efecto. La barra es el intervalo de confianza del d: cuanto más corta, más gente tuvo el estudio y más certeza da.",
    prompt: "Toquen los estudios del de MENOS participantes al de MÁS participantes.",
    params: { cis: [{ k: "A", lo: 0.1, hi: 1.7 }, { k: "B", lo: 0.5, hi: 0.9 }, { k: "C", lo: -0.3, hi: 2.1 }, { k: "D", lo: 0.3, hi: 1.1 }] },
    why: "El ancho del intervalo depende del n: C (2.4 de ancho) es el más pequeño, luego A (1.6), D (0.8) y B (0.4) es el más grande. Con más gente, el intervalo se estrecha." });
  add({ id: "vf3", zone: "muestra", kind: "vf", title: "Ráfaga: potencia", lesson: "Cuatro frases sobre potencia y muestra. Cada acierto vale 25.", prompt: "Marquen V o F.",
    opts: ["Potencia .80 significa que 80 de cada 100 estudios así encontrarían el efecto, si existe", "Con 10 personas por grupo un resultado no significativo demuestra que no hay efecto", "Duplicar la gente duplica la potencia", "Un instrumento más fiable (menos ruido) sube la potencia sin agregar gente"], answer: [true, false, false, true],
    why: "Potencia = probabilidad de encontrar el efecto si existe. Con n pequeño, no significativo no demuestra nada. La potencia no sube en línea recta: la curva se aplana. Menos ruido = más potencia gratis." });

  /* --- Zona 4: qué prueba --- */
  const L_Q = "Tres preguntas deciden la prueba: (1) ¿cuántos grupos o condiciones? (2) ¿son personas distintas en cada grupo o las mismas personas medidas varias veces? (3) ¿se manipuló algo o solo se midieron dos variables? Dos grupos distintos → t independiente (Welch). Mismas personas dos veces → t pareada. Tres o más grupos → ANOVA. Dos variables medidas → correlación.";
  const QOPTS = ["t para muestras independientes (Welch)", "t pareada (muestras relacionadas)", "ANOVA de un factor", "Correlación de Pearson"];
  [
    ["Cada participante toma 10 decisiones con una recomendación de IA y 10 con la de una persona, en orden contrabalanceado. Se cuenta cuántas sigue en cada bloque.", 1, "Las mismas personas pasan por las dos condiciones: se analiza la diferencia de cada persona consigo misma."],
    ["Tres grupos al azar ven un video neutro, uno de productividad moderada o uno de productividad extrema. Responden la escala de autoconcepto una vez.", 2, "Tres grupos distintos, una medición: ANOVA. Luego post hoc para saber qué pares difieren."],
    ["Treinta estudiantes se asignan al azar a ver su foto sin filtro o con filtro intenso. Luego responden la escala de satisfacción corporal.", 0, "Dos grupos de personas distintas, una medición: t independiente, siempre en versión Welch."],
    ["En cada persona se registra el tiempo de pantalla nocturno de la última semana y sus aciertos en una tarea de atención. No se asigna nada.", 3, "Dos variables medidas, nada manipulado: correlación. No permite hablar de causa."],
    ["Dos cursos ya formados: uno recibe desayuno completo antes de una prueba de memoria; el otro, no. Se mide memoria una vez.", 0, "Grupos intactos (cuasiexperimento), pero la prueba es la de dos grupos independientes. Lo que cambia es la conclusión: hay que reportar cómo eran los cursos antes."],
    ["Cada participante lee tres noticias (neutra, costos de criar, apoyos) en orden contrabalanceado y responde la escala de intención después de cada una.", 1, "Las mismas personas en tres condiciones: ANOVA de medidas repetidas, que es la versión de la pareada para tres o más. La opción más cercana aquí es la pareada (misma lógica: cada persona contra sí misma)."],
    ["Tienda simulada: la mitad ve el aviso “quedan 3 unidades” y la otra mitad no. Se registran las unidades elegidas.", 0, "Dos grupos distintos, una medida contable: t independiente (Welch)."],
    ["Se mide ansiedad social (rasgo) y minutos diarios en redes en 120 universitarios para ver si van juntas.", 3, "Dos variables medidas en las mismas personas, sin manipular: correlación."],
    ["Cuatro grupos al azar: sin pausa, pausa con celular, pausa de respiración, pausa caminando. Rendimiento en el bloque final.", 2, "Cuatro grupos distintos: ANOVA de un factor."],
    ["Se mide calidad de sueño antes y después de una semana de higiene del sueño en las mismas 25 personas (sin grupo control).", 1, "Las mismas personas antes y después: t pareada. Ojo: sin grupo control no se puede descartar que cambiaran por otra razón."],
    ["Red simulada: unos publican una foto propia y otros solo navegan 10 minutos. Ansiedad estado al final.", 0, "Dos grupos distintos: t independiente."],
    ["Se registra, en cada persona, cuántos likes recibió su última publicación y su puntaje de FoMO.", 3, "Dos variables medidas: correlación. No hubo manipulación."],
  ].forEach(([s, a, why], i) => add({ id: `q${i + 1}`, zone: "prueba", kind: "mcq", title: `¿Qué prueba toca? · ${i + 1}`, lesson: L_Q, prompt: s, opts: QOPTS, answer: a, why }));
  add({ id: "m1", zone: "prueba", kind: "match", title: "Empareje diseño y prueba", lesson: L_Q, prompt: "Toquen un diseño y luego la prueba que le corresponde. Cada pareja correcta vale 25.",
    params: { left: ["Dos grupos distintos, una medición", "Las mismas personas en dos condiciones", "Tres o más grupos distintos", "Dos variables medidas, sin manipular"], right: ["Correlación de Pearson", "t pareada", "ANOVA de un factor", "t de Welch"] }, answer: [3, 1, 2, 0],
    why: "Dos grupos → t de Welch. Mismas personas → pareada. Tres o más → ANOVA. Dos variables medidas → correlación." });
  add({ id: "m2", zone: "prueba", kind: "match", title: "Empareje prueba y estadístico", lesson: "Cada prueba produce un número con nombre propio: t para dos medias, F para tres o más (ANOVA), r para relaciones, χ² para categorías.", prompt: "Toquen una prueba y luego su estadístico. Cada pareja correcta vale 25.",
    params: { left: ["t independiente o pareada", "ANOVA", "Correlación", "Chi-cuadrado (sí/no)"], right: ["χ²", "F", "r", "t"] }, answer: [3, 1, 2, 0],
    why: "t = señal ÷ ruido entre dos medias. F = varianza entre grupos ÷ varianza dentro de grupos. r = fuerza y dirección de una relación. χ² = qué tanto se alejan las frecuencias observadas de las esperadas." });
  add({ id: "q13", zone: "prueba", kind: "mcq", title: "La variable es sí/no", lesson: "Cuando lo que se mide es una categoría (eligió fruta o no, siguió la recomendación o no), no hay medias que comparar: se comparan proporciones.", prompt: "Dos grupos (con aviso de escasez / sin aviso). Se registra si cada persona compró o no compró. ¿Qué prueba?",
    opts: ["t de Welch", "Chi-cuadrado de independencia", "Correlación de Pearson", "t pareada"], answer: 1,
    why: "Variable categórica (compró / no compró) por grupo: tabla de contingencia y chi-cuadrado. Si pueden contar (cuántas unidades) en vez de sí/no, ganan potencia y vuelven a la t." });
  add({ id: "vf4", zone: "prueba", kind: "vf", title: "Ráfaga: elegir la prueba", lesson: "Cuatro frases. Cada acierto vale 25.", prompt: "Marquen V o F.",
    opts: ["La prueba se elige según el diseño, antes de ver los datos", "Si la t no dio significativo, se prueba con otra prueba hasta que dé", "Una correlación alta demuestra que X causa Y", "La ANOVA sirve cuando hay tres o más grupos"], answer: [true, false, false, true],
    why: "Diseño decide la prueba. Cambiar de prueba después de ver los datos es trampa estadística. Correlación no es causa. ANOVA = tres o más grupos." });

  /* --- Zona 5: leer resultados --- */
  const L_P = "El valor p responde: si NO hubiera ningún efecto, ¿qué tan a menudo saldría una diferencia así por azar? p = .03 → 3 de cada 100 veces. Si p < .05 se dice “significativo”. p no es la probabilidad de que la hipótesis sea cierta y no dice cuánto importa el efecto.";
  add({ id: "l1", zone: "leer", kind: "mcq", title: "¿Cuál frase es correcta?", lesson: L_P, prompt: "Solo una de estas cuatro lecturas está bien.",
    opts: ["p = .03 significa que H0 tiene 3 % de probabilidad de ser cierta", "p ≥ .05 demuestra que la manipulación no tuvo efecto", "d = 0.8, IC 95 % [0.1, 1.5]: el efecto probablemente existe, pero está mal estimado", "Un p más pequeño siempre significa un efecto más grande"], answer: 2,
    why: "p no es la probabilidad de H0; p ≥ .05 no demuestra nada; p depende del n. El d con su intervalo dice cuánto y con qué certeza." });
  add({ id: "l2", zone: "leer", kind: "multi", title: "Cazadores de intervalos", lesson: "Cada barra es el intervalo de confianza del d de un estudio. Si la barra toca el cero, ese estudio no puede descartar que el efecto sea nulo.", prompt: "Marquen TODOS los estudios que sí pueden afirmar que el efecto existe.",
    params: { items: [{ k: "A", lo: -0.4, hi: 0.9 }, { k: "B", lo: 0.05, hi: 0.95 }, { k: "C", lo: -0.1, hi: 2.0 }, { k: "D", lo: 0.9, hi: 1.3 }] }, opts: ["Estudio A", "Estudio B", "Estudio C", "Estudio D"], answer: [1, 3],
    why: "B y D dejan el cero por fuera. A y C lo incluyen: aunque su d central parezca grande, no pueden descartar un efecto nulo." });
  add({ id: "l3", zone: "leer", kind: "mcq", title: "¿Quién tuvo más participantes?", lesson: "El ancho del intervalo depende del número de personas: más gente, barra más corta.", prompt: "¿Cuál estudio tuvo MÁS participantes?",
    params: { items: [{ k: "A", lo: -0.4, hi: 0.9 }, { k: "B", lo: 0.05, hi: 0.95 }, { k: "C", lo: -0.1, hi: 2.0 }, { k: "D", lo: 0.9, hi: 1.3 }] }, opts: ["Estudio A", "Estudio B", "Estudio C", "Estudio D"], answer: 3,
    why: "D tiene el intervalo más estrecho (0.4 de ancho): es el estudio con más participantes. C, el más ancho, es el más pequeño." });
  add({ id: "o3", zone: "leer", kind: "order", title: "Ordenen la evidencia", lesson: "Cuatro resultados de la misma prueba. Un p más pequeño es más difícil de explicar por azar (más evidencia contra “no hay efecto”). No dice cuánto importa, solo qué tan raro sería por azar.",
    prompt: "Toquen los resultados del de MENOS evidencia al de MÁS evidencia contra el azar.",
    params: { labels: ["t(28) = 0.4, p = .69", "t(28) = 2.1, p = .045", "t(28) = 3.8, p < .001", "t(28) = 1.5, p = .14"], ranks: [0, 2, 3, 1] },
    why: "De menos a más: p = .69 (nada), p = .14 (no llega), p = .045 (apenas cruza .05), p < .001 (muy raro por azar). El t crece con la evidencia." });
  add({ id: "l4", zone: "leer", kind: "mcq", title: "Lean una ANOVA", lesson: "F(2, 57) = 4.8, p = .012, η² = .14. Los números entre paréntesis son los grados de libertad: 2 = grupos − 1 (hay tres grupos); 57 = personas − grupos. η² = .14 quiere decir que el 14 % de las diferencias entre personas se explica por el grupo.", prompt: "¿Qué se puede concluir?",
    opts: ["Los tres grupos difieren entre sí", "Al menos una media es distinta; falta el post hoc para saber cuáles", "No hay diferencias porque F es pequeño", "El grupo 2 es el mejor"], answer: 1,
    why: "La ANOVA solo dice que al menos una media difiere. Qué pares difieren lo dicen las comparaciones post hoc (Tukey u Holm). η² = .14 es un efecto grande." });
  add({ id: "l5", zone: "leer", kind: "mcq", title: "Lean una correlación", lesson: "r(118) = −.32, p < .001. El 118 es n − 2. El signo negativo dice que cuando una variable sube la otra baja. r² = .10: comparten el 10 % de su variación.", prompt: "¿Cuál lectura es correcta?",
    opts: ["Usar más redes causa más ansiedad", "A más uso de redes, menos puntaje en la otra variable; relación moderada; no se sabe quién causa a quién", "La relación es fuerte porque p < .001", "No hay relación porque r es negativo"], answer: 1,
    why: "El signo da la dirección; el tamaño (.32) es moderado; p pequeño solo dice que es raro por azar con 120 personas. Causa: no, nunca con una correlación." });
  add({ id: "vf5", zone: "leer", kind: "vf", title: "Ráfaga: el valor p", lesson: "Cuatro frases sobre p. Cada acierto vale 25.", prompt: "Marquen V o F.",
    opts: ["p < .05 quiere decir “difícil de explicar por puro azar”", "p = .001 quiere decir que el efecto es grande", "Si p = .20, se demostró que no hay efecto", "El intervalo de confianza dice entre qué valores está probablemente el efecto real"], answer: [true, false, false, true],
    why: "p habla de azar, no de tamaño ni de certeza sobre H0. p = .20 solo dice que no alcanzó: con n pequeño, el efecto puede existir. El IC es el rango probable del efecto." });
  add({ id: "o4", zone: "leer", kind: "order", title: "Ordenen por tamaño del efecto", lesson: "Cuatro estudios con distintos n y distintos d. Ignoren el p: ordenen SOLO por cuánto importa el efecto (d).",
    prompt: "Toquen del efecto MÁS PEQUEÑO al MÁS GRANDE.",
    params: { labels: ["n = 200, d = 0.15, p = .03", "n = 12, d = 0.90, p = .08", "n = 60, d = 0.45, p = .02", "n = 30, d = 0.60, p = .04"], ranks: [0, 3, 1, 2] },
    why: "d = 0.15 < 0.45 < 0.60 < 0.90. Fíjense: el más pequeño es significativo (mucha gente) y el más grande no lo es (poca gente). Por eso p y d se leen juntos." });

  /* --- Zona 6: escribir y supuestos --- */
  const L_SUP = "Antes de correr la prueba se verifican dos supuestos y se reportan como salgan: normalidad (Shapiro-Wilk: p ≥ .05 quiere decir “compatible con una campana”) y homogeneidad de varianzas (Levene: p ≥ .05 quiere decir “varianzas parecidas”). Si Levene falla, Welch lo resuelve. Si la normalidad falla con n pequeño, se interpreta con cautela; no se cambia de prueba.";
  add({ id: "e1", zone: "escribir", kind: "mcq", title: "Levene salió significativo", lesson: L_SUP, prompt: "Levene: F(1, 28) = 7.9, p = .009. Las varianzas son distintas. ¿Qué hacen?",
    opts: ["Cambiar a otra prueba porque “no se cumple el supuesto”", "Reportar la t de Welch, que no exige varianzas iguales", "Quitar los datos del grupo con más varianza", "No reportar Levene y seguir con la t clásica"], answer: 1,
    why: "La t de Welch está hecha para varianzas distintas y es la que el curso usa siempre. Los supuestos se reportan tal como salieron y se dice qué se hizo." });
  add({ id: "e2", zone: "escribir", kind: "mcq", title: "Shapiro-Wilk salió significativo", lesson: L_SUP, prompt: "Shapiro-Wilk en el grupo control: W = .87, p = .02, con 10 personas. ¿Qué hacen?",
    opts: ["Borrar los datos raros hasta que p suba", "Reportarlo, mirar el gráfico, correr la t de Welch igual y decir en limitaciones que con n pequeño se interpreta con cautela", "Decir que el estudio no sirve", "No mencionar Shapiro-Wilk en el informe"], answer: 1,
    why: "Se reporta siempre, se cumpla o no. Con n pequeño la t es razonablemente robusta; lo honesto es decirlo como limitación y apoyarse en el d con su intervalo." });
  add({ id: "e3", zone: "escribir", kind: "mcq", title: "Escríbanlo bien", lesson: "Un resultado se escribe con: medias y DE de cada grupo, el estadístico con sus grados de libertad, el p exacto, el d y su intervalo. Sin adjetivos (“altamente”, “muy”), sin “se acepta H1”, sin “demostró”, sin “p = .000”.", prompt: "Control M = 58.1 (DE = 9.8), experimental M = 66.4 (DE = 10.2), 15 por grupo, t de Welch(27.9) = 2.27, p = .031, d = 0.83, IC 95 % [0.08, 1.58]. ¿Cuál es la frase correcta?",
    opts: ["Se acepta la H1: la manipulación demostró tener un efecto altamente significativo", "Los participantes del grupo experimental (M = 66.4, DE = 10.2) obtuvieron puntajes significativamente mayores que los del control (M = 58.1, DE = 9.8), t(27.9) = 2.27, p = .031, d = 0.83, IC 95 % [0.08, 1.58]", "El experimento fue positivo (p = 0.031 < 0.05), por lo que la hipótesis es verdadera", "Hubo diferencia entre los grupos (p = .000)"], answer: 1,
    why: "La frase B tiene todo lo que la rúbrica pide. Las otras tienen palabras prohibidas: “se acepta H1”, “demostró”, “altamente”, “verdadera”, “p = .000”." });
  add({ id: "e4", zone: "escribir", kind: "mcq", title: "Caza el error", lesson: "Lean la frase. Casi toda está bien; un fragmento está mal escrito.", prompt: "“Los participantes del grupo con filtro (M = 54.2, DE = 11.8) obtuvieron puntajes menores que los del grupo sin filtro (M = 63.9, DE = 10.4), t(27.6) = −2.38, p = .025, d = −0.87, por lo que se acepta la hipótesis alterna.” ¿Qué fragmento está mal?",
    opts: ["“(M = 54.2, DE = 11.8)”", "“t(27.6) = −2.38, p = .025”", "“d = −0.87”", "“por lo que se acepta la hipótesis alterna”"], answer: 3,
    why: "Nunca se “acepta” la H1: se rechaza (o no) la H0 y se dice que los datos apoyan la hipótesis. Lo demás está perfecto: medias, DE, t con gl, p exacto y d." });
  add({ id: "e5", zone: "escribir", kind: "mcq", title: "Caza el error · 2", lesson: "Otra frase casi correcta.", prompt: "“El cambio pre-post fue mayor en el grupo experimental (Δ = 6.1) que en el control (Δ = 1.2), t(38) = 2.9, p = .000, d = 0.92, IC 95 % [0.26, 1.57].” ¿Qué fragmento está mal?",
    opts: ["“(Δ = 6.1) que en el control (Δ = 1.2)”", "“t(38) = 2.9”", "“p = .000”", "“IC 95 % [0.26, 1.57]”"], answer: 2,
    why: "p nunca es exactamente cero. Se escribe p < .001. Todo lo demás está bien." });
  add({ id: "vf6", zone: "escribir", kind: "vf", title: "Ráfaga: supuestos y escritura", lesson: "Cuatro frases. Cada acierto vale 25.", prompt: "Marquen V o F.",
    opts: ["Los supuestos se reportan siempre, se cumplan o no", "Si Levene da p < .05, la t de Welch sigue siendo válida", "“Altamente significativo” es una expresión correcta en APA", "En Resultados se escribe la decisión sobre H0 sin adjetivos"], answer: [true, true, false, true],
    why: "Reportar siempre. Welch no exige varianzas iguales. “Altamente significativo” no existe: p es p. Decisión sin adjetivos." });
  add({ id: "m3", zone: "escribir", kind: "match", title: "Empareje cada número con su nombre", lesson: "Un resultado tiene cuatro piezas. Reconocerlas es la mitad de saber leerlo.", prompt: "Toquen un número y luego lo que es. Cada pareja vale 25.",
    params: { left: ["t(38) = 2.41", "p = .021", "d = 0.76", "[0.12, 1.40]"], right: ["Tamaño del efecto: cuánto importa", "Intervalo de confianza del efecto", "Estadístico con grados de libertad: señal ÷ ruido", "Qué tan raro sería por azar"] }, answer: [2, 3, 0, 1],
    why: "t(gl) es señal ÷ ruido; p, qué tan raro por azar; d, cuánto importa; el intervalo, dónde está probablemente el efecto real." });

  /* ================= API ================= */
  function publicList() { return CH.map(c => { const { answer, ...rest } = c; return rest; }); }
  const byId = id => CH.find(c => c.id === id);
  const zoneOf = c => ZONES.find(z => z.id === c.zone);

  /* orden por equipo: mundos en orden fijo, retos barajados dentro de cada mundo */
  function orderFor(seed) {
    const r = S.rng(seed); const out = [];
    ZONES.forEach(z => { const ids = CH.filter(c => c.zone === z.id).map(c => c.id); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r.u() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } out.push(...ids); });
    return out;
  }

  /* verdad calculada */
  function truth(c) {
    const p = c.params || {};
    if (c.kind === "signal") { const { a, b } = S.sim(p.seed, p.n, p.n, p.d); const w = S.welch(a, b); return { w, answer: w.p < .05 ? 0 : 1 }; }
    if (c.kind === "dslider") { const { a, b } = S.sim(p.seed, p.n, p.n, p.d); const w = S.welch(a, b); return { w, target: +w.d.toFixed(2) }; }
    if (c.kind === "rslider") { const { x, y } = S.simCorr(p.seed, p.n, p.r); const r = S.pearson(x, y); return { target: +r.toFixed(2) }; }
    if (c.kind === "nslider") return { target: S.nFor80(p.d) };
    if (c.kind === "replicas") { let nmin = null; for (let n = p.min; n <= p.max; n++) { if (S.replicate(p.seedBase, n, p.d, p.reps).sig >= p.need) { nmin = n; break; } } return { nmin }; }
    if (c.kind === "order") {
      if (p.items) { const ds = p.items.map(it => { const { a, b } = S.sim(it.seed, it.n, it.n, it.d); return S.welch(a, b).d; }); return { ranks: ds.map((d, i) => [d, i]).sort((x, y) => x[0] - y[0]).map(x => x[1]) }; }
      if (p.cis) return { ranks: p.cis.map((c2, i) => [c2.hi - c2.lo, i]).sort((x, y) => y[0] - x[0]).map(x => x[1]) };
      return { ranks: p.ranks };
    }
    return {};
  }

  /* calificación (servidor) */
  function grade(c, answer, attempt) {
    const t = truth(c); const p = c.params || {};
    if (c.kind === "signal" || c.kind === "mcq" || c.kind === "corrpick") {
      const correct = c.kind === "signal" ? t.answer : c.answer; const ok = Number(answer) === correct;
      const pts = ok ? (attempt === 1 ? PTS_FULL : attempt === 2 ? PTS_HALF : 0) : 0;
      return { ok, pts, done: ok || attempt >= 3, correct, detail: t.w ? `t(${t.w.df.toFixed(1)}) = ${t.w.t.toFixed(2)}, ${S.fmtP(t.w.p)}, d = ${t.w.d.toFixed(2)}.` : "" };
    }
    if (c.kind === "multi") {
      const a = Array.isArray(answer) ? answer.map(Number).sort() : []; const key = c.answer.slice().sort();
      const exact = a.length === key.length && a.every((v, i) => v === key[i]);
      return { ok: exact, pts: exact ? (attempt === 1 ? PTS_FULL : PTS_HALF) : 0, done: exact || attempt >= 2, correct: key, detail: exact ? "" : "No es exactamente ese conjunto." };
    }
    if (c.kind === "vf") {
      const a = Array.isArray(answer) ? answer : []; let n = 0; c.answer.forEach((v, i) => { if (a[i] === v) n++; });
      return { ok: n === c.answer.length, pts: n * 25, done: true, correct: c.answer, detail: `${n} de ${c.answer.length} correctas.` };
    }
    if (c.kind === "match") {
      const a = Array.isArray(answer) ? answer.map(Number) : []; let n = 0; c.answer.forEach((v, i) => { if (a[i] === v) n++; });
      return { ok: n === c.answer.length, pts: n * 25, done: true, correct: c.answer, detail: `${n} de ${c.answer.length} parejas correctas.` };
    }
    if (c.kind === "order") {
      const a = Array.isArray(answer) ? answer.map(Number) : []; const key = t.ranks; let n = 0; key.forEach((v, i) => { if (a[i] === v) n++; });
      const exact = n === key.length; const pts = exact ? PTS_FULL : n * 20;
      return { ok: exact, pts, done: true, correct: key, detail: exact ? "Orden perfecto." : `${n} de ${key.length} posiciones correctas.` };
    }
    if (c.kind === "dslider" || c.kind === "rslider") {
      const v = Number(answer); const err = Math.abs(v - t.target); const pts = Math.max(0, Math.round(PTS_FULL * (1 - err / p.tol)));
      const lab = c.kind === "dslider" ? "d" : "r";
      return { ok: pts >= 70, pts, done: true, correct: t.target, detail: `El ${lab} real de estos datos es ${t.target.toFixed(2)}; ustedes dijeron ${v.toFixed(2)}.` };
    }
    if (c.kind === "nslider") {
      const v = Number(answer); const err = Math.abs(v - t.target);
      const pts = err <= p.tolFull ? PTS_FULL : Math.max(0, Math.round(PTS_FULL * (1 - (err - p.tolFull) / (p.tolZero - p.tolFull))));
      return { ok: pts >= 70, pts, done: true, correct: t.target, detail: `Se necesitan ${t.target} por grupo; con ${v} la potencia sería ${Math.round(S.power(p.d, v) * 100)} %.` };
    }
    if (c.kind === "replicas") {
      const n = Math.round(Number(answer)); const r = S.replicate(p.seedBase, n, p.d, p.reps);
      if (r.sig < p.need) return { ok: false, pts: -10, done: false, correct: t.nmin, detail: `Con ${n} por grupo solo ${r.sig} de ${p.reps} réplicas salieron significativas. Suban el n (−10 puntos por intento fallido).` };
      const extra = n - t.nmin; const pts = extra <= 4 ? PTS_FULL : extra <= 12 ? 70 : 40;
      return { ok: true, pts, done: true, correct: t.nmin, detail: `${r.sig} de ${p.reps} con ${n} por grupo. El mínimo que lo logra es ${t.nmin}${extra > 4 ? `: usaron ${extra} personas de más por grupo` : ": casi al milímetro"}.` };
    }
    return { ok: false, pts: 0, done: true, detail: "" };
  }

  return { CH, ZONES, GLOSSARY, publicList, byId, zoneOf, orderFor, truth, grade, PTS_FULL, PTS_HALF, STREAK_BONUS };
});
