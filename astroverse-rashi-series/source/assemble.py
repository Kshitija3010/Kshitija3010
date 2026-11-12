"""assemble.py <id> <h|v> · intro (5 s) + thumbnail card (1.5 s) + film → deliver/NN-id-(16x9|shorts).mp4, mastered −14 LUFS.
Also writes the cover image and the subtitles shifted by 6.5 s."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, add, thump
import sampler as S
from scipy.signal import resample_poly
rid, f = sys.argv[1], sys.argv[2]
A = json.load(open(os.path.join(D, 'rashi.json'), encoding='utf-8')); R = next(a for a in A if a['id'] == rid)
N = f"{R['n']:02d}"; tag = '16x9' if f == 'h' else 'shorts'; W, H = (1920, 1080) if f == 'h' else (1080, 1920)
O = os.path.join(D, 'out', rid); DL = os.path.join(D, 'deliver'); os.makedirs(DL, exist_ok=True)
INTRO, THD = 5.0, 1.5
run = lambda *a: subprocess.run(a, check=True)
ff = lambda *a: run('ffmpeg', '-v', 'error', '-y', *a)
# intro, adapted once per format
iv = os.path.join(D, 'out', f'intro-{f}.mp4')
if not os.path.exists(iv):
    if f == 'h': ff('-i', os.path.join(D, 'intro.mp4'), '-vf', 'fps=24,scale=1920:1080,format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '16', iv)
    else: ff('-i', os.path.join(D, 'intro.mp4'), '-filter_complex', 'color=c=0x0E1430:s=1080x1920:r=24[bg];[0]fps=24,scale=1460:-2,crop=1080:ih,format=yuva420p,geq=lum=\'lum(X,Y)\':cb=\'cb(X,Y)\':cr=\'cr(X,Y)\':a=\'255*min(1\\,min(Y\\,H-Y)/150)\'[fg];[bg][fg]overlay=0:(H-h)/2:shortest=1,format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '16', iv)
ia = os.path.join(D, 'out', 'intro.wav')
if not os.path.exists(ia): ff('-i', os.path.join(D, 'intro.mp4'), '-vn', '-ac', '2', '-ar', str(SR), ia)
# thumbnail card still
th = os.path.join(O, f'thumbcard-{f}')
run('node', os.path.join(LIB, 'core/render/still.mjs'), D, '0', '--q', f'r={rid}&f={f}&thumb=1', '--size', f'{W}x{H}', '--out', th)
still = os.path.join(th, 't_0.jpg')
ff('-i', still, '-q:v', '2', os.path.join(DL, f'{N}-{rid}-{tag}-thumbnail.jpg'))
# picture: intro + card + film
vid = os.path.join(O, f'full-{f}.mp4')
ff('-i', iv, '-loop', '1', '-t', str(THD), '-framerate', '24', '-i', still, '-i', os.path.join(O, f'video-{f}.mp4'),
   '-filter_complex', f'[0:v]setsar=1,format=yuv420p[a];[1:v]scale={W}:{H},fps=24,setsar=1,format=yuv420p[b];[2:v]setsar=1,format=yuv420p[c];[a][b][c]concat=n=3:v=1:a=0[v]',
   '-map', '[v]', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-r', '24', vid)
# sound: intro audio + a card hit (gong + chime) + the film mix
x, sr = sf.read(ia); x = x if x.ndim == 2 else np.stack([x, x], 1)
if sr != SR: x = resample_poly(x, SR, sr, axis=0)
x = np.vstack([x, np.zeros((max(0, int(INTRO * SR) - len(x)), 2))])[:int(INTRO * SR)] * .9
card = np.zeros((int(THD * SR), 2)); S.seed(5)
add(card, S.hit('gong2', 'small', .55), 0.02, .35, 0); add(card, thump(.9, 70), 0.0, .45, 0); add(card, S.note('hand_chimes', 88, 1.4, .5), .05, .3, .2)
m, _ = sf.read(os.path.join(O, 'mix.wav')); dur = json.load(open(os.path.join(O, 'events.json')))['dur']; m = m[:int(dur * SR)]
full = np.vstack([x, card, m]); sf.write(os.path.join(O, f'full-{f}.wav'), full.astype(np.float32), SR)
out = os.path.join(DL, f'{N}-{rid}-{tag}.mp4')
run('sh', os.path.join(LIB, 'core/render/mux.sh'), vid, os.path.join(O, f'full-{f}.wav'), out, '24', '1')
# subtitles, shifted
if f == 'h':
    cues = json.load(open(os.path.join(D, 'voice', rid + '-cues.json'), encoding='utf-8')); off = INTRO + THD
    ts = lambda s: f"00:{int(s // 60):02d}:{int(s % 60):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    with open(os.path.join(DL, f'{N}-{rid}.srt'), 'w', encoding='utf-8') as fh:
        for i, c in enumerate(cues, 1): fh.write(f"{i}\n{ts(c['t0'] + off)} --> {ts(c['t1'] + off)}\n{c['text']}\n\n")
print('assembled', out)
