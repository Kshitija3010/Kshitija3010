"""intro.py — the 5 s Kathaverse channel intro, made from the channel logo: gold dust gathers, the emblem opens from the
centre, a glint crosses it, then it settles. Writes out/intro-h.mp4 (1920×1080), out/intro-v.mp4 (1080×1920), out/intro.wav.
Run from the library root: .venv/bin/python films/kv-food/intro.py"""
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, LIB)
OUT = os.path.join(D, 'out'); os.makedirs(OUT, exist_ok=True)
FPS, DUR = 24, 5.0; NF = int(FPS * DUR)
SRC = Image.open(os.path.join(D, 'logo_src.png')).convert('RGB')
NAVY = np.array([10, 14, 38], np.float32)
clamp = lambda x, a=0.0, b=1.0: max(a, min(b, x))
eio = lambda t: (lambda u: 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2)(clamp(t))
eo = lambda t: 1 - (1 - clamp(t)) ** 3


def frames(W, H, LS, path):
    rng = np.random.default_rng(7)
    logo = np.asarray(SRC.resize((LS, LS), Image.LANCZOS), np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); cx, cy = W / 2, H / 2
    rr = np.hypot(xx - cx, yy - cy)
    bg = NAVY[None, None] * (1 + 0.55 * np.exp(-(rr / (0.55 * max(W, H))) ** 2))[..., None]
    # faint fixed stars
    st = np.zeros((H, W), np.float32)
    for _ in range(260):
        x, y = rng.integers(0, W), rng.integers(0, H); st[y, x] = rng.uniform(0.25, 0.9)
    st = np.asarray(Image.fromarray((st * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255 * 2.2
    tw = rng.uniform(0, 6.28, (H, W)).astype(np.float32) if False else None
    # dust: particles spiralling into the emblem's rim
    N = 900; R0 = rng.uniform(0.55, 1.1, N) * max(W, H) * 0.6; A0 = rng.uniform(0, 2 * np.pi, N); SP = rng.uniform(0.6, 1.4, N); SZ = rng.uniform(1.2, 3.2, N); DL = rng.uniform(0, 0.6, N)
    gold = np.array([246, 196, 98], np.float32)
    ly, lx = np.mgrid[0:LS, 0:LS].astype(np.float32); lr = np.hypot(lx - LS / 2, ly - LS / 2)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    for f in range(NF):
        t = f / FPS
        img = bg.copy()
        img += (st * (0.75 + 0.25 * np.sin(t * 3 + xx * 0.01)))[..., None] * gold[None, None] * 0.35
        # the emblem opens from the centre (0.7–2.0 s), grows 0.9 → 1.0, with a warm halo
        op = eio((t - 0.7) / 1.3); sc = 0.9 + 0.1 * eo((t - 0.7) / 2.6) + 0.025 * eio((t - 3.6) / 1.4)
        if op > 0:
            S = max(2, int(LS * sc)); L = np.asarray(Image.fromarray(logo.astype(np.uint8)).resize((S, S), Image.LANCZOS), np.float32)
            sy, sx = np.mgrid[0:S, 0:S].astype(np.float32); sr = np.hypot(sx - S / 2, sy - S / 2) / (S / 2)
            m = np.clip((op * 1.08 - sr) / 0.06, 0, 1) * np.clip((1.0 - sr) / 0.02, 0, 1)     # circular reveal, cropped to the round emblem
            # the glint: a soft diagonal band crossing 2.5–3.3 s
            g = (t - 2.5) / 0.8
            if 0 < g < 1:
                d = (sx + sy) / (2 * S) - (g * 1.6 - 0.3); band = np.exp(-(d / 0.05) ** 2) * 0.55
                L = L + band[..., None] * 255 * np.array([1, 0.9, 0.7])
            x0, y0 = int(cx - S / 2), int(cy - S / 2)
            halo = np.exp(-((rr - S * 0.5) / (S * 0.16)) ** 2) * 0.35 * op + np.exp(-(rr / (S * 0.6)) ** 2) * 0.18 * op
            img += halo[..., None] * gold[None, None] * 0.5
            reg = img[y0:y0 + S, x0:x0 + S]; mm = m[..., None]
            img[y0:y0 + S, x0:x0 + S] = reg * (1 - mm) + np.clip(L, 0, 255) * mm
        # dust
        u = np.clip((t - DL) / (2.0 * SP), 0, 1)
        e = 1 - (1 - u) ** 2.2
        r = R0 + (LS * 0.47 - R0) * e; a = A0 + e * 2.4
        al = np.where(u < 1, np.sin(np.pi * np.clip(u, 0, 1)) ** 0.8, 0) * (1 if t < 2.6 else max(0, 1 - (t - 2.6) / 0.4))
        X = (cx + np.cos(a) * r).astype(int); Y = (cy + np.sin(a) * r).astype(int)
        ok = (X >= 2) & (X < W - 2) & (Y >= 2) & (Y < H - 2) & (al > 0.01)
        for x, y, s, v in zip(X[ok], Y[ok], SZ[ok], al[ok]):
            k = int(math.ceil(s)); img[y - k:y + k + 1, x - k:x + k + 1] += gold * v * 0.55
        # the flash when the ring of dust closes (2.0 s)
        fl = math.exp(-((t - 2.05) / 0.12) ** 2) * 0.22
        img += fl * 255 * np.exp(-(rr / (LS * 0.7)) ** 2)[..., None] * np.array([1, 0.85, 0.6])
        img *= min(1, (t + 0.05) / 0.3)
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()


def audio():
    import soundfile as sf
    from core.audio import sampler as Sm
    from core.audio.sfx import SR, add, thump, whoosh, lp, hp
    n = int(DUR * SR); x = np.zeros((n, 2)); rng = np.random.default_rng(3); tt = np.arange(n) / SR
    sw = np.sin(2 * np.pi * 55 * tt) * np.clip(tt / 1.8, 0, 1) ** 2 * np.exp(-np.clip(tt - 2.0, 0, None) * 1.2) * 0.18
    nz = lp(rng.standard_normal(n), 2400, 2) * np.clip(tt / 1.9, 0, 1) ** 3 * np.where(tt < 2.0, 1, np.exp(-(tt - 2.0) * 9)) * 0.08
    x += np.stack([sw + nz, sw + np.roll(nz, 300)], 1)
    Sm.seed(4); ev = []
    for i, p in enumerate([74, 78, 81, 86, 90, 93]): ev.append((0.35 + i * 0.22, 'hand_chimes', p, 1.6, 0.28 + 0.03 * i, -0.4 + 0.16 * i, 0.6))
    for j, p in enumerate([50, 57, 62, 66, 69]): ev.append((2.02 + j * 0.02, 'kalimba', p + 12, 2.6, 0.5, -0.3 + 0.15 * j, 0.7))
    ev.append((2.0, 'contrabass_pizz', 38, 2.0, 0.7, 0, 1.0))
    ev += [(2.55, 'vibraphone', 86, 2.2, 0.32, 0.3, 0.6), (2.75, 'vibraphone', 90, 2.0, 0.26, 0.4, 0.6)]
    m = Sm.render(ev, dur=DUR + 0.5, master=False)[:n]
    m = Sm.room(m, size=0.5, mix=0.25)[:n]; x[:len(m)] += m
    add(x, Sm.hit('gong2', 'small', .5), 2.0, .3, 0); add(x, thump(1.0, 60), 2.0, .45, 0)
    x *= np.clip((DUR - tt) / 0.6, 0, 1)[:, None] ** 0.7
    x = x / (np.abs(x).max() + 1e-9) * 0.85
    sf.write(os.path.join(OUT, 'intro.wav'), x.astype(np.float32), SR)


if __name__ == '__main__':
    audio(); print('intro.wav')
    frames(1920, 1080, 820, os.path.join(OUT, 'intro-h.mp4')); print('intro-h')
    frames(1080, 1920, 920, os.path.join(OUT, 'intro-v.mp4')); print('intro-v')
