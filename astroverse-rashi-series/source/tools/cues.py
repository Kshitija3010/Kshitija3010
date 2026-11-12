"""cues.py <id> · voice slots (film clock, 84 BPM grid) → voice/<id>-cues.json and out/<id>.srt"""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = 60 / 84; BAR = 4 * B
SLOT = {'L1': .5, 'L2': 3.5, 'L3': 6, 'L4': 9.5, 'L5': 13, 'L6': 17.5, 'L7': 21, 'L8': 25.5, 'L9': 28}
def run(rid):
    lines = json.load(open(os.path.join(D, 'voice', rid + '.json'), encoding='utf-8'))
    dur = json.load(open(os.path.join(D, 'out/voice', rid, 'dur.json')))
    cues = [{'id': L['id'], 'vo': round(SLOT[L['id']] * BAR, 3), 'dur': dur[L['id']], 'text': L['sub']} for L in lines]
    for i, c in enumerate(cues):
        c['t0'] = c['vo']; c['t1'] = round(c['vo'] + max(1.8, c['dur'] + .6), 3)
        if i + 1 < len(cues):
            nx = cues[i + 1]['vo']
            if c['vo'] + c['dur'] > nx - .15: sys.exit(f'{rid}: {c["id"]} runs into the next line')
            c['t1'] = min(c['t1'], round(nx - .05, 3))
    json.dump(cues, open(os.path.join(D, 'voice', rid + '-cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ts = lambda x: f"00:{int(x // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)) % 1000:03d}"
    os.makedirs(os.path.join(D, 'out'), exist_ok=True)
    with open(os.path.join(D, 'out', rid + '.srt'), 'w', encoding='utf-8') as f:
        for i, c in enumerate(cues, 1): f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
for rid in sys.argv[1:]: run(rid)
