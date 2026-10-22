const { readBody, send } = require("../lib/http");
const G = require("../lib/game");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST" });
  const b = await readBody(req);
  const code = String(b.code || "").toUpperCase().trim();
  const name = String(b.name || "").trim().slice(0, 24);
  const emoji = String(b.emoji || "🧪").slice(0, 4);
  const g = await G.getGame(code);
  if (!g) return send(res, 404, { error: "No existe una arena con ese código. Revisen las letras." });
  if (!name) return send(res, 400, { error: "Pongan un nombre de equipo." });
  if (g.status === "ended") return send(res, 400, { error: "Esta arena ya terminó." });
  const teams = await G.getTeams(code);
  if (teams.some(t => t.name.toLowerCase() === name.toLowerCase())) return send(res, 400, { error: "Ya hay un equipo con ese nombre. Elijan otro." });
  if (teams.length >= 30) return send(res, 400, { error: "La arena está llena." });
  const t = { id: G.rnd(6), token: G.rnd(16), name, emoji, joinedAt: G.now(), pts: 0, step: 0, attempts: {}, streak: 0, finishedAt: null, lastAt: null, log: [] };
  await G.saveTeam(code, t);
  send(res, 200, { teamId: t.id, token: t.token, game: G.publicGame(g), you: G.publicTeam(t) });
};
