// saree.js · TAANA BAANA silk sarees (an original, made-up brand). 14 s.
// 1 silk flows through the dark · 2 folded sarees on a glass pedestal · 3 macro of the gold zari border · 4 end card.
(() => {
const { W, H, ss, seg, lerp, rng, cam, glow, sparkle } = L;
const studio = c => L.backdrop(c, '#2a0a24', '#060106', 540, 820, '255,170,120', .28, 1050);
const RANI = { body: [214, 35, 110], border: [110, 10, 40], gold: [232, 182, 84] };
const EMER = { body: [16, 128, 92], border: [120, 16, 42], gold: [232, 182, 84] };
const SAFF = { body: [236, 128, 30], border: [128, 14, 30], gold: [232, 182, 84] };
const col = (rgb, k, spec) => `rgb(${rgb.map(v => Math.min(255, Math.round(v * k + spec * 255))).join(',')})`;

// a silk ribbon: strips along its length, shaded by slope and twist so the sheen travels with the wave
function silk(c, o, t) {
  const N = o.n || 150, len = o.len, wid = o.wid, reveal = o.reveal ?? 1, pal = o.pal;
  const wave = u => (o.amp * Math.sin(u * o.k * Math.PI * 2 - t * o.speed) + o.amp * .35 * Math.sin(u * o.k * 3.1 - t * o.speed * 1.3)) * (o.env ? o.env(u) : 1);
  const tw = u => (o.twist || 0) * Math.sin(u * Math.PI * 1.3 - t * o.speed * .45);
  c.save(); c.translate(o.x0, o.y0); c.rotate(o.angle || 0); c.globalAlpha = o.alpha ?? 1;
  const P = [];
  for (let i = 0; i <= N; i++) { const u = i / N, du = .5 / N, s = (wave(u + du) - wave(u - du)) / (2 * du * len); P.push({ x: u * len, y: wave(u), ct: Math.cos(tw(u)), s }); }
  const bands = [[0, .76, 'body'], [.76, .79, 'gold'], [.79, .93, 'border'], [.93, 1, 'gold']];
  for (let i = 0; i < N; i++) {
    if (i / N > reveal) break;
    const a = P[i], b = P[i + 1];
    let sh = .3 + .7 * Math.max(0, Math.sin(Math.atan(a.s) * 2 + .9)); if (a.ct < 0) sh *= .55;
    const spec = Math.pow(sh, 9) * .55;
    for (const [v0, v1, k] of bands) {
      c.beginPath(); c.moveTo(a.x, a.y + v0 * wid * a.ct); c.lineTo(b.x + 1, b.y + v0 * wid * b.ct); c.lineTo(b.x + 1, b.y + v1 * wid * b.ct); c.lineTo(a.x, a.y + v1 * wid * a.ct); c.closePath();
      c.fillStyle = col(pal[k], sh * (k === 'gold' ? 1.05 : 1), k === 'gold' ? spec * 1.4 : spec); c.fill();
    }
    if (i % 9 === 4) for (const v of [.18, .42, .64]) { c.fillStyle = col(pal.gold, sh, spec); c.beginPath(); c.ellipse(a.x, a.y + (v + (i % 18 ? 0 : .1)) * wid * a.ct, 5, 7 * Math.abs(a.ct) + 1, 0, 0, 7); c.fill(); }
    if (i % 5 === 2) { c.fillStyle = col(pal.gold, sh, spec); const yy = a.y + .86 * wid * a.ct; c.beginPath(); c.moveTo(a.x, yy - 10 * a.ct); c.lineTo(a.x + 6, yy); c.lineTo(a.x, yy + 10 * a.ct); c.lineTo(a.x - 6, yy); c.fill(); }
  }
  c.restore();
}
function folded(c, cx, top, w, h, pal, t) {
  const d = 70, x0 = cx - w / 2;
  c.beginPath(); c.moveTo(x0, top); c.lineTo(x0 + d, top - d * .55); c.lineTo(x0 + w + d * .2, top - d * .55); c.lineTo(x0 + w, top); c.closePath();
  c.fillStyle = col(pal.body, .95, .05); c.fill();
  c.save(); c.clip(); c.fillStyle = col(pal.gold, 1, .1);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.ellipse(x0 + 50 + i * (w / 9) + j * 30, top - 14 - j * 20, 5, 3, 0, 0, 7); c.fill(); }
  c.restore();
  const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, col(pal.body, .55, 0)); g.addColorStop(.35, col(pal.body, 1, .15)); g.addColorStop(.5, col(pal.body, 1.05, .3)); g.addColorStop(1, col(pal.body, .6, 0));
  c.fillStyle = g; c.fillRect(x0, top, w, h * .55);
  const gb = c.createLinearGradient(x0, 0, x0 + w, 0); gb.addColorStop(0, col(pal.border, .6, 0)); gb.addColorStop(.45, col(pal.border, 1.1, .1)); gb.addColorStop(1, col(pal.border, .6, 0));
  c.fillStyle = gb; c.fillRect(x0, top + h * .55, w, h * .45);
  const gg = c.createLinearGradient(x0, 0, x0 + w, 0); gg.addColorStop(0, '#8a6420'); gg.addColorStop(.45, '#fff0b0'); gg.addColorStop(.6, '#d9a640'); gg.addColorStop(1, '#7a561a');
  c.fillStyle = gg; c.fillRect(x0, top + h * .55, w, 6); c.fillRect(x0, top + h - 8, w, 6);
  for (let i = 0; i < 14; i++) { const xx = x0 + 20 + i * (w - 40) / 13; c.beginPath(); c.moveTo(xx, top + h * .62); c.lineTo(xx + 8, top + h * .77); c.lineTo(xx, top + h * .9); c.lineTo(xx - 8, top + h * .77); c.fill(); }
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x0, top + k * h * .14); c.lineTo(x0 + w, top + k * h * .14); c.stroke(); }
  c.fillStyle = col(pal.body, .5, 0); c.beginPath(); c.moveTo(x0 + w, top); c.lineTo(x0 + w + d * .2, top - d * .55); c.lineTo(x0 + w + d * .2, top + h - d * .55); c.lineTo(x0 + w, top + h); c.fill();
}
function paisley(c, x, y, s, fill, line) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.moveTo(0, s); c.bezierCurveTo(-s * .95, s * .9, -s * .95, -s * .3, -s * .1, -s * .62); c.bezierCurveTo(s * .3, -s * .8, s * .55, -s * 1.1, s * .2, -s * 1.35);
  c.bezierCurveTo(s * 1, -s * 1.1, s * .95, s * .6, 0, s); c.closePath();
  c.fillStyle = fill; c.fill(); c.strokeStyle = line; c.lineWidth = s * .09; c.stroke();
  c.beginPath(); c.ellipse(-s * .05, s * .15, s * .38, s * .5, .3, 0, 7); c.stroke();
  c.fillStyle = line; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; c.beginPath(); c.arc(-s * .05 + Math.cos(a) * s * .2, s * .15 + Math.sin(a) * s * .28, s * .05, 0, 7); c.fill(); }
  c.restore();
}

function s1(c, lt, D) {
  studio(c);
  const rv = L.outCubic(seg(lt, 0, 1.6));
  silk(c, { x0: -250, y0: 1250, angle: -.32, len: 1700, wid: 260, amp: 70, k: 1.1, speed: 1.8, twist: 1.6, pal: EMER, reveal: rv, alpha: .75 }, lt + 2);
  silk(c, { x0: -220, y0: 380, angle: .42, len: 1750, wid: 380, amp: 100, k: 1.3, speed: 2.2, twist: 1.3, pal: RANI, reveal: rv }, lt);
  L.dust(c, lt, 12, 50, '255,210,140', .55);
  L.text(c, 'handwoven silk', 540, 300, { size: 44, font: L.SANS, weight: 300, spacing: 14, color: '#ffe0c0', alpha: ss(seg(lt, 1.4, 2.2)) * (1 - ss(seg(lt, 3.6, 4.3))) });
}
function s2(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,200,150');
  c.save(); cam(c, 1 + .07 * ss(lt / D), 540, 1250);
  L.caustics(c, 540, 1680, 420, 72, lt, '255,190,130', .3);
  L.pedestal(c, 540, 1370, 340, 250, '255,225,210');
  L.reflect(c, 1620, p => {
    folded(p, 530, 1290, 520, 90, EMER, lt); folded(p, 530, 1200, 520, 90, SAFF, lt); folded(p, 530, 1110, 520, 90, RANI, lt);
    silk(p, { x0: 790, y0: 1060, angle: 1.45, len: 520, wid: 150, amp: 18, k: .9, speed: 2, twist: .3, pal: RANI, env: u => u }, lt);
    p.save(); p.beginPath(); p.rect(250, 1000, 620, 400); p.clip(); L.sweep(p, seg(lt, 1, 2.4), .4, 90); p.restore();
  }, .3);
  c.restore();
  L.dust(c, lt, 13, 40, '255,210,140', .5);
  L.reveal(c, 'pure silk · handwoven', 540, 420, seg(lt, .8, 2.2), { size: 64, style: 'italic', color: '#ffe6c8', glow: 'rgba(255,170,90,.5)' });
}
function s3(c, lt, D) {
  c.fillStyle = '#5e0a24'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,120,150,.08)'; c.lineWidth = 2;
  for (let k = -H; k < W + H; k += 14) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + H, H); c.moveTo(k, H); c.lineTo(k + H, 0); c.stroke(); }
  const off = -lt * 110;
  const bandT = 640, bandB = 1260;
  const g = c.createLinearGradient(0, bandT, 0, bandB); g.addColorStop(0, '#7a5216'); g.addColorStop(.15, '#f3d27a'); g.addColorStop(.5, '#c99434'); g.addColorStop(.85, '#f6dc8e'); g.addColorStop(1, '#6e4a12');
  c.fillStyle = g; c.fillRect(0, bandT, W, bandB - bandT);
  c.strokeStyle = 'rgba(90,55,10,.25)'; c.lineWidth = 2; for (let y = bandT; y < bandB; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let i = -1; i < 6; i++) { const x = ((i * 260 + off) % 1300 + 1300) % 1300 - 130; paisley(c, x, 990, 120, '#7a1030', '#ffe7a0'); }
  c.fillStyle = '#ffe7a0'; for (let i = 0; i < 30; i++) { const x = ((i * 44 + off) % 1320 + 1320) % 1320 - 120; c.beginPath(); c.moveTo(x, 690); c.lineTo(x + 12, 710); c.lineTo(x, 730); c.lineTo(x - 12, 710); c.fill(); c.beginPath(); c.moveTo(x + 22, 1190); c.lineTo(x + 34, 1210); c.lineTo(x + 22, 1230); c.lineTo(x + 10, 1210); c.fill(); }
  c.save(); c.beginPath(); c.rect(0, bandT, W, bandB - bandT); c.clip(); L.sweep(c, seg(lt, .5, 2), .5, 140, '255,250,220'); c.restore();
  const r = rng(Math.floor(lt * 8)); for (let i = 0; i < 6; i++) sparkle(c, r() * W, lerp(bandT, bandB, r()), 18 + r() * 16, .8);
  const p = L.outCubic(seg(lt, .4, 2.6)), tx = lerp(-40, W + 40, p);
  c.strokeStyle = '#ffe9a8'; c.lineWidth = 6; c.beginPath(); for (let x = -40; x <= tx; x += 10) c.lineTo(x, 1450 + Math.sin(x * .02) * 18); c.stroke();
  glow(c, tx, 1450 + Math.sin(tx * .02) * 18, 120, '255,220,140', .6); sparkle(c, tx, 1450 + Math.sin(tx * .02) * 18, 34, 1);
  L.text(c, 'real zari, woven by hand', 540, 1640, { size: 58, style: 'italic', color: '#ffe6b0', alpha: ss(seg(lt, 1.2, 2)), glow: 'rgba(0,0,0,.6)', blur: 14 });
  L.text(c, '21 days on the loom', 540, 1720, { size: 36, font: L.SANS, weight: 400, spacing: 8, color: '#ffc9a8', alpha: ss(seg(lt, 1.8, 2.5)) });
}
function s4(c, lt, D) {
  studio(c);
  silk(c, { x0: -200, y0: 1180, angle: -.08, len: 1500, wid: 340, amp: 60, k: 1, speed: 1.6, twist: 1.1, pal: RANI }, lt + 5);
  silk(c, { x0: -200, y0: 1500, angle: .05, len: 1500, wid: 220, amp: 40, k: 1.2, speed: 1.4, twist: .8, pal: EMER, alpha: .85 }, lt + 9);
  L.reveal(c, 'TAANA BAANA', 540, 430, seg(lt, .3, 1.5), { size: 112, weight: 700, spacing: 10, gold: true, glow: 'rgba(255,170,90,.45)' });
  L.text(c, 'pure silk sarees', 540, 510, { size: 46, font: L.SANS, weight: 300, spacing: 14, color: '#ffe0c0', alpha: ss(seg(lt, 1.1, 1.8)) });
  L.text(c, 'Woven in light.', 540, 760, { size: 70, style: 'italic', color: '#fff', alpha: ss(seg(lt, 1.8, 2.6)), glow: 'rgba(255,150,120,.5)' });
  [[180, 640], [900, 600], [220, 900], [880, 930]].forEach(([x, y], i) => sparkle(c, x, y, 26, Math.sin(lt * 3 + i * 1.5)));
  L.dust(c, lt, 14, 50, '255,210,140', .55);
}
L.run({ DUR: 14, bloom: .36, shots: [{ a: 0, b: 4.5, f: s1 }, { a: 4.2, b: 8.2, f: s2 }, { a: 8, b: 11.2, f: s3 }, { a: 11, b: 14, f: s4 }] });
})();
