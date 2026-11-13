// lib.js · shared "glass studio" engine for the brand ads: dark studio backdrop, glass pedestals and cubes,
// floor reflections, caustics, light sweeps, gold dust, titles, and post (bloom, vignette, grain, fades).
(() => {
const W = 1080, H = 1920, FPS = 24;
const L = window.L = { W, H, FPS };
const clamp = L.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = L.ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
L.lerp = (a, b, t) => a + (b - a) * t;
const seg = L.seg = (t, a, b) => clamp((t - a) / (b - a));
L.outBack = t => { t = clamp(t); const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
L.outCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const rng = L.rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mk = L.mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
L.rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
L.cam = (c, s, fx, fy) => { c.translate(fx, fy); c.scale(s, s); c.translate(-fx, -fy); };
L.SERIF = "Caladea, 'DejaVu Serif', serif"; L.SANS = "'Inter Display', Inter, sans-serif";

const glow = L.glow = (c, x, y, r, rgb, a) => {
  if (a <= 0 || r <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
};
L.sparkle = (c, x, y, s, a, rgb = '255,245,220') => {
  if (a <= 0) return; a = clamp(a);
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgb(${rgb})`;
  c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s * .75, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s * .75, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
  c.restore(); glow(c, x, y, s * 1.5, rgb, a * .5);
};
L.backdrop = (c, top, bottom, sx, sy, srgb, sa = .5, sr = 1100) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400); glow(c, sx, sy, sr, srgb, sa);
};
L.floor = (c, y, rgb = '255,255,255', a = .18) => {         // glossy floor: a soft horizon line and a darker plane
  const g = c.createLinearGradient(0, y, 0, H); g.addColorStop(0, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = g; c.fillRect(-200, y, W + 400, H - y + 200);
  const h = c.createLinearGradient(0, 0, W, 0); h.addColorStop(0, `rgba(${rgb},0)`); h.addColorStop(.5, `rgba(${rgb},${a})`); h.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = h; c.fillRect(-200, y - 1, W + 400, 3);
};
L.caustics = (c, cx, cy, rx, ry, t, rgb, a = .35) => {
  c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.clip(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(2px)';
  for (let k = 0; k < 9; k++) {
    c.strokeStyle = `rgba(${rgb},${a * (1 - k / 10)})`; c.lineWidth = 3 + (k % 3) * 2; c.beginPath();
    for (let j = 0; j <= 60; j++) {
      const th = j / 60 * Math.PI * 2, rr = (.2 + k * .09) + .05 * Math.sin(th * 5 + t * 1.6 + k) + .03 * Math.sin(th * 9 - t * 2.1);
      c.lineTo(cx + Math.cos(th) * rx * rr, cy + Math.sin(th) * ry * rr);
    }
    c.closePath(); c.stroke();
  }
  c.filter = 'none'; c.restore(); glow(c, cx, cy, rx * .8, rgb, a * .4);
};
L.pedestal = (c, cx, top, rx, h, rgb = '200,235,255') => {    // glass cylinder
  const ry = rx * .22;
  c.save();
  c.beginPath(); c.moveTo(cx - rx, top); c.lineTo(cx - rx, top + h); c.ellipse(cx, top + h, rx, ry, 0, Math.PI, 0, true); c.lineTo(cx + rx, top); c.ellipse(cx, top, rx, ry, 0, 0, Math.PI, false); c.closePath();
  const g = c.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, `rgba(${rgb},.32)`); g.addColorStop(.12, `rgba(${rgb},.08)`); g.addColorStop(.5, `rgba(${rgb},.04)`); g.addColorStop(.85, `rgba(${rgb},.1)`); g.addColorStop(1, `rgba(${rgb},.38)`);
  c.fillStyle = g; c.fill();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${rgb},.22)`; c.fillRect(cx - rx * .78, top + ry * .5, rx * .07, h * .9);
  c.fillStyle = `rgba(${rgb},.1)`; c.fillRect(cx + rx * .55, top + ry * .5, rx * .04, h * .9);
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = `rgba(${rgb},.55)`; c.lineWidth = 2.5;
  c.beginPath(); c.ellipse(cx, top + h, rx, ry, 0, 0, Math.PI); c.stroke();
  c.beginPath(); c.moveTo(cx - rx, top); c.lineTo(cx - rx, top + h); c.moveTo(cx + rx, top); c.lineTo(cx + rx, top + h); c.stroke();
  c.fillStyle = `rgba(${rgb},.12)`; c.beginPath(); c.ellipse(cx, top, rx, ry, 0, 0, 7); c.fill();
  c.strokeStyle = `rgba(255,255,255,.85)`; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, top, rx, ry, 0, 0, 7); c.stroke();
  c.restore();
};
L.cube = (c, cx, top, w, h, rgb = '200,235,255') => {         // glass block, seen slightly from above
  const d = w * .22, x0 = cx - w / 2;
  c.save();
  c.fillStyle = `rgba(${rgb},.16)`; c.beginPath(); c.moveTo(x0, top); c.lineTo(x0 + d, top - d * .6); c.lineTo(x0 + w + d, top - d * .6); c.lineTo(x0 + w, top); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = `rgba(${rgb},.07)`; c.beginPath(); c.moveTo(x0 + w, top); c.lineTo(x0 + w + d, top - d * .6); c.lineTo(x0 + w + d, top + h - d * .6); c.lineTo(x0 + w, top + h); c.closePath(); c.fill();
  c.strokeStyle = `rgba(${rgb},.45)`; c.stroke();
  const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, `rgba(${rgb},.3)`); g.addColorStop(.2, `rgba(${rgb},.06)`); g.addColorStop(1, `rgba(${rgb},.16)`);
  c.fillStyle = g; c.fillRect(x0, top, w, h); c.strokeStyle = `rgba(${rgb},.6)`; c.strokeRect(x0, top, w, h);
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${rgb},.2)`; c.fillRect(x0 + w * .08, top + 8, w * .05, h - 16);
  c.restore();
};
// draw something with a mirror reflection on a glossy floor at floorY
const P = mk(), Pc = P.getContext('2d'), Q = mk(), Qc = Q.getContext('2d');
L.reflect = (c, floorY, draw, alpha = .32, len = 520) => {
  Pc.setTransform(1, 0, 0, 1, 0, 0); Pc.clearRect(0, 0, W, H); Pc.save(); Pc.setTransform(c.getTransform()); draw(Pc); Pc.restore();
  const m = c.getTransform(), fy = m.d * floorY + m.f;               // floor line in screen space
  Qc.setTransform(1, 0, 0, 1, 0, 0); Qc.clearRect(0, 0, W, H); Qc.globalCompositeOperation = 'source-over';
  Qc.save(); Qc.translate(0, 2 * fy); Qc.scale(1, -1); Qc.drawImage(P, 0, 0); Qc.restore();
  const g = Qc.createLinearGradient(0, fy, 0, fy + len * m.d); g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  Qc.globalCompositeOperation = 'destination-in'; Qc.fillStyle = g; Qc.fillRect(0, 0, W, H); Qc.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(Q, 0, 0); c.drawImage(P, 0, 0); c.restore();
};
// diagonal light band moving across, clipped by the caller's current clip
L.sweep = (c, p, a = .5, width = 160, rgb = '255,255,255') => {
  if (p <= 0 || p >= 1) return;
  const x = -400 + p * (W + 800);
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, H / 2); c.rotate(.35);
  const g = c.createLinearGradient(-width, 0, width, 0); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.5, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(-width, -H * 1.5, width * 2, H * 3); c.restore();
};
L.dust = (c, t, seed, n, rgb, a = .5) => {
  const r = rng(seed);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W, sp = 20 + r() * 50, y = H - ((r() * H + t * sp) % H), s = 1.5 + r() * 3.5, ph = r() * 6;
    c.fillStyle = `rgba(${rgb},${a * (.4 + .6 * Math.abs(Math.sin(t * 1.5 + ph)))})`;
    c.beginPath(); c.arc(x + Math.sin(t * .5 + ph) * 20, y, s, 0, 7); c.fill();
  }
  c.restore();
};
L.text = (c, s, x, y, o = {}) => {
  c.save(); c.globalAlpha = clamp(o.alpha ?? 1); c.textAlign = o.align || 'center'; c.textBaseline = 'alphabetic';
  c.font = `${o.style || ''} ${o.weight || 400} ${o.size || 60}px ${o.font || L.SERIF}`; c.letterSpacing = (o.spacing || 0) + 'px';
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur ?? 30; }
  if (o.gold) { const g = c.createLinearGradient(0, y - o.size, 0, y + o.size * .2); g.addColorStop(0, '#fff3c4'); g.addColorStop(.45, '#e5b85a'); g.addColorStop(.55, '#a8731f'); g.addColorStop(1, '#f6d98a'); c.fillStyle = g; }
  else c.fillStyle = o.color || '#fff';
  c.fillText(s, x, y); c.restore();
};
// animated reveal: letters rise and fade in one by one
L.reveal = (c, s, x, y, p, o = {}) => {
  if (p <= 0) return;
  c.save(); c.font = `${o.style || ''} ${o.weight || 400} ${o.size || 60}px ${o.font || L.SERIF}`; c.letterSpacing = (o.spacing || 0) + 'px';
  const total = c.measureText(s).width; let cx = x - total / 2; const n = s.length;
  for (let i = 0; i < n; i++) {
    const ch = s[i], w = c.measureText(ch).width, q = ss((p * (n + 6) - i) / 6);
    L.text(c, ch, cx + w / 2, y + (1 - q) * (o.size || 60) * .4, { ...o, alpha: q, spacing: 0 });
    cx += w;                                            // measureText already includes letterSpacing
  }
  c.restore();
};

// ---------------- runner ----------------
L.run = def => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const o = cv.getContext('2d'), scC = mk(), sc = scC.getContext('2d'), blC = mk(W / 2, H / 2), bl = blC.getContext('2d');
  const grain = [0, 1, 2, 3].map(i => { const g = mk(512, 512), x = g.getContext('2d'), id = x.createImageData(512, 512), r = rng(900 + i); for (let k = 0; k < id.data.length; k += 4) { const v = 128 + (r() - .5) * 180; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } x.putImageData(id, 0, 0); return o.createPattern(g, 'repeat'); });
  const DUR = def.DUR;
  function render(t) {
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.filter = 'none'; o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
    def.shots.forEach((s, i) => {
      if (t < s.a || t > s.b) return;
      sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalAlpha = 1; sc.globalCompositeOperation = 'source-over'; sc.filter = 'none'; sc.letterSpacing = '0px';
      sc.clearRect(0, 0, W, H); sc.save(); s.f(sc, t - s.a, s.b - s.a); sc.restore();
      o.globalAlpha = i === 0 ? 1 : ss((t - s.a) / .4); o.drawImage(scC, 0, 0); o.globalAlpha = 1;
    });
    bl.clearRect(0, 0, W / 2, H / 2); bl.filter = 'blur(12px) brightness(1.05) contrast(2)'; bl.drawImage(cv, 0, 0, W / 2, H / 2); bl.filter = 'none';
    o.globalCompositeOperation = 'screen'; o.globalAlpha = def.bloom ?? .4; o.drawImage(blC, 0, 0, W, H);
    o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
    const vg = o.createRadialGradient(W / 2, H / 2, H * .28, W / 2, H / 2, H * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
    o.fillStyle = vg; o.fillRect(0, 0, W, H);
    o.save(); o.globalCompositeOperation = 'overlay'; o.globalAlpha = .07; o.fillStyle = grain[Math.floor(t * FPS) % 4];
    o.translate(-((t * 997) % 512), -((t * 577) % 512)); o.fillRect(0, 0, W + 512, H + 512); o.restore();
    o.globalAlpha = Math.max(1 - ss(t / .5), ss(seg(t, DUR - .7, DUR))); o.fillStyle = '#000'; o.fillRect(0, 0, W, H); o.globalAlpha = 1;
  }
  window.FILM = { W, H, FPS, DUR, render, frame: (t, q = .92) => { render(t); return cv.toDataURL('image/jpeg', q); } };
  window.ready = true;
  if (!location.search.includes('render')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
};
})();
