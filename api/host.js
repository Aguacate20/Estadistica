const { readBody, send } = require("../lib/http");
const G = require("../lib/game");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST" });
  const b = await readBody(req); const code = String(b.code || "").toUpperCase();
  const g = await G.getGame(code);
  if (!g) return send(res, 404, { error: "Arena no encontrada." });
  if (b.hostKey !== g.hostKey) return send(res, 403, { error: "Clave de profe incorrecta." });
  const a = b.action;
  if (a === "start") { g.status = "live"; g.startedAt = G.now(); g.durationMin = Math.min(120, Math.max(5, Number(b.durationMin) || g.durationMin)); g.endsAt = g.startedAt + g.durationMin * 60000; }
  else if (a === "end") { g.status = "ended"; g.endsAt = G.now(); }
  else if (a === "extend") { if (g.endsAt) g.endsAt += 5 * 60000; }
  else if (a === "reopen") { g.status = "live"; g.endsAt = G.now() + 5 * 60000; }
  else if (a === "reset") { g.status = "lobby"; g.startedAt = null; g.endsAt = null; const teams = await G.getTeams(code); for (const t of teams) { Object.assign(t, { pts: 0, step: 0, attempts: {}, streak: 0, finishedAt: null, lastAt: null, log: [] }); await G.saveTeam(code, t); } }
  else if (a === "remove") { await G.store.hdel("g:" + code + ":teams", String(b.teamId || "")); }
  else return send(res, 400, { error: "Acción desconocida." });
  await G.saveGame(g);
  send(res, 200, { ok: true, game: G.publicGame(g) });
};
