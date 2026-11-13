"""Narration timing → voice/cues.json (starts + subtitle cues) and kv-food.srt. Starts = previous end + GAP[id]."""
import json, os, re
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = os.path.join(D, 'voice')
lines = json.load(open(os.path.join(V, 'lines.json'), encoding='utf-8')); dur = json.load(open(os.path.join(V, 'dur.json')))
GAP = {'L1': 0.7, 'L2': 0.6, 'L3': 0.35, 'L4': 1.0, 'L5': 0.9, 'L6': 0.45, 'L7': 1.0, 'L8': 1.0, 'L9': 0.35, 'L10': 0.35,
       'L11': 0.8, 'L12': 1.2, 'L13': 0.45, 'L14': 1.0, 'L15': 1.1, 'L16': 0.9, 'L17': 1.4, 'L18': 0.6}
TAIL = 3.0
start, t = {}, 0.0
for L in lines:
    t += GAP[L['id']]; start[L['id']] = round(t, 3); t += dur[L['id']]
DUR = round(t + TAIL, 3)
MAXC = 64
cues = []
for L in lines:
    i, s, d, txt = L['id'], start[L['id']], dur[L['id']], L['sub']
    parts = [txt]
    if len(txt) > MAXC:   # split at the sentence/comma break nearest the middle
        cands = [m.end() for m in re.finditer(r'[।,:?!]\s', txt)]
        if cands:
            k = min(cands, key=lambda c: abs(c - len(txt) / 2)); parts = [txt[:k].strip(), txt[k:].strip()]
    tot = sum(len(p) for p in parts); t0 = s
    for j, p in enumerate(parts):
        sp = d * len(p) / tot
        cues.append({'id': f'{i}{"ab"[j] if len(parts) > 1 else ""}', 't0': round(t0 - (0.25 if j == 0 else 0), 3), 't1': round(t0 + sp + (0.6 if j == len(parts) - 1 else 0.1), 3), 'text': p, 'spoken': sp})
        t0 += sp
cues.sort(key=lambda c: c['t0'])
for a, b in zip(cues, cues[1:]):
    if a['t1'] > b['t0'] - 0.04: a['t1'] = round(b['t0'] - 0.04, 3)
json.dump({'start': start, 'dur': dur, 'film': DUR, 'cues': cues}, open(os.path.join(V, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
fmt = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
with open(os.path.join(D, 'kv-food.srt'), 'w', encoding='utf-8') as f:
    for n, c in enumerate(cues, 1): f.write(f"{n}\n{fmt(c['t0'])} --> {fmt(c['t1'])}\n{c['text']}\n\n")
short = [c['id'] for c in cues if c['t1'] - c['t0'] < max(1.5, c['spoken'] + 0.3)]
print('film', DUR, 's ·', len(cues), 'cues', '· short:', short)
for k, v in start.items(): print(k, v, round(v + dur[k], 2))
