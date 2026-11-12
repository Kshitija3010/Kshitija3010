"""audio.py <id> · score + foley + ambience + voice → out/<id>/mix.wav for one rashi (91.4 s, 84 BPM).
Score: synthesised tanpura drone, plucked buzzing lead (shamisen model, sitar-like), pizzicato bass, VCSL frame drums
and hand chimes. Raag colour by element: fire Bhairav, earth Yaman, air Kafi, water Bhairavi; a new key per rashi.
One silence (47.1–48.6 s) before the traits. Voice compressed, ~10 dB over the music, music ducks under it."""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, os.path.join(ROOT, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, clack, creak, thump, whoosh, compress, limit, add
import sampler as S, pluck as P
from scipy.ndimage import uniform_filter1d
from scipy.signal import resample_poly
RID = sys.argv[1]
ALL = json.load(open(os.path.join(D, 'rashi.json'), encoding='utf-8')); R = next(a for a in ALL if a['id'] == RID)
EVJ = json.load(open(os.path.join(D, 'out', RID, 'events.json'))); EV = EVJ['ev']; DUR = EVJ['dur']
evs = lambda tp, **kw: [e for e in EV if e['type'] == tp and all(e.get(k) == v for k, v in kw.items())]
B = 60 / 84; BAR = 4 * B; bt = lambda bar, beat=0: bar * BAR + beat * B
N = int((DUR + 3) * SR); mus = np.zeros((N, 2)); rng = np.random.default_rng(R['n']); S.seed(R['n'])
SCALES = {'fire': [0, 1, 4, 5, 7, 8, 11], 'earth': [0, 2, 4, 6, 7, 9, 11], 'air': [0, 2, 3, 5, 7, 9, 10], 'water': [0, 1, 3, 5, 7, 8, 10]}
SC = SCALES[R['scene']]; ROOTK = 57 + [3, 5, 2, 0, 4, 6, 1, 3, 5, 2, 0, 4][R['n'] - 1]       # A3..D#4 tonic
deg = lambda d: ROOTK + SC[d % 7] + 12 * (d // 7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
SIL = (bt(16, 2), bt(17))
# drone
def tanpura(f, d=3.2):
    t = np.arange(int(d * SR)) / SR; y = np.zeros_like(t)
    for k in range(1, 16):
        sw = (1 - np.exp(-t / (.05 + .04 * k ** .6))) * np.exp(-t / (2.6 / (1 + .06 * k)))
        y += np.sin(2 * np.pi * f * k * t + rng.random() * 6) * sw / k ** .85 * (1 + .6 * (k in (4, 5, 6, 7)))
    y[:240] *= np.linspace(0, 1, 240); return lp(y, 4200) * .05
DR = [tanpura(hz(ROOTK - 24 + 7)), tanpura(hz(ROOTK - 12)), tanpura(hz(ROOTK - 12)), tanpura(hz(ROOTK - 24))]
k = 0; t = 0.0
while t < DUR:
    g = min(1, t / 2.5) * (0 if SIL[0] <= t < SIL[1] else 1)
    if g > 0: add(mus, DR[k % 4] * g, t, 1.0, (-.25, .25, .1, -.1)[k % 4])
    k += 1; t += B
# lead
def lead(at, m, d, vel=.7, bf=None, pan=.15, gain=1.0):
    kw = {}
    if bf is not None: kw['bend'] = [(0, bf), (min(.16, d * .4), 0)]
    if d > .9: kw['vib'] = (5.2, .12, .5)
    add(mus, P.pluck('shamisen', m, d + .5, vel=vel, **kw), at, .9 * gain, pan)
PH = [[(0, 0, 2, -1), (2, 2, 1), (3, 3, 1), (4, 4, 3, -2), (7, 5, 1), (8, 4, 2), (10, 3, 1), (11, 2, 1), (12, 1, 2, 1), (14, 0, 2)],
      [(0, 4, 2), (2, 5, 1), (3, 6, 1), (4, 7, 4, -1), (8, 6, 1), (9, 5, 1), (10, 4, 2), (12, 3, 1), (13, 2, 1), (14, 1, 1), (15, 0, 1)],
      [(0, 7, 3, -1), (3, 6, 1), (4, 5, 2), (6, 4, 2), (8, 3, 1), (9, 2, 1), (10, 3, 2), (12, 2, 2, -1), (14, 1, 1), (15, 0, 1)]]
order = [(R['n'] + i) % 3 for i in range(10)]
def phrase(bar, ph, vel=.7, gain=1.0):
    for n in ph:
        s, d_, l = n[:3]; bf = n[3] if len(n) > 3 else None
        lead(bt(bar) + s * B / 2, deg(d_), l * B / 2, vel * (1.05 if l >= 2 else .9), bf, gain=gain)
for (tt, d_, l, bf) in [(bt(1, 0), -1, .9, None), (bt(1, 1.5), 0, 1.6, -1), (bt(2, 0), 2, .9, None), (bt(2, 1), 3, .7, None), (bt(2, 2), 2, 1.4, 1)]:
    lead(tt, deg(d_), l, .55, bf, gain=.8)
for i, bar in enumerate([5, 7, 9, 11, 13, 15, 17, 19, 21, 23]):
    if bar >= 16 and bar < 17: continue
    phrase(bar, PH[order[i]], .7, .75 if bar < 9 else .9 if bar < 17 else .7)
for i, bar in enumerate([25, 27]): phrase(bar, PH[order[i + 3]], .74)
lead(bt(30), deg(0), 3.5, .7, -1); add(mus, P.strum('shamisen', [ROOTK - 24, ROOTK - 17, ROOTK - 12, ROOTK], 4.5, .7, spread=.04), bt(30), .7, 0)
# bass
def bass(at, m, d=.8, v=.7): add(mus, P.pluck('upright_bass_pizz', m, d, vel=v), at, 1.0, 0)
for bar in list(range(5, 16)) + list(range(17, 30)):
    rt = ROOTK - 24 if bar % 4 != 3 else ROOTK - 17
    bass(bt(bar), rt, .9, .75); bass(bt(bar, 2), rt + 7 if bar % 4 != 3 else rt + 5, .6, .55)
bass(bt(30), ROOTK - 24, 3, .8)
# drums
CYC = [('large', .8), ('small', .55), ('small', .55), ('hand', .5), ('small', .55), ('hand', .5), ('large', .8), ('small', .55)]
dg = {'fire': 1.0, 'earth': .8, 'air': .65, 'water': .55}[R['scene']]
def drum(at, v, vel, pan=0, g=1.0): add(mus, S.hit('frame_drum', v, vel), at, .55 * g, pan)
for bar in range(5, 30):
    if bar == 16: continue
    g = (.5 if bar < 9 else .75 if bar < 16 else .6 if bar < 25 else .85) * dg
    for i, (v, vel) in enumerate(CYC): drum(bt(bar) + i * B / 2, v, vel * (1.1 if i == 0 else 1), pan=(.15 if i % 2 else -.1), g=g)
    if bar in (8, 15, 24, 28):
        for j in range(4): drum(bt(bar, 3) + j * B / 4, 'small_muted', .4 + .1 * j, pan=.2, g=g * .8)
drum(bt(17), 'large', 1.0, g=1.4); add(mus, S.hit('gong2', 'small', .6), bt(17), .3, .1)
drum(bt(25), 'large', 1.0, g=1.4); add(mus, S.hit('gong2', 'big', .7), bt(25), .35, 0)
for e in evs('chime'): add(mus, S.note('hand_chimes', 84 + SC[(e['n'] * 2) % 7] - 12 * (e['n'] % 2), 1.4, .45), e['t'], .32, -.4 + .07 * e['n'])
add(mus, S.hit('nepal_bells', None, .6), bt(0, 2.5), .35, .2)
for j in range(4): add(mus, S.note('hand_chimes', 84 + [0, 7, 11 if SC[6] == 11 else 10, 12][j], 2.2, .4), bt(30) + j * .12, .3, -.2 + .13 * j)
i0, i1 = int(SIL[0] * SR), int(SIL[1] * SR) - int(.03 * SR); fd = int(.3 * SR)
mus[i0:i0 + fd] *= np.linspace(1, 0, fd)[:, None] ** 2; mus[i0 + fd:i1] = 0
mus = hp(mus.T, 30).T; mus *= .8 / np.abs(mus).max()

# foley + ambience + voice
TOT = DUR + .5; Nn = int(TOT * SR); tt = np.arange(Nn) / SR
amb = np.zeros((Nn, 2)); fol = np.zeros((Nn, 2)); vox = np.zeros((Nn, 2))
def scrape(d, bright=1.0):
    x_t = t_(d); grain = .65 + .35 * np.abs(np.sin(2 * np.pi * (230 + 50 * bright) * x_t + rng.random() * 6)) ** 2
    x = bp(noise(d), 700 * bright, min(9000, 5200 * bright)) * grain + lp(noise(d), 380) * .3
    return norm(x * np.minimum(1, x_t / .02) * np.minimum(1, (d - x_t) / .06))
def squelch(f=140): d = .16; x_t = t_(d); return norm(np.sin(2 * np.pi * f * x_t * (1 - .9 * x_t)) * env_exp(d, .05) + lp(noise(d), 900) * env_exp(d, .03) * .5)
def stamp(): d = .14; x_t = t_(d); return norm(lp(noise(d), 1200) * env_exp(d, .012) + np.sin(2 * np.pi * 160 * x_t) * env_exp(d, .03) * .7 + bp(noise(d), 2500, 6000) * env_exp(d, .006) * .4)
def tick(): d = .03; x_t = t_(d); return norm(hp(noise(d), 2500) * env_exp(d, .003) + np.sin(2 * np.pi * 3200 * x_t) * env_exp(d, .004) * .4)
for e in evs('pull'): d = max(.12, e['dur']); add(fol, scrape(d, 1.0 + .6 * (d < .3)), e['t'], .15, rng.uniform(-.3, .3)); add(fol, squelch(120 + rng.random() * 60), e['t'] + d * .9, .09, 0)
for e in evs('plate'): add(fol, scrape(max(.2, e['dur']), 1.2), e['t'], .11, .3); add(fol, stamp(), e['t'] + e['dur'], .2, .2)
for e in evs('item'): add(fol, stamp(), e['t'], .2 if e.get('accent') else .13, .25); add(fol, tick(), e['t'] + .02, .07, .3)
for e in evs('stamp'): add(fol, stamp(), e['t'], .16, rng.uniform(-.4, .4))
for e in evs('sweep'): add(fol, scrape(e['dur'], .9), e['t'], .25, 0); add(fol, whoosh(e['dur'] + .2), e['t'] - .05, .13, 0)
for e in evs('logo'): add(fol, clack(.9, .8), e['t'], .3, .4); add(fol, thump(.8, 80), e['t'], .2, .4)
room = lp(brown(TOT), 240) * .5 + bp(noise(TOT), 150, 900) * .07; amb[:, 0] += room * .04; amb[:, 1] += room * .038
SCN = {e['name']: (e['t'], e['t1']) for e in evs('scene')}
def win(a, b, fi=.6, fo=.6): return np.clip(np.minimum((tt - (a - .5)) / fi, (b + .4 - tt) / fo), 0, 1)
cr = np.zeros(Nn)
for c, f in ((0, 4300), (1, 4700), (2, 3900)):
    gate = (np.sin(2 * np.pi * (15 + 3 * c) * tt + c) > .6) * (np.sin(2 * np.pi * .9 * tt + c * 2) > -.2); cr += np.sin(2 * np.pi * f * tt) * uniform_filter1d(gate.astype(float), 60) * .3
a, b = SCN['sky']; w = win(a, b); amb[:, 0] += cr * w * .03; amb[:, 1] += np.roll(cr, 700) * w * .03
a, b = SCN['story']; w = win(a, b)
if R['scene'] == 'water': x = lp(noise(TOT), 1600) * (.35 + .65 * np.clip(np.sin(2 * np.pi * tt / 5.5), 0, 1) ** 2); gain = .07
elif R['scene'] == 'earth': x = lp(noise(TOT), 700) * .5; gain = .03
else: x = lp(noise(TOT), 800) * (.55 + .45 * np.sin(2 * np.pi * .13 * tt) ** 2); gain = .045
amb[:, 0] += x * w * gain; amb[:, 1] += np.roll(x, 1300) * w * gain
if R['scene'] in ('earth', 'air'):
    def chirp(d=.1, f0=3600, f1=5000): x_t = t_(d); f = np.linspace(f0, f1, len(x_t)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x_t / d) ** 2)
    for k in range(10): t0 = a + .5 + rng.random() * (b - a - 1); [add(amb, chirp(.06 + .05 * rng.random()), t0 + j * .11, .028, rng.uniform(-.7, .7)) for j in range(2 + int(rng.random() * 3))]
a, b = SCN['follow']; nw = lp(noise(TOT), 500) * (.6 + .4 * np.sin(2 * np.pi * .08 * tt) ** 2); w = win(a, b, 1, 2); amb[:, 0] += nw * w * .035; amb[:, 1] += np.roll(nw, 1200) * w * .035
for e in evs('vo'):
    x, sr = sf.read(os.path.join(D, 'out/voice', RID, e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    add(vox, compress(norm(hp(x, 90), .9), thr=.22, ratio=3.2), e['t'], 1.0, 0)
vm = vox.mean(1); vox *= .2 / np.sqrt(np.mean(vm[np.abs(vm) > .01] ** 2))
mus = np.vstack([mus, np.zeros((max(0, Nn - len(mus)), 2))])[:Nn]
env = uniform_filter1d(np.clip(uniform_filter1d((np.abs(vm) > .02).astype(float), int(.25 * SR)) * 3, 0, 1), int(.3 * SR))
mus *= (.2 / 3.16) / np.sqrt(np.mean(mus[mus != 0] ** 2)) * 1.35; mus *= (1 - .45 * env)[:, None]
fade = int(1.2 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None]
m = vox + mus + fol + amb; m = np.stack([limit(m[:, 0], .95), limit(m[:, 1], .95)], 1)
sf.write(os.path.join(D, 'out', RID, 'mix.wav'), m.astype(np.float32), SR)
print(RID, 'mix', round(len(m) / SR, 2), 's')
