const { readBody, send } = require("../lib/http");
const G = require("../lib/game");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST" });
  const b = await readBody(req);
  const durationMin = Math.min(120, Math.max(5, Number(b.durationMin) || 25));
  let code; for (let i = 0; i < 20; i++) { code = G.rnd(4); if (!(await G.getGame(code))) break; }
  const g = { code, hostKey: G.rnd(12), status: "lobby", createdAt: G.now(), durationMin, startedAt: null, endsAt: null };
  await G.saveGame(g);
  send(res, 200, { code, hostKey: g.hostKey, store: G.store.mode });
};
