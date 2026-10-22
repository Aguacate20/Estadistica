/* Gráficos SVG de la Arena (cliente). */
(function (root, factory) { root.ArenaPlots = factory(root.ArenaStats); })(typeof self !== "undefined" ? self : this, function (S) {
  const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function groups(gs, labels, title, lo, hi) {
    const W = 560, k = gs.length, H = 70 + k * 74, padL = 118, padR = 24; const x = v => padL + (v - lo) / (hi - lo) * (W - padL - padR);
    const cols = ["var(--blue)", "var(--mint)", "var(--amber)"]; let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
    for (let i = 0; i <= 5; i++) { const v = lo + (hi - lo) * i / 5; s += `<line x1="${x(v)}" y1="36" x2="${x(v)}" y2="${H - 28}" stroke="var(--line)"/><text x="${x(v)}" y="${H - 10}" font-size="13" text-anchor="middle" fill="var(--muted)">${Math.round(v)}</text>`; }
    s += `<text x="${padL}" y="22" font-size="14" fill="var(--ink2)" font-weight="700">${esc(title)}</text>`;
    gs.forEach((g, gi) => { const y0 = 68 + gi * 74; s += `<text x="${padL - 12}" y="${y0 + 5}" font-size="17" font-weight="800" text-anchor="end" fill="var(--ink)">${esc(labels[gi])}</text><text x="${padL - 12}" y="${y0 + 24}" font-size="12" text-anchor="end" fill="var(--muted)">n = ${g.length}</text>`;
      g.forEach((v, i) => { const j = Math.abs(Math.sin(i * 12.9898 + gi * 78.233) * 43758.5453) % 1; s += `<circle cx="${x(v).toFixed(1)}" cy="${(y0 + (j - 0.5) * 36).toFixed(1)}" r="7" fill="${cols[gi]}" fill-opacity=".55"/>`; });
      const m = S.mean(g), se = S.sd(g) / Math.sqrt(g.length); s += `<line x1="${x(m - 1.96 * se)}" y1="${y0}" x2="${x(m + 1.96 * se)}" y2="${y0}" stroke="${cols[gi]}" stroke-width="5"/><rect x="${x(m) - 3}" y="${y0 - 20}" width="6" height="40" rx="2" fill="${cols[gi]}"/>`; });
    return s + "</svg>";
  }
  function cis(items, marked) {
    const W = 720, H = 60 + items.length * 54, padL = 70, padR = 30, lo = -1, hi = 2.2; const x = v => padL + (v - lo) / (hi - lo) * (W - padL - padR);
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Intervalos de confianza">`;
    [-1, -0.5, 0, 0.5, 1, 1.5, 2].forEach(v => { s += `<line x1="${x(v)}" y1="30" x2="${x(v)}" y2="${H - 26}" stroke="${v === 0 ? "var(--amber)" : "var(--line)"}" stroke-width="${v === 0 ? 2 : 1}" ${v === 0 ? 'stroke-dasharray="5 4"' : ""}/><text x="${x(v)}" y="${H - 8}" font-size="13" text-anchor="middle" fill="var(--muted)">${v}</text>`; });
    s += `<text x="${x(0) + 6}" y="24" font-size="13" fill="var(--amber)" font-weight="700">d = 0 · ningún efecto</text>`;
    items.forEach((it, i) => { const y = 54 + i * 54; const col = marked && marked.includes(i) ? "var(--amber)" : "var(--mint)"; s += `<text x="${padL - 14}" y="${y + 7}" font-size="22" font-weight="800" text-anchor="end" fill="var(--ink)" font-family="Bricolage Grotesque,sans-serif">${it.k}</text><line x1="${x(it.lo)}" y1="${y}" x2="${x(it.hi)}" y2="${y}" stroke="${col}" stroke-width="7" stroke-linecap="round"/><circle cx="${x((it.lo + it.hi) / 2)}" cy="${y}" r="10" fill="${col}" stroke="var(--bg)" stroke-width="3"/><text x="${x(it.hi) + 12}" y="${y + 5}" font-size="14" fill="var(--ink2)">[${it.lo.toFixed(1)}, ${it.hi.toFixed(1)}]</text>`; });
    return s + "</svg>";
  }
  function power(d, nMark) {
    const W = 720, H = 280, pl = 60, pr = 30, pt = 24, pb = 46; const x = n => pl + (n - 5) / 145 * (W - pl - pr); const y = p => pt + (1 - p) * (H - pt - pb);
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de potencia">`;
    for (let p = 0; p <= 1; p += .25) s += `<line x1="${pl}" y1="${y(p)}" x2="${W - pr}" y2="${y(p)}" stroke="var(--line)"/><text x="${pl - 8}" y="${y(p) + 4}" font-size="13" text-anchor="end" fill="var(--muted)">${Math.round(p * 100)} %</text>`;
    [5, 25, 50, 75, 100, 125, 150].forEach(n => { s += `<text x="${x(n)}" y="${H - pb + 18}" font-size="13" text-anchor="middle" fill="var(--muted)">${n}</text>`; });
    s += `<text x="${(pl + W - pr) / 2}" y="${H - 8}" font-size="14" text-anchor="middle" fill="var(--ink2)" font-weight="700">personas por grupo</text>`;
    s += `<line x1="${pl}" y1="${y(.8)}" x2="${W - pr}" y2="${y(.8)}" stroke="var(--amber)" stroke-width="2" stroke-dasharray="6 4"/><text x="${W - pr}" y="${y(.8) - 6}" font-size="13" text-anchor="end" fill="var(--amber)" font-weight="800">meta .80</text>`;
    [[0.2, "var(--muted)", "d = .2"], [0.8, "var(--blue)", "d = .8"]].forEach(([dd, c, l]) => { if (Math.abs(dd - d) < .05) return; let p = ""; for (let n = 5; n <= 150; n++) p += (n === 5 ? "M" : "L") + x(n).toFixed(1) + " " + y(S.power(dd, n)).toFixed(1) + " "; s += `<path d="${p}" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/><text x="${x(150) - 4}" y="${y(S.power(dd, 150)) + (dd < d ? 16 : -8)}" font-size="12" text-anchor="end" fill="${c}" font-weight="800">${l}</text>`; });
    let p = ""; for (let n = 5; n <= 150; n++) p += (n === 5 ? "M" : "L") + x(n).toFixed(1) + " " + y(S.power(d, n)).toFixed(1) + " "; s += `<path d="${p}" fill="none" stroke="var(--mint)" stroke-width="4"/>`;
    if (nMark) { const pw = S.power(d, nMark); s += `<line x1="${x(nMark)}" y1="${y(pw)}" x2="${x(nMark)}" y2="${H - pb}" stroke="var(--mint)" stroke-dasharray="3 3"/><circle cx="${x(nMark)}" cy="${y(pw)}" r="10" fill="var(--amber)" stroke="var(--bg)" stroke-width="3"/><text x="${Math.min(x(nMark) + 12, W - pr - 150)}" y="${y(pw) - 14}" font-size="16" fill="var(--ink)" font-weight="800">n = ${nMark} → ${Math.round(pw * 100)} %</text>`; }
    return s + "</svg>";
  }
  function reps(ps, need) { return `<div class="reps">${ps.map((p, i) => `<span class="${p < .05 ? "s" : ""}" title="p = ${p.toFixed(3)}">${p < .05 ? "✓" : "–"}</span>`).join("")}</div>`; }
  function repsFixed(sig, total) { const order = [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0]; return `<div class="reps">${order.slice(0, total).map(v => `<span class="${v ? "s" : ""}">${v ? "p<.05" : "n.s."}</span>`).join("")}</div>`; }
  return { groups, cis, power, reps, repsFixed, esc };
});
