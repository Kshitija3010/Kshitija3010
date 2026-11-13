"""Sound for «दुनिया की पहली रोटी» (Kathaverse · प्राचीन रसोई 1): Hindi narration + pencil on paper (driven by the page's
events) + fire beds + a small acoustic score (nylon guitar, double bass, shaker, kalimba/vibraphone accents) on a 96 bpm grid.
Near-silence before the reversal (L15). Voice ~10 dB above the music, which dips 300 Hz–4 kHz while she speaks.
Run from the library root: .venv/bin/python films/kv-food/mix.py"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR)); FULL = DUR
tt = np.arange(N) / SR
rng = np.random.default_rng(7)
VO = json.load(open(os.path.join(HERE, 'voice', 'cues.json')))
ST = VO['start']; at = lambda i, f=0: ST[i] + f * VO['dur'][i]
# ---------------- pencil foley ----------------
def activity(kinds):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] not in kinds: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e['d'], 0.035)) * SR))
        if i1 <= i0: continue
        n = i1 - i0; env = np.ones(n)
        r = min(n // 3, int(0.01 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    level = 1 - np.exp(-a * 1.1)
    k = int(0.015 * SR); ker = np.ones(k) / k
    return np.convolve(level, ker, 'same'), np.convolve(pan, ker, 'same')


def tooth_noise(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * np.clip(g, 0, 2.5))


def hand(rate, seed, sharp=1.0):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 2.5 * lp(r.standard_normal(N), 3, 1)) / SR) * 2 * np.pi
    return (0.5 + 0.5 * np.abs(np.sin(ph))) ** sharp


def pan_st(x, pan):
    th = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


fol = np.zeros((N, 2))
lv, pn = activity(['pencil']); fol += pan_st(tooth_noise(700, 4200, 380, 0.9, 1) * hand(5, 2) * lv, pn * 0.55) * 0.28
lv, pn = activity(['light']); fol += pan_st(tooth_noise(1400, 5200, 500, 0.9, 3) * hand(7, 4) * lv, pn * 0.55) * 0.11
lv, pn = activity(['write']); fol += pan_st(tooth_noise(900, 4800, 450, 0.92, 5) * hand(10, 6, 1.6) * lv, pn * 0.55) * 0.27
lv, pn = activity(['color']); fol += pan_st(tooth_noise(320, 2600, 220, 0.75, 7) * hand(13, 8, 2.0) * lv, pn * 0.55) * 0.23
for e in EV:
    t, d, p = e['t'], e['d'], e.get('pan', 0)
    if e['type'] == 'tap':
        add(fol, hp(click(pitch=0.7 + rng.random() * 0.25, v=1.0), 1800) * 0.035, t, 1.0, p * 0.5)
    elif e['type'] in ('gesture', 'punch'):
        n = int(d * SR); x = lp(hp(rng.standard_normal(n), 150), 1300, 2)
        u = np.linspace(0, 1, n); env = np.sin(np.pi * u) ** 1.5
        g = np.stack([x * env, np.roll(x, 211) * env], 1) * (0.05 if e['type'] == 'gesture' else 0.07)
        i0 = int(t * SR); i1 = min(N, i0 + n); fol[i0:i1] += g[:i1 - i0]
    elif e['type'] == 'fire':   # a small fire: soft roar + crackles
        n = int(d * SR); u = np.linspace(0, 1, n); env = np.minimum(1, u / 0.15) * np.minimum(1, (1 - u) / 0.25)
        roar = lp(rng.standard_normal(n), 500, 2) * 0.05
        x = roar * env
        for k in range(int(d * 14)):
            i0 = rng.integers(0, max(1, n - 400)); c = hp(click(pitch=1.0 + rng.random(), v=1.0), 1200)[:min(400, n - i0)] * rng.uniform(0.02, 0.08)
            x[i0:i0 + len(c)] += c * env[i0]
        add(fol, x, t, 1.0, p)
    elif e['type'] == 'paste':
        add(fol, thump(0.5, 90) * 0.16, t + 0.08, 1.0, 0); add(fol, lp(whoosh(0.25, 1.0), 3000) * 0.05, t - 0.1, 1.0, 0)
    elif e['type'] == 'strike':
        add(fol, bp(whoosh(0.3, 1.0), 900, 5000) * 0.09, t, 1.0, p)
room = lp(rng.standard_normal(N), 420, 2) * 0.003
fol += np.stack([room, np.roll(room, 1013)], 1)

# ---------------- score ----------------
BEAT = 60 / 96; BAR = 4 * BEAT
CH = {'Dmaj7': ([50, 57, 61, 66], 38, 45), 'Bm7': ([47, 54, 57, 62], 35, 42), 'Gmaj7': ([55, 59, 62, 66], 31, 38),
      'A7sus': ([57, 62, 64, 67], 33, 40), 'A7': ([57, 61, 64, 67], 33, 40), 'Em7': ([52, 55, 59, 62], 40, 47), 'Dmaj9': ([54, 57, 61, 64], 38, 45)}
LOOP = ['Dmaj7', 'Bm7', 'Gmaj7', 'A7sus', 'Dmaj7', 'Em7', 'Gmaj7', 'A7']
END = at('L18', 1.0)
QUIET = [(at('L14', 1.0) - 0.2, at('L15', 0.0))]
quiet = lambda t: any(a <= t < b for a, b in QUIET)
ev = []; gpat = [[1, 3, 4, 6], [1, 3, 5, 6]]
nb = int(END / BAR) + 1
for b in range(nb):
    t0 = b * BAR; name = LOOP[b % 8]; vo, root, fifth = CH[name]; sparse = b < 2
    if not sparse:
        for beat, pch in ((0, root), (2, fifth)):
            t = t0 + beat * BEAT
            if quiet(t) or t >= END: continue
            ev.append((t, 'jazz_bass', pch, BEAT * 1.6, 0.6, -0.05, 0.95))
    for k in gpat[b % 2]:
        t = t0 + k / 2 * BEAT
        if t < 0.6 or quiet(t) or t >= END or (sparse and k not in (1, 4)): continue
        for j, pch in enumerate(vo): ev.append((t + j * 0.011, 'guitar_nylon', pch, 0.32, 0.32 + 0.06 * (k % 2), -0.18 + j * 0.06, 0.62))
for T, chord, bass in [(at('L15', 0.0), 'Gmaj7', 31), (at('L17', 0.0), 'Dmaj9', 38), (END, 'Dmaj9', 38)]:
    for j, pch in enumerate(CH[chord][0] + [CH[chord][0][1] + 12]): ev.append((T + j * 0.03, 'guitar_nylon', pch, 1.8, 0.5, -0.25 + j * 0.08, 0.7))
    ev.append((T, 'jazz_bass', bass, 1.6, 0.7, 0, 1.0))
for i in range(int(END / (BEAT / 2))):
    t = i * BEAT / 2
    if t < 2 * BAR or quiet(t) or t > END - 0.3: continue
    ev.append((t, 'world_perc', 'egg_shaker_soft', 0.2, 0.18 + 0.08 * (i % 2), 0.3, 0.45))
acc = [(at('L4', 0.55), 81), (at('L5', 0.0), 74), (at('L6', 0.75), 78), (at('L7', 0.1), 76), (at('L8', 0.0), 74), (at('L9', 0.0), 76),
       (at('L10', 0.0), 78), (at('L11', 0.18), 79), (at('L11', 0.4), 81), (at('L12', 0.3), 83), (at('L13', 0.3), 78), (at('L15', 0.0), 86), (at('L16', 0.1), 81), (at('L17', 0.0), 86)]
for t, pch in acc: ev.append((t, 'kalimba', pch, 1.4, 0.4, 0.25, 0.6))
S.seed(11)
music = S.render(ev, dur=FULL + 2.5, master=False)
music = S.room(music, size=0.3, mix=0.16)[:N]
if len(music) < N: music = np.vstack([music, np.zeros((N - len(music), 2))])
music *= np.clip((FULL - tt) / 2.0, 0, 1)[:, None] ** 1.3

# ---------------- narration ----------------
voice = np.zeros((N, 2)); speak = np.zeros(N)
for vid, st in ST.items():
    x, sr = sf.read(os.path.join(HERE, 'voice', vid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr); x = hp(x, 80)
    x = compress(x / (np.abs(x).max() + 1e-9) * 0.6, thr=0.18, ratio=3.0)
    s = int(round(st * SR)); a, b = max(0, s), min(N, s + len(x))
    voice[a:b] += np.stack([x[a - s:b - s]] * 2, 1)
    speak[max(0, s - int(0.15 * SR)):min(N, s + len(x) + int(0.25 * SR))] = 1
k = int(0.12 * SR); speak = np.convolve(speak, np.ones(k) / k, 'same')
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in (0, 1)], 1)
music = music - mid * (0.55 * speak)[:, None]; music *= (1 - 0.45 * speak)[:, None]
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2) + 1e-12)
on = speak > 0.5
voice *= 10 ** (10 / 20) * rms(music.mean(1), on) / rms(voice.mean(1), voice.mean(1) != 0)
mix = voice + music + fol * (1 - 0.35 * speak)[:, None] * 0.9
mix = np.stack([compress(mix[:, 0], thr=0.35, ratio=2.2), compress(mix[:, 1], thr=0.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), '| voice vs music (speaking) dB', round(db(voice.mean(1)[on]) - db(music.mean(1)[on]), 1))
cr = S.credits(['guitar_nylon', 'jazz_bass', 'world_perc', 'kalimba', 'hand_chimes', 'vibraphone', 'contrabass_pizz', 'gong2'])
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
