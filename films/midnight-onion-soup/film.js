// film.js · "midnight onion soup" — an anime-style cooking Short made in code (anime-cooking skill).
// 1080×1920, 26 s, 24 fps. Six shots: fridge opens → onion → chopping → pouring water → simmering pot → the bowl by a rainy window.
// Look: flat cel-shaded objects over soft painted backgrounds, cool fridge-blue light with one warm accent, bloom, grain, vignette.
(() => {
const W = 1080, H = 1920, FPS = 24, DUR = 26;
const FONT = "'DejaVu Serif', serif";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function cam(c, s, fx, fy) { c.translate(fx, fy); c.scale(s, s); c.translate(-fx, -fy); }

// ---------------- light ----------------
function glow(c, x, y, r, rgb, a) {
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
}
function sparkle(c, x, y, s, a) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = clamp(a); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#fff';
  c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s * .7, y); c.quadraticCurveTo(x, y, x, y + s);
  c.quadraticCurveTo(x, y, x - s * .7, y); c.quadraticCurveTo(x, y, x, y - s); c.fill(); c.restore();
  glow(c, x, y, s * 1.4, '190,240,255', a * .45);
}
function bokeh(c, seed, n, t, y0, y1, cols, rmax = 90, a = .22) {
  const r = rng(seed);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = lerp(y0, y1, r()), rad = rmax * (.4 + r() * .6), col = cols[Math.floor(r() * cols.length)], ph = r() * 6;
    const al = a * (.6 + .4 * Math.sin(t * 1.3 + ph));
    c.fillStyle = `rgba(${col},${al})`; c.beginPath(); c.arc(x + Math.sin(t * .3 + ph) * 12, y, rad, 0, 7); c.fill();
    c.strokeStyle = `rgba(${col},${al * 1.3})`; c.lineWidth = 3; c.stroke();
  }
  c.restore();
}
function steam(c, cx, cy, spread, t, n = 5, a = .18, rise = 620) {
  c.save(); c.filter = 'blur(18px)'; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ph = i * 1.7, p = (t * .22 + i / n) % 1, yb = cy - p * rise, al = a * Math.sin(p * Math.PI);
    c.strokeStyle = `rgba(230,245,255,${al})`; c.lineWidth = 46 + p * 70; c.beginPath();
    const x0 = cx + (i - (n - 1) / 2) * spread / n;
    for (let k = 0; k <= 10; k++) c.lineTo(x0 + Math.sin(k * .6 + t * 1.2 + ph) * 38 * (1 + p), yb - k * 34);
    c.stroke();
  }
  c.filter = 'none'; c.restore();
}

// ---------------- props ----------------
function paw(c, x, y, s, col) {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y + s * .25, s * .42, s * .34, 0, 0, 7); c.fill();
  for (const [u, v] of [[-.45, -.2], [-.17, -.45], [.17, -.45], [.45, -.2]]) { c.beginPath(); c.ellipse(x + u * s, y + v * s, s * .15, s * .19, u * .6, 0, 7); c.fill(); }
}
function onionPath(c, x, y, r) {
  c.beginPath(); c.moveTo(x, y - r * 1.2);
  c.bezierCurveTo(x + r * .2, y - r * .85, x + r * 1.05, y - r * .7, x + r * 1.02, y + r * .05);
  c.bezierCurveTo(x + r, y + r * .75, x + r * .45, y + r * .98, x, y + r * .98);
  c.bezierCurveTo(x - r * .45, y + r * .98, x - r, y + r * .75, x - r * 1.02, y + r * .05);
  c.bezierCurveTo(x - r * 1.05, y - r * .7, x - r * .2, y - r * .85, x, y - r * 1.2); c.closePath();
}
function onion(c, x, y, r, t = 0) {
  c.save(); onionPath(c, x, y, r);
  const g = c.createRadialGradient(x - r * .35, y - r * .3, r * .1, x, y, r * 1.15);
  g.addColorStop(0, '#ffcf8a'); g.addColorStop(.45, '#d9772f'); g.addColorStop(1, '#7a2f14');
  c.fillStyle = g; c.fill(); c.clip();
  c.fillStyle = 'rgba(50,20,70,.38)'; c.beginPath(); c.ellipse(x + r * .62, y + r * .25, r * .85, r * 1.3, -.3, 0, 7); c.fill();  // cel shadow
  c.strokeStyle = 'rgba(140,220,255,.6)'; c.lineWidth = r * .09; onionPath(c, x + r * .06, y, r); c.stroke();                 // fridge rim light
  c.strokeStyle = 'rgba(110,40,15,.35)'; c.lineWidth = Math.max(1.5, r * .012);
  for (let k = -4; k <= 4; k++) { if (!k) continue; c.beginPath(); c.moveTo(x, y - r * 1.15); c.bezierCurveTo(x + k * r * .32, y - r * .6, x + k * r * .3, y + r * .6, x + k * r * .06, y + r * .98); c.stroke(); }
  c.fillStyle = 'rgba(255,245,225,.55)'; c.beginPath(); c.ellipse(x - r * .45, y - r * .2, r * .12, r * .32, .45, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x - r * .52, y - r * .42, r * .05, r * .09, .45, 0, 7); c.fill();
  c.restore();
  c.save(); c.lineCap = 'round'; c.strokeStyle = '#8a5a32'; c.lineWidth = r * .045; c.beginPath();
  c.moveTo(x, y - r * 1.18); c.quadraticCurveTo(x + r * .05, y - r * 1.4, x - r * .1, y - r * 1.5);
  c.moveTo(x, y - r * 1.18); c.quadraticCurveTo(x + r * .12, y - r * 1.32, x + r * .17, y - r * 1.44); c.stroke();
  c.strokeStyle = '#d8c3a0'; c.lineWidth = r * .02;
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * r * .05, y + r * .96); c.quadraticCurveTo(x + k * r * .12, y + r * 1.08, x + k * r * .09 + Math.sin(k + t) * r * .02, y + r * 1.16); c.stroke(); }
  c.restore();
}
function bottle(c, x, y, L, o = {}) {           // lying along +x; neck/cap at the right end
  const R = L * .16, bodyEnd = L * .72, neckS = L * .84, nR = R * .42;
  c.save(); c.translate(x, y);
  const path = () => {
    c.beginPath(); c.moveTo(R * .4, -R); c.lineTo(bodyEnd, -R);
    c.bezierCurveTo(bodyEnd + L * .07, -R, neckS - L * .03, -nR, neckS, -nR); c.lineTo(L * .9, -nR); c.lineTo(L * .9, nR); c.lineTo(neckS, nR);
    c.bezierCurveTo(neckS - L * .03, nR, bodyEnd + L * .07, R, bodyEnd, R); c.lineTo(R * .4, R);
    c.quadraticCurveTo(0, R, 0, R * .6); c.lineTo(0, -R * .6); c.quadraticCurveTo(0, -R, R * .4, -R); c.closePath();
  };
  path();
  const g = c.createLinearGradient(0, -R, 0, R);
  g.addColorStop(0, 'rgba(190,240,255,.8)'); g.addColorStop(.35, 'rgba(70,170,235,.62)'); g.addColorStop(.8, 'rgba(25,95,185,.72)'); g.addColorStop(1, 'rgba(150,220,255,.6)');
  c.fillStyle = g; c.fill();
  c.save(); path(); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 3;
  const ridge = xx => { c.beginPath(); c.moveTo(xx, -R); c.quadraticCurveTo(xx + R * .15, 0, xx, R); c.stroke(); };
  for (let k = 1; k < 6; k++) ridge(k * L * .045);
  for (let k = 0; k < 3; k++) ridge(L * .62 + k * L * .03);
  const lx = L * .28, lw = L * .28;
  c.fillStyle = 'rgba(235,250,255,.92)'; c.fillRect(lx, -R, lw, 2 * R);
  const lg = c.createLinearGradient(0, -R, 0, R); lg.addColorStop(0, 'rgba(10,50,120,0)'); lg.addColorStop(1, 'rgba(10,50,120,.4)');
  c.fillStyle = lg; c.fillRect(lx, -R, lw, 2 * R);
  c.fillStyle = '#3a8fd6'; c.beginPath(); c.moveTo(L * .3, R * .5); c.lineTo(L * .38, -R * .35); c.lineTo(L * .44, R * .1); c.lineTo(L * .48, -R * .1); c.lineTo(L * .54, R * .5); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(L * .362, -R * .12); c.lineTo(L * .38, -R * .35); c.lineTo(L * .398, -R * .12); c.closePath(); c.fill();
  c.fillStyle = '#5cb85c'; c.beginPath(); c.ellipse(L * .43, R * .44, L * .03, R * .12, 0, 0, 7); c.fill();
  c.strokeStyle = '#1d5fa8'; c.lineWidth = 4; c.beginPath(); for (let k = 0; k <= 20; k++) c.lineTo(L * .29 + k * L * .013, R * .66 + Math.sin(k * 1.3) * R * .06); c.stroke();
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = R * .12; c.beginPath(); c.moveTo(R * .5, -R * .62); c.lineTo(bodyEnd, -R * .62); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = R * .06; c.beginPath(); c.moveTo(R * .5, R * .7); c.lineTo(bodyEnd * .9, R * .7); c.stroke();
  c.restore();
  path(); c.strokeStyle = 'rgba(220,250,255,.65)'; c.lineWidth = 2.5; c.stroke();
  if (o.cap !== false) {
    const cg = c.createLinearGradient(0, -nR * 1.25, 0, nR * 1.25);
    cg.addColorStop(0, '#7fd0ff'); cg.addColorStop(.5, '#1f8ae6'); cg.addColorStop(1, '#0b4f9e');
    c.fillStyle = cg; rr(c, L * .9, -nR * 1.25, L * .1, nR * 2.5, 8); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
    for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(L * .9 + k * L * .016, -nR * 1.2); c.lineTo(L * .9 + k * L * .016, nR * 1.2); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(L * .905, -nR * 1.05, L * .09, nR * .3);
  }
  c.restore();
}
function jug(c, x, yb, w, h, level, t, o = {}) {     // glass measuring jug with red marks and paw prints
  const top = yb - h, wt = w * 1.06;
  const lx = yy => x - lerp(w, wt, (yb - yy) / h) / 2, rx = yy => x + lerp(w, wt, (yb - yy) / h) / 2;
  const body = () => {
    c.beginPath(); c.moveTo(lx(top), top); c.lineTo(rx(top) + w * .06, top - w * .035); c.lineTo(rx(top + h * .06), top + h * .06);
    c.lineTo(rx(yb), yb - w * .04); c.quadraticCurveTo(rx(yb), yb, rx(yb) - w * .05, yb); c.lineTo(lx(yb) + w * .05, yb);
    c.quadraticCurveTo(lx(yb), yb, lx(yb), yb - w * .04); c.closePath();
  };
  c.save();
  c.lineCap = 'round'; c.strokeStyle = 'rgba(210,245,255,.32)'; c.lineWidth = w * .09; c.beginPath();
  c.moveTo(rx(top + h * .15), top + h * .15); c.bezierCurveTo(x + w * .85, top + h * .1, x + w * .85, yb - h * .35, rx(yb - h * .3), yb - h * .3); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = w * .018; c.stroke();
  body(); c.fillStyle = 'rgba(190,235,255,.10)'; c.fill();
  if (level > 0) {
    const wy = yb - h * level, a = o.wob ?? 6, pts = [];
    for (let k = 0; k <= 48; k++) { const xx = x - w * .6 + k * w * 1.2 / 48; pts.push([xx, wy + Math.sin(xx * .03 + t * 5) * a * .6 + Math.sin(xx * .071 - t * 7) * a * .4]); }
    c.save(); body(); c.clip();
    c.beginPath(); c.moveTo(x - w, yb + 10); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(x + w, yb + 10); c.closePath();
    const g = c.createLinearGradient(0, wy, 0, yb); g.addColorStop(0, 'rgba(170,235,255,.55)'); g.addColorStop(1, 'rgba(30,120,210,.62)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(150,230,255,.25)'; c.lineWidth = 5;                         // caustic light inside the water
    for (let k = 0; k < 5; k++) { c.beginPath(); for (let j = 0; j <= 20; j++) { const xx = x - w * .5 + j * w / 20; c.lineTo(xx, wy + 30 + k * (yb - wy) / 5 + Math.sin(j * .9 + t * 3 + k) * 10); } c.stroke(); }
    if (o.bubbles) {
      const r = rng(77);
      for (let i = 0; i < 26; i++) {
        const bx = x - w * .35 + r() * w * .7, sp = 160 + r() * 220, s = 4 + r() * 9, span = yb - wy;
        const by = yb - ((t * sp + r() * span) % span);
        c.strokeStyle = 'rgba(240,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(bx + Math.sin(t * 6 + i) * 5, by, s, 0, 7); c.stroke();
      }
    }
    c.strokeStyle = 'rgba(235,255,255,.9)'; c.lineWidth = 4; c.beginPath(); for (const p of pts) c.lineTo(p[0], p[1]); c.stroke();
    c.restore();
  }
  const red = '#e23a4e', mx = x - w * .2;
  c.strokeStyle = red; c.fillStyle = red; c.lineWidth = Math.max(2, w * .012);
  c.beginPath(); c.moveTo(mx, yb - h * .1); c.lineTo(mx, top + h * .13); c.stroke();
  for (let i = 1; i <= 5; i++) {
    const yy = yb - h * (.1 + i * .15);
    c.beginPath(); c.moveTo(mx, yy); c.lineTo(mx + w * .24, yy); c.stroke();
    c.font = `700 ${w * .064}px ${FONT}`; c.textAlign = 'left'; c.fillText(String(i * 100), mx + w * .05, yy - w * .025);
    paw(c, mx + w * .33, yy - w * .05, w * .045, red);
    const y2 = yy + h * .075; c.beginPath(); c.moveTo(mx, y2); c.lineTo(mx + w * .1, y2); c.stroke();
  }
  c.font = `italic 700 ${w * .074}px ${FONT}`; c.textAlign = 'center'; c.fillText(o.label || 'a quiet night', x, top + h * .085);
  body(); c.strokeStyle = 'rgba(230,252,255,.8)'; c.lineWidth = 4; c.stroke();
  c.beginPath(); c.ellipse(x, top, wt / 2, w * .05, 0, 0, 7); c.strokeStyle = 'rgba(240,255,255,.8)'; c.lineWidth = 3; c.stroke();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(lx(top) + w * .06, top + h * .1, w * .05, h * .8);
  c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(rx(top) - w * .15, top + h * .12, w * .025, h * .7);
  c.restore();
}
function jar(c, x, yb, w, h, col) {
  c.save();
  rr(c, x - w / 2, yb - h, w, h, w * .18); c.fillStyle = 'rgba(200,240,255,.15)'; c.fill();
  c.save(); rr(c, x - w / 2, yb - h, w, h, w * .18); c.clip();
  c.globalAlpha = .9; c.fillStyle = col; c.fillRect(x - w / 2, yb - h * .75, w, h); c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - w * .36, yb - h * .85, w * .08, h * .75); c.restore();
  rr(c, x - w / 2, yb - h, w, h, w * .18); c.strokeStyle = 'rgba(230,250,255,.7)'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#d94b5b'; rr(c, x - w * .46, yb - h - h * .16, w * .92, h * .18, 10); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - w * .4, yb - h - h * .13, w * .8, h * .04);
  c.fillStyle = '#fdf6e3'; rr(c, x - w * .3, yb - h * .58, w * .6, h * .32, 8); c.fill();
  paw(c, x, yb - h * .44, w * .09, '#d94b5b');
  c.restore();
}
function egg(c, x, y, r) {
  const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * 1.3);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(.6, '#e9dcc8'); g.addColorStop(1, '#7c8fa6');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * .8, r, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x - r * .3, y - r * .45, r * .12, r * .2, .4, 0, 7); c.fill();
}
function shelf(c, y, X0 = 95, X1 = 985) {
  c.fillStyle = 'rgba(205,240,255,.28)'; c.fillRect(X0, y, X1 - X0, 22);
  c.fillStyle = 'rgba(255,255,255,.88)'; c.fillRect(X0, y, X1 - X0, 4);
  const g = c.createLinearGradient(0, y + 22, 0, y + 90); g.addColorStop(0, 'rgba(5,20,45,.35)'); g.addColorStop(1, 'rgba(5,20,45,0)');
  c.fillStyle = g; c.fillRect(X0, y + 22, X1 - X0, 68);
}
function shadow(c, x, y, rx, ry, a = .4) { c.fillStyle = `rgba(5,15,35,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
function board(c, y0, y1) {
  c.save(); c.beginPath(); c.moveTo(60, y0); c.lineTo(W - 60, y0); c.lineTo(W + 80, y1); c.lineTo(-80, y1); c.closePath();
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#5d6f80'); g.addColorStop(.5, '#867c73'); g.addColorStop(1, '#a1886e');
  c.fillStyle = g; c.fill(); c.clip();
  const r = rng(3); c.strokeStyle = 'rgba(60,40,30,.22)'; c.lineWidth = 2;
  for (let i = 0; i < 28; i++) { const yy = lerp(y0, y1, r()); c.beginPath(); for (let k = 0; k <= 12; k++) c.lineTo(-100 + k * 110, yy + Math.sin(k * .8 + i) * 6); c.stroke(); }
  c.restore();
  c.strokeStyle = 'rgba(180,230,255,.65)'; c.lineWidth = 4; c.beginPath(); c.moveTo(60, y0); c.lineTo(W - 60, y0); c.stroke();
}
function kitchenBG(c, t, horizon, seed) {               // soft, out-of-focus tiled wall
  c.save(); c.filter = 'blur(10px)';
  const g = c.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, '#bfe9f5'); g.addColorStop(.45, '#4f8fb3'); g.addColorStop(1, '#173553');
  c.fillStyle = g; c.fillRect(-60, -60, W + 120, horizon + 120);
  c.strokeStyle = 'rgba(230,250,255,.22)'; c.lineWidth = 6; c.beginPath();
  for (let x = -30; x < W + 60; x += 170) { c.moveTo(x, 0); c.lineTo(x, horizon); }
  for (let y = 40; y < horizon; y += 170) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke(); c.filter = 'none'; c.restore();
  bokeh(c, seed, 14, t, 80, horizon - 100, ['200,245,255', '255,230,190'], 100, .16);
}

// ---------------- shots ----------------
function sFridge(c, lt, D) {
  const open = ss(seg(lt, .2, 1.8));
  let light = ss(seg(lt, .35, 1.1)); if (lt > .55 && lt < .72) light *= .5;   // the bulb flickers on
  c.fillStyle = '#040810'; c.fillRect(0, 0, W, H);
  c.save(); cam(c, 1 + .07 * ss(lt / D), W / 2, H * .45);
  const X0 = 80, X1 = 1000, Y0 = 120, Y1 = 1840;
  const g = c.createLinearGradient(0, Y0, 0, Y1);
  g.addColorStop(0, '#e8fbff'); g.addColorStop(.18, '#9fd8ec'); g.addColorStop(.55, '#3f7fa6'); g.addColorStop(1, '#13304f');
  c.fillStyle = g; rr(c, X0, Y0, X1 - X0, Y1 - Y0, 28); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 6;
  for (let x = X0 + 130; x < X1 - 60; x += 110) { c.beginPath(); c.moveTo(x, Y0 + 70); c.lineTo(x, Y1 - 70); c.stroke(); }
  c.fillStyle = 'rgba(8,25,55,.35)';
  c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + 70, Y0 + 60); c.lineTo(X0 + 70, Y1 - 60); c.lineTo(X0, Y1); c.fill();
  c.beginPath(); c.moveTo(X1, Y0); c.lineTo(X1 - 70, Y0 + 60); c.lineTo(X1 - 70, Y1 - 60); c.lineTo(X1, Y1); c.fill();
  c.fillStyle = '#fff'; rr(c, W / 2 - 120, Y0 + 18, 240, 26, 13); c.fill();
  // top shelf
  shadow(c, 330, 640, 140, 14); shadow(c, 720, 640, 90, 12);
  jug(c, 330, 640, 250, 380, .32, lt, { wob: 2 });
  jar(c, 720, 640, 150, 190, '#e7a83c');
  shelf(c, 640);
  // middle shelf: the water bottle lying down
  shadow(c, 520, 1145, 330, 16);
  bottle(c, 200, 1040, 640);
  shelf(c, 1145);
  // bottom shelf
  shadow(c, 335, 1565, 120, 14); shadow(c, 605, 1565, 110, 12);
  onion(c, 330, 1445, 118, lt);
  egg(c, 560, 1515, 50); egg(c, 655, 1520, 50); egg(c, 750, 1518, 48);
  shelf(c, 1565);
  // crisper drawer with greens
  c.save(); rr(c, 120, 1600, 840, 220, 18); c.clip();
  c.fillStyle = '#3d8c6a'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(200 + i * 120, 1700 + Math.sin(i * 2) * 20, 90, 60, i, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(190,235,255,.35)'; c.fillRect(120, 1600, 840, 220); c.restore();
  rr(c, 120, 1600, 840, 220, 18); c.strokeStyle = 'rgba(230,250,255,.6)'; c.lineWidth = 4; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(420, 1630, 240, 10);
  c.restore();
  glow(c, W / 2, Y0 + 60, 560, '200,245,255', .55 * light);
  c.fillStyle = `rgba(2,5,12,${(1 - light) * .93})`; c.fillRect(0, 0, W, H);
  const dw = W * (1 - open);
  if (dw > 1) {
    const dg = c.createLinearGradient(0, 0, dw, 0); dg.addColorStop(0, '#0b1119'); dg.addColorStop(1, '#1b2838');
    c.fillStyle = dg; c.fillRect(0, 0, dw, H);
    c.fillStyle = `rgba(150,225,255,${.8 * light + .1})`; c.fillRect(dw - 6, 0, 6, H);
    glow(c, dw, H * .45, 520, '170,235,255', .35 * light);
  }
}
function sOnion(c, lt, D) {
  c.save(); cam(c, 1 + .09 * ss(lt / D), W / 2, 1150);
  kitchenBG(c, lt, 1040, 5);
  board(c, 1000, H + 40);
  shadow(c, 570, 1415, 250, 48, .45);
  onion(c, 540, 1150, 250, lt);
  sparkle(c, 540 - 250 * .52, 1150 - 250 * .42, 46, .55 + .45 * Math.sin(lt * 4));
  c.restore();
  glow(c, lerp(-150, W + 150, lt / D), 320, 620, '255,210,170', .16);
}
const CHOPS = [.7, 1.5, 2.3, 3.1, 3.8];
function onionFace(c, cx, cy, R) {
  const g = c.createRadialGradient(cx - R * .2, cy - R * .2, R * .1, cx, cy, R);
  g.addColorStop(0, '#fffafc'); g.addColorStop(1, '#e2cfe6');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.strokeStyle = 'rgba(165,130,190,.5)'; c.lineWidth = 4;
  for (let k = 1; k < 7; k++) { c.beginPath(); c.arc(cx, cy + k * 3, R * k / 7, 0, 7); c.stroke(); }
  c.strokeStyle = '#b9632e'; c.lineWidth = 18; c.beginPath(); c.arc(cx, cy, R - 9, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(140,220,255,.7)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R - 2, Math.PI * .9, Math.PI * 1.45); c.stroke();
  c.fillStyle = 'rgba(80,40,100,.18)'; c.beginPath(); c.arc(cx + R * .35, cy + R * .3, R * .8, 0, 7); c.fill();
}
function sChop(c, lt, D) {
  c.save(); cam(c, 1.05 - .05 * ss(lt / D), W / 2, 1150);
  kitchenBG(c, lt, 820, 12);
  board(c, 780, H + 40);
  const cx = 610, cy = 1230, R = 250, base = cy + R * .82;
  const n = CHOPS.filter(x => lt >= x).length;
  const cutAt = k => cx - R + 70 + k * 48;
  shadow(c, cx + 20, base + 6, R * 1.05, 34, .45);
  for (let i = 0; i < n; i++) {                       // fallen slices
    const fall = ss((lt - CHOPS[i]) / .28), x0 = cutAt(i + 1) - 48;
    c.save(); c.translate(-fall * (90 + (n - i) * 26), 0);
    c.translate(x0, base); c.rotate(-fall * .32); c.translate(-x0, -base);
    c.beginPath(); c.rect(x0, cy - R - 10, 48, base - (cy - R - 10)); c.clip();
    onionFace(c, cx, cy, R); c.restore();
  }
  c.save(); c.beginPath(); c.rect(cutAt(n), cy - R - 20, 2 * R + 40, base - (cy - R - 20)); c.clip();
  onionFace(c, cx, cy, R); c.restore();
  // knife
  const bump = d => d < -.25 || d > .35 ? 0 : d < 0 ? ss((d + .25) / .25) : 1 - ss(d / .35);
  const f = Math.max(...CHOPS.map(x => bump(lt - x)));
  const kx = cutAt(CHOPS.filter(x => lt >= x - .25).length);
  const yE = lerp(cy - R - 230, base, f), top = -60;
  c.beginPath(); c.moveTo(kx - 6, yE); c.lineTo(kx + 74, yE - 30); c.lineTo(kx + 100, top); c.lineTo(kx + 4, top); c.closePath();
  const kg = c.createLinearGradient(kx, 0, kx + 100, 0);
  kg.addColorStop(0, '#f4fbff'); kg.addColorStop(.25, '#a9c3d6'); kg.addColorStop(.6, '#5f7a90'); kg.addColorStop(1, '#d8ecf7');
  c.fillStyle = kg; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(kx - 6, yE); c.lineTo(kx + 4, top); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(kx + 34, top, 12, Math.max(0, yE - top - 50));
  // juice sparkles on each chop
  for (let i = 0; i < CHOPS.length; i++) {
    const d = lt - CHOPS[i]; if (d < 0 || d > .5) continue;
    const r = rng(40 + i);
    for (let k = 0; k < 7; k++) { const a = -Math.PI * (.15 + r() * .7), sp = 200 + r() * 300; sparkle(c, kx + Math.cos(a) * sp * d, base - 40 + Math.sin(a) * sp * d + 400 * d * d, 12 + r() * 10, 1 - d * 2); }
  }
  c.restore();
}
function sPour(c, lt, D) {
  c.save(); cam(c, 1 + .05 * ss(lt / D), W / 2, 1100);
  c.save(); c.filter = 'blur(14px)';
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e6fbff'); g.addColorStop(.3, '#8fd0e8'); g.addColorStop(1, '#14324f');
  c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 760, W, 14); c.fillRect(0, 1760, W, 14);
  c.filter = 'none'; c.restore();
  bokeh(c, 31, 12, lt, 100, 1600, ['210,250,255'], 80, .14);
  const level = lerp(.2, .68, ss(seg(lt, .4, 3.8))), pouring = lt > .3 && lt < 3.75;
  const x = 500, yb = 1740, w = 600, h = 1080, wy = yb - h * level;
  shadow(c, x, yb + 4, w * .55, 24, .45);
  jug(c, x, yb, w, h, level, lt, { wob: pouring ? 12 : 5, bubbles: pouring });
  if (pouring) {
    const sx = 632, sy = 436, ex = 590, a = ss(seg(lt, .3, .5)) * (1 - ss(seg(lt, 3.55, 3.75)));
    const L = [], Rr = [];
    for (let k = 0; k <= 30; k++) {
      const p = k / 30, yy = lerp(sy, wy, p), xx = lerp(sx, ex, Math.sqrt(p)) + Math.sin(p * 9 - lt * 14) * 4, hw = lerp(15, 8, p);
      L.push([xx - hw, yy]); Rr.push([xx + hw, yy]);
    }
    c.save(); c.globalAlpha = a; c.beginPath(); L.forEach(p => c.lineTo(p[0], p[1])); Rr.reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath();
    const sg = c.createLinearGradient(sx - 20, 0, sx + 20, 0); sg.addColorStop(0, 'rgba(120,210,255,.7)'); sg.addColorStop(.4, 'rgba(240,255,255,.95)'); sg.addColorStop(1, 'rgba(90,180,240,.7)');
    c.fillStyle = sg; c.fill();
    const r = rng(Math.floor(lt * 12));
    for (let k = 0; k < 9; k++) { const dx = (r() - .5) * 140, dy = -r() * 70; c.fillStyle = 'rgba(235,255,255,.85)'; c.beginPath(); c.arc(ex + dx, wy + dy, 3 + r() * 6, 0, 7); c.fill(); }
    glow(c, ex, wy, 120, '200,250,255', .35);
    c.restore();
  }
  c.save(); c.translate(632, 436); c.rotate(2.5); bottle(c, -620 * .9, 0, 620, { cap: false }); c.restore();
  c.restore();
}
function sPot(c, lt, D) {
  const sg = c.createRadialGradient(540, 1000, 300, 540, 1000, 1150); sg.addColorStop(0, '#1d2a38'); sg.addColorStop(1, '#060a10');
  c.fillStyle = sg; c.fillRect(0, 0, W, H);
  c.save(); cam(c, 1.02 + .06 * ss(lt / D), 540, 1000); c.translate(540, 1000); c.rotate(lt * .025); c.translate(-540, -1000);
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; glow(c, 540 + Math.cos(a) * 470, 1000 + Math.sin(a) * 470, 55, '80,160,255', .3 + .15 * Math.sin(lt * 23 + i * 2.1)); }
  c.strokeStyle = '#141b24'; c.lineWidth = 36; c.beginPath();
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { c.moveTo(540 + Math.cos(a) * 380, 1000 + Math.sin(a) * 380); c.lineTo(540 + Math.cos(a) * 640, 1000 + Math.sin(a) * 640); }
  c.stroke();
  const steel = c.createLinearGradient(100, 560, 980, 1440); steel.addColorStop(0, '#e3eef6'); steel.addColorStop(.5, '#5d6d7c'); steel.addColorStop(1, '#c7d6e2');
  c.fillStyle = steel; rr(c, 20, 960, 120, 80, 30); c.fill(); rr(c, 940, 960, 120, 80, 30); c.fill();
  c.beginPath(); c.arc(540, 1000, 440, 0, 7); c.fill();
  const wall = c.createRadialGradient(540, 1000, 340, 540, 1000, 410); wall.addColorStop(0, '#2b3946'); wall.addColorStop(1, '#8fa3b3');
  c.fillStyle = wall; c.beginPath(); c.arc(540, 1000, 410, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(540, 1000, 386, 0, 7); c.clip();
  const soup = c.createRadialGradient(490, 950, 30, 540, 1000, 400); soup.addColorStop(0, '#ffd27a'); soup.addColorStop(.5, '#e39a3c'); soup.addColorStop(1, '#9b511d');
  c.fillStyle = soup; c.fillRect(100, 560, 900, 900);
  c.strokeStyle = 'rgba(255,230,170,.35)'; c.lineWidth = 6;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(540, 1000, 80 + k * 52 + Math.sin(lt * 2 + k) * 8, k, k + 1.6); c.stroke(); }
  const r = rng(8);
  for (let i = 0; i < 11; i++) {
    const a0 = r() * 7, rad = r() * 270, rx = 40 + r() * 46, ry = rx * (.8 + r() * .3), dir = r() < .5 ? 1 : -1, rot = r() * 3;
    const ang = a0 + lt * .12 * dir;
    c.save(); c.translate(540 + Math.cos(ang) * rad, 1000 + Math.sin(ang) * rad); c.rotate(rot + lt * .1);
    c.fillStyle = 'rgba(255,235,200,.22)'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,246,222,.92)'; c.lineWidth = 9; c.stroke();
    c.strokeStyle = 'rgba(160,90,40,.45)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, rx - 7, ry - 7, 0, 0, 7); c.stroke();
    c.restore();
  }
  for (let i = 0; i < 44; i++) {
    const r2 = rng(100 + i), per = .6 + r2() * .9, ph = r2() * per, k = Math.floor((lt + ph) / per), r3 = rng(1000 + i * 31 + k);
    const bx = 540 + (r3() - .5) * 600, by = 1000 + (r3() - .5) * 600;
    if (Math.hypot(bx - 540, by - 1000) > 360) continue;
    const p = ((lt + ph) % per) / per, s = 6 + r3() * 16;
    if (p < .85) {
      const z = s * Math.min(1, p * 3);
      c.strokeStyle = 'rgba(255,250,230,.85)'; c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, z, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(bx - z * .35, by - z * .35, z * .25, 0, 7); c.fill();
    } else { const q = (p - .85) / .15; c.strokeStyle = `rgba(255,250,230,${.6 * (1 - q)})`; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, s * (1 + q * 1.5), 0, 7); c.stroke(); }
  }
  const r4 = rng(55);
  for (let i = 0; i < 22; i++) { const a = r4() * 7, d = r4() * 340; sparkle(c, 540 + Math.cos(a) * d, 1000 + Math.sin(a) * d, 10 + r4() * 10, Math.sin(lt * 3 + i * 1.7) * .9); }
  const edge = c.createRadialGradient(540, 1000, 290, 540, 1000, 386); edge.addColorStop(0, 'rgba(60,25,10,0)'); edge.addColorStop(1, 'rgba(60,25,10,.55)');
  c.fillStyle = edge; c.fillRect(100, 560, 900, 900);
  c.restore();
  c.strokeStyle = 'rgba(225,248,255,.85)'; c.lineWidth = 7; c.beginPath(); c.arc(540, 1000, 437, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
  c.restore();
  steam(c, 540, 1050, 520, lt, 6, .2, 900);
}
function bowl(c, x, y, rx, t) {
  const ry = rx * .32, depth = rx * .78;
  shadow(c, x + 24, y + depth + 8, rx * .85, ry * .45, .5);
  const outer = () => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.bezierCurveTo(x - rx, y + depth * .9, x - rx * .45, y + depth, x, y + depth); c.bezierCurveTo(x + rx * .45, y + depth, x + rx, y + depth * .9, x + rx, y); c.closePath(); };
  outer();
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, '#a9c7dd'); g.addColorStop(.3, '#eef6fb'); g.addColorStop(.7, '#7f9cb5'); g.addColorStop(1, '#3e5770');
  c.fillStyle = g; c.fill();
  c.save(); outer(); c.clip();
  c.strokeStyle = '#2f4f9a'; c.lineWidth = 7; c.beginPath();
  for (let k = 0; k <= 40; k++) { const xx = x - rx + k * rx / 20; c.lineTo(xx, y + depth * .45 + Math.sin(k * .9) * 10 + Math.pow((xx - x) / rx, 2) * -depth * .25); }
  c.stroke();
  c.fillStyle = '#2f4f9a'; for (let k = -4; k <= 4; k++) { const xx = x + k * rx * .2; c.beginPath(); c.arc(xx, y + depth * .7 - Math.pow((xx - x) / rx, 2) * depth * .35, 6, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,190,120,.18)'; c.fillRect(x - rx, y, rx, depth);
  c.restore();
  c.fillStyle = '#cfe0ec'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill();
  c.save(); c.beginPath(); c.ellipse(x, y + ry * .1, rx * .9, ry * .82, 0, 0, 7); c.clip();
  const s = c.createRadialGradient(x - rx * .2, y - ry * .2, 10, x, y, rx); s.addColorStop(0, '#ffd88a'); s.addColorStop(.6, '#e09a42'); s.addColorStop(1, '#8e4c1d');
  c.fillStyle = s; c.fillRect(x - rx, y - ry, 2 * rx, 2 * ry);
  const r = rng(19);
  for (let i = 0; i < 8; i++) { const ox = (r() - .5) * rx * 1.4, oy = (r() - .5) * ry * 1.1, w = 36 + r() * 30; c.strokeStyle = 'rgba(255,246,222,.9)'; c.lineWidth = 7; c.beginPath(); c.ellipse(x + ox + Math.sin(t + i) * 4, y + oy, w, w * .32, 0, 0, 7); c.stroke(); }
  c.save(); c.translate(x + 10, y - 6); c.rotate(-.12);
  c.fillStyle = '#c9893d'; rr(c, -95, -38, 190, 70, 22); c.fill();
  c.fillStyle = '#fff1c9'; c.beginPath(); c.moveTo(-90, -20); c.bezierCurveTo(-40, -50, 40, -50, 90, -22); c.lineTo(80, 10); c.quadraticCurveTo(60, 40, 50, 12); c.quadraticCurveTo(10, 30, -20, 10); c.quadraticCurveTo(-60, 42, -80, 6); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-50, -30, 60, 8);
  c.restore();
  for (let i = 0; i < 12; i++) { const ox = (r() - .5) * rx * 1.5, oy = (r() - .5) * ry * 1.2; c.strokeStyle = '#59b85f'; c.lineWidth = 5; c.beginPath(); c.ellipse(x + ox, y + oy, 9, 4, 0, 0, 7); c.stroke(); }
  c.restore();
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.strokeStyle = '#f4fbff'; c.lineWidth = 7; c.stroke();
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.5); c.strokeStyle = 'rgba(160,230,255,.9)'; c.lineWidth = 4; c.stroke();
}
function sBowl(c, lt, D) {
  c.save(); cam(c, 1.12 - .12 * ss(lt / D), W / 2, 1300);
  c.fillStyle = '#0c1a2b'; c.fillRect(-100, -100, W + 200, H + 200);
  const wx0 = 140, wx1 = 940, wy0 = 140, wy1 = 1040;
  c.save(); c.beginPath(); c.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); c.clip();
  const sky = c.createLinearGradient(0, wy0, 0, wy1); sky.addColorStop(0, '#0a1630'); sky.addColorStop(.6, '#1f4f73'); sky.addColorStop(1, '#3d7f97');
  c.fillStyle = sky; c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.filter = 'blur(4px)'; const r = rng(91);
  for (let i = 0; i < 12; i++) {
    const bx = wx0 - 40 + i * 80 + r() * 30, bw = 60 + r() * 70, bh = 180 + r() * 380;
    c.fillStyle = '#0b1a2a'; c.fillRect(bx, wy1 - bh, bw, bh);
    c.fillStyle = 'rgba(255,214,140,.75)';
    for (let k = 0; k < 14; k++) if (r() < .45) c.fillRect(bx + 8 + (k % 3) * 18, wy1 - bh + 20 + Math.floor(k / 3) * 34, 9, 13);
  }
  c.filter = 'none';
  bokeh(c, 9, 18, lt, wy0 + 300, wy1, ['255,210,140', '140,230,255', '255,160,190'], 46, .3);
  const rr2 = rng(11); c.strokeStyle = 'rgba(180,220,255,.3)'; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i < 130; i++) { const x = lerp(wx0, wx1, rr2()), sp = 900 + rr2() * 500, len = 40 + rr2() * 50, y = wy0 + ((rr2() * (wy1 - wy0) + lt * sp) % (wy1 - wy0 + 100)) - 50; c.moveTo(x, y); c.lineTo(x - len * .15, y + len); }
  c.stroke();
  const rd = rng(21);
  for (let i = 0; i < 50; i++) {
    const x = lerp(wx0, wx1, rd()), ys = lerp(wy0, wy1, rd()), s = 4 + rd() * 10, v = rd() < .25 ? 40 + rd() * 60 : 0, y = wy0 + ((ys - wy0 + lt * v) % (wy1 - wy0));
    c.fillStyle = 'rgba(15,35,65,.35)'; c.beginPath(); c.ellipse(x, y, s * .8, s, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(220,245,255,.7)'; c.beginPath(); c.arc(x - s * .25, y - s * .3, s * .28, 0, 7); c.fill();
  }
  c.restore();
  c.strokeStyle = '#1a2a3c'; c.lineWidth = 34; c.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.lineWidth = 20; c.beginPath(); c.moveTo(W / 2, wy0); c.lineTo(W / 2, wy1); c.moveTo(wx0, (wy0 + wy1) / 2); c.lineTo(wx1, (wy0 + wy1) / 2); c.stroke();
  c.fillStyle = '#24384d'; c.fillRect(wx0 - 40, wy1 + 10, wx1 - wx0 + 80, 40);
  c.fillStyle = 'rgba(160,220,255,.5)'; c.fillRect(wx0 - 40, wy1 + 10, wx1 - wx0 + 80, 4);
  const tg = c.createLinearGradient(0, 1150, 0, H + 100); tg.addColorStop(0, '#2b3a4a'); tg.addColorStop(1, '#4b4038');
  c.fillStyle = tg; c.fillRect(-100, 1150, W + 200, H);
  c.fillStyle = 'rgba(180,230,255,.45)'; c.fillRect(-100, 1150, W + 200, 4);
  const rg = rng(4); c.strokeStyle = 'rgba(20,15,10,.25)'; c.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const yy = lerp(1170, H + 100, rg()); c.beginPath(); c.moveTo(-100, yy); c.bezierCurveTo(300, yy + 10, 700, yy - 10, W + 100, yy + 4); c.stroke(); }
  glow(c, 540, 1420, 560, '255,170,90', .22);
  // spoon
  c.save(); c.translate(920, 1600); c.rotate(-.5);
  c.fillStyle = '#c9d8e4'; c.beginPath(); c.ellipse(0, 0, 40, 60, 0, 0, 7); c.fill(); c.fillRect(-9, 50, 18, 260);
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-12, -15, 8, 20, 0, 0, 7); c.fill(); c.restore();
  bowl(c, 540, 1360, 300, lt);
  [[290, 1180], [800, 1230], [700, 1090], [370, 1060], [860, 1420], [220, 1460]].forEach(([x, y], i) => sparkle(c, x, y, 24, Math.sin(lt * 2.2 + i * 1.3)));
  steam(c, 540, 1330, 280, lt, 4, .22, 560);
  c.restore();
  const ca = ss(seg(lt, 1.4, 2.4));
  c.save(); c.globalAlpha = ca; c.textAlign = 'center'; c.fillStyle = '#f4fbff';
  c.shadowColor = 'rgba(150,220,255,.9)'; c.shadowBlur = 26;
  c.font = `italic 62px ${FONT}`; c.fillText('↻ midnight onion soup ˚. ✦', W / 2, 1770); c.restore();
}

const SHOTS = [
  { a: 0, b: 4.5, f: sFridge }, { a: 4, b: 8, f: sOnion }, { a: 7.5, b: 12, f: sChop },
  { a: 11.5, b: 16, f: sPour }, { a: 15.5, b: 20, f: sPot }, { a: 19.5, b: 26, f: sBowl },
];

// ---------------- compositing ----------------
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const o = cv.getContext('2d');
const scC = mk(), sc = scC.getContext('2d'), blC = mk(W / 2, H / 2), bl = blC.getContext('2d');
const grain = [0, 1, 2, 3].map(i => {
  const g = mk(512, 512), x = g.getContext('2d'), id = x.createImageData(512, 512), r = rng(900 + i);
  for (let k = 0; k < id.data.length; k += 4) { const v = 128 + (r() - .5) * 200; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
  x.putImageData(id, 0, 0); return o.createPattern(g, 'repeat');
});
function render(t) {
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.filter = 'none';
  o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
  SHOTS.forEach((s, i) => {
    if (t < s.a || t > s.b) return;
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalAlpha = 1; sc.globalCompositeOperation = 'source-over'; sc.filter = 'none';
    sc.clearRect(0, 0, W, H); sc.save(); s.f(sc, t - s.a, s.b - s.a); sc.restore();
    o.globalAlpha = i === 0 ? 1 : ss((t - s.a) / .5); o.drawImage(scC, 0, 0); o.globalAlpha = 1;
  });
  bl.clearRect(0, 0, W / 2, H / 2); bl.filter = 'blur(14px) brightness(1.05) contrast(1.9)'; bl.drawImage(cv, 0, 0, W / 2, H / 2); bl.filter = 'none';
  o.globalCompositeOperation = 'screen'; o.globalAlpha = .35; o.drawImage(blC, 0, 0, W, H);
  o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
  const vg = o.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,5,15,.55)'); o.fillStyle = vg; o.fillRect(0, 0, W, H);
  o.save(); o.globalCompositeOperation = 'overlay'; o.globalAlpha = .1; o.fillStyle = grain[Math.floor(t * FPS) % 4];
  o.translate(-((t * 997) % 512), -((t * 577) % 512)); o.fillRect(0, 0, W + 512, H + 512); o.restore();
  o.globalAlpha = ss(seg(t, DUR - .9, DUR)); o.fillStyle = '#000'; o.fillRect(0, 0, W, H); o.globalAlpha = 1;
}
window.FILM = { W, H, FPS, DUR, render, frame: (t, q = .92) => { render(t); return cv.toDataURL('image/jpeg', q); } };
window.ready = true;
if (!location.search.includes('render')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
})();
