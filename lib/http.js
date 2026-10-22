async function readBody(req) {
  if (req.body !== undefined && req.body !== null) { if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (_) { return {}; } } return req.body; }
  return new Promise(res => { let d = ""; req.on("data", c => d += c); req.on("end", () => { try { res(d ? JSON.parse(d) : {}); } catch (_) { res({}); } }); });
}
function send(res, status, obj) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); }
function query(req) { const u = new URL(req.url, "http://x"); return Object.fromEntries(u.searchParams); }
module.exports = { readBody, send, query };
