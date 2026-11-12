"""cues.py · voice start times (film clock) → voice/cues.json and aakash-ka-naksha.srt.
Subtitle shown from the line's start to speech end + 0.6 s (never < 1.8 s), never overlapping the next line."""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = 60 / 84
START = {  # film seconds (on the 84 bpm grid where it matters)
 'L01': 6 * B, 'L02': 15 * B, 'L03': 21.5 * B, 'L04': 31.5 * B, 'L05': 41 * B,
 'L06': 49.5 * B, 'L07': 65.5 * B, 'L08': 79 * B, 'L09': 97.5 * B,
 'L10': 114 * B, 'L11': 118 * B, 'L12': 129 * B, 'L13': 145 * B, 'L14': 154 * B, 'L15': 163 * B}
lines = json.load(open(os.path.join(D, 'voice/lines.json'), encoding='utf-8'))
dur = json.load(open(os.path.join(D, 'out/voice/dur.json')))
cues = []
for i, L in enumerate(lines):
    t0 = round(START[L['id']], 3); t1 = t0 + max(1.8, dur[L['id']] + .6)
    cues.append({'id': L['id'], 'vo': t0, 't0': t0, 't1': round(t1, 3), 'text': L['sub'], 'dur': dur[L['id']]})
for a, b in zip(cues, cues[1:]):
    if a['vo'] + a['dur'] > b['vo'] - .15: sys.exit(f"cues.py: {a['id']} speech runs into {b['id']}")
    a['t1'] = min(a['t1'], round(b['t0'] - .05, 3))
json.dump(cues, open(os.path.join(D, 'voice/cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
def ts(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
with open(os.path.join(D, 'aakash-ka-naksha.srt'), 'w', encoding='utf-8') as f:
    for i, c in enumerate(cues, 1): f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
for c in cues: print(c['id'], c['t0'], round(c['vo'] + c['dur'], 2), c['t1'])
