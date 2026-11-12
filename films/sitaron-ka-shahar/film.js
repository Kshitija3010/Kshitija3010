// film.js · "सितारों का शहर" · an original flash-cut lyric Short for Astroverse. 1080×1920, 120 BPM (beat 0.5 s), 96 beats = 48 s.
// Every word lands on a beat: hard cut, colour flip, scale punch; the drop runs the 12 rashis one per two beats.
import { makeTextures, paperSheet, inkFinish, clamp, lerp, hash, mulberry } from './engine/silk.js';
import { emblem, CONST } from './engine/emblems.js';

export const BPM = 120, B = .5, DUR = 48;
const W = 1080, H = 1920, PAPER = '#F3EAD8', FD = 'Teko', FT = 'Poppins';
const NAVY = '#101634', INK = '#0A0E22', GOLD = '#F2C14E', VIOLET = '#8C7CF0', CORAL = '#F0745A', CREAM = PAPER;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3);

// the words: [beat, text, style]. style: n normal, b big, g gold-on-navy, i inverted, s small, num countdown
const WORDS = [
  [0, 'सुनो', 's'], [2, 'आसमान', 'n'], [4, 'कुछ', 's'], [5, 'कहता', 'n'], [6, 'है…', 'b'],
  [8, 'रात के', 'n'], [10, 'आसमान में', 'n'], [12, 'छुपा है', 'n'], [14, 'एक शहर', 'g'],
  [16, 'बारह', 'n'], [17, 'दरवाज़े', 'i'], [18, 'बारह', 'n'], [19, 'राज़', 'i'], [20, '12', 'twelve'],
  [24, 'हर तारा', 'n'], [26, 'एक कहानी', 'g'], [28, 'हर कहानी', 'n'], [30, 'तुम्हारी', 'b'],
  [32, 'कौन-सा', 'n'], [33, 'दरवाज़ा', 'i'], [34, 'तुम्हारा', 'n'], [35, 'है?', 'b'],
  [36, '3', 'num'], [37, '2', 'num'], [38, '1', 'num'], [39, '', 'flash'],
];
const RASHI_B0 = 40;                                   // 40..63: 12 rashis × 2 beats
const TITLE = [[64, 'सितारों', 'b'], [66, 'का', 's'], [67, 'शहर', 'b'], [68, 'सितारों का शहर', 'lock']];
const OUTRO = [[72, 'तुम्हारी', 'n'], [74, 'राशि', 'g'], [76, 'कौन-सी?', 'b'], [80, 'कमेंट', 'i'], [81, 'करो', 'i'], [82, '↓', 'arrow'], [84, 'फॉलो करो', 'g'], [88, '', 'end']];
let ALL = [], ctx, T, LOGO, CUTS = [];

export function setup(canvas, o) {
  ctx = canvas.getContext('2d'); canvas.width = W; canvas.height = H; T = makeTextures(PAPER, 31); LOGO = o.logo; ALL = o.all;
  CUTS = [...WORDS, ...ALL.map((r, i) => [RASHI_B0 + i * 2, r.name, 'rashi', r]), ...TITLE, ...OUTRO].sort((a, b) => a[0] - b[0]);
  return { dur: DUR, ev: events() };
}
function events() {
  const ev = CUTS.map(c => ({ t: c[0] * B, type: 'cut', style: c[2] }));
  ev.push({ t: 20 * B, type: 'drop' }, { t: 64 * B, type: 'impact' });
  return ev.sort((a, b) => a.t - b.t);
}

// ---------------- drawing helpers ----------------
function fit(text, max, size, wt = 700, fam = FD) { let f = size; ctx.font = `${wt} ${f}px ${fam}`; while (ctx.measureText(text).width > max && f > 30) { f -= 4; ctx.font = `${wt} ${f}px ${fam}`; } return f; }
function stars(seed, n, col, a = 1) { const r = mulberry(seed); ctx.fillStyle = col; ctx.globalAlpha = a; for (let k = 0; k < n; k++) { const x = r() * W, y = r() * H, s = r() < .85 ? 2 + r() * 2 : 4 + r() * 3; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
function star4(x, y, r) { const k = r * .28; ctx.beginPath(); [[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
function word(text, size, col, punch, rot, y = H / 2, shadow = null) {
  ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(punch, punch);
  const f = fit(text, W - 120, size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, 10, 14 + f * .04); }
  ctx.fillStyle = col; ctx.fillText(text, 0, f * .04); ctx.restore();
}
function bars(col, t, n = 7) {                         // sliding speed bars, for energy
  ctx.fillStyle = col; for (let i = 0; i < n; i++) { const y = (hash(i * 3.3) * H + t * 900 * (1 + i % 3)) % (H + 200) - 100; ctx.fillRect(0, y, W, 6 + (i % 3) * 6); }
}

// ---------------- render ----------------
export function render(t) {
  const beat = t / B, idx = CUTS.findLastIndex(c => c[0] <= beat + 1e-6);
  const c = CUTS[Math.max(0, idx)], b0 = c[0], local = t - b0 * B, punch = 1 + .32 * (1 - eo(local / .12)), k = idx;
  const rot = (hash(k * 7.1) - .5) * .14, inDrop = beat >= 40 && beat < 72;
  const shake = inDrop ? [(hash(Math.floor(t * 24) * 1.7) - .5) * 14 * (1 - seg(local, 0, .25)), (hash(Math.floor(t * 24) * 2.9) - .5) * 14 * (1 - seg(local, 0, .25))] : [0, 0];
  ctx.setTransform(1, 0, 0, 1, shake[0], shake[1]);
  const st = c[2];
  if (st === 'rashi') drawRashi(c[3], local, punch, k);
  else if (st === 'flash') { ctx.fillStyle = CREAM; ctx.fillRect(-40, -40, W + 80, H + 80); }
  else if (st === 'end') drawEnd(local);
  else {
    const cycle = [NAVY, INK, '#1B1446', NAVY], bg = st === 'i' ? GOLD : st === 'twelve' ? INK : cycle[k % 4];
    ctx.fillStyle = bg; ctx.fillRect(-40, -40, W + 80, H + 80);
    paperSheet(ctx, T, -40, -40, 0, 0);
    stars(11 + k, st === 'i' ? 0 : 90, CREAM, .6);
    if (beat >= 8 && st !== 'i') bars('rgba(140,124,240,.10)', t);
    const col = st === 'i' ? INK : st === 'g' ? GOLD : st === 'b' ? CORAL : CREAM;
    if (st === 'num') { ctx.fillStyle = [CORAL, GOLD, VIOLET][Math.round(c[1]) % 3] || GOLD; ctx.beginPath(); ctx.arc(W / 2, H / 2, 300 * punch, 0, 7); ctx.fill(); word(c[1], 520, INK, punch, 0); }
    else if (st === 'twelve') {
      const p = seg(local, 0, 2 * B); ctx.strokeStyle = GOLD; ctx.lineWidth = 16;
      for (let i = 0; i < 12; i++) { if (i / 12 > p * 1.2 + .05) break; const a = (i * 30 - 90) * Math.PI / 180; ctx.fillStyle = i % 2 ? VIOLET : GOLD; ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 380, H / 2 + Math.sin(a) * 380, 34, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 380, 0, 7); ctx.stroke(); word('12', 560, GOLD, punch, 0);
      word('राशियाँ', 120, CREAM, 1, 0, H / 2 + 560);
    } else if (st === 'lock') drawTitle(local);
    else if (st === 'arrow') { ctx.fillStyle = GOLD; const y = H / 2 + Math.sin(local * 14) * 30; ctx.beginPath(); ctx.moveTo(W / 2 - 200, y - 80); ctx.lineTo(W / 2 + 200, y - 80); ctx.lineTo(W / 2, y + 180); ctx.closePath(); ctx.fill(); ctx.fillRect(W / 2 - 70, y - 380, 140, 320); }
    else word(c[1], st === 's' ? 230 : st === 'b' ? 380 : 320, col, punch, rot, H / 2, st === 'i' ? null : 'rgba(0,0,0,.45)');
    inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .7);
  }
  // one-frame white flash on the bar lines of the drop
  if (inDrop && beat % 4 < .08 && st !== 'flash') { ctx.fillStyle = 'rgba(243,234,216,.85)'; ctx.fillRect(-40, -40, W + 80, H + 80); }
  // the Astroverse badge, bottom corner, from the verse on
  if (beat >= 8 && st !== 'end' && st !== 'flash' && LOGO) { ctx.setTransform(1, 0, 0, 1, 0, 0); const r = 66, x = W - 105, y = 150; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 7); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08); ctx.restore(); }
}
function drawRashi(r, local, punch, k) {
  const [sky1, sky2, far, mid, near, sun, glow] = r.pal, i = r.n - 1;
  ctx.fillStyle = i % 2 ? near : sky2; ctx.fillRect(-40, -40, W + 80, H + 80);
  const rays = 18, rot = local * .6 * (i % 2 ? 1 : -1); ctx.fillStyle = i % 2 ? sky2 : far;
  for (let j = 0; j < rays; j++) { const a0 = rot + j / rays * Math.PI * 2, a1 = a0 + Math.PI / rays; ctx.beginPath(); ctx.moveTo(W / 2, H * .42); ctx.lineTo(W / 2 + Math.cos(a0) * 2400, H * .42 + Math.sin(a0) * 2400); ctx.lineTo(W / 2 + Math.cos(a1) * 2400, H * .42 + Math.sin(a1) * 2400); ctx.closePath(); ctx.fill(); }
  stars(40 + i, 70, PAPER, .7);
  const s = 560 * punch, cx = W / 2, cy = H * .42;
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(cx, cy, s * .52, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(cx - s * .4, cy - s * .4); ctx.scale(s * .8 / 1000, s * .8 / 1000); ctx.fillStyle = near; ctx.fill(emblem(r.em)); ctx.restore();
  const C = CONST[r.id], cs = s * .86; ctx.fillStyle = PAPER; ctx.strokeStyle = PAPER; ctx.lineWidth = 4;
  const P = C.s.map(([x, y]) => [cx - cs / 2 + x * cs, cy - cs / 2 + y * cs]);
  ctx.beginPath(); for (const [a, b] of C.l) { ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); } ctx.stroke(); for (const [x, y] of P) star4(x, y, 16);
  word(r.name, 330, PAPER, punch, (hash(k) - .5) * .08, H * .78, 'rgba(0,0,0,.5)');
  ctx.font = `600 44px ${FT}`; ctx.textAlign = 'center'; ctx.fillStyle = sun; ctx.fillText(`${String(r.n).padStart(2, "0")} / 12`, W / 2, H * .9 + 10);
  inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .6);
}
function drawTitle(local) {
  ctx.fillStyle = INK; ctx.fillRect(-40, -40, W + 80, H + 80); stars(77, 200, PAPER, .8);
  const p = eo(local / .3); ctx.fillStyle = GOLD;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + local * .3, rr = 360 + 260 * p; star4(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr * .8, 22); }
  word('सितारों', 300, GOLD, 1 + .2 * (1 - p), -.03, H / 2 - 280, 'rgba(0,0,0,.5)');
  word('का', 170, CREAM, 1, 0, H / 2 - 40);
  word('शहर', 380, CORAL, 1 + .2 * (1 - p), .03, H / 2 + 230, 'rgba(0,0,0,.5)');
  inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .6);
}
function drawEnd(local) {
  ctx.fillStyle = INK; ctx.fillRect(-40, -40, W + 80, H + 80); stars(99, 220, PAPER, .8);
  const p = eo(local / .35), r = 300 * (.7 + .3 * p);
  if (LOGO) { ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H * .4, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, W / 2 - r * 1.04, H * .4 - r * 1.04, r * 2.08, r * 2.08); ctx.restore(); }
  ctx.globalAlpha = 1; word('ASTROVERSE', 150, GOLD, 1, 0, H * .4 + 400);
  if (local > .5) word('फॉलो करो · नई कहानियाँ हर हफ़्ते', 64, CREAM, 1, 0, H * .4 + 520);
  if (local > 1) word('राशियों की कहानी · 12 एपिसोड', 52, VIOLET, 1, 0, H * .4 + 610);
}
