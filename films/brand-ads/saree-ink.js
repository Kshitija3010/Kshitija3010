// saree-ink.js · TAANA BAANA silk sarees (an original, made-up brand) in ink wash. 14 s.
// 1 an ink drop blooms and one long brush stroke becomes silk; pink bleeds in, a gold border follows
// 2 three sarees drying on a bamboo pole before misty ink mountains
// 3 taana (warp) and baana (weft) are drawn and woven, then flooded with colour
// 4 end card with hand-lettered name and a red seal.
(() => {
const { W, H, ss, seg, lerp, rng } = L;
const PAPER = '#efe7d6', INK = '22,20,24', KALAM = 'Kalam, cursive';
const RANI = '214,35,110', EMER = '16,128,92', SAFF = '236,128,30', GOLD = '#b8892e';
const nz = (x, s = 0) => Math.sin(x * 1.7 + s) * .5 + Math.sin(x * 3.1 + s * 2.3) * .3 + Math.sin(x * 7.3 + s * .7) * .2;

// ---------- paper ----------
const paper = L.mk();
{
  const x = paper.getContext('2d'), r = rng(5);
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  const id = x.getImageData(0, 0, W, H); for (let k = 0; k < id.data.length; k += 4) { const v = (r() - .5) * 14; id.data[k] += v; id.data[k + 1] += v; id.data[k + 2] += v; } x.putImageData(id, 0, 0);
  x.strokeStyle = 'rgba(120,95,60,.07)'; x.lineWidth = 1.2;
  for (let i = 0; i < 1100; i++) { const px = r() * W, py = r() * H, a = r() * Math.PI, l = 10 + r() * 40; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + (r() - .5) * 8, py + Math.sin(a) * l * .5 + (r() - .5) * 8, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  for (let i = 0; i < 7; i++) { const px = r() * W, py = r() * H, rr = 200 + r() * 400, g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, 'rgba(170,140,90,.06)'); g.addColorStop(1, 'rgba(170,140,90,0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
}
const bg = c => c.drawImage(paper, 0, 0);

// ---------- brush ----------
const sample = (fn, n = 160) => { const P = []; for (let i = 0; i <= n; i++) P.push(fn(i / n)); return P; };
function geom(P) {
  const G = []; let Lc = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    if (i) Lc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    G.push({ x: P[i][0], y: P[i][1], nx: -dy / l, ny: dx / l, L: Lc });
  }
  return G;
}
function outline(c, G, n, wf, off = 0) {
  c.beginPath();
  for (let i = 0; i < n; i++) { const w = wf(i); c.lineTo(G[i].x + G[i].nx * (off + w / 2), G[i].y + G[i].ny * (off + w / 2)); }
  for (let i = n - 1; i >= 0; i--) { const w = wf(i); c.lineTo(G[i].x + G[i].nx * (off - w / 2), G[i].y + G[i].ny * (off - w / 2)); }
  c.closePath();
}
// dry brush: bristles that skip as the ink runs out ("flying white"), over a soft wet halo
function brush(c, P, o) {
  const G = geom(P), tot = G[G.length - 1].L, upto = tot * (o.p ?? 1); if (upto <= 1) return;
  const s = o.seed || 1, w = o.w, al = o.alpha ?? .9, dry = o.dry ?? .5, B = o.bristles || 22;
  const wf = i => { const u = G[i].L / tot; return w * Math.pow(Math.sin(Math.PI * Math.min(1, u * .94 + .05)), .45) * (1 + .18 * nz(u * 6, s)); };
  let n = G.findIndex(g => g.L > upto); if (n < 0) n = G.length; if (n < 2) return;
  c.save();
  outline(c, G, n, wf); c.filter = `blur(${o.halo ?? 6}px)`; c.fillStyle = `rgba(${INK},${al * .2})`; c.fill(); c.filter = 'none';
  c.fillStyle = `rgba(${INK},${al * .22})`; c.fill();
  const r = rng(s * 97); c.lineCap = 'round';
  for (let b = 0; b < B; b++) {
    const off = (b / (B - 1) - .5) * .95 + (r() - .5) * .03, ba = al * (.35 + .65 * r()), ph = r() * 100;
    c.strokeStyle = `rgba(${INK},${ba})`; c.lineWidth = w / B * 2.2 * (.6 + .8 * r()); c.beginPath(); let pen = false;
    for (let i = 0; i < n; i++) {
      const u = G[i].L / tot, edge = Math.abs(off) > .38 ? dry * .5 : 0;
      if (nz(u * 14 + ph, b) > 1 - dry * u * 1.6 - edge) { pen = false; continue; }
      const wd = wf(i), x = G[i].x + G[i].nx * off * wd, y = G[i].y + G[i].ny * off * wd;
      pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true;
    }
    c.stroke();
  }
  c.restore();
}
function wash(c, P, w, rgb, a, p = 1, blur = 12, off = 0) {   // pigment wash that bleeds into the paper
  const G = geom(P), tot = G[G.length - 1].L; let n = G.findIndex(g => g.L > tot * p); if (n < 0) n = G.length; if (n < 2) return;
  const wf = i => w * (.8 + .2 * nz(G[i].L * .01, 3)) * Math.pow(Math.sin(Math.PI * Math.min(1, G[i].L / tot * .94 + .05)), .3);
  c.save(); c.globalCompositeOperation = 'multiply';
  outline(c, G, n, wf, off); c.filter = `blur(${blur}px)`; c.fillStyle = `rgba(${rgb},${a})`; c.fill();
  c.filter = 'blur(2px)'; c.strokeStyle = `rgba(${rgb},${a * .7})`; c.lineWidth = 3; c.stroke();
  c.restore();
}
function goldLine(c, P, off, p = 1) {
  const G = geom(P), tot = G[G.length - 1].L; let n = G.findIndex(g => g.L > tot * p); if (n < 0) n = G.length; if (n < 2) return;
  c.save(); c.lineCap = 'round';
  for (const [col, lw, d] of [[GOLD, 7, 0], ['#f3d98c', 2.5, -2]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let i = 0; i < n; i++) c.lineTo(G[i].x + G[i].nx * (off + d), G[i].y + G[i].ny * (off + d)); c.stroke(); }
  c.fillStyle = GOLD; let next = 0;
  for (let i = 0; i < n; i++) if (G[i].L >= next) { next += 46; c.beginPath(); c.arc(G[i].x + G[i].nx * (off - 18), G[i].y + G[i].ny * (off - 18), 4.5, 0, 7); c.fill(); }
  c.restore();
}
function blob(c, x, y, r, a, seed, rgb = INK) {
  if (r <= 1) return;
  c.save(); c.beginPath();
  for (let k = 0; k <= 90; k++) { const th = k / 90 * Math.PI * 2, rr = r * (1 + .14 * nz(th * 3, seed) + .07 * nz(th * 9, seed + 1)); c.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr); }
  c.closePath(); c.filter = 'blur(3px)'; c.fillStyle = `rgba(${rgb},${a})`; c.fill(); c.filter = 'blur(1px)'; c.strokeStyle = `rgba(${rgb},${Math.min(1, a * 1.3)})`; c.lineWidth = 4; c.stroke();
  c.restore();
  const s = rng(seed); for (let i = 0; i < 9; i++) { const th = s() * 7, d = r * (1.2 + s() * .8); c.fillStyle = `rgba(${rgb},${a * .8})`; c.beginPath(); c.arc(x + Math.cos(th) * d, y + Math.sin(th) * d, 2 + s() * 6 * r / 90, 0, 7); c.fill(); }
}
function mountains(c, base, h, a, seed, shift) {
  c.save(); c.filter = 'blur(2px)'; c.beginPath(); c.moveTo(-20, base + 400);
  for (let x = -20; x <= W + 20; x += 10) c.lineTo(x, base - h * (.6 + .4 * nz(x * .004 + shift, seed)) - h * .35 * Math.max(0, nz(x * .011 + shift, seed + 3)));
  c.lineTo(W + 20, base + 400); c.closePath();
  const g = c.createLinearGradient(0, base - h, 0, base + 260); g.addColorStop(0, `rgba(${INK},${a})`); g.addColorStop(1, `rgba(${INK},0)`);
  c.fillStyle = g; c.fill(); c.restore();
}
function hanging(c, x, top, w, h, t, rgb, seed, a) {          // a saree drying on the pole
  if (a <= 0) return;
  const N = 30, Lp = [], Rp = [];
  for (let k = 0; k <= N; k++) { const v = k / N, off = 34 * Math.sin(v * 3 - t * 2.2 + seed) * v; Lp.push([x + off, top + v * h]); Rp.push([x + w + off * 1.15, top + v * h * (1 - .03 * Math.sin(t * 2 + seed))]); }
  c.save(); c.globalAlpha = a;
  const poly = (v0, v1) => { c.beginPath(); for (let k = Math.round(v0 * N); k <= Math.round(v1 * N); k++) c.lineTo(Lp[k][0], Lp[k][1]); for (let k = Math.round(v1 * N); k >= Math.round(v0 * N); k--) c.lineTo(Rp[k][0], Rp[k][1]); c.closePath(); };
  poly(0, 1); c.fillStyle = PAPER; c.fill();
  c.globalCompositeOperation = 'multiply';
  poly(0, 1); c.filter = 'blur(6px)'; c.fillStyle = `rgba(${rgb},.55)`; c.fill(); c.filter = 'none';
  poly(.8, .9); c.fillStyle = 'rgba(184,137,46,.75)'; c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = GOLD; for (let k = 3; k < 24; k += 4) for (let j = 1; j < 4; j++) { const v = k / N, px = lerp(Lp[k][0], Rp[k][0], j / 4), py = lerp(Lp[k][1], Rp[k][1], j / 4); c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); }
  brush(c, Lp, { w: 9, seed: seed + 3, dry: .4, alpha: .8, bristles: 6, halo: 3 });
  brush(c, Rp, { w: 9, seed: seed + 5, dry: .4, alpha: .8, bristles: 6, halo: 3 });
  c.restore();
}
const silkPath = (cx, top, len, amp) => sample(u => [cx + amp * Math.sin(u * Math.PI * 1.6 + .2) * (1 - u * .3), top + u * len]);

function s1(c, lt) {
  bg(c);
  const P = silkPath(540, 560, 1060, 300);
  blob(c, 540, 540, 95 * L.outCubic(seg(lt, .2, 1)), .85, 4);
  if (lt < .2) { c.fillStyle = `rgba(${INK},.9)`; c.beginPath(); c.ellipse(540, lerp(-40, 540, lt / .2), 10, 18, 0, 0, 7); c.fill(); }
  brush(c, P, { w: 160, p: L.outCubic(seg(lt, .6, 2.4)), seed: 7, dry: .6 });
  wash(c, P, 300, RANI, .6, ss(seg(lt, 1.6, 3.2)), 16);
  goldLine(c, P, 92, ss(seg(lt, 2.4, 3.6)));
  L.text(c, 'हाथ से बुना', 540, 330, { font: KALAM, size: 84, weight: 700, color: `rgb(${INK})`, alpha: ss(seg(lt, 2.4, 3.2)) });
  L.text(c, 'handwoven', 540, 400, { font: L.SANS, size: 34, weight: 300, spacing: 14, color: '#4a3f36', alpha: ss(seg(lt, 2.8, 3.5)) });
}
function s2(c, lt) {
  bg(c);
  c.save(); c.globalCompositeOperation = 'multiply'; c.filter = 'blur(8px)'; c.fillStyle = 'rgba(205,70,60,.45)'; c.beginPath(); c.arc(800, 400, 110, 0, 7); c.fill(); c.restore();
  mountains(c, 980, 300, .35, 2, lt * .02); mountains(c, 1130, 260, .5, 5, .8 + lt * .03); mountains(c, 1290, 200, .7, 9, 2 + lt * .04);
  const pole = sample(u => [lerp(40, 1040, u), 520 + Math.sin(u * 3) * 8], 80);
  brush(c, pole, { w: 26, p: L.outCubic(seg(lt, .2, 1)), seed: 21, dry: .35, bristles: 14 });
  if (lt > .8) for (const x of [260, 560, 860]) brush(c, [[x, 505], [x + 3, 520], [x, 536]], { w: 14, seed: x, bristles: 5, dry: 0 });
  [[150, RANI, .6], [430, EMER, 1], [710, SAFF, 1.4]].forEach(([x, col, t0], i) => hanging(c, x, 528, 230, 920, lt + 4, col, i * 2.3, ss(seg(lt, t0, t0 + .7))));
  const mist = c.createLinearGradient(0, 1350, 0, 1650); mist.addColorStop(0, 'rgba(239,231,214,0)'); mist.addColorStop(1, 'rgba(239,231,214,.95)'); c.fillStyle = mist; c.fillRect(0, 1350, W, 600);
  L.text(c, 'रंग · धागा · धूप', 540, 1700, { font: KALAM, size: 76, weight: 700, color: `rgb(${INK})`, alpha: ss(seg(lt, 1.8, 2.6)) });
  L.text(c, 'colour · thread · sunlight', 540, 1770, { font: L.SANS, size: 34, weight: 300, spacing: 8, color: '#4a3f36', alpha: ss(seg(lt, 2.2, 2.9)) });
}
function s3(c, lt) {
  bg(c);
  const X0 = 190, X1 = 890, Y0 = 560, Y1 = 1320, NW = 20, NF = 16;
  const r = rng(3), flood = ss(seg(lt, 2.8, 3.4));
  if (flood > 0) {
    c.save(); c.globalCompositeOperation = 'multiply'; c.filter = 'blur(14px)'; c.fillStyle = `rgba(${RANI},${.55 * flood})`; c.beginPath();
    for (let k = 0; k <= 60; k++) { const th = k / 60 * Math.PI * 2, rr = 1 + .05 * nz(th * 5, 2); c.lineTo(540 + Math.cos(th) * 420 * rr * Math.min(1, flood * 1.4), 940 + Math.sin(th) * 470 * rr * Math.min(1, flood * 1.4)); }
    c.fill(); c.restore();
  }
  for (let i = 0; i < NW; i++) { const x = lerp(X0, X1, i / (NW - 1)) + (r() - .5) * 4; brush(c, [[x, Y0], [x + 2, (Y0 + Y1) / 2], [x - 1, Y1]], { w: 7, p: L.outCubic(seg(lt, .1 + i * .02, .9 + i * .02)), seed: 30 + i, bristles: 4, dry: .2, halo: 2 }); }
  for (let j = 0; j < NF; j++) {
    const y = lerp(Y0 + 20, Y1 - 20, j / (NF - 1)), t0 = 1.1 + j * .1, p = seg(lt, t0, t0 + .35); if (p <= 0) continue;
    for (let i = 0; i < NW - 1; i++) {
      if ((i + j) % 2) continue;                          // over one warp, under the next
      const xa = lerp(X0, X1, i / (NW - 1)) + 4, xb = lerp(X0, X1, (i + 1) / (NW - 1)) - 4, lim = lerp(X0, X1, p);
      if (xa > lim) break;
      brush(c, [[xa, y], [Math.min(xb, lim), y + 1]], { w: 9, seed: 60 + j * 20 + i, bristles: 4, dry: 0, halo: 2, alpha: .85 });
    }
    if (p < 1) { const sx = lerp(X0, X1, p); c.fillStyle = `rgba(${INK},.9)`; c.beginPath(); c.ellipse(sx + 30, y, 36, 9, 0, 0, 7); c.fill(); }   // the shuttle
  }
  L.text(c, 'ताना', 300, 470, { font: KALAM, size: 76, weight: 700, color: `rgb(${INK})`, alpha: ss(seg(lt, .4, 1)) });
  L.text(c, 'warp', 300, 515, { font: L.SANS, size: 30, weight: 300, spacing: 8, color: '#4a3f36', alpha: ss(seg(lt, .6, 1.2)) });
  L.text(c, 'बाना', 780, 470, { font: KALAM, size: 76, weight: 700, color: `rgb(${INK})`, alpha: ss(seg(lt, 1.3, 1.9)) });
  L.text(c, 'weft', 780, 515, { font: L.SANS, size: 30, weight: 300, spacing: 8, color: '#4a3f36', alpha: ss(seg(lt, 1.5, 2.1)) });
  L.text(c, 'every thread, by hand', 540, 1520, { font: KALAM, size: 66, color: `rgb(${INK})`, alpha: ss(seg(lt, 2.6, 3.2)) });
}
function seal(c, x, y, s, p) {
  if (p <= 0) return;
  const k = lerp(1.35, 1, L.outCubic(p));
  c.save(); c.translate(x, y); c.rotate(-.06); c.scale(k, k); c.globalAlpha = ss(p * 2);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(190,38,38,.9)'; c.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, side = Math.floor(u * 4), f = u * 4 - side, j = (nz(i * 1.3, 5) * 3); const pts = [[-s, -s], [s, -s], [s, s], [-s, s]], a = pts[side % 4], b = pts[(side + 1) % 4]; c.lineTo(lerp(a[0], b[0], f) + j, lerp(a[1], b[1], f) + j); }
  c.fill(); c.globalCompositeOperation = 'source-over';
  L.text(c, 'तब', 0, s * .38, { font: KALAM, size: s * 1.15, weight: 700, color: '#f7efe0' });
  const r = rng(8); c.fillStyle = 'rgba(239,231,214,.75)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((r() - .5) * 2 * s, (r() - .5) * 2 * s, 1 + r() * 2.5, 0, 7); c.fill(); }
  c.restore();
}
function s4(c, lt) {
  bg(c);
  mountains(c, 1640, 220, .25, 11, 1.5);
  const P = silkPath(540, 620, 880, 250), g = ss(seg(lt, 0, .9));
  brush(c, P, { w: 130, p: L.outCubic(seg(lt, 0, 1)), seed: 7, dry: .6 });
  wash(c, P, 250, RANI, .6, g, 16);
  goldLine(c, P, 76, ss(seg(lt, .5, 1.4)));
  L.text(c, 'ताना बाना', 540, 330 + 30 * (1 - L.outCubic(seg(lt, .3, 1.2))), { font: KALAM, size: 140, weight: 700, color: `rgb(${INK})`, alpha: ss(seg(lt, .3, 1.1)) });
  L.text(c, 'TAANA BAANA', 540, 430, { size: 54, weight: 700, spacing: 16, color: '#2a2420', alpha: ss(seg(lt, 1, 1.6)) });
  L.text(c, 'pure silk sarees · handwoven', 540, 1690, { font: L.SANS, size: 36, weight: 400, spacing: 6, color: '#4a3f36', alpha: ss(seg(lt, 1.4, 2)) });
  L.text(c, 'Woven in light.', 540, 1790, { size: 66, style: 'italic', color: `rgb(${INK})`, alpha: ss(seg(lt, 1.8, 2.5)) });
  seal(c, 880, 1540, 62, seg(lt, 1.6, 1.9));
}
Promise.all(['700 80px Kalam', '400 80px Kalam'].flatMap(f => [document.fonts.load(f, 'ताना बाना तब'), document.fonts.load(f, 'abc')]))
  .then(() => L.run({ DUR: 14, bloom: 0, vignette: 'rgba(90,70,40,.3)', fade: PAPER, shots: [{ a: 0, b: 4.2, f: s1 }, { a: 3.9, b: 8.2, f: s2 }, { a: 8, b: 11.4, f: s3 }, { a: 11.2, b: 14, f: s4 }] }));
})();
