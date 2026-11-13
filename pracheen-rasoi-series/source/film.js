// film.js — the page of «दुनिया की पहली रोटी»: Devanagari pencil lettering, the drawings, camera, stylus, subtitles,
// the Kathaverse corner logo, the end card (on the page) and the thumbnail card. Engine primitives come from engine_core.js.
const ctx = document.getElementById('c').getContext('2d');
document.getElementById('c').width = W; document.getElementById('c').height = H;
let VO = null, LOGO = null, DURF = 100;
const at = (id, f = 0) => VO.start[id] + f * VO.dur[id];

// ---------- Devanagari lettering: the shaped word is pencilled in, left to right, under the moving stylus ----------
const KB = 'Kalam';
const mctx = mkCanvas(10, 10).getContext('2d');
function measure(s, size, wt = 700) { mctx.font = `${wt} ${size}px ${KB}`; return mctx.measureText(s).width; }
function HTXT(s, x, y, size, o, t0, d) {
  o = o || {}; const wt = o.w ?? 700, lay = o.layer || 'graph', k = o.k ?? 0.8, al = o.align || 'left';
  const tw = measure(s, size, wt); if (al === 'center') x -= tw / 2;
  const pad = size * 0.3, wx0 = x - pad, wy0 = y - size * 1.15, ww = tw + 2 * pad, wh = size * 1.75;
  const bx = Math.max(0, Math.floor(PX(wx0))), by = Math.max(0, Math.floor(PY(wy0))), w = Math.min(BW - bx, Math.ceil(ww * S)), h = Math.min(BH - by, Math.ceil(wh * S));
  const cv = mkCanvas(w, h), c = cv.getContext('2d', { willReadFrequently: true });
  c.setTransform(S, 0, 0, S, (X0 - wx0) * 0 + (PX(wx0) - bx), PY(wy0) - by); c.font = `${wt} ${size}px ${KB}`; c.fillStyle = '#000'; c.textBaseline = 'alphabetic';
  c.fillText(s, pad, size * 1.15);
  const id = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = id[i * 4 + 3] / 255;
  const seed = rnd(0, 99), x0s = PX(x) - bx, x1s = PX(x + tw) - bx;
  const box = [x, y - size * 0.95, x + tw, y + size * 0.4];
  const e = { t0, d: d ?? Math.max(0.25, s.length * 0.045), kind: 'write', T: { s, box }, wx: [x + tw / 2, y],
    nib: p => { const u = clamp(p); return [x + u * tw, y - size * 0.38 + Math.sin(u * tw / size * 7.5 + seed) * size * 0.3]; },
    apply(prog) {
      const front = lerp(x0s - 4, x1s + size * 0.35 * S, clamp(prog)), buf = TG.L[lay], soft = 6 * S;
      for (let yy = 0; yy < h; yy++) {
        const fy = front + (n1(yy / 9, seed) - 0.5) * size * 0.25 * S, row = yy * w, o = (yy + by) * BW + bx;
        const xe = Math.min(w, Math.ceil(fy + soft));
        for (let xx = 0; xx < xe; xx++) { const m = M[row + xx]; if (!m) continue; const v = m * k * clamp((fy - xx) / soft + 0.5); if (v <= 0) continue; const q = o + xx; buf[q] = buf[q] + v - buf[q] * v; }
      }
    } };
  addEl(e); e.tw = tw; e.x = x; return e;
}
// a word inside a longer lettering, for a block under it
const subX = (s, pre, x, size, wt = 700) => [x + measure(pre, size, wt), x + measure(pre + s, size, wt)];
function hiBlock(x0, x1, y, size, col, t0, d, o = {}) {
  return BLOB([[x0 - 6, y - size * 0.62], [x1 + 6, y - size * 0.66], [x1 + 10, y + size * 0.12], [x0 - 4, y + size * 0.16]], col, { dx: 10, dy: 8, a: o.a ?? 0.86, amp: 2.4, ang: -0.12, sp: 12 }, t0, d);
}
function capsule(n, word, x, y, t0) {   // a chapter capsule: circled number + word on an offset mustard block
  let t = circleStroke(x, y - 16, 30, { w: 2.6 }, t0, 0.16);
  HTXT(String(n), x - 11, y, 44, { k: 0.85 }, t, 0.12);
  const e = HTXT(word, x + 46, y, 54, { k: 0.85 }, t + 0.12, 0.42);
  hiBlock(x + 40, x + 46 + e.tw, y, 54, C.mustard, t + 0.56, 0.16, { a: 0.7 });
  return t + 0.72;
}
function stones(cx, cy, rx, ry, n, sz, t0, d, col = C.stone) {   // a ring/row of stones: outlines, then colour
  const P = []; for (let i = 0; i < n; i++) { const a = Math.PI * (0.05 + 0.9 * i / (n - 1)); P.push([cx - Math.cos(a) * rx, cy + Math.sin(a) * ry * 0.4 - ry * 0.2 * Math.sin(a * 2)]); }
  const polys = P.map(([x, y], i) => ell(x, y, sz * rnd(0.85, 1.15), sz * 0.66 * rnd(0.85, 1.1), rnd(-0.3, 0.3), 0, TAU, 20, 0.08));
  const dd = d * 0.7 / n; polys.forEach((p, i) => PEN(p.concat([p[1]]), { w: 2.2, ta: 0.1, tb: 0.1, wob: 0.4 }, t0 + i * dd, dd));
  polys.forEach((p, i) => BLOB(p, col, { dx: 5, dy: 4, a: 0.8, sp: 7 }, t0 + d * 0.72 + i * d * 0.28 / n, d * 0.28 / n));
  return polys;
}
function flame(cx, by, hgt, wid) { return [[cx - wid, by], ...bez([cx - wid, by], [cx - wid * 1.1, by - hgt * 0.5], [cx - wid * 0.2, by - hgt * 0.7], [cx, by - hgt], 10).slice(1), ...bez([cx, by - hgt], [cx + wid * 0.5, by - hgt * 0.55], [cx + wid * 1.1, by - hgt * 0.4], [cx + wid, by], 10).slice(1)]; }

// ---------- the page ----------
const CUE = {}; let CAM = [], SFX = [], ENDT = 0, LOGOBOX = null, LOGOT = 0, TAPE = [];
function buildPage() {
  R = mulberry(14400);
  // ===== A. the question (L1), the myth (L2), the doubt (L3) =====
  const tq = 'पहली रोटी किसने बनाई?', tx0 = 110, ty0 = 210, ts = 112;
  const T1 = HTXT(tq, tx0, ty0, ts, { k: 0.85 }, 0.15, 2.3);
  const [p0, p1] = subX('पहली रोटी', '', tx0, ts); hiBlock(p0, p1, ty0, ts, C.mustard, at('L1', 0.78), 0.3);
  PEN([[tx0, ty0 + 34], [tx0 + T1.tw * 0.5, ty0 + 26], [tx0 + T1.tw + 10, ty0 + 36]], { layer: 'coral', w: 5.5, ta: 0.06, tb: 0.25, wob: 1.1 }, at('L1', 0.95), 0.25);
  let t = at('L2', 0.42);
  const mk = HTXT('खेती', 130, 410, 86, {}, t, 0.45);
  arrow([[150 + mk.tw, 380], [260 + mk.tw, 372], [340 + mk.tw, 380]], {}, t + 0.5, 0.35);
  const mr = HTXT('रोटी', 380 + mk.tw, 410, 86, {}, at('L2', 0.8), 0.45);
  CUE.myth = [120, 330, 400 + mk.tw + mr.tw, 430];
  HTXT('?', 450 + mk.tw + mr.tw, 425, 140, { layer: 'coral', k: 0.9 }, at('L3', 0.5), 0.3);
  PEN([[130, 465], [700, 455]], { layer: 'light', w: 1.2, p: 0.5 }, at('L3', 0.85), 0.12);   // a construction line left in

  // ===== B. the map (L4) =====
  const coast = [[1690, 70], [1698, 150], [1712, 230], [1728, 300], [1742, 360], [1734, 420], [1758, 490], [1790, 560], [1840, 630]];
  t = at('L4', 0.0);
  PEN([[1650, 80], [1700, 330], [1830, 640]], { layer: 'light', w: 1.3, p: 0.5 }, t, 0.15);
  PEN(coast, { w: 2.6, ta: 0.05, tb: 0.1 }, t + 0.2, 0.9);
  BLOB([[1500, 60], ...coast, [1500, 640]], C.sea, { dx: -8, dy: 6, a: 0.6, ang: 0.4, sp: 14, stop: 0.82 }, at('L4', 0.18), 0.5);
  HTXT('भूमध्य सागर', 1520, 330, 36, { w: 400, k: 0.75 }, at('L4', 0.22), 0.45);
  const river = [[1878, 170], [1884, 230], [1880, 290], [1886, 330]];
  PEN(river, { w: 2.0, ta: 0.1, tb: 0.1 }, at('L4', 0.3), 0.3);
  const dsea = ell(1890, 385, 17, 52, 0.05, 0, TAU, 30, 0.06);
  PEN(dsea.concat([dsea[1]]), { w: 2.2 }, at('L4', 0.35), 0.18);
  BLOB(dsea, C.water, { dx: 4, dy: 4, a: 0.85, sp: 6 }, at('L4', 0.39), 0.1);
  const des = ell(2160, 290, 165, 115, 0.2, 0, TAU, 40, 0.1);
  PEN(des.concat([des[1], des[2]]), { layer: 'light', w: 1.6, p: 0.7 }, at('L4', 0.12), 0.35);
  BLOB(des, C.desert, { dx: 9, dy: 7, a: 0.5, ang: -0.3, sp: 12 }, at('L4', 0.28), 0.4);
  HTXT('काला रेगिस्तान', 2020, 140, 38, { w: 400, k: 0.8 }, at('L4', 0.15), 0.5);
  HTXT('जॉर्डन', 1960, 520, 52, {}, at('L4', 0.42), 0.35);
  BLOB(ell(2170, 300, 11, 11, 0, 0, TAU, 14), C.coral, { dx: 2, dy: 2, a: 0.95, sp: 5 }, at('L4', 0.55), 0.08);
  circleStroke(2170, 300, 34, { layer: 'coral', w: 4 }, at('L4', 0.57), 0.22);
  HTXT('शुबैक़ा', 2215, 345, 48, {}, at('L4', 0.62), 0.4);
  const yy = HTXT('14,400 साल पहले', 1900, 625, 62, {}, at('L4', 0.78), 0.6);
  const [y0_, y1_] = subX('14,400', '', 1900, 62); hiBlock(y0_, y1_, 625, 62, C.mustard, at('L4', 0.9), 0.2);
  CUE.dot = [2170, 300];

  // ===== C. the hut and the hearth (L5, L6) =====
  t = at('L5', 0.0);
  const domeL = bez([180, 1050], [190, 860], [300, 720], [430, 715], 30), domeR = bez([430, 715], [560, 720], [670, 860], [680, 1050], 30);
  PEN(domeL, { w: 2.8, ta: 0.05, tb: 0.05 }, t, 0.45); PEN(domeR, { w: 2.8, ta: 0.05, tb: 0.05 }, t + 0.45, 0.45);
  const door = [[370, 1050], ...bez([370, 1050], [372, 960], [400, 930], [430, 930], 10).slice(1), ...bez([430, 930], [460, 930], [488, 960], [490, 1050], 10).slice(1)];
  PEN(door, { w: 2.3 }, t + 0.95, 0.3);
  [[250, 1000, 330, 790, 430, 760], [300, 1040, 360, 850, 430, 800], [610, 1000, 530, 790, 430, 760], [560, 1040, 500, 850, 430, 800]].forEach(([a, b, c, d, e, f], i) =>
    PEN(bez([a, b], [c, d], [c, d], [e, f], 14), { w: 1.5, p: 0.75, ta: 0.2, tb: 0.4 }, t + 1.3 + i * 0.12, 0.12));
  HTXT('नातूफ़ी शिकारी-संग्राहक', 90, 650, 44, {}, at('L5', 0.15), 1.0);
  const hutBase = stones(430, 1062, 270, 30, 9, 30, at('L5', 0.38), 0.9);
  const dome = domeL.concat(domeR.slice(1));
  BLOB(dome, C.thatch, { dx: 9, dy: 7, a: 0.8, ang: -0.6, sp: 12, holes: [door], cuts: hutBase }, at('L5', 0.55), 0.45);
  BLOB(domeR.concat([[430, 1050]]), C.thatchDk, { dx: 12, dy: 9, a: 0.42, ang: -0.6, sp: 12, holes: [door], cuts: hutBase }, at('L5', 0.62), 0.2);
  BLOB(door, '#6a5546', { dx: 5, dy: 4, a: 0.55, sp: 8 }, at('L5', 0.66), 0.12);
  // the bow: line only (still drawing)
  PEN(bez([760, 760], [850, 830], [850, 980], [760, 1050], 20), { w: 2.6 }, at('L5', 0.7), 0.3);
  PEN([[760, 760], [760, 1050]], { w: 1.2, p: 0.7 }, at('L5', 0.75), 0.15);
  PEN([[700, 905], [870, 905]], { w: 1.8, p: 0.85 }, at('L5', 0.78), 0.12);
  PEN([[870, 905], [852, 893]], { w: 1.8 }, at('L5', 0.8), 0.04); PEN([[870, 905], [852, 917]], { w: 1.8 }, at('L5', 0.81), 0.04);
  // wild plants (gathered)
  [[110, 1060, 95, 960], [122, 1060, 140, 950], [130, 1060, 175, 985], [104, 1060, 70, 990]].forEach(([a, b, c, d], i) =>
    PEN(bez([a, b], [a, (b + d) / 2], [c, (b + d) / 2], [c, d], 10), { w: 1.8, ta: 0.05, tb: 0.5 }, at('L5', 0.86) + i * 0.08, 0.08));
  // the hearth (L6)
  const hs = stones(430, 1158, 120, 22, 7, 24, at('L6', 0.3), 0.6, C.stoneDk);
  const fl = [flame(400, 1148, 70, 22), flame(440, 1148, 95, 26), flame(478, 1148, 60, 20)];
  fl.forEach((f, i) => PEN(f, { w: 2.0, ta: 0.1, tb: 0.1 }, at('L6', 0.55) + i * 0.1, 0.1));
  fl.forEach((f, i) => BLOB(f, i === 1 ? C.coral : C.flame, { dx: 5, dy: 4, a: 0.88, sp: 6 }, at('L6', 0.75) + i * 0.05, 0.05));
  BLOB(flame(440, 1146, 50, 12), C.mustard, { dx: 3, dy: 3, a: 0.8, sp: 5 }, at('L6', 0.9), 0.05);
  HTXT('चूल्हा', 610, 1185, 52, {}, at('L6', 0.8), 0.3);
  arrow([[600, 1168], [570, 1156], [525, 1146]], { w: 3.8, head: 16 }, at('L6', 0.92), 0.2);
  CUE.hearth = [430, 1100];

  // ===== D. the ingredients (L7) =====
  t = at('L7', 0.12);
  const stem = bez([960, 1150], [970, 1000], [990, 850], [1010, 700], 30);
  PEN(stem, { w: 2.4, ta: 0.05, tb: 0.1 }, t, 0.35);
  const spk = [];
  for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(1010, 1036, u), y = lerp(745, 590, u), sg = i % 2 ? 1 : -1, cx = x + sg * 15, cy = y + 4;
    spk.push({ p: ell(cx, cy, 11, 21, sg * 0.45, 0, TAU, 18, 0.05), tip: [cx + sg * 8, cy - 20] }); }
  spk.forEach((s, i) => PEN(s.p.concat([s.p[1]]), { w: 1.9, ta: 0.1, tb: 0.1, wob: 0.3 }, t + 0.35 + i * 0.07, 0.07));
  spk.forEach((s, i) => PEN([s.tip, [s.tip[0] + (i % 2 ? 26 : -26), s.tip[1] - 62]], { w: 1.1, p: 0.7, ta: 0.05, tb: 0.6 }, t + 1.0 + i * 0.04, 0.04));
  const blade = [[975, 960], ...bez([975, 960], [920, 900], [890, 860], [870, 800], 12).slice(1), ...bez([870, 800], [905, 850], [940, 890], [980, 930], 12).slice(1)];
  PEN(blade, { w: 1.9 }, t + 1.4, 0.25);
  spk.forEach((s, i) => BLOB(s.p, i % 3 ? C.wheat : C.wheatDk, { dx: 5, dy: 4, a: 0.9, sp: 5 }, at('L7', 0.42) + i * 0.025, 0.025));
  BLOB(blade, C.sedge, { dx: 6, dy: 5, a: 0.75, sp: 7 }, at('L7', 0.46), 0.1);
  HTXT('जंगली गेहूँ', 1065, 640, 48, {}, at('L7', 0.3), 0.5);
  HTXT('(आइनकॉर्न)', 1068, 698, 36, { w: 400 }, at('L7', 0.45), 0.4);
  // the club-rush tubers
  t = at('L7', 0.6);
  const tb = [ell(1190, 1075, 52, 32, 0.15, 0, TAU, 26, 0.08), ell(1258, 1060, 44, 30, -0.2, 0, TAU, 26, 0.1), ell(1226, 1112, 40, 25, 0.1, 0, TAU, 24, 0.1)];
  tb.forEach((p, i) => PEN(p.concat([p[1]]), { w: 2.3, ta: 0.08, tb: 0.1, wob: 0.5 }, t + i * 0.15, 0.15));
  [[1170, 1100, 1150, 1160], [1210, 1130, 1205, 1180], [1270, 1085, 1300, 1150]].forEach(([a, b, c, d], i) => PEN([[a, b], [(a + c) / 2 + 6, (b + d) / 2], [c, d]], { w: 1.1, p: 0.7, ta: 0.05, tb: 0.7 }, t + 0.5 + i * 0.06, 0.06));
  [[1215, 1040, 1180, 880], [1228, 1038, 1235, 850], [1240, 1040, 1290, 895]].forEach(([a, b, c, d], i) => PEN(bez([a, b], [a, (b + d) / 2], [c, (b + d) / 2 + 30], [c, d], 10), { w: 1.8, ta: 0.05, tb: 0.5 }, t + 0.7 + i * 0.08, 0.08));
  tb.forEach((p, i) => BLOB(p, C.tuber, { dx: 6, dy: 5, a: 0.85, sp: 7, cuts: i === 2 ? [] : [tb[2]] }, at('L7', 0.85) + i * 0.04, 0.04));
  BLOB(tb[0], C.tuberDk, { dx: 9, dy: 7, a: 0.4, sp: 7, holes: [ell(1180, 1065, 40, 22, 0.15, 0, TAU, 20)], cuts: [tb[2]] }, at('L7', 0.9), 0.03);
  HTXT('घास के कंद', 1300, 1010, 48, {}, at('L7', 0.78), 0.45);

  // ===== F. the process row (L8 grind, L9 knead, L10 bake, L11 the colour of bread) =====
  capsule(1, 'पीसना', 210, 1290, at('L8', 0.0));
  const slab = [[160, 1440], [380, 1418], [610, 1424], [650, 1478], [420, 1500], [190, 1505]];
  PEN(slab.concat([slab[0]]), { w: 2.6, smooth: true, ta: 0.04, tb: 0.04 }, at('L8', 0.12), 0.6);
  const hand = ell(380, 1392, 110, 34, -0.04, 0, TAU, 40, 0.04);
  PEN(hand.concat([hand[1], hand[2]]), { w: 2.6 }, at('L8', 0.32), 0.35);
  const grains = [[210, 1440], [232, 1452], [255, 1438], [520, 1446], [548, 1455]].map(([x, y]) => ell(x, y, 8, 5, rnd(-0.5, 0.5), 0, TAU, 12));
  grains.forEach((g, i) => PEN(g.concat([g[1]]), { w: 1.6, wob: 0.2 }, at('L8', 0.45) + i * 0.05, 0.05));
  const flour = [[540, 1428], ...bez([540, 1428], [560, 1395], [600, 1385], [625, 1388], 10).slice(1), ...bez([625, 1388], [650, 1392], [670, 1410], [690, 1430], 10).slice(1)];
  PEN(flour, { w: 2.0, ta: 0.1, tb: 0.1 }, at('L8', 0.62), 0.25);
  BLOB(slab, C.basalt, { dx: 8, dy: 6, a: 0.72, ang: -0.1, sp: 11, cuts: [hand, flour] }, at('L8', 0.72), 0.3);
  BLOB(hand, '#968a80', { dx: 7, dy: 5, a: 0.75, sp: 9, holes: [ell(350, 1382, 46, 9, -0.04, 0, TAU, 16)] }, at('L8', 0.82), 0.12);
  BLOB(flour, C.flour, { dx: 5, dy: 4, a: 0.95, sp: 6 }, at('L8', 0.9), 0.08);
  grains.forEach((g, i) => BLOB(g, C.wheat, { dx: 3, dy: 2, a: 0.95, sp: 4 }, at('L8', 0.93) + i * 0.01, 0.01));
  // knead
  arrow([[680, 1360], [740, 1345], [800, 1352]], {}, at('L9', -0.08), 0.3);
  capsule(2, 'गूँथना', 850, 1270, at('L9', 0.0));
  const rimY = 1395, bowlL = [[830, rimY], ...bez([830, rimY], [835, 1470], [900, 1500], [980, 1502], 14).slice(1), ...bez([980, 1502], [1060, 1500], [1125, 1470], [1130, rimY], 14).slice(1)];
  PEN(bowlL, { w: 2.6, ta: 0.04, tb: 0.04 }, at('L9', 0.12), 0.4);
  PEN(ell(980, rimY, 150, 28, 0, Math.PI * 0.95, Math.PI * 3.02, 50), { w: 2.4 }, at('L9', 0.28), 0.3);
  const dough = ell(985, 1372, 82, 44, 0.04, 0, TAU, 36, 0.04);
  PEN(dough.slice(0, 26), { w: 2.4 }, at('L9', 0.45), 0.25);
  const drops = [[1150, 1290], [1180, 1320], [1162, 1352]].map(([x, y]) => [[x, y - 22], ...bez([x, y - 22], [x + 12, y - 4], [x + 12, y + 8], [x, y + 9], 8).slice(1), ...bez([x, y + 9], [x - 12, y + 8], [x - 12, y - 4], [x, y - 22], 8).slice(1)]);
  drops.forEach((d, i) => PEN(d, { w: 1.8, ta: 0.1, tb: 0.1 }, at('L9', 0.25) + i * 0.08, 0.08));
  BLOB(bowlL, C.bowl, { dx: 8, dy: 6, a: 0.75, ang: -0.2, sp: 10, cuts: [dough] }, at('L9', 0.62), 0.22);
  BLOB(dough, C.dough, { dx: 6, dy: 5, a: 0.95, sp: 8, holes: [ell(960, 1360, 30, 8, -0.1, 0, TAU, 14)] }, at('L9', 0.78), 0.12);
  drops.forEach((d, i) => BLOB(d, C.water, { dx: 4, dy: 3, a: 0.9, sp: 5 }, at('L9', 0.88) + i * 0.03, 0.03));
  // bake
  arrow([[1210, 1360], [1290, 1345], [1360, 1352]], {}, at('L10', -0.05), 0.3);
  capsule(3, 'सेंकना', 1440, 1250, at('L10', 0.0));
  const fire = stones(1650, 1470, 170, 26, 7, 30, at('L10', 0.1), 0.7, C.stoneDk);
  const hot = [[1500, 1428], [1640, 1410], [1800, 1418], [1810, 1448], [1660, 1462], [1495, 1455]];
  PEN(hot.concat([hot[0]]), { w: 2.4, ta: 0.04, tb: 0.04 }, at('L10', 0.3), 0.35);
  const fl2 = [flame(1560, 1470, 55, 18), flame(1660, 1472, 70, 22), flame(1750, 1470, 50, 16)];
  fl2.forEach((f, i) => PEN(f, { w: 1.9, ta: 0.1, tb: 0.1 }, at('L10', 0.42) + i * 0.06, 0.06));
  BLOB(hot, C.basalt, { dx: 7, dy: 5, a: 0.7, sp: 9 }, at('L10', 0.5), 0.12);
  fl2.forEach((f, i) => BLOB(f, i === 1 ? C.coral : C.flame, { dx: 4, dy: 3, a: 0.85, sp: 5, cuts: [hot, ...fire] }, at('L10', 0.56) + i * 0.04, 0.04));
  const bread = ell(1655, 1398, 132, 30, -0.02, 0, TAU, 50, 0.03);
  OCC(bread, at('L10', 0.66));
  PEN(bread.concat([bread[1], bread[2]]), { w: 2.6, ta: 0.04, tb: 0.06 }, at('L10', 0.66), 0.3);
  PEN(ell(1655, 1404, 120, 22, -0.02, 0.2, Math.PI - 0.2, 30), { w: 1.4, p: 0.7 }, at('L10', 0.76), 0.1);
  BLOB(bread, C.dough, { dx: 6, dy: 5, a: 0.95, ang: -0.05, sp: 8 }, at('L10', 0.82), 0.15);
  // the colour of bread: the same block re-registered; a swatch strip records each state
  const sw = [1890, 1990, 2090].map(x => [[x, 1330], [x + 78, 1328], [x + 80, 1388], [x - 2, 1390]]);
  sw.forEach((q, i) => PEN(q.concat([q[0]]), { w: 1.9, smooth: false, ta: 0.05, tb: 0.05 }, at('L11', 0.0) + i * 0.08, 0.08));
  BLOB(sw[0], C.dough, { dx: 6, dy: 5, a: 0.95, sp: 8 }, at('L11', 0.06), 0.08);
  BLOB(bread, C.golden, { dx: 6, dy: 5, a: 0.95, ang: -0.05, sp: 8, replace: true }, at('L11', 0.18), 0.3);
  BLOB(sw[1], C.golden, { dx: 6, dy: 5, a: 0.95, sp: 8 }, at('L11', 0.26), 0.08);
  BLOB(bread, C.toasted, { dx: 6, dy: 5, a: 0.92, ang: -0.05, sp: 8, replace: true, holes: [ell(1610, 1392, 40, 7, 0, 0, TAU, 14)] }, at('L11', 0.4), 0.3);
  BLOB(sw[2], C.toasted, { dx: 6, dy: 5, a: 0.95, sp: 8 }, at('L11', 0.48), 0.08);
  [[1700, 1392, 13, 6], [1600, 1406, 10, 5], [1735, 1408, 8, 4], [1660, 1386, 9, 4]].forEach(([x, y, a, b], i) => BLOB(ell(x, y, a, b, 0.1, 0, TAU, 12, 0.2), C.char, { dx: 4, dy: 3, a: 0.85, sp: 4 }, at('L11', 0.55) + i * 0.04, 0.04));
  HTXT('कच्ची', 1890, 1440, 32, { w: 400 }, at('L11', 0.1), 0.2);
  HTXT('सिंकती', 1988, 1440, 32, { w: 400 }, at('L11', 0.3), 0.2);
  HTXT('तैयार', 2092, 1440, 32, { w: 400 }, at('L11', 0.52), 0.2);
  HTXT('बिना ख़मीर की चपटी रोटी', 1880, 1530, 44, {}, at('L11', 0.62), 0.8);
  CUE.bread = [1655, 1400];

  // ===== E. the find (L12) and the microscope (L13) =====
  t = at('L12', 0.12);
  const pit = stones(1600, 1030, 110, 22, 6, 22, t, 0.5, C.stoneDk);
  const crumbs = [[1560, 1015], [1590, 1005], [1622, 1018], [1640, 1004], [1600, 1028]].map(([x, y]) => ell(x, y, rnd(6, 10), rnd(4, 6), rnd(0, 3), 0, TAU, 10, 0.2));
  crumbs.forEach((c, i) => BLOB(c, C.char, { dx: 2, dy: 2, a: 0.95, sp: 3 }, at('L12', 0.62) + i * 0.04, 0.04));
  HTXT('2018', 1470, 930, 62, { layer: 'coral', k: 0.9 }, at('L12', 0.3), 0.4);
  HTXT('जली हुई रोटी के टुकड़े', 1430, 1150, 40, {}, at('L12', 0.78), 0.8);
  const mx = 2070, my = 900, mr_ = 185;
  PEN([[1640, 1004], [mx - mr_ * 0.85, my + mr_ * 0.5]], { layer: 'light', w: 1.3, p: 0.6 }, at('L12', 0.7), 0.15);
  PEN([[1622, 1018], [mx - mr_ * 0.6, my + mr_ * 0.8]], { layer: 'light', w: 1.3, p: 0.6 }, at('L12', 0.72), 0.15);
  circleStroke(mx, my, mr_, { w: 3.2, a0: 2.4 }, at('L12', 0.82), 0.5);
  circleStroke(mx, my, mr_ + 12, { w: 1.6, p: 0.7, turn: 0.6, a0: 3.4 }, at('L12', 0.92), 0.2);
  PEN([[mx + mr_ * 0.72, my + mr_ * 0.72], [mx + mr_ * 1.12, my + mr_ * 1.12]], { w: 7, ta: 0.05, tb: 0.05 }, at('L12', 0.95), 0.15);
  // inside the lens: a crumb, magnified — its bubbles are holes in the colour (air from the kneading)
  const big = ell(mx, my + 5, 125, 90, 0.25, 0, TAU, 40, 0.12);
  const pores = [[-50, -30, 14, 9], [10, -45, 10, 7], [45, 5, 16, 10], [-15, 25, 12, 8], [-70, 20, 8, 6], [60, -30, 7, 5], [20, 50, 9, 6]].map(([dx, dy, a, b]) => ell(mx + dx, my + dy, a, b, rnd(0, 3), 0, TAU, 14, 0.15));
  t = at('L13', 0.05);
  PEN(big.concat([big[1], big[2]]), { w: 2.6, wob: 0.8 }, t, 0.4);
  pores.forEach((p, i) => PEN(p.concat([p[1]]), { w: 1.5, wob: 0.3 }, t + 0.42 + i * 0.05, 0.05));
  BLOB(big, C.char, { dx: 7, dy: 6, a: 0.9, sp: 9, holes: pores }, at('L13', 0.3), 0.35);
  HTXT('माइक्रोस्कोप', 2280, 770, 42, {}, at('L13', 0.12), 0.5);
  ['पिसा', 'गूँथा', 'सेंका'].forEach((w, i) => { const y = 830 + i * 70, tt = at('L13', 0.55 + i * 0.12);
    PEN([[2290, y - 18], [2302, y - 4], [2328, y - 34]], { layer: 'coral', w: 4.2, smooth: false, ta: 0.1, tb: 0.1 }, tt, 0.12);
    HTXT(w, 2345, y, 44, {}, tt + 0.12, 0.3); });

  // ===== the turn (L15): the arrow is reversed; the timeline (L15) =====
  t = at('L15', 0.0);
  const [m0, m1, m2, m3] = CUE.myth;
  PEN([[m0 - 10, 388], [m2 * 0.5, 378], [m2 + 10, 384]], { layer: 'coral', w: 6, ta: 0.04, tb: 0.04, wob: 1.2 }, t, 0.3);
  const rr = HTXT('रोटी', 130, 560, 86, { layer: 'coral', k: 0.9 }, t + 0.35, 0.4);
  arrow([[150 + rr.tw, 530], [260 + rr.tw, 522], [340 + rr.tw, 530]], {}, t + 0.78, 0.3);
  const rk = HTXT('खेती', 380 + rr.tw, 560, 86, { layer: 'coral', k: 0.9 }, t + 1.1, 0.4);
  HTXT('?', 440 + rr.tw + rk.tw, 565, 90, { layer: 'coral', k: 0.9 }, t + 1.55, 0.2);
  CUE.turn = t;
  const TL = { x0: 180, x1: 2280, y: 1700 }, xFarm = TL.x0 + (4000 / 14400) * (TL.x1 - TL.x0);
  PEN([[TL.x0, TL.y], [1200, TL.y - 4], [TL.x1, TL.y]], { w: 2.8, ta: 0.02, tb: 0.02 }, at('L15', 0.36), 0.6);
  [[TL.x0, 'coral'], [xFarm, 'graph'], [TL.x1, 'graph']].forEach(([x, l], i) => PEN([[x, TL.y - 18], [x, TL.y + 18]], { layer: l, w: 3.2 }, at('L15', 0.45) + i * 0.05, 0.05));
  HTXT('रोटी · 14,400 साल पहले', TL.x0 - 20, TL.y - 34, 40, { layer: 'coral', k: 0.9 }, at('L15', 0.5), 0.5);
  HTXT('खेती की शुरुआत', xFarm - 30, TL.y - 34, 40, {}, at('L15', 0.6), 0.4);
  HTXT('आज', TL.x1 - 40, TL.y - 34, 40, {}, at('L15', 0.9), 0.2);
  PEN(bez([TL.x0, TL.y + 28], [TL.x0 + 30, TL.y + 62], [xFarm - 30, TL.y + 62], [xFarm, TL.y + 28], 20), { layer: 'coral', w: 4.2 }, at('L15', 0.66), 0.35);
  const kk = HTXT('कम से कम 4,000 साल', TL.x0 + 60, TL.y + 120, 46, { layer: 'coral', k: 0.9 }, at('L15', 0.72), 0.6);
  const [k0, k1] = subX('4,000', 'कम से कम ', TL.x0 + 60, 46); hiBlock(k0, k1, TL.y + 120, 46, C.mustard, at('L15', 0.88), 0.15);
  // the hypothesis (L16)
  HTXT('शायद रोटी के लिए ही', 830, 505, 42, { w: 400 }, at('L16', 0.3), 0.6);
  HTXT('खेती शुरू हुई?', 830, 558, 42, { w: 400 }, at('L16', 0.45), 0.5);

  // ===== H. the end card, on a fresh part of the page (L17, L18) =====
  const v = F === 'v';
  const LB = v ? [2780, 110, 360] : [2470, 400, 500];                    // logo: x, y, size
  LOGOBOX = LB; LOGOT = at('L17', 0.0);
  TAPE = [[LB[0] + LB[2] * 0.5, LB[1] - 4, -0.08], [LB[0] + 10, LB[1] + LB[2] - 20, 0.75], [LB[0] + LB[2] - 10, LB[1] + LB[2] - 20, -0.75]];
  const BB = v ? [2610, 520, 700, 270] : [3040, 400, 520, 300];          // bubble: x, y, w, h
  t = at('L17', 0.08);
  const [bx, by, bw, bh] = BB, rq = 26;
  const bub = [[bx + rq, by], [bx + bw - rq, by], [bx + bw, by + rq], [bx + bw, by + bh - rq], [bx + bw - rq, by + bh], ...(v ? [[bx + 160, by + bh], [bx + 120, by + bh + 50], [bx + 110, by + bh]] : [[bx + 90, by + bh], [bx - 50, by + bh + 40], [bx + 30, by + bh - 10]]), [bx + rq, by + bh], [bx, by + bh - rq], [bx, by + rq]];
  PEN(bub.concat([bub[0], bub[1]]), { w: 2.8, smooth: true, ta: 0.03, tb: 0.03 }, t, 0.7);
  BLOB(bub, '#fbf4e4', { dx: 8, dy: 7, a: 0.9, sp: 14, stop: 0.95 }, t + 0.7, 0.3);
  const ck = HTXT('कमेंट करें', bx + 30, by + 80, 64, {}, at('L17', 0.62), 0.45);
  hiBlock(bx + 30, bx + 30 + ck.tw, by + 80, 64, C.mustard, at('L17', 0.75), 0.15);
  const ql = v ? ['क्या आप 14,400 साल पुरानी', 'रोटी चखना चाहेंगे?'] : ['क्या आप 14,400 साल', 'पुरानी रोटी चखेंगे?'];
  ql.forEach((l, i) => HTXT(l, bx + 32, by + (v ? 160 : 160) + i * 58, v ? 46 : 42, { w: 400 }, at('L17', 0.15 + i * 0.2), 0.7));
  const FT = 'फॉलो करें · Kathaverse', FS = v ? 52 : 44, PB = v ? [2610, 830, 700, 116] : [3040, 750, Math.max(520, measure(FT, 44) + 150), 108];
  const [px, py, pw, ph] = PB, pill = ell(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, TAU, 60, 0).map(([x, y]) => [x, y]);
  const pillR = [[px + ph / 2, py], [px + pw - ph / 2, py], ...ell(px + pw - ph / 2, py + ph / 2, ph / 2, ph / 2, 0, -Math.PI / 2, Math.PI / 2, 14).slice(1), [px + ph / 2, py + ph], ...ell(px + ph / 2, py + ph / 2, ph / 2, ph / 2, 0, Math.PI / 2, Math.PI * 1.5, 14).slice(1)];
  PEN(pillR.concat([pillR[0]]), { w: 2.8, smooth: false, ta: 0.03, tb: 0.03 }, at('L18', 0.5), 0.4);
  BLOB(pillR, C.coral, { dx: 8, dy: 7, a: 0.85, sp: 12 }, at('L18', 0.58), 0.22);
  // a bell
  const bcx = px + 62, bcy = py + ph / 2, bs = v ? 1.15 : 1;
  const bell = [[bcx - 24 * bs, bcy + 18 * bs], ...bez([bcx - 24 * bs, bcy + 18 * bs], [bcx - 22 * bs, bcy - 28 * bs], [bcx - 6 * bs, bcy - 30 * bs], [bcx, bcy - 30 * bs], 8).slice(1), ...bez([bcx, bcy - 30 * bs], [bcx + 6 * bs, bcy - 30 * bs], [bcx + 22 * bs, bcy - 28 * bs], [bcx + 24 * bs, bcy + 18 * bs], 8).slice(1)];
  PEN(bell.concat([bell[0]]), { w: 2.6 }, at('L18', 0.62), 0.15);
  PEN(ell(bcx, bcy + 26 * bs, 6, 6, 0, 0, TAU, 10), { w: 2.4 }, at('L18', 0.66), 0.05);
  BLOB(bell, C.mustard, { dx: 3, dy: 3, a: 0.9, sp: 5 }, at('L18', 0.68), 0.05);
  HTXT(FT, px + 106, py + ph * 0.68, FS, {}, at('L18', 0.66), 0.6);
  const nx = v ? 2960 : 3040, ny = v ? 1010 : 935;
  const ne = HTXT('अगला एपिसोड:', nx, ny, v ? 42 : 38, { w: 400, align: v ? 'center' : 'left' }, at('L18', 0.05), 0.35);
  HTXT('4,500 साल पुरानी करी', v ? nx : nx, ny + (v ? 64 : 58), v ? 56 : 48, { align: v ? 'center' : 'left' }, at('L18', 0.18), 0.5);
  if (!v) arrow([[3045, ny + 88], [3220, ny + 94], [3400, ny + 86]], { w: 4 }, at('L18', 0.4), 0.3);
  ENDT = at('L18', 0.95);
  CUE.done = ENDT;

  // ===== camera: {t, x, y, s: world width seen in 16:9, sv: in 9:16, r°, k} =====
  // k: d drift · g gesture · p punch · f follow
  const K = (t, x, y, s, r, k, sv, xv, yv) => ({ t, x, y, s, r, k, sv: sv ?? s * 0.66, xv: xv ?? x, yv: yv ?? y });
  CAM = [
    K(0.00, 640, 175, 1180, -2.0, 'd', 1220, 700, 260),
    K(at('L1', 0.9), 660, 185, 1150, -1.6, 'd', 1200, 700, 260),
    K(at('L2', 0.3), 560, 320, 1150, -0.8, 'g', 1100, 500, 300),
    K(at('L3', 0.95), 580, 330, 1120, -0.6, 'd', 1080, 520, 320),
    K(at('L4', 0.1), 1930, 345, 1050, 1.6, 'g', 760, 1980, 360),
    K(at('L4', 0.98), 1945, 355, 1030, 1.2, 'd', 760, 1990, 380),
    K(at('L5', 0.08), 440, 880, 960, -1.4, 'g', 760, 440, 880),
    K(at('L6', 0.15), 450, 900, 950, -1.2, 'd', 740, 440, 900),
    K(at('L6', 0.45), 460, 1000, 820, -0.6, 'g', 640, 450, 1010),
    K(at('L7', 0.02), 470, 1010, 800, -0.5, 'd', 640, 450, 1010),
    K(at('L7', 0.12), 1110, 890, 820, 1.4, 'g', 620, 1110, 900),
    K(at('L8', -0.05), 1120, 895, 810, 1.2, 'd', 620, 1110, 900),
    K(at('L8', 0.08), 420, 1380, 860, -1.0, 'g', 640, 410, 1370),
    K(at('L9', -0.1), 430, 1380, 850, -0.8, 'd', 640, 420, 1370),
    K(at('L9', 0.15), 990, 1385, 860, -0.4, 'g', 640, 990, 1380),
    K(at('L10', -0.06), 1000, 1385, 850, -0.3, 'd', 640, 995, 1380),
    K(at('L10', 0.12), 1650, 1385, 880, 0.8, 'g', 640, 1650, 1380),
    K(at('L11', 0.12), 1660, 1390, 860, 0.8, 'd', 640, 1655, 1395),
    K(at('L11', 0.2), 1655, 1395, 700, 0.8, 'p', 560, 1655, 1395),
    K(at('L11', 0.42), 1850, 1420, 1020, 0.4, 'g', 720, 1820, 1430),
    K(at('L12', -0.05), 1860, 1420, 1000, 0.4, 'd', 720, 1830, 1430),
    K(at('L12', 0.1), 1880, 930, 980, -1.2, 'g', 720, 1640, 1000),
    K(at('L12', 0.75), 1900, 930, 960, -1.0, 'd', 720, 1660, 990),
    K(at('L13', 0.12), 2110, 880, 820, -0.6, 'g', 640, 2100, 890),
    K(at('L13', 0.98), 2120, 885, 800, -0.5, 'd', 640, 2110, 890),
    K(at('L14', 0.2), 520, 420, 1150, -1.0, 'g', 1000, 480, 430),
    K(at('L15', -0.02), 525, 425, 1140, -1.0, 'd', 990, 480, 430),
    K(at('L15', 0.04), 520, 440, 1000, -1.0, 'p', 900, 480, 440),
    K(at('L15', 0.36), 1230, 1690, 2350, 0.0, 'g', 1000, 520, 1700),
    K(at('L15', 0.75), 1230, 1700, 2330, 0.0, 'd', 1000, 820, 1720),
    K(at('L15', 0.98), 1230, 1700, 2320, 0.0, 'd', 1150, 1250, 1700),
    K(at('L16', 0.1), 1200, 900, 2560, 0.0, 'g', 2500, 1200, 900),
    K(at('L16', 0.98), 1200, 900, 2520, 0.0, 'd', 2450, 1200, 900),
    K(at('L17', 0.08), 3010, 690, 1220, 1.2, 'g', 780, 2960, 650),
    K(DURF, 3010, 695, 1200, 0.6, 'd', 770, 2960, 655)];
  CAM.forEach((b, i) => { if (i && (b.k === 'g' || b.k === 'p') && b.t > CAM[i - 1].t) SFX.push({ t: CAM[i - 1].t, type: b.k === 'p' ? 'punch' : 'gesture', d: b.t - CAM[i - 1].t, pan: 0 }); });
  SFX.push({ t: at('L6', 0.5), type: 'fire', d: at('L7', 0.1) - at('L6', 0.5), pan: -0.2 }, { t: at('L10', 0.5), type: 'fire', d: at('L12', 0.0) - at('L10', 0.5), pan: 0.1 },
    { t: LOGOT, type: 'paste', d: 0.3, pan: 0 }, { t: CUE.turn, type: 'strike', d: 0.3, pan: -0.3 });
}

// ---------- camera ----------
const gease = u => 0.45 * eio(u) + 0.55 * eo(u);
function cam(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1], span = b.t - a.t;
  let u0 = span > 1e-6 ? clamp((t - a.t) / span) : 1;
  if (b.k === 'g' || b.k === 'p') u0 = clamp((t - a.t) / Math.min(span, b.k === 'p' ? 0.18 : 0.9));   // a gesture settles in ~0.9 s
  const u = b.k === 'g' ? gease(u0) : b.k === 'p' ? eo(u0) : eio(u0);
  const v = F === 'v', ax = v ? a.xv : a.x, ay = v ? a.yv : a.y, bx = v ? b.xv : b.x, by = v ? b.yv : b.y;
  const za = v ? W / a.sv : W / a.s, zb = v ? W / b.sv : W / b.s;
  return { x: lerp(ax, bx, u), y: lerp(ay, by, u), z: Math.exp(lerp(Math.log(za), Math.log(zb), u)), r: lerp(a.r, b.r, u) * Math.PI / 180 };
}
function toScreen(c, x, y) { const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z, cs = Math.cos(c.r), sn = Math.sin(c.r); return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs]; }
function toWorld(c, X, Y) { const dx = X - W / 2, dy = Y - H / 2, cs = Math.cos(-c.r), sn = Math.sin(-c.r); return [c.x + (dx * cs - dy * sn) / c.z, c.y + (dx * sn + dy * cs) / c.z]; }

// ---------- stylus ----------
let NIBS = [];
const OFF = [W + 160, H + 260];
function stylusAt(t) {
  const c = cam(t); let act = null;
  for (const e of NIBS) if (t >= e.t0 && t < e.t0 + e.d) act = e;
  if (act) { const p = act.nib((t - act.t0) / act.d); return { P: toScreen(c, p[0], p[1]), lift: 0 }; }
  let prev = null, next = null;
  for (const e of NIBS) { if (e.t0 + e.d <= t && (!prev || e.t0 + e.d >= prev.t0 + prev.d)) prev = e; if (e.t0 > t && (!next || e.t0 < next.t0)) next = e; }
  const ta = prev ? prev.t0 + prev.d : -9, tb = next ? next.t0 : 1e9, gap = tb - ta;
  const pa = prev ? toScreen(c, ...prev.nib(1)) : OFF, pb = next ? toScreen(c, ...next.nib(0)) : OFF;
  if (gap > 1.1 || !prev || !next) {
    if (prev && t - ta < 0.45) { const u = eio((t - ta) / 0.45); return { P: [lerp(pa[0], OFF[0], u), lerp(pa[1], OFF[1], u)], lift: Math.min(1, u * 2) }; }
    if (next && tb - t < 0.45) { const u = eio(1 - (tb - t) / 0.45); return { P: [lerp(OFF[0], pb[0], u), lerp(OFF[1], pb[1], u)], lift: Math.min(1, (1 - u) * 2) }; }
    return null;
  }
  const u = (t - ta) / gap;
  return { P: [lerp(pa[0], pb[0], eio(u)), lerp(pa[1], pb[1], eio(u))], lift: Math.sin(Math.PI * u) * clamp(gap / 0.3, 0.25, 1) };
}
function drawStylus(t) {
  const n = stylusAt(t); if (!n) return;
  const [X, Y] = n.P, n2 = stylusAt(t + 1 / 48), lean = n2 ? clamp((n2.P[0] - X) * 0.004, -0.06, 0.06) : 0;
  const ang = 0.98 + lean, d = [Math.cos(ang), Math.sin(ang)], nn = [-d[1], d[0]], h0 = 4 + n.lift * 26;
  const P = (s, o) => [X + d[0] * s + nn[0] * o, Y + d[1] * s + nn[1] * o];
  const body = (k = 0) => { const L = 600, rw = 12.5, sh = s => [k * (h0 + s * 0.05) * 0.9, k * (h0 + s * 0.05) * 0.35];
    return [[0, 0], [12, -2.6], [46, -rw], [L, -rw], [L + 8, -rw * 0.6], [L + 8, rw * 0.6], [L, rw], [46, rw], [12, 2.6]].map(([s, o]) => { const q = P(s, o), e = sh(s); return [q[0] + e[0], q[1] + e[1]]; }); };
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(120,98,76,0.16)'; ctx.beginPath(); polyPath(ctx, body(1)); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fbf8f2'; ctx.beginPath(); polyPath(ctx, body(0)); ctx.fill();
  ctx.fillStyle = '#ebe5da'; ctx.beginPath(); polyPath(ctx, [P(46, 4), P(600, 4), P(600, 12.5), P(46, 12.5)]); ctx.fill();
  ctx.fillStyle = '#ddd6cb'; ctx.beginPath(); polyPath(ctx, [P(12, -2.6), P(46, -12.5), P(46, 12.5), P(12, 2.6)]); ctx.fill();
  ctx.fillStyle = '#4a3f37'; ctx.beginPath(); polyPath(ctx, [P(0, 0), P(12, -2.6), P(12, 2.6)]); ctx.fill();
  ctx.strokeStyle = '#c9bdab'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.beginPath(); polyPath(ctx, body(0)); ctx.stroke();
  ctx.restore();
}

// ---------- subtitles: a paper chip (light strip over an offset darker block), Hindi, bottom left ----------
const SUBF = F === 'h' ? 40 : 44, SUBW = F === 'h' ? 1180 : 940;
function wrapLines(c, s, maxw) { const w = s.split(' '), out = []; let cur = ''; for (const x of w) { const tr = cur ? cur + ' ' + x : x; if (c.measureText(tr).width > maxw && cur) { out.push(cur); cur = x; } else cur = tr; } if (cur) out.push(cur); return out; }
function drawSubs(t) {
  const q = VO.cues.find(c => t >= c.t0 && t < c.t1); if (!q) return;
  const fin = clamp((t - q.t0) / 0.2), fout = clamp((q.t1 - t) / 0.18);
  ctx.save(); ctx.font = `500 ${SUBF}px Poppins`;
  const lines = wrapLines(ctx, q.text, SUBW), lh = SUBF * 1.45, tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = tw + 64, h = lines.length * lh + 34, x = F === 'h' ? 80 : (W - w) / 2, y = F === 'h' ? H - 48 - h : H - 330 - h;
  ctx.globalAlpha = fout; ctx.beginPath(); ctx.rect(x - 20, y - 20, (w + 40) * eo(fin), h + 40); ctx.clip();
  ctx.fillStyle = '#e4d6bd'; ctx.globalAlpha = fout * 0.8; ctx.beginPath(); ctx.roundRect(x + 9, y + 8, w, h, 12); ctx.fill();
  ctx.fillStyle = '#fbf7ee'; ctx.globalAlpha = fout * 0.96; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  ctx.globalAlpha = fout * clamp((t - q.t0 - 0.08) / 0.18); ctx.fillStyle = '#43362e'; ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, x + 32, y + 17 + SUBF * 1.08 + i * lh));
  ctx.restore();
}

// ---------- Kathaverse: the corner logo (from 1.8 s until the end card) and the pasted logo on the end card ----------
function drawBug(t) {
  const t0 = 1.8; if (t < t0 || t >= LOGOT - 0.4) return;
  const out = clamp((LOGOT - 0.4 - t) / 0.3), p = clamp((t - t0) / 0.3), sq = 1 + 0.18 * (1 - eo(clamp((t - t0) / 0.2)));
  const r = F === 'h' ? 58 : 66, x = W - (F === 'h' ? 92 : 104), y = F === 'h' ? 90 : 230;
  ctx.save(); ctx.globalAlpha = Math.min(p, out); ctx.translate(x, y); ctx.scale(sq, sq);
  ctx.fillStyle = 'rgba(80,60,40,0.22)'; ctx.beginPath(); ctx.arc(5, 6, r + 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.drawImage(LOGO, -r * 1.04, -r * 1.04, r * 2.08, r * 2.08); ctx.restore();
}
function drawLogoOnPage(t, c) {
  if (!LOGOBOX || t < LOGOT) return;
  const [lx, ly, ls] = LOGOBOX, u = eo(clamp((t - LOGOT) / 0.3)), k = 1.06 - 0.06 * u;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, W / 2, H / 2); ctx.rotate(c.r); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
  ctx.translate(lx + ls / 2, ly + ls / 2); ctx.rotate(-0.025); ctx.scale(k, k); ctx.globalAlpha = u;
  ctx.fillStyle = 'rgba(90,70,50,0.22)'; ctx.fillRect(-ls / 2 + 10, -ls / 2 + 12, ls, ls);
  ctx.drawImage(LOGO, -ls / 2, -ls / 2, ls, ls);
  ctx.rotate(0.025); ctx.translate(-(lx + ls / 2), -(ly + ls / 2));
  TAPE.forEach(([x, y, a], i) => { if (t < LOGOT + 0.15 + i * 0.08) return; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(241,192,79,0.62)'; ctx.fillRect(-60, -16, 120, 32); ctx.restore(); });
  ctx.restore();
}

// ---------- composite: paper × colour × pencil layers with the grain threshold ----------
const IMGS = {};
function composite(c) {
  const cs = [[0, 0], [W, 0], [0, H], [W, H]].map(([X, Y]) => toWorld(c, X, Y));
  const [a, b, cc, d] = bbox(cs);
  const x0 = Math.max(0, Math.floor(PX(a)) - 2), y0 = Math.max(0, Math.floor(PY(b)) - 2), x1 = Math.min(BW, Math.ceil(PX(cc)) + 2), y1 = Math.min(BH, Math.ceil(PY(d)) + 2);
  const w = x1 - x0, h = y1 - y0, key = w + 'x' + h;
  const img = IMGS[key] || (IMGS[key] = new ImageData(w, h)), o = img.data;
  const fd = TG.fx.getImageData(x0, y0, w, h).data, pp = hex(C.paper), Ls = ORDER.map(n => [TG.L[n], LAYERS[n].col, LAYERS[n].alpha]);
  for (let y = 0; y < h; y++) {
    const row = (y + y0) * BW + x0;
    for (let x = 0; x < w; x++) {
      const i = row + x, j = (y * w + x) * 4, g = GRAIN[i], g2 = GRAIN2[i];
      const pk = (0.985 + 0.03 * g2) * (0.99 + 0.02 * g);
      let r = pp[0] * pk, gg = pp[1] * pk, bb = pp[2] * (0.985 + 0.03 * g2) * (0.985 + 0.025 * g);
      const fa = fd[j + 3] / 255;
      if (fa) { const al = fa * (0.86 + 0.14 * (1 - g * 0.8)); r *= 1 - al + al * fd[j] / 255; gg *= 1 - al + al * fd[j + 1] / 255; bb *= 1 - al + al * fd[j + 2] / 255; }
      for (let q = 0; q < 3; q++) { const v = Ls[q][0][i]; if (!v) continue;
        const al = clamp((v * 0.9 - g * 0.85 + 0.32) * 2.1) * Ls[q][2]; if (al <= 0) continue; const col = Ls[q][1];
        r *= 1 - al + al * col[0]; gg *= 1 - al + al * col[1]; bb *= 1 - al + al * col[2]; }
      o[j] = r * 255; o[j + 1] = gg * 255; o[j + 2] = bb * 255; o[j + 3] = 255;
    }
  }
  wx.putImageData(img, x0, y0);
  return [x0, y0, w, h];
}
function clearTarget(T) { for (const n of ORDER) T.L[n].fill(0); T.fx.clearRect(0, 0, BW, BH); }
function renderMarks(t) {
  let k = 0; while (k < EL.length && t >= EL[k].t0 + EL[k].d) k++;
  if (cacheK > k) { clearTarget(CACHE); cacheK = 0; }
  if (cacheK < k) { TG = CACHE; for (let i = cacheK; i < k; i++) EL[i].apply(1); cacheK = k; }
  let partial = false; for (let i = k; i < EL.length; i++) if (t >= EL[i].t0) { partial = true; break; }
  if (!partial) { TG = CACHE; return; }
  for (const n of ORDER) WORK.L[n].set(CACHE.L[n]);
  WORK.fx.clearRect(0, 0, BW, BH); WORK.fx.drawImage(CACHE.fc, 0, 0);
  TG = WORK;
  for (let i = k; i < EL.length; i++) { const e = EL[i]; if (t >= e.t0) e.apply(clamp((t - e.t0) / e.d)); }
}
function drawPage(t, c) {
  renderMarks(t);
  const [x0, y0, w, h] = composite(c);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, W / 2, H / 2); ctx.rotate(c.r); ctx.scale(c.z / S, c.z / S); ctx.translate(-(c.x - X0) * S, -(c.y - Y0) * S);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(WC, x0, y0, w, h, x0, y0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawLogoOnPage(t, c);
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.62);
  g.addColorStop(0, 'rgba(120,100,80,0)'); g.addColorStop(1, 'rgba(120,100,80,0.10)');
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
}
function renderFull(t) {
  const c = cam(t); drawPage(t, c);
  if (CLEAN) return;
  drawStylus(t); drawBug(t); if (!(F === 'v' && t >= LOGOT + 0.2)) drawSubs(t);
}

// ---------- the thumbnail card (1.5 s after the intro, and the cover image) ----------
function renderThumb() {
  const v = F === 'v';
  const c = v ? { x: 1655, y: 1262, z: W / 520, r: -0.02 } : { x: 1439, y: 1372, z: W / 900, r: -0.015 };
  drawPage(DURF - 0.01, c);
  { const [bx, by] = toScreen(c, 1655, 1430), rr = 132 * c.z * 1.35;   // a soft wash over the page, except around the bread on the fire
    ctx.save(); ctx.translate(bx, by - 20 * c.z); ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, rr * 0.82, 0, 0, rr * 1.12); g.addColorStop(0, 'rgba(243,234,219,0)'); g.addColorStop(1, 'rgba(243,234,219,1)');
    ctx.fillStyle = g; ctx.fillRect(-4000, -8000, 8000, 16000); ctx.restore(); }
  const ink = '#43362e';
  const txt = (s, x, y, size, col, al = 'left', wt = 700) => { ctx.font = `${wt} ${size}px ${KB}`; ctx.textAlign = al; ctx.fillStyle = col; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
  const block = (x, y, w, h, col, a = 0.85) => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 10, y + 8); ctx.lineTo(x + w + 14, y + 4); ctx.lineTo(x + w + 18, y + h + 10); ctx.lineTo(x + 6, y + h + 14); ctx.closePath(); ctx.fill(); ctx.restore(); };
  ctx.save();
  if (!v) {   // left: the words; right: the bread on the fire (the page itself)
    const gr = ctx.createLinearGradient(0, 0, W * 0.62, 0); gr.addColorStop(0, 'rgba(243,234,219,1)'); gr.addColorStop(0.8, 'rgba(243,234,219,0.98)'); gr.addColorStop(1, 'rgba(243,234,219,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W * 0.62, H);
    txt('दुनिया की', 90, 230, 120, ink);
    ctx.font = `700 230px ${KB}`; const w1 = ctx.measureText('पहली रोटी').width; block(80, 300, w1 + 10, 190, '#f1c04f');
    txt('पहली रोटी', 90, 470, 230, ink);
    ctx.font = `700 92px ${KB}`; const w2 = ctx.measureText('14,400 साल पुरानी!').width;
    ctx.fillStyle = '#dc6a4c'; ctx.beginPath(); ctx.roundRect(80, 580, w2 + 70, 130, 22); ctx.fill();
    txt('14,400 साल पुरानी!', 115, 675, 92, '#fbf7ee');
    ctx.strokeStyle = '#dc6a4c'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(95, 512); ctx.quadraticCurveTo(400, 500, 90 + w1, 515); ctx.stroke();
    ctx.font = `600 40px Poppins`; const cw = ctx.measureText('प्राचीन रसोई · 1/12').width;
    ctx.fillStyle = '#e4d6bd'; ctx.beginPath(); ctx.roundRect(92, 912, cw + 48, 70, 35); ctx.fill(); ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.roundRect(84, 904, cw + 48, 70, 35); ctx.fill();
    ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText('प्राचीन रसोई · 1/12', 108, 952);
  } else {
    const gr = ctx.createLinearGradient(0, 0, 0, H * 0.55); gr.addColorStop(0, 'rgba(243,234,219,1)'); gr.addColorStop(0.85, 'rgba(243,234,219,0.98)'); gr.addColorStop(1, 'rgba(243,234,219,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H * 0.55);
    const gb = ctx.createLinearGradient(0, H * 0.82, 0, H); gb.addColorStop(0, 'rgba(243,234,219,0)'); gb.addColorStop(0.4, 'rgba(243,234,219,0.97)'); ctx.fillStyle = gb; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    txt('दुनिया की', W / 2, 330, 120, ink, 'center');
    ctx.font = `700 200px ${KB}`; const w1 = ctx.measureText('पहली रोटी').width; block(W / 2 - w1 / 2 - 10, 400, w1 + 10, 170, '#f1c04f');
    txt('पहली रोटी', W / 2, 560, 200, ink, 'center');
    ctx.font = `700 84px ${KB}`; const w2 = ctx.measureText('14,400 साल पुरानी!').width;
    ctx.fillStyle = '#dc6a4c'; ctx.beginPath(); ctx.roundRect(W / 2 - w2 / 2 - 36, 650, w2 + 72, 122, 22); ctx.fill();
    txt('14,400 साल पुरानी!', W / 2, 738, 84, '#fbf7ee', 'center');
    ctx.font = `600 40px Poppins`; const cw = ctx.measureText('प्राचीन रसोई · 1/12').width;
    ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.roundRect(W / 2 - cw / 2 - 24, H - 260, cw + 48, 70, 35); ctx.fill();
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText('प्राचीन रसोई · 1/12', W / 2, H - 212);
  }
  ctx.restore();
  const r = v ? 80 : 84, x = v ? W - 120 : W - 120, y = v ? 140 : 120;
  ctx.save(); ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.arc(x, y, r + 7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.drawImage(LOGO, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08); ctx.restore();
}

// ---------- contract ----------
async function boot() {
  VO = await (await fetch('voice/cues.json')).json(); DURF = VO.film;
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode();
  await Promise.all([document.fonts.load(`700 40px ${KB}`, 'रोटी Ag'), document.fonts.load(`400 40px ${KB}`, 'रोटी Ag'), document.fonts.load('500 40px Poppins', 'रोटी Ag'), document.fonts.load('600 40px Poppins', 'रोटी Ag')]);
  buildGrain();
  CACHE = mkTarget(); WORK = mkTarget(); TG = CACHE;
  buildPage();
  EL.sort((a, b) => a.t0 - b.t0);
  NIBS = EL.filter(e => e.nib);
  const A = +(QS.get('a') ?? 0), B = +(QS.get('b') ?? DURF);
  if (THUMB) { window.DUR = 1 / FPS; window.render = () => renderThumb(); window.EV = []; window.TEXTS = () => []; window.READY = true; return; }
  const ev = [];
  for (const e of EL) { if (e.kind === 'occ' || e.kind === 'none') continue; const tm = e.t0 + e.d / 2, c = cam(tm), p = e.nib ? e.nib(0.5) : e.wx;
    ev.push({ t: e.t0, type: e.kind, d: e.d, pan: clamp(toScreen(c, p[0], p[1])[0] / W * 2 - 1, -1, 1) }); }
  NIBS.forEach((e, i) => { const prev = NIBS.slice(0, i).reduce((m, q) => Math.max(m, q.t0 + q.d), -1); if (e.t0 - prev > 0.1) { const c = cam(e.t0), p = e.nib(0); ev.push({ t: e.t0, type: 'tap', d: 0, pan: clamp(toScreen(c, p[0], p[1])[0] / W * 2 - 1, -1, 1) }); } });
  ev.push(...SFX, { t: CUE.done, type: 'done', d: 0, pan: 0 });
  for (const [id, st] of Object.entries(VO.start)) ev.push({ t: st, type: 'vo', id, d: VO.dur[id], pan: 0 });
  window.DUR = +(B - A).toFixed(3);
  window.EV = ev.filter(e => e.t >= A && e.t < B).map(e => ({ ...e, t: +(e.t - A).toFixed(4), d: +e.d.toFixed(4), pan: +e.pan.toFixed(3) }));
  window.render = t => renderFull(t + A);
  window.TEXTS = t => { t += A; const c = cam(t), out = [];
    EL.forEach((e, i) => { if (e.kind !== 'write' || t < e.t0) return; const [a, b, cc, d] = e.T.box;
      const cs = [[a, b], [cc, b], [a, d], [cc, d]].map(([x, y]) => toScreen(c, x, y)), bb = bbox(cs);
      out.push({ id: 'txt' + i, text: e.T.s, x0: bb[0], y0: bb[1], x1: bb[2], y1: bb[3] }); });
    return out; };
  window.CUE = CUE; window.READY = true;
}
boot();
