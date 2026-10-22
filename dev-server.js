/* Servidor local: sirve /public y monta /api/*.js como en Vercel. `node dev-server.js` → http://localhost:3000 */
const http = require("http"), fs = require("fs"), path = require("path");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };
const rewrites = { "/profe": "/host.html", "/p": "/host.html" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"); let p = u.pathname;
  if (p.startsWith("/api/")) { const f = path.join(__dirname, "api", p.slice(5) + ".js"); if (!fs.existsSync(f)) { res.statusCode = 404; return res.end("no api"); } try { await require(f)(req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); } return; }
  if (rewrites[p]) p = rewrites[p]; if (p === "/") p = "/index.html";
  const f = path.join(__dirname, "public", p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream"); fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log("Arena local en http://localhost:" + (process.env.PORT || 3000)));
