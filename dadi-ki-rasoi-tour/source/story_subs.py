"""Subtitle cues from story.js VO times + voice/lines.json + voice/dur.json (same rule as story.js subs())."""
import json, os, re
def load(D):
    vo = dict(re.findall(r"(L\d+): ([\d.]+)", open(os.path.join(D, 'story.js'), encoding='utf-8').read().split('export const VO = {')[1].split('}')[0]))
    lines = {L['id']: L['sub'] for L in json.load(open(os.path.join(D, 'voice', 'lines.json'), encoding='utf-8'))}
    dur = json.load(open(os.path.join(D, 'voice', 'dur.json')))
    return [{'t0': float(t) - .15, 't1': float(t) + dur[i] + .5, 'text': lines[i]} for i, t in vo.items()]
