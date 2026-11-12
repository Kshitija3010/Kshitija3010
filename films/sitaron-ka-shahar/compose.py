"""compose.py · "सितारों का शहर" (desi cut): 120 BPM, Raag Bhairavi colour on C, 48 s, with Hindi voice lines.
Tanpura drone · bansuri alaap (synth flute with breath and vibrato) · sitar hook (buzzing plucked string with meend) ·
harmonium chords (reed synth) · tabla (synth dayan + bayan with glide) in keherwa · tihai into the drop · bhangra dhol drop
(chaal: dagga + tilli) with taali claps · gong and chimes. Voice: Kokoro hf_alpha, with a short echo. → out/mix.wav"""
import os, sys, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, bp, lp, hp, noise, norm, whoosh, thump, compress, limit, add
import sampler as S, pluck as P
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d
S.seed(108); rng = np.random.default_rng(9)
B = .5; DUR = 48.0; N = int((DUR + 3) * SR); mus = np.zeros((N, 2)); vox = np.zeros((N, 2))
bt = lambda b: b * B
SC = [0, 1, 3, 5, 7, 8, 10]; deg = lambda d, base=60: base + SC[d % 7] + 12 * (d // 7); hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
def tanpura(f, d=3.0):
    x = t_(d); y = sum(np.sin(2 * np.pi * f * k * x + rng.random() * 6) * (1 - np.exp(-x / (.05 + .04 * k ** .6))) * np.exp(-x / (2.4 / (1 + .06 * k))) / k ** .85 * (1 + .6 * (4 <= k <= 7)) for k in range(1, 15))
    return lp(y, 4000) * .05
def bansuri(m, d, vel=.6, slide=None):
    x = t_(d); f = hz(m) * (1 + .006 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x / .4))
    if slide is not None: f = f * 2 ** (np.interp(x, [0, min(.18, d * .4)], [slide, 0]) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR; tone = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    breath = bp(noise(d), 1500, 6000) * .12
    return (tone + breath) * np.minimum(1, x / .08) * np.minimum(1, (d - x) / .12) * .22 * vel
def sitar(m, d, vel=.75, meend=None):
    kw = {'bend': [(0, meend), (min(.15, d * .4), 0)]} if meend is not None else {}
    return P.pluck('shamisen', m, d + .4, vel=vel, **kw)
def harmonium(ms, d):
    x = t_(d); y = np.zeros_like(x)
    for m in ms:
        ph = 2 * np.pi * hz(m) * x
        for k in range(1, 10): y += np.sin(k * ph + k) / k * (1 if k % 2 else .55)
    return lp(y, 2600) * np.minimum(1, x / .06) * np.minimum(1, (d - x) / .1) * .035
def dayan(kind='na', v=1.0):
    d = .3; x = t_(d); f = 700 if kind == 'te' else 520
    ring = (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2.02 * x) + .3 * np.sin(2 * np.pi * f * 3.0 * x)) * np.exp(-x / (.03 if kind == 'te' else .07))
    return norm(ring + .6 * hp(noise(d), 2500) * np.exp(-x / .004)) * v
def bayan(v=1.0, glide=True):
    d = .5; x = t_(d); f = (95 + 35 * np.minimum(1, x / .18)) if glide else 90 * np.ones_like(x)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .2) + .2 * lp(noise(d), 300) * np.exp(-x / .02)) * v
def dhol_dagga(v=1.0): d = .4; x = t_(d); f = 70 + 60 * np.exp(-x / .03); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .16) + .4 * bp(noise(d), 80, 600) * np.exp(-x / .03)) * v
def dhol_tilli(v=1.0): d = .12; x = t_(d); return norm(bp(noise(d), 1800, 7000) * np.exp(-x / .02) + .5 * np.sin(2 * np.pi * 900 * x) * np.exp(-x / .015)) * v
def taali(v=1.0): d = .2; x = t_(d); e = sum(np.exp(-np.maximum(x - o, 0) / .01) * (x >= o) for o in (0, .008, .02)); return norm(bp(noise(d), 1000, 4500) * e) * v
def riser(d): x = t_(d); return norm(bp(noise(d), 300, 8000) * (x / d) ** 2)

# ---------- score ----------
TAN = [tanpura(hz(43)), tanpura(hz(48)), tanpura(hz(48)), tanpura(hz(36))]
def drone(b0, b1, g=1.0):
    for i, b in enumerate(range(b0, b1)): add(mus, TAN[i % 4], bt(b), g, (-.25, .25, .1, -.1)[i % 4])
drone(0, 39, .9); drone(40, 96, .7)
for (b, d_, l, sl) in [(0, 0, 1.5, -2), (2, 2, 1.0, None), (3, 3, 1.0, None), (4, 4, 2.0, -1), (6, 3, .8, None), (7, 1, 1.5, 1)]:
    add(mus, bansuri(deg(d_, 72), l * B * 1.6, .7, sl), bt(b), 1.0, .2)
HOOK = [(0, 0, 2, -1), (2, 2, 1), (3, 3, 1), (4, 4, 2, -2), (6, 3, 1), (7, 2, 1), (8, 4, 3), (11, 5, 1), (12, 4, 1), (13, 3, 1), (14, 1, 2, 1)]
def hook(b0, base=60, vel=.75, g=1.0):
    for n in HOOK:
        s, d_, l = n[:3]; add(mus, sitar(deg(d_, base), l * B / 2, vel, n[3] if len(n) > 3 else None), bt(b0) + s * B / 2, .9 * g, .15)
CH = [[48, 51, 55], [44, 48, 51], [46, 50, 53], [48, 51, 55]]
def chords(b0, b1, g=1.0):
    for i, b in enumerate(range(b0, b1, 4)): add(mus, harmonium([m + 12 for m in CH[i % 4]], 4 * B), bt(b), g, -.2)
KEH = ['dha', 'ge', 'na', 'te', 'na', 'ka', 'dhi', 'na']          # keherwa, 8 strokes per bar (eighths)
def tabla(b0, b1, g=1.0):
    for b in range(b0, b1, 4):
        for i, s in enumerate(KEH):
            at = bt(b) + i * B / 2
            if s in ('dha', 'dhi', 'ge'): add(mus, bayan(.9, glide=(s == 'ge')), at, .55 * g, -.1)
            if s in ('dha', 'na', 'dhi'): add(mus, dayan('na'), at, .35 * g, .15)
            if s in ('te', 'ka'): add(mus, dayan('te', .7), at, .25 * g, .2)
tabla(8, 32, .8); chords(8, 36, .8)
for b0 in (8, 16, 24): hook(b0, vel=.7)
add(mus, S.hit('gong2', 'small', .6), bt(20), .35, 0); add(mus, bayan(1.0), bt(20), .8, 0)
# tihai (dha te-te dha) ×3 landing on sam at beat 40
for rep in range(3):
    st = 32 + rep * 2.5
    for j, o in enumerate([0, .25, .5, 1.0]):
        add(mus, bayan(.9) if j in (0, 3) else dayan('te', .8), bt(st + o * 2), .6 if j in (0, 3) else .35, 0); add(mus, dayan('na', .8), bt(st + o * 2), .3, .15)
add(mus, riser(4.0), bt(32), .35, 0)
for b in (36, 37, 38): add(mus, dhol_dagga(1.0), bt(b), .7, 0); add(mus, taali(1), bt(b), .4, 0)
# drop: bhangra chaal + taali, hook an octave up
add(mus, thump(1.2, 45), bt(40), 1.0, 0); add(mus, S.hit('gong2', 'big', .8), bt(40), .5, 0); add(mus, whoosh(.5), bt(39) + .05, .35, 0)
for b in range(40, 64, 2):
    add(mus, dhol_dagga(1.0), bt(b), .8, -.05); add(mus, dhol_dagga(.8), bt(b) + B * 1.5, .6, -.05)
    for o in (.5, 1.0, 1.75): add(mus, dhol_tilli(.8), bt(b) + B * o, .35, .2)
    add(mus, taali(), bt(b + 1), .45, .05)
for b0 in (40, 48, 56): hook(b0, base=72, vel=.8, g=.85); hook(b0, base=60, vel=.6, g=.45)
chords(40, 64, .9)
for i in range(12): add(mus, S.note('hand_chimes', 84 + SC[(i * 3) % 7], .9, .45), bt(40 + i * 2), .22, -.4 + .07 * i)
add(mus, thump(1.3, 40), bt(64), 1.0, 0); add(mus, S.hit('gong2', 'big', .9), bt(64), .55, 0)
for b in (66, 67): add(mus, dhol_dagga(), bt(b), .8, 0)
add(mus, P.strum('shamisen', [48, 55, 60, 63, 67], 3.5, .8, spread=.03), bt(68), .8, 0); add(mus, harmonium([60, 63, 67], 4 * B), bt(68), 1.0, 0)
tabla(72, 88, .7); chords(72, 88, .7)
for b0 in (72, 80): hook(b0, vel=.7, g=.85)
add(mus, bansuri(deg(0, 72), 3.0, .7, -1), bt(84), 1.0, .2)
add(mus, thump(1.2, 45), bt(88), .9, 0); add(mus, S.hit('gong2', 'big', .8), bt(88), .5, 0); add(mus, sitar(60, 4, .7, -1), bt(88), .9, 0)
for j in range(4): add(mus, S.note('hand_chimes', 84 + [0, 7, 10, 12][j], 2.2, .4), bt(88) + j * .12, .3, -.2 + .13 * j)
for e in json.load(open(os.path.join(D, 'events.json')))['ev']:
    if e['type'] == 'cut': d = .03; x = t_(d); add(mus, norm(hp(noise(d), 2500) * np.exp(-x / .004)), e['t'], .1, rng.uniform(-.4, .4))
mus[int(39 * B * SR):int((39 * B + .45) * SR)] *= .12            # the breath before the drop

# ---------- Hindi voice, with a short echo ----------
VO = {'V1': bt(0) + .25, 'V2': bt(16), 'V3': bt(32), 'V4': bt(64), 'V5': bt(72), 'V6': bt(84)}
for vid, at in VO.items():
    x, sr = sf.read(os.path.join(D, 'out/voice', vid + '.wav')); x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = resample_poly(x, SR, sr)
    x = compress(norm(hp(x, 100), .9), thr=.22, ratio=3.0)
    add(vox, x, at, 1.0, 0); add(vox, x * .22, at + .19, 1.0, -.3); add(vox, x * .12, at + .38, 1.0, .3)
vm = vox.mean(1); vox *= .22 / np.sqrt(np.mean(vm[np.abs(vm) > .01] ** 2))
envv = uniform_filter1d(np.clip(uniform_filter1d((np.abs(vm) > .02).astype(float), int(.2 * SR)) * 3, 0, 1), int(.25 * SR))
mus *= (.2 / 2.5) / np.sqrt(np.mean(mus[np.abs(mus) > 1e-4] ** 2)); mus *= (1 - .4 * envv)[:, None]
out = (mus + vox)[:int(DUR * SR)]; fd = int(1.5 * SR); out[-fd:] *= np.linspace(1, 0, fd)[:, None]
out = hp(out.T, 25).T; pk = np.abs(out).max(); out = np.stack([limit(out[:, 0] / pk * .9, .95), limit(out[:, 1] / pk * .9, .95)], 1)
sf.write(os.path.join(D, 'out/mix.wav'), out.astype(np.float32), SR); print('mix', len(out) / SR)
