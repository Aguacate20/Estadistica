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
  const attempt = (t.attempts[ch.id] || 0) + 1; t.attempts[ch.id] = attempt;
  const r = C.grade(ch, b.answer, attempt);
  let bonus = 0;
  if (r.done) {
    if (r.pts >= C.PTS_FULL) { t.streak += 1; if (t.streak >= 3) bonus = C.STREAK_BONUS; } else t.streak = 0;
    t.step += 1; if (t.step >= order.length) t.finishedAt = G.now();
    t.log.push({ ch: ch.id, pts: r.pts + bonus, attempts: attempt });
  }
  t.pts = Math.max(0, t.pts + r.pts + bonus); t.lastAt = G.now();
  await G.saveTeam(code, t);
  const teams = G.rank(await G.getTeams(code));
  send(res, 200, { ...r, bonus, streak: t.streak, you: { ...G.publicTeam(t), position: teams.findIndex(x => x.id === t.id) + 1, of: teams.length }, why: ch.why });
};
