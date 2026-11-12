"""compose.py · the score of "आकाश का नक्शा": 84 BPM, 4/4, Raag Bhairav colour on C (C Db E F G Ab B).
Tanpura-style drone (synthesised), a buzzing plucked lead (shamisen model, sitar-like jawari) with meend bends,
pizzicato bass, frame drums in an 8-stroke keherwa-like cycle, hand chimes / Nepalese bells for stars.
Two silences: 77.9–81.4 s (before the turn) and 101.1–102.9 s (before the ending). → music/score.wav"""
import os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../../..'))
sys.path.insert(0, os.path.join(ROOT, 'core/audio'))
from sfx import SR, add, lp, hp, limit
import sampler as S, pluck as P
S.seed(84)
B = 60 / 84; BAR = 4 * B; DUR = 44 * BAR
bt = lambda bar, beat=0: bar * BAR + beat * B
N = int((DUR + 3) * SR); out = np.zeros((N, 2))
rng = np.random.default_rng(3)
C4 = 60
SC = [0, 1, 4, 5, 7, 8, 11]                     # Bhairav

# ---------- tanpura drone: Pa Sa Sa Sa (G2 C3 C3 C2), one pluck per beat ----------
def tanpura_note(f, d=3.2):
    t = np.arange(int(d * SR)) / SR; y = np.zeros_like(t)
    for k in range(1, 18):
        swell = (1 - np.exp(-t / (.05 + .04 * k ** .6))) * np.exp(-t / (2.6 / (1 + .06 * k)))
        y += np.sin(2 * np.pi * f * k * t * (1 + .0004 * rng.standard_normal()) + rng.random() * 6) * swell / k ** .85 * (1 + .6 * (k in (4, 5, 6, 7)))
    y[:240] *= np.linspace(0, 1, 240)
    return lp(y, 4200) * .05
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
DRONE = [hz(43), hz(48), hz(48), hz(36)]
def drone_level(t):
    if t < 77.86: return min(1, t / 3.0)
    if t < 84.29: return 0
    if t < 101.07: return min(1, (t - 84.29) / 1.5) * .8
    if t < 102.86: return 0
    return 1
cache = [tanpura_note(f) for f in DRONE]
k = 0; t = 0.0
while t < DUR:
    g = drone_level(t)
    if g > 0: add(out, cache[k % 4] * g, t, 1.0, (-.25, .25, .1, -.1)[k % 4])
    k += 1; t += B
# silence must be silence: cut drone tails into the two silences
for a, b in ((77.86, 81.43), (101.07, 102.86)):
    i0, i1 = int(a * SR), int(b * SR); fade = int(.35 * SR)
    out[i0:i0 + fade] *= np.linspace(1, 0, fade)[:, None]; out[i0 + fade:i1] = 0

# ---------- lead: plucked, buzzing, with meend ----------
def lead(at, m, d, vel=.7, bend_from=None, pan=.15, gain=1.0):
    kw = {}
    if bend_from is not None: kw['bend'] = [(0, bend_from), (min(.16, d * .4), 0)]
    if d > .9: kw['vib'] = (5.2, .12, .5)
    x = P.pluck('shamisen', C4 + m, d + .5, vel=vel, **kw)
    add(out, x, at, .9 * gain, pan)
A = [(0, 0, 2, -1), (2, 4, 1), (3, 5, 1), (4, 7, 3, -2), (7, 8, 1), (8, 7, 2), (10, 5, 1), (11, 4, 1), (12, 1, 2, 1), (14, 0, 2)]
Bp = [(0, 7, 2), (2, 8, 1), (3, 11, 1), (4, 12, 4, -1), (8, 11, 1), (9, 8, 1), (10, 7, 2), (12, 5, 1), (13, 4, 1), (14, 1, 1), (15, 0, 1)]
Cp = [(0, 12, 3, -1), (3, 11, 1), (4, 8, 2), (6, 7, 2), (8, 5, 1), (9, 4, 1), (10, 5, 2), (12, 4, 2, -1), (14, 1, 1), (15, 0, 1)]
def phrase(bar, ph, oct=0, vel=.7, gain=1.0, step=B / 2):
    for n in ph:
        s, m, l = n[:3]; bf = n[3] if len(n) > 3 else None
        lead(bt(bar) + s * step, m + 12 * oct, l * step, vel * (1.05 if l >= 2 else .9), bf, gain=gain)
# alap (free, slow) in the opening
for (tt, m, d, bf) in [(bt(2, 0), -1, .9, None), (bt(2, 1.5), 0, 1.8, -1), (bt(3, 0), 4, .9, None), (bt(3, 1), 5, .7, None), (bt(3, 2), 4, 1.2, 1), (bt(4, 0), 1, .9, None), (bt(4, 1), 0, 2.4, -1)]:
    lead(tt, m, d, .55, bf, gain=.8)
for bar, ph in [(6, A), (8, Bp), (10, A), (12, Cp), (14, Bp), (16, A), (18, Bp), (20, Cp), (22, A), (24, A), (26, Bp)]:
    phrase(bar, ph, vel=.68 if bar < 16 else .75, gain=.75 if 12 <= bar < 16 else 1.0)
# London: staccato doubling an octave up (faster by subdividing)
for bar in (24, 25, 26):
    for s in range(0, 16, 2): lead(bt(bar) + s * B / 2, (0, 4, 7, 8, 7, 4, 1, 0)[s // 2] + 12, .14, .45, pan=-.3, gain=.5)
# the turn: two slow phrases
for (tt, m, d, bf) in [(bt(32, 2), 7, 1.4, -2), (bt(33, 0), 8, .8, None), (bt(33, 1), 7, 1.6, None), (bt(34, 0), 4, .8, None), (bt(34, 1), 1, 1.0, None), (bt(34, 2), 0, 2.6, -1)]:
    lead(tt, m, d, .55, bf, gain=.8)
# the wall: melody returns, ends on Sa
for bar, ph in [(36, A), (38, Bp), (40, Cp)]: phrase(bar, ph, vel=.72)
lead(bt(42), 0, 3.5, .7, -1); add(out, P.strum('shamisen', [C4 - 24, C4 - 17, C4 - 12, C4], 4.5, .7, spread=.04), bt(42), .7, 0)

# ---------- bass ----------
def bass(at, m, d=.8, v=.7): add(out, P.pluck('upright_bass_pizz', m, d, vel=v), at, 1.0, 0)
for bar in list(range(5, 27)) + list(range(36, 42)):
    root = 36 if bar % 4 != 3 else 43
    bass(bt(bar), root, .9, .75); bass(bt(bar, 2), root + (7 if root == 36 else 5), .6, .55)
bass(bt(32), 24 + 12, 2.5, .9); bass(bt(42), 36, 3, .8)

# ---------- frame drums: an 8-stroke cycle per bar (eighths); denser = subdivided ----------
L, M, Sm, Hd = ('large', .8), ('large_muted', .55), ('small', .55), ('hand', .5)
CYC = [L, Sm, Sm, Hd, Sm, Hd, L, Sm]
def drum(at, v, vel, pan=0, g=1.0): add(out, S.hit('frame_drum', v, vel), at, .55 * g, pan)
for bar in range(5, 44):
    if 27 <= bar < 36 and bar not in (): continue
    if bar >= 42: continue
    g = .55 if bar < 12 else .45 if bar < 16 else .75 if bar < 24 else .85 if bar < 28 else .5
    for i, (v, vel) in enumerate(CYC):
        drum(bt(bar) + i * B / 2, v, vel * (1.1 if i == 0 else 1), pan=(.15 if i % 2 else -.1), g=g)
    if 20 <= bar < 27:                                          # Jaipur after the snap and London: sixteenth fills on the last beat
        for j in range(4): drum(bt(bar, 3) + j * B / 4, 'small_muted', .4 + .1 * j, pan=.2, g=g * .8)
bar27 = 27
for i, (v, vel) in enumerate(CYC[:2]): drum(bt(27) + i * B / 2, v, vel, g=.85)        # London runs up to the cut at 77.86
# the snaps
drum(bt(20), 'large', 1.0, g=1.5); add(out, S.hit('gong2', 'small', .7), bt(20), .35, .1)
drum(bt(32), 'large', 1.0, g=1.8); add(out, S.hit('gong2', 'big', .8), bt(32), .5, 0)
for bar in (29, 30, 31): drum(bt(bar), 'large_muted', .5, g=.7)                    # the turn's low pulse
for bar in range(33, 36): drum(bt(bar), 'large_muted', .4, g=.5)

# ---------- chimes and bells ----------
for i, tt in enumerate([bt(1, 3) + j * B / 4 for j in range(6)]): add(out, S.note('hand_chimes', 84 + SC[(i * 2) % 7], 1.6, .45), tt, .35, (-.4 + .16 * i))
for i in range(9): add(out, S.note('hand_chimes', 72 + [0, 4, 7, 11, 12, 11, 7, 5, 4][i], 1.4, .5), bt(18, 3) + i * B / 2, .3, -.3 + .07 * i)
add(out, S.hit('nepal_bells', None, .6), bt(28, 2), .4, .2)
add(out, S.hit('nepal_bells', None, .5), bt(41), .35, -.2)
for j in range(4): add(out, S.note('hand_chimes', 84 + [0, 7, 11, 12][j], 2.2, .4), bt(42) + j * .12, .3, -.2 + .13 * j)

for a, b in ((77.86, 81.40), (101.07, 102.84)):                  # the two silences: everything stops (bell at 81.43 rings after)
    i0, i1 = int(a * SR), int(b * SR); fade = int(.3 * SR)
    out[i0:i0 + fade] *= np.linspace(1, 0, fade)[:, None] ** 2; out[i0 + fade:i1] = 0
out = out[:int((DUR + .2) * SR)]
fade = int(1.4 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out = hp(out.T, 30).T
pk = np.abs(out).max(); out *= .8 / pk
sf.write(os.path.join(D, 'score.wav'), out.astype(np.float32), SR)
print('score.wav', round(len(out) / SR, 2), 's')
