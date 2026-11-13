// biscuit.js · MILKY MOON glucose biscuits (an original, made-up brand). 14 s.
// 1 pack rises on a glass pedestal · 2 biscuits tumble into a stack · 3 dip in milk, splash · 4 end card.
(() => {
const { W, H, ss, seg, lerp, rng, rr, cam, glow, sparkle } = L;
const BLUE = '#1f5fbf';
const sky = c => L.backdrop(c, '#0d2147', '#03070f', 540, 760, '255,200,120', .32, 1000);

function scallop(c, w, h, n = 9, a = 6) {                // rectangle with a scalloped edge
  c.beginPath(); const x0 = -w / 2, y0 = -h / 2;
  const edge = (x1, y1, x2, y2, nx, ny, k) => { for (let i = 0; i < k; i++) { const p0 = i / k, p1 = (i + 1) / k, pm = (p0 + p1) / 2; c.quadraticCurveTo(lerp(x1, x2, pm) + nx * a * 2, lerp(y1, y2, pm) + ny * a * 2, lerp(x1, x2, p1), lerp(y1, y2, p1)); } };
  c.moveTo(x0, y0);
  edge(x0, y0, x0 + w, y0, 0, -1, n); edge(x0 + w, y0, x0 + w, y0 + h, 1, 0, Math.round(n * h / w)); edge(x0 + w, y0 + h, x0, y0 + h, 0, 1, n); edge(x0, y0 + h, x0, y0, -1, 0, Math.round(n * h / w));
  c.closePath();
}
function biscuit(c, x, y, w, rot = 0, tilt = 1, dip = 0) {   // dip: 0..1 how much of the lower part is milk-coated
  const h = w * .66;
  c.save(); c.translate(x, y); c.rotate(rot);
  c.save(); c.translate(0, w * .06); c.scale(1, tilt); scallop(c, w, h); c.fillStyle = '#8a4a14'; c.fill(); c.restore();
  c.save(); c.scale(1, tilt); scallop(c, w, h);
  const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#f8c66e'); g.addColorStop(.5, '#dc9334'); g.addColorStop(1, '#a8601c');
  c.fillStyle = g; c.fill(); c.save(); c.clip();
  c.strokeStyle = 'rgba(255,230,170,.45)'; c.lineWidth = w * .02; rr(c, -w * .42, -h * .4, w * .84, h * .8, w * .05); c.stroke();
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    if (j > 0 && j < 3 && i > 0 && i < 5) continue;
    const hx = -w * .34 + i * w * .136, hy = -h * .3 + j * h * .2;
    c.fillStyle = 'rgba(110,55,12,.7)'; c.beginPath(); c.arc(hx, hy, w * .016, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,225,160,.6)'; c.beginPath(); c.arc(hx + w * .006, hy + w * .008, w * .009, 0, 7); c.fill();
  }
  c.textAlign = 'center'; c.font = `700 ${w * .1}px ${L.SERIF}`; c.letterSpacing = (w * .012) + 'px';
  c.fillStyle = 'rgba(120,60,10,.65)'; c.fillText('MILKY MOON', 2, h * .04 + 2);
  c.fillStyle = 'rgba(255,225,160,.55)'; c.fillText('MILKY MOON', -1, h * .04 - 1);
  c.fillStyle = '#d68d32'; c.fillText('MILKY MOON', 0, h * .04);
  c.fillStyle = 'rgba(255,245,215,.35)'; c.beginPath(); c.ellipse(-w * .25, -h * .3, w * .2, h * .06, -.2, 0, 7); c.fill();
  if (dip > 0) {                                         // milk coating with a drippy edge
    const my = h / 2 - dip * h;
    c.beginPath(); c.moveTo(-w, h); for (let k = 0; k <= 16; k++) { const xx = -w / 2 + k * w / 16; c.lineTo(xx, my + Math.sin(k * 1.9) * h * .05 + (k % 3 === 0 ? h * .07 : 0)); } c.lineTo(w, h); c.closePath();
    c.fillStyle = 'rgba(250,250,245,.93)'; c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-w * .45, my + h * .04, w * .5, h * .03);
  }
  c.restore(); c.restore();
  c.restore();
}
function moon(c, x, y, r) {
  c.save(); c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * .45, y - r * .25, r * .85, 0, 7); c.fill('evenodd'); c.restore();
  c.fillStyle = '#5a3a10'; c.beginPath(); c.arc(x - r * .55, y + r * .05, r * .08, 0, 7); c.fill();
  c.strokeStyle = '#5a3a10'; c.lineWidth = r * .06; c.beginPath(); c.arc(x - r * .45, y + r * .3, r * .15, .2, 2.2); c.stroke();
}
function pack(c, cx, bottom, w, h, t, sweepP = -1) {
  const x0 = cx - w / 2, y0 = bottom - h;
  const shape = () => {
    c.beginPath(); c.moveTo(x0 + 10, y0 + 30);
    for (let k = 0; k <= 12; k++) c.lineTo(x0 + 10 + k * (w - 20) / 12, y0 + (k % 2 ? 0 : 14));
    c.lineTo(x0 + w - 10, y0 + 30); c.quadraticCurveTo(x0 + w + 6, h / 2 + y0, x0 + w - 10, bottom - 30);
    for (let k = 0; k <= 12; k++) c.lineTo(x0 + w - 10 - k * (w - 20) / 12, bottom - (k % 2 ? 0 : 14));
    c.lineTo(x0 + 10, bottom - 30); c.quadraticCurveTo(x0 - 6, h / 2 + y0, x0 + 10, y0 + 30); c.closePath();
  };
  c.save(); shape(); c.fillStyle = '#fff3d6'; c.fill(); c.clip();
  c.fillStyle = BLUE; c.beginPath(); c.moveTo(x0 - 10, y0 + h * .62);
  for (let k = 0; k <= 20; k++) c.lineTo(x0 + k * w / 20, y0 + h * .62 + Math.sin(k * .7 + t * 1.5) * 12); c.lineTo(x0 + w + 10, bottom + 10); c.lineTo(x0 - 10, bottom + 10); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x0 - 10, y0 + h * .6);
  for (let k = 0; k <= 20; k++) c.lineTo(x0 + k * w / 20, y0 + h * .6 + Math.sin(k * .7 + t * 1.5) * 12 - (k % 4 === 1 ? 22 : 0)); c.lineTo(x0 + w + 10, y0 + h * .64); c.lineTo(x0 - 10, y0 + h * .64); c.fill();
  c.fillStyle = BLUE; c.fillRect(x0, y0 + 30, w, 46);
  L.text(c, 'NEW · EXTRA MILK', cx, y0 + 62, { size: w * .065, font: L.SANS, weight: 700, color: '#fff3d6', spacing: 4 });
  moon(c, cx + w * .2, y0 + h * .2, w * .14);
  L.text(c, 'MILKY', cx, y0 + h * .32, { size: w * .2, weight: 700, color: BLUE, spacing: 3 });
  L.text(c, 'MOON', cx, y0 + h * .43, { size: w * .2, weight: 700, color: BLUE, spacing: 6 });
  L.text(c, 'glucose biscuits', cx, y0 + h * .5, { size: w * .075, style: 'italic', color: '#c96a1c' });
  biscuit(c, cx, y0 + h * .8, w * .62, -.12, .9);
  L.text(c, '100 g', x0 + w * .82, bottom - 50, { size: w * .06, font: L.SANS, weight: 600, color: '#fff' });
  const s = c.createLinearGradient(x0, 0, x0 + w, 0);
  s.addColorStop(0, 'rgba(0,20,60,.35)'); s.addColorStop(.18, 'rgba(255,255,255,.35)'); s.addColorStop(.3, 'rgba(255,255,255,0)'); s.addColorStop(.75, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,20,60,.4)');
  c.fillStyle = s; c.fillRect(x0 - 20, y0, w + 40, h);
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2;
  for (let k = 0; k < 12; k++) { const xx = x0 + 20 + k * (w - 40) / 11; c.beginPath(); c.moveTo(xx, y0 + 10); c.lineTo(xx + 4, y0 + 30); c.moveTo(xx, bottom - 10); c.lineTo(xx + 4, bottom - 30); c.stroke(); }
  if (sweepP >= 0) L.sweep(c, sweepP, .55, 120);
  c.restore();
}
function crumbs(c, x, y, d, seed) {
  if (d < 0 || d > 1.2) return; const r = rng(seed);
  for (let i = 0; i < 16; i++) { const a = -Math.PI * r(), sp = 200 + r() * 400, s = 4 + r() * 9; c.fillStyle = r() < .5 ? '#e09a3c' : '#f6c46a'; c.globalAlpha = 1 - d / 1.2; c.save(); c.translate(x + Math.cos(a) * sp * d, y + Math.sin(a) * sp * d + 900 * d * d); c.rotate(d * 8 + i); c.fillRect(-s / 2, -s / 2, s, s * .7); c.restore(); }
  c.globalAlpha = 1;
}

function s1(c, lt, D) {
  sky(c); L.floor(c, 1600, '255,220,170');
  c.save(); cam(c, 1 + .05 * ss(lt / D), 540, 1200);
  L.caustics(c, 540, 1650, 380, 70, lt, '255,215,150', .3);
  L.pedestal(c, 540, 1290, 250, 330, '210,230,255');
  const rise = L.outCubic(seg(lt, .2, 1.6));
  L.reflect(c, 1600, p => pack(p, 540, lerp(1400, 1290, rise) + Math.sin(lt * 2) * 6, 340, 640, lt, seg(lt, 1.4, 2.6)), .25);
  c.restore();
  L.dust(c, lt, 3, 40, '255,220,160', .5);
  L.text(c, 'fresh from the oven', 540, 330, { size: 40, font: L.SANS, weight: 300, spacing: 10, alpha: ss(seg(lt, 1.2, 2)) * (1 - ss(seg(lt, 3.2, 3.8))), color: '#ffe6bd' });
}
const LAND = [.4, .9, 1.4, 1.9, 2.4];
function s2(c, lt, D) {
  sky(c); L.floor(c, 1600, '255,220,170');
  c.save(); cam(c, 1.08 - .08 * ss(lt / D), 540, 1300);
  L.caustics(c, 540, 1650, 380, 70, lt, '255,215,150', .3);
  L.pedestal(c, 540, 1400, 300, 220);
  L.reflect(c, 1600, p => {
    LAND.forEach((tl, i) => {
      const yT = 1380 - i * 34, f = seg(lt, tl - .7, tl), e = f * f;
      if (f <= 0) return;
      const y = lerp(-300, yT, e), rot = (1 - e) * (2.4 + i) * (i % 2 ? 1 : -1) + (i - 2) * .05, tilt = lerp(1, .42, ss(seg(lt, tl - .25, tl)));
      biscuit(p, 540 + (i - 2) * 10 + (1 - e) * (i - 2) * 140, y, 400, rot, tilt);
    });
    LAND.forEach((tl, i) => crumbs(p, 540, 1380 - i * 34, lt - tl, 50 + i));
  }, .25);
  c.restore();
  LAND.forEach((tl, i) => { const d = lt - tl; if (d > 0 && d < .4) glow(c, 540, 1380 - i * 34, 300, '255,210,140', .25 * (1 - d / .4)); });
  L.dust(c, lt, 4, 30, '255,220,160', .4);
  L.reveal(c, 'baked golden', 540, 380, seg(lt, 1, 2.2), { size: 74, weight: 700, color: '#fff3d6', glow: 'rgba(255,190,90,.6)' });
}
function glassOfMilk(c, cx, top, w, h, level, t, wob) {
  const yb = top + h, wy = yb - h * level;
  const glass = () => { c.beginPath(); c.moveTo(cx - w / 2, top); c.lineTo(cx - w * .43, yb); c.lineTo(cx + w * .43, yb); c.lineTo(cx + w / 2, top); c.closePath(); };
  c.save(); glass();
  c.fillStyle = 'rgba(200,225,255,.08)'; c.fill(); c.save(); c.clip();
  c.beginPath(); c.moveTo(cx - w, yb + 20); for (let k = 0; k <= 30; k++) { const xx = cx - w / 2 + k * w / 30; c.lineTo(xx, wy + Math.sin(k * .8 + t * 6) * wob); } c.lineTo(cx + w, yb + 20); c.closePath();
  const g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, '#d8dde6'); g.addColorStop(.35, '#ffffff'); g.addColorStop(1, '#c4cbd8');
  c.fillStyle = g; c.fill(); c.restore();
  glass(); c.strokeStyle = 'rgba(230,240,255,.8)'; c.lineWidth = 3; c.stroke();
  c.beginPath(); c.ellipse(cx, top, w / 2, w * .07, 0, 0, 7); c.stroke();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(cx - w * .4, top + 30, w * .05, h - 60);
  c.restore();
}
function s3(c, lt, D) {
  sky(c); L.floor(c, 1640, '255,255,255');
  c.save(); cam(c, 1 + .06 * ss(lt / D), 540, 1200);
  const dip = ss(seg(lt, .5, 1.3)) - ss(seg(lt, 2.1, 2.9)), coated = ss(seg(lt, 1.1, 1.4));
  const splash = lt - 1.3;
  L.reflect(c, 1640, p => {
    glassOfMilk(p, 540, 900, 460, 740, .72, lt, splash > 0 && splash < 1.2 ? 14 * (1 - splash / 1.2) : 3);
    p.save(); p.beginPath(); p.rect(0, 0, W, 900 + 740 * .28 + 6); p.clip();
    biscuit(p, 560, lerp(560, 1230, dip), 360, -1.2, 1, coated * .45);
    p.restore();
    p.save(); p.beginPath(); p.moveTo(540 - 230, 900); p.lineTo(540 - 198, 1640); p.lineTo(540 + 198, 1640); p.lineTo(540 + 230, 900); p.closePath(); p.clip(); p.globalAlpha = .25;
    biscuit(p, 560, lerp(560, 1230, dip), 360, -1.2, 1, coated * .45); p.restore();
  }, .25);
  if (splash > 0 && splash < 1) {                      // milk crown splash
    const r = rng(9), wy = 900 + 740 * .28;
    for (let i = 0; i < 26; i++) { const a = -Math.PI * (.1 + r() * .8), sp = 260 + r() * 420, s = 8 + r() * 16, x = 560 + Math.cos(a) * sp * splash, y = wy + Math.sin(a) * sp * splash + 1100 * splash * splash; c.fillStyle = `rgba(255,255,255,${1 - splash})`; c.beginPath(); c.ellipse(x, y, s * .7, s, a, 0, 7); c.fill(); }
    c.fillStyle = `rgba(255,255,255,${.9 * (1 - splash)})`; c.beginPath(); c.ellipse(560, wy - 10, 200 * Math.sqrt(splash) + 40, 50 * (1 - splash), 0, 0, 7); c.fill();
  }
  c.restore();
  [['Dip.', .8, 300], ['Crunch.', 1.8, 420], ['Smile.', 2.6, 540]].forEach(([s, t0, y]) => L.reveal(c, s, 540, y, seg(lt, t0, t0 + .6), { size: 96, weight: 700, color: '#fff', glow: 'rgba(120,180,255,.7)' }));
}
function s4(c, lt, D) {
  sky(c); L.floor(c, 1560, '255,220,170');
  c.save(); cam(c, 1.04 - .04 * ss(lt / D), 540, 1200);
  L.caustics(c, 540, 1610, 420, 75, lt, '255,215,150', .32);
  L.pedestal(c, 540, 1300, 300, 260);
  L.reflect(c, 1560, p => {
    pack(p, 540, 1300, 300, 560, lt, seg(lt, 1.5, 2.6));
    biscuit(p, 330, 1260, 260, -.3, .5); biscuit(p, 760, 1270, 260, .25, .5);
  }, .25);
  c.restore();
  L.reveal(c, 'MILKY MOON', 540, 380, seg(lt, .3, 1.5), { size: 120, weight: 700, color: '#fff3d6', spacing: 8, glow: 'rgba(255,190,90,.55)' });
  L.text(c, 'glucose biscuits', 540, 460, { size: 46, style: 'italic', color: '#ffd59a', alpha: ss(seg(lt, 1.2, 1.9)) });
  L.text(c, 'Dip. Crunch. Smile.', 540, 1760, { size: 56, font: L.SANS, weight: 300, spacing: 6, color: '#fff', alpha: ss(seg(lt, 1.8, 2.6)) });
  [[200, 600], [880, 700], [150, 1150], [930, 1050]].forEach(([x, y], i) => sparkle(c, x, y, 26, Math.sin(lt * 3 + i * 1.5)));
  L.dust(c, lt, 5, 40, '255,220,160', .5);
}
L.run({ DUR: 14, bloom: .38, shots: [{ a: 0, b: 3.8, f: s1 }, { a: 3.5, b: 7.5, f: s2 }, { a: 7.2, b: 10.8, f: s3 }, { a: 10.5, b: 14, f: s4 }] });
})();
