const { send, query } = require("../lib/http");
const G = require("../lib/game");
module.exports = async (req, res) => {
  const q = query(req); const code = String(q.code || "").toUpperCase();
  const g = await G.getGame(code);
  if (!g) return send(res, 404, { error: "Arena no encontrada." });
  if (g.status === "live" && g.endsAt && G.now() >= g.endsAt) { g.status = "ended"; await G.saveGame(g); }
  const teams = G.rank(await G.getTeams(code));
  const out = { game: G.publicGame(g), teams: teams.map(G.publicTeam) };
  if (q.team) { const me = teams.find(t => t.id === q.team); if (me) { out.you = { ...G.publicTeam(me), attempts: me.attempts, log: me.log, position: teams.findIndex(t => t.id === q.team) + 1 }; } }
  send(res, 200, out);
};
