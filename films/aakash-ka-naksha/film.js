// film.js · "आकाश का नक्शा" (The Map of the Sky) · silkscreen travel poster, full-bleed 16:9 prints.
// One timeline for the whole film. 84 BPM in 4/4: beat 0.714 s, bar 2.857 s, 44 bars = 125.7 s.
// Journey: night sky → Babylon → Alexandria → Jaipur → London 1930 → the same sky re-inked (precession) → the series wall.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, bandSteps, ridgeLine,
  polyPath, circlePath, ringPath, rectPath, unionPath, mulberry, hash, clamp, lerp, hex2rgb, mix } from './engine/silk.js';

export const BPM = 84, B = 60 / BPM, BAR = 4 * B, DUR = +(44 * BAR).toFixed(3);
const W = 1920, H = 1080, AW = 1920, AH = 1080, BL = 60;
const bt = (bar, beat = 0) => +(bar * BAR + beat * B).toFixed(4);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const D2R = Math.PI / 180;
export const PAPER = '#F3EAD8';
const FD = 'Teko', FT = 'Poppins';

// ---------------- palettes: ≤ 6 inks + a lit-face ink, by role ----------------
const PAL = {
  night:  { sky1: '#2E3D70', sky2: '#1A2250', far: '#4B4380', mid: '#28306A', near: '#11162B', sun: '#F2C14E', glow: '#6F7FC0' },
  night2: { sky1: '#1F4A63', sky2: '#13263D', far: '#2F5E73', mid: '#1C3A52', near: '#0C1622', sun: '#F07A3C', glow: '#5FA3B4' },   // the re-ink: same sky, 2,000 years on
  babylon:{ sky1: '#EDBB80', sky2: '#6A4E7E', far: '#B0839A', mid: '#7E4A39', near: '#24171D', sun: '#F8E4A6', glow: '#D29766' },
  alex:   { sky1: '#E8F0F2', sky2: '#7FB3C8', far: '#D9C7A3', mid: '#2F6E8E', near: '#173247', sun: '#E8553D', glow: '#B9D4DE' },
  jaipur: { sky1: '#F6CD98', sky2: '#EE9A73', far: '#D98C8A', mid: '#B5574B', near: '#3A1F2B', sun: '#F2B134', glow: '#F4B8A0' },
  london: { sky1: '#E6E1D3', sky2: '#9FB0BE', far: '#7D8A99', mid: '#4A5768', near: '#1E2530', sun: '#D94A38', glow: '#C9C2B0' },
};
// WCAG contrast: text inks are chosen against the ink underneath
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function pickInk(bgs, cands, need = 3) { bgs = [].concat(bgs); for (const c of cands) if (c && bgs.every(b => contrast(c, b) >= need)) return c; return cands.slice().sort((a, b) => Math.min(...bgs.map(x => contrast(b, x))) - Math.min(...bgs.map(x => contrast(a, x))))[0]; }
const R2 = (s, amp) => [(hash(s * 3.1 + 1) - .5) * 2 * amp, (hash(s * 7.7 + 1.3) - .5) * 2 * amp];
const FULL = () => rectPath(-BL, -BL, AW + 2 * BL, AH + 2 * BL);
const inverse = p => { const q = new Path2D(); q.rect(-1e4, -1e4, 2e4, 2e4); q.addPath(p); return q; };
const SEAL = { x: 1690, y: 300, r: 168 };

// ---------------- shape helpers ----------------
function ridgeFill(y0, rough, seed, yb = AH + BL, x0 = -BL, x1 = AW + BL, depth = 6) {
  const pts = ridgeLine([x0, y0], [x1, y0 + (hash(seed) - .5) * 30], rough, depth, seed);
  return polyPath([...pts, [x1, yb], [x0, yb]]);
}
function star4(x, y, r) { const k = r * .28; return polyPath([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]]); }
function star5(x, y, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return polyPath(p); }
function bar(x0, y0, x1, y1, w) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2; return polyPath([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]); }
function sector(cx, cy, r0, r1, a0, a1) { const p = new Path2D(); p.arc(cx, cy, r1, a0, a1); p.arc(cx, cy, r0, a1, a0, true); p.closePath(); return p; }
function blob(p, x, y, rx, ry) { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); p.closePath(); }
function palm(p, x, base, h, lean, seed) {
  const r = mulberry(seed), top = [x + lean, base - h];
  const n = 14; const L = [], R = [];
  for (let i = 0; i <= n; i++) { const t = i / n, cx = lerp(x, top[0], t) + Math.sin(t * 3) * lean * .15, w = lerp(15, 8, t); L.push([cx - w, lerp(base, top[1], t)]); R.push([cx + w, lerp(base, top[1], t)]); }
  p.addPath(polyPath([...L, ...R.reverse()]));
  for (let k = 0; k < 9; k++) {                                   // drooping fronds: one tapered outline each
    const a = -Math.PI / 2 + (k - 4) * .36 + (r() - .5) * .15, len = h * (.36 + .1 * r());
    const pts = [], pts2 = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, droop = t * t * len * .55 * Math.abs(Math.cos(a)) + t * t * 30;
      const px = top[0] + Math.cos(a) * len * t, py = top[1] + Math.sin(a) * len * t + droop, w = 16 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 1;
      const nx = -Math.sin(a), ny = Math.cos(a); pts.push([px + nx * w, py + ny * w]); pts2.push([px - nx * w * .4, py - ny * w * .4]); }
    p.addPath(polyPath([...pts, ...pts2.reverse()]));
  }
}

// ================= the night sky (opening print; re-inked for the turn) =================
// o = { rot: constellation drift in degrees, earth: wobble phase or null, arc: 0..1 }
const RING = { x: 1120, y: 500, r0: 300, r1: 312 };
function constellations(rot) {
  const r = mulberry(91), out = [];
  for (let i = 0; i < 12; i++) {
    const a0 = ((i + .5) * 30 - 90 + rot) * D2R, n = 3 + (i % 3), pts = [];
    for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * .075 + (r() - .5) * .05, rad = 360 + r() * 46; pts.push([RING.x + Math.cos(a) * rad, RING.y + Math.sin(a) * rad]); }
    out.push(pts);
  }
  return out;
}
function night(o = {}) {
  const rot = o.rot || 0, r = mulberry(5);
  const stars = new Path2D();
  for (let k = 0; k < 120; k++) { const x = r() * AW, y = r() * 760, s = r() < .85 ? 1.6 + r() * 1.6 : 3.4 + r() * 2; if (Math.hypot(x - RING.x, y - RING.y) < 470 && Math.hypot(x - RING.x, y - RING.y) > 260) continue; stars.addPath(circlePath(x, y, s)); }
  const C = constellations(rot);
  for (const g of C) for (const [x, y] of g) stars.addPath(circlePath(x, y, 5.5));
  const moonCut = stars;
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, AW + 2 * BL, 200 + BL); sky2.addPath(bandSteps(-BL, AW + 2 * BL, 190, 560, 6, 12));
  const lines = new Path2D(); for (const g of C) for (let k = 0; k < g.length - 1; k++) lines.addPath(bar(g[k][0], g[k][1], g[k + 1][0], g[k + 1][1], 2.4));
  const ring = new Path2D(); ring.addPath(ringPath(RING.x, RING.y, RING.r0, RING.r1));
  for (let i = 0; i < 12; i++) { const a = (i * 30 - 90) * D2R; ring.addPath(bar(RING.x + Math.cos(a) * (RING.r0 - 22), RING.y + Math.sin(a) * (RING.r0 - 22), RING.x + Math.cos(a) * (RING.r1 + 16), RING.y + Math.sin(a) * (RING.r1 + 16), 5)); }
  const signs = new Path2D(); for (let i = 0; i < 12; i++) { const a = ((i + .5) * 30 - 90) * D2R; signs.addPath(star4(RING.x + Math.cos(a) * 278, RING.y + Math.sin(a) * 278, 13)); }
  const far = ridgeFill(812, 90, 12); const mid = ridgeFill(866, 60, 17);
  // near: a rooftop terrace, a person sitting on the parapet looking up, a tulsi pot
  const near = new Path2D(); near.rect(-BL, 900, AW + 2 * BL, AH);
  near.rect(250, 868, 520, 34);                                                     // parapet
  const fx = 470; near.addPath(circlePath(fx, 772, 23));                                // head, tilted up
  near.addPath(polyPath([[fx - 30, 868], [fx - 34, 818], [fx - 14, 796], [fx + 16, 798], [fx + 30, 822], [fx + 26, 868]]));   // torso
  near.addPath(polyPath([[fx + 20, 850], [fx + 92, 846], [fx + 98, 900], [fx + 80, 900], [fx + 76, 866], [fx + 18, 868]])); // knees and shin
  near.addPath(polyPath([[fx - 26, 820], [fx - 62, 856], [fx - 54, 866], [fx - 18, 840]]));                                 // arm, leaning back
  near.addPath(polyPath([[1450, 900], [1462, 852], [1530, 852], [1542, 900]])); const leaf = new Path2D(); for (let k = 0; k < 7; k++) blob(leaf, 1470 + k * 9, 830 - (k % 3) * 14, 12, 22); near.addPath(leaf);
  const lit = new Path2D(); lit.rect(250, 868, 520, 6); lit.addPath(polyPath([[fx - 14, 796], [fx + 16, 798], [fx + 10, 808], [fx - 10, 808]]));
  const parts = [
    { pull: 'sky1', ink: 'sky1', path: FULL(), cut: moonCut },
    { pull: 'sky2', ink: 'sky2', path: sky2, cut: moonCut },
    { pull: 'moon', ink: 'sun', path: circlePath(250, 560, 62), cut: circlePath(276, 542, 58) },
    { pull: 'far', ink: 'far', path: far },
    { pull: 'mid', ink: 'mid', path: mid },
    { pull: 'near', ink: 'near', path: near },
    { pull: 'lit', ink: 'glow', path: lit, lit: 1 },
    { pull: 'ring', ink: 'glow', path: ring },
    { pull: 'signs', ink: 'sun', path: signs },
    { pull: 'lines', ink: 'glow', path: lines, loose: 1 },
  ];
  if (o.earth != null) {                                            // the spinning top: Earth, its tilted axis tracing a cone
    const ex = RING.x, ey = RING.y + 10, ph = o.earth, tilt = 23.5 * D2R, L = 150;
    const tip = [ex + Math.sin(ph) * Math.sin(tilt) * L, ey - Math.cos(tilt) * L + Math.cos(ph) * Math.sin(tilt) * L * .32];
    const foot = [2 * ex - tip[0], 2 * ey - tip[1]];
    const cone = new Path2D(); for (let k = 0; k < 18; k++) { const a0 = k / 18 * Math.PI * 2, a1 = a0 + .2; const q = a => [ex + Math.sin(a) * Math.sin(tilt) * L, ey - Math.cos(tilt) * L + Math.cos(a) * Math.sin(tilt) * L * .32]; const A = q(a0), Bq = q(a1); cone.addPath(bar(A[0], A[1], Bq[0], Bq[1], 4)); }
    parts.push({ pull: 'earth', ink: 'mid', path: circlePath(ex, ey, 74) });
    parts.push({ pull: 'earth', ink: 'glow', path: circlePath(ex, ey, 74), cut: circlePath(ex + 26, ey + 14, 70), lit: 1 });
    parts.push({ pull: 'cone', ink: 'sun', path: cone });
    parts.push({ pull: 'axis', ink: 'sun', path: bar(foot[0], foot[1], tip[0], tip[1], 7) });
  }
  if (o.arc > 0) {                                                  // the 24° arc between where the sign sits and where its stars are now
    const a0 = (0.5 * 30 - 90) * D2R, a1 = a0 + 24 * D2R * o.arc;
    parts.push({ pull: 'arc', ink: 'sun', path: sector(RING.x, RING.y, 424, 438, a0, a1) });
    parts.push({ pull: 'arc', ink: 'sun', path: bar(RING.x + Math.cos(a0) * 412, RING.y + Math.sin(a0) * 412, RING.x + Math.cos(a0) * 452, RING.y + Math.sin(a0) * 452, 6) });
  }
  return { parts, depth: { sky1: 0, sky2: 0, moon: .1, far: .3, mid: .5, near: .9, lit: .9, ring: .2, signs: .2, lines: .6 },
    header: { x: 104, y: 196, size: 150, text: 'आकाश का नक्शा', sub: 'ज्योतिष की रहस्यमयी दुनिया' } };
}

// ================= Babylon at dusk: ziggurat, river, palms; the sun's path cut into 12 =================
const ECL = { x: 960, y: 930, rx: 830, ry: 640 };
function eclPt(t) { const a = Math.PI + .28 + t * (Math.PI - .56); return [ECL.x + Math.cos(a) * ECL.rx, ECL.y + Math.sin(a) * ECL.ry]; }
function babylon() {
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, AW + 2 * BL, 150 + BL); sky2.addPath(bandSteps(-BL, AW + 2 * BL, 140, 600, 7, 10));
  const moonCut = new Path2D();
  const far = new Path2D(); far.rect(-BL, 760, AW + 2 * BL, 400);
  { const r = mulberry(33); for (let x = -BL; x < AW + BL; x += 60 + r() * 70) { const w = 50 + r() * 80, h = 20 + r() * 50; far.rect(x, 760 - h, w, h + 2); } }
  const CX = 820, tiers = [[CX - 360, 650, 720, 150], [CX - 255, 556, 510, 98], [CX - 150, 474, 300, 86], [CX - 62, 414, 124, 62]];
  const zig = unionPath(tiers.map(a => rectPath(...a)));
  const stair = polyPath([[CX - 70, 800], [CX + 70, 800], [CX + 34, 474], [CX - 34, 474]]);
  const treads = new Path2D(); for (let y = 480; y < 798; y += 12) { const w = lerp(34, 70, (y - 474) / 326); treads.rect(CX - w, y, 2 * w, 4); }
  const shade = unionPath(tiers.map(([x, y, w, h]) => rectPath(x + w * .62, y, w * .38, h)));
  const river = polyPath([[-BL, 842], [AW + BL, 822], [AW + BL, 922], [-BL, 946]]);
  const glints = new Path2D(); { const r = mulberry(41); for (let k = 0; k < 26; k++) { const x = r() * AW, y = 850 + r() * 76, w = 30 + r() * 110; glints.rect(x, y, w, 4); } }
  const near = new Path2D(); near.rect(-BL, 800, AW + 2 * BL, AH);
  palm(near, 180, 860, 520, -40, 3); palm(near, 330, 870, 380, 30, 4); palm(near, 1560, 860, 470, 50, 5); palm(near, 1380, 880, 300, -20, 6);
  const reeds = new Path2D(); for (let k = 0; k < 40; k++) { const x = 40 + k * 46 + (hash(k) - .5) * 20, h = 30 + hash(k * 3) * 50; reeds.addPath(polyPath([[x - 6, 950], [x, 950 - h], [x + 6, 950]])); } near.addPath(reeds);
  const dash = new Path2D(), diam = new Path2D();
  for (let i = 0; i < 12; i++) { const a = eclPt(i / 12 + .006), b = eclPt((i + 1) / 12 - .006); const m = eclPt((i + .5) / 12); dash.addPath(bar(a[0], a[1], b[0], b[1], 7)); diam.addPath(star4(m[0], m[1] - 30, 14)); }
  const parts = [
    { pull: 'sky1', ink: 'sky1', path: FULL(), cut: moonCut },
    { pull: 'sky2', ink: 'sky2', path: sky2, cut: moonCut },
    { pull: 'moon', ink: 'sun', path: circlePath(986, 228, 52), cut: circlePath(1010, 214, 48) },
    { pull: 'far', ink: 'far', path: far, cut: river },
    { pull: 'mid', ink: 'mid', path: unionPath([zig, stair]) },
    { pull: 'mid', ink: 'near', path: shade },
    { pull: 'lit', ink: 'glow', path: treads, lit: 1 },
    { pull: 'near', ink: 'near', path: near, cut: river },
    { pull: 'water', ink: 'glow', path: glints, lit: 1 },
  ];
  for (let i = 0; i < 12; i++) { const a = eclPt(i / 12 + .006), b = eclPt((i + 1) / 12 - .006), m = eclPt((i + .5) / 12); parts.push({ pull: 'ecl' + i, ink: 'sun', path: unionPath([bar(a[0], a[1], b[0], b[1], 7), star4(m[0], m[1] - 30, 14)]) }); }
  return { parts, depth: { sky1: 0, sky2: 0, moon: .1, far: .3, mid: .55, lit: .55, near: .9, water: .9 }, header: { x: 104, y: 196, size: 150, text: 'बेबीलोन' },
    seal: { label: 'सबसे पुरानी कुंडली', value: 'ई.पू. 410', foot: 'मिट्टी की पट्टी' } };
}

// ================= Alexandria at noon: lighthouse, harbour, a sun with rings =================
function alex() {
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, AW + 2 * BL, 120 + BL); sky2.addPath(bandSteps(-BL, AW + 2 * BL, 110, 520, 6, 0));
  const SUN = [1290, 270], sunCut = unionPath([ringPath(SUN[0], SUN[1], 84, 98), ringPath(SUN[0], SUN[1], 118, 126)]);
  const far = ridgeFill(700, 40, 51, 760);
  const glints = new Path2D(); { const r = mulberry(52); for (let k = 0; k < 44; k++) { const y = 740 + Math.pow(r(), 1.3) * 340, w = 20 + (y - 720) * .45 * r(); glints.rect(r() * AW, y, w, 3 + (y - 740) / 70); } }
  const sea = rectPath(-BL, 726, AW + 2 * BL, AH);
  const LX = 960;
  const tower = unionPath([polyPath([[LX - 150, 760], [LX - 120, 420], [LX + 120, 420], [LX + 150, 760]]), polyPath([[LX - 84, 420], [LX - 70, 262], [LX + 70, 262], [LX + 84, 420]]),
    rectPath(LX - 44, 176, 88, 88), polyPath([[LX - 58, 180], [LX + 58, 180], [LX + 40, 166], [LX - 40, 166]]), rectPath(LX - 132, 410, 264, 14), rectPath(LX - 80, 254, 160, 12)]);
  const windows = new Path2D(); for (let i = 0; i < 4; i++) windows.rect(LX - 10, 470 + i * 70, 20, 34); for (let i = 0; i < 2; i++) windows.rect(LX - 8, 290 + i * 60, 16, 28);
  const litT = unionPath([polyPath([[LX - 150, 760], [LX - 120, 420], [LX - 40, 420], [LX - 52, 760]]), polyPath([[LX - 84, 420], [LX - 70, 262], [LX - 22, 262], [LX - 26, 420]]), rectPath(LX - 44, 180, 30, 84)]);
  const island = new Path2D(); island.addPath(polyPath([[LX - 330, 800], [LX - 220, 740], [LX + 210, 738], [LX + 340, 806], [LX + 330, 830], [LX - 340, 830]]));
  const near = new Path2D(); near.addPath(island);
  near.addPath(polyPath([[-BL, 880], [520, 880], [560, 910], [-BL, 910]])); near.rect(-BL, 905, 640, 300);                 // quay, lower left
  for (let k = 0; k < 6; k++) near.rect(30 + k * 90, 846, 16, 40);                                                            // bollards
  const hull = polyPath([[1430, 842], [1720, 842], [1670, 880], [1470, 880]]); near.addPath(hull); near.addPath(rectPath(1566, 610, 8, 236));
  const sail = polyPath([[1578, 616], [1578, 820], [1700, 820]]);
  const flame = polyPath([[LX - 30, 166], [LX - 16, 120], [LX - 2, 140], [LX + 8, 96], [LX + 24, 138], [LX + 30, 166]]);
  return { parts: [
    { pull: 'sky1', ink: 'sky1', path: FULL() },
    { pull: 'sky2', ink: 'sky2', path: sky2, cut: circlePath(SUN[0], SUN[1], 150) },
    { pull: 'sun', ink: 'sun', path: circlePath(SUN[0], SUN[1], 128), cut: sunCut },
    { pull: 'far', ink: 'far', path: far },
    { pull: 'mid', ink: 'mid', path: sea, cut: glints },
    { pull: 'near', ink: 'near', path: unionPath([near, tower]), cut: unionPath([windows, sail]) },
    { pull: 'lit', ink: 'far', path: litT, cut: windows, lit: 1 },
    { pull: 'fire', ink: 'sun', path: flame },
  ], depth: { sky1: 0, sky2: 0, sun: .1, far: .3, mid: .5, near: .85, lit: .85, fire: .85 }, header: { x: 104, y: 196, size: 150, text: 'अलेक्ज़ान्द्रिया' },
    seal: { label: 'टॉलेमी की किताब', value: 'दूसरी सदी', foot: 'ग्रहों के नियम' } };
}

// ================= Jaipur at dawn: the giant stone sundial; 27 nakshatras and 9 grahas across the sky =================
const NAK = { x: 960, y: 1060, rx: 800, ry: 700 };
function nakPt(t, k = 1) { const a = Math.PI + .3 + t * (Math.PI - .6); return [NAK.x + Math.cos(a) * NAK.rx * k, NAK.y + Math.sin(a) * NAK.ry * k]; }
function jaipur() {
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, AW + 2 * BL, 140 + BL); sky2.addPath(bandSteps(-BL, AW + 2 * BL, 130, 560, 6, 16));
  const far = ridgeFill(640, 70, 61, AH + BL);
  { const r = mulberry(62); for (let x = 300; x < 1500; x += 34) far.addPath(rectPath(x, 600 + Math.sin(x * .004) * 14, 18, 30 + r() * 8)); far.addPath(rectPath(290, 622, 1220, 20)); }   // fort wall on the ridge
  const mid = new Path2D(); mid.rect(-BL, 790, AW + 2 * BL, 400);
  { const r = mulberry(63); for (let x = -40; x < AW + 40; x += 110 + r() * 60) { const w = 60 + r() * 50, h = 40 + r() * 60; mid.rect(x - w / 2, 790 - h, w, h + 2); const d = new Path2D(); d.moveTo(x - w * .4, 792 - h); d.ellipse(x, 792 - h, w * .4, w * .36, 0, Math.PI, 0); d.closePath(); mid.addPath(d); mid.addPath(polyPath([[x - 3, 790 - h - w * .36], [x, 790 - h - w * .36 - 18], [x + 3, 790 - h - w * .36]])); } }
  // near: Samrat Yantra-like gnomon (stairs up the hypotenuse), the kiosk on top, the quadrant wall
  const g0 = [470, 900], g1 = [1170, 900], g2 = [1170, 330];
  const gnomon = polyPath([g0, g1, g2]);
  const steps = new Path2D(); for (let i = 0; i < 30; i++) { const t = i / 30, x = lerp(g0[0], g2[0], t), y = lerp(g0[1], g2[1], t); steps.rect(x - 4, y - 8, 30, 5); }
  const kiosk = unionPath([rectPath(1110, 282, 10, 52), rectPath(1220, 282, 10, 52), rectPath(1098, 272, 144, 14), (() => { const d = new Path2D(); d.moveTo(1112, 274); d.ellipse(1170, 274, 58, 50, 0, Math.PI, 0); d.closePath(); return d; })(), polyPath([[1166, 224], [1170, 196], [1174, 224]])]);
  const quad = sector(1170, 900, 330, 384, -Math.PI / 2, 0);
  const quad2 = sector(470, 900, 230, 270, Math.PI, Math.PI * 1.5);
  const near = new Path2D(); near.rect(-BL, 900, AW + 2 * BL, 300); near.addPath(gnomon); near.addPath(kiosk); near.addPath(quad); near.addPath(quad2);
  const marks = new Path2D(); for (let i = 1; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 24; marks.addPath(bar(1170 + Math.cos(a) * 336, 900 + Math.sin(a) * 336, 1170 + Math.cos(a) * 378, 900 + Math.sin(a) * 378, 4)); }
  const lit = unionPath([steps, marks, polyPath([[1170, 330], [1182, 330], [1182, 900], [1170, 900]])]);
  const parts = [
    { pull: 'sky1', ink: 'sky1', path: FULL() },
    { pull: 'sky2', ink: 'sky2', path: sky2 },
    { pull: 'far', ink: 'far', path: far },
    { pull: 'mid', ink: 'mid', path: mid },
    { pull: 'near', ink: 'near', path: near },
    { pull: 'lit', ink: 'glow', path: lit, lit: 1 },
  ];
  for (let i = 0; i < 27; i++) { const a = nakPt(i / 27 + .004), b = nakPt((i + 1) / 27 - .006); parts.push({ pull: 'nak' + i, ink: 'near', path: bar(a[0], a[1], b[0], b[1], 6) }); }
  for (let i = 0; i < 9; i++) { const [x, y] = nakPt((i + .5) / 9, .9); parts.push({ pull: 'gr' + i, ink: 'sun', path: circlePath(x, y, 17), cut: circlePath(x, y, 7) }); }
  return { parts, depth: { sky1: 0, sky2: 0, far: .3, mid: .55, near: .9, lit: .9 }, header: { x: 104, y: 196, size: 150, text: 'भारत', sub: '27 नक्षत्र · 12 राशियाँ · 9 ग्रह' },
    seal: { label: 'जंतर मंतर, जयपुर', value: '1734', foot: 'पत्थर की धूपघड़ी' } };
}

// ================= London 1930: rooftops, and the morning paper's first star column =================
const SHEET = { x: 560, y: 300, w: 820, h: 590 };
function boxRect(i) { const c = i % 4, r = Math.floor(i / 4), bw = (SHEET.w - 80) / 4, bh = (SHEET.h - 170) / 3; return [SHEET.x + 40 + c * bw, SHEET.y + 140 + r * bh, bw - 18, bh - 18]; }
function london() {
  const sky2 = new Path2D(); sky2.rect(-BL, -BL, AW + 2 * BL, 120 + BL); sky2.addPath(bandSteps(-BL, AW + 2 * BL, 110, 480, 6, 0));
  const sheet = rectPath(SHEET.x, SHEET.y, SHEET.w, SHEET.h);
  const far = new Path2D(); far.rect(-BL, 700, AW + 2 * BL, 500);
  { const r = mulberry(71); for (let x = -BL; x < AW + BL; x += 70 + r() * 60) { const w = 60 + r() * 70, h = 40 + r() * 110; far.rect(x, 700 - h, w, h + 2); if (r() < .5) far.rect(x + w * .3, 700 - h - 30, 12, 32); } }
  far.addPath(rectPath(1540, 360, 70, 345)); far.addPath(polyPath([[1530, 362], [1575, 280], [1620, 362]]));   // a clock tower
  const dome = new Path2D(); dome.moveTo(200, 560); dome.ellipse(300, 560, 100, 92, 0, Math.PI, 0); dome.closePath(); far.addPath(dome); far.addPath(rectPath(190, 556, 220, 150)); far.addPath(rectPath(294, 440, 12, 40));
  const clock = circlePath(1575, 420, 22);
  const mid = new Path2D(); mid.rect(-BL, 820, AW + 2 * BL, 400);
  { const r = mulberry(72); for (let x = -BL; x < AW + BL; x += 120 + r() * 80) { const w = 110 + r() * 60; mid.addPath(polyPath([[x, 822], [x + w / 2, 760 - r() * 40], [x + w, 822]])); for (let c = 0; c < 2; c++) mid.rect(x + w * (.25 + c * .4), 730 - r() * 40, 16, 70); } }
  const near = new Path2D(); near.rect(-BL, 930, AW + 2 * BL, 300);
  near.addPath(rectPath(1640, 520, 14, 420)); near.addPath(polyPath([[1612, 520], [1682, 520], [1666, 470], [1628, 470]])); near.addPath(rectPath(1620, 512, 54, 10));   // lamp post
  for (let x = -40; x < AW + 40; x += 38) near.rect(x, 900, 8, 34); near.rect(-BL, 896, AW + 2 * BL, 8);    // railing
  const mast = rectPath(SHEET.x + 26, SHEET.y + 26, SHEET.w - 52, 92);
  const lamp = polyPath([[1628, 470], [1666, 470], [1660, 490], [1634, 490]]);
  const parts = [
    { pull: 'sky1', ink: 'sky1', path: FULL(), cut: sheet },
    { pull: 'sky2', ink: 'sky2', path: sky2, cut: sheet },
    { pull: 'far', ink: 'far', path: far, cut: unionPath([sheet, clock]) },
    { pull: 'mid', ink: 'mid', path: mid, cut: sheet },
    { pull: 'near', ink: 'near', path: near, cut: sheet },
    { pull: 'lit', ink: 'sun', path: lamp },
    { pull: 'mast', ink: 'near', path: mast, sheetText: 1 },
  ];
  for (let i = 0; i < 12; i++) {
    const [x, y, w, h] = boxRect(i), frame = new Path2D(); frame.rect(x, y, w, h); frame.rect(x + 5, y + 5, w - 10, h - 10);
    const lines = new Path2D(); for (let k = 0; k < 3; k++) lines.rect(x + 74, y + 26 + k * 24, w - 96 - (k === 2 ? 40 : 0), 7);
    parts.push({ pull: 'box' + i, ink: 'mid', path: unionPath([frame, lines]), rule: 'evenodd' });
    parts.push({ pull: 'box' + i, ink: 'sun', path: star5(x + 40, y + h / 2, 24) });
  }
  return { parts, depth: { sky1: 0, sky2: 0, far: .3, mid: .55, near: .9, lit: .9, mast: .7 }, header: { x: 104, y: 196, size: 150, text: 'लंदन' },
    seal: { label: 'अख़बार का पहला कॉलम', value: '1930', foot: 'सितारों की बातें' }, mast: 'आपका राशिफल' };
}

// ---------------- printing a scene ----------------
// st = { pal, prog(pull) → 0..1 (default 1), angle, sep, off(pull, depth), seed, rec(id, text, box) }
const TX = { list: [] };
function rec(ctx, id, text, box) { const m = ctx.getTransform(); const a = m.transformPoint(new DOMPoint(box[0], box[1])), b = m.transformPoint(new DOMPoint(box[2], box[3])); TX.list.push({ id, text, x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }); }
function region(p, ang, sd, box = [-300, -300, AW + 600, AH + 600], cx = AW / 2, cy = AH / 2) {
  if (p >= 1) return null; const m = new DOMMatrix().translate(cx, cy).rotate(ang / D2R).translate(-cx, -cy);
  const o = new Path2D(); o.addPath(wipeRegion(box, 'down', p, sd, 34, 6), m); return o;
}
function front(p, ang, box = [-300, -300, AW + 600, AH + 600], cx = AW / 2, cy = AH / 2) {
  const y = wipeFront(box, 'down', p, 34), m = new DOMMatrix().translate(cx, cy).rotate(ang / D2R).translate(-cx, -cy);
  const a = m.transformPoint(new DOMPoint(box[0], y)), b = m.transformPoint(new DOMPoint(box[0] + box[2], y)), d = m.transformPoint(new DOMPoint(0, 1)), o = m.transformPoint(new DOMPoint(0, 0));
  return { a: [a.x, a.y], b: [b.x, b.y], lead: [d.x - o.x, d.y - o.y] };
}
function drawScene(ctx, T, S, st) {
  const pal = st.pal, prog = st.prog || (() => 1), ang = st.angle ?? -.08, seed = st.seed || 1, sep = st.sep || 0;
  paperSheet(ctx, T, -BL, -BL, AW + 2 * BL, AH + 2 * BL, .6);
  let blade = null;
  S.parts.forEach((pt, j) => {
    const p = prog(pt.pull); if (p <= 0) return;
    const d = (S.depth && S.depth[pt.pull]) ?? .6, off = st.off ? st.off(pt.pull, d) : [0, 0];
    ctx.save(); ctx.translate(off[0], off[1]);
    if (pt.cut) ctx.clip(inverse(pt.cut), 'evenodd');
    if (sep > 0 && d >= .25 && p >= 1 && !pt.lit) {                 // loose layers: a paper-thickness shadow and a sliver of bare paper
      ctx.save(); ctx.translate(0, -9 * sep * d); ctx.globalAlpha = .26 * Math.min(1, sep * 1.5); ctx.fillStyle = '#140f14'; ctx.fill(pt.path, pt.rule || 'nonzero'); ctx.restore();
      ctx.save(); ctx.translate(1.5 * sep, -3.4 * sep); ctx.fillStyle = PAPER; ctx.fill(pt.path, pt.rule || 'nonzero'); ctx.restore();
    }
    ink(ctx, pt, { color: pal[pt.ink], reg: R2(seed + j * 5, 2.2 * (st.reg ?? 1)), clip: region(p, ang, seed + j * 3), sheen: 1, trap: pt.lit ? 0 : 1, lw: 1.8 });
    ctx.restore();
    if (p > 0 && p < 1 && st.blade !== false && ['sky1', 'sky2', 'far', 'mid', 'near'].includes(pt.pull)) blade = { p, color: pal[pt.ink] };
  });
  // the masthead text (London) prints with its band
  if (S.mast && prog('mast') > 0) {
    const p = prog('mast'), col = pickInk(pal.near, [PAPER, pal.sky1], 4.5);
    ink(ctx, { paint: c => { c.font = `700 84px ${FD}`; c.letterSpacing = '6px'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(S.mast, SHEET.x + SHEET.w / 2, SHEET.y + 104); } },
      { color: col, reg: R2(seed + 77, 1.2), clip: p < 1 ? wipeRegion([SHEET.x, SHEET.y, SHEET.w, 140], 'right', p, 17, 30) : null });
    rec(ctx, 'mast', S.mast, [SHEET.x + 200, SHEET.y + 40, SHEET.x + SHEET.w - 200, SHEET.y + 112]);
  }
  // header printed into the sky
  const h = S.header, hp = prog('header');
  if (h && hp > 0) {
    const off = st.off ? st.off('sky', 0) : [0, 0];
    ctx.save(); ctx.translate(off[0], off[1]);
    const col = pickInk([pal.sky2], [pal.sky1, PAPER, pal.sun, pal.near], 3);
    ink(ctx, { paint: c => { c.font = `700 ${h.size}px ${FD}`; c.letterSpacing = (h.size * .04) + 'px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(h.text, h.x, h.y); } },
      { color: col, reg: R2(seed + 44, 1.4), clip: hp < 1 ? wipeRegion([h.x - 20, h.y - h.size, 1300, h.size * 1.3], 'right', hp, 13, 40) : null });
    ctx.save(); ctx.font = `700 ${h.size}px ${FD}`; ctx.letterSpacing = (h.size * .04) + 'px'; const hw = ctx.measureText(h.text).width; ctx.restore();
    rec(ctx, 'hdr', h.text, [h.x, h.y - h.size * .62, h.x + hw, h.y + 10]);
    const sp = prog('sub');
    if (h.sub && sp > 0) {
      ink(ctx, { paint: c => { c.font = `600 44px ${FT}`; c.letterSpacing = '3px'; c.textAlign = 'left'; c.fillText(h.sub, h.x + 6, h.y + 66); } },
        { color: col, reg: R2(seed + 46, 1.2), clip: sp < 1 ? wipeRegion([h.x - 10, h.y + 10, 1100, 80], 'right', sp, 19, 30) : null });
      ctx.save(); ctx.font = `600 44px ${FT}`; ctx.letterSpacing = '3px'; const sw2 = ctx.measureText(h.sub).width; ctx.restore();
      rec(ctx, 'hsub', h.sub, [h.x, h.y + 22, h.x + 6 + sw2, h.y + 80]);
    }
    ctx.restore();
  }
  // the seal: a dark round plate printed last, then its three lines
  const sl = S.seal;
  if (sl && prog('seal') > 0) {
    const p = prog('seal'), { x, y, r } = SEAL;
    ink(ctx, { path: circlePath(x, y, r), knock: ringPath(x, y, r - 18, r - 13) }, { color: pal.near, reg: R2(seed + 51, 1.2), clip: p < 1 ? wipeRegion([x - r - 30, y - r - 30, 2 * r + 60, 2 * r + 60], 'down', p, 9, 40) : null, sheen: 1 });
    const lab = pickInk(pal.near, [pal.glow, pal.sky1, PAPER], 4.5), key = pickInk(pal.near, [pal.sun, pal.sky1, PAPER], 3);
    const item = (k, fn, color, box, id, text) => { const q = prog(k); if (q <= 0) return; ink(ctx, { paint: fn }, { color, reg: R2(seed + id.length * 7, 1.1), clip: q < 1 ? wipeRegion(box, 'right', q, 31 + id.length, 24) : null }); rec(ctx, id, text, box); };
    const fit = (c, s, max, w0, wt, fam) => { let f = w0; c.font = `${wt} ${f}px ${fam}`; while (c.measureText(s).width > max && f > 18) { f -= 2; c.font = `${wt} ${f}px ${fam}`; } };
    item('slab', c => { fit(c, sl.label, 250, 28, 600, FT); c.textAlign = 'center'; c.fillText(sl.label, x, y - 62); }, lab, [x - 130, y - 100, x + 130, y - 50], 'slab', sl.label);
    item('sval', c => { fit(c, sl.value, 270, 118, 700, FD); c.textAlign = 'center'; c.fillText(sl.value, x, y + 44); c.fillRect(x - 96, y + 62, 192, 5); }, key, [x - 140, y - 46, x + 140, y + 68], 'sval', sl.value);
    item('sfoot', c => { fit(c, sl.foot, 230, 26, 500, FT); c.textAlign = 'center'; c.fillText(sl.foot, x, y + 108); }, lab, [x - 120, y + 76, x + 120, y + 118], 'sfoot', sl.foot);
  }
  if (st.extra) st.extra(ctx);
  if (st.finish !== false) inkFinish(ctx, T, -BL, -BL, AW + 2 * BL, AH + 2 * BL, .6, 1);
  if (blade && st.blade !== false) { const f = front(blade.p, ang); squeegee(ctx, f.a, f.b, f.lead, { color: blade.color, roll: blade.p * 40, handle: .35, scale: 1.4, bead: 26 }); }
}

// ---------------- timeline ----------------
// pulls: name → [t0, d] (film clock). Pulls not listed are already printed (they arrive behind a sweep).
const P0 = { sky1: [0, .7], sky2: [bt(0, 1), .6], moon: [bt(0, 2), .4], far: [bt(0, 3), .45], mid: [bt(1, 0), .45], near: [bt(1, 1), .45], lit: [bt(1, 1.5), .3],
  ring: [bt(1, 2), .45], signs: [bt(1, 3), .3], lines: [bt(1, 3.5), .3], header: [bt(2, 0), .42], sub: [bt(2, 1), .32] };
const LIFT0 = bt(1, 3.75);
const TB = bt(5);                                                                     // 14.29 · palm wipe into Babylon
const P1 = { sky1: [TB, .34], sky2: [TB + B * .5, .34], moon: [TB + B, .3], far: [TB + B * 1.5, .3], mid: [TB + B * 2, .34], lit: [TB + B * 2.5, .25], near: [TB + B * 3, .36], water: [TB + B * 3.5, .25],
  header: [bt(6, 1), .4], seal: [bt(10, 1), .3], slab: [bt(10, 1.5), .22], sval: [bt(10, 2), .25], sfoot: [bt(10, 2.5), .22] };
for (let i = 0; i < 12; i++) P1['ecl' + i] = [bt(8, 0) + i * B / 2, .16];             // 22.86 → 26.8, one stamp per eighth
const TA = bt(12);                                                                    // 34.29 · sweep into Alexandria
const P2 = { sun: [TA + B, .3], fire: [TA + B * 1.5, .2], header: [TA + B * 2, .4], seal: [bt(13, 2), .3], slab: [bt(13, 2.5), .22], sval: [bt(13, 3), .25], sfoot: [bt(13, 3.5), .22] };
const TJ = bt(16);                                                                    // 45.71 · kiosk-silhouette wipe into Jaipur
const P3 = { sky1: [TJ, .34], sky2: [TJ + B * .5, .34], far: [TJ + B, .3], mid: [TJ + B * 1.5, .3], near: [TJ + B * 2, .36], lit: [TJ + B * 2.5, .25], header: [TJ + B * 3, .4], sub: [bt(18, 1), .35],
  seal: [bt(20, 1), .3], slab: [bt(20, 1.5), .22], sval: [bt(20, 2), .25], sfoot: [bt(20, 2.5), .22] };
for (let i = 0; i < 27; i++) P3['nak' + i] = [bt(17, 0) + i * B / 4, .1];            // 48.57 → 53.3, one per sixteenth
for (let i = 0; i < 9; i++) P3['gr' + i] = [bt(18, 3) + i * B / 2, .14];               // 53.57 → 56.4
const SNAP_J = bt(20);                                                                // 57.14 · the loose planes clamp into register
const TL0 = bt(24);                                                                   // 68.57 · sweep into London
const P4 = { lit: [TL0 + B, .2], header: [TL0 + B * 1.5, .4], seal: [bt(25, 0), .3], slab: [bt(25, .5), .22], sval: [bt(25, 1), .25], sfoot: [bt(25, 1.5), .22], mast: [bt(25, 2), .35] };
for (let i = 0; i < 12; i++) P4['box' + i] = [bt(26, 0) + i * B / 2, .18];            // 74.29 → 78.2
const SIL1 = bt(27, 1);                                                               // 77.86 · music drops out
const TN = bt(28);                                                                    // 80.00 · slow sweep back to the night sky, re-inked
const P5 = { ring: [TN + B * 2, .45], signs: [TN + B * 3, .3], lines: [TN + B * 3.5, .3], earth: [bt(29, 2), .35], cone: [bt(29, 3), .3], axis: [bt(29, 3.5), .2], arc: [bt(32, .5), .3] };
const SLIP = [bt(29, 2), bt(32)];                                                     // 84.29 → 91.43 constellations drift 24°, loose
const SNAP = bt(32);                                                                  // 91.43 · clamp
const DEG = [bt(32, .25), .3];                                                        // the "24°" figure
const SIL2 = [bt(35, 1.5), bt(36)];                                                   // 101.07 → 102.86 near-silence
const TW = bt(36);                                                                    // 102.86 · the series wall
const TITLE = [bt(41, 0), .45];                                                       // 117.14 the title on the wall

export const SHOTS = [
  { n: 1, t0: 0, t1: TB }, { n: 2, t0: TB, t1: TA }, { n: 3, t0: TA, t1: TJ }, { n: 4, t0: TJ, t1: TL0 },
  { n: 5, t0: TL0, t1: TN }, { n: 6, t0: TN, t1: TW }, { n: 7, t0: TW, t1: bt(40) }, { n: 8, t0: bt(40), t1: DUR },
];

// ---------------- cameras (art units; z ≥ 1 keeps the view inside the print) ----------------
function camAt(keys, t, inside = true) {
  let s = keys[0][2].slice();
  for (const [t0, d, to, kind] of keys) {
    if (t < t0) break;
    const u = d <= 0 ? 1 : seg(t, t0, t0 + d), e = kind === 'lin' ? u : kind === 'eo' ? eo(u) : eio(u);
    s = [lerp(s[0], to[0], e), lerp(s[1], to[1], e), Math.exp(lerp(Math.log(s[2]), Math.log(to[2]), e))];
  }
  if (!inside) return s;
  const z = Math.max(1, s[2]), hw = W / 2 / z, hh = H / 2 / z;
  return [clamp(s[0], hw, AW - hw), clamp(s[1], hh, AH - hh), z];
}
const CAM0 = [[0, 0, [300, 520, 2.6]], [0, bt(0, 2), [320, 520, 2.4], 'lin'], [bt(0, 2), 2.2, [960, 540, 1.0], 'eo'], [bt(2, 2), TB - bt(2, 2), [760, 560, 1.12], 'eio']];
const CAM1 = [[0, 0, [1060, 540, 1.16]], [TB, 4.2, [960, 540, 1.0], 'eo'], [bt(7, 3), 2.4, [960, 470, 1.18], 'eio'], [bt(10, 0), 1.6, [1500, 380, 1.5], 'eio'], [bt(11, 2), 1.2, [1380, 420, 1.3], 'eio']];
const CAM2 = [[0, 0, [960, 700, 1.7]], [TA + .6, 5.4, [960, 330, 1.45], 'eio'], [bt(13, 1), 2.2, [960, 540, 1.0], 'eo'], [bt(14, 2), TJ - bt(14, 2), [1020, 520, 1.06], 'lin']];
const CAM3 = [[0, 0, [960, 300, 1.55]], [TJ + .3, SNAP_J - TJ - .3, [880, 560, 1.12], 'eio'], [SNAP_J, .35, [960, 540, 1.0], 'eo'], [bt(21, 0), 2.6, [1450, 400, 1.45], 'eio'], [bt(23, 0), 2.4, [1300, 450, 1.2], 'eio']];
const CAM4 = [[0, 0, [960, 560, 1.0]], [bt(26, 1), 1.8, [960, 640, 1.42], 'eio'], [bt(27, 2), 2.0, [960, 560, 1.08], 'eio']];
const CAM5 = [[0, 0, [1060, 520, 1.0]], [bt(29, 1), 2.6, [1120, 480, 1.55], 'eio'], [SNAP, .4, [1060, 500, 1.04], 'eo'], [bt(34, 0), bt(35, 2) - bt(34, 0), [960, 540, 1.0], 'eio']];

let CAMS = [W / 2, H / 2, 1];
function cam(ctx, cx, cy, z) { CAMS = [cx, cy, z]; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }

// ---------------- scene states at film time t ----------------
const progOf = (P, t) => name => { const q = P[name]; return q ? seg(t, q[0], q[0] + q[1]) : 1; };
let ctx, T, CUES = [], NOCAP = false, SC = {};
function state(id, t) {
  if (id === 0) return { S: SC.night, pal: PAL.night, prog: progOf(P0, t), cam: camAt(CAM0, t), seed: 3, mesh: t < LIFT0 + .6 ? seg(t, LIFT0, LIFT0 + .45) : 1 };
  if (id === 1) return { S: SC.bab, pal: PAL.babylon, prog: progOf(P1, t), cam: camAt(CAM1, t), seed: 7 };
  if (id === 2) return { S: SC.alex, pal: PAL.alex, prog: progOf(P2, t), cam: camAt(CAM2, t), seed: 11 };
  if (id === 3) {
    const sep = t < SNAP_J ? 1 - .25 * ss(seg(t, TJ, SNAP_J)) : 0, crane = 1 - ss(seg(t, TJ, SNAP_J));
    return { S: SC.jai, pal: PAL.jaipur, prog: progOf(P3, t), cam: camAt(CAM3, t), seed: 13, sep, off: (pull, d) => [0, (d - .3) * 220 * crane * (t < SNAP_J ? 1 : 0)] };
  }
  if (id === 4) return { S: SC.lon, pal: PAL.london, prog: progOf(P4, t), cam: camAt(CAM4, t), seed: 17 };
  if (id === 5) {
    const rot = 24 * ss(seg(t, SLIP[0], SLIP[1] - .3)), loose = t < SNAP ? ss(seg(t, SLIP[0], SLIP[0] + 1)) : 0;
    const S = night({ rot, earth: t >= P5.earth[0] ? (t - P5.earth[0]) * 1.4 : null, arc: seg(t, P5.arc[0], P5.arc[0] + P5.arc[1]) });
    return { S, pal: PAL.night2, prog: progOf(P5, t), cam: camAt(CAM5, t), seed: 3, sep: loose * .9, off: (pull) => pull === 'lines' && loose > 0 ? [0, -10 * loose] : [0, 0], deg: seg(t, DEG[0], DEG[0] + DEG[1]), degLab: seg(t, DEG[0] + B, DEG[0] + B + .25) };
  }
}
function degExtra(st) {
  return c => {
    if (!(st.deg > 0)) return;
    const pal = st.pal, x = RING.x + 330, y = 250;
    ink(c, { paint: g => { g.font = `700 150px ${FD}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('24°', x, y); } }, { color: pal.sun, reg: [1.4, -.8], clip: st.deg < 1 ? wipeRegion([x - 20, y - 150, 300, 180], 'right', st.deg, 23, 30) : null });
    rec(c, 'deg', '24°', [x, y - 105, x + 200, y + 6]);
    if (st.degLab > 0) {
      const col = pickInk(pal.sky2, [pal.glow, PAPER], 4.5);
      ink(c, { paint: g => { g.font = `600 38px ${FT}`; g.textAlign = 'left'; g.fillText('हर 72 साल · 1°', x + 6, y + 56); } }, { color: col, reg: [1, .6], clip: st.degLab < 1 ? wipeRegion([x, y + 10, 420, 70], 'right', st.degLab, 29, 24) : null });
      rec(c, 'deglab', 'हर 72 साल · 1°', [x, y + 18, x + 330, y + 66]);
    }
  };
}
function drawState(st, camOverride) {
  const [cx, cy, z] = camOverride || st.cam; cam(ctx, cx, cy, z);
  drawScene(ctx, T, st.S, { pal: st.pal, prog: st.prog, seed: st.seed, sep: st.sep, off: st.off, extra: st.deg != null ? degExtra(st) : null });
  if (st.mesh != null && st.mesh < 1) mesh(st.mesh);
}
function sceneAt(t) { return t < TB ? 0 : t < TA ? 1 : t < TJ ? 2 : t < TL0 ? 3 : t < TN ? 4 : t < TW ? 5 : 6; }

// the screen's mesh over the opening print, lifted on its hinge
function mesh(lift) {
  const y1 = AH + 40 - ss(lift) * (AH + 300);
  ctx.save(); ctx.beginPath(); ctx.rect(-200, -200, AW + 400, y1 + 200); ctx.clip();
  ctx.fillStyle = 'rgba(236,214,128,.05)'; ctx.fillRect(-200, -200, AW + 400, AH + 400);
  ctx.strokeStyle = 'rgba(200,190,150,.10)'; ctx.lineWidth = .5; ctx.beginPath();
  for (let x = -60; x < AW + 60; x += 6) { ctx.moveTo(x, -60); ctx.lineTo(x, AH + 60); }
  for (let y = -60; y < AH + 60; y += 6) { ctx.moveTo(-60, y); ctx.lineTo(AW + 60, y); }
  ctx.stroke(); ctx.restore();
  if (lift > 0) { ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#000'; ctx.fillRect(-200, y1 + 30, AW + 400, 40); ctx.restore();
    ctx.fillStyle = '#B7B2A6'; ctx.fillRect(-200, y1, AW + 400, 34); ctx.fillStyle = '#3C6E9E'; ctx.fillRect(-200, y1 - 10, AW + 400, 10); ctx.fillStyle = '#D6D1C4'; ctx.fillRect(-200, y1 + 30, AW + 400, 4); }
}

// ---------------- transitions ----------------
// a diagonal pull that prints the next print behind the blade (screen space)
const SWEEPS = [{ t: TA - .3, d: .6, from: 1, to: 2, ang: -.55 }, { t: TL0 - .3, d: .6, from: 3, to: 4, ang: .5 }, { t: TN - .3, d: .9, from: 4, to: 5, ang: -.5 }];
// a foreground silhouette trucks across the screen; full cover lands on the switch
const WIPES = [{ t: TB, d: .55, ink: PAL.babylon.near, kind: 'palm' }, { t: TJ, d: .55, ink: PAL.jaipur.near, kind: 'kiosk' }];
function silhouette(wp, t) {
  const u = seg(t, wp.t - wp.d / 2, wp.t + wp.d / 2); if (u <= 0 || u >= 1) return;
  const cx = lerp(W + 1500, -1500, u);                                  // centre of the mass; the solid core is 2400 px wide
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const p = new Path2D(); p.rect(cx - 1200, -100, 2400, H + 200);
  const r = mulberry(wp.kind === 'palm' ? 81 : 82);
  if (wp.kind === 'palm') {                                             // frond tips feather both edges
    for (const side of [-1, 1]) for (let k = 0; k < 9; k++) { const y = -80 + k * 150 + r() * 60, len = 160 + r() * 200; p.addPath(polyPath([[cx + side * 1190, y - 40], [cx + side * (1200 + len), y + 30 + r() * 40], [cx + side * 1190, y + 70]])); }
  } else {                                                              // a domed kiosk edge: arches and finials
    for (const side of [-1, 1]) for (let k = 0; k < 4; k++) { const y = 140 + k * 260; const d = new Path2D(); d.moveTo(cx + side * 1190, y - 120); d.ellipse(cx + side * 1190, y, 150, 120, 0, -Math.PI / 2, Math.PI / 2, side < 0); d.closePath(); p.addPath(d); }
  }
  ctx.fillStyle = wp.ink; ctx.fill(p);
  ctx.save(); ctx.clip(p); inkFinish(ctx, T, cx - 1600, -100, 3200, H + 200, .6, .8); ctx.restore();
}

// ---------------- the series wall ----------------
const WS = .3, PW = AW * WS, PH = AH * WS, BORDER = 18, GAP = 690, ROW_Y = 660, WALL = { w: 4400, h: 1600 };
const printX = i => 460 + i * GAP;                                    // centres
const WALL_ORDER = [0, 1, 2, 3, 4, 5];
const CAMW = (() => { const zf = W / PW; return [[0, 0, [printX(5), ROW_Y, zf]], [TW, 3.4, [printX(5) - 80, ROW_Y, 1.0], 'eio'], [bt(37, 2), bt(40, 2) - bt(37, 2), [printX(1) + 120, ROW_Y, 1.0], 'eio'],
  [bt(40, 2), 3.6, [(printX(0) + printX(5)) / 2, ROW_Y - 230, .43], 'eio']]; })();
function finalStates() {
  const big = 1e4;
  return [
    { S: SC.night, pal: PAL.night, seed: 3 }, { S: SC.bab, pal: PAL.babylon, seed: 7 }, { S: SC.alex, pal: PAL.alex, seed: 11 },
    { S: SC.jai, pal: PAL.jaipur, seed: 13 }, { S: SC.lon, pal: PAL.london, seed: 17 }, Object.assign(state(5, TW - 1e-3), { cam: null }),
  ];
}
function drawWall(t) {
  const [cx, cy, z] = camAt(CAMW, t, false);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
  const wall = PAL.night2.near;
  ctx.fillStyle = wall; ctx.fillRect(-3000, -3000, WALL.w + 6000, WALL.h + 6000);
  ctx.save(); ctx.fillStyle = mix(wall, '#000', .25); ctx.fill(bandSteps(-3000, WALL.w + 6000, 1050, 1600, 5, 0)); ctx.fillRect(-3000, 1600, WALL.w + 6000, 3000); ctx.restore();
  ctx.fillStyle = mix(wall, PAL.night2.glow, .35); ctx.fillRect(-3000, ROW_Y - PH / 2 - 70, WALL.w + 6000, 4);         // the drying line
  const FS = finalStates();
  WALL_ORDER.forEach((k, i) => {
    const x = printX(i) - PW / 2, y = ROW_Y - PH / 2, st = FS[k];
    const swing = i === 5 ? 0 : Math.sin(t * 1.3 + i * 1.7) * .006 * (1 - ss(seg(t, bt(40, 2), bt(41, 2))));
    ctx.save(); ctx.translate(printX(i), ROW_Y - PH / 2 - 70); ctx.rotate(swing); ctx.translate(-printX(i), -(ROW_Y - PH / 2 - 70));
    ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.fillRect(x - BORDER + 12, y - BORDER + 16, PW + 2 * BORDER, PH + 2 * BORDER); ctx.restore();
    paperSheet(ctx, T, x - BORDER, y - BORDER, PW + 2 * BORDER, PH + 2 * BORDER, .6 * WS);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, PW, PH); ctx.clip(); ctx.translate(x, y); ctx.scale(WS, WS);
    drawScene(ctx, T, st.S, { pal: st.pal, seed: st.seed, blade: false, extra: k === 5 ? degExtra({ pal: st.pal, deg: 1, degLab: 1 }) : null });
    ctx.restore();
    for (const dx of [-PW * .3, PW * .3]) { ctx.fillStyle = '#B7B2A6'; ctx.fillRect(printX(i) + dx - 9, y - BORDER - 84, 18, 36); ctx.fillStyle = '#8E897E'; ctx.fillRect(printX(i) + dx - 9, y - BORDER - 56, 18, 8); }
    ctx.restore();
  });
  // the title, printed on the wall over the row
  const p = seg(t, TITLE[0], TITLE[0] + TITLE[1]);
  if (p > 0) {
    const tx = (printX(0) + printX(5)) / 2, ty = ROW_Y - PH / 2 - 330, col = PAL.night2.sun, col2 = pickInk(wall, [PAPER, PAL.night2.glow], 4.5);
    ink(ctx, { paint: g => { g.font = `700 230px ${FD}`; g.letterSpacing = '10px'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('आकाश का नक्शा', tx, ty); } }, { color: col, reg: [2, -1], clip: p < 1 ? wipeRegion([tx - 1000, ty - 230, 2000, 280], 'right', p, 5, 60) : null });
    rec(ctx, 'wtitle', 'आकाश का नक्शा', [tx - 700, ty - 150, tx + 700, ty + 10]);
    const p2 = seg(t, TITLE[0] + B, TITLE[0] + B + .3);
    if (p2 > 0) { ink(ctx, { paint: g => { g.font = `600 72px ${FT}`; g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('ज्योतिष की रहस्यमयी दुनिया', tx, ty + 110); } }, { color: col2, reg: [1, .5], clip: p2 < 1 ? wipeRegion([tx - 800, ty + 20, 1600, 120], 'right', p2, 7, 40) : null });
      rec(ctx, 'wsub', 'ज्योतिष की रहस्यमयी दुनिया', [tx - 560, ty + 50, tx + 560, ty + 126]); }
  }
  inkFinish(ctx, T, -3000, -3000, WALL.w + 6000, WALL.h + 6000, .6, .5);
}

// ---------------- the subtitle strip: a dark band pulled across the foot of the frame ----------------
function wrap(c, text, max) { const words = text.split(' '), out = []; let line = ''; for (const w of words) { const tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > max && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }
function subtitles(t, scene) {
  if (NOCAP) return;
  const cue = CUES.find(c => t >= c.t0 - .12 && t < c.t1); if (!cue) return;
  const near = scene === 6 ? '#0A0F18' : [PAL.night, PAL.babylon, PAL.alex, PAL.jaipur, PAL.london, PAL.night2][scene].near;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `500 42px ${FT}`; const lines = wrap(ctx, cue.text, 1640);
  const lh = 58, hgt = lines.length * lh + 44, y0 = H - hgt;
  const pb = seg(t, cue.t0 - .12, cue.t0 + .1), pt = seg(t, cue.t0, cue.t0 + .22);
  const prev = CUES[CUES.indexOf(cue) - 1], cont = prev && cue.t0 - prev.t1 < .5;       // band already down from the previous line
  ink(ctx, { path: rectPath(-20, y0, W + 40, hgt + 20) }, { color: near, reg: [1, -.5], clip: cont || pb >= 1 ? null : wipeRegion([-20, y0 - 10, W + 40, hgt + 40], 'right', pb, 3, 40), sheen: 1 });
  const col = pickInk(near, [PAPER], 4.5);
  ink(ctx, { paint: c => { c.font = `500 42px ${FT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; lines.forEach((l, i) => c.fillText(l, W / 2, y0 + 22 + 42 + i * lh)); } }, { color: col, reg: [.8, .4], clip: pt < 1 ? wipeRegion([0, y0, W, hgt], 'right', pt, 11, 30) : null });
}

// ---------------- render ----------------
export function setup(canvas, opts) {
  ctx = canvas.getContext('2d'); T = makeTextures(PAPER, 7); CUES = opts.cues || []; NOCAP = !!opts.nocap;
  SC = { night: night(), bab: babylon(), alex: alex(), jai: jaipur(), lon: london() };
  return { dur: DUR, ev: events() };
}
export function render(t) {
  TX.list = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const sc = sceneAt(t), sw = SWEEPS.find(s => t >= s.t && t < s.t + s.d);
  if (sc === 6) drawWall(t);
  else if (sw) {
    const u = seg(t, sw.t, sw.t + sw.d), A = state(sw.from, t), Bs = state(sw.to, t);
    drawState(A);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const rg = region(u, sw.ang, 61, [-400, -400, W + 800, H + 800], W / 2, H / 2); ctx.clip(rg); drawState(Bs); ctx.restore();
    TX.list = TX.list.filter(x => false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const f = front(u, sw.ang, [-400, -400, W + 800, H + 800], W / 2, H / 2), pal = Bs.pal;
    squeegee(ctx, f.a, f.b, f.lead, { beads: [{ t0: 0, t1: .34, color: pal.sky2 }, { t0: .34, t1: .67, color: pal.mid }, { t0: .67, t1: 1, color: pal.sun }], roll: u * 50, handle: .3, scale: 1.6, bead: 30 });
  } else drawState(state(sc, t));
  for (const wp of WIPES) silhouette(wp, t);
  subtitles(t, sc);
}
export function texts(t) { render(t); return TX.list.filter(x => x.x0 >= 0 && x.y0 >= 0 && x.x1 <= W && x.y1 <= H); }

// ---------------- events for the mixer ----------------
function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  const pulls = (P, scene) => { for (const [k, [a, d]] of Object.entries(P)) {
    if (/^(ecl|nak|box)\d/.test(k)) E(a, 'stamp', { scene, k });
    else if (/^gr\d/.test(k)) E(a, 'chime', { scene, k, n: +k.slice(2) });
    else if (['slab', 'sval', 'sfoot', 'sub'].includes(k)) E(a, 'item', { scene, k, accent: k === 'sval' ? 1 : 0 });
    else if (k === 'seal' || k === 'header' || k === 'mast') E(a, 'plate', { scene, k, dur: d });
    else E(a, 'pull', { scene, k, dur: d });
  } };
  pulls(P0, 0); pulls(P1, 1); pulls(P2, 2); pulls(P3, 3); pulls(P4, 4); pulls(P5, 5);
  E(LIFT0, 'lift');
  for (const w of WIPES) E(w.t - w.d / 2, 'wipe', { dur: w.d, kind: w.kind });
  for (const s of SWEEPS) E(s.t, 'sweep', { dur: s.d, to: s.to });
  E(SNAP_J, 'clamp', { scene: 3 }); E(SLIP[0], 'slip', { dur: SLIP[1] - SLIP[0] }); E(SNAP, 'clamp', { scene: 5, big: 1 }); E(DEG[0], 'item', { scene: 5, k: 'deg', accent: 1 });
  E(SIL1, 'silence', { dur: TN + 2 * B - SIL1 }); E(SIL2[0], 'silence', { dur: SIL2[1] - SIL2[0] });
  E(TW, 'pullout', { dur: 3.4 }); E(bt(37, 2), 'dolly', { dur: bt(40, 2) - bt(37, 2) }); E(bt(40, 2), 'pullout', { dur: 3.6 }); E(TITLE[0], 'plate', { scene: 6, k: 'title', dur: TITLE[1] }); E(TITLE[0] + B, 'item', { scene: 6, k: 'wsub' });
  const scenes = [[0, 'night'], [TB, 'babylon'], [TA, 'alex'], [TJ, 'jaipur'], [TL0, 'london'], [TN, 'night2'], [TW, 'wall'], [DUR, 'end']];
  for (let i = 0; i < scenes.length - 1; i++) E(scenes[i][0], 'scene', { name: scenes[i][1], t1: scenes[i + 1][0] });
  for (const c of CUES) E(c.vo, 'vo', { id: c.id, dur: c.dur });
  SHOTS.forEach(s => E(s.t0, 'shot', { n: s.n, t1: s.t1 }));
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
