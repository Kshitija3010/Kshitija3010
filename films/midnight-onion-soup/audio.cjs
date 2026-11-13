// node audio.cjs → audio.wav (26 s): soft lo-fi electric piano + foley timed to the shots in film.js. All synthesized, no samples.
const fs = require('fs'), path = require('path');
const SR = 44100, DUR = 26, N = SR * DUR;
const ML = new Float32Array(N), MR = new Float32Array(N), FL = new Float32Array(N), FR = new Float32Array(N);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const add = (L, R, i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan) * .7; R[i] += v * (1 + pan) * .7; } };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ---- music: Fmaj7 – Em7 – Dm7 – Cmaj7 at 70 bpm, rolled chords, sparse melody ----
function key(t0, m, dur, amp, pan = 0) {
  const f = mtof(m) * (1 + (rnd() - .5) * .002), s0 = Math.floor(t0 * SR), n = Math.floor((dur + 1.6) * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR, env = Math.min(1, t / .008) * Math.exp(-t * 1.4) * (t < dur ? 1 : Math.exp(-(t - dur) * 5));
    const v = env * (Math.sin(2 * Math.PI * f * t) + .3 * Math.sin(4 * Math.PI * f * t + .3) * Math.exp(-t * 3) + .1 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 6));
    add(ML, MR, s0 + k, amp * v * (1 + .12 * Math.sin(2 * Math.PI * 4.8 * t)), pan);
  }
}
const BEAT = 60 / 70, BAR = BEAT * 4;
const CHORDS = [[41, 57, 60, 64, 69], [40, 55, 59, 62, 67], [38, 53, 57, 60, 65], [36, 52, 55, 59, 64]];
const SCALE = [72, 74, 76, 79, 81, 84];
for (let b = 0, t = 0; t < DUR; b++, t += BAR) {
  const ch = CHORDS[b % 4];
  ch.forEach((m, i) => key(t + i * .035, m, BAR * .9, i ? .05 : .08, (i - 2) * .15));
  ch.slice(1).forEach((m, i) => key(t + BEAT * 2.5 + i * .03, m, BEAT, .025, (i - 1.5) * .2));
  for (let k = 0; k < 3; k++) if (rnd() < .7) key(t + BEAT * (k * 1.3 + .5 + rnd() * .3), SCALE[Math.floor(rnd() * SCALE.length)], BEAT * .8, .035, .3);
}
// lowpass the keys (one-pole) for the lo-fi feel
for (const B of [ML, MR]) { let y = 0; for (let i = 0; i < N; i++) { y += .18 * (B[i] - y); B[i] = y; } }
// vinyl crackle
for (let i = 0; i < N; i++) if (rnd() < .0004) { const a = (rnd() * .5 + .5) * .05; for (let k = 0; k < 40; k++) add(ML, MR, i + k, a * (rnd() - .5) * Math.exp(-k / 6), rnd() - .5); }

// ---- foley ----
function burst(t0, dur, amp, decay, lp = .3, pan = 0) {  // filtered noise burst
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let y = 0;
  for (let k = 0; k < n; k++) { y += lp * ((rnd() * 2 - 1) - y); add(FL, FR, s0 + k, amp * y * Math.exp(-k / SR * decay), pan); }
}
function tone(t0, f0, f1, dur, amp, decay, pan = 0) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let ph = 0;
  for (let k = 0; k < n; k++) { const p = k / n; ph += 2 * Math.PI * lerp(f0, f1, p) / SR; add(FL, FR, s0 + k, amp * Math.sin(ph) * Math.exp(-k / SR * decay) * Math.min(1, k / 40), pan); }
}
function lerp(a, b, t) { return a + (b - a) * t; }
function bandNoise(t0, t1, fA, fB, amp, envf, pan = 0) {    // resonant band-passed noise with a moving centre
  const s0 = Math.floor(t0 * SR), n = Math.floor((t1 - t0) * SR); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let k = 0; k < n; k++) {
    const p = k / n, f = lerp(fA, fB, p), Q = 3, w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * Q), a0 = 1 + al;
    const x = rnd() * 2 - 1, y = ((al) * x - al * x2 - (-2 * Math.cos(w)) * y1 - (1 - al) * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    add(FL, FR, s0 + k, amp * y * envf(p, k / SR), pan);
  }
}
// fridge hum 0–5 s and the door seal
for (let i = 0; i < 5 * SR; i++) { const t = i / SR, e = Math.min(1, t / .6) * (1 - Math.max(0, (t - 4) / 1)); add(FL, FR, i, .03 * e * (Math.sin(2 * Math.PI * 118 * t) + .5 * Math.sin(2 * Math.PI * 236 * t)), 0); }
tone(.45, 90, 60, .25, .35, 25); burst(.45, .12, .25, 40, .5);
// onion set on the board
tone(4.35, 240, 180, .15, .25, 40); burst(4.35, .05, .12, 80, .6);
// chops (shot 3 starts at 7.5)
[.7, 1.5, 2.3, 3.1, 3.8].forEach((c, i) => { const t = 7.5 + c; tone(t, 160, 110, .12, .45, 45, -.1); burst(t, .08, .35, 70, .7); burst(t + .005, .15, .12, 30, .25, .2); });
// pour (shot 4 starts at 11.5, pours 0.3–3.75)
bandNoise(11.8, 15.25, 500, 1300, .5, (p, t) => Math.min(1, p * 20) * Math.min(1, (1 - p) * 15) * (.7 + .3 * Math.sin(t * 2 * Math.PI * 7) * Math.sin(t * 13)), .15);
// simmer 15.5–20: bubble blips + soft sizzle
for (let t = 15.6; t < 19.9; t += .04 + rnd() * .1) tone(t, 300 + rnd() * 300, 700 + rnd() * 500, .03, .06 + rnd() * .05, 60, rnd() - .5);
{ let y = 0, py = 0; for (let i = Math.floor(15.5 * SR); i < Math.floor(20 * SR); i++) { const t = i / SR - 15.5, e = Math.min(1, t / .5) * Math.min(1, (4.5 - t) / .6); const x = rnd() * 2 - 1; y += .9 * (x - y); const hp = x - y; if (rnd() < .002) py = .3 * rnd(); py *= .995; add(FL, FR, i, e * (.025 * hp + py * (rnd() - .5)), 0); } }
// rain 19.5–26
{ let y = 0; for (let i = Math.floor(19.5 * SR); i < N; i++) { const t = i / SR - 19.5, e = Math.min(1, t / 1.2); y += .08 * ((rnd() * 2 - 1) - y); add(FL, FR, i, .22 * e * y, Math.sin(t) * .3); if (rnd() < .0006) tone(i / SR, 1800 + rnd() * 1500, 900, .02, .04, 120, rnd() - .5); } }

// ---- mix: music fades in, dips for a breath before the payoff, fades out ----
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  let g = Math.min(1, t / 2) * Math.min(1, (DUR - t) / 2.2);
  if (t > 19 && t < 19.9) g *= .25 + .75 * Math.abs((t - 19.45) / .45);
  const fg = t > 19.1 && t < 19.6 ? .3 : 1;
  L[i] = ML[i] * g * .9 + FL[i] * fg; R[i] = MR[i] * g * .9 + FR[i] * fg;
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] / peak * .89 * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] / peak * .89 * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, 'audio.wav'), buf);
console.log('audio.wav written, peak', peak.toFixed(3));
