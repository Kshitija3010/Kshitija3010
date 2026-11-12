// emblems.js · the 12 rashi emblems as flat silhouettes (one Path2D each, in a 1000×1000 box, centre 500,500),
// plus stylised constellation star patterns (0..1 box). Shapes are original, drawn for this series.
const D2R = Math.PI / 180;
export function poly(pts) { let A = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; A += x0 * y1 - x1 * y0; } if (A < 0) pts = pts.slice().reverse(); const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; }
export function circ(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; }
export function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; }
export function bar(x0, y0, x1, y1, w) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2; return poly([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]); }
function U(list) { const p = new Path2D(); for (const q of list) p.addPath(q); return p; }
// a thick polyline: bars + round joints (all one ink, nonzero fill)
export function thick(pts, w) { const out = []; for (let i = 0; i < pts.length - 1; i++) out.push(bar(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w)); for (const q of pts) out.push(circ(q[0], q[1], w / 2)); return U(out); }
const arcPts = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * D2R; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const spiral = (cx, cy, r0, r1, a0, turns, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (a0 + 360 * turns * t) * D2R, r = r0 + (r1 - r0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const legs = (xs, y0, y1, w) => xs.map(x => poly([[x - w / 2, y0], [x + w / 2, y0], [x + w * .4, y1], [x - w * .4, y1]]));

function ram() {
  return U([ell(470, 560, 240, 140), ...[330, 410, 490, 570].map((x, i) => circ(x, 440 + (i % 2) * 8, 62)), circ(250, 520, 70),
    ell(735, 450, 85, 62, -.3), poly([[790, 430], [880, 470], [870, 500], [780, 500]]),
    thick(spiral(690, 400, 105, 22, 200, 1.35), 46), ...legs([330, 410, 560, 630], 650, 860, 46), poly([[225, 520], [180, 500], [185, 560]])]);
}
function bull() {
  return U([ell(460, 570, 250, 150), circ(360, 470, 95), poly([[660, 440], [800, 460], [840, 540], [800, 620], [730, 640], [670, 560]]), ell(810, 600, 46, 34),
    thick([[700, 455], [660, 390], [600, 365]], 30), thick([[780, 462], [830, 395], [890, 375]], 30), poly([[690, 470], [640, 440], [660, 500]]),
    ...legs([320, 400, 550, 630], 660, 870, 52), thick([[215, 540], [170, 640], [180, 720]], 16), circ(180, 732, 22)]);
}
function twins() {
  const fig = x => U([circ(x, 250, 62), poly([[x - 70, 330], [x + 70, 330], [x + 100, 700], [x - 100, 700]]), ...legs([x - 45, x + 45], 690, 900, 50), thick([[x - 70, 360], [x - 120, 560]], 34)]);
  return U([fig(360), fig(640), thick([[420, 380], [500, 470], [580, 380]], 34)]);
}
function crab() {
  const claw = s => U([thick([[500 + s * 160, 520], [500 + s * 250, 400], [500 + s * 270, 330]], 40),
    (() => { const p = new Path2D(); const cx = 500 + s * 280, cy = 270; p.arc(cx, cy, 80, s > 0 ? -2.4 : -0.75, s > 0 ? 2.0 : 3.9, s < 0); p.lineTo(cx, cy); p.closePath(); return p; })()]);
  const lg = s => [0, 1, 2].map(i => thick([[500 + s * 170, 600 + i * 40], [500 + s * (290 + i * 15), 640 + i * 50], [500 + s * (330 + i * 20), 760 + i * 30]], 26));
  return U([ell(500, 590, 210, 135), claw(1), claw(-1), ...lg(1), ...lg(-1), thick([[450, 470], [440, 400]], 16), thick([[550, 470], [560, 400]], 16), circ(440, 395, 18), circ(560, 395, 18)]);
}
function lion() {
  const mane = []; for (let i = 0; i < 24; i++) { const a = i * 15 * D2R, r = i % 2 ? 140 : 175; mane.push([300 + Math.cos(a) * r, 430 + Math.sin(a) * r]); }
  return U([ell(560, 590, 250, 120), poly(mane), circ(300, 440, 100), poly([[220, 470], [160, 500], [210, 520]]),
    ...legs([380, 450, 640, 720], 650, 880, 50), thick([[800, 580], [880, 520], [900, 420]], 22), ell(905, 400, 30, 45)]);
}
function maiden() {
  const grains = []; for (let i = 0; i < 7; i++) { grains.push(ell(690 - 14, 170 + i * 30, 13, 22, -.4)); grains.push(ell(690 + 14, 170 + i * 30, 13, 22, .4)); }
  return U([circ(470, 220, 58), poly([[430, 200], [520, 190], [560, 420], [380, 420]]), poly([[410, 290], [530, 290], [660, 900], [280, 900]]),
    thick([[520, 340], [600, 390], [680, 330]], 34), bar(690, 620, 690, 150, 14), ...grains, ell(690, 130, 12, 26)]);
}
function scales() {
  const pan = x => { const p = new Path2D(); p.moveTo(x - 140, 600); p.ellipse(x, 600, 140, 60, 0, 0, Math.PI); p.closePath(); return U([p, bar(x, 330, x - 120, 600, 10), bar(x, 330, x + 120, 600, 10)]); };
  return U([bar(500, 250, 500, 820, 34), poly([[380, 900], [620, 900], [560, 820], [440, 820]]), bar(170, 330, 830, 330, 26), circ(500, 230, 34), circ(170, 330, 22), circ(830, 330, 22), pan(170), pan(830)]);
}
function scorpion() {
  const seg = []; for (let i = 0; i < 5; i++) seg.push(ell(300 + i * 75, 620, 60, 48));
  const tail = spiral(760, 430, 210, 120, 95, -.55, 10);
  const tailSegs = tail.map((q, i) => circ(q[0], q[1], 40 - i * 2));
  const end = tail[tail.length - 1];
  const claw = s => U([thick([[260, 600 + s * 20], [180, 560 + s * 70], [130, 470 + s * 160]], 30), ell(120, 440 + s * 170, 50, 32, s * .6)]);
  const lg = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) lg.push(thick([[330 + i * 60, 620], [350 + i * 60, 620 + s * 90], [330 + i * 60, 620 + s * 160]], 18));
  return U([...seg, ...tailSegs, poly([[end[0] - 20, end[1] - 20], [end[0] - 110, end[1] + 30], [end[0] - 10, end[1] + 30]]), claw(-1), claw(1), ...lg]);
}
function archer() {
  return U([circ(400, 290, 55), poly([[350, 350], [460, 350], [500, 600], [340, 620]]), poly([[340, 600], [520, 600], [640, 780], [600, 820], [470, 690], [380, 690]]),
    poly([[360, 640], [420, 690], [330, 880], [260, 880]]), bar(260, 870, 380, 880, 30), thick([[450, 400], [560, 440], [640, 440]], 30), thick([[430, 410], [520, 470]], 28),
    thick(arcPts(560, 440, 240, -62, 62), 22), bar(560 + Math.cos(-62 * D2R) * 240, 440 + Math.sin(-62 * D2R) * 240, 560 + Math.cos(62 * D2R) * 240, 440 + Math.sin(62 * D2R) * 240, 6),
    bar(380, 440, 880, 440, 10), poly([[880, 410], [950, 440], [880, 470]]), poly([[380, 440], [340, 415], [350, 440], [340, 465]])]);
}
function makara() {
  const body = [[260, 520], [360, 560], [480, 560], [580, 520], [660, 470], [740, 470], [800, 520]];
  return U([poly([[90, 470], [150, 420], [280, 440], [330, 500], [300, 580], [180, 560], [100, 540]]), thick([[95, 470], [60, 400], [90, 350]], 26),
    circ(230, 470, 0.1), thick(body, 110), thick(spiral(800, 640, 120, 40, 270, .9), 40),
    poly([[700, 470], [740, 360], [780, 470]]), poly([[480, 600], [520, 700], [560, 600]]), ...legs([380, 520], 600, 760, 40)]);
}
function pot() {
  const p = new Path2D(); p.ellipse(390, 470, 150, 140, -.5, 0, Math.PI * 2);
  const waves = []; for (let k = 0; k < 4; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([520 + t * 380, 400 + k * 46 + t * t * 380 + Math.sin(t * 9 + k) * 14]); } waves.push(thick(pts, 22)); }
  return U([p, bar(470, 360, 560, 290, 80), ell(585, 268, 62, 30, -.6), ...waves, poly([[300, 610], [460, 610], [430, 660], [330, 660]])]);
}
function fish() {
  const f = (x, y, dir) => U([poly([[x - dir * 170, y], [x - dir * 60, y - 85], [x + dir * 90, y - 60], [x + dir * 160, y], [x + dir * 90, y + 60], [x - dir * 60, y + 85]]),
    poly([[x + dir * 150, y], [x + dir * 250, y - 80], [x + dir * 230, y], [x + dir * 250, y + 80]])]);
  return U([f(330, 330, 1), f(670, 670, -1), thick([[580, 330], [700, 420], [600, 520], [420, 590], [400, 670]], 14)]);
}
const MAKERS = { ram, bull, twins, crab, lion, maiden, scales, scorpion, archer, makara, pot, fish };
const CACHE = {};
export function emblem(name) { return CACHE[name] || (CACHE[name] = MAKERS[name]()); }

// stylised constellation patterns: stars [x,y] in 0..1 and lines as index pairs
export const CONST = {
  mesh: { s: [[.12, .62], [.5, .4], [.63, .44], [.68, .55]], l: [[0, 1], [1, 2], [2, 3]] },
  vrishabh: { s: [[.08, .12], [.36, .45], [.46, .55], [.52, .5], [.56, .62], [.72, .46], [.92, .2], [.14, .76], [.18, .72], [.2, .79], [.16, .82], [.23, .75]], l: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6]] },
  mithun: { s: [[.3, .1], [.27, .42], [.2, .8], [.58, .14], [.56, .46], [.62, .84], [.42, .3]], l: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 6], [6, 4]] },
  kark: { s: [[.3, .15], [.48, .48], [.72, .22], [.44, .9], [.52, .5]], l: [[0, 1], [1, 3], [1, 2]] },
  simha: { s: [[.22, .62], [.24, .46], [.34, .3], [.46, .3], [.52, .42], [.42, .5], [.82, .48], [.88, .68], [.42, .7]], l: [[4, 3], [3, 2], [2, 1], [1, 0], [0, 8], [8, 7], [7, 6], [6, 4]] },
  kanya: { s: [[.08, .3], [.28, .36], [.44, .46], [.6, .52], [.82, .72], [.5, .24], [.68, .28]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]] },
  tula: { s: [[.5, .15], [.26, .46], [.74, .44], [.2, .82], [.8, .76]], l: [[0, 1], [1, 3], [0, 2], [2, 4], [1, 2]] },
  vrishchik: { s: [[.1, .18], [.14, .36], [.1, .52], [.3, .38], [.44, .48], [.54, .64], [.6, .82], [.74, .9], [.88, .82], [.92, .7], [.84, .62]], l: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]] },
  dhanu: { s: [[.18, .52], [.34, .34], [.5, .28], [.66, .34], [.76, .56], [.6, .72], [.4, .72], [.86, .26]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [1, 6], [3, 7]] },
  makar: { s: [[.1, .3], [.3, .42], [.55, .64], [.8, .52], [.9, .3], [.62, .36], [.36, .26]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]] },
  kumbh: { s: [[.18, .2], [.34, .3], [.5, .24], [.6, .4], [.54, .6], [.7, .76], [.44, .82], [.3, .66]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7]] },
  meen: { s: [[.1, .14], [.2, .3], [.36, .56], [.5, .86], [.68, .62], [.84, .52], [.95, .56], [.9, .68], [.06, .04], [.16, .05]], l: [[8, 0], [9, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 5]] },
};
