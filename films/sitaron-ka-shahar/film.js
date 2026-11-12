// film.js · "सितारों का शहर" (desi cut) · original flash-cut lyric Short for Astroverse. 1080×1920, 120 BPM (beat 0.5 s), 96 beats = 48 s.
// Indian setting: marigold torans, diyas, rangoli mandala, a North-Indian kundli chart, rashis in lotus petals, a ghat skyline with kites.
import { makeTextures, inkFinish, clamp, hash, mulberry } from './engine/silk.js';
import { emblem, CONST } from './engine/emblems.js';

export const BPM = 120, B = .5, DUR = 48;
const W = 1080, H = 1920, CREAM = '#F6EBD3', FD = 'Teko', FT = 'Poppins';
const SAFFRON = '#F28C28', MAROON = '#5E1626', HALDI = '#F5C518', PEACOCK = '#0E5563', RANI = '#C92A62', INDIGO = '#1B1446', NIGHT = '#120B24', LEAF = '#2F7A3A', CLAY = '#9A4A2A';
const BGS = [MAROON, PEACOCK, INDIGO, '#7A2A10'];
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3);

// [beat, text, style] · n normal, b big, g haldi, i inverted (text on haldi/saffron), s small, num countdown
const WORDS = [
  [0, 'सुनो', 's'], [2, 'आसमान', 'n'], [4, 'कुछ', 's'], [5, 'कहता', 'n'], [6, 'है…', 'b'],
  [8, 'रात के', 'n'], [10, 'आसमान में', 'n'], [12, 'छुपा है', 'n'], [14, 'एक शहर', 'g'],
  [16, 'बारह', 'n'], [17, 'दरवाज़े', 'i'], [18, 'बारह', 'n'], [19, 'राज़', 'i'], [20, '12', 'kundli'],
  [24, 'हर तारा', 'n'], [26, 'एक कहानी', 'g'], [28, 'हर कहानी', 'n'], [30, 'तुम्हारी', 'b'],
  [32, 'कौन-सा', 'n'], [33, 'दरवाज़ा', 'i'], [34, 'तुम्हारा', 'n'], [35, 'है?', 'b'],
  [36, '३', 'num'], [37, '२', 'num'], [38, '१', 'num'], [39, '', 'flash'],
];
const RASHI_B0 = 40;
const TITLE = [[64, 'सितारों', 'b'], [66, 'का', 's'], [67, 'शहर', 'b'], [68, 'सितारों का शहर', 'lock']];
const OUTRO = [[72, 'तुम्हारी', 'n'], [74, 'राशि', 'g'], [76, 'कौन-सी?', 'b'], [80, 'कमेंट', 'i'], [81, 'करो', 'i'], [82, '↓', 'arrow'], [84, 'फॉलो करो', 'g'], [88, '', 'end']];
let ALL = [], ctx, T, LOGO, CUTS = [];

export function setup(canvas, o) {
  ctx = canvas.getContext('2d'); canvas.width = W; canvas.height = H; T = makeTextures(CREAM, 41); LOGO = o.logo; ALL = o.all;
  CUTS = [...WORDS, ...ALL.map((r, i) => [RASHI_B0 + i * 2, r.name, 'rashi', r]), ...TITLE, ...OUTRO].sort((a, b) => a[0] - b[0]);
  const ev = CUTS.map(c => ({ t: c[0] * B, type: 'cut', style: c[2] }));
  return { dur: DUR, ev };
}

// ---------------- helpers ----------------
function fit(text, max, size, wt = 700, fam = FD) { let f = size; ctx.font = `${wt} ${f}px ${fam}`; while (ctx.measureText(text).width > max && f > 30) { f -= 4; ctx.font = `${wt} ${f}px ${fam}`; } return f; }
function word(text, size, col, punch, rot, y = H / 2, shadow = 'rgba(0,0,0,.45)') {
  ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(punch, punch);
  const f = fit(text, W - 140, size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, 10, 14 + f * .04); }
  ctx.fillStyle = col; ctx.fillText(text, 0, f * .04); ctx.restore();
}
function poly(pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
function star4(x, y, r) { const k = r * .28; poly([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]]); ctx.fill(); }
function stars(seed, n, col, a = 1, ymax = H) { const r = mulberry(seed); ctx.fillStyle = col; ctx.globalAlpha = a; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(r() * W, r() * ymax, r() < .85 ? 2 + r() * 2 : 4 + r() * 2, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
// rangoli mandala: rings of petals and dots, slowly turning
function mandala(cx, cy, R, col, rot, a = .22) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = col;
  for (let j = 0; j < 5; j++) {
    const r = R * (.25 + j * .19), n = 8 + j * 4, pl = R * (.09 + j * .015);
    for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2 + (j % 2) * Math.PI / n; ctx.save(); ctx.rotate(an); ctx.beginPath(); ctx.ellipse(r, 0, pl, pl * .42, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r + pl * 1.3, 0, 7); ctx.stroke();
    for (let i = 0; i < n * 2; i++) { const an = i / (n * 2) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(an) * (r + pl * 1.7), Math.sin(an) * (r + pl * 1.7), 5, 0, 7); ctx.fill(); }
  }
  ctx.beginPath(); ctx.arc(0, 0, R * .12, 0, 7); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
}
// toran: marigold strings and mango leaves across the top
function toran(t) {
  const sway = Math.sin(t * 2.2) * 6;
  ctx.fillStyle = '#5A3A1A'; ctx.fillRect(0, 0, W, 16);
  for (let i = 0; i < 13; i++) {
    const x = 20 + i * 86;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? HALDI : SAFFRON; ctx.beginPath(); ctx.arc(x + sway * k / 6, 30 + k * 24, 15, 0, 7); ctx.fill(); }
    ctx.fillStyle = LEAF; const lx = x + 43; poly([[lx - 22, 14], [lx + 22, 14], [lx, 120 + (i % 2) * 20]]); ctx.fill();
    ctx.fillStyle = '#3F9A4C'; poly([[lx - 8, 14], [lx + 8, 14], [lx, 90 + (i % 2) * 20]]); ctx.fill();
  }
  for (let x = 0; x < W; x += 30) { ctx.fillStyle = (x / 30) % 2 ? HALDI : SAFFRON; ctx.beginPath(); ctx.arc(x + 15, 20 + Math.sin(x * .03) * 4, 13, 0, 7); ctx.fill(); }
}
// diyas along the bottom, flames flickering on twos
function diyas(t, y = H - 120, n = 5) {
  for (let i = 0; i < n; i++) {
    const x = W / (n + 1) * (i + 1), fl = .85 + .3 * hash(Math.floor(t * 12) + i * 13);
    ctx.fillStyle = 'rgba(245,197,24,.18)'; ctx.beginPath(); ctx.arc(x, y - 40, 70 * fl, 0, 7); ctx.fill();
    ctx.fillStyle = CLAY; ctx.beginPath(); ctx.moveTo(x - 60, y - 6); ctx.quadraticCurveTo(x, y + 50, x + 60, y - 6); ctx.lineTo(x + 76, y - 18); ctx.lineTo(x - 60, y - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#C0683A'; ctx.fillRect(x - 60, y - 22, 136, 8);
    ctx.fillStyle = SAFFRON; ctx.beginPath(); ctx.moveTo(x, y - 30 - 70 * fl); ctx.quadraticCurveTo(x + 24, y - 40, x, y - 22); ctx.quadraticCurveTo(x - 24, y - 40, x, y - 30 - 70 * fl); ctx.fill();
    ctx.fillStyle = HALDI; ctx.beginPath(); ctx.moveTo(x, y - 30 - 44 * fl); ctx.quadraticCurveTo(x + 12, y - 36, x, y - 26); ctx.quadraticCurveTo(x - 12, y - 36, x, y - 30 - 44 * fl); ctx.fill();
  }
}
// ghats: temples, steps and kites
function ghats(t, col) {
  ctx.fillStyle = col; const base = H - 300;
  ctx.fillRect(0, base, W, 300);
  for (let s = 0; s < 6; s++) ctx.fillRect(0, base - s * 14, W, 6);
  const temple = (x, w, h) => { ctx.fillRect(x - w / 2, base - h * .45, w, h * .45); poly([[x - w * .42, base - h * .45], [x - w * .2, base - h * .95], [x, base - h], [x + w * .2, base - h * .95], [x + w * .42, base - h * .45]]); ctx.fill(); ctx.fillRect(x - 3, base - h - 40, 6, 40); poly([[x + 3, base - h - 40], [x + 40, base - h - 30], [x + 3, base - h - 20]]); ctx.fill(); };
  temple(170, 170, 330); temple(420, 120, 230); temple(700, 200, 400); temple(950, 140, 260);
  for (let i = 0; i < 6; i++) {                                  // kites
    const kx = (150 + i * 170 + Math.sin(t * 1.3 + i) * 30) % W, ky = 260 + (i % 3) * 140 + Math.cos(t * 1.7 + i) * 20, c = [RANI, HALDI, SAFFRON, '#3FA7B5'][i % 4];
    ctx.fillStyle = c; poly([[kx, ky - 46], [kx + 34, ky], [kx, ky + 46], [kx - 34, ky]]); ctx.fill();
    ctx.strokeStyle = 'rgba(246,235,211,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx, ky + 46); ctx.quadraticCurveTo(kx - 60, ky + 300, kx - 20 * i, H - 300); ctx.stroke();
  }
}
// North-Indian kundli chart: a square, its diagonals and the inner diamond = 12 houses
function kundli(cx, cy, s, p, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineJoin = 'round';
  const L = [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]], [[-1, -1], [1, 1]], [[1, -1], [-1, 1]], [[0, -1], [1, 0]], [[1, 0], [0, 1]], [[0, 1], [-1, 0]], [[-1, 0], [0, -1]]];
  L.forEach((l, i) => { const q = clamp(p * L.length - i); if (q <= 0) return; const [a, b] = l; ctx.beginPath(); ctx.moveTo(cx + a[0] * s, cy + a[1] * s); ctx.lineTo(cx + (a[0] + (b[0] - a[0]) * q) * s, cy + (a[1] + (b[1] - a[1]) * q) * s); ctx.stroke(); });
}

// ---------------- render ----------------
export function render(t) {
  const beat = t / B, idx = CUTS.findLastIndex(c => c[0] <= beat + 1e-6), c = CUTS[Math.max(0, idx)], k = idx;
  const local = t - c[0] * B, punch = 1 + .32 * (1 - eo(local / .12)), rot = (hash(k * 7.1) - .5) * .12, inDrop = beat >= 40 && beat < 72, st = c[2];
  const sh = inDrop ? (1 - seg(local, 0, .25)) * 14 : 0;
  ctx.setTransform(1, 0, 0, 1, (hash(Math.floor(t * 24) * 1.7) - .5) * sh, (hash(Math.floor(t * 24) * 2.9) - .5) * sh);
  if (st === 'rashi') drawRashi(c[3], local, punch, k, t);
  else if (st === 'flash') { ctx.fillStyle = HALDI; ctx.fillRect(-40, -40, W + 80, H + 80); mandala(W / 2, H / 2, 700, SAFFRON, t, .5); }
  else if (st === 'end') drawEnd(local, t);
  else if (st === 'lock') drawTitle(local, t);
  else {
    const inv = st === 'i', bg = inv ? (k % 2 ? HALDI : SAFFRON) : st === 'kundli' ? MAROON : BGS[k % 4];
    ctx.fillStyle = bg; ctx.fillRect(-40, -40, W + 80, H + 80);
    if (!inv) stars(11 + k, 60, CREAM, .5, H * .6);
    mandala(W / 2, H / 2, 620, inv ? MAROON : HALDI, t * .25 * (k % 2 ? 1 : -1), inv ? .16 : .14);
    const col = inv ? MAROON : st === 'g' ? HALDI : st === 'b' ? SAFFRON : CREAM;
    if (st === 'num') { ctx.fillStyle = [RANI, SAFFRON, HALDI][k % 3]; ctx.beginPath(); ctx.arc(W / 2, H / 2, 300 * punch, 0, 7); ctx.fill(); mandala(W / 2, H / 2, 330 * punch, CREAM, t, .35); word(c[1], 480, MAROON, punch, 0, H / 2, null); }
    else if (st === 'kundli') {
      const p = seg(local, 0, 1.6 * B); kundli(W / 2, H / 2 - 40, 380, p, HALDI);
      word('12', 300, CREAM, punch, 0, H / 2 - 40); word('राशियाँ · 12 भाव', 96, HALDI, 1, 0, H / 2 + 440, null);
    } else if (st === 'arrow') { ctx.fillStyle = HALDI; const y = H / 2 + Math.sin(local * 14) * 30; poly([[W / 2 - 200, y - 80], [W / 2 + 200, y - 80], [W / 2, y + 180]]); ctx.fill(); ctx.fillRect(W / 2 - 70, y - 380, 140, 320); }
    else word(c[1], st === 's' ? 230 : st === 'b' ? 380 : 320, col, punch, rot, H / 2, inv ? null : 'rgba(0,0,0,.45)');
    toran(t);
    if (!inv) diyas(t);
    inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .6);
  }
  if (inDrop && beat % 4 < .08) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(246,235,211,.8)'; ctx.fillRect(0, 0, W, H); }
  if (beat >= 8 && st !== 'end' && st !== 'flash' && LOGO) { ctx.setTransform(1, 0, 0, 1, 0, 0); const r = 62, x = W - 100, y = 250; ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 7); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08); ctx.restore(); }
}
function drawRashi(r, local, punch, k, t) {
  const [sky1, sky2, far, mid, near, sun, glow] = r.pal, i = r.n - 1;
  ctx.fillStyle = i % 2 ? near : sky2; ctx.fillRect(-40, -40, W + 80, H + 80);
  mandala(W / 2, H * .42, 900, i % 2 ? sun : near, local * .8 * (i % 2 ? 1 : -1), .2);
  const s = 560 * punch, cx = W / 2, cy = H * .42;
  ctx.fillStyle = i % 2 ? sky2 : far;                              // lotus: 8 outer and 8 inner petals
  for (let j = 0; j < 16; j++) { const a = j / 8 * Math.PI + (j >= 8 ? Math.PI / 8 : 0), rr = j >= 8 ? s * .62 : s * .74; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(rr, 0, s * .2, s * .1, 0, 0, 7); ctx.fill(); ctx.restore(); if (j === 7) ctx.fillStyle = glow; }
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(cx, cy, s * .52, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(cx - s * .4, cy - s * .4); ctx.scale(s * .8 / 1000, s * .8 / 1000); ctx.fillStyle = near; ctx.fill(emblem(r.em)); ctx.restore();
  const C = CONST[r.id], cs = s * .86, P = C.s.map(([x, y]) => [cx - cs / 2 + x * cs, cy - cs / 2 + y * cs]);
  ctx.strokeStyle = CREAM; ctx.fillStyle = CREAM; ctx.lineWidth = 4; ctx.beginPath(); for (const [a, b] of C.l) { ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); } ctx.stroke(); for (const [x, y] of P) star4(x, y, 16);
  word(r.name, 330, CREAM, punch, (hash(k) - .5) * .08, H * .76, 'rgba(0,0,0,.5)');
  ctx.font = `600 44px ${FT}`; ctx.textAlign = 'center'; ctx.fillStyle = sun; ctx.fillText(`${r.pl} · ${r.el}`, W / 2, H * .76 + 210);
  toran(t); inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .5);
}
function drawTitle(local, t) {
  ctx.fillStyle = NIGHT; ctx.fillRect(-40, -40, W + 80, H + 80); stars(77, 160, CREAM, .8, H * .7);
  ctx.fillStyle = HALDI; ctx.beginPath(); ctx.arc(W * .78, 520, 110, 0, 7); ctx.fill(); ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(W * .78 + 44, 500, 100, 0, 7); ctx.fill();
  const p = eo(local / .3);
  word('सितारों', 300, HALDI, 1 + .2 * (1 - p), -.03, H / 2 - 360, 'rgba(0,0,0,.5)');
  word('का', 170, CREAM, 1, 0, H / 2 - 130);
  word('शहर', 380, SAFFRON, 1 + .2 * (1 - p), .03, H / 2 + 120, 'rgba(0,0,0,.5)');
  ghats(t, '#2A1438'); diyas(t, H - 90, 6); toran(t);
  inkFinish(ctx, T, -40, -40, W + 80, H + 80, .6, .5);
}
function drawEnd(local, t) {
  ctx.fillStyle = NIGHT; ctx.fillRect(-40, -40, W + 80, H + 80); stars(99, 200, CREAM, .8);
  mandala(W / 2, H * .38, 560, HALDI, t * .2, .16);
  const p = eo(local / .35), r = 280 * (.7 + .3 * p);
  if (LOGO) { ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H * .38, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, W / 2 - r * 1.04, H * .38 - r * 1.04, r * 2.08, r * 2.08); ctx.restore(); }
  word('एस्ट्रोवर्स', 190, HALDI, 1, 0, H * .38 + 390);
  if (local > .4) word('फॉलो करो · हर हफ़्ते नई कहानी', 64, CREAM, 1, 0, H * .38 + 520, null);
  if (local > .9) word('राशियों की कहानी · 12 एपिसोड', 54, SAFFRON, 1, 0, H * .38 + 610, null);
  toran(t); diyas(t, H - 110, 5);
}
