"""compose.py · original track for "सितारों का शहर": 120 BPM, C minor (Bhairavi colour), 48 s.
Intro drone + riser · verse (kick, hats, sitar-like pluck hook) · build (snare roll, riser, 3-2-1) · drop (four-on-floor, claps,
dhol-style frame drums, sub bass, hook an octave up) · title impact · outro (half-time, hook, final hit). → out/mix.wav"""
import os, sys, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, whoosh, thump, limit, add
import sampler as S, pluck as P
S.seed(120); rng = np.random.default_rng(7)
B = .5; DUR = 48.0; N = int((DUR + 2) * SR); out = np.zeros((N, 2))
bt = lambda b: b * B
C3 = 48; SC = [0, 1, 3, 5, 7, 8, 10]; deg = lambda d, base=60: base + SC[d % 7] + 12 * (d // 7)
def kick(v=1.0):
    d = .35; x = t_(d); f = 45 + 110 * np.exp(-x / .04); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .14) + .3 * hp(noise(d), 3000) * np.exp(-x / .004)) * v
def clap(v=1.0):
    d = .25; x = t_(d); e = sum(np.exp(-np.maximum(x - o, 0) / .012) * (x >= o) for o in (0, .01, .022)) + .6 * np.exp(-x / .08); return norm(bp(noise(d), 900, 5000) * e) * v
def hat(v=1.0, open_=False):
    d = .25 if open_ else .05; x = t_(d); return norm(hp(noise(d), 7000) * np.exp(-x / (.08 if open_ else .015))) * v
def riser(d):
    x = t_(d); f = 300 + 5000 * (x / d) ** 2; return norm(bp(noise(d), 200, 9000) * (x / d) ** 2 * (.6 + .4 * np.sin(2 * np.pi * np.cumsum(f / 200) / SR)))
def sub(m, d):
    x = t_(d); f = 440 * 2 ** ((m - 69) / 12); y = np.sin(2 * np.pi * f * x) + .35 * np.sin(4 * np.pi * f * x) + .15 * np.sin(6 * np.pi * f * x)
    return y * np.minimum(1, x / .01) * np.exp(-x / (d * .8)) * .5
def drone(f, d):
    x = t_(d); y = sum(np.sin(2 * np.pi * f * k * x + k) / k ** .9 for k in range(1, 12)); return lp(y, 2500) * np.minimum(1, x / 1.5) * np.minimum(1, (d - x) / 1.0) * .06
# intro
add(out, drone(130.81 / 2, 12.5), 0, 1, -.1); add(out, drone(196 / 2, 12.5), 0, .7, .1)
add(out, riser(4.0), 0, .25, 0)
for i, b in enumerate([0, 2, 4, 5, 6]): add(out, S.note('hand_chimes', 84 + SC[(i * 2) % 7], 1.6, .5), bt(b), .35, -.3 + .15 * i)
# the hook (2 bars of eighths: step, degree, length in eighths)
HOOK = [(0, 0, 2), (2, 2, 1), (3, 3, 1), (4, 4, 2), (6, 3, 1), (7, 2, 1), (8, 4, 3), (11, 5, 1), (12, 4, 1), (13, 3, 1), (14, 2, 2)]
def hook(b0, base=60, vel=.75, g=1.0):
    for s, d_, l in HOOK: add(out, P.pluck('shamisen', deg(d_, base), l * B / 2 + .3, vel=vel), bt(b0) + s * B / 2, .9 * g, .15)
def drums(b0, b1, four=False, claps=False, dhol=False, g=1.0):
    for b in range(b0, b1):
        if four or b % 2 == 0: add(out, kick(), bt(b), .9 * g, 0)
        if claps and b % 2 == 1: add(out, clap(), bt(b), .5 * g, .05)
        add(out, hat(), bt(b) + B / 2, .22 * g, .3); add(out, hat(.6), bt(b), .12 * g, -.3)
        if dhol: add(out, S.hit('frame_drum', 'small' if b % 2 else 'large', .7), bt(b) + B * .75, .35 * g, -.15)
# verse 8–36
drums(8, 36, g=.8)
for b0 in (8, 16, 24): hook(b0, vel=.7)
for b in range(8, 36, 4): add(out, sub(C3 - 12 + (0, 0, 8, 7)[(b // 4) % 4], 1.8), bt(b), .9, 0)
add(out, S.hit('gong2', 'small', .6), bt(20), .3, 0); add(out, kick(1), bt(20), 1.0, 0)
# build 32–40
for i in range(16): add(out, clap(.4 + .04 * i), bt(32) + i * B / 4 if i < 8 else bt(34) + (i - 8) * B / 8, .25 + .02 * i, 0)
for i in range(16): add(out, clap(.7), bt(36) + i * B / 8 * (1.6 if i < 8 else 1), .35, 0)
add(out, riser(4.0), bt(32), .45, 0)
for b in (36, 37, 38): add(out, thump(1, 60), bt(b), .7, 0); add(out, S.hit('frame_drum', 'large', 1.0), bt(b), .5, 0)
# drop 40–64
add(out, thump(1.2, 45), bt(40), 1.0, 0); add(out, S.hit('gong2', 'big', .8), bt(40), .45, 0); add(out, whoosh(.5), bt(39) + .05, .4, 0)
drums(40, 64, four=True, claps=True, dhol=True, g=1.0)
for b0 in (40, 48, 56): hook(b0, base=72, vel=.8, g=.9); hook(b0, base=60, vel=.6, g=.5)
for b in range(40, 64): add(out, sub(C3 - 12 + (0, 0, 8, 7)[((b - 40) // 4) % 4], .42), bt(b) + B / 2, 1.1, 0)
for i in range(12): add(out, S.note('hand_chimes', 84 + SC[(i * 3) % 7], .9, .45), bt(40 + i * 2), .25, -.4 + .07 * i)
# title 64–72
add(out, thump(1.3, 40), bt(64), 1.0, 0); add(out, S.hit('gong2', 'big', .9), bt(64), .55, 0); add(out, drone(130.81 / 2, 8), bt(64), .9, 0)
for b in (66, 67, 68): add(out, kick(), bt(b), .9, 0)
add(out, S.strum if False else P.strum('shamisen', [48, 55, 60, 63, 67], 3.5, .8, spread=.03), bt(68), .8, 0)
# outro 72–96: half-time, hook, end hit
drums(72, 88, g=.6)
for b0 in (72, 80): hook(b0, vel=.7, g=.9)
for b in range(72, 88, 4): add(out, sub(C3 - 12, 1.8), bt(b), .8, 0)
add(out, thump(1.2, 45), bt(88), .9, 0); add(out, S.hit('gong2', 'big', .8), bt(88), .5, 0); add(out, drone(130.81 / 2, 8), bt(88), 1.0, 0)
add(out, P.pluck('shamisen', 60, 4, vel=.7), bt(88), .9, 0)
for j in range(4): add(out, S.note('hand_chimes', 84 + [0, 7, 10, 12][j], 2.2, .4), bt(88) + j * .12, .3, -.2 + .13 * j)
# cut ticks on every word (paper snap)
ev = json.load(open(os.path.join(D, 'events.json')))['ev']
for e in ev:
    if e['type'] == 'cut': d = .03; x = t_(d); add(out, norm(hp(noise(d), 2500) * np.exp(-x / .004)), e['t'], .12, rng.uniform(-.4, .4))
add(out, np.zeros(10), 0)
out[int(39 * B * SR):int((39 * B + .45) * SR)] *= .15          # the breath before the drop
out = out[:int(DUR * SR)]; fd = int(1.5 * SR); out[-fd:] *= np.linspace(1, 0, fd)[:, None]
out = hp(out.T, 25).T; out = np.stack([limit(out[:, 0] / np.abs(out).max() * .9, .95), limit(out[:, 1] / np.abs(out).max() * .9, .95)], 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True); sf.write(os.path.join(D, 'out/mix.wav'), out.astype(np.float32), SR); print('mix', len(out) / SR)
