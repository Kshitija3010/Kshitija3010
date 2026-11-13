// film.js — 1930s print: a rounded gate (4:3 in 16:9, 3:4 in 9:16), gate weave, flicker, scratches, dust, hair, vignette, a faint sepia tone.
// Adapted from the style demo's film.js (format-aware; sepia added).
import { hash, vnoise } from '/core/lib.js';
export function makeFilm(main, W, H, GATE) {
  const g = main.getContext('2d');
  const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
  return { g, scene, sg: scene.getContext('2d'), W, H, GATE };
}
export function post(F, t, o = {}) {
  const g = F.g, f = Math.floor(t * 24 + 1e-6), { W, H } = F, { x, y, w, h, r } = F.GATE;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const wx = (vnoise(t * 1.3) - .5) * 2.4 + (hash(f * 7.1) > .985 ? (hash(f) - .5) * 5 : 0);
  const wy = (vnoise(t * 1.1 + 40) - .5) * 2.6 + (hash(f * 3.3) > .985 ? (hash(f + 9) - .5) * 6 : 0) + (o.jump || 0);
  g.save(); g.beginPath(); g.roundRect(x + .5, y - 4, w - 1, h + 8, r); g.clip();
  g.filter = 'blur(0.55px) contrast(1.14) sepia(0.3)'; g.drawImage(F.scene, wx, wy); g.filter = 'none';
  if (!o.clean) {
    const fl = (hash(f * 1.618) - .5) * .08 + (vnoise(t * 3) - .5) * .04;
    g.fillStyle = fl > 0 ? `rgba(255,248,232,${fl})` : `rgba(0,0,0,${-fl})`; g.fillRect(x, y, w, h);
    const sg = Math.floor(t * 2.3);
    for (let i = 0; i < 3; i++) {
      if (hash(sg * 13.7 + i * 3.1) < .45) continue;
      const sx = x + hash(sg * 5.3 + i) * w + Math.sin(t * 7 + i) * 6, light = hash(sg + i * 9) > .4;
      g.strokeStyle = light ? 'rgba(245,238,222,.5)' : 'rgba(12,10,8,.45)'; g.lineWidth = .8 + hash(sg * 2 + i) * 1.4;
      g.beginPath(); const y0 = y + hash(sg * 3 + i) * h * .5; g.moveTo(sx, y0); g.lineTo(sx + (hash(f + i) - .5) * 3, y0 + h * (.4 + hash(sg + i * 5) * .6)); g.stroke();
    }
    const nd = 3 + Math.floor(hash(f * 2.7) * 6);
    for (let i = 0; i < nd; i++) {
      const dx = x + hash(f * 11.1 + i * 1.7) * w, dy = y + hash(f * 17.3 + i * 2.9) * h, rr = .8 + hash(f + i * 4.4) * 2.8, dark = hash(f * 1.3 + i) > .35;
      g.fillStyle = dark ? 'rgba(14,12,10,.75)' : 'rgba(250,244,232,.7)'; g.beginPath(); g.ellipse(dx, dy, rr * (1 + hash(i + f) * 1.5), rr, hash(i * 3 + f) * 3, 0, 7); g.fill();
    }
    if (hash(Math.floor(t * 1.5) * 9.9) > .82) {
      const s0 = Math.floor(t * 1.5), hx = x + hash(s0 * 2.2) * w, hy = y + hash(s0 * 4.4) * h;
      g.strokeStyle = 'rgba(15,13,11,.6)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(hx, hy);
      for (let i = 1; i <= 8; i++) g.lineTo(hx + i * 7 + Math.sin(i * 1.3 + s0) * 8, hy + Math.sin(i * .9 + s0 * 2) * 10 + i * 3);
      g.stroke();
    }
  }
  const cx = x + w / 2, cy = y + h / 2, R = Math.max(w, h);
  const vg = g.createRadialGradient(cx, cy, R * .27, cx, cy, R * .63);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.7, 'rgba(0,0,0,.18)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
  g.fillStyle = vg; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 14; g.filter = 'blur(6px)'; g.beginPath(); g.roundRect(x, y - 4, w, h + 8, r); g.stroke(); g.filter = 'none';
  g.restore();
}
