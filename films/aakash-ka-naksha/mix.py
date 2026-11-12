"""mix.py · voice + score + foley + ambience → out/mix.wav (whole film).
Foley by material: squeegee = rubber blade on nylon mesh (band-passed noise with a ~250 Hz mesh grain), wet ink squelch,
stamps for dashes / boxes, aluminium clamp clack for the registration snaps, a creak while the stars slip.
Ambience from inside each print, J-cut ~0.5 s before its scene: crickets (night), river (Babylon), surf (Alexandria),
birds and wind (Jaipur), a press rhythm and street hush (London), night wind (the wall). Room tone under everything.
Voice compressed, ~10 dB RMS over the music; music ducks under the voice."""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, os.path.join(ROOT, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, clack, creak, thump, whoosh, compress, limit, add
from scipy.ndimage import uniform_filter1d
from scipy.signal import resample_poly
EV = json.load(open(os.path.join(D, 'events.json')))['ev']
DUR = json.load(open(os.path.join(D, 'events.json')))['dur']
TOT = DUR + .5; N = int(TOT * SR); tt = np.arange(N) / SR
amb = np.zeros((N, 2)); fol = np.zeros((N, 2)); vox = np.zeros((N, 2))
rng = np.random.default_rng(5)
evs = lambda tp, **kw: [e for e in EV if e['type'] == tp and all(e.get(k) == v for k, v in kw.items())]

def scrape(d, bright=1.0):
    x_t = t_(d); grain = .65 + .35 * np.abs(np.sin(2 * np.pi * (230 + 50 * bright) * x_t + rng.random() * 6)) ** 2
    x = bp(noise(d), 700 * bright, min(9000, 5200 * bright)) * grain + lp(noise(d), 380) * .3
    e = np.minimum(1, x_t / .02) * np.minimum(1, (d - x_t) / .06)
    return norm(x * e)
def squelch(f=140):
    d = .16; x_t = t_(d); return norm(np.sin(2 * np.pi * f * x_t * (1 - .9 * x_t)) * env_exp(d, .05) + lp(noise(d), 900) * env_exp(d, .03) * .5)
def stamp():
    d = .14; x_t = t_(d); return norm(lp(noise(d), 1200) * env_exp(d, .012) + np.sin(2 * np.pi * 160 * x_t) * env_exp(d, .03) * .7 + bp(noise(d), 2500, 6000) * env_exp(d, .006) * .4)
def tick():
    d = .03; x_t = t_(d); return norm(hp(noise(d), 2500) * env_exp(d, .003) + np.sin(2 * np.pi * 3200 * x_t) * env_exp(d, .004) * .4)

# ---------------- foley ----------------
for e in evs('pull'):
    d = max(.12, e['dur']); add(fol, scrape(d, 1.0 + .6 * (d < .3)), e['t'], .16, rng.uniform(-.3, .3)); add(fol, squelch(120 + rng.random() * 60), e['t'] + d * .9, .1, 0)
for e in evs('plate'): add(fol, scrape(max(.2, e['dur']), 1.2), e['t'], .12, .3); add(fol, stamp(), e['t'] + e['dur'], .2, .2)
for e in evs('item'): add(fol, stamp(), e['t'], .22 if e.get('accent') else .14, .25); add(fol, tick(), e['t'] + .02, .08, .3)
for e in evs('stamp'): add(fol, stamp(), e['t'], .16, rng.uniform(-.4, .4))
for e in evs('sweep'): add(fol, scrape(e['dur'], .9), e['t'], .26, 0); add(fol, whoosh(e['dur'] + .2), e['t'] - .05, .14, 0)
for e in evs('wipe'): add(fol, whoosh(e['dur'] + .3), e['t'] - .1, .34, 0)
for e in evs('lift'): add(fol, clack(.8, .8), e['t'] + .4, .25, 0); add(fol, creak(.6), e['t'], .12, .1)
for e in evs('clamp'): g = .55 if e.get('big') else .35; add(fol, clack(.7, 1), e['t'], g, 0); add(fol, thump(1, 60), e['t'], g * .8, 0)
for e in evs('slip'):
    d = e['dur']; x_t = t_(d); cr = bp(noise(d), 300, 1400) * (.5 + .5 * np.sin(2 * np.pi * 7 * x_t) ** 8) * np.minimum(1, x_t / .5) * np.minimum(1, (d - x_t) / .3)
    add(fol, norm(cr), e['t'], .06, -.2)
for e in evs('pullout'): add(fol, whoosh(e['dur'] * .6), e['t'], .1, 0)

# ---------------- ambience per scene (J-cut in 0.5 s early, L-cut out 0.4 s late) ----------------
room = lp(brown(TOT), 240) * .5 + bp(noise(TOT), 150, 900) * .07
amb[:, 0] += room * .04; amb[:, 1] += room * .038
def win(a, b, fi=.6, fo=.6): return np.clip(np.minimum((tt - (a - .5)) / fi, (b + .4 - tt) / fo), 0, 1)
SC = {e['name']: (e['t'], e['t1']) for e in evs('scene')}
def crickets():
    x = np.zeros(N)
    for c, f in ((0, 4300), (1, 4700), (2, 3900)):
        rate = 15 + 3 * c; gate = (np.sin(2 * np.pi * rate * tt + c) > .6) * (np.sin(2 * np.pi * .9 * tt + c * 2) > -.2)
        x += np.sin(2 * np.pi * f * tt) * uniform_filter1d(gate.astype(float), 60) * .3
    return x
cr = crickets()
for name in ('night', 'night2'):
    a, b = SC[name]; w = win(a, b); amb[:, 0] += cr * w * .03; amb[:, 1] += np.roll(cr, 700) * w * .03
a, b = SC['babylon']; river = lp(noise(TOT), 700) * (.7 + .3 * np.sin(2 * np.pi * .3 * tt)) + bp(noise(TOT), 1800, 5000) * .15
w = win(a, b); amb[:, 0] += river * w * .05; amb[:, 1] += np.roll(river, 1500) * w * .05
a, b = SC['alex']; swell = (.35 + .65 * np.clip(np.sin(2 * np.pi * tt / 5.5), 0, 1) ** 2); surf = lp(noise(TOT), 1600) * swell
w = win(a, b); amb[:, 0] += surf * w * .07; amb[:, 1] += np.roll(surf, 2400) * w * .07
a, b = SC['jaipur']; wind = lp(noise(TOT), 800) * (.55 + .45 * np.sin(2 * np.pi * .13 * tt) ** 2); w = win(a, b)
amb[:, 0] += wind * w * .04; amb[:, 1] += np.roll(wind, 900) * w * .04
def chirp(d=.1, f0=3600, f1=5000): x_t = t_(d); f = np.linspace(f0, f1, len(x_t)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x_t / d) ** 2)
for k in range(16): t0 = a + .5 + rng.random() * (b - a - 1); [add(amb, chirp(.06 + .05 * rng.random()), t0 + j * .11, .03, rng.uniform(-.7, .7)) for j in range(2 + int(rng.random() * 3))]
a, b = SC['london']; hush = lp(brown(TOT), 500) * .6; w = win(a, b); amb[:, 0] += hush * w * .06; amb[:, 1] += hush * w * .06
B = 60 / 84
for k in range(int((b - a) / (B / 2))):                   # the press, felt more than heard, on eighths; stops at the silence
    t0 = a + k * B / 2
    if t0 > 77.6: break
    add(amb, norm(lp(noise(.08), 600) * env_exp(.08, .02)), t0, .05, -.5)
a, b = SC['wall']; nw = lp(noise(TOT), 500) * (.6 + .4 * np.sin(2 * np.pi * .08 * tt) ** 2); w = win(a, b, 1, 2)
amb[:, 0] += nw * w * .04; amb[:, 1] += np.roll(nw, 1200) * w * .04

# ---------------- voice ----------------
for e in evs('vo'):
    x, sr = sf.read(os.path.join(D, 'out/voice', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    x = hp(x, 90); x = compress(norm(x, .9), thr=.22, ratio=3.2)
    add(vox, x, e['t'], 1.0, 0)
vm = vox.mean(1)
vrms = np.sqrt(np.mean(vm[np.abs(vm) > .01] ** 2))
vox *= .2 / vrms

# ---------------- music, ducked under the voice ----------------
mus, sr = sf.read(os.path.join(D, 'music/score.wav'))
mus = np.vstack([mus, np.zeros((max(0, N - len(mus)), 2))])[:N]
env = uniform_filter1d((np.abs(vm) > .02).astype(float), int(.25 * SR)); env = uniform_filter1d(np.clip(env * 3, 0, 1), int(.3 * SR))
mrms = np.sqrt(np.mean(mus[mus != 0] ** 2)); mus *= (.2 / 3.16) / mrms * 1.35       # ~ -10 dB under the voice, a touch more when it rests
mus *= (1 - .45 * env)[:, None]
mixd = vox + mus + fol + amb
mixd = np.stack([limit(mixd[:, 0], .95), limit(mixd[:, 1], .95)], 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out/mix.wav'), mixd.astype(np.float32), SR)
print('mix.wav', round(len(mixd) / SR, 2), 's, peak', round(float(np.abs(mixd).max()), 3))
