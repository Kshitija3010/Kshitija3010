// film.js · Astroverse rashi series (silkscreen travel poster). One template, a new palette per rashi.
// ?r=<id>&f=h|v : 1920×1080 (h) or 1080×1920 Shorts (v). 84 BPM, 4/4: bar 2.857 s, 32 bars = 91.4 s.
// Shots: A hook (sky prints, logo stamp) → B constellation + emblem + seal → C the story print → D traits (four cards) → E follow card.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, bandSteps, ridgeLine,
  polyPath, circlePath, ringPath, rectPath, unionPath, mulberry, hash, clamp, lerp, hex2rgb, mix } from './engine/silk.js';
import { emblem, CONST, bar, thick } from './engine/emblems.js';

export const BPM = 84, B = 60 / BPM, BAR = 4 * B, DUR = +(32 * BAR).toFixed(3);
const bt = (bar, beat = 0) => +(bar * BAR + beat * B).toFixed(4);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const D2R = Math.PI / 180, BL = 60;
export const PAPER = '#F3EAD8';
const FD = 'Teko', FT = 'Poppins';
let W = 1920, H = 1080, F = 'h', L = null, R = null, ALL = [], ctx, T, CUES = [], NOCAP = false, LOGO = null, LOGOF = null, THUMB = false, PAL = null;

// ---------------- layouts ----------------
const LAY = {
  h: { W: 1920, H: 1080, hdr: { x: 104, y: 190, size: 140 }, chip: { x: 110, y: 262 }, bug: { x: 1805, y: 115, r: 78 },
    emb: { cx: 1030, cy: 470, s: 640 }, seal: { x: 1600, y: 600, r: 150 }, embC: { cx: 1300, cy: 610, s: 600 }, ground: [.80, .86, .91],
    cards: { cols: 4, x: 150, y: 370, w: 380, h: 400, gx: 40, gy: 0 }, ring: { x: 640, y: 480, R: 330, es: 120, lr: 225 },
    txt: { x: 1110, w: 700, bub: 210, fol: 640, nxt: 820 }, sub: { bottom: 0, w: 1640, fs: 42 } },
  v: { W: 1080, H: 1920, hdr: { x: 80, y: 330, size: 132 }, chip: { x: 86, y: 404 }, bug: { x: 960, y: 150, r: 80 },
    emb: { cx: 540, cy: 880, s: 640 }, seal: { x: 850, y: 1290, r: 135 }, embC: { cx: 560, cy: 1000, s: 600 }, ground: [.72, .77, .81],
    cards: { cols: 2, x: 70, y: 560, w: 450, h: 340, gx: 40, gy: 40 }, ring: { x: 540, y: 720, R: 290, es: 106, lr: 195 },
    txt: { x: 70, w: 940, bub: 1090, fol: 1280, nxt: 300 }, sub: { bottom: 360, w: 960, fs: 42 } },
};

// ---------------- colour ----------------
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function pickInk(bgs, cands, need = 3) { bgs = [].concat(bgs); for (const c of cands) if (c && bgs.every(b => contrast(c, b) >= need)) return c; return cands.slice().sort((a, b) => Math.min(...bgs.map(x => contrast(b, x))) - Math.min(...bgs.map(x => contrast(a, x))))[0]; }
const R2 = (s, amp) => [(hash(s * 3.1 + 1) - .5) * 2 * amp, (hash(s * 7.7 + 1.3) - .5) * 2 * amp];
const FULL = () => rectPath(-BL, -BL, W + 2 * BL, H + 2 * BL);
const inverse = p => { const q = new Path2D(); q.rect(-1e4, -1e4, 2e4, 2e4); q.addPath(p); return q; };
function star4(x, y, r) { const k = r * .28; return polyPath([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]]); }
function ridgeFill(y0, rough, seed, depth = 6) { const pts = ridgeLine([-BL, y0], [W + BL, y0 + (hash(seed) - .5) * 30], rough, depth, seed); return polyPath([...pts, [W + BL, H + BL], [-BL, H + BL]]); }
function emb(name, cx, cy, s) { const m = new DOMMatrix().translate(cx - s / 2, cy - s / 2).scale(s / 1000); const p = new Path2D(); p.addPath(emblem(name), m); return p; }
function rrect(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
function skyParts(seed, starsCut) {
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, W + 2 * BL, H * .16 + BL); sky2.addPath(bandSteps(-BL, W + 2 * BL, H * .15, H * .52, 6, 10));
  return [{ pull: 'sky1', ink: 'sky1', path: FULL(), cut: starsCut }, { pull: 'sky2', ink: 'sky2', path: sky2, cut: starsCut }];
}
function stars(seed, n, ymax) { const r = mulberry(seed), p = new Path2D(); for (let k = 0; k < n; k++) { const x = r() * W, y = r() * ymax, s = r() < .85 ? 1.6 + r() * 1.5 : 3 + r() * 2; p.addPath(circlePath(x, y, s)); } return p; }

// ================= print 1: the rashi's sky (shots A + B) =================
function skyPrint() {
  const e = L.emb, g = L.ground, C = CONST[R.id];
  const cs = e.s * .95, cx0 = e.cx - cs / 2, cy0 = e.cy - cs / 2, P = C.s.map(([x, y]) => [cx0 + x * cs, cy0 + y * cs]);
  const parts = [...skyParts(3, stars(5, F === 'h' ? 110 : 130, H * g[0]))];
  parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * g[0], 70, 12) }, { pull: 'mid', ink: 'mid', path: ridgeFill(H * g[1], 50, 17) }, { pull: 'near', ink: 'near', path: rectPath(-BL, H * g[2], W + 2 * BL, H) });
  parts.push({ pull: 'emb', ink: 'glow', path: emb(R.em, e.cx, e.cy, e.s), lit: 1 });
  const lines = new Path2D(); for (const [a, b] of C.l) lines.addPath(bar(P[a][0], P[a][1], P[b][0], P[b][1], 4));
  parts.push({ pull: 'cl', ink: 'near', path: lines });
  P.forEach(([x, y], i) => parts.push({ pull: 'st' + i, ink: 'sun', path: unionPath([circlePath(x, y, 12), star4(x, y, 24)]) }));
  return { parts, depth: {}, header: { ...L.hdr, text: R.name + ' राशि' },
    chips: [{ pull: 'ep', text: `कथा ${R.n}/12 · राशियों की कहानी` }, { pull: 'date', text: `सूर्य प्रवेश: लगभग ${R.date}`, line: 1 }],
    seal: { label: `${R.el} तत्व`, value: R.pl, foot: 'स्वामी ग्रह' } };
}
// ================= print 2: the story (shot C), one landscape per element =================
function storyPrint() {
  const g = L.ground, e = L.embC, r = mulberry(31 + R.n), parts = [];
  const sunPos = F === 'h' ? [W * .3, H * .36] : [W * .3, H * .22], sr = F === 'h' ? 110 : 90;
  let cut = new Path2D(); if (R.scene !== 'water') cut = unionPath([ringPath(sunPos[0], sunPos[1], sr + 18, sr + 30), ringPath(sunPos[0], sunPos[1], sr + 52, sr + 60)]);
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, W + 2 * BL, H * .14 + BL); sky2.addPath(bandSteps(-BL, W + 2 * BL, H * .13, H * .5, 6, 0));
  parts.push({ pull: 'sky1', ink: 'sky1', path: FULL() }, { pull: 'sky2', ink: 'sky2', path: sky2, cut: circlePath(sunPos[0], sunPos[1], sr + 70) });
  if (R.scene === 'water') parts.push({ pull: 'sun', ink: 'sun', path: circlePath(sunPos[0], sunPos[1], sr * .7), cut: circlePath(sunPos[0] + sr * .3, sunPos[1] - sr * .18, sr * .66) });
  else parts.push({ pull: 'sun', ink: 'sun', path: circlePath(sunPos[0], sunPos[1], sr + 62), cut });
  const gy = H * g[2] - (F === 'h' ? 40 : 20);
  if (R.scene === 'fire') {
    parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * (g[0] - .12), 260, 41) }, { pull: 'mid', ink: 'mid', path: ridgeFill(H * (g[1] - .06), 140, 43) });
    parts.push({ pull: 'near', ink: 'near', path: polyPath([[-BL, H + BL], [-BL, gy + 20], [e.cx - e.s * .55, gy], [e.cx + e.s * .6, gy - 6], [W + BL, gy + 30], [W + BL, H + BL]]) });
  } else if (R.scene === 'earth') {
    parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * (g[0] - .08), 60, 51) });
    const terr = new Path2D(); terr.addPath(ridgeFill(H * (g[1] - .04), 30, 53)); parts.push({ pull: 'mid', ink: 'mid', path: terr, cut: bandSteps(-BL, W + 2 * BL, H * (g[1] - .02), gy, 4, 0) });
    const near = new Path2D(); near.rect(-BL, gy, W + 2 * BL, H); for (let k = 0; k < 40; k++) { const x = r() * W, h = 30 + r() * 50; near.addPath(polyPath([[x - 5, gy + 2], [x, gy - h], [x + 5, gy + 2]])); }
    const tx = F === 'h' ? W * .12 : W * .16; near.addPath(rectPath(tx - 14, gy - 220, 28, 230)); for (let k = 0; k < 6; k++) { const c = new Path2D(); c.ellipse(tx + (r() - .5) * 140, gy - 250 - r() * 120, 90, 60, 0, 0, 7); near.addPath(c); }
    parts.push({ pull: 'near', ink: 'near', path: near });
  } else if (R.scene === 'air') {
    const clouds = new Path2D(); for (let k = 0; k < 5; k++) { const x = r() * W, y = H * (.18 + r() * .3); for (let j = 0; j < 4; j++) { const c = new Path2D(); c.ellipse(x + j * 60 - 90, y - (j % 2) * 26, 70, 36, 0, 0, 7); clouds.addPath(c); } clouds.addPath(rectPath(x - 160, y, 330, 30)); }
    parts.push({ pull: 'cloud', ink: 'glow', path: clouds, lit: 1 });
    parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * (g[0] - .02), 40, 61) }, { pull: 'mid', ink: 'mid', path: ridgeFill(H * g[1], 30, 63) });
    parts.push({ pull: 'near', ink: 'near', path: polyPath([[-BL, H + BL], [-BL, gy + 40], [e.cx, gy - 10], [W + BL, gy + 50], [W + BL, H + BL]]) });
  } else {
    parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * (g[0] - .1), 40, 71) });
    const gl = new Path2D(); for (let k = 0; k < 40; k++) { const y = H * (g[0] - .04) + Math.pow(r(), 1.2) * H * .3; gl.rect(r() * W, y, 20 + r() * 90, 4); }
    parts.push({ pull: 'mid', ink: 'mid', path: rectPath(-BL, H * (g[0] - .06), W + 2 * BL, H), cut: gl });
    parts.push({ pull: 'near', ink: 'near', path: polyPath([[-BL, H + BL], [-BL, gy + 30], [e.cx - e.s * .5, gy + 10], [e.cx + e.s * .5, gy], [W + BL, gy + 40], [W + BL, H + BL]]) });
  }
  // the rashi's own sky detail, printed in the accent
  const acc = new Path2D(), sk = (x, y) => [x * W, y * H];
  const ex = { vrishabh: () => { for (const [x, y] of [[.62, .14], [.64, .18], [.66, .13], [.68, .17], [.65, .21], [.61, .19], [.67, .1]]) acc.addPath(circlePath(...sk(x, y), 8)); },
    mithun: () => { acc.addPath(star4(...sk(.6, .15), 30)); acc.addPath(star4(...sk(.68, .17), 26)); },
    kark: () => { const r2 = mulberry(9); for (let k = 0; k < 14; k++) acc.addPath(circlePath(W * (.62 + r2() * .08), H * (.12 + r2() * .08), 4)); },
    kanya: () => acc.addPath(star4(...sk(.66, .18), 34)), vrishchik: () => acc.addPath(circlePath(...sk(.66, .18), 26)),
    dhanu: () => { const r2 = mulberry(12); for (let k = 0; k < 90; k++) { const t = r2(); acc.addPath(circlePath(W * (.45 + t * .55) + (r2() - .5) * 80, H * (.05 + t * .35) + (r2() - .5) * 80, 2 + r2() * 3)); } acc.addPath(circlePath(...sk(.74, .2), 22)); },
    makar: () => { for (const [x, y] of [[.55, .12], [.7, .2], [.82, .1], [.62, .28], [.9, .26]]) { const [px, py] = sk(x, y); acc.addPath(polyPath([[px, py - 34], [px + 26, py], [px, py + 34], [px - 26, py]])); acc.addPath(thick([[px, py + 34], [px - 18, py + 80], [px + 10, py + 120]], 4)); } },
    meen: () => { acc.addPath(star4(...sk(.7, .14), 22)); } };
  if (ex[R.id]) { ex[R.id](); parts.push({ pull: 'acc', ink: 'sun', path: acc }); }
  const ecy = gy - e.s * .44;
  parts.push({ pull: 'emblit', ink: 'glow', path: emb(R.em, e.cx - 9, ecy - 9, e.s), lit: 1 });
  parts.push({ pull: 'emb', ink: 'near', path: emb(R.em, e.cx, ecy, e.s) });
  return { parts, depth: {}, header: { ...L.hdr, text: R.chip, size: R.chip.length > 12 ? L.hdr.size * .62 : L.hdr.size * .8 }, chips: [{ pull: 'ep', text: `${R.name} राशि · ${R.sym}` }] };
}
// ================= print 3: traits (shot D) =================
function traitPrint() {
  const c = L.cards, parts = [...skyParts(9, new Path2D())];
  parts.push({ pull: 'far', ink: 'far', path: ridgeFill(H * L.ground[1], 40, 81) }, { pull: 'near', ink: 'near', path: rectPath(-BL, H * L.ground[2], W + 2 * BL, H) });
  const ew = F === 'h' ? 420 : 380; parts.push({ pull: 'wm', ink: 'far', path: emb(R.em, W - ew * .55, H * L.ground[1] - ew * .38, ew) });
  for (let i = 0; i < 4; i++) {
    const col = i % c.cols, row = Math.floor(i / c.cols), x = c.x + col * (c.w + c.gx), y = c.y + row * (c.h + c.gy);
    parts.push({ pull: 'c' + i, ink: 'near', path: rrect(x, y, c.w, c.h, 18) });
    parts.push({ pull: 'c' + i, ink: i === 3 ? 'sun' : 'glow', path: i === 3 ? (() => { const p = new Path2D(); p.roundRect(x, y, c.w, c.h, 18); p.roundRect(x + 10, y + 10, c.w - 20, c.h - 20, 12); return p; })() : star4(x + c.w / 2, y + c.h * .27, 34), rule: i === 3 ? 'evenodd' : 'nonzero' });
    if (i === 3) parts.push({ pull: 'c3', ink: 'sun', path: star4(x + c.w / 2, y + c.h * .27, 34) });
  }
  return { parts, depth: {}, header: { ...L.hdr, text: 'परंपरा के अनुसार', size: L.hdr.size * .78 }, chips: [{ pull: 'ep', text: `${R.name} राशि के लोग` }], cards: true };
}
// ================= print 4: follow card (shot E) =================
function followPrint() {
  const g = L.ring, parts = [{ pull: 'bg', ink: 'sky2', path: FULL() }, { pull: 'bg', ink: 'near', path: bandSteps(-BL, W + 2 * BL, H * .62, H + BL, 5, 0) }];
  parts.push({ pull: 'ring', ink: 'glow', path: ringPath(g.x, g.y, g.R - 4, g.R + 4), lit: 1 });
  const ids = ALL.map(a => a.em);
  ALL.forEach((a, i) => {
    const ang = (i * 30 - 90) * D2R, x = g.x + Math.cos(ang) * g.R, y = g.y + Math.sin(ang) * g.R, cur = a.id === R.id, nxt = i === (R.n % 12);
    parts.push({ pull: 'r' + i, ink: cur ? 'sun' : 'near', path: circlePath(x, y, g.es * .62) });
    parts.push({ pull: 'r' + i, ink: cur ? 'near' : nxt ? 'sun' : 'glow', path: emb(a.em, x, y, g.es * .9) });
    if (nxt) parts.push({ pull: 'nxt', ink: 'sun', path: ringPath(x, y, g.es * .7, g.es * .78) });
  });
  const hs = g.lr * .84, sq = (a, b) => { const p = new Path2D(); p.roundRect(g.x - hs - a, g.y - hs - a, 2 * (hs + a), 2 * (hs + a), 22 + a); if (b != null) p.roundRect(g.x - hs - b, g.y - hs - b, 2 * (hs + b), 2 * (hs + b), 22 + b); return p; };
  parts.push({ pull: 'plate', ink: 'near', path: sq(16) }, { pull: 'plate', ink: 'sun', path: sq(10, 4), rule: 'evenodd' });
  return { parts, depth: {}, follow: true };
}

// ---------------- printing ----------------
const TX = { list: [] };
function rec(id, text, box) { const m = ctx.getTransform(); const a = m.transformPoint(new DOMPoint(box[0], box[1])), b = m.transformPoint(new DOMPoint(box[2], box[3])); TX.list.push({ id, text, x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }); }
function region(p, ang, sd, box, cx, cy) {
  box = box || [-300, -300, W + 600, H + 600]; cx = cx ?? W / 2; cy = cy ?? H / 2;
  if (p >= 1) return null; const m = new DOMMatrix().translate(cx, cy).rotate(ang / D2R).translate(-cx, -cy);
  const o = new Path2D(); o.addPath(wipeRegion(box, 'down', p, sd, 34, 6), m); return o;
}
function front(p, ang, box, cx, cy) {
  box = box || [-300, -300, W + 600, H + 600]; cx = cx ?? W / 2; cy = cy ?? H / 2;
  const y = wipeFront(box, 'down', p, 34), m = new DOMMatrix().translate(cx, cy).rotate(ang / D2R).translate(-cx, -cy);
  const a = m.transformPoint(new DOMPoint(box[0], y)), b = m.transformPoint(new DOMPoint(box[0] + box[2], y)), d = m.transformPoint(new DOMPoint(0, 1)), o = m.transformPoint(new DOMPoint(0, 0));
  return { a: [a.x, a.y], b: [b.x, b.y], lead: [d.x - o.x, d.y - o.y] };
}
const wipeR = (box, p, sd) => p < 1 ? wipeRegion(box, 'right', p, sd, 30) : null;
function fitFont(c, s, max, size, wt, fam) { let f = size; c.font = `${wt} ${f}px ${fam}`; while (c.measureText(s).width > max && f > 16) { f -= 2; c.font = `${wt} ${f}px ${fam}`; } return f; }
function wrap(c, text, max) { const words = text.split(' '), out = []; let line = ''; for (const w of words) { const tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > max && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }

function drawPrint(S, st) {
  const pal = PAL, prog = st.prog, seed = st.seed || 1, ang = -.08;
  paperSheet(ctx, T, -BL, -BL, W + 2 * BL, H + 2 * BL, .6);
  let blade = null;
  S.parts.forEach((pt, j) => {
    const p = prog(pt.pull); if (p <= 0) return;
    ctx.save(); if (pt.cut) ctx.clip(inverse(pt.cut), 'evenodd');
    const flat = /^(emb|emblit|wm|r\d+)$/.test(pt.pull) && pt.ink !== 'sun' || pt.flat;
    ink(ctx, pt, { color: pal[pt.ink], reg: R2(seed + j * 5, 2.2), clip: region(p, ang, seed + j * 3), sheen: flat ? 0 : 1, trap: pt.lit || flat ? 0 : 1, lw: 1.8 });
    ctx.restore();
    if (p > 0 && p < 1 && ['sky1', 'sky2', 'far', 'mid', 'near', 'bg'].includes(pt.pull)) blade = { p, color: pal[pt.ink] };
  });
  const h = S.header, hp = h ? prog('header') : 0;
  if (h && hp > 0) {
    const col = pickInk([pal.sky2], [PAPER, pal.sky1, pal.sun], 3.5), max = W - h.x - (F === 'h' ? 260 : 210);
    ink(ctx, { paint: c => { const f = fitFont(c, h.text, max, h.size, 700, FD); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(h.text, h.x, h.y); } },
      { color: col, reg: R2(seed + 44, 1.4), clip: wipeR([h.x - 20, h.y - h.size, W, h.size * 1.3], hp, 13) });
    ctx.save(); const f = fitFont(ctx, h.text, max, h.size, 700, FD); const w = ctx.measureText(h.text).width; ctx.restore();
    rec('hdr', h.text, [h.x, h.y - f * .62, h.x + w, h.y + 10]);
  }
  (S.chips || []).forEach((cp, k) => {
    const p = prog(cp.pull); if (p <= 0) return;
    const x = L.chip.x, y = L.chip.y + (cp.line || 0) * 64, col = pickInk([pal.sky2], [PAPER, pal.glow, pal.sky1], 4.5);
    ctx.save(); ctx.font = `600 36px ${FT}`; const w = ctx.measureText(cp.text).width; ctx.restore();
    ink(ctx, { path: rrect(x - 14, y - 40, w + 28, 54, 27) }, { color: pal.near, reg: R2(seed + 60 + k, 1), clip: wipeR([x - 20, y - 50, w + 60, 70], p, 21 + k), sheen: 1 });
    ink(ctx, { paint: c => { c.font = `600 36px ${FT}`; c.textAlign = 'left'; c.fillText(cp.text, x, y); } }, { color: pickInk(pal.near, [PAPER, pal.glow], 4.5), reg: R2(seed + 70 + k, .8), clip: wipeR([x - 20, y - 50, w + 60, 70], p, 25 + k) });
    rec('chip' + k, cp.text, [x, y - 34, x + w, y + 10]);
  });
  const sl = S.seal;
  if (sl && prog('seal') > 0) {
    const p = prog('seal'), { x, y, r } = L.seal;
    ink(ctx, { path: circlePath(x, y, r), knock: ringPath(x, y, r - 16, r - 11) }, { color: pal.near, reg: R2(seed + 51, 1.2), clip: p < 1 ? wipeRegion([x - r - 30, y - r - 30, 2 * r + 60, 2 * r + 60], 'down', p, 9, 40) : null, sheen: 1 });
    const lab = pickInk(pal.near, [pal.glow, pal.sky1, PAPER], 4.5), key = pickInk(pal.near, [pal.sun, PAPER], 3);
    const item = (k, fn, color, box, text) => { const q = prog(k); if (q <= 0) return; ink(ctx, { paint: fn }, { color, reg: R2(seed + k.length * 7, 1.1), clip: wipeR(box, q, 31 + k.length) }); rec(k, text, box); };
    item('slab', c => { fitFont(c, sl.label, r * 1.5, 30, 600, FT); c.textAlign = 'center'; c.fillText(sl.label, x, y - r * .4); }, lab, [x - r * .8, y - r * .66, x + r * .8, y - r * .3], sl.label);
    item('sval', c => { fitFont(c, sl.value, r * 1.6, r * .72, 700, FD); c.textAlign = 'center'; c.fillText(sl.value, x, y + r * .3); c.fillRect(x - r * .55, y + r * .42, r * 1.1, 5); }, key, [x - r * .82, y - r * .3, x + r * .82, y + r * .44], sl.value);
    item('sfoot', c => { fitFont(c, sl.foot, r * 1.4, 26, 500, FT); c.textAlign = 'center'; c.fillText(sl.foot, x, y + r * .7); }, lab, [x - r * .72, y + r * .5, x + r * .72, y + r * .76], sl.foot);
  }
  if (S.cards) {
    const c = L.cards, wcol = pickInk(pal.near, [PAPER, pal.glow], 4.5);
    for (let i = 0; i < 4; i++) {
      const p = prog('c' + i); if (p <= 0) continue;
      const col = i % c.cols, row = Math.floor(i / c.cols), x = c.x + col * (c.w + c.gx), y = c.y + row * (c.h + c.gy), word = R.cards[i], lab = i === 3 ? 'चुनौती' : 'गुण';
      ink(ctx, { paint: g => { const f = fitFont(g, word, c.w - 50, F === 'h' ? 92 : 84, 700, FD); g.textAlign = 'center'; g.fillText(word, x + c.w / 2, y + c.h * .72); g.font = `600 30px ${FT}`; g.fillStyle = i === 3 ? pal.sun : pickInk(pal.near, [pal.glow, PAPER], 4.5); g.fillText(lab, x + c.w / 2, y + c.h * .9); } },
        { color: wcol, reg: R2(seed + 90 + i, .9), clip: wipeR([x, y, c.w, c.h], p, 41 + i) });
      rec('card' + i, word + ' ' + lab, [x + 20, y + c.h * .5, x + c.w - 20, y + c.h * .93]);
    }
  }
  if (S.follow) drawFollowText(st);
  if (st.finish !== false) inkFinish(ctx, T, -BL, -BL, W + 2 * BL, H + 2 * BL, .6, 1);
  if (S.follow && LOGOF && prog('plate') > 0) {           // the channel logo, as supplied (not re-inked)
    const g = L.ring, p = prog('plate'), hs = g.lr * .84;
    ctx.save(); if (p < 1) ctx.clip(wipeRegion([g.x - hs, g.y - hs, 2 * hs, 2 * hs], 'down', p, 77, 30)); ctx.beginPath(); ctx.roundRect(g.x - hs, g.y - hs, 2 * hs, 2 * hs, 22); ctx.clip();
    ctx.drawImage(LOGOF, g.x - hs, g.y - hs, 2 * hs, 2 * hs); ctx.restore();
  }
  if (blade) { const f = front(blade.p, ang); squeegee(ctx, f.a, f.b, f.lead, { color: blade.color, roll: blade.p * 40, handle: .35, scale: 1.4, bead: 26 }); }
}
function drawFollowText(st) {
  const pal = PAL, prog = st.prog, t = L.txt, g = L.ring;
  const paper = pickInk(pal.near, [PAPER], 4.5);
  const pb = prog('bub');
  if (pb > 0) {      // the comment bubble
    const x = t.x, y = t.bub, w = t.w, h = F === 'h' ? 330 : 170;
    const b = new Path2D(); b.roundRect(x, y, w, h, 28); if (F === 'h') b.addPath(polyPath([[x + 10, y + h - 90], [x - 60, y + h - 20], [x + 90, y + h - 40]])); else b.addPath(polyPath([[x + 120, y], [x + 160, y - 50], [x + 200, y]]));
    ink(ctx, { path: b }, { color: pal.near, reg: [1.4, -.6], clip: wipeR([x - 80, y - 60, w + 100, h + 80], pb, 51), sheen: 1 });
    const pq = prog('q');
    if (pq > 0) {
      ink(ctx, { paint: c => { c.textAlign = 'left'; c.font = `700 ${F === 'h' ? 96 : 76}px ${FD}`; c.fillStyle = pal.sun; c.fillText('कमेंट करें', x + 36, y + (F === 'h' ? 100 : 78));
        c.fillStyle = paper; c.font = `600 ${F === 'h' ? 40 : 34}px ${FT}`; const ls = wrap(c, R.q, w - 72); ls.slice(0, 3).forEach((l, i) => c.fillText(l, x + 36, y + (F === 'h' ? 170 : 124) + i * (F === 'h' ? 54 : 44))); } },
        { color: paper, reg: [.8, .4], clip: wipeR([x, y, w, h], pq, 53) });
      rec('bub', 'कमेंट करें ' + R.q, [x + 30, y + 20, x + w - 30, y + (F === 'h' ? 300 : 160)]);
    }
  }
  const pf = prog('fol');
  if (pf > 0) {      // follow plate
    const x = t.x, y = t.fol, w = F === 'h' ? t.w : t.w, h = F === 'h' ? 150 : 110;
    ink(ctx, { path: rrect(x, y, w, h, h / 2) }, { color: pal.sun, reg: [1.2, .6], clip: wipeR([x - 20, y - 20, w + 40, h + 40], pf, 55), sheen: 1 });
    const dark = pickInk(pal.sun, [pal.near, '#000000'], 4.5);
    ink(ctx, { paint: c => { c.textAlign = 'center'; fitFont(c, 'फॉलो करें · Astroverse', w - (F === 'h' ? 190 : 160), F === 'h' ? 92 : 70, 700, FD); c.fillText('फॉलो करें · Astroverse', x + w / 2 + 40, y + h * .72);
      const bx = x + (F === 'h' ? 70 : 54), by = y + h / 2, bs = F === 'h' ? 1 : .8;    // a little bell
      c.beginPath(); c.moveTo(bx - 26 * bs, by + 18 * bs); c.quadraticCurveTo(bx - 24 * bs, by - 30 * bs, bx, by - 32 * bs); c.quadraticCurveTo(bx + 24 * bs, by - 30 * bs, bx + 26 * bs, by + 18 * bs); c.closePath(); c.fill(); c.fillRect(bx - 32 * bs, by + 16 * bs, 64 * bs, 8 * bs); c.beginPath(); c.arc(bx, by + 30 * bs, 8 * bs, 0, 7); c.fill(); } },
      { color: dark, reg: [.8, .4], clip: wipeR([x, y, w, h], prog('folt'), 57) });
    if (prog('folt') > 0) rec('fol', 'फॉलो करें · Astroverse', [x + 100, y + 10, x + w - 20, y + h - 10]);
  }
  const pn = prog('nxtt');
  if (pn > 0) {
    const txt = R.n < 12 ? `अगला वीडियो: ${R.next} राशि  →` : 'सीरीज़ पूरी · नई कहानियाँ जल्द', col = pickInk(pal.sky2, [PAPER, pal.glow], 4.5);
    const x = F === 'h' ? t.x : t.x, y = F === 'h' ? t.nxt : t.fol - 40 + 0;
    if (F === 'h') { ink(ctx, { paint: c => { c.textAlign = 'left'; c.font = `600 46px ${FT}`; c.fillText(txt, x + 10, y + 50); } }, { color: col, reg: [.8, .4], clip: wipeR([x, y, t.w, 80], pn, 59) }); rec('nxt', txt, [x, y, x + t.w, y + 70]); }
    else { const yy = t.nxt; ink(ctx, { paint: c => { c.textAlign = 'center'; c.font = `600 44px ${FT}`; c.fillText(txt, W / 2, yy); } }, { color: col, reg: [.8, .4], clip: wipeR([0, yy - 60, W, 80], pn, 59) }); rec('nxt', txt, [100, yy - 44, W - 100, yy + 10]); }
  }
}

// ---------------- timeline ----------------
const PA = { sky1: [0, .6], sky2: [B * .5, .5], far: [B, .4], mid: [B * 1.5, .4], near: [B * 2, .4], header: [bt(1, 0), .42], ep: [bt(1, 1.5), .3] };
const PB = { cl: [bt(4, 2), .45], emb: [bt(5, 0), .55], seal: [bt(6, 2), .3], slab: [bt(6, 3), .22], sval: [bt(7, 0), .25], sfoot: [bt(7, 1), .22], date: [bt(7, 2), .3] };
for (let i = 0; i < 12; i++) PB['st' + i] = [bt(3, 0) + i * B / 3, .1];
const TC = bt(9), TD = bt(17), TE = bt(25);
const PC = { sun: [TC + B * .5, .3], cloud: [TC + B * .5, .3], acc: [TC + B, .3], emblit: [TC + B * 1.5, .4], emb: [TC + B * 1.5 + .25, .45], header: [TC + B * 3, .42], ep: [TC + B * 4, .3] };
const PD = { wm: [TD + B * .5, .35], header: [TD + B, .42], ep: [TD + B * 2, .3], c0: [bt(18, 2), .3], c1: [bt(19, 0), .3], c2: [bt(19, 2), .3], c3: [bt(21, 0), .35] };
const PE = { bg: [TE - 9, .1], ring: [TE + B * .5, .3], plate: [TE + B, .4], bub: [bt(25, 2), .35], q: [bt(25, 2.75), .3], fol: [bt(28, 0), .35], folt: [bt(28, .5), .3], nxt: [bt(28, 2), .2], nxtt: [bt(28, 2), .3] };
for (let i = 0; i < 12; i++) PE['r' + i] = [TE + B * 1.5 + i * B / 4, .1];
const SWEEPS = [{ t: TC - .3, d: .6, from: 0, to: 1, ang: -.55 }, { t: TD - .3, d: .6, from: 1, to: 2, ang: .5 }, { t: TE - .3, d: .7, from: 2, to: 3, ang: -.5 }];
const SIL = [bt(16, 2), TD];
const progOf = (P, t) => n => { const q = P[n]; return q ? seg(t, q[0], q[0] + q[1]) : 1; };
let PR = [];
function state(i, t) {
  if (i === 0) return { S: PR[0], prog: progOf({ ...PA, ...PB }, t), seed: 3, cam: camAt([[0, 0, [W / 2, H / 2, 1.18]], [0, 3, [W / 2, H / 2, 1.0], 'eo'], [bt(4, 2), 3, [L.emb.cx, L.emb.cy, 1.22]], [bt(6, 1), 1.6, [W / 2, H / 2, 1.0]], [bt(7, 2), TC - bt(7, 2), [W / 2, H / 2, 1.04], 'lin']], t) };
  if (i === 1) return { S: PR[1], prog: progOf(PC, t), seed: 7, cam: camAt([[0, 0, [W / 2 + (F === 'h' ? 80 : 0), H / 2, 1.08]], [TC, 5, [W / 2, H / 2, 1.0]], [bt(12, 0), TD - bt(12, 0), [W / 2 + 40, H / 2 + 30, 1.06], 'lin']], t) };
  if (i === 2) return { S: PR[2], prog: progOf(PD, t), seed: 11, cam: camAt([[0, 0, [W / 2, H / 2, 1.0]], [bt(22, 0), TE - bt(22, 0), [W / 2, H / 2, 1.05], 'lin']], t) };
  return { S: PR[3], prog: progOf(PE, t), seed: 13, cam: camAt([[0, 0, [W / 2, H / 2, 1.08]], [TE, 3.2, [W / 2, H / 2, 1.0]]], t) };
}
function camAt(keys, t) {
  let s = keys[0][2].slice();
  for (const [t0, d, to, kind] of keys) { if (t < t0) break; const u = d <= 0 ? 1 : seg(t, t0, t0 + d), e = kind === 'lin' ? u : kind === 'eo' ? 1 - Math.pow(1 - u, 3) : eio(u); s = [lerp(s[0], to[0], e), lerp(s[1], to[1], e), Math.exp(lerp(Math.log(s[2]), Math.log(to[2]), e))]; }
  const z = Math.max(1, s[2]), hw = W / 2 / z, hh = H / 2 / z; return [clamp(s[0], hw, W - hw), clamp(s[1], hh, H - hh), z];
}
function drawState(st) { const [cx, cy, z] = st.cam; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); drawPrint(st.S, st); }
const sceneAt = t => t < TC ? 0 : t < TD ? 1 : t < TE ? 2 : 3;

// the logo bug: stamped in the corner at 1.8 s, on every print until the follow card
function bug(t) {
  const t0 = bt(0, 2.5); if (t < t0 || t >= TE - .3 || !LOGO) return;
  const { x, y, r } = L.bug, p = seg(t, t0, t0 + .25), sq = 1 + .25 * (1 - ss(seg(t, t0, t0 + .18)));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.translate(x, y); ctx.scale(sq, sq);
  ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(5, 7, r + 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.near; ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); if (p < 1) { ctx.beginPath(); ctx.rect(-r, -r, 2 * r * p, 2 * r); ctx.clip(); }
  const s = r * 2 / .93; ctx.drawImage(LOGO, -s / 2, -s / 2, s, s); ctx.restore();
}
function subtitles(t, sc) {
  if (NOCAP) return;
  const cue = CUES.find(c => t >= c.t0 - .12 && t < c.t1); if (!cue) return;
  const near = sc === 3 ? '#0A0F18' : PAL.near, S = L.sub;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `500 ${S.fs}px ${FT}`;
  const lines = wrap(ctx, cue.text, S.w), lh = S.fs * 1.38, hgt = lines.length * lh + 40, y0 = H - S.bottom - hgt;
  const pb = seg(t, cue.t0 - .12, cue.t0 + .1), pt = seg(t, cue.t0, cue.t0 + .22);
  const prev = CUES[CUES.indexOf(cue) - 1], cont = prev && cue.t0 - prev.t1 < .5;
  ink(ctx, { path: rectPath(-20, y0, W + 40, hgt + (S.bottom ? 0 : 20)) }, { color: near, reg: [1, -.5], clip: cont || pb >= 1 ? null : wipeRegion([-20, y0 - 10, W + 40, hgt + 40], 'right', pb, 3, 40), sheen: 1 });
  ink(ctx, { paint: c => { c.font = `500 ${S.fs}px ${FT}`; c.textAlign = 'center'; lines.forEach((l, i) => c.fillText(l, W / 2, y0 + 20 + S.fs + i * lh)); } }, { color: pickInk(near, [PAPER], 4.5), reg: [.8, .4], clip: pt < 1 ? wipeRegion([0, y0, W, hgt], 'right', pt, 11, 30) : null });
}

// ---------------- setup / render ----------------
export function setup(canvas, o) {
  F = o.f === 'v' ? 'v' : 'h'; L = LAY[F]; W = L.W; H = L.H; canvas.width = W; canvas.height = H;
  ALL = o.all; R = ALL.find(a => a.id === o.r) || ALL[0]; LOGO = o.logo; LOGOF = o.logoFull; THUMB = !!o.thumb; CUES = o.cues || []; NOCAP = !!o.nocap;
  const [sky1, sky2, far, mid, near, sun, glow] = R.pal; PAL = { sky1, sky2, far, mid, near, sun, glow };
  ctx = canvas.getContext('2d'); T = makeTextures(PAPER, 7 + R.n);
  PR = [skyPrint(), storyPrint(), traitPrint(), followPrint()];
  return { dur: DUR, ev: events(), size: [W, H] };
}
export function render(t) {
  TX.list = [];
  if (THUMB) return drawThumb();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const sc = sceneAt(t), sw = SWEEPS.find(s => t >= s.t && t < s.t + s.d);
  if (sw) {
    const u = seg(t, sw.t, sw.t + sw.d), A = state(sw.from, t), Bs = state(sw.to, t);
    drawState(A);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip(region(u, sw.ang, 61, [-500, -500, W + 1000, H + 1000], W / 2, H / 2)); drawState(Bs); ctx.restore();
    TX.list = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0); const f = front(u, sw.ang, [-500, -500, W + 1000, H + 1000], W / 2, H / 2);
    squeegee(ctx, f.a, f.b, f.lead, { beads: [{ t0: 0, t1: .34, color: PAL.sky2 }, { t0: .34, t1: .67, color: PAL.mid }, { t0: .67, t1: 1, color: PAL.sun }], roll: u * 50, handle: .3, scale: 1.6, bead: 30 });
  } else drawState(state(sc, t));
  bug(t);
  subtitles(t, sc);
}
export function texts(t) { render(t); return TX.list.filter(x => x.x0 >= 0 && x.y0 >= 0 && x.x1 <= W && x.y1 <= H); }

function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  const pulls = (P, scene) => { for (const [k, [a, d]] of Object.entries(P)) {
    if (a < 0) continue;
    if (/^st\d/.test(k)) E(a, 'chime', { scene, n: +k.slice(2) });
    else if (/^r\d/.test(k) || /^c\d/.test(k)) E(a, 'stamp', { scene, k });
    else if (['slab', 'sval', 'sfoot', 'q', 'folt', 'nxtt', 'ep', 'date'].includes(k)) E(a, 'item', { scene, k, accent: k === 'sval' || k === 'folt' ? 1 : 0 });
    else if (['seal', 'header', 'plate', 'bub', 'fol'].includes(k)) E(a, 'plate', { scene, k, dur: d });
    else if (k !== 'nxt') E(a, 'pull', { scene, k, dur: d });
  } };
  pulls(PA, 0); pulls(PB, 0); pulls(PC, 1); pulls(PD, 2); pulls(PE, 3);
  E(bt(0, 2.5), 'logo');
  for (const s of SWEEPS) E(s.t, 'sweep', { dur: s.d });
  E(SIL[0], 'silence', { dur: SIL[1] - SIL[0] });
  const sc = [[0, 'sky'], [TC, 'story'], [TD, 'traits'], [TE, 'follow'], [DUR, 'end']];
  for (let i = 0; i < 4; i++) E(sc[i][0], 'scene', { name: sc[i][1], t1: sc[i + 1][0] });
  for (const c of CUES) E(c.vo, 'vo', { id: c.id, dur: c.dur });
  ev.sort((a, b) => a.t - b.t); return ev;
}

// ---------------- the thumbnail card (shown for 1.5 s after the intro; also exported as the cover image) ----------------
function drawThumb() {
  const pal = PAL, v = F === 'v';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  paperSheet(ctx, T, -BL, -BL, W + 2 * BL, H + 2 * BL, .6);
  const st = stars(21, v ? 160 : 140, H);
  const sky = new Path2D(); sky.rect(-BL, -BL, W + 2 * BL, H + 2 * BL);
  ctx.save(); ctx.clip(inverse(st), 'evenodd');
  ink(ctx, { path: sky }, { color: pal.near, reg: [0, 0], sheen: 0 });
  ink(ctx, { path: bandSteps(-BL, W + 2 * BL, H * (v ? .30 : .18), H * (v ? .78 : .9), 7, 0) }, { color: pal.sky2, reg: [1.5, -1], sheen: 1, trap: 1 });
  ctx.restore();
  // a sunburst of rays behind the emblem, in the far ink
  const ex = v ? W / 2 : W * .75, ey = v ? H * .52 : H * .52, es = v ? 720 : 700;
  const rays = new Path2D(); for (let i = 0; i < 24; i++) { const a0 = i / 24 * Math.PI * 2, a1 = a0 + Math.PI / 48; rays.moveTo(ex, ey); rays.lineTo(ex + Math.cos(a0) * 2000, ey + Math.sin(a0) * 2000); rays.lineTo(ex + Math.cos(a1) * 2000, ey + Math.sin(a1) * 2000); rays.closePath(); }
  ink(ctx, { path: rays }, { color: pal.far, reg: [1, 1], sheen: 0, alpha: .55 });
  ink(ctx, { path: circlePath(ex, ey, es * .52) }, { color: pal.sun, reg: [-1.5, 1], sheen: 1, trap: 1 });
  ink(ctx, { path: ringPath(ex, ey, es * .55, es * .58) }, { color: pal.sun, reg: [1.5, -1], sheen: 1 });
  ink(ctx, { path: emb(R.em, ex, ey, es * .8) }, { color: pal.near, reg: [2, 1], sheen: 0 });
  const C = CONST[R.id], cs = es * .9, P = C.s.map(([x, y]) => [ex - cs / 2 + x * cs, ey - cs / 2 + y * cs]);
  for (const [a, b] of C.l) ink(ctx, { path: bar(P[a][0], P[a][1], P[b][0], P[b][1], 5) }, { color: PAPER, reg: [0, 0], sheen: 0 });
  P.forEach(([x, y]) => ink(ctx, { path: unionPath([circlePath(x, y, 10), star4(x, y, 22)]) }, { color: PAPER, reg: [0, 0], sheen: 0 }));
  // text: "<rashi> राशि का" / "छुपा सच" / "<trait> या <challenge>?"
  const paper = PAPER, acc = pickInk(pal.near, [pal.sun, PAPER], 3);
  const tx = v ? W / 2 : 90, al = v ? 'center' : 'left', maxw = v ? W - 120 : W * .47;
  const y1 = v ? 230 : 250, y2 = v ? 480 : 520, y3 = v ? H - 300 : 800;
  ink(ctx, { paint: c => { c.textAlign = al; fitFont(c, R.name + ' राशि का', maxw, v ? 120 : 130, 700, FD); c.fillText(R.name + ' राशि का', tx, y1); } }, { color: paper, reg: [1, .5] });
  ink(ctx, { paint: c => { c.textAlign = al; fitFont(c, 'छुपा सच', maxw, v ? 260 : 300, 700, FD); c.fillText('छुपा सच', tx, y2); } }, { color: acc, reg: [-1.5, 1] });
  const q = R.cards[0] + ' या ' + R.cards[3] + '?';
  ctx.save(); const qf = fitFont(ctx, q, maxw - 40, v ? 96 : 92, 700, FD); const qw = ctx.measureText(q).width; ctx.restore();
  const bx = v ? W / 2 - qw / 2 - 40 : tx - 20, bw = qw + 80, bh = qf * 1.25, by = y3 - qf * .95;
  ink(ctx, { path: rrect(bx, by, bw, bh, 18) }, { color: pal.sun, reg: [1, .6], sheen: 1 });
  const dark = pickInk(pal.sun, [pal.near, '#000000'], 4.5);
  ink(ctx, { paint: c => { c.textAlign = 'left'; fitFont(c, q, maxw - 40, v ? 96 : 92, 700, FD); c.fillText(q, bx + 40, y3); } }, { color: dark, reg: [.6, .3] });
  const chip = `राशियों की कहानी · ${R.n}/12`;
  ctx.save(); ctx.font = `600 38px ${FT}`; const cw = ctx.measureText(chip).width; ctx.restore();
  const cx0 = v ? W / 2 - cw / 2 : tx, cy0 = v ? H - 150 : 960;
  ink(ctx, { path: rrect(cx0 - 18, cy0 - 44, cw + 36, 60, 30) }, { color: pal.sky2, reg: [1, -.5], sheen: 1 });
  ink(ctx, { paint: c => { c.font = `600 38px ${FT}`; c.textAlign = 'left'; c.fillText(chip, cx0, cy0); } }, { color: pickInk(pal.sky2, [PAPER, pal.near], 4.5), reg: [.6, .3] });
  inkFinish(ctx, T, -BL, -BL, W + 2 * BL, H + 2 * BL, .6, 1);
  if (LOGO) { const r = v ? 90 : 84, x = v ? W - 130 : W - 120, y = v ? H - 160 : 120; ctx.save(); ctx.fillStyle = pal.near; ctx.beginPath(); ctx.arc(x, y, r + 8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08); ctx.restore(); }
}
