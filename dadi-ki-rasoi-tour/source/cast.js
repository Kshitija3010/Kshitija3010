// cast.js — Lotu-ram (a brass lota with rubber-hose limbs) and the seven living kitchen tools.
// Local coordinates: origin = the ground under the character, y down. Every prop takes b = breathing phase (−1..1).
import * as T from './toon.js';
import { P, pieEye, brow, mouth, glove, shoe, hose, steam, ribbon } from './chars.js';
import { clamp, lerp, TAU, hash } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, quad, rr, rect, push, pop, translate, rotate, scale, S } = T;
const breathe = (b, a = .06) => scale(1 - b * a * .6, 1 + b * a);
const fill = (pts, col) => shape(pts, { fill: col, stroke: false, boil: 0 });
function spiralEye(cx, cy, r, t) { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 2.2 + t * 9; pts.push([cx + Math.cos(a) * r * u, cy + Math.sin(a) * r * u * 1.2]); } stroke(pts, S.lw * .8); }
function face(ex, ey, erx, ery, my, mw, o = {}) {
  const E = o.eyes || {};
  if (E.type === 'spiral') { spiralEye(-ex, ey, erx * 1.1, o.t || 0); spiralEye(ex, ey, erx * 1.1, (o.t || 0) + 1); }
  else { pieEye(-ex, ey, erx, ery, { ...E, lidCol: o.lidCol || P.white, side: 1 }); pieEye(ex, ey, erx, ery, { ...E, lidCol: o.lidCol || P.white, side: -1 }); }
  if (o.brows) { brow(-ex, ey - ery - 9, erx * 1.4, o.brows, -1); brow(ex, ey - ery - 9, erx * 1.4, o.brows, 1); }
  const M = o.mouth || { type: 'smile' }; if (M.type !== 'none') mouth(0, my, M.w || mw, M.type, M);
}

// ———————————————— Lotu-ram ————————————————
export const LOTU = { R: 92, cy: -158, neck: -246, rim: -262, mouth: [0, -128] };
// p: { x,y,k,sx,sy,lean,mirror, armL/armR {x,y,hand,rot,bend,front,via}, legL/legR {x,y,dir,bend,ang}, eyes, mouth, brows, steam, t, cheeks }
export function lotu(p) {
  const { R, cy, neck, rim } = LOTU;
  push(); translate(p.x, p.y); if (p.mirror) scale(-1, 1); scale(p.k || 1); scale(p.sx || 1, p.sy || 1); if (p.lean) rotate(p.lean);
  const hipY = cy + R - 12;
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 34, y: 0 }; hose([s * 28, hipY], [L.x, L.y - 8], L.bend ?? s * 4, 15); }
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 34, y: 0 }; shoe(L.x - (L.dir ?? s) * 6, L.y, L.dir ?? s, 1.05, L.ang || 0); }
  const arm = (key, s) => {
    const A = p[key]; if (!A) return; const sh = [s * (R - 10), cy - 4]; let ang;
    if (A.via) { const c = spline([sh, ...A.via, [A.x, A.y]], false, 10); shape(ribbon(c, 14, 14), { fill: P.ink, lw: S.lw * .8 }); const q = c[c.length - 3]; ang = A.rot ?? Math.atan2(A.y - q[1], A.x - q[0]); }
    else { hose(sh, [A.x, A.y], A.bend ?? s * -14, 14); ang = A.rot ?? Math.atan2(A.y - sh[1], A.x - sh[0]); }
    glove(A.x, A.y, ang, A.hand || 'open', A.hk || 1.05, { flip: A.flip ?? s < 0 });
  };
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && !p[key].front) arm(key, s);
  // neck + body (one silhouette): the round pot, a short neck
  const body = [...arc(0, cy, R, R * .97, -Math.PI * .5 + .42, Math.PI * 1.5 - .42, 44), ...quad([-36, neck + 22], [-30, neck + 4], [-34, neck - 2], 6), ...quad([34, neck - 2], [30, neck + 4], [36, neck + 22], 6)];
  shape(body, { fill: P.white, shade: () => {
    fill([[R * .62, cy - R], [R + 10, cy - R], [R + 10, cy + R], [R * .62, cy + R]], P.light);
    // engraved bands
    stroke(arc(0, cy - 34, R - 2, 14, 0, Math.PI, 24), S.lw * .7, { boil: .6 }); stroke(arc(0, cy - 24, R - 2, 14, .1, Math.PI - .1, 24), S.lw * .45, { boil: .6 });
    stroke(arc(0, cy + 52, R - 18, 12, 0, Math.PI, 20), S.lw * .5, { boil: .6 });
    // a vertical highlight
    fill([[-R * .62, cy - 40], [-R * .52, cy - 50], [-R * .5, cy + 20], [-R * .6, cy + 28]], P.white);
  } });
  // the flared rim (a hat brim) with the dark mouth of the pot
  shape(ell(0, rim, 66, 15, 36), { fill: P.white, lw: S.lw * .9 });
  shape(ell(0, rim - 1, 44, 8, 30), { fill: P.ink, lw: S.lw * .5 });
  // face
  const E = p.eyes || {};
  if (p.cheeks) { shape(ell(-48, -120, 22 * p.cheeks, 18 * p.cheeks), { fill: P.pale, lw: S.lw * .6 }); shape(ell(48, -120, 22 * p.cheeks, 18 * p.cheeks), { fill: P.pale, lw: S.lw * .6 }); }
  if (E.type === 'spiral') { spiralEye(-26, -184, 22, p.t || 0); spiralEye(26, -184, 22, (p.t || 0) + 1); }
  else { pieEye(-25, -184, 21, 30, { ...E, side: 1 }); pieEye(25, -184, 21, 30, { ...E, side: -1 }); }
  if (p.brows) { brow(-25, -226, 30, p.brows, -1); brow(25, -226, 30, p.brows, 1); }
  shape(ell(0, -150, 11, 8, 16), { fill: P.ink, lw: S.lw * .5 });
  const M = p.mouth || { type: 'smile' }; mouth(0, -128, M.w || 58, M.type, M);
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && p[key].front) arm(key, s);
  if (p.steam && p.steam !== 'none') steam(0, rim - 6, p.steam, p.t || 0, .6);
  pop();
}

// ———————————————— the tools ————————————————
// चूल्हा: a clay U-stove; its fire opening is its mouth. o.fire 0..1.5
export function chulha(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k); breathe(b, .05);
  const fire = o.fire ?? .3, t = o.t || 0;
  const body = spline([[-160, 0], [-150, -90], [-128, -160], [-92, -178], [-60, -150], [60, -150], [92, -178], [128, -160], [150, -90], [160, 0]], false, 6).concat([[160, 0], [-160, 0]]);
  shape(body, { fill: P.pale, shade: () => { fill([[70, -200], [200, -200], [200, 10], [95, 10]], P.light); for (let i = 0; i < 14; i++) T.dot(-130 + hash(i) * 260, -20 - hash(i + 9) * 130, 2.2, P.light); } });
  // the pot on top
  const pot = [...arc(0, -205, 82, 66, Math.PI * .92, Math.PI * 2.08, 30)];
  shape(pot.concat([[70, -165], [-70, -165]]), { fill: P.dmid, shade: () => fill([[30, -280], [100, -280], [100, -150], [40, -150]], P.dark) });
  shape(ell(0, -262, 52, 11, 28), { fill: P.dark, lw: S.lw * .8 }); shape(ell(0, -263, 38, 6, 24), { fill: P.ink, stroke: false, boil: .4 });
  if (fire > .5) steam(0, -268, 'lazy', t, .55);
  // opening (mouth) + flames
  const op = [[-62, 0], ...quad([-62, 0], [-60, -96], [0, -100], 10).slice(1), ...quad([0, -100], [60, -96], [62, 0], 10).slice(1)];
  shape(op, { fill: P.ink, shade: () => {
    const fl = clamp(fire, 0, 1.6);
    for (const [dx, h, w, col] of [[-24, 60, 18, P.pale], [0, 86, 24, P.white], [24, 54, 16, P.pale]]) {
      const hh = h * fl * (1 + .12 * Math.sin(t * 22 + dx)); const tip = [dx + Math.sin(t * 15 + dx) * 6, -hh];
      fill([[dx - w, 0], ...quad([dx - w, 0], [dx - w * 1.1, -hh * .55], tip, 8).slice(1), ...quad(tip, [dx + w * 1.1, -hh * .55], [dx + w, 0], 8).slice(1)], col);
    }
  } });
  // logs sticking out
  shape(rr(-110, -24, 70, 22, 8), { fill: P.dmid }); shape(rr(40, -22, 76, 22, 8), { fill: P.dmid });
  face(46, -108, 15, 21, -1000, 0, { ...o, mouth: { type: 'none' } });
  pop();
}
// सिल-बट्टा: flat stone slab (face on its front), roller stone on top. o.roll −1..1, o.chutney 0..1
export function silBatta(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k); breathe(b, .04);
  const top = [[-170, -66], [170, -66], [196, -98], [-142, -98]];
  shape(top, { fill: P.light, shade: () => { for (let i = 0; i < 30; i++) T.dot(-150 + hash(i * 2) * 320, -70 - hash(i * 3) * 26, 1.8, P.mid); } });
  shape(rect(-170, -66, 340, 66), { fill: P.mid, shade: () => fill([[100, -70], [180, -70], [180, 4], [110, 4]], P.dmid) });
  stroke([[170, -66], [196, -98], [196, -34], [170, 0]], S.lw * .8);
  shape([[170, -66], [196, -98], [196, -34], [170, 0]], { fill: P.dmid });
  if (o.chutney > 0) { const c = o.chutney, cx = -96; shape(ell(cx, -84, 60 * c + 8, 12 * c + 4, 20), { fill: P.dmid, shade: () => { for (let i = 0; i < 6; i++) T.dot(cx - 40 * c + hash(i) * 80 * c, -86 + hash(i + 3) * 8, 2.4, P.dark); } }); }
  const rx = (o.roll || 0) * 70 + 20;
  shape(rr(rx - 84, -140, 168, 50, 24), { fill: P.light, shade: () => { fill([[rx - 84, -108], [rx + 84, -108], [rx + 84, -86], [rx - 84, -86]], P.mid); stroke([[rx - 60, -128], [rx + 60, -128]], S.lw * .5); } });
  face(46, -38, 14, 19, -12, 42, o);
  pop();
}
// ओखली-मूसल: mortar with a face; the long pestle (lift 0..1) goes in its mouth
export function okhli(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k);
  const lift = o.lift ?? 0, sq = o.squash || 0;
  scale(1 + sq * .08, 1 - sq * .12); breathe(b, .05);
  // pestle (behind the mortar body)
  const by = -150 - lift * 120;
  shape(rr(-15, by - 300, 30, 300, 13), { fill: P.dmid, shade: () => { fill([[4, by - 310], [20, by - 310], [20, by + 5], [4, by + 5]], P.dark); for (const yy of [by - 290, by - 18]) fill(rect(-17, yy, 34, 14), P.light); } });
  const body = [...quad([-82, -176], [-58, -110], [-56, -36], 10), [-80, -22], [-82, 0], [82, 0], [80, -22], ...quad([56, -36], [58, -110], [82, -176], 10)];
  shape(body, { fill: P.dmid, shade: () => { fill([[30, -190], [100, -190], [100, 10], [36, 10]], P.dark); stroke(arc(0, -150, 70, 12, .1, Math.PI - .1, 18), S.lw * .5, { line: P.dark }); } });
  shape(ell(0, -176, 82, 18, 32), { fill: P.dmid, lw: S.lw * .9 }); shape(ell(0, -176, 62, 11, 28), { fill: P.ink, lw: S.lw * .5 });
  if (lift < .05) shape(rr(-15, -184, 30, 14, 6), { fill: P.dmid, lw: S.lw * .6 });
  face(28, -112, 15, 21, -62, 44, { ...o, lidCol: P.dmid });
  pop();
}
// चक्की: two stone discs, a peg handle on the top one. o.rot (rad), o.flour 0..1
export function chakki(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k); breathe(b, .04);
  const rot = o.rot || 0, fl = o.flour || 0;
  // flour pile in front (left)
  if (fl > 0) shape([...arc(-150, 0, 70 * fl + 10, 40 * fl + 6, Math.PI, TAU, 16), [-150 + 70 * fl + 10, 0]], { fill: P.white, lw: S.lw * .7 });
  const cyl = (y0, y1, rx, ry, col, colD) => {
    shape([...arc(0, y0, rx, ry, Math.PI, TAU, 30), ...arc(0, y1, rx, ry, 0, Math.PI, 30)], { fill: col, shade: () => fill([[rx * .5, y0 - 40], [rx + 10, y0 - 40], [rx + 10, y1 + 40], [rx * .5, y1 + 40]], colD) });
  };
  cyl(-78, -6, 160, 34, P.mid, P.dmid);
  stroke([[-160, -60], [-196, -40], [-196, -30]], S.lw * .8);   // the spout
  cyl(-128, -82, 150, 32, P.light, P.mid);
  for (let i = 0; i < 9; i++) { const a = rot + i / 9 * TAU, s = Math.sin(a); if (s < .1) continue; const xx = Math.cos(a) * 150; stroke([[xx, -112 + s * 14], [xx, -92 + s * 14]], S.lw * .5, { boil: .4 }); }
  shape(ell(0, -128, 150, 32, 40), { fill: P.light, lw: S.lw * .9 });
  shape(ell(0, -128, 26, 7, 16), { fill: P.ink, lw: S.lw * .5 });
  const px = Math.cos(rot) * 112, py = -128 + Math.sin(rot) * 24;
  shape(rr(px - 11, py - 70, 22, 74, 10), { fill: P.dark, lw: S.lw * .8 });
  CHAKKI_PEG[0] = px; CHAKKI_PEG[1] = py - 62;
  face(46, -46, 14, 19, -20, 40, o);
  pop();
}
export const CHAKKI_PEG = [0, 0];
// मथानी: a wide curd pot with a churning stick; the rope coil turns it. o.spin, o.butter 0..1
export function mathani(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k); breathe(b, .05);
  const spin = o.spin || 0, bu = o.butter || 0;
  // stick (behind the pot rim)
  shape(rr(-12, -520, 24, 330, 10), { fill: P.light, shade: () => { for (let i = 0; i < 9; i++) { const yy = -510 + ((i * 36 + spin * 60) % 324 + 324) % 324; fill([[-14, yy], [14, yy + 10], [14, yy + 16], [-14, yy + 6]], P.mid); } } });
  // rope coil
  for (let i = 0; i < 4; i++) stroke(arc(0, -380 + i * 12, 18, 6, 0, Math.PI, 10), S.lw * 1.1);
  shape(ell(0, -116, 132, 112, 44), { fill: P.light, shade: () => { fill([[60, -240], [150, -240], [150, 10], [70, 10]], P.mid); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; stroke([[Math.cos(a) * 120, -150 + Math.sin(a) * 6], [Math.cos(a) * 120 * .92, -134 + Math.sin(a) * 6]], S.lw * .5, { line: P.dmid }); } } });
  shape(ell(0, -222, 76, 16, 32), { fill: P.light, lw: S.lw * .9 }); shape(ell(0, -222, 60, 10, 28), { fill: P.white, lw: S.lw * .5 });
  shape(rr(-12, -230, 24, 22, 8), { fill: P.light, lw: S.lw * .6 });
  if (bu > 0) { const h = bu * 40; shape(spline([[-40, -224], [-36, -224 - h * .8], [-10, -224 - h], [20, -224 - h * .9], [42, -224]], true, 5), { fill: P.white, lw: S.lw * .8 }); }
  face(40, -132, 16, 22, -80, 46, o);
  pop();
}
// the rope ends (world-local to the mathani): returns coil points so the scene can draw rope to Lotu's hands
export const MATHANI_COIL = [[-18, -372], [18, -380]];
// सूप: a winnowing basket held in front; o.tilt (rad)
export function soop(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k); rotate(o.tilt || 0); breathe(b, .04);
  const back = [[-130, 0], [-140, -80], [-110, -96], [-60, -60], [130, -10], [140, 6], [-120, 14]];
  shape(spline(back, true, 5), { fill: P.pale, shade: () => {
    for (let i = -6; i < 12; i++) stroke([[-140 + i * 22, 20], [-100 + i * 22, -110]], S.lw * .35, { line: P.mid, boil: .3 });
    for (let i = -6; i < 12; i++) stroke([[-140 + i * 22, -110], [-100 + i * 22, 20]], S.lw * .35, { line: P.mid, boil: .3 });
    fill([[-150, 4], [150, 4], [150, 20], [-150, 20]], P.light);
  } });
  stroke(spline([[-138, -78], [-108, -92], [-62, -58], [128, -8]], false, 5), S.lw * 1.4);
  face(22, -44, 11, 15, -16, 30, { ...o, lidCol: P.pale });
  pop();
}
// मटका: clay water pot on a ring stand; o.drops (seconds since it started sweating), o.shiver
export function matka(x, y, k, b, o = {}) {
  push(); translate(x, y); scale(k);
  const sh = o.shiver ? Math.sin((o.t || 0) * 80) * 4 * o.shiver : 0;
  translate(sh, 0); breathe(b, .05);
  shape(ell(0, -10, 88, 18, 30), { fill: P.dark, lw: S.lw * .8 }); shape(ell(0, -14, 64, 10, 26), { fill: P.ink, stroke: false });
  shape(ell(0, -124, 122, 112, 48), { fill: P.mid, shade: () => {
    fill([[56, -260], [140, -260], [140, 0], [64, 0]], P.dmid);
    stroke(spline([[-118, -170], [-80, -182], [-40, -168], [0, -182], [40, -168], [80, -182], [118, -170]], false, 5), S.lw * .7, { line: P.ink });
    stroke(spline([[-118, -156], [-80, -144], [-40, -158], [0, -144], [40, -158], [80, -144], [118, -156]], false, 5), S.lw * .5, { line: P.ink });
    fill([[-90, -110], [-80, -116], [-76, -40], [-86, -36]], P.light);
  } });
  shape(ell(0, -236, 50, 12, 28), { fill: P.mid, lw: S.lw * .9 }); shape(ell(0, -236, 36, 7, 24), { fill: P.ink, lw: S.lw * .5 });
  face(36, -128, 16, 22, -76, 44, { ...o, lidCol: P.mid });
  // sweat drops that run down and turn into vapour
  if (o.drops != null && o.drops > 0) for (let i = 0; i < 7; i++) {
    const ph = (o.drops * .45 + hash(i * 3.3)) % 1, a = -.9 + i * .3, rx = Math.cos(a) * 100, ry = -124 + Math.sin(a) * 60 + ph * 40;
    if (ph < .7) shape(spline([[rx, ry - 12], [rx + 6, ry], [rx, ry + 6], [rx - 6, ry]], true, 4), { fill: P.white, lw: S.lw * .5 });
    else { const u = (ph - .7) / .3; stroke(spline([[rx, ry], [rx + 8, ry - 20 - u * 30], [rx - 4, ry - 40 - u * 50]], false, 5), S.lw * .6, { line: P.white }); }
  }
  pop();
}
