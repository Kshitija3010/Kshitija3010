"""assemble.py <h|v> · Kathaverse intro (5 s) + thumbnail card (1.5 s) + film → deliver/01-pehli-roti-(16x9|shorts).mp4,
mastered to −14 LUFS; also the cover image and (for 16:9) the subtitles shifted by 6.5 s. Run from the library root."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, thump
from core.audio import sampler as S
from scipy.signal import resample_poly
f = sys.argv[1]; tag = '16x9' if f == 'h' else 'shorts'; W, H = (1920, 1080) if f == 'h' else (1080, 1920)
NAME = '01-pehli-roti'; O = os.path.join(D, 'out'); DL = os.path.join(D, 'deliver'); os.makedirs(DL, exist_ok=True)
INTRO, THD = 5.0, 1.5
run = lambda *a: subprocess.run(a, check=True)
ff = lambda *a: run('ffmpeg', '-v', 'error', '-y', *a)
th = os.path.join(O, f'thumbcard-{f}')
run('node', os.path.join(LIB, 'core/render/still.mjs'), D, '0', '--q', f'f={f}&thumb=1', '--size', f'{W}x{H}', '--out', th)
still = os.path.join(th, 't_0.jpg')
ff('-i', still, '-q:v', '2', os.path.join(DL, f'{NAME}-{tag}-thumbnail.jpg'))
vid = os.path.join(O, f'full-{f}.mp4')
ff('-i', os.path.join(O, f'intro-{f}.mp4'), '-loop', '1', '-t', str(THD), '-framerate', '24', '-i', still, '-i', os.path.join(O, f'video-{f}.mp4'),
   '-filter_complex', f'[0:v]setsar=1,format=yuv420p[a];[1:v]scale={W}:{H},fps=24,setsar=1,format=yuv420p[b];[2:v]setsar=1,format=yuv420p[c];[a][b][c]concat=n=3:v=1:a=0[v]',
   '-map', '[v]', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-r', '24', vid)
x, sr = sf.read(os.path.join(O, 'intro.wav')); x = x if x.ndim == 2 else np.stack([x, x], 1)
if sr != SR: x = resample_poly(x, SR, sr, axis=0)
x = np.vstack([x, np.zeros((max(0, int(INTRO * SR) - len(x)), 2))])[:int(INTRO * SR)] * 0.8
card = np.zeros((int(THD * SR), 2)); S.seed(5)
add(card, thump(0.9, 70), 0.0, .4, 0); add(card, S.note('kalimba', 86, 1.4, .5), .03, .35, .2); add(card, S.note('kalimba', 90, 1.2, .4), .12, .25, -.2)
m, _ = sf.read(os.path.join(O, 'mix.wav')); dur = json.load(open(os.path.join(D, 'events.json')))['dur']; m = m[:int(dur * SR)]
full = np.vstack([x, card, m]); wav = os.path.join(O, f'full-{f}.wav'); sf.write(wav, full.astype(np.float32), SR)
out = os.path.join(DL, f'{NAME}-{tag}.mp4')
run('sh', os.path.join(LIB, 'core/render/mux.sh'), vid, wav, out, '24', '1')
if f == 'h':
    cues = json.load(open(os.path.join(D, 'voice', 'cues.json'), encoding='utf-8'))['cues']; off = INTRO + THD
    ts = lambda s: f"00:{int(s // 60):02d}:{int(s % 60):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    with open(os.path.join(DL, f'{NAME}.srt'), 'w', encoding='utf-8') as fh:
        for i, c in enumerate(cues, 1): fh.write(f"{i}\n{ts(c['t0'] + off)} --> {ts(c['t1'] + off)}\n{c['text']}\n\n")
print('assembled', out)
