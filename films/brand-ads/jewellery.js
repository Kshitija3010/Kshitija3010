// jewellery.js · SONEHRI fine jewellery (an original, made-up brand). 14 s.
// 1 a solitaire ring rises onto a glass pedestal, turning · 2 macro of the diamond, fire · 3 an emerald necklace swings down · 4 end card.
(() => {
const { W, H, ss, seg, lerp, rng, cam, glow, sparkle } = L;
const studio = c => L.backdrop(c, '#1c1306', '#030201', 540, 820, '255,200,120', .3, 1050);
function goldStroke(c, y0, y1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#fff4c2'); g.addColorStop(.2, '#e8bb52'); g.addColorStop(.45, '#8a5d14'); g.addColorStop(.6, '#f7d77a'); g.addColorStop(.8, '#a8741c'); g.addColorStop(1, '#ffe9a0');
  return g;
}
function gem(c, x, y, s, ang, t, tint = [235, 245, 255]) {   // round brilliant seen from the side: crown + pavilion
  c.save(); c.translate(x, y);
  const crownH = s * .35, tableW = s * .55, girdle = s, pav = s * .85;
  const facets = [];
  for (let i = 0; i < 8; i++) { const a0 = i / 8, a1 = (i + 1) / 8; facets.push([a0, a1]); }
  const X = u => Math.sin((u - .5) * Math.PI) * girdle;          // u across the visible half
  const lum = (i, k) => { const v = .5 + .5 * Math.cos(ang * 3 + i * 1.7 + k); return Math.pow(v, 3); };
  const fill = (v, extra = 0) => `rgb(${tint.map(c0 => Math.round(lerp(c0 * .35, 255, v) + extra)).join(',')})`;
  facets.forEach(([a0, a1], i) => {                              // pavilion facets
    c.beginPath(); c.moveTo(X(a0), 0); c.lineTo(X(a1), 0); c.lineTo(0, pav); c.closePath(); c.fillStyle = fill(lum(i, 0)); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.stroke();
  });
  facets.forEach(([a0, a1], i) => {                              // crown facets
    const tx0 = X(a0) * tableW / girdle, tx1 = X(a1) * tableW / girdle;
    c.beginPath(); c.moveTo(X(a0), 0); c.lineTo(X(a1), 0); c.lineTo(tx1, -crownH); c.lineTo(tx0, -crownH); c.closePath(); c.fillStyle = fill(lum(i, 2)); c.fill(); c.stroke();
  });
  c.beginPath(); c.moveTo(-tableW, -crownH); c.lineTo(tableW, -crownH); c.lineTo(tableW * .9, -crownH - s * .03); c.lineTo(-tableW * .9, -crownH - s * .03); c.closePath(); c.fillStyle = fill(.9); c.fill();
  c.restore();
  const r = rng(Math.floor(t * 6) + 3), cols = ['255,90,90', '90,200,255', '255,230,90', '160,255,140', '220,140,255'];
  for (let i = 0; i < 4; i++) sparkle(c, x + (r() - .5) * s * 1.6, y + (r() - .3) * s * .8, s * (.12 + r() * .18), .9, cols[Math.floor(r() * 5)]);
}
function ring(c, cx, cy, R, ang, t) {            // ring turning about the vertical axis, stone on top
  const rx = Math.max(.06, Math.abs(Math.cos(ang))) * R, th = R * .2;
  const pt = th0 => [cx + rx * Math.sin(th0), cy - R * Math.cos(th0)];
  const arc = (a, b) => { c.beginPath(); for (let k = 0; k <= 40; k++) { const [x, y] = pt(lerp(a, b, k / 40)); k ? c.lineTo(x, y) : c.moveTo(x, y); } };
  c.lineCap = 'round';
  arc(Math.PI, Math.PI * 2); c.strokeStyle = goldStroke(c, cy - R, cy + R); c.lineWidth = th; c.globalAlpha = .75; c.stroke(); c.globalAlpha = 1;
  // setting and prongs
  c.fillStyle = goldStroke(c, cy - R - th, cy - R + th); c.beginPath(); c.moveTo(cx - th * .9, cy - R + th * .3); c.lineTo(cx + th * .9, cy - R + th * .3); c.lineTo(cx + th * 1.4, cy - R - th * .9); c.lineTo(cx - th * 1.4, cy - R - th * .9); c.fill();
  gem(c, cx, cy - R - th * 1.6, R * .42, ang, t);
  c.strokeStyle = goldStroke(c, cy - R - th * 3, cy - R); c.lineWidth = th * .22;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * th * 1.3, cy - R - th * .8); c.lineTo(cx + s * R * .4, cy - R - th * 2.2); c.stroke(); }
  arc(0, Math.PI); c.strokeStyle = goldStroke(c, cy - R, cy + R); c.lineWidth = th; c.stroke();
  c.lineWidth = th * .18; c.strokeStyle = 'rgba(255,250,220,.85)'; arc(Math.PI * .15, Math.PI * .55); c.stroke();
}
function necklace(c, x1, x2, yTop, sag, swing, t) {
  const pts = [], N = 60;
  for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(x1, x2, u) + Math.sin(u * Math.PI) * swing, y = yTop + Math.sin(u * Math.PI) * sag; pts.push([x, y]); }
  pts.forEach(([x, y], i) => {
    if (i === N) return; const [nx, ny] = pts[i + 1], a = Math.atan2(ny - y, nx - x);
    c.save(); c.translate(x, y); c.rotate(a + (i % 2 ? Math.PI / 2 : 0)); c.strokeStyle = goldStroke(c, -8, 8); c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, i % 2 ? 6 : 10, i % 2 ? 10 : 6, 0, 0, 7); c.stroke(); c.restore();
  });
  const [px, py] = pts[N / 2];
  c.save(); c.translate(px, py + 30); c.rotate(swing * -.002);
  c.fillStyle = goldStroke(c, -10, 230); c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(95, 40, 85, 190, 0, 230); c.bezierCurveTo(-85, 190, -95, 40, 0, -20); c.fill();
  const eg = c.createRadialGradient(-20, 60, 10, 0, 110, 110); eg.addColorStop(0, '#9effd0'); eg.addColorStop(.4, '#13a06b'); eg.addColorStop(1, '#03402a');
  c.fillStyle = eg; c.beginPath(); c.moveTo(0, 5); c.bezierCurveTo(72, 55, 64, 175, 0, 205); c.bezierCurveTo(-64, 175, -72, 55, 0, 5); c.fill();
  c.strokeStyle = 'rgba(200,255,230,.4)'; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 5 + k * 10); c.lineTo((k - 2) * 26, 120); c.lineTo(0, 205); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-22, 70, 10, 26, .3, 0, 7); c.fill();
  for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + (k / 11 - .5) * Math.PI * 1.7; const rx = 92, ry = 125; c.fillStyle = '#f4f8ff'; c.beginPath(); c.arc(Math.cos(a) * rx * .95, 105 + Math.sin(a) * ry, 9, 0, 7); c.fill(); }
  c.restore();
  sparkle(c, px - 20, py + 100, 30, .5 + .5 * Math.sin(t * 4));
}

function s1(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,220,160');
  c.save(); cam(c, 1 + .06 * ss(lt / D), 540, 1150);
  L.caustics(c, 540, 1680, 380, 66, lt, '255,210,140', .3);
  L.pedestal(c, 540, 1360, 260, 260, '255,235,200');
  const rise = L.outCubic(seg(lt, .2, 1.8));
  L.reflect(c, 1620, p => ring(p, 540, lerp(1500, 1120, rise), 220, lt * 1.1 + .4, lt), .3);
  c.restore();
  L.dust(c, lt, 21, 60, '255,215,140', .6);
  L.text(c, '22K · hallmarked', 540, 330, { size: 42, font: L.SANS, weight: 300, spacing: 14, color: '#ffe6b0', alpha: ss(seg(lt, 1.4, 2.2)) * (1 - ss(seg(lt, 3.1, 3.7))) });
}
function s2(c, lt, D) {
  c.fillStyle = '#0a0703'; c.fillRect(0, 0, W, H);
  L.dust(c, lt, 22, 30, '255,200,120', .3);
  const r = rng(5); c.save(); c.filter = 'blur(10px)'; c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) { c.fillStyle = `rgba(255,${180 + r() * 50},${80 + r() * 60},.18)`; c.beginPath(); c.arc(r() * W, r() * H, 60 + r() * 90, 0, 7); c.fill(); }
  c.restore();
  c.save(); cam(c, 1 + .1 * ss(lt / D), 540, 900);
  gem(c, 540, 900, 380, lt * .9, lt);
  c.restore();
  glow(c, 540, 820, 500, '255,255,255', .12 + .08 * Math.sin(lt * 5));
  L.reveal(c, 'brilliant, by nature', 540, 1560, seg(lt, .8, 2.2), { size: 70, style: 'italic', color: '#fff3d6', glow: 'rgba(255,200,120,.5)' });
}
function s3(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,220,160');
  c.save(); cam(c, 1.05 - .05 * ss(lt / D), 540, 1100);
  L.caustics(c, 540, 1680, 400, 66, lt, '170,255,210', .25);
  L.cube(c, 540, 1380, 520, 240, '255,240,210');
  const drop = L.outCubic(seg(lt, 0, 1.2)), sw = 140 * Math.exp(-lt * 1.3) * Math.sin(lt * 5.5);
  L.reflect(c, 1620, p => necklace(p, 150, 930, lerp(-600, 420, drop), 560, sw, lt), .3);
  c.restore();
  L.dust(c, lt, 23, 50, '255,215,140', .55);
  L.text(c, 'emerald · diamond halo', 540, 1720, { size: 40, font: L.SANS, weight: 400, spacing: 6, color: '#d9ffe9', alpha: ss(seg(lt, 1.4, 2.2)) });
}
function s4(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,220,160');
  c.save(); cam(c, 1.03 - .03 * ss(lt / D), 540, 1200);
  L.caustics(c, 540, 1680, 420, 70, lt, '255,210,140', .32);
  L.pedestal(c, 540, 1380, 280, 240, '255,235,200');
  L.reflect(c, 1620, p => { ring(p, 540, 1150, 200, lt * .9 + 2, lt); p.save(); p.beginPath(); p.rect(250, 800, 580, 600); p.clip(); L.sweep(p, seg(lt, 1.4, 2.6), .35, 80); p.restore(); }, .3);
  c.restore();
  L.reveal(c, 'SONEHRI', 540, 420, seg(lt, .3, 1.4), { size: 150, weight: 700, spacing: 22, gold: true, glow: 'rgba(255,190,90,.45)' });
  L.text(c, 'fine jewellery', 540, 500, { size: 46, font: L.SANS, weight: 300, spacing: 16, color: '#ffe6b0', alpha: ss(seg(lt, 1.1, 1.8)) });
  L.text(c, 'Gold that remembers.', 540, 1770, { size: 64, style: 'italic', color: '#fff', alpha: ss(seg(lt, 1.8, 2.6)) });
  [[200, 650], [880, 700], [160, 1050], [920, 1000]].forEach(([x, y], i) => sparkle(c, x, y, 26, Math.sin(lt * 3 + i * 1.5)));
  L.dust(c, lt, 24, 60, '255,215,140', .6);
}
L.run({ DUR: 14, bloom: .42, shots: [{ a: 0, b: 3.8, f: s1 }, { a: 3.5, b: 7.2, f: s2 }, { a: 7, b: 10.8, f: s3 }, { a: 10.5, b: 14, f: s4 }] });
})();
