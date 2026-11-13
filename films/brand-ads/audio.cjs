// node audio.cjs <biscuit|lipstick|saree|jewellery> → audio-<film>.wav (14 s). Everything is synthesized; no samples, no licensed music.
const fs = require('fs'), path = require('path');
const film = process.argv[2] || 'biscuit';
const SR = 44100, DUR = 14, N = SR * DUR;
const ML = new Float32Array(N), MR = new Float32Array(N), FL = new Float32Array(N), FR = new Float32Array(N);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lerp = (a, b, t) => a + (b - a) * t, mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const add = (bus, i, v, pan = 0) => { if (i < 0 || i >= N) return; const [L, R] = bus; L[i] += v * (1 - pan) * .7; R[i] += v * (1 + pan) * .7; };
const M = [ML, MR], F = [FL, FR];

// ---- instruments ----
function partials(bus, t0, f, dur, amp, parts, pan = 0, att = .004) {   // parts: [ratio, gain, decay]
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  for (let k = 0; k < n; k++) { const t = k / SR; let v = 0; for (const [r, g, d] of parts) v += g * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t * d); add(bus, s0 + k, amp * v * Math.min(1, t / att), pan); }
}
const marimba = (t, m, a, p) => partials(M, t, mtof(m), .6, a, [[1, 1, 9], [4, .3, 30], [10, .05, 60]], p);
const bell = (t, m, a, p) => partials(M, t, mtof(m), 2.5, a, [[1, 1, 1.6], [2.76, .5, 3], [5.4, .25, 6], [8.9, .1, 10]], p);
const keys = (t, m, d, a, p) => partials(M, t, mtof(m), d + 1, a, [[1, 1, 1.2], [2, .35, 3], [3, .12, 6]], p);
function pad(t0, notes, dur, amp) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  for (const m of notes) for (const det of [-.004, .004]) {
    const f = mtof(m) * (1 + det); let y = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR, env = Math.min(1, t / .6) * Math.min(1, (dur - t) / .6);
      let s = 0; for (let h = 1; h <= 6; h++) s += Math.sin(2 * Math.PI * f * h * t) / h;
      y += .08 * (s - y); add(M, s0 + k, amp * env * y, det * 80);
    }
  }
}
function ks(t0, f, dur, amp, pan = 0, bright = .5, bend = 0) {     // Karplus–Strong pluck (sitar / tanpura-ish)
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let P = Math.round(SR / f); const buf = new Float32Array(P + 400);
  for (let i = 0; i < P; i++) buf[i] = rnd() * 2 - 1;
  let idx = 0;
  for (let k = 0; k < n; k++) {
    const p = Math.max(2, Math.round(SR / (f * (1 + bend * Math.min(1, k / (SR * .25)))))); const a = buf[idx % p], b = buf[(idx + 1) % p];
    const v = a * (1 - bright) + (a + b) * .5 * bright; buf[idx % p] = v * .996; idx++;
    add(M, s0 + k, amp * v * (1 + .3 * Math.sin(k / SR * 2 * Math.PI * 3)), pan);
  }
}
function kick(t0, a = .8) { const s0 = Math.floor(t0 * SR); let ph = 0; for (let k = 0; k < .35 * SR; k++) { const t = k / SR; ph += 2 * Math.PI * (45 + 110 * Math.exp(-t * 30)) / SR; add(M, s0 + k, a * Math.sin(ph) * Math.exp(-t * 9)); } }
function noise(bus, t0, dur, amp, decay, lp = .5, pan = 0) { const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let y = 0; for (let k = 0; k < n; k++) { y += lp * ((rnd() * 2 - 1) - y); add(bus, s0 + k, amp * y * Math.exp(-k / SR * decay), pan); } }
function tone(bus, t0, f0, f1, dur, amp, decay, pan = 0) { const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let ph = 0; for (let k = 0; k < n; k++) { ph += 2 * Math.PI * lerp(f0, f1, k / n) / SR; add(bus, s0 + k, amp * Math.sin(ph) * Math.exp(-k / SR * decay) * Math.min(1, k / 60), pan); } }
function whoosh(t0, dur, amp, fA = 300, fB = 3000) {               // band-passed noise sweep
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let k = 0; k < n; k++) {
    const p = k / n, f = fA * Math.pow(fB / fA, p), w = 2 * Math.PI * f / SR, al = Math.sin(w) / 3, a0 = 1 + al, x = rnd() * 2 - 1;
    const y = (al * x - al * x2 + 2 * Math.cos(w) * y1 - (1 - al) * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y;
    add(F, s0 + k, amp * y * Math.sin(Math.PI * p), Math.sin(p * Math.PI * 2) * .5);
  }
}
function shimmer(t0, dur, amp, base = 2000) { for (let t = t0; t < t0 + dur; t += .03 + rnd() * .05) tone(F, t, base + rnd() * base * 2, base * 2 + rnd() * base, .25, amp * (.4 + rnd() * .6), 14, rnd() * 1.6 - .8); }
function impact(t0, a = 1) { kick(t0, .9 * a); noise(F, t0, 1.2, .25 * a, 4, .08); tone(F, t0, 70, 40, 1.4, .5 * a, 2.5); shimmer(t0 + .05, 1.2, .05 * a); }

// ---- the four soundtracks ----
const P = {
  biscuit() {
    const B = 60 / 112, prog = [[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]];
    for (let b = 0; b * 4 * B < DUR; b++) {
      const ch = prog[b % 4], t = b * 4 * B;
      for (let q = 0; q < 4; q++) { marimba(t + q * B, ch[0], .22, 0); kick(t + q * B, q % 2 ? .25 : .4); }
      for (let e = 0; e < 8; e++) marimba(t + e * B / 2 + (e % 2 ? .02 : 0), ch[1 + (e * 2) % 3] + (e > 4 ? 12 : 0), .12, (e % 3 - 1) * .4);
    }
    whoosh(.1, 1.6, .25, 200, 1500);
    [3.9, 4.4, 4.9, 5.4, 5.9].forEach((t, i) => { tone(F, t, 260 - i * 10, 160, .12, .5, 40); noise(F, t, .12, .35, 50, .7); whoosh(t - .6, .6, .12, 800, 3000); });
    whoosh(7.4, .9, .2, 300, 2500);
    tone(F, 8.5, 500, 150, .25, .5, 12); noise(F, 8.5, .6, .4, 7, .35); for (let i = 0; i < 10; i++) tone(F, 8.55 + rnd() * .5, 900 + rnd() * 900, 300, .06, .15, 40, rnd() - .5);
    [8.0, 9.0, 9.8].forEach(t => marimba(t, 84, .25, 0));
    impact(10.8, .9); [72, 76, 79, 84].forEach((m, i) => bell(10.9 + i * .12, m, .1, (i - 1.5) * .3));
  },
  lipstick() {
    const B = 60 / 92, prog = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]];
    for (let b = 0; b * 4 * B < DUR; b++) {
      const ch = prog[b % 4], t = b * 4 * B;
      pad(t, ch.slice(1), 4 * B + .3, .05);
      partials(M, t, mtof(ch[0] - 12), 4 * B, .35, [[1, 1, .8], [2, .3, 2]]);
      for (let q = 0; q < 4; q++) { if (t > 1.5) kick(t + q * B, q % 2 ? 0 : .6); if (q % 2) noise(M, t + q * B, .2, .3, 25, .8); for (let e = 0; e < 2; e++) noise(M, t + q * B + e * B / 2, .04, .08, 120, .95, .3); }
    }
    whoosh(.2, 1.4, .2, 200, 1800);
    tone(F, 3.6, 600, 300, .08, .6, 50); noise(F, 3.6, .08, .5, 60, .9);                         // cap pop
    for (let t = 4.5; t < 6; t += .09) { noise(F, t, .02, .25, 200, .95); tone(F, t, 2400, 2000, .02, .1, 150); }   // twist clicks
    shimmer(5.8, 1, .06, 3000);
    whoosh(7.25, 2, .22, 150, 900);
    impact(10.7); [69, 72, 76, 81].forEach((m, i) => bell(10.8 + i * .1, m, .09, (i - 1.5) * .3));
  },
  saree() {
    const SA = 50, B = 60 / 80;                                             // D
    for (let t = 0, i = 0; t < DUR; t += B, i++) ks(t, mtof([SA - 5, SA, SA, SA - 12][i % 4]), 3, .22, (i % 4 - 1.5) * .2, .3);
    const raag = [62, 64, 66, 68, 69, 71, 73, 74], phrase = [4, 5, 6, 7, 6, 4, 3, 4, 2, 1, 0, 1, 2, 4, 5, 4];
    phrase.forEach((n, i) => ks(1.2 + i * B / 1.4 + (i % 3 === 2 ? .08 : 0), mtof(raag[n]), 1.2, .28, .25, .7, i % 4 === 3 ? .03 : 0));
    for (let t = 1.5; t < 13.5; t += B) { tone(M, t, 120, 80, .3, .35, 9); tone(M, t + B / 2, 650, 600, .1, .12, 30, .2); if ((t / B) % 4 > 2.5) tone(M, t + B * .75, 650, 620, .08, .1, 30, -.2); }
    whoosh(.1, 1.8, .3, 150, 1200); whoosh(4.1, 1.2, .18, 200, 2000);
    shimmer(8.4, 2.2, .04, 2500);
    impact(11.3, .8); [74, 78, 81, 86].forEach((m, i) => bell(11.4 + i * .14, m, .1, (i - 1.5) * .3));
  },
  jewellery() {
    const B = 60 / 76, prog = [[52, 64, 68, 71, 78], [49, 61, 64, 68, 75], [45, 57, 61, 64, 71], [47, 59, 63, 66, 73]];
    for (let b = 0; b * 4 * B < DUR; b++) {
      const ch = prog[b % 4], t = b * 4 * B;
      pad(t, ch.slice(0, 4), 4 * B + .4, .045);
      ch.slice(1).forEach((m, i) => bell(t + i * B * .5 + B, m + 12, .06, (i - 2) * .3));
    }
    whoosh(.2, 1.8, .2, 150, 1500); shimmer(.4, 1.6, .05);
    shimmer(3.6, 3.4, .06, 3000); whoosh(3.4, .8, .15, 400, 4000);
    whoosh(6.9, 1.3, .25, 150, 1200);
    for (let k = 0; k < 40; k++) { const t = 7.6 + rnd() * 2.2; tone(F, t, 3500 + rnd() * 3000, 3000, .05, .07 * Math.exp(-(t - 7.6) * 1.2), 60, rnd() - .5); }   // chain jingle
    impact(10.8, 1); [76, 80, 83, 88].forEach((m, i) => bell(10.9 + i * .12, m, .1, (i - 1.5) * .3));
  },
};
P[film]();

for (const B of M) { let y = 0; for (let i = 0; i < N; i++) { y += .35 * (B[i] - y); B[i] = y; } }
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) { const t = i / SR, g = Math.min(1, t / .8) * Math.min(1, (DUR - t) / 1.2); L[i] = (ML[i] * .8 + FL[i]) * g; R[i] = (MR[i] * .8 + FR[i]) * g; }
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] / peak * .89 * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] / peak * .89 * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, `audio-${film}.wav`), buf);
console.log(`audio-${film}.wav peak ${peak.toFixed(2)}`);
