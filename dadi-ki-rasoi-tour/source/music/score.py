"""Original score for «दादी की रसोई का टूर» (Kathaverse): 1930s hot dance band, 120 BPM, 4/4, 52 bars = 104 s.
Stride piano, tuba oom-pah, banjo on 2 & 4, brushed snare, clarinet, trumpet, trombone smears, xylophone, slide whistle.
An original syncopated theme in F, restated per section; each kitchen tool gets its own instrument; a stinger on every gag.
Run: .venv/bin/python films/kv-rasoi/music/score.py   (helpers adapted from the Lemo-Opuscar rubber-hose demo score)"""
import os, sys, json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S      # noqa: E402
from core.audio import pluck as PL       # noqa: E402
from core.audio.sfx import SR, add, limit  # noqa: E402

BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT
def bar(b, beat=1.0): return (b - 1) * BAR + (beat - 1) * BEAT
DUR = bar(53)
N = int(round(DUR * SR))
STEMS = ['brass', 'reeds', 'piano', 'banjo_tuba', 'drums_fx', 'xylo']
buf = {k: np.zeros((N, 2), np.float32) for k in STEMS}
HITS = {}

# Attack compensation: brass/reed samples have a 15–30 ms attack, so they are placed early to land the accent on the beat (live players also push the air early)
LEAD = {'tuba_stac': .022, 'tuba': .025, 'trumpet': .018, 'trumpet_stac': .012, 'trumpet_mute': .02, 'trombone': .02, 'clarinet': .015, 'clarinet_stac': .008}
class Note(np.ndarray): pass
def put(stem, x, t, gain=1.0, pan=0.0):
    t = t - getattr(x, 'lead', 0.0)
    add(buf[stem], np.asarray(x, np.float32), t, gain, pan)

def nt(inst, pitch, dur, vel=.7, **kw):
    x = S.note(inst, pitch, dur, vel, **kw).view(Note); x.lead = LEAD.get(inst, 0.0); return x

# ——— Chords ———
CH = {  # (bass root, bass fifth, chord in the middle register)
    'F': ('F2', 'C2', ['A3', 'C4', 'F4']), 'D7': ('D2', 'A1', ['F#3', 'C4', 'D4']), 'G7': ('G2', 'D2', ['F3', 'B3', 'D4']),
    'C7': ('C2', 'G1', ['E3', 'Bb3', 'C4']), 'Dm': ('D2', 'A1', ['F3', 'A3', 'D4']), 'Bb': ('Bb1', 'F2', ['F3', 'Bb3', 'D4']),
    'A7': ('A1', 'E2', ['G3', 'C#4', 'E4']), 'E7': ('E2', 'B1', ['G#3', 'D4', 'E4']), 'G': ('G2', 'D2', ['B3', 'D4', 'G4']),
    'Gm': ('G2', 'D2', ['Bb3', 'D4', 'G4']), 'A': ('A1', 'E2', ['A3', 'C#4', 'E4']), 'C': ('C2', 'G1', ['E3', 'G3', 'C4']),
    'Dm6': ('D2', 'A1', ['F3', 'B3', 'D4']), 'Fdim': ('F2', 'B1', ['Ab3', 'B3', 'D4']), 'Eb7': ('Eb2', 'Bb1', ['G3', 'Db4', 'Eb4']),
}
def up(p, k=12): return S.name(S.midi(p) + k)

def stride(b, chords, vel=.62, beats=(1, 2, 3, 4)):
    """Stride piano: bass (octaves) on beats 1/3, middle-register chords (short) on beats 2/4. chords = [first two beats, last two beats]"""
    for bt in beats:
        c = chords[0] if bt <= 2 else chords[1]; root, fifth, tri = CH[c]; t = bar(b, bt)
        if bt in (1, 3):
            p = root if bt == 1 else fifth
            put('piano', nt('upright', p, BEAT * .8, vel), t, .9, -.15)
            put('piano', nt('upright', up(p), BEAT * .8, vel * .85), t, .7, -.15)
        else:
            for p in tri: put('piano', nt('upright', p, BEAT * .35, vel * .8), t, .55, .1)

def oompah(b, chords, vel=.6, two_beat=False):
    """Tuba oom (beats 1, 3) + banjo pah (strummed on beats 2, 4)"""
    for bt in (1, 3):
        c = chords[0] if bt == 1 else chords[1]; root, fifth, tri = CH[c]
        p = up(root, 12) if S.midi(root) < 36 else root
        if bt == 3 and not two_beat: p = up(fifth, 12) if S.midi(fifth) < 36 else fifth
        if two_beat and bt == 3: continue
        put('banjo_tuba', nt('tuba_stac', p, BEAT * .6, vel), bar(b, bt), 1.25, -.1)
    for bt in (2, 4):
        if two_beat and bt == 2: continue
        c = chords[0] if bt == 2 else chords[1]; tri = CH[c][2]
        x = PL.strum('banjo', [up(p) for p in tri] + [up(tri[0], 24)], BEAT * .5, vel * .9, spread=.012)
        put('banjo_tuba', x, bar(b, bt) - .012, .55, .35)

def brush(b, vel=.5, beats=(1, 2, 3, 4)):
    """Snare brushes: one sweep per beat (band-passed noise, slow attack), plus a light tap on beats 2/4"""
    rng = np.random.default_rng(int(b * 13))
    for bt in beats:
        n = int(BEAT * .9 * SR); w = rng.standard_normal(n)
        w = sosfilt(butter(2, [1800, 7000], 'band', fs=SR, output='sos'), w)
        e = np.linspace(0, 1, n) ** .5 * np.exp(-np.linspace(0, 4, n)); x = (w * e * .05 * vel).astype(np.float32)
        put('drums_fx', x, bar(b, bt), 1, .05)
        if bt in (2, 4): put('drums_fx', S.hit('snare2', 'taps', vel * .7), bar(b, bt), .9, 0)

def snare_back(b, vel=.6):
    for bt in (2, 4): put('drums_fx', S.hit('snare', 'on', vel), bar(b, bt), .8, 0)
    put('drums_fx', S.hit('bass_drum', None, vel * .8), bar(b, 1), .9, 0)
    put('drums_fx', S.hit('bass_drum', None, vel * .7), bar(b, 3), .9, 0)

def roll(t0, t1, v0=.3, v1=.8):
    """Snare roll (sampled roll variant cut to length) + crescendo"""
    d = t1 - t0; x = S.hit('snare', 'roll', .8)
    if len(x) < d * SR: x = np.concatenate([x] * int(np.ceil(d * SR / len(x) + 1)))
    x = x[:int(d * SR)].copy(); x *= np.linspace(v0, v1, len(x), dtype=np.float32); x[-240:] *= np.linspace(1, 0, 240)
    put('drums_fx', x, t0, 1.0, 0)

def cymbal(t, vel=.8, short=False, pan=.1):
    put('drums_fx', S.hit('clash', 'short') if short else S.hit('crash', None, vel), t - .012, .75 if not short else .9, pan)

def slide(t0, d, f0, f1, vel=.25, stem='drums_fx', curve=1.0):
    """Slide whistle: sine + breath noise, exponential glide, light vibrato"""
    n = int(d * SR); u = np.linspace(0, 1, n) ** curve
    f = f0 * (f1 / f0) ** u * (1 + .006 * np.sin(2 * np.pi * 6 * np.arange(n) / SR))
    ph = 2 * np.pi * np.cumsum(f) / SR
    breath = sosfilt(butter(2, [1500, 5000], 'band', fs=SR, output='sos'), np.random.default_rng(3).standard_normal(n)) * .08
    env = np.minimum(1, np.arange(n) / (.03 * SR)) * np.minimum(1, (n - np.arange(n)) / (.05 * SR))
    x = (np.sin(ph) + .12 * np.sin(2 * ph) + breath) * env * vel
    put(stem, x.astype(np.float32), t0, 1, .2)

def boing(t, vel=.35):
    """Spring boing: descending FM chirp + wobble"""
    d = .55; n = int(d * SR); tt = np.arange(n) / SR
    f = 220 * (1 + .9 * np.exp(-tt * 9)) * (1 + .12 * np.sin(2 * np.pi * 18 * tt) * np.exp(-tt * 3))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR + 2.2 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-tt * 5)) * np.exp(-tt * 4.5)
    put('drums_fx', (x * vel).astype(np.float32), t, 1, -.1)

def wood(t, vel=.6, v='c', pan=.25):
    put('drums_fx', S.hit('woodblock', v, vel), t, 1.0, pan)

def mel(inst, b0, notes, vel=.72, pan=0., stem='reeds', legato=.95, gain=1.0, shift=0):
    """notes = [(beats from beat 1 of bar b0, duration in beats, pitch), ...]"""
    for off, d, p in notes:
        if p is None: continue
        pp = up(p, shift) if shift else p
        put(stem, nt(inst, pp, d * BEAT * legato, vel), bar(b0) + off * BEAT, gain, pan)


# ——— Original theme (F major, 4 bars, syncopated) ———
THEME = [(0, .5, 'C5'), (.5, .5, 'D5'), (1, 1, 'F5'), (2, .5, 'A5'), (2.5, 1, 'G5'), (3.5, .5, 'F5'),
         (4, .5, 'D5'), (4.5, .5, 'F5'), (5, 1.5, 'Bb5'), (6.5, .5, 'A5'), (7, 1, 'G5'),
         (8, .5, 'A5'), (8.5, .5, 'F5'), (9, .5, 'C5'), (9.5, 1, 'D5'), (10.5, .5, 'F#5'), (11, 1, 'A5'),
         (12, .5, 'G5'), (12.5, .5, 'F5'), (13, .5, 'E5'), (13.5, .5, 'G5'), (14, 2, 'F5')]
PROG = [['F', 'F'], ['Bb', 'C7'], ['F', 'D7'], ['G7', 'C7']]
SK = [14, 24, 34, 44, 54, 64, 74]; STING = [s + (9.0 if i == 6 else 7.5) for i, s in enumerate(SK)]
tb = lambda t: int(t / BAR) + 1        # bar number of a time

def band(b, k, vel=.5, drums=True):
    ch = PROG[k % 4]; stride(b, ch, vel); oompah(b, ch, vel * .95)
    if drums: brush(b, vel * .8)
def theme(b0, inst='trumpet', vel=.75, stem='brass', shift=0, gain=1.0):
    mel(inst, b0, THEME, vel, .05, stem, .92, gain, shift)

# iris: piano run up + a clarinet glissando, then the vamp
for i, p in enumerate(['F3', 'A3', 'C4', 'F4', 'A4', 'C5', 'F5']): put('piano', nt('upright', p, .5, .5), .2 + i * .12, .7, 0)
for i, p in enumerate(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5']): put('reeds', nt('clarinet', p, .14, .5), .9 + i * .07, .7, -.2)
cymbal(bar(2), .5)
for b in (2, 3): band(b, b - 2, .45)
# title card: the theme on trumpet, full band
cymbal(bar(4), .8)
for b in (4, 5): band(b, b - 4, .62); snare_back(b, .45)
theme(4, vel=.8)            # first half (bars 4–5)
for b in (6, 7): band(b, b - 4, .45)
mel('clarinet', 6, [(0, .5, 'A4'), (1, .5, 'C5'), (2, 1, 'F5'), (4, .5, 'G5'), (5, .5, 'E5'), (6, 1, 'C5')], .45, -.2)
# stations
WALK = ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']
for k, s in enumerate(SK):
    b0 = tb(s); nb = 6 if k == 6 else 5
    band(b0, 0, .55)                                     # walk bar: xylophone steps
    for i in range(8): put('xylo', nt('xylophone', WALK[i] if k % 2 == 0 else WALK[7 - i], BEAT * .4, .55), bar(b0) + i * BEAT / 2, .8, .2)
    for j in range(1, nb): band(b0 + j, j, .42)
    u0 = s + 2; end = s + (12 if k == 6 else 10)
    if k == 0:   # chulha: the फुंकनी is a trumpet, one note per blow, climbing
        pc = ['F4', 'A4', 'C5', 'F5', 'A5', 'C6']
        n = 0
        t = u0 + 1.5
        while t < end - .3: put('brass', nt('trumpet_stac', pc[min(n, 5)], BEAT * .4, .62), t, .9, .1); n += 1; t += BEAT
    if k == 1:   # sil-batta: clarinet chuckles on the rolls
        t = u0 + .5
        while t < end - .3: put('reeds', nt('clarinet_stac', 'A4' if int((t - u0) / BEAT) % 2 else 'C5', BEAT * .3, .5), t + BEAT / 2, .8, -.2); t += BEAT
    if k == 2:   # okhli: the pestle is the bass drum
        t = float(int(u0 + .5) + 1)
        while t < end - .3: put('drums_fx', S.hit('bass_drum', None, .9), t, 1.1, 0); put('banjo_tuba', nt('tuba_stac', 'F2', BEAT * .5, .7), t, 1.0, -.1); t += 1
    if k == 3:   # chakki: a clarinet arpeggio that goes round and round
        t = u0 + .3; arp = ['F4', 'A4', 'C5', 'A4']; i = 0
        while t < end - .3: put('reeds', nt('clarinet', arp[i % 4], BEAT * .45, .45), t, .8, -.2); i += 1; t += BEAT / 2
    if k == 4:   # mathani: trombone smears on every pull
        t = u0 + .4; i = 0
        while t < end - .3: put('brass', nt('trombone', 'F3' if i % 2 else 'C3', BEAT * .9, .5), t, .8, -.1); i += 1; t += BEAT
    if k == 5:   # soop: the xylophone tosses up and down
        t = u0 + .5; i = 0
        while t < end - .3: put('xylo', nt('xylophone', ['C5', 'F5', 'A5', 'F5'][i % 4], BEAT * .3, .5), t, .8, .2); i += 1; t += BEAT / 2
    if k == 6:   # matka: cool vibraphone and a flute breeze
        for j in range(1, nb): put('xylo', S.chord('vibraphone', ['F4', 'A4', 'C5', 'E5'], BAR * .9, .38), bar(b0 + j), .7, .2)
        mel('flute', b0 + 2, [(0, 1, 'C6'), (1, 1, 'A5'), (2, 2, 'F5'), (4, 1, 'G5'), (5, 1, 'A5'), (6, 2, 'C6')], .4, .3)
    # the stinger
    st = STING[k]; cymbal(st, .85)
    for p in ['F4', 'A4', 'C5', 'F5']: put('brass', nt('trumpet_stac', p, .3, .75), st, .8, .1)
    put('brass', nt('trombone_stac', 'F3', .3, .7), st, .9, -.1)
    if k == 2: boing(st + .1, .4)
    if k == 3: slide(st + .05, .9, 900, 500, .2, curve=.5)
    if k == 5: slide(st, .7, 500, 1600, .25)
    HITS[f'sting{k}'] = st
# band stops before two gags (okhli, matka)
STOPS = [(STING[2] - .5, STING[2] - .02), (STING[6] - .5, STING[6] - .02)]
# finale: the theme, tutti
cymbal(bar(44), 1.0)
for b in (44, 45, 46): band(b, b - 44, .7); snare_back(b, .6)
theme(44, vel=.85); theme(44, 'clarinet', .6, 'reeds', shift=-3, gain=.7)
mel('trumpet', 46, [(0, .5, 'C6'), (.5, .5, 'A5'), (1, 1, 'F5'), (2, 2, 'F5')], .85, .05, 'brass')
# end card: softer theme on clarinet under the voice, then the last chord
slide(bar(47), .7, 400, 1400, .2)
for b in range(47, 52): band(b, b - 47, .4)
theme(47, 'clarinet', .5, 'reeds', gain=.8)
mel('clarinet', 51, [(0, .5, 'A4'), (.5, .5, 'C5'), (1, 1, 'F5')], .5, -.1)
put('piano', S.chord('upright', ['F1', 'F2', 'C3', 'F3', 'A3', 'D4', 'F4'], 2.6, .55, strum=.025), bar(52), .8, 0)
for p in ['A4', 'C5', 'F5']: put('brass', nt('trumpet', p, 2.0, .55), bar(52), .5, .1)
cymbal(bar(52), .6)

for k in STEMS: buf[k] = S.room(buf[k], size=.22, mix=.14, damp=.6)
GAIN = {'brass': 1.0, 'reeds': 1.0, 'piano': 1.2, 'banjo_tuba': .95, 'drums_fx': .8, 'xylo': .9}
mix = np.zeros((N, 2), np.float32)
for k in STEMS: mix += buf[k] * GAIN[k]
mix *= .84 / float(np.quantile(np.abs(mix), .9999))
for a, b in STOPS:
    i0, i1, f = int(a * SR), int(b * SR), int(.04 * SR)
    mix[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]; mix[i0:i1] = 0
if np.abs(mix).max() > .89: mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1).astype(np.float32)
sf.write(os.path.join(HERE, 'score.wav'), mix, SR, subtype='PCM_24')
cr = S.credits(['upright', 'trumpet', 'trumpet_stac', 'trombone', 'trombone_stac', 'clarinet', 'clarinet_stac', 'tuba_stac', 'xylophone', 'vibraphone', 'flute', 'snare', 'snare2', 'bass_drum', 'crash', 'clash'])
json.dump({'bpm': BPM, 'dur': DUR, 'hits': HITS, 'stops': STOPS, 'credits': cr}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1, ensure_ascii=False)
print('score', DUR, 's peak', round(float(np.abs(mix).max()), 3)); print(cr)
