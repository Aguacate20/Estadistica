const store = require("./store");
const C = require("../public/shared/challenges.js");
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rnd = n => Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
const now = () => Date.now();
const gkey = c => "g:" + c, tkey = c => "g:" + c + ":teams";

async function getGame(code) { const v = await store.get(gkey(code)); return v ? JSON.parse(v) : null; }
async function saveGame(g) { await store.set(gkey(g.code), JSON.stringify(g)); }
async function getTeams(code) { const h = await store.hgetall(tkey(code)); return Object.values(h).map(v => JSON.parse(v)); }
async function getTeam(code, id) { const v = await store.hget(tkey(code), id); return v ? JSON.parse(v) : null; }
async function saveTeam(code, t) { await store.hset(tkey(code), t.id, JSON.stringify(t)); }

function publicTeam(t) { return { id: t.id, name: t.name, emoji: t.emoji, pts: t.pts, step: t.step, total: (t.order || []).length || C.CH.length, streak: t.streak, finishedAt: t.finishedAt || null, lastAt: t.lastAt || null, seed: t.seed || null, joinedAt: t.joinedAt || null, done: (t.log || []).length, fast: t.fast || 0, hiddenTotal: t.hiddenTotal || 0, avgSecs: (t.log && t.log.length) ? Math.round(t.log.reduce((s2, l) => s2 + (l.secs || 0), 0) / t.log.length) : null }; }
function publicGame(g) { return { code: g.code, status: g.status, startedAt: g.startedAt || null, endsAt: g.endsAt || null, durationMin: g.durationMin, serverNow: now(), store: store.mode }; }
function rank(teams) { return teams.slice().sort((a, b) => b.pts - a.pts || (a.finishedAt || 9e15) - (b.finishedAt || 9e15) || (a.lastAt || 0) - (b.lastAt || 0)); }
function isLive(g) { return g.status === "live" && (!g.endsAt || now() < g.endsAt); }

module.exports = { store, C, rnd, now, getGame, saveGame, getTeams, getTeam, saveTeam, publicTeam, publicGame, rank, isLive };
