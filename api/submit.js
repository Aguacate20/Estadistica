const { readBody, send } = require("../lib/http");
const G = require("../lib/game");
const C = G.C;
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST" });
  const b = await readBody(req); const code = String(b.code || "").toUpperCase();
  const g = await G.getGame(code);
  if (!g) return send(res, 404, { error: "Arena no encontrada." });
  const t = await G.getTeam(code, String(b.team || ""));
  if (!t || t.token !== b.token) return send(res, 403, { error: "Equipo no reconocido. Vuelvan a entrar con el código." });
  if (!G.isLive(g)) return send(res, 400, { error: g.status === "lobby" ? "La arena todavía no empieza." : "La arena ya terminó." });
  if (t.finishedAt) return send(res, 400, { error: "Ya terminaron todos los retos." });
  const order = t.order && t.order.length ? t.order : C.CH.map(c => c.id);
  const ch = C.byId(order[t.step]);
  if (!ch || ch.id !== b.ch) return send(res, 409, { error: "Ese no es su reto actual.", you: G.publicTeam(t) });
  const nowMs = G.now(); const since = (t.served && t.served.id === ch.id) ? t.served.at : (t.lastAt || g.startedAt || nowMs); const secs = Math.round((nowMs - since) / 100) / 10;
  const hidden = Math.max(0, Math.min(99, Number(b.hidden) || 0));
  /* ventana por tipo de reto desde que el equipo destapó la pregunta; fuera de la ventana vale 0; salir de la app lo deja en la mitad como máximo */
  const WIN = { signal: 45, corrpick: 40, mcq: 60, multi: 60, vf: 75, order: 75, match: 75, dslider: 50, rslider: 50, nslider: 60, replicas: 90 };
  const window_ = (WIN[ch.kind] || 60) + 5; // 5 s de gracia por la red
  let factor = secs <= window_ ? 1 : 0;
  if (hidden > 0) factor = Math.min(factor, 0.5);
  const MINS = { mcq: 8, multi: 8, vf: 10, order: 8, match: 10, signal: 5, corrpick: 5, dslider: 5, rslider: 5, nslider: 5, replicas: 6 };
  const MIN_SECS = process.env.ARENA_MIN_SECS !== undefined ? Number(process.env.ARENA_MIN_SECS) : (MINS[ch.kind] || 6); // menos de esto no da tiempo ni de leer el reto
  if (secs < MIN_SECS) return send(res, 429, { error: `Muy rápido: lean el reto antes de enviar (${MIN_SECS} s mínimo).`, wait: MIN_SECS - secs });
  const attempt = (t.attempts[ch.id] || 0) + 1; t.attempts[ch.id] = attempt;
  const r = C.grade(ch, b.answer, attempt);
  const rawPts = r.pts; if (r.pts > 0) r.pts = Math.round(r.pts * factor);
  if (r.pts !== rawPts) r.detail = (r.detail ? r.detail + " " : "") + (factor === 0 ? `Se acabó el tiempo (${Math.round(secs)} s): el reto vale 0.` : `Salieron de la arena durante el reto: vale máximo la mitad (${rawPts} → ${r.pts}).`);
  let bonus = 0;
  if (r.done) {
    if (rawPts >= C.PTS_FULL && factor === 1) { t.streak += 1; if (t.streak >= 3) bonus = C.STREAK_BONUS; } else t.streak = 0;
    t.step += 1; if (t.step >= order.length) t.finishedAt = G.now();
    t.log.push({ ch: ch.id, pts: r.pts + bonus, raw: rawPts, factor: Math.round(factor * 100) / 100, hidden, attempts: attempt, secs, at: nowMs, a: typeof b.answer === "object" ? JSON.stringify(b.answer).slice(0, 60) : String(b.answer).slice(0, 30) });
    t.hiddenTotal = (t.hiddenTotal || 0) + (hidden > 0 ? 1 : 0); delete t.served;
    t.fast = (t.fast || 0) + (secs < 12 ? 1 : 0);
  }
  t.pts = Math.max(0, t.pts + r.pts + bonus); t.lastAt = nowMs;
  await G.saveTeam(code, t);
  const teams = G.rank(await G.getTeams(code));
  send(res, 200, { ...r, bonus, streak: t.streak, you: { ...G.publicTeam(t), position: teams.findIndex(x => x.id === t.id) + 1, of: teams.length }, why: ch.why });
};
