// lipstick.js · ROOH matte lipstick (an original, made-up brand). 14 s.
// 1 closed tube on a glass cube, petals · 2 cap lifts, bullet twists up · 3 swatch stroke on glass · 4 three shades, end card.
(() => {
const { W, H, ss, seg, lerp, rng, rr, cam, glow, sparkle } = L;
const studio = c => L.backdrop(c, '#3a0d1d', '#0a0206', 540, 800, '255,140,170', .3, 1050);
const SHADES = { chai: ['#5c1522', '#b8485a', '#8f2a3a'], brown: ['#3d160f', '#94503f', '#6e3326'], rani: ['#6a0d36', '#e0407e', '#a81d58'] };

function goldGrad(c, x, w, ph = 0) {
  const g = c.createLinearGradient(x, 0, x + w, 0), s = [['#5e4416', 0], ['#f7e3a0', .18], ['#c9a24a', .38], ['#6b4c18', .6], ['#e8cf87', .82], ['#7a5a1e', 1]];
  s.forEach(([col, p]) => g.addColorStop(clamp01(p), col)); return g;
}
const clamp01 = x => Math.min(1, Math.max(0, x));
function tube(c, cx, base, open, capOff, t, shade = 'chai', s = 1) {
  const [d, l, m] = SHADES[shade];
  c.save(); c.translate(cx, base); c.scale(s, s);
  const bw = 150, bh = 300, sw = 118, sh = 70 + open * 120, uw = 100, uh = 170;
  // bullet
  const by = -bh - sh;
  c.beginPath(); c.moveTo(-uw / 2, by); c.lineTo(-uw / 2, by - uh * .62); c.quadraticCurveTo(-uw / 2, by - uh, uw / 2 - 6, by - uh * .98); c.lineTo(uw / 2, by - uh * .9); c.lineTo(uw / 2, by); c.closePath();
  const g = c.createLinearGradient(-uw / 2, 0, uw / 2, 0); g.addColorStop(0, d); g.addColorStop(.3, l); g.addColorStop(.6, m); g.addColorStop(1, d);
  c.fillStyle = g; c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(-uw * .25, by - uh * .75, uw * .08, uh * .7);
  c.strokeStyle = 'rgba(255,220,230,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-uw / 2, by - uh * .62); c.quadraticCurveTo(-uw / 2, by - uh, uw / 2 - 6, by - uh * .98); c.stroke();
  // inner sleeve
  c.fillStyle = goldGrad(c, -sw / 2, sw); c.fillRect(-sw / 2, -bh - sh, sw, sh);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-sw / 2, -bh - 10, sw, 10);
  // base
  c.fillStyle = goldGrad(c, -bw / 2, bw); rr(c, -bw / 2, -bh, bw, bh, 10); c.fill();
  const band = ((t * .35) % 1.6) - .3;
  c.save(); rr(c, -bw / 2, -bh, bw, bh, 10); c.clip(); c.globalCompositeOperation = 'lighter';
  const sg = c.createLinearGradient(-bw / 2 + band * bw - 30, 0, -bw / 2 + band * bw + 30, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,250,230,.6)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.fillRect(-bw, -bh, bw * 2, bh); c.restore();
  c.save(); c.translate(0, -bh * .5); c.rotate(-Math.PI / 2); L.text(c, 'ROOH', 0, 12, { size: 40, weight: 700, color: 'rgba(80,55,15,.75)', spacing: 10 }); c.restore();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-bw / 2, -bh + 30, bw, 4);
  // cap: glossy black with a gold band
  if (capOff < 1) {
    c.save(); c.globalAlpha = 1 - ss(seg(capOff, .6, 1)); c.translate(0, -capOff * 800);
    const cw = 156, ch = 320, cy = -bh - ch + 30;
    const cg = c.createLinearGradient(-cw / 2, 0, cw / 2, 0); cg.addColorStop(0, '#0a0a0c'); cg.addColorStop(.25, '#5a5560'); cg.addColorStop(.4, '#141216'); cg.addColorStop(.85, '#2c2830'); cg.addColorStop(1, '#09080a');
    c.fillStyle = cg; rr(c, -cw / 2, cy, cw, ch, 12); c.fill();
    c.fillStyle = goldGrad(c, -cw / 2, cw); c.fillRect(-cw / 2, cy + ch - 34, cw, 34);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-cw * .28, cy + 14, cw * .06, ch - 60);
    c.restore();
  }
  c.restore();
}
function petals(c, t, seed, n) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W, sp = 60 + r() * 80, y = ((r() * H + t * sp) % (H + 200)) - 100, s = 18 + r() * 22, ph = r() * 6;
    c.save(); c.translate(x + Math.sin(t + ph) * 60, y); c.rotate(t * .8 + ph); c.scale(1, .5 + .5 * Math.abs(Math.sin(t * 1.5 + ph)));
    const g = c.createRadialGradient(-s * .3, -s * .3, 2, 0, 0, s); g.addColorStop(0, '#ffb3c6'); g.addColorStop(1, '#c2365d');
    c.fillStyle = g; c.globalAlpha = .85; c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s, -s * .6, s * .8, s * .7, 0, s); c.bezierCurveTo(-s * .8, s * .7, -s, -s * .6, 0, -s); c.fill(); c.restore();
  }
}
function s1(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,190,210');
  c.save(); cam(c, 1 + .06 * ss(lt / D), 540, 1200);
  L.caustics(c, 540, 1680, 360, 64, lt, '255,170,200', .3);
  L.cube(c, 520, 1340, 440, 280, '255,215,230');
  const rise = L.outCubic(seg(lt, .2, 1.6));
  L.reflect(c, 1620, p => { tube(p, 540, lerp(1410, 1310, rise), 0, 0, lt); p.save(); p.beginPath(); p.rect(380, 600, 320, 760); p.clip(); L.sweep(p, seg(lt, 1.4, 2.6), .45, 80); p.restore(); }, .28);
  c.restore();
  petals(c, lt, 7, 9);
  L.dust(c, lt, 8, 30, '255,190,210', .45);
  L.text(c, 'velvet matte', 540, 330, { size: 42, font: L.SANS, weight: 300, spacing: 12, color: '#ffd6e0', alpha: ss(seg(lt, 1.2, 2)) * (1 - ss(seg(lt, 3, 3.6))) });
}
function s2(c, lt, D) {
  studio(c); L.floor(c, 1620, '255,190,210');
  const z = 1 + .28 * ss(seg(lt, 1, 3.6));
  c.save(); cam(c, z, 540, 1000);
  L.caustics(c, 540, 1680, 360, 64, lt, '255,170,200', .3);
  L.cube(c, 520, 1340, 440, 280, '255,215,230');
  const capOff = L.outCubic(seg(lt, .3, 1.4)), open = ss(seg(lt, 1.2, 2.7));
  L.reflect(c, 1620, p => tube(p, 540, 1310, open, capOff, lt + 3.3), .28);
  c.restore();
  if (lt > 2.6) { sparkle(c, 540 - 30 * z, 1000 - (1340 - 1000 - 300 - 190 - 170 * .95) * z, 40, Math.sin((lt - 2.6) * 3)); }
  L.dust(c, lt, 9, 30, '255,190,210', .45);
  L.reveal(c, 'Chai Rose · 07', 540, 360, seg(lt, 2.4, 3.6), { size: 72, style: 'italic', color: '#ffe2ea', glow: 'rgba(255,120,160,.6)' });
}
function s3(c, lt, D) {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f6d9df'); g.addColorStop(1, '#c99aa6');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-100, 300 + k * 330); c.lineTo(W + 100, 200 + k * 330); c.stroke(); }
  const p = L.outCubic(seg(lt, .3, 2.2));
  const path = u => [lerp(120, 960, u), 1050 + Math.sin(u * Math.PI * 1.2 + .3) * -120];
  const N = 80, top = [], bot = [];
  for (let k = 0; k <= N; k++) { const u = k / N, [x, y] = path(u), wd = 95 * Math.sin(Math.PI * Math.min(1, u * 1.3 + .1)) + 30; top.push([x, y - wd]); bot.push([x + 18, y + wd]); }
  c.save(); c.beginPath(); c.rect(0, 0, lerp(80, 1000, p), H); c.clip();
  c.save(); c.translate(10, 22); c.filter = 'blur(14px)'; c.beginPath(); top.forEach(q => c.lineTo(q[0], q[1])); bot.slice().reverse().forEach(q => c.lineTo(q[0], q[1])); c.fillStyle = 'rgba(80,10,30,.35)'; c.fill(); c.restore();
  c.beginPath(); top.forEach(q => c.lineTo(q[0], q[1])); bot.slice().reverse().forEach(q => c.lineTo(q[0], q[1])); c.closePath();
  const sg = c.createLinearGradient(0, 900, 0, 1200); sg.addColorStop(0, '#d2586b'); sg.addColorStop(.35, '#a8364a'); sg.addColorStop(1, '#5c1522'); c.fillStyle = sg; c.fill();
  c.clip(); const r = rng(4); c.strokeStyle = 'rgba(255,200,210,.18)'; c.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const o = (r() - .5) * 200; c.beginPath(); for (let k = 0; k <= 30; k++) { const [x, y] = path(k / 30); c.lineTo(x, y + o); } c.stroke(); }
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,220,230,.35)'; c.lineWidth = 18; c.filter = 'blur(6px)'; c.beginPath(); for (let k = 0; k <= 30; k++) { const [x, y] = path(k / 30); c.lineTo(x, y - 40); } c.stroke();
  c.restore();
  if (p < 1) { const [x, y] = path(Math.min(1, (lerp(80, 1000, p) - 120) / 840)); c.save(); c.translate(x + 40, y - 20); c.rotate(-.7); tube(c, 0, 380, 1, 1, lt, 'chai', .9); c.restore(); }
  L.text(c, 'one swipe. full colour.', 540, 1560, { size: 54, font: L.SANS, weight: 300, spacing: 4, color: '#5c1522', alpha: ss(seg(lt, 1.8, 2.6)) });
  L.text(c, '12-hour wear · no smudge', 540, 1640, { size: 38, font: L.SANS, weight: 500, spacing: 6, color: '#8f2a3a', alpha: ss(seg(lt, 2.2, 3)) });
}
function s4(c, lt, D) {
  studio(c); L.floor(c, 1600, '255,190,210');
  c.save(); cam(c, 1.05 - .05 * ss(lt / D), 540, 1200);
  L.caustics(c, 540, 1660, 440, 70, lt, '255,170,200', .3);
  L.cube(c, 280, 1360, 240, 240); L.cube(c, 540, 1260, 240, 340); L.cube(c, 800, 1400, 240, 200);
  L.reflect(c, 1600, p => {
    tube(p, 290, 1345, 1, 1, lt, 'brown', .8); tube(p, 550, 1245, 1, 1, lt + 1, 'chai', .9); tube(p, 810, 1385, 1, 1, lt + 2, 'rani', .8);
    p.save(); p.beginPath(); p.rect(0, 600, W, 820); p.clip(); L.sweep(p, seg(lt, 1.6, 2.8), .35, 90); p.restore();
  }, .28);
  c.restore();
  L.reveal(c, 'ROOH', 540, 420, seg(lt, .3, 1.4), { size: 170, weight: 700, spacing: 30, gold: true, glow: 'rgba(255,170,190,.4)' });
  L.text(c, 'matte lipstick', 540, 500, { size: 44, font: L.SANS, weight: 300, spacing: 14, color: '#ffd6e0', alpha: ss(seg(lt, 1.1, 1.8)) });
  L.text(c, 'Colour that speaks.', 540, 1760, { size: 62, style: 'italic', color: '#fff', alpha: ss(seg(lt, 1.8, 2.6)) });
  [['Mehendi Brown', 280, 1660], ['Chai Rose', 540, 1660], ['Rani Pink', 800, 1660]].forEach(([s, x, y]) => L.text(c, s, x, y, { size: 32, font: L.SANS, weight: 600, spacing: 3, color: '#fff0f4', glow: 'rgba(0,0,0,.8)', blur: 12, alpha: ss(seg(lt, 2.2, 2.9)) }));
  petals(c, lt + 5, 11, 6);
}
L.run({ DUR: 14, bloom: .38, shots: [{ a: 0, b: 3.6, f: s1 }, { a: 3.3, b: 7.2, f: s2 }, { a: 7, b: 10.6, f: s3 }, { a: 10.4, b: 14, f: s4 }] });
})();
