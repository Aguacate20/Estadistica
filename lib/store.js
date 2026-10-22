/* Almacén: Upstash Redis por REST (Vercel Marketplace) o memoria local si no hay credenciales.
   Sin dependencias: usa fetch (Node 18+). */
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
const TTL = 60 * 60 * 24; // un día

const mem = { kv: new Map(), h: new Map() };
function memHash(k) { if (!mem.h.has(k)) mem.h.set(k, new Map()); return mem.h.get(k); }

async function redis(cmd) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error("redis " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
const live = () => !!(URL_ && TOKEN);

const store = {
  mode: live() ? "upstash" : "memoria",
  async get(k) { if (!live()) return mem.kv.get(k) ?? null; const v = await redis(["GET", k]); return v == null ? null : v; },
  async set(k, v) { if (!live()) { mem.kv.set(k, v); return; } await redis(["SET", k, v, "EX", TTL]); },
  async del(...ks) { if (!live()) { ks.forEach(k => { mem.kv.delete(k); mem.h.delete(k); }); return; } await redis(["DEL", ...ks]); },
  async hget(k, f) { if (!live()) return memHash(k).get(f) ?? null; const v = await redis(["HGET", k, f]); return v == null ? null : v; },
  async hset(k, f, v) { if (!live()) { memHash(k).set(f, v); return; } await redis(["HSET", k, f, v]); await redis(["EXPIRE", k, TTL]); },
  async hdel(k, f) { if (!live()) { memHash(k).delete(f); return; } await redis(["HDEL", k, f]); },
  async hgetall(k) { if (!live()) return Object.fromEntries(memHash(k)); const arr = await redis(["HGETALL", k]); const o = {}; for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1]; return o; },
};
module.exports = store;
