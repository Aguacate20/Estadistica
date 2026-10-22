/* Los retos de la Arena. El mismo archivo lo usa el celular (para dibujar) y el
   servidor (para calificar). Lo que califica vive en `grade`; el cliente solo
   recibe la versión pública (sin respuestas). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./stats.js"));
  else root.ArenaChallenges = factory(root.ArenaStats);
})(typeof self !== "undefined" ? self : this, function (S) {
  const PTS_FULL = 100, PTS_HALF = 50, STREAK_BONUS = 25;

  const CH = [
    { id: "s1", kind: "signal", zone: "Señal y ruido", title: "¿Hay señal? · 12 por grupo",
      lead: "Cada punto es una persona. La barra gruesa es la media de su grupo con su intervalo de confianza. Una prueba t pregunta: ¿la distancia entre las dos medias es grande comparada con lo que varía la gente dentro de cada grupo?",
      prompt: "Si corren una t de Welch con estos datos, ¿sale significativo (p < .05)?",
      params: { seed: 1, n: 12, d: 1.0 }, opts: ["Sí, p < .05", "No, p ≥ .05"],
      why: "Con 12 por grupo y un efecto grande la señal se ve: las barras de las medias casi no se tocan." },
    { id: "s2", kind: "signal", zone: "Señal y ruido", title: "¿Hay señal? · 5 por grupo",
      lead: "Mismo efecto real que el reto anterior (grande). Solo cambió el número de personas.",
      prompt: "¿Sale significativo (p < .05)?",
      params: { seed: 3, n: 5, d: 1.0 }, opts: ["Sí, p < .05", "No, p ≥ .05"],
      why: "Con 5 por grupo el ruido se estima tan mal que el azar esconde incluso un efecto grande. “No significativo” no es “no hay efecto”: es “no alcanzamos a verlo”." },
    { id: "s3", kind: "signal", zone: "Señal y ruido", title: "¿Hay señal? · 60 por grupo",
      lead: "Ahora el efecto real es pequeño (d ≈ .35), pero hay 60 personas por grupo.",
      prompt: "¿Sale significativo (p < .05)?",
      params: { seed: 4, n: 60, d: 0.35 }, opts: ["Sí, p < .05", "No, p ≥ .05"],
      why: "Con mucha gente, un efecto pequeño sí sale significativo. Significativo no quiere decir grande ni importante: para eso está el d." },
    { id: "d1", kind: "dslider", zone: "Tamaño del efecto", title: "Mide el efecto a ojo",
      lead: "El d de Cohen es la distancia entre las medias medida en desviaciones estándar (cuánto suele variar la gente entre sí). d = 0.2 pequeño · 0.5 mediano · 0.8 grande.",
      prompt: "Muevan el control hasta el d que creen que tiene este par de grupos y envíen.",
      params: { seed: 3, n: 30, d: 0.8, min: 0, max: 1.5, step: 0.05, tol: 0.5 },
      why: "Las medias están separadas unas 10 unidades y la gente varía unas 12 dentro de cada grupo: 10 ÷ 12 ≈ 0.8. Un d de 0.8 es grande y, aun así, los grupos se traslapan bastante." },
    { id: "n1", kind: "nslider", zone: "Tamaño de muestra", title: "Dosifiquen la muestra",
      lead: "La potencia es la probabilidad de encontrar el efecto si existe. La curva muestra cómo sube con el número de personas por grupo. La meta habitual es .80.",
      prompt: "Esperan un efecto mediano (d = .5). ¿Cuántas personas por grupo necesitan para una potencia de .80? Muevan el control y envíen.",
      params: { d: 0.5, min: 5, max: 150, step: 1, tolFull: 4, tolZero: 40 },
      why: "La curva cruza .80 cerca de 64 por grupo. Con d = .8 bastarían 26; con d = .2 harían falta 394. Por eso una manipulación fuerte y un instrumento fiable son la forma barata de necesitar menos gente." },
    { id: "rep1", kind: "replicas", zone: "Tamaño de muestra", title: "La máquina de réplicas",
      lead: "La máquina repite su experimento 20 veces con personas nuevas. Un buen diseño encuentra el efecto casi siempre (al menos 16 de 20). El efecto real aquí es mediano-grande (d = .6).",
      prompt: "Elijan un n por grupo, corran la máquina y envíen cuando logren 16 o más réplicas significativas. Gana más puntos quien lo logre con menos personas.",
      params: { seedBase: 7, d: 0.6, reps: 20, min: 4, max: 80, need: 16 },
      why: "Con d = .6 la potencia de .80 se alcanza cerca de 45 por grupo. Con 15 por grupo el mismo experimento acierta una de cada tres veces: eso es lo que significa “potencia baja”." },
    { id: "q1", kind: "mcq", zone: "¿Qué prueba?", title: "¿Qué prueba toca? · 1",
      lead: "La prueba la decide el diseño: cuántos grupos, si son las mismas personas o personas distintas, y qué se mide.",
      prompt: "Cada participante toma 10 decisiones con una recomendación de IA y 10 con la de una persona, en orden contrabalanceado. Se cuenta cuántas sigue en cada bloque.",
      opts: ["t para muestras independientes", "t pareada (muestras relacionadas)", "ANOVA de un factor", "Correlación de Pearson"], answer: 1,
      why: "Las mismas personas pasan por las dos condiciones: se analiza la diferencia de cada persona consigo misma. t pareada." },
    { id: "q2", kind: "mcq", zone: "¿Qué prueba?", title: "¿Qué prueba toca? · 2",
      lead: "Tres grupos distintos, una sola medición por persona.",
      prompt: "Tres grupos asignados al azar ven un video neutro, uno de productividad moderada o uno de productividad extrema. Después responden la escala de autoconcepto una vez.",
      opts: ["t para muestras independientes", "t pareada", "ANOVA de un factor (+ post hoc)", "ANOVA de dos factores"], answer: 2,
      why: "Tres grupos distintos y una medición: ANOVA de un factor. La F dice si alguna media difiere; las comparaciones post hoc dicen cuáles." },
    { id: "q3", kind: "mcq", zone: "¿Qué prueba?", title: "¿Qué prueba toca? · 3",
      lead: "Grupos que ya existían (dos cursos) reciben condiciones distintas.",
      prompt: "Dos cursos intactos: uno recibe desayuno completo antes de una prueba de memoria, el otro no. Se mide memoria una vez.",
      opts: ["t para muestras independientes (y reportar cómo eran los cursos antes)", "t pareada", "ANOVA de medidas repetidas", "No se puede analizar"], answer: 0,
      why: "Es un cuasiexperimento, pero la prueba es la misma de dos grupos independientes. Lo que cambia es lo que pueden concluir: hay que reportar en qué diferían los cursos antes." },
    { id: "r1", kind: "mcq", zone: "Leer resultados", title: "¿Cuál frase es correcta?",
      lead: "p dice qué tan raro sería ver estos datos si no hubiera efecto. d dice cuánto. El intervalo dice con qué certeza.",
      prompt: "Solo una de estas cuatro lecturas está bien.",
      opts: ["p = .03 significa que H0 tiene 3 % de probabilidad de ser cierta", "p ≥ .05 demuestra que la manipulación no tuvo efecto", "d = 0.8, IC 95 % [0.1, 1.5]: el efecto probablemente existe, pero está mal estimado", "Un p más pequeño siempre significa un efecto más grande"], answer: 2,
      why: "p no es la probabilidad de H0; p ≥ .05 no demuestra nada; y p depende del n. El d con su intervalo es lo que dice cuánto y con qué certeza." },
    { id: "ic1", kind: "multi", zone: "Leer resultados", title: "Cazadores de intervalos",
      lead: "Cada barra es el intervalo de confianza del d de un estudio. Si la barra toca el cero, ese estudio no puede descartar que el efecto sea nulo.",
      prompt: "Marquen TODOS los estudios que sí pueden afirmar que el efecto existe.",
      params: { items: [{ k: "A", lo: -0.4, hi: 0.9 }, { k: "B", lo: 0.05, hi: 0.95 }, { k: "C", lo: -0.1, hi: 2.0 }, { k: "D", lo: 0.9, hi: 1.3 }] },
      opts: ["Estudio A", "Estudio B", "Estudio C", "Estudio D"], answer: [1, 3],
      why: "B y D dejan el cero por fuera. A y C lo incluyen: aunque su d central parezca grande, no pueden descartar un efecto nulo." },
    { id: "ic2", kind: "mcq", zone: "Leer resultados", title: "¿Quién tuvo más participantes?",
      lead: "El ancho del intervalo depende del número de personas: más gente, barra más corta.",
      prompt: "Mismos cuatro estudios. ¿Cuál tuvo MÁS participantes?",
      params: { items: [{ k: "A", lo: -0.4, hi: 0.9 }, { k: "B", lo: 0.05, hi: 0.95 }, { k: "C", lo: -0.1, hi: 2.0 }, { k: "D", lo: 0.9, hi: 1.3 }] },
      opts: ["Estudio A", "Estudio B", "Estudio C", "Estudio D"], answer: 3,
      why: "D tiene el intervalo más estrecho (0.4 de ancho): es el estudio con más participantes. C, el más ancho, es el más pequeño." },
    { id: "rep2", kind: "mcq", zone: "Tamaño de muestra", title: "Veinte réplicas, siete aciertos",
      lead: "El mismo experimento se repitió 20 veces con gente nueva y 7 veces salió p < .05.",
      prompt: "¿Qué está pasando?",
      params: { sig: 7, reps: 20 },
      opts: ["El efecto no existe: 13 de 20 no lo encontraron", "Potencia baja (≈ 35 %): el efecto puede existir, pero el n no alcanza para verlo con fiabilidad", "Siete equipos hicieron trampa", "Hay que publicar solo los siete que salieron significativos"], answer: 1,
      why: "7 de 20 es una potencia de ~35 %. La solución no es esconder los 13 (eso es sesgo de publicación): es más n, manipulación más fuerte o instrumento más fiable, y reportar el d con su intervalo." },
    { id: "lev1", kind: "mcq", zone: "Supuestos", title: "Levene salió significativo",
      lead: "Antes de la prueba se verifican dos cosas: si los datos se parecen a una campana (Shapiro-Wilk) y si las varianzas de los grupos son parecidas (Levene).",
      prompt: "Levene: F(1, 28) = 7.9, p = .009. Las varianzas son distintas. ¿Qué hacen?",
      opts: ["Cambiar a otra prueba porque “no se cumple el supuesto”", "Reportar la t de Welch, que no exige varianzas iguales", "Quitar los datos del grupo con más varianza", "No reportar Levene y seguir con la t clásica"], answer: 1,
      why: "La t de Welch está hecha para varianzas distintas y es la que el curso usa siempre. Los supuestos se reportan tal como salieron y se dice qué se hizo." },
    { id: "apa1", kind: "mcq", zone: "Escribir", title: "Escríbanlo bien",
      lead: "Un resultado se escribe con las medias y DE de cada grupo, el estadístico con sus grados de libertad, el p exacto, el d y su intervalo. Sin adjetivos.",
      prompt: "Control M = 58.1 (DE = 9.8), experimental M = 66.4 (DE = 10.2), 15 por grupo, t de Welch(27.9) = 2.27, p = .031, d = 0.83, IC 95 % [0.08, 1.58]. ¿Cuál es la frase correcta?",
      opts: ["Se acepta la H1: la manipulación demostró tener un efecto altamente significativo", "Los participantes del grupo experimental (M = 66.4, DE = 10.2) obtuvieron puntajes significativamente mayores que los del control (M = 58.1, DE = 9.8), t(27.9) = 2.27, p = .031, d = 0.83, IC 95 % [0.08, 1.58]", "El experimento fue positivo (p = 0.031 < 0.05), por lo que la hipótesis es verdadera", "Hubo diferencia entre los grupos (p = .000)"], answer: 1,
      why: "Nunca “se acepta H1”, “demostró”, “altamente significativo” ni “p = .000”. La frase B tiene todo lo que la rúbrica pide." },
  ];

  /* ---- lo que ve el cliente: sin respuestas ---- */
  function publicList() { return CH.map(c => { const { answer, ...rest } = c; return rest; }); }
  function byId(id) { return CH.find(c => c.id === id); }

  /* ---- verdad calculada de los retos con datos simulados ---- */
  function truth(c) {
    if (c.kind === "signal") { const { a, b } = S.sim(c.params.seed, c.params.n, c.params.n, c.params.d); const w = S.welch(a, b); return { w, answer: w.p < .05 ? 0 : 1 }; }
    if (c.kind === "dslider") { const { a, b } = S.sim(c.params.seed, c.params.n, c.params.n, c.params.d); const w = S.welch(a, b); return { w, target: +w.d.toFixed(2) }; }
    if (c.kind === "nslider") { return { target: S.nFor80(c.params.d) }; }
    if (c.kind === "replicas") { let nmin = null; for (let n = c.params.min; n <= c.params.max; n++) { if (S.replicate(c.params.seedBase, n, c.params.d, c.params.reps).sig >= c.params.need) { nmin = n; break; } } return { nmin }; }
    return {};
  }

  /* ---- calificación (servidor). attempt empieza en 1. Devuelve {ok, pts, done, detail} ---- */
  function grade(c, answer, attempt) {
    const t = truth(c);
    if (c.kind === "signal" || c.kind === "mcq") {
      const correct = c.kind === "signal" ? t.answer : c.answer;
      const ok = Number(answer) === correct;
      const pts = ok ? (attempt === 1 ? PTS_FULL : attempt === 2 ? PTS_HALF : 0) : 0;
      const done = ok || attempt >= 3;
      return { ok, pts, done, correct, detail: t.w ? `t(${t.w.df.toFixed(1)}) = ${t.w.t.toFixed(2)}, ${S.fmtP(t.w.p)}, d = ${t.w.d.toFixed(2)}.` : "" };
    }
    if (c.kind === "multi") {
      const a = Array.isArray(answer) ? answer.map(Number).sort() : [];
      const key = c.answer.slice().sort();
      const exact = a.length === key.length && a.every((v, i) => v === key[i]);
      const diff = new Set([...a.filter(v => !key.includes(v)), ...key.filter(v => !a.includes(v))]).size;
      const ok = exact; const pts = exact ? (attempt === 1 ? PTS_FULL : PTS_HALF) : 0;
      const done = exact || attempt >= 2;
      return { ok, pts, done, correct: key, detail: exact ? "" : `Les faltó o les sobró ${diff} estudio${diff === 1 ? "" : "s"}.` };
    }
    if (c.kind === "dslider") {
      const err = Math.abs(Number(answer) - t.target);
      const pts = Math.max(0, Math.round(PTS_FULL * (1 - err / c.params.tol)));
      return { ok: pts >= 70, pts, done: true, correct: t.target, detail: `El d real de la muestra es ${t.target.toFixed(2)}; ustedes dijeron ${Number(answer).toFixed(2)}.` };
    }
    if (c.kind === "nslider") {
      const err = Math.abs(Number(answer) - t.target);
      const pts = err <= c.params.tolFull ? PTS_FULL : Math.max(0, Math.round(PTS_FULL * (1 - (err - c.params.tolFull) / (c.params.tolZero - c.params.tolFull))));
      return { ok: pts >= 70, pts, done: true, correct: t.target, detail: `Se necesitan ${t.target} por grupo; con ${answer} la potencia sería ${Math.round(S.power(c.params.d, Number(answer)) * 100)} %.` };
    }
    if (c.kind === "replicas") {
      const n = Math.round(Number(answer)); const r = S.replicate(c.params.seedBase, n, c.params.d, c.params.reps);
      if (r.sig < c.params.need) return { ok: false, pts: -10, done: false, correct: t.nmin, detail: `Con ${n} por grupo solo ${r.sig} de ${c.params.reps} réplicas salieron significativas. Suban el n (−10 puntos por intento fallido).` };
      const extra = n - t.nmin; const pts = extra <= 4 ? PTS_FULL : extra <= 12 ? 70 : 40;
      return { ok: true, pts, done: true, correct: t.nmin, detail: `${r.sig} de ${c.params.reps} con ${n} por grupo. El mínimo que lo logra es ${t.nmin}${extra > 4 ? `: usaron ${extra} personas de más por grupo` : ": casi al milímetro"}.` };
    }
    return { ok: false, pts: 0, done: true, detail: "" };
  }

  return { CH, publicList, byId, truth, grade, PTS_FULL, PTS_HALF, STREAK_BONUS };
});
