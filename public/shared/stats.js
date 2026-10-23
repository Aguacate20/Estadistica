/* Estadística compartida entre el cliente (gráficos) y el servidor (validación).
   Todo determinista: los datos de cada reto salen de una semilla fija, así que
   todos los equipos ven exactamente lo mismo y el servidor puede recalcularlo. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ArenaStats = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rng(seed) { const r = mulberry32(seed); return { u: r, n() { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); } }; }
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  function lgamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (let j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
  function betacf(a, b, x) { const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d; for (let m = 1; m <= MAXIT; m++) { let m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break; } return h; }
  function betai(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const pT = (t, df) => betai(df / 2, 0.5, df / (df + t * t));
  function welch(a, b) { const v1 = sd(a) ** 2 / a.length, v2 = sd(b) ** 2 / b.length; const t = (mean(b) - mean(a)) / Math.sqrt(v1 + v2); const df = (v1 + v2) ** 2 / (v1 ** 2 / (a.length - 1) + v2 ** 2 / (b.length - 1)); const sp = Math.sqrt(((a.length - 1) * sd(a) ** 2 + (b.length - 1) * sd(b) ** 2) / (a.length + b.length - 2)); return { t, df, p: pT(Math.abs(t), df), d: (mean(b) - mean(a)) / sp }; }
  function erf(v) { const t = 1 / (1 + 0.3275911 * Math.abs(v)); const r = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-v * v); return v >= 0 ? r : -r; }
  const Phi = v => 0.5 * (1 + erf(v / Math.SQRT2));
  /* potencia aproximada de una t entre grupos, n por grupo, alfa .05 bilateral */
  const power = (d, n) => Phi(d * Math.sqrt(n / 2) - 1.959964);
  const nFor80 = d => Math.ceil(2 * ((1.959964 + 0.841621) / d) ** 2 + 1.959964 ** 2 / 4);
  /* dos grupos simulados con semilla */
  function sim(seed, n1, n2, d, base, s) { base = base ?? 60; s = s ?? 12; const r = rng(seed); const a = [], b = []; for (let i = 0; i < n1; i++) a.push(base + s * r.n()); for (let i = 0; i < n2; i++) b.push(base + d * s + s * r.n()); return { a, b }; }
  /* máquina de réplicas: `reps` estudios con n por grupo; cada réplica k usa SIEMPRE las mismas
     personas (números comunes), así que subir n agrega gente en vez de cambiarlo todo. */
  function replicate(seedBase, n, d, reps, nmax) { nmax = nmax || 80; let sig = 0; const ps = []; for (let k = 0; k < reps; k++) { const r = rng(seedBase * 1000 + k); const a = [], b = []; for (let i = 0; i < nmax; i++) { const za = r.n(), zb = r.n(); if (i < n) { a.push(60 + 12 * za); b.push(60 + d * 12 + 12 * zb); } } const p = welch(a, b).p; ps.push(p); if (p < .05) sig++; } return { sig, ps }; }
  /* nube de puntos con correlación r (semilla) */
  function simCorr(seed, n, r) { const g = rng(seed); const x = [], y = []; for (let i = 0; i < n; i++) { const zx = g.n(), zy = r * zx + Math.sqrt(1 - r * r) * g.n(); x.push(50 + 15 * zx); y.push(50 + 15 * zy); } return { x, y }; }
  function pearson(x, y) { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
  const fmtP = p => p < .001 ? "p < .001" : "p = " + p.toFixed(3).replace(/^0/, "");
  return { rng, mean, sd, welch, Phi, power, nFor80, sim, replicate, simCorr, pearson, fmtP };
});
