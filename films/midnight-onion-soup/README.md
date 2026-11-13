# ↻ midnight onion soup ˚. ✦

A 26 s vertical anime-style cooking Short (1080×1920, 24 fps), made with the `anime-cooking` skill, drawn entirely in code. No AI video credits used.

▶ [midnight-onion-soup.mp4](midnight-onion-soup.mp4)

| # | Time | Shot | Camera | Sound |
|---|---|---|---|---|
| 1 | 0–4.5 s | Fridge door opens, the bulb flickers on: jug, honey jar, water bottle, onion, eggs | slow push-in | fridge hum, door seal pop |
| 2 | 4–8 s | Onion on the board, sparkle, warm light leak | slow push-in | soft knock |
| 3 | 7.5–12 s | Knife slices the onion, five chops, juice sparkles | slow pull-out | knife on board ×5 |
| 4 | 11.5–16 s | Water poured into the "a quiet night" measuring jug with paw-print marks | slow push-in | pour, rising pitch |
| 5 | 15.5–20 s | Top-down pot: golden broth, onion rings, bubbles, blue flame, steam | slow push-in + turn | simmer, bubbles |
| 6 | 19.5–26 s | The bowl by a rainy night window, steam, sparkles, caption | slow pull-out | rain (half a second of quiet first) |

Music: soft lo-fi electric piano (Fmaj7 – Em7 – Dm7 – Cmaj7, 70 bpm), synthesized in `audio.cjs`.

## Re-render

```sh
node audio.cjs     # writes audio.wav
node render.cjs    # writes midnight-onion-soup.mp4 (about 5 min)
node render.cjs stills 2 10 23   # quick still frames for checking
```

Open `index.html` in a browser to watch it live. Change colours, timing or props in `film.js`.
