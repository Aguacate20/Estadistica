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
  function scatter(x, y, label) {
    const W = 360, H = 300, pad = 28; const lo = 0, hi = 100; const sx = v => pad + (v - lo) / (hi - lo) * (W - 2 * pad), sy = v => H - pad - (v - lo) / (hi - lo) * (H - 2 * pad);
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label || "Dispersión")}">`;
    [25, 50, 75].forEach(v => { s += `<line x1="${sx(v)}" y1="${pad}" x2="${sx(v)}" y2="${H - pad}" stroke="var(--line)"/><line x1="${pad}" y1="${sy(v)}" x2="${W - pad}" y2="${sy(v)}" stroke="var(--line)"/>`; });
    s += `<rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}" fill="none" stroke="var(--line)"/>`;
    x.forEach((v, i) => { s += `<circle cx="${sx(Math.max(lo, Math.min(hi, v))).toFixed(1)}" cy="${sy(Math.max(lo, Math.min(hi, y[i]))).toFixed(1)}" r="5" fill="var(--blue)" fill-opacity=".6"/>`; });
    if (label) s += `<text x="${W / 2}" y="${H - 8}" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="800" font-family="Bricolage Grotesque,sans-serif">${esc(label)}</text>`;
    s += `<text x="${W - pad}" y="${pad - 8}" font-size="11" text-anchor="end" fill="var(--muted)">X →   Y ↑</text>`;
    return s + "</svg>";
  }
  function miniGroups(a, b, label) {
    const W = 360, H = 110, padL = 40, padR = 12, lo = 20, hi = 100; const x = v => padL + (v - lo) / (hi - lo) * (W - padL - padR);
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estudio ${esc(label)}">`;
    s += `<text x="12" y="${H / 2 + 8}" font-size="26" font-weight="800" fill="var(--ink)" font-family="Bricolage Grotesque,sans-serif">${esc(label)}</text>`;
    [[a, "var(--blue)", 34], [b, "var(--mint)", 78]].forEach(([g, col, y0]) => { g.forEach((v, i) => { const j = Math.abs(Math.sin(i * 12.9898 + y0) * 43758.5453) % 1; s += `<circle cx="${x(v).toFixed(1)}" cy="${(y0 + (j - 0.5) * 22).toFixed(1)}" r="4.5" fill="${col}" fill-opacity=".55"/>`; }); const m = S.mean(g); s += `<rect x="${x(m) - 2.5}" y="${y0 - 16}" width="5" height="32" rx="2" fill="${col}"/>`; });
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
  /* esquema de diseño: filas = grupos/condiciones. assign: "R" (al azar), "-" (grupos ya formados), "same" (las mismas personas) */
  function design(spec) {
    const rows = spec.rows, W = 440, RH = 70, top = 44, H = top + rows.length * RH + 48;
    const C = { R: "var(--mint)", X: "var(--amber)", O: "var(--blue)", ink: "var(--ink)", muted: "var(--muted)", line: "var(--line)" };
    const cols = spec.corr ? ["Mide X", "Mide Y"] : spec.pre ? ["Antes", "Recibe", "Después"] : ["Recibe", "Se mide"];
    const xA = 26, xG = 48, x0 = 150, step = (W - x0 - 10) / cols.length;
    let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Esquema del diseño">`;
    cols.forEach((c, i) => { s += `<text x="${x0 + i * step + step / 2}" y="24" font-size="13" text-anchor="middle" fill="${C.muted}" font-weight="800">${esc(c)}</text>`; });
    s += `<text x="${xG}" y="24" font-size="13" fill="${C.muted}" font-weight="800">${spec.same ? "MISMAS personas" : "Personas"}</text>`;
    const circ = (cx, cy, t, col) => `<circle cx="${cx}" cy="${cy}" r="19" fill="${col}" fill-opacity=".15" stroke="${col}" stroke-width="2.5"/><text x="${cx}" y="${cy + 5}" font-size="13" font-weight="800" text-anchor="middle" fill="${col}">${esc(t)}</text>`;
    const bw = Math.min(124, step - 14);
    const box = (cx, cy, t, col, dashed) => `<rect x="${cx - bw / 2}" y="${cy - 19}" width="${bw}" height="38" rx="9" fill="${col}" fill-opacity="${dashed ? 0 : .15}" stroke="${col}" stroke-width="2.5" ${dashed ? 'stroke-dasharray="5 4"' : ""}/><text x="${cx}" y="${cy + 5}" font-size="12" font-weight="800" text-anchor="middle" fill="${dashed ? C.muted : col}">${esc(t.length > 18 ? t.slice(0, 17) + "…" : t)}</text>`;
    rows.forEach((r, i) => {
      const y = top + i * RH + 26;
      s += `<text x="${xG}" y="${y + 5}" font-size="13" font-weight="800" fill="${C.ink}">${esc(r.label.length > 14 ? r.label.slice(0, 13) + "…" : r.label)}</text>`;
      if (spec.same) s += `<text x="${xA}" y="${y + 7}" font-size="18" text-anchor="middle">${i === 0 ? "👥" : "⤵"}</text>`;
      else s += r.assign === "R" ? circ(xA, y, "R", C.R) : `<text x="${xA}" y="${y + 8}" font-size="22" text-anchor="middle" fill="${C.muted}">—</text>`;
      const items = spec.corr ? [["O", r.ox], ["O", r.oy]] : spec.pre ? [["O", "mide"], ["X", r.x, r.ctrl], ["O", "mide"]] : [["X", r.x, r.ctrl], ["O", "mide"]];
      items.forEach((it, j) => { const cx = x0 + j * step + step / 2; if (j) { const prev = items[j - 1]; s += `<line x1="${x0 + (j - 1) * step + step / 2 + (prev[0] === "X" ? bw / 2 : 19)}" y1="${y}" x2="${cx - (it[0] === "X" ? bw / 2 : 19)}" y2="${y}" stroke="${C.line}" stroke-width="2.5"/>`; } s += it[0] === "O" ? circ(cx, y, it[1], C.O) : box(cx, y, it[1], C.X, it[2]); });
    });
    if (spec.note) s += `<text x="${xA - 10}" y="${H - 26}" font-size="12.5" fill="${C.ink}" font-weight="700">${esc(spec.note)}</text>`;
    s += `<text x="${xA - 10}" y="${H - 8}" font-size="11.5" fill="${C.muted}">${spec.corr ? "nada se asigna: solo se mide" : "R = al azar · — = grupos ya formados · punteado = control"}</text>`;
    return s + "</svg>";
  }
  function reps(ps, need) { return `<div class="reps">${ps.map((p, i) => `<span class="${p < .05 ? "s" : ""}" title="p = ${p.toFixed(3)}">${p < .05 ? "✓" : "–"}</span>`).join("")}</div>`; }
  function repsFixed(sig, total) { const order = [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0]; return `<div class="reps">${order.slice(0, total).map(v => `<span class="${v ? "s" : ""}">${v ? "p<.05" : "n.s."}</span>`).join("")}</div>`; }
  return { groups, scatter, miniGroups, cis, power, design, reps, repsFixed, esc };
});
