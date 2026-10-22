/* Almacén de la Arena. Tres modos, según las variables de entorno que existan:
   1. Supabase (REST de PostgREST, con la service role key; solo en el servidor)
   2. Upstash Redis (REST)
   3. Memoria local (solo para probar en un computador)
   Sin dependencias: usa fetch (Node 18+). Emula dos estructuras: clave→valor y hash (clave, campo)→valor. */

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
const UP_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
const TTL = 60 * 60 * 24;

/* ---------- Supabase ---------- */
const sbHeaders = extra => ({ apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", ...extra });
async function sb(method, path, body, extra) {
  const r = await fetch(SB_URL + "/rest/v1/" + path, { method, headers: sbHeaders(extra), body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error("supabase " + r.status + " " + (await r.text()).slice(0, 300));
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const enc = encodeURIComponent;
const supabase = {
  mode: "supabase",
  async get(k) { const rows = await sb("GET", `arena_kv?k=eq.${enc(k)}&select=v`); return rows && rows[0] ? rows[0].v : null; },
  async set(k, v) { await sb("POST", "arena_kv?on_conflict=k", { k, v, updated_at: new Date().toISOString() }, { Prefer: "resolution=merge-duplicates,return=minimal" }); },
  async del(...ks) { for (const k of ks) { await sb("DELETE", `arena_kv?k=eq.${enc(k)}`, undefined, { Prefer: "return=minimal" }); await sb("DELETE", `arena_hash?k=eq.${enc(k)}`, undefined, { Prefer: "return=minimal" }); } },
  async hget(k, f) { const rows = await sb("GET", `arena_hash?k=eq.${enc(k)}&f=eq.${enc(f)}&select=v`); return rows && rows[0] ? rows[0].v : null; },
  async hset(k, f, v) { await sb("POST", "arena_hash?on_conflict=k,f", { k, f, v, updated_at: new Date().toISOString() }, { Prefer: "resolution=merge-duplicates,return=minimal" }); },
  async hdel(k, f) { await sb("DELETE", `arena_hash?k=eq.${enc(k)}&f=eq.${enc(f)}`, undefined, { Prefer: "return=minimal" }); },
  async hgetall(k) { const rows = await sb("GET", `arena_hash?k=eq.${enc(k)}&select=f,v`); const o = {}; (rows || []).forEach(r => { o[r.f] = r.v; }); return o; },
};

/* ---------- Upstash ---------- */
async function redis(cmd) {
  const r = await fetch(UP_URL, { method: "POST", headers: { Authorization: "Bearer " + UP_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error("redis " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
const upstash = {
  mode: "upstash",
  async get(k) { const v = await redis(["GET", k]); return v == null ? null : v; },
  async set(k, v) { await redis(["SET", k, v, "EX", TTL]); },
  async del(...ks) { await redis(["DEL", ...ks]); },
  async hget(k, f) { const v = await redis(["HGET", k, f]); return v == null ? null : v; },
  async hset(k, f, v) { await redis(["HSET", k, f, v]); await redis(["EXPIRE", k, TTL]); },
  async hdel(k, f) { await redis(["HDEL", k, f]); },
  async hgetall(k) { const arr = await redis(["HGETALL", k]); const o = {}; for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1]; return o; },
};

/* ---------- Memoria ---------- */
const mem = { kv: new Map(), h: new Map() };
const memHash = k => { if (!mem.h.has(k)) mem.h.set(k, new Map()); return mem.h.get(k); };
const memory = {
  mode: "memoria",
  async get(k) { return mem.kv.get(k) ?? null; },
  async set(k, v) { mem.kv.set(k, v); },
  async del(...ks) { ks.forEach(k => { mem.kv.delete(k); mem.h.delete(k); }); },
  async hget(k, f) { return memHash(k).get(f) ?? null; },
  async hset(k, f, v) { memHash(k).set(f, v); },
  async hdel(k, f) { memHash(k).delete(f); },
  async hgetall(k) { return Object.fromEntries(memHash(k)); },
};

module.exports = SB_URL && SB_KEY ? supabase : (UP_URL && UP_TOKEN ? upstash : memory);
