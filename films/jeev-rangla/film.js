// film.js · "जीव रंगला" lyric Short in Urban Sketch · Pen & Wash. 1080×1920, 22.73 s (the supplied song clip).
// One tall sketchbook page with four drawings, one per sung line: sepia fineliner draws in stroke order, then
// transparent washes bloom from a source with a ragged wet front; the lyric is handwritten in the margin as it is sung.
import { makeTextures, paperSheet, mulberry, hash, clamp, lerp } from './silk.js';

export const DUR = 22.73;
const W = 1080, H = 1920, PANEL = 1700, SEPIA = '#3B2618', PAPER = '#F4ECDC', VIOLET = '#6E6488';
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const FH = 'Kalam';
// sung lines: [start, mid-split, end] and the two halves
const LINES = [
  { t: [0.2, 3.0, 6.0], a: 'जीव दंगला गुंगला रंगला', b: 'असा पिरमाची आस तू' },
  { t: [6.0, 8.75, 11.8], a: 'जीव लागला लाभला ध्यास ह्यो', b: 'तुझा गहिवरला श्वास तू' },
  { t: [11.8, 14.45, 17.55], a: 'पैलतीरा नेशील साथ मला देशील', b: 'काळीज माझं तू' },
  { t: [17.55, 20.1, 22.73], a: 'सुख भरतीला आलं नभं धरतीला आलं', b: 'पुनवंचा चांद तू' },
];
let ctx, T, SC = [];

// ---------------- pen strokes ----------------
// a stroke is a polyline in panel coords; at setup it gets wobble, overshoot and an occasional gap, and its length.
function stroke(pts, o = {}) {
  const r = mulberry(o.seed ?? Math.floor(hash(pts[0][0] * .13 + pts[0][1] * .71) * 1e6));
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {                          // resample to ~8 px steps
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8));
    for (let k = 0; k < n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  out.push(pts[pts.length - 1].slice());
  if (out.length > 2 && !o.closed) {                                  // overshoot both ends by 3–8 px
    const ext = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy) || 1, e = 3 + r() * 5; return [a[0] + dx / L * e, a[1] + dy / L * e]; };
    out.unshift(ext(out[0], out[1])); out.push(ext(out[out.length - 1], out[out.length - 2]));
  }
  const ph = r() * 100, amp = o.wob ?? 1.1;
  const P = out.map(([x, y], i) => [x + Math.sin(i * .37 + ph) * amp + (r() - .5) * .6, y + Math.cos(i * .29 + ph) * amp + (r() - .5) * .6]);
  let L = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(L); }
  const gap = L > 160 && r() < .45 ? [L * (.3 + r() * .4), 6 + r() * 6] : null;
  return { P, cum, L, w: o.w ?? 2.4, fig: !!o.fig, gap };
}
function drawStrokes(list, p, t) {                                    // draw the first p (0..1) of the total ink length, in order
  const total = list.reduce((s, k) => s + k.L, 0); let left = total * p;
  ctx.strokeStyle = SEPIA; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const k of list) {
    if (left <= 0) break; const upto = Math.min(k.L, left); left -= k.L;
    const boil = k.fig ? Math.floor(t * 12) : 0;
    ctx.lineWidth = k.w; ctx.beginPath(); let pen = false;
    for (let i = 0; i < k.P.length; i++) {
      if (k.cum[i] > upto) break;
      const inGap = k.gap && k.cum[i] > k.gap[0] && k.cum[i] < k.gap[0] + k.gap[1];
      let [x, y] = k.P[i]; if (boil) { x += (hash(i * 3.1 + boil) - .5) * 1.4; y += (hash(i * 5.7 + boil) - .5) * 1.4; }
      if (inGap) { pen = false; continue; }
      pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
    }
    ctx.stroke();
  }
  return total;
}
// ---------------- washes ----------------
// wash = { path, color, a, src:[x,y], t0, d }: revealed by a noisy circle growing from src; misregistered; darker dried edge
function noisyCircle(cx, cy, R, seed) { const p = new Path2D(); for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, n = .82 + .3 * (Math.sin(a * 5 + seed) * .5 + Math.sin(a * 11 + seed * 2) * .3 + hash(i + seed) * .4); i ? p.lineTo(cx + Math.cos(a) * R * n, cy + Math.sin(a) * R * n) : p.moveTo(cx + Math.cos(a) * R * n, cy + Math.sin(a) * R * n); } p.closePath(); return p; }
function drawWash(w, lt) {
  const u = seg(lt, w.t0, w.t0 + w.d); if (u <= 0) return;
  ctx.save(); ctx.translate(w.off?.[0] ?? 2.5, w.off?.[1] ?? 1.5);
  if (u < 1) ctx.clip(noisyCircle(w.src[0], w.src[1], 60 + ss(u) * (w.R || 1400), w.seed || 3));
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = w.a; ctx.fillStyle = w.color; ctx.fill(w.path, w.rule || 'nonzero');
  ctx.globalAlpha = w.a * .55; ctx.save(); ctx.clip(w.path, w.rule || 'nonzero'); ctx.strokeStyle = w.color; ctx.lineWidth = 6; ctx.stroke(w.path); ctx.restore();   // dried edge
  if (u < 1) { ctx.save(); ctx.clip(w.path, w.rule || 'nonzero'); ctx.globalAlpha = w.a * .5; ctx.lineWidth = 14; ctx.strokeStyle = w.color; ctx.stroke(noisyCircle(w.src[0], w.src[1], 60 + ss(u) * (w.R || 1400), w.seed || 3)); ctx.restore(); }  // wet front, inside the shape only
  ctx.restore();
}
// ---------------- shape helpers ----------------
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const P2 = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
const blob = (cx, cy, rx, ry, seed, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI * 2, k = .85 + .25 * hash(i * 1.7 + seed); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
const scallop = (cx, cy, rx, ry, seed) => { const pts = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI * 1.15 - .1, k = .9 + .2 * hash(i + seed); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return pts; };
const U = list => { const p = new Path2D(); list.forEach(q => p.addPath(q)); return p; };
function figure(x, base, s, kind) {                                    // a sketched person: head mass, body, legs; faces blank
  const h = 300 * s, S = [];
  if (kind === 'woman') {
    S.push(arc(x, base - h * .9, h * .07, h * .075, 0, Math.PI * 2, 16));
    S.push([[x - h * .1, base - h * .95], [x - h * .14, base - h * .7], [x - h * .2, base - h * .35], [x - h * .24, base]]);   // padar over head and back
    S.push([[x + h * .06, base - h * .82], [x + h * .1, base - h * .55], [x + h * .16, base - h * .25], [x + h * .2, base]]);
    S.push([[x - h * .24, base], [x + h * .2, base]]);
    S.push([[x - h * .05, base - h * .6], [x + h * .15, base - h * .45]]);                                                     // arm toward the diya
  } else {
    S.push(arc(x, base - h * .9, h * .07, h * .075, 0, Math.PI * 2, 16));
    S.push([[x - h * .1, base - h * .95], [x - h * .02, base - h * 1.02], [x + h * .1, base - h * .97], [x + h * .14, base - h * .92]]);   // pheta
    S.push([[x - h * .1, base - h * .8], [x - h * .13, base - h * .4], [x - h * .08, base - h * .4]]);
    S.push([[x + h * .1, base - h * .8], [x + h * .13, base - h * .4], [x + h * .08, base - h * .4]]);
    S.push([[x - h * .07, base - h * .4], [x - h * .08, base]]); S.push([[x + h * .07, base - h * .4], [x + h * .08, base]]);
    S.push([[x + h * .05, base - h * .62], [x - h * .15, base - h * .47]]);
  }
  return S;
}
function figPath(x, base, s, kind) {
  const h = 300 * s;
  return kind === 'woman' ? P2([[x - h * .1, base - h * .97], [x + h * .08, base - h * .97], [x + h * .2, base], [x - h * .24, base]])
    : U([P2([[x - h * .12, base - h * .82], [x + h * .12, base - h * .82], [x + h * .1, base - h * .4], [x - h * .1, base - h * .4]]), P2([[x - h * .1, base - h * .4], [x + h * .1, base - h * .4], [x + h * .09, base], [x - h * .09, base]])]);
}

// ---------------- the four drawings (panel coords: drawing in y 180..1250, lyric margin 1280..1640) ----------------
function scene1() {   // village temple with a deepmal at sunrise
  const S = [], gy = 1180;
  S.push([[60, gy], [1020, gy]]);
  S.push(rect(380, gy - 120, 320, 120)); S.push(rect(420, gy - 300, 240, 180)); S.push([[420, gy - 300], [450, gy - 450], [500, gy - 560], [540, gy - 620], [580, gy - 560], [630, gy - 450], [660, gy - 300]]);
  for (let k = 1; k < 5; k++) S.push([[440 + k * 4, gy - 300 - k * 60], [640 - k * 4, gy - 300 - k * 60]]);
  S.push(arc(540, gy - 640, 18, 22, 0, Math.PI * 2, 12)); S.push([[540, gy - 662], [540, gy - 720], [590, gy - 705], [540, gy - 692]]);
  S.push([[505, gy], [505, gy - 90], [540, gy - 120], [575, gy - 90], [575, gy]]);
  S.push([[230, gy], [242, gy - 520], [258, gy - 520], [270, gy]]); for (let k = 0; k < 9; k++) { const y = gy - 60 - k * 52; S.push([[236 - (k % 2) * 4, y], [210, y - 8]]); S.push([[264 + (k % 2) * 4, y], [290, y - 8]]); }
  S.push(arc(250, gy - 540, 20, 14, Math.PI, Math.PI * 2, 10));
  S.push([[60, gy - 160], [140, gy - 230], [220, gy - 160]]); S.push(rect(75, gy - 160, 130, 160)); S.push(rect(115, gy - 90, 40, 90));
  S.push([[760, gy - 180], [860, gy - 260], [960, gy - 180]]); S.push(rect(775, gy - 180, 170, 180)); S.push(rect(820, gy - 100, 40, 100)); S.push(rect(890, gy - 140, 30, 30));
  S.push(scallop(900, gy - 420, 120, 100, 1)); S.push([[880, gy - 300], [886, gy - 190]]); S.push([[915, gy - 300], [912, gy - 185]]);
  S.push(arc(760, 420, 90, 90, 0, Math.PI * 2, 30));
  for (let k = 0; k < 4; k++) S.push([[150 + k * 50, 360 + k * 6], [170 + k * 50, 350 + k * 6], [190 + k * 50, 360 + k * 6]]);
  const st = S.map(p => stroke(p));
  const sky = P2([[40, 160], [1040, 160], [1040, gy], [40, gy]]);
  const W8 = [
    { path: sky, color: '#F2C27A', a: .45, src: [760, 420], t0: 1.6, d: 2.2, seed: 1 },
    { path: P2(arc(760, 420, 90, 90, 0, Math.PI * 2, 30)), color: '#E8833A', a: .6, src: [760, 420], t0: 1.4, d: .8, R: 300, seed: 2 },
    { path: P2([[420, gy - 300], [450, gy - 450], [540, gy - 620], [630, gy - 450], [660, gy - 300], [660, gy - 120], [700, gy - 120], [700, gy], [380, gy], [380, gy - 120], [420, gy - 120]]), color: '#D8B98A', a: .55, src: [540, gy - 300], t0: 2.0, d: 1.6, seed: 3 },
    { path: P2([[540, gy - 662], [540, gy - 720], [590, gy - 705], [540, gy - 692]]), color: '#D9442F', a: .8, src: [560, gy - 700], t0: 2.4, d: .5, R: 200, seed: 4 },
    { path: P2([[230, gy], [242, gy - 520], [258, gy - 520], [270, gy]]), color: '#9A8C7A', a: .5, src: [250, gy - 300], t0: 2.2, d: 1.2, seed: 5 },
    { path: U([P2([[60, gy - 160], [140, gy - 230], [220, gy - 160]]), P2([[760, gy - 180], [860, gy - 260], [960, gy - 180]])]), color: '#B8483E', a: .6, src: [500, gy - 200], t0: 2.3, d: 1.4, seed: 6 },
    { path: P2(blob(900, gy - 420, 125, 105, 7)), color: '#7FA04A', a: .55, src: [900, gy - 420], t0: 2.5, d: 1.2, R: 400, seed: 7 },
    { path: P2([[40, gy - 10], [1040, gy - 10], [1040, gy + 40], [40, gy + 40]]), color: '#C9A06A', a: .5, src: [540, gy], t0: 2.6, d: 1.2, seed: 8 },
  ];
  const lamps = []; for (let k = 0; k < 9; k++) { const y = gy - 60 - k * 52; lamps.push([210, y - 10], [290, y - 10]); }
  return { st, W8, lamps, lampT: 3.4, note: 'गावची पहाट' };
}
function scene2() {   // the couple at the temple gate, a diya between them
  const S = [], gy = 1200;
  for (let k = 0; k < 4; k++) S.push([[180 - k * 30, gy + k * 18 - 54], [900 + k * 30, gy + k * 18 - 54]]);
  S.push([[260, gy - 54], [260, gy - 700]]); S.push([[820, gy - 54], [820, gy - 700]]); S.push(arc(540, gy - 700, 280, 200, Math.PI, Math.PI * 2, 30));
  S.push([[230, gy - 700], [850, gy - 700]]); S.push(rect(220, gy - 760, 640, 60));
  const toran = []; for (let k = 0; k <= 16; k++) toran.push([300 + k * 30, gy - 690 + Math.sin(k / 16 * Math.PI) * 50]); S.push(toran);
  const F = [...figure(430, gy - 54, 1.9, 'woman'), ...figure(660, gy - 54, 2.0, 'man')];
  S.push(...F.map(p => p));
  S.push(arc(545, gy - 300, 28, 12, 0, Math.PI, 10)); S.push([[545, gy - 312], [538, gy - 340], [545, gy - 360], [552, gy - 340], [545, gy - 312]]);
  const st = S.map((p, i) => stroke(p, { fig: i >= 24 && i < 24 + F.length, w: i >= 24 ? 2.8 : 2.4 }));
  const W8 = [
    { path: P2([[60, 160], [1020, 160], [1020, gy], [60, gy]]), color: '#E9B8A0', a: .3, src: [545, gy - 340], t0: 1.8, d: 2.0, seed: 11 },
    { path: U([P2(rect(230, gy - 700, 60, 646)), P2(rect(790, gy - 700, 60, 646)), P2(rect(220, gy - 760, 640, 60))]), color: '#C9A46E', a: .55, src: [540, gy - 730], t0: 1.6, d: 1.6, seed: 12 },
    { path: figPath(430, gy - 54, 1.9, 'woman'), color: '#C0322B', a: .65, src: [430, gy - 300], t0: 2.0, d: 1.0, R: 600, seed: 13 },
    { path: P2([[660 - 76, gy - 54 - 600 * .97 * 1.02], [660 + 76, gy - 54 - 600 * .97 * 1.02], [660 + 50, gy - 54 - 600 * .9], [660 - 50, gy - 54 - 600 * .9]]), color: '#E8833A', a: .7, src: [660, gy - 620], t0: 2.2, d: .6, R: 300, seed: 14 },
    { path: P2(arc(545, gy - 335, 70, 70, 0, Math.PI * 2, 24)), color: '#F5C542', a: .55, src: [545, gy - 335], t0: 2.4, d: .8, R: 300, seed: 15 },
    { path: P2([...toran, [810, gy - 690], [300, gy - 690]]), color: '#E89A2A', a: .7, src: [540, gy - 650], t0: 2.6, d: .9, R: 500, seed: 16 },
  ];
  return { st, W8, lamps: [[545, gy - 345]], lampT: 2.4, note: 'देवळाच्या पायरीवर' };
}
function scene3() {   // the boat to the other shore, at dusk
  const S = [], wy = 820;
  S.push([[60, wy], [1020, wy]]);
  S.push([[60, wy - 40], [200, wy - 70], [330, wy - 50], [480, wy - 80], [640, wy - 55], [800, wy - 75], [1020, wy - 45]]);
  S.push(scallop(260, wy - 70, 60, 50, 2)); S.push(scallop(740, wy - 80, 70, 55, 3)); S.push([[880, wy - 50], [895, wy - 130], [910, wy - 50]]);
  for (let k = 0; k < 14; k++) { const y = wy + 60 + k * 30, x = 100 + hash(k) * 700; S.push([[x, y], [x + 60 + hash(k + 9) * 80, y]]); }
  S.push([[300, 1000], [380, 1060], [700, 1060], [800, 1000]]); S.push([[300, 1000], [800, 1000]]);
  S.push([[760, 1000], [690, 660]]);
  const F = [...figure(450, 1000, .9, 'woman'), ...figure(700, 1000, 1.0, 'man')];
  S.push(...F);
  for (let k = 0; k < 3; k++) S.push([[420 + k * 70, 380 + k * 20], [440 + k * 70, 368 + k * 20], [460 + k * 70, 380 + k * 20]]);
  const st = S.map((p, i) => stroke(p, { fig: i >= S.length - 3 - F.length && i < S.length - 3 }));
  const W8 = [
    { path: P2([[40, 160], [1040, 160], [1040, wy], [40, wy]]), color: '#E9A3A0', a: .35, src: [540, wy - 100], t0: 1.6, d: 2.0, seed: 21 },
    { path: P2([[40, 160], [1040, 160], [1040, 480], [40, 480]]), color: '#8E86B8', a: .3, src: [540, 200], t0: 2.0, d: 1.8, seed: 22 },
    { path: P2([[40, wy], [1040, wy], [1040, 1250], [40, 1250]]), color: '#6F9DB5', a: .5, src: [540, 1030], t0: 1.8, d: 1.8, seed: 23 },
    { path: P2([[60, wy], [60, wy - 40], [200, wy - 70], [330, wy - 50], [480, wy - 80], [640, wy - 55], [800, wy - 75], [1020, wy - 45], [1020, wy]]), color: '#7E8C76', a: .5, src: [540, wy - 50], t0: 2.2, d: 1.2, seed: 24 },
    { path: P2([[300, 1000], [380, 1060], [700, 1060], [800, 1000]]), color: '#8A5A3A', a: .65, src: [550, 1030], t0: 2.4, d: .8, R: 500, seed: 25 },
    { path: figPath(450, 1000, .9, 'woman'), color: '#C0322B', a: .6, src: [450, 900], t0: 2.6, d: .6, R: 300, seed: 26 },
  ];
  return { st, W8, lamps: [], note: 'नदीकाठी, संध्याकाळ' };
}
function scene4() {   // full moon over the river, the couple on the bank
  const S = [], wy = 900, M = [700, 470, 150];
  S.push(arc(M[0], M[1], M[2], M[2], 0, Math.PI * 2, 40));
  S.push([[60, wy], [1020, wy]]);
  for (let k = 0; k < 9; k++) S.push([[M[0] - 70 + hash(k) * 40, wy + 40 + k * 32], [M[0] + 10 + hash(k + 4) * 80, wy + 40 + k * 32]]);
  S.push([[60, 1120], [300, 1090], [520, 1110], [1020, 1080]]);
  S.push(scallop(230, 760, 170, 150, 4)); S.push([[210, 900], [214, 1100]]); S.push([[250, 900], [246, 1095]]);
  const F = [...figure(400, 1105, .95, 'woman'), ...figure(470, 1100, 1.0, 'man')];
  S.push(...F);
  const st = S.map((p, i) => stroke(p, { fig: i >= S.length - F.length }));
  const night = new Path2D(); night.rect(40, 160, 1000, wy - 160); night.moveTo(M[0] + M[2] + 4, M[1]); night.arc(M[0], M[1], M[2] + 4, 0, Math.PI * 2, true);
  const W8 = [
    { path: night, color: '#3E4C7E', a: .55, src: [M[0], M[1]], t0: 1.4, d: 2.2, rule: 'nonzero', seed: 31 },
    { path: night, color: '#2C3560', a: .35, src: [540, 160], t0: 2.2, d: 1.8, seed: 32 },
    { path: P2(arc(M[0], M[1], M[2] + 40, M[2] + 40, 0, Math.PI * 2, 40)), color: '#F1D58A', a: .35, src: [M[0], M[1]], t0: 1.6, d: 1.0, R: 400, seed: 33 },
    { path: P2([[40, wy], [1040, wy], [1040, 1120], [40, 1120]]), color: '#35507A', a: .55, src: [M[0], wy + 100], t0: 1.8, d: 1.6, seed: 34 },
    { path: P2(blob(230, 780, 175, 150, 8)), color: '#2E4A38', a: .6, src: [230, 780], t0: 2.2, d: 1.0, R: 400, seed: 35 },
    { path: P2([[40, 1100], [1040, 1070], [1040, 1250], [40, 1250]]), color: '#4A4060', a: .5, src: [540, 1150], t0: 2.4, d: 1.0, seed: 36 },
  ];
  return { st, W8, lamps: [], stars: true, note: 'पुनवेची रात' };
}

// ---------------- setup / render ----------------
export function setup(canvas) {
  ctx = canvas.getContext('2d'); canvas.width = W; canvas.height = H; T = makeTextures(PAPER, 23);
  SC = [scene1(), scene2(), scene3(), scene4()];
  return { dur: DUR, ev: [] };
}
function camAt(t) {                                                  // pan down the page at each line; slow push inside a panel
  let y = 0, z = 1.0;
  LINES.forEach((L, i) => { const u = i === 0 ? 1 : ss(seg(t, L.t[0] - .35, L.t[0] + .35)); y = lerp(y, i * PANEL, u); });
  const i = LINES.findLastIndex(L => t >= L.t[0] - .35), L = LINES[Math.max(0, i)];
  z = 1.0 + .05 * seg(t, L.t[0], L.t[2]);
  return [y + 860, z];
}
function handwrite(text, x, y, size, p, col = SEPIA) {               // written on left to right, with the pen nib riding the front
  if (p <= 0) return;
  ctx.font = `700 ${size}px ${FH}`; let f = size; while (ctx.measureText(text).width > W - 140 && f > 30) { f -= 2; ctx.font = `700 ${f}px ${FH}`; }
  const w = ctx.measureText(text).width, x0 = x - w / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, y - f * 1.3, (w + 20) * p, f * 2); ctx.clip();
  ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x0, y); ctx.restore();
  if (p < 1) { ctx.fillStyle = SEPIA; ctx.beginPath(); ctx.arc(x0 + w * p, y - f * .3, 4, 0, 7); ctx.fill(); }
}
function frayMask(i) {                                               // the drawing frays into the page: a noisy region, dabs outside
  const p = new Path2D(), cx = 540, cy = 720, rx = 520, ry = 620;
  for (let k = 0; k <= 90; k++) { const a = k / 90 * Math.PI * 2, n = .9 + .12 * (Math.sin(a * 7 + i) * .5 + hash(k + i * 31)); k ? p.lineTo(cx + Math.cos(a) * rx * n * 1.08, cy + Math.sin(a) * ry * n) : p.moveTo(cx + Math.cos(a) * rx * n * 1.08, cy + Math.sin(a) * ry * n); }
  p.closePath(); return p;
}
export function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const [cy, z] = camAt(t);
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -cy);
  paperSheet(ctx, T, -100, -1200, W + 200, PANEL * 4 + 2400, .7);
  SC.forEach((S, i) => {
    const L = LINES[i], lt = t - L.t[0] + (i === 0 ? .2 : 0);       // scene clock (scene 1 starts drawing at 0)
    if (lt < -.4 && i > 0 && t < L.t[0] - .4) { return; }
    ctx.save(); ctx.translate(0, i * PANEL);
    // corner note: place and time, handwritten
    handwrite(S.note, 300, 130, 40, seg(lt, .1, .8), '#6B4A33');
    // washes under the ink, clipped to the fraying page region
    ctx.save(); ctx.clip(frayMask(i)); for (const w of S.W8) drawWash(w, lt);
    if (S.stars && lt > 2.6) { const r = mulberry(5); ctx.fillStyle = PAPER; for (let k = 0; k < 60; k++) { const x = 60 + r() * 960, y = 180 + r() * 600; if (Math.hypot(x - 700, y - 470) < 200) continue; ctx.globalAlpha = seg(lt, 2.6 + r(), 3.2 + r()); ctx.beginPath(); ctx.arc(x, y, 1.5 + r() * 2, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
    ctx.restore();
    // colour dabs spraying past the drawing's edge
    const r = mulberry(40 + i), cols = S.W8.map(w => w.color);
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, d = 1 + r() * .14, x = 540 + Math.cos(a) * 560 * d, y = 720 + Math.sin(a) * 640 * d; if (lt < 3 + r()) continue; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .35; ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.ellipse(x, y, 6 + r() * 14, 4 + r() * 9, r() * 3, 0, 7); ctx.fill(); ctx.restore(); }
    // ink: drawn in stroke order over the first ~3 s of the line
    drawStrokes(S.st, ss(seg(lt, 0, 3.0)) * .15 + seg(lt, 0, 3.0) * .85, t);
    // lamps: little flames once the colour has arrived (on twos)
    if (S.lamps.length && lt > S.lampT) for (const [x, y] of S.lamps) { const f = .8 + .4 * hash(Math.floor(t * 12) + x); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F5B342'; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(x, y - 6 * f, 6, 10 * f, 0, 0, 7); ctx.fill(); ctx.restore(); }
    // the lyric, handwritten in the margin as it is sung (two halves)
    const pa = seg(t, L.t[0], L.t[0] + (L.t[1] - L.t[0]) * .8), pb = seg(t, L.t[1], L.t[1] + (L.t[2] - L.t[1]) * .7);
    handwrite(L.a, 540, 1390, 70, pa); handwrite(L.b, 540, 1500, 74, pb, '#8E2A1E');
    if (pb > .9) { ctx.strokeStyle = '#C0322B'; ctx.lineWidth = 3; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(300, 1528); ctx.quadraticCurveTo(540, 1545 + 6 * Math.sin(i), 780, 1526); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.restore();
  });
  // the closing note on the last page
  if (t > 21.2) { ctx.save(); ctx.translate(0, 3 * PANEL); handwrite('— जीव रंगला · जोगवा (२००९)', 540, 1610, 38, seg(t, 21.2, 22.2), '#6B4A33'); ctx.restore(); }
  // paper grain over everything (granulation)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .35; const pat = ctx.createPattern(T.mottle, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
