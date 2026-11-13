// scenes.js — the kitchen, the camera, every shot, subtitles, the end card and the thumbnail card.
import * as T from './toon.js';
import { P, glove, ribbon, steam } from './chars.js';
import { lotu, LOTU, chulha, silBatta, okhli, chakki, CHAKKI_PEG, mathani, MATHANI_COIL, soop, matka } from './cast.js';
import { wash, withCanvas, makeBG } from './bg.js';
import { clamp, lerp, seg, eio, eo, ei, ss, TAU, hash, spring } from '/core/lib.js';
import * as ST from './story.js';
const { shape, stroke, ell, arc, spline, quad, rr, rect, push, pop, translate, rotate, scale, S } = T;
let sg, F, GATE, VFMT, BG, LOGO, SUBS = [];
export function init(o) { sg = o.sg; F = o.F; GATE = o.GATE; VFMT = o.v; LOGO = o.logo; SUBS = o.subs; BG = paintKitchen(); }

const tw = (t, t0, t1, a, b, e = eio) => lerp(a, b, e(seg(t, t0, t1)));
const pulse = (t, t0, k = 6) => t < t0 ? 0 : Math.exp(-(t - t0) * k);
const q2 = t => Math.floor(t * 12 + 1e-6) / 12;                  // characters on twos
const beats = t => t / ST.BEAT;
const breath = t => Math.cos(TAU * beats(q2(t)));                // stretch on the beat
const GC = () => [GATE.x + GATE.w / 2, GATE.y + GATE.h / 2];

// ———————— the kitchen: plastered wall, painted dado, niches with brass pots, a barred window, a floor of mud plaster ————————
const WX0 = -400, WX1 = 8800, WALL0 = -1150, FLOOR1 = 520;
function paintKitchen() {
  const bg = makeBG(WX0, WALL0, WX1, FLOOR1, 1.15), w = WX1 - WX0;
  withCanvas(bg, (g, raw) => {
    wash(rect(WX0, WALL0, w, 70), '#3E3D3A', { seed: 1, edge: 0 });
    wash(rect(WX0, WALL0 + 70, w, -WALL0 - 70), '#8C8981', { line: false, seed: 2, edge: 0 });
    raw();
    for (let x = WX0; x < WX1; x += 70) { g.fillStyle = 'rgba(255,253,245,.06)'; g.fillRect(x, WALL0 + 70, 26, -WALL0 - 180); }
    // wooden beams across the top
    for (let x = WX0 + 100; x < WX1; x += 520) wash(rr(x, WALL0 + 60, 60, 60, 6), '#4A4844', { seed: x });
    // painted dado band with a diamond pattern
    wash(rect(WX0, -120, w, 120), '#6E6B64', { seed: 3, edge: .1 });
    raw();
    for (let x = WX0; x < WX1; x += 60) { g.fillStyle = 'rgba(230,226,215,.35)'; g.beginPath(); g.moveTo(x, -60); g.lineTo(x + 16, -84); g.lineTo(x + 32, -60); g.lineTo(x + 16, -36); g.fill(); }
    g.strokeStyle = 'rgba(30,28,25,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(WX0, -120); g.lineTo(WX1, -120); g.stroke();
    // between stations: niches with brass pots, windows, hanging chillies, a calendar
    const between = [450, 1375, 2325, 3275, 4225, 5175, 6125, 7075, 8500];
    between.forEach((bx, i) => {
      if (i % 3 === 0) {   // a barred window
        wash(rr(bx - 130, -760, 260, 300, 10), '#4A4844', { seed: 10 + i }); wash(rr(bx - 110, -740, 220, 260, 6), '#C8C5BC', { seed: 20 + i, edge: .06 });
        raw(); g.strokeStyle = '#3B3A37'; g.lineWidth = 9; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(bx - 110 + k * 44, -740); g.lineTo(bx - 110 + k * 44, -480); g.stroke(); }
      } else if (i % 3 === 1) {   // an arched niche with pots
        const arch = [[bx - 120, -380], [bx - 120, -600], ...arc(bx, -600, 120, 90, Math.PI, TAU, 16).slice(1), [bx + 120, -380]];
        wash(arch, '#5E5C57', { seed: 30 + i });
        wash(ell(bx - 50, -430, 40, 46, 0), '#A9A69E', { seed: 40 + i, edge: .1 }); wash(rr(bx - 70, -486, 40, 14, 5), '#6E6B64', { seed: 41 + i, edge: 0 });
        wash(ell(bx + 45, -420, 52, 38, 0), '#B3B0A8', { seed: 42 + i, edge: .1 });
        wash(rect(bx - 130, -382, 260, 16), '#3B3A37', { seed: 43 + i });
      } else {   // a hanging string of red chillies and garlic, a calendar
        raw(); g.strokeStyle = '#3B3A37'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 60, -900); g.lineTo(bx - 60, -600); g.stroke();
        for (let k = 0; k < 7; k++) wash(spline([[bx - 60, -880 + k * 42], [bx - 40, -870 + k * 42], [bx - 52, -846 + k * 42], [bx - 64, -862 + k * 42]], true, 4), k % 2 ? '#5E5C57' : '#B3B0A8', { seed: 50 + k + i, edge: 0, lw: 2 });
        wash(rr(bx + 10, -820, 150, 200, 6), '#C8C5BC', { seed: 60 + i, edge: .06 }); wash(rect(bx + 30, -790, 110, 70), '#8C8981', { seed: 61 + i, edge: 0 });
        raw(); g.fillStyle = 'rgba(40,38,34,.6)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) g.fillRect(bx + 32 + c * 22, -705 + r * 20, 14, 10);
      }
    });
    // a shelf with brass plates above each station
    for (const X of ST.XK) { wash(rect(X - 230, -720, 460, 18), '#4A4844', { seed: X }); for (let k = -2; k <= 2; k++) wash(ell(X + k * 85, -770, 34, 34, 0), k % 2 ? '#A29F97' : '#B9B6AE', { seed: X + k, edge: .08 }); }
    // the stage at the end (finale)
    wash(rr(ST.STAGE_X - 700, -900, 1400, 120, 14), '#4A4844', { seed: 90 });
    // floor
    wash(rect(WX0, 0, w, FLOOR1), '#A9A69E', { line: false, seed: 5, edge: 0 });
    raw(); g.strokeStyle = 'rgba(40,38,34,.18)'; g.lineWidth = 2;
    for (let yy = 40; yy < FLOOR1; yy += 60 + yy * .15) { g.beginPath(); g.moveTo(WX0, yy); g.lineTo(WX1, yy); g.stroke(); }
    g.strokeStyle = 'rgba(30,28,25,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(WX0, 0); g.lineTo(WX1, 0); g.stroke();
    for (const X of ST.XK) { g.fillStyle = 'rgba(30,28,25,.16)'; g.beginPath(); g.ellipse(X + 40, 8, 230, 26, 0, 0, 7); g.fill(); }
  });
  return bg;
}
// camera: world centre (x,y) + visible world width wv → z = gate width / wv
function setCam(t, cam, squash = 0) {
  const z = GATE.w / (VFMT ? cam.wv * .82 : cam.wv), [gx, gy] = GC(), ox = gx - cam.x * z, oy = gy - cam.y * z;
  sg.save(); sg.setTransform(z, 0, 0, z, ox, oy);
  if (squash) { sg.translate(0, 0); sg.scale(1 - squash * .4, 1 + squash); }
  sg.drawImage(BG.cv, BG.ox, BG.oy, BG.w, BG.h); sg.restore();
  T.BASE.splice(0, 6, z, 0, 0, z, ox, oy); T.frame(t);
  return { z, ox, oy };
}
const toScr = (c, x, y) => [c.ox + x * c.z, c.oy + y * c.z];

// ———————— Lotu helpers ————————
function walk(p, { L = 60, lift = 24, bob = 10 } = {}) {
  const a = Math.PI * p, c = Math.cos(a), s = Math.sin(a);
  return { legL: { x: -8 + c * L / 2, y: -Math.max(0, s) * lift, dir: 1, bend: 6 }, legR: { x: 8 - c * L / 2, y: -Math.max(0, -s) * lift, dir: 1, bend: -6 }, bob: -(1 - Math.abs(c)) * bob, sw: c };
}
const LX = i => ST.XK[i] + ST.LOTU_DX;
function lotuX(t) {
  if (t < ST.SK[0]) return t < 13 ? 300 : lerp(300, LX(0), eio(seg(t, 13, ST.SK[0] + 2)));
  for (let i = 0; i < 7; i++) { if (t < ST.SK[i] + 2) { const a = i ? LX(i - 1) : 300; return lerp(a, LX(i), seg(t, ST.SK[i], ST.SK[i] + 2)); } if (t < ST.SEND[i]) return LX(i); }
  return LX(6);
}
function walking(t) { if (t >= 13 && t < ST.SK[0] + 2) return true; for (let i = 0; i < 7; i++) if (t >= ST.SK[i] && t < ST.SK[i] + 2) return true; return false; }
const idleArms = (t, b) => ({ armL: { x: -138, y: -120 + b * 4, hand: 'open', bend: 16 }, armR: { x: 138, y: -120 + b * 4, hand: 'open', bend: -16 } });

// ———————— shots ————————
function stationIndex(t) { for (let i = 6; i >= 0; i--) if (t >= ST.SK[i]) return i; return -1; }
function camAt(t) {
  if (t < 2.2) { const u = eio(seg(t, .3, 2.2)); return { x: lerp(300 - 25, 300, u), y: lerp(-184, -230, u), wv: Math.exp(lerp(Math.log(150), Math.log(900), u)) }; }
  if (t < ST.SK[0]) return { x: 300 + (t > 12.6 ? tw(t, 12.6, 14, 0, 160) : 0), y: -230, wv: 900 };
  const i = stationIndex(t), X = ST.XK[i] - 80;
  if (t < ST.SK[i] + 2) { const a = i ? ST.XK[i - 1] - 80 : 460; return { x: lerp(a, X, eio(seg(t, ST.SK[i], ST.SK[i] + 2))), y: -235, wv: 960 }; }
  const st = ST.STING[i], p = pulse(t, st, 5) * (t >= st ? 1 : 0);
  return { x: X, y: -235 - p * 10, wv: 960 * (1 - .06 * p) };
}
function tool(i, t, x, k = 1, b = 0, dance = false) {
  const s0 = ST.SK[i] + 1.6, awake = dance || t > s0, st = ST.STING[i], hit = t >= st && t < st + 1.6;
  const eyes = awake ? (t < s0 + .4 && !dance ? { type: 'wide' } : hit ? { type: 'happy' } : { lx: -.35 }) : { type: 'shut' };
  const mouthT = awake ? (hit ? { type: 'beam' } : { type: 'smile' }) : { type: 'flat' };
  const u = t - (ST.SK[i] + 2), tq = q2(t);
  const o = { eyes, mouth: mouthT, t: tq };
  const name = ST.STATIONS[i];
  if (name === 'chulha') chulha(x, 0, k, b, { ...o, fire: dance ? 1 : .3 + clamp(Math.floor(Math.max(0, u - 1.5) / ST.BEAT) * .12, 0, .8) + (hit ? .5 * pulse(t, st, 2) : 0) });
  if (name === 'sil') silBatta(x, 0, k, b, { ...o, roll: dance ? 0 : Math.sin(Math.PI * beats(tq)) * (u > .5 ? 1 : 0), chutney: dance ? 1 : clamp((u - .8) / 5) });
  if (name === 'okhli') { const ph = (beats(tq) % 2) / 2, lift = u > .5 && !dance ? Math.pow(Math.sin(Math.PI * ph), .7) : 0; okhli(x, 0, k, b, { ...o, lift, squash: u > .5 ? pulse(tq % 1, 0, 9) : 0 }); }
  if (name === 'chakki') chakki(x, 0, k, b, { ...o, rot: u > .3 && !dance ? (u - .3) * Math.PI : 0, flour: dance ? 1 : clamp((u - 1) / 5), eyes: hit ? { type: 'spiral' } : eyes });
  if (name === 'mathani') mathani(x, 0, k, b, { ...o, spin: u > .4 ? u * 4 : 0, butter: dance ? 1 : clamp((t - st + .3) / .4) });
  if (name === 'soop' && dance) soop(x, -120, k, b, o);
  if (name === 'matka') matka(x, 0, k, b, { ...o, drops: u > 1 ? u : null, shiver: hit ? .6 : 0 });
}
function stationShot(t) {
  const i = stationIndex(t), cam = camAt(t), c = setCam(t, cam), tq = q2(t), b = breath(t), u = t - (ST.SK[i] + 2), st = ST.STING[i];
  const X = ST.XK[i];
  // the previous tool still visible while we walk away from it
  if (i > 0 && t < ST.SK[i] + 2) tool(i - 1, t, ST.XK[i - 1], 1, b);
  tool(i, t, X, 1, b);
  const lx = lotuX(t), wk = walking(t);
  if (wk) { const w = walk(beats(tq)); lotu({ x: lx, y: w.bob, ...w, armL: { x: -130, y: -130 + w.sw * 24, hand: 'open', bend: 16 }, armR: { x: 130, y: -130 - w.sw * 24, hand: 'open', bend: -16 }, eyes: { lx: .6 }, mouth: { type: 'smile' }, steam: 'lazy', t: tq, sy: 1 + b * .02 }); }
  else lotuAt(i, t, lx, u, st, b, tq);
  if (i === 5) soopShot(t, lx, u, st, b, tq);
}
// what Lotu does at each station
function lotuAt(i, t, lx, u, st, b, tq) {
  const hit = t >= st && t < st + 1.6, talk = talking(t);
  const base = { x: lx, y: 0, t: tq, sy: 1 + b * .03, sx: 1 - b * .018, steam: 'lazy', eyes: { lx: .7 }, mouth: { type: talk ? (Math.floor(t * 8) % 2 ? 'open' : 'smile') : 'smile', open: .5 } };
  const toolX = ST.XK[i] - lx;   // tool position in Lotu's local coords
  const name = ST.STATIONS[i];
  if (name === 'chulha') {   // blowing the फुंकनी on each beat after a while
    const blow = u > 1.5 && (beats(tq) % 1) < .5;
    const m = [0, -128], tip = [toolX - 30, -60];
    const pipe = [[m[0] + 26, m[1] + 4], [toolX * .5, -95], tip];
    lotu({ ...base, cheeks: blow ? 1 : 0, mouth: blow ? { type: 'o', open: .6 } : base.mouth, eyes: hit ? { type: 'happy' } : base.eyes, armR: { x: 92, y: -112, hand: 'grab', front: true, bend: -10 }, armL: { x: -130, y: -110, hand: 'open', bend: 14 } });
    T.push(); T.translate(lx, 0); shape(ribbon(spline(pipe, false, 6), 12, 10), { fill: P.dmid, lw: S.lw * .8 }); T.pop();
    if (blow) for (let k = 0; k < 3; k++) { const ph = (beats(tq) % .5) * 2; T.dot(lx + toolX - 40 + ph * 40, -60 - k * 10, 4, P.white); }
    if (hit) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r = 90 + (t - st) * 260; T.dot(ST.XK[i] + Math.cos(a) * r, -60 + Math.sin(a) * r * .6, 5 * (1 - (t - st) / 1.6), P.white); }
  }
  if (name === 'sil') {
    const roll = Math.sin(Math.PI * beats(tq)) * (u > .5 ? 1 : 0), hx = toolX + roll * 70 + 20 - 70;
    lotu({ ...base, lean: .12, armL: { x: hx - 30, y: -140, hand: 'grab', bend: 30 }, armR: { x: hx + 40, y: -146, hand: 'grab', bend: -10, front: true }, eyes: hit ? { type: 'happy' } : { lx: .8, ly: .5 }, mouth: hit ? { type: 'bleh' } : base.mouth });
  }
  if (name === 'okhli') {
    const ph = (beats(tq) % 2) / 2, lift = u > .5 ? Math.pow(Math.sin(Math.PI * ph), .7) : 0, top = -150 - lift * 120 - 280;
    lotu({ ...base, armL: { x: toolX - 26, y: top, hand: 'grab', bend: 40 }, armR: { x: toolX + 10, y: top + 60, hand: 'grab', bend: 30, front: true }, eyes: hit ? { type: 'happy' } : { lx: .7, ly: -.6 }, sy: 1 + (lift - .5) * .06 });
    if (u > .5) { const pp = (tq % 1); if (pp < .45) for (let k = 0; k < 6; k++) { const a = -Math.PI * (.2 + k * .12), r = 30 + pp * 300; T.dot(ST.XK[i] + Math.cos(a) * r, -190 + Math.sin(a) * r * .8 + pp * pp * 300, 4, k % 2 ? P.light : P.white); } }
  }
  if (name === 'chakki') {
    const px = ST.XK[i] + CHAKKI_PEG[0] - lx, py = CHAKKI_PEG[1];
    lotu({ ...base, armR: { x: px, y: py, hand: 'grab', front: true, via: [[60, -210], [px * .6, py - 60]] }, armL: { x: -130, y: -110, hand: 'open', bend: 14 }, eyes: hit ? { type: 'spiral' } : { lx: .8, ly: .4 }, lean: Math.sin(t * Math.PI) * .05 });
    if (u > 1) for (let k = 0; k < 6; k++) { const ph = ((tq * 2 + k / 6) % 1); T.dot(ST.XK[i] - 196 - ph * 10, -30 + ph * 30, 3, P.white); }
  }
  if (name === 'mathani') {
    const pull = Math.sin(Math.PI * beats(tq)) * (u > .4 ? 1 : 0);
    const coil = (j) => [ST.XK[i] + MATHANI_COIL[j][0] - lx, MATHANI_COIL[j][1]];
    const hL = [toolX - 160 + pull * 40, -300], hR = [toolX - 150 - pull * 40, -250];
    lotu({ ...base, armL: { x: hL[0], y: hL[1], hand: 'grab', bend: 30 }, armR: { x: hR[0], y: hR[1], hand: 'grab', front: true, bend: -20 }, eyes: hit ? { type: 'wide' } : { lx: .8, ly: -.3 }, mouth: hit ? { type: 'o' } : base.mouth });
    T.push(); T.translate(lx, 0); stroke(quad(coil(0), [(coil(0)[0] + hL[0]) / 2, -340], [hL[0] + 20, hL[1]]), S.lw * 1.1); stroke(quad(coil(1), [(coil(1)[0] + hR[0]) / 2, -300], [hR[0] + 20, hR[1]]), S.lw * 1.1); T.pop();
    if (hit) for (let k = 0; k < 5; k++) { const a = -Math.PI * (.15 + k * .17), r = 60 + (t - st) * 200; T.dot(ST.XK[i] + Math.cos(a) * r, -280 + Math.sin(a) * r, 5, P.white); }
  }
  if (name === 'matka') {
    const cool = u > 2;
    lotu({ ...base, armR: { x: toolX - 110, y: -150, hand: 'open', front: true, bend: -10 }, armL: { x: -110, y: -200, hand: 'open', bend: 20 }, eyes: hit ? { type: 'happy' } : cool ? { type: 'happy' } : base.eyes, mouth: cool ? { type: 'grin' } : base.mouth, sx: 1 + (cool ? Math.sin(t * 70) * .01 : 0) });
    if (u > 1) for (let k = 0; k < 4; k++) { const ph = ((t * .6 + k / 4) % 1), y0 = -280 + k * 60; stroke(spline([[ST.XK[i] + 150 + ph * 180, y0], [ST.XK[i] + 200 + ph * 180, y0 - 20], [ST.XK[i] + 260 + ph * 180, y0 + 4], [ST.XK[i] + 240 + ph * 180, y0 + 24]], false, 5), S.lw * .6, { line: P.white }); }
  }
}
function soopShot(t, lx, u, st, b, tq) {
  if (t < ST.SK[5] + 2) return;
  const hit = t >= st && t < st + 1.6, ph = beats(tq) % 1, toss = u > .5 ? Math.sin(Math.PI * ph) : 0;
  const sx = lx + 230, sy = -150 - toss * 30;
  lotu({ x: lx, y: 0, t: tq, steam: 'lazy', sy: 1 + b * .03, armL: { x: 120, y: -150 - toss * 30, hand: 'grab', bend: 20 }, armR: { x: 330, y: -150 - toss * 30, hand: 'grab', bend: -30, front: true }, eyes: hit ? { type: 'happy' } : { lx: .9, ly: -.4 * toss }, mouth: { type: talking(t) ? (Math.floor(t * 8) % 2 ? 'open' : 'smile') : 'smile', open: .5 } });
  soop(sx, sy, 1, b, { eyes: { type: hit ? 'happy' : 'open', lx: -.3 }, mouth: { type: hit ? 'beam' : 'smile' }, tilt: -.08 + toss * .1 });
  if (u > .5) {
    for (let k = 0; k < 10; k++) { const gy = sy - 40 - toss * 120 * (.6 + hash(k) * .6), gx = sx - 60 + hash(k + 4) * 140; T.dot(gx, gy, 4, P.ink); }   // grain goes up and comes back
    for (let k = 0; k < 8; k++) { const age = ((t - ST.SK[5] - 2.5) * .7 + k / 8) % 1, cx = sx - 40 - age * 520, cy = sy - 80 - age * 160 + Math.sin(age * 9 + k) * 20;
      shape(ell(cx, cy, 9, 4, 8), { fill: P.pale, lw: S.lw * .4 }); }   // chaff blows away
  }
}
function talking(t) { for (const [id, s] of Object.entries(ST.VO)) if (t >= s && t < s + DURV[id]) return true; return false; }
let DURV = {};
export function setDur(d) { DURV = d; }

function introShot(t) {
  const cam = camAt(t), c = setCam(t, cam), tq = q2(t), b = breath(t), lx = lotuX(t);
  const bow = t > 2.2 && t < 3.6 ? Math.sin(Math.PI * seg(t, 2.2, 3.6)) : 0;
  const pointR = t > 11 && t < 13 ? 1 : 0;
  if (t < 13) {
    lotu({ x: lx, y: 0, t: tq, steam: 'lazy', lean: bow * .35, sy: 1 + b * .03, sx: 1 - b * .02, eyes: t < .9 ? { type: 'shut' } : { lx: t < 2.2 ? 0 : -.2 }, mouth: { type: talking(t) ? (Math.floor(t * 8) % 2 ? 'grin' : 'smile') : 'grin', open: .5 },
      armL: bow ? { x: -120, y: -40, hand: 'open', bend: 10 } : { x: -150, y: -200 + b * 6, hand: 'wave', bend: 20 },
      armR: pointR ? { x: 190, y: -170, hand: 'point', bend: -10, front: true } : bow ? { x: 80, y: -90, hand: 'fist', front: true } : { x: 150, y: -110, hand: 'open', bend: -14 } });
  } else { const w = walk(beats(tq)); lotu({ x: lx, y: w.bob, ...w, armL: { x: -130, y: -130 + w.sw * 24, hand: 'open', bend: 16 }, armR: { x: 130, y: -130 - w.sw * 24, hand: 'open', bend: -16 }, eyes: { lx: .6 }, mouth: { type: 'smile' }, steam: 'lazy', t: tq }); }
  // iris opening on Lotu's eye
  if (t < 2.2) { const [ex, ey] = toScr(c, 300 - 25, -184), r = Math.pow(seg(t, .05, 2.0), 1.6) * 2400; sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#050505'; sg.beginPath(); sg.rect(0, 0, F.W, F.H); sg.arc(ex, ey, Math.max(0, r), 0, TAU, true); sg.fill('evenodd'); sg.restore(); }
}
// title card: a painted sunburst card, fat Devanagari letters that hop on the beat; rolls up like a window shade
function fatTitle(text, cx, cy, size, bounce, font = 'Yatra One') {
  const g = sg; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `${size}px "${font}"`; g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.lineJoin = 'round';
  const words = text.split(' '), ws = words.map(w => g.measureText(w + ' ').width), tot = ws.reduce((a, c) => a + c, 0);
  let x = cx - tot / 2; const base = cy + size * .35;
  const G = words.map((w, i) => { const o = { w, x: x + ws[i] / 2 - g.measureText(' ').width / 2, dy: bounce ? bounce(i) : 0 }; x += ws[i]; return o; });
  for (const L of G) { g.fillStyle = P.ink; g.strokeStyle = P.ink; g.lineWidth = size * .16; g.strokeText(L.w, L.x + size * .06, base + L.dy + size * .07); g.fillText(L.w, L.x + size * .06, base + L.dy + size * .07); }
  for (const L of G) { g.strokeStyle = P.ink; g.lineWidth = size * .14; g.strokeText(L.w, L.x, base + L.dy); }
  for (const L of G) { g.fillStyle = P.white; g.fillText(L.w, L.x, base + L.dy); }
  g.restore();
}
function sunburst(t, cx, cy) { const g = sg; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, F.W, F.H); g.translate(cx, cy); g.rotate(-t * .2); for (let i = 0; i < 24; i++) { g.fillStyle = i % 2 ? '#8A877F' : '#C4C1B8'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 2400, i / 24 * TAU, (i + 1) / 24 * TAU); g.fill(); } g.restore(); }
function titleShot(t) {
  const [cx, cy] = GC();
  const ru = ei(seg(t, ST.TITLE[1] - .35, ST.TITLE[1]));   // rolls up like a window shade, showing the next shot underneath
  if (ru > 0) { introShot(t); sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.beginPath(); sg.rect(0, 0, F.W, GATE.y + GATE.h * (1 - ru)); sg.clip(); }
  sunburst(t, cx, cy);
  const bt = beats(q2(t)), hopL = i => -(Math.max(0, Math.cos((bt - i * .25) * Math.PI)) ** 6) * 26;
  const g = sg, w = VFMT ? 940 : 1100, h = VFMT ? 560 : 420; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#F4F1EA'; g.strokeStyle = P.ink; g.lineWidth = 9;
  g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 40); g.fill(); g.stroke(); g.lineWidth = 3; g.beginPath(); g.roundRect(cx - w / 2 + 18, cy - h / 2 + 18, w - 36, h - 36, 28); g.stroke(); g.restore();
  if (VFMT) { fatTitle('दादी की', cx, cy - 110, 130, hopL); fatTitle('रसोई', cx, cy + 50, 170, i => hopL(i + 2)); }
  else fatTitle('दादी की रसोई', cx, cy - 40, 150, hopL);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = P.ink; g.textAlign = 'center'; g.font = `${VFMT ? 46 : 50}px "Rozha One"`; g.fillText('लोटूराम के साथ एक टूर', cx, cy + (VFMT ? 200 : 130)); g.restore();
  if (ru > 0) { const yb = GATE.y + GATE.h * (1 - ru); sg.fillStyle = '#3B3A37'; sg.fillRect(0, yb - 40, F.W, 40); sg.fillStyle = '#0E0D0C'; sg.fillRect(0, yb - 8, F.W, 8); sg.restore(); }
}
function finaleShot(t) {
  const [x0, x1] = ST.FINALE, b = breath(t), tq = q2(t), bt = beats(tq);
  const pull = eio(seg(t, x0, x0 + 1.6)), squash = .025 * Math.max(0, Math.cos(TAU * bt)) * pull;
  const cam = { x: ST.STAGE_X, y: lerp(-230, VFMT ? -20 : -190, pull), wv: lerp(900, VFMT ? 1120 : 1650, pull) };
  setCam(t, cam, squash);
  const hopY = i => -Math.max(0, Math.sin(Math.PI * ((bt + i * .5) % 1))) * 40;
  if (VFMT) {   // two rows: five at the back, two in front beside Lotu
    const back = [[0, -2], [1, -1], [2, 0], [3, 1], [6, 2]], front = [[4, -1.45], [5, 1.45]];
    back.forEach(([i, cx]) => { T.push(); T.translate(0, hopY(i)); tool(i, t, ST.STAGE_X + cx * 190, .44, b * 2, true); T.pop(); });
    front.forEach(([i, cx]) => { T.push(); T.translate(0, hopY(i) + 230); tool(i, t, ST.STAGE_X + cx * 230, .6, b * 2, true); T.pop(); });
  } else [0, 1, 2, 3, 4, 5, 6].forEach(i => { T.push(); T.translate(0, hopY(i)); tool(i, t, ST.STAGE_X + (i - 3) * 235, .62, b * 2, true); T.pop(); });
  const kick = Math.sin(Math.PI * bt);
  lotu({ x: ST.STAGE_X, y: (VFMT ? 300 : 150) + hopY(.3) * .6, k: VFMT ? .85 : 1, t: tq, steam: 'heart', sy: 1 + b * .06, sx: 1 - b * .04, eyes: { type: 'happy' }, mouth: { type: 'beam' },
    armL: { x: -150, y: -300 + kick * 30, hand: 'wave', bend: 20 }, armR: { x: 150, y: -300 - kick * 30, hand: 'wave', bend: -20 },
    legL: { x: -40 - Math.max(0, kick) * 30, y: -Math.max(0, kick) * 40, dir: -1 }, legR: { x: 40 + Math.max(0, -kick) * 30, y: -Math.max(0, -kick) * 40, dir: 1 } });
}
// the end card: a title card Lotu drags over the scene (Kathaverse logo, comment, follow)
function endShot(t) {
  const [cx, cy] = GC(); const e0 = ST.END[0];
  const slide = eo(seg(t, e0, e0 + .7));
  // behind: the finale continues for a moment
  if (slide < 1) finaleShot(Math.min(t, ST.FINALE[1] - .01) + (t - e0));
  const g = sg, w = VFMT ? 980 : 1240, h = VFMT ? 1300 : 900, x = lerp(F.W + 60, cx - w / 2, slide), y = cy - h / 2;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (slide >= 1) { sunburst(t, cx, cy); }
  g.fillStyle = 'rgba(14,13,12,.96)'; g.beginPath(); g.roundRect(x, y, w, h, 34); g.fill();
  g.strokeStyle = '#F1EEE6'; g.lineWidth = 4; g.beginPath(); g.roundRect(x + 16, y + 16, w - 32, h - 32, 24); g.stroke(); g.lineWidth = 1.6; g.beginPath(); g.roundRect(x + 26, y + 26, w - 52, h - 52, 18); g.stroke();
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const ax = sx > 0 ? x + 26 : x + w - 26, ay = sy > 0 ? y + 26 : y + h - 26; g.fillStyle = '#F1EEE6'; g.beginPath(); g.arc(ax + sx * 12, ay + sy * 12, 5, 0, 7); g.fill(); g.lineWidth = 2; g.beginPath(); g.arc(ax + sx * 12, ay + sy * 12, 11, 0, 7); g.stroke(); }
  const L = VFMT ? { lx: x + w / 2, ly: y + 250, lr: 170, tx: x + w / 2, ty: y + 520, al: 'center' } : { lx: x + 300, ly: y + 330, lr: 200, tx: x + 580, ty: y + 250, al: 'left' };
  g.save(); g.beginPath(); g.arc(L.lx, L.ly, L.lr, 0, 7); g.clip(); g.filter = 'grayscale(1) contrast(1.15)'; g.drawImage(LOGO, L.lx - L.lr * 1.04, L.ly - L.lr * 1.04, L.lr * 2.08, L.lr * 2.08); g.filter = 'none'; g.restore();
  g.strokeStyle = '#F1EEE6'; g.lineWidth = 4; g.beginPath(); g.arc(L.lx, L.ly, L.lr + 8, 0, 7); g.stroke();
  const bt = beats(q2(t)), hop = i => -(Math.max(0, Math.cos((bt - i * .25) * Math.PI)) ** 6) * 14;
  g.textAlign = L.al; g.fillStyle = '#F1EEE6';
  const pc = t > ST.VO.L11 - .2, pf = t > ST.VO.L12 - .2;
  if (pc) { g.restore(); fatTitle('कमेंट करें', L.al === 'center' ? L.tx : L.tx + 210, L.ty, VFMT ? 96 : 90, hop); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = L.al; g.fillStyle = '#F1EEE6';
    g.font = `${VFMT ? 44 : 42}px "Tiro Devanagari Hindi"`; const ql = ['आपकी दादी-नानी के घर में', 'इनमें से क्या-क्या है?']; ql.forEach((s, i) => g.fillText(s, L.tx, L.ty + 110 + i * 60)); }
  if (pf) { const fy = L.ty + (VFMT ? 300 : 290), fw = VFMT ? 760 : 640, fx = L.al === 'center' ? L.tx - fw / 2 : L.tx; const pop_ = eo(seg(t, ST.VO.L12 - .2, ST.VO.L12 + .15));
    g.save(); g.translate(fx + fw / 2, fy + 55); g.scale(pop_, pop_); g.fillStyle = '#F1EEE6'; g.beginPath(); g.roundRect(-fw / 2, -55, fw, 110, 55); g.fill(); g.fillStyle = '#0E0D0C'; g.textAlign = 'center'; g.font = `${VFMT ? 54 : 50}px "Yatra One"`; g.fillText('फॉलो करें · Kathaverse', 0, 18); g.restore(); }
  g.restore();
  // Lotu peeks in and drags the card
  T.BASE.splice(0, 6, 1, 0, 0, 1, 0, 0); T.frame(t);
  const tq = q2(t), b = breath(t), lk = VFMT ? .9 : 1;
  if (slide < 1) { lotu({ x: x - 120, y: cy + 300, k: lk, t: tq, lean: -.25, eyes: { lx: .8 }, mouth: { type: 'grin' }, armR: { x: 140, y: -240, hand: 'grab', front: true, bend: -10 }, armL: { x: -150, y: -100, hand: 'open' }, ...walk(beats(tq) * 2) }); }
  else { const lx = VFMT ? x + w - 150 : x + 160, ly = VFMT ? y + h + 170 : y + h + 20, wave = Math.sin(t * Math.PI * 2);
    lotu({ x: lx, y: ly, k: lk * .85, t: tq, sy: 1 + b * .04, eyes: { type: 'happy' }, mouth: { type: talking(t) ? (Math.floor(t * 8) % 2 ? 'open' : 'grin') : 'grin', open: .5 }, steam: 'lazy', armR: { x: 150, y: -280 + wave * 20, hand: 'wave', bend: -20 }, armL: { x: -140, y: -110, hand: 'open', bend: 14 } }); }
  // iris closes at the very end
  const r = (1 - ei(seg(t, ST.DUR - 1.2, ST.DUR - .2))) * 2400;
  if (r < 2400) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#050505'; g.beginPath(); g.rect(0, 0, F.W, F.H); g.arc(cx, cy, Math.max(0, r), 0, TAU, true); g.fill('evenodd'); g.restore(); }
}
// subtitles: period title cards (near-black plate, double rule, dot-and-ring corners), Devanagari, 1–2 lines
export function subtitles(t) {
  if (t >= ST.END[0] + .5) return;
  for (const [t0, t1, text] of SUBS) {
    if (t < t0 || t >= t1) continue;
    const g = sg, size = VFMT ? 40 : 38; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `${size}px "Tiro Devanagari Hindi"`;
    const maxw = GATE.w - 200, words = text.split(' '), lines = []; let cur = '';
    for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (g.measureText(tr).width > maxw && cur) { lines.push(cur); cur = wd; } else cur = tr; } if (cur) lines.push(cur);
    const tw_ = Math.max(...lines.map(l => g.measureText(l).width)), w = tw_ + size * 2, lh = size * 1.45, h = lines.length * lh + size * .9;
    const [cx] = GC(), cy = GATE.y + GATE.h - h / 2 - (VFMT ? 70 : 36), x0 = cx - w / 2, y0 = cy - h / 2;
    g.fillStyle = 'rgba(12,11,10,.92)'; g.beginPath(); g.roundRect(x0, y0, w, h, 10); g.fill();
    g.strokeStyle = P.paper; g.lineWidth = 2.2; g.beginPath(); g.roundRect(x0 + 7, y0 + 7, w - 14, h - 14, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.roundRect(x0 + 12, y0 + 12, w - 24, h - 24, 5); g.stroke();
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const ax = sx > 0 ? x0 + 12 : x0 + w - 12, ay = sy > 0 ? y0 + 12 : y0 + h - 12; g.fillStyle = P.paper; g.beginPath(); g.arc(ax + sx * 7, ay + sy * 7, 3, 0, 7); g.fill(); g.lineWidth = 1.3; g.beginPath(); g.arc(ax + sx * 7, ay + sy * 7, 7, 0, 7); g.stroke(); }
    g.fillStyle = P.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, cx, y0 + size * .45 + lh * (i + .5) + 2));
    g.restore();
  }
}
// the corner logo, outside the gate (in the black border), toned to the print
export function bug(g, t) {
  if (t < 2 || t >= ST.END[0]) return;
  const a = Math.min(seg(t, 2, 2.3), seg(ST.END[0], ST.END[0] - .3, t) || 1), r = VFMT ? 76 : 70, x = VFMT ? F.W - 110 : F.W - 120, y = VFMT ? 120 : 110;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = seg(t, 2, 2.3); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.filter = 'grayscale(1) sepia(.35)'; g.drawImage(LOGO, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08); g.filter = 'none'; g.restore();
  g.save(); g.globalAlpha = seg(t, 2, 2.3); g.strokeStyle = '#d8cfbd'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.stroke(); g.restore();
}
export function frameAt(t) {
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, F.W, F.H);
  if (t >= ST.TITLE[0] && t < ST.TITLE[1]) titleShot(t);
  else if (t < ST.SK[0]) introShot(t);
  else if (t < ST.FINALE[0]) stationShot(t);
  else if (t < ST.END[0]) finaleShot(t);
  else endShot(t);
}
export const CUTS = [ST.TITLE[0], ST.TITLE[1], ST.FINALE[0]];
// thumbnail card: full frame (no gate), the sunburst, Lotu with the chulha, a fat title, a chip, the logo
export function thumb(g, W, H) {
  sg = g; F.W = W; F.H = H; GATE = { x: 0, y: 0, w: W, h: H };
  sunburst(1.3, VFMT ? W / 2 : W * .7, VFMT ? H * .62 : H * .55);
  const t = 30, z = VFMT ? 1.75 : 1.55;
  const cx = VFMT ? W / 2 : W * .74, cy = VFMT ? H * .8 : H * .9;
  T.BASE.splice(0, 6, z, 0, 0, z, cx, cy); T.frame(t);
  chulha(VFMT ? 120 : 140, 0, .8, 0, { fire: 1.2, eyes: { type: 'happy' }, t });
  lotu({ x: VFMT ? -120 : -140, y: 0, t, steam: 'heart', eyes: { lx: -.3 }, mouth: { type: 'beam' }, armL: { x: -150, y: -260, hand: 'wave', bend: 20 }, armR: { x: 150, y: -140, hand: 'point', front: true } });
  if (VFMT) { fatTitle('दादी की', W / 2, 260, 150, null); fatTitle('रसोई का टूर', W / 2, 450, 140, null); }
  else { fatTitle('दादी की', 520, 300, 150, null); fatTitle('रसोई का टूर', 520, 500, 140, null); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `${VFMT ? 64 : 60}px "Yatra One"`; const chip = '100 साल पुरानी!'; const cw = g.measureText(chip).width + 70;
  const chx = VFMT ? W / 2 - cw / 2 : 520 - cw / 2, chy = VFMT ? 560 : 640; g.fillStyle = '#0E0D0C'; g.beginPath(); g.roundRect(chx, chy, cw, 104, 52); g.fill(); g.strokeStyle = '#F1EEE6'; g.lineWidth = 4; g.beginPath(); g.roundRect(chx + 8, chy + 8, cw - 16, 88, 44); g.stroke();
  g.fillStyle = '#F1EEE6'; g.textAlign = 'center'; g.fillText(chip, chx + cw / 2, chy + 72); g.restore();
  const r = VFMT ? 90 : 84, lx = W - 130, ly = 130; g.save(); g.fillStyle = '#F1EEE6'; g.beginPath(); g.arc(lx, ly, r + 8, 0, 7); g.fill(); g.beginPath(); g.arc(lx, ly, r, 0, 7); g.clip(); g.filter = 'grayscale(1) sepia(.35)'; g.drawImage(LOGO, lx - r * 1.04, ly - r * 1.04, r * 2.08, r * 2.08); g.restore();
}
