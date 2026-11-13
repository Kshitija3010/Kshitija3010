# Brand ads · glass studio

Four 14 s vertical product ads (1080×1920, 24 fps), drawn entirely in code in a glossy "glass studio" look: dark studio, glass pedestals and cubes, floor reflections, caustics, light sweeps, gold dust and bloom.

**All four brands are invented for these ads.** They are not real companies, and they are not linked to any real brand. Before using a name commercially, check it isn't already taken in your market.

| Ad | Brand (made up) | Story | Music |
|---|---|---|---|
| [biscuit.mp4](biscuit.mp4) | **Milky Moon** glucose biscuits | the pack rises on a glass pedestal → biscuits tumble into a stack → "Dip. Crunch. Smile." milk splash → end card | bouncy marimba, 112 bpm |
| [lipstick.mp4](lipstick.mp4) | **Rooh** matte lipstick | closed tube on a glass cube with petals → cap lifts, bullet twists up ("Chai Rose · 07") → swatch on glass → three shades on glass steps | dark pad + sub, 92 bpm |
| [saree.mp4](saree.mp4) | **Taana Baana** silk sarees | silk ribbons flow through the dark → folded sarees on a glass pedestal → gold zari border close-up, thread being woven → end card | tanpura drone, sitar-like plucks, tabla-ish beat |
| [saree-ink.mp4](saree-ink.mp4) | **Taana Baana** in ink wash | an ink drop blooms into one long dry-brush stroke of silk, pink bleeds in, a gold border follows → three sarees drying on a bamboo pole before misty mountains → ताना (warp) and बाना (weft) woven by a shuttle → hand-lettered name and a red seal | slower tanpura and plucks, brush swishes, shuttle clicks, seal thump |
| [jewellery.mp4](jewellery.mp4) | **Sonehri** fine jewellery | solitaire ring rises and turns → diamond close-up with fire → emerald necklace swings down → end card | bells + warm pad, impact on the logo |

## Files

- `lib.js`: the shared glass-studio engine (pedestal, cube, reflection, caustics, sweep, dust, titles, post).
- `biscuit.js`, `lipstick.js`, `saree.js`, `jewellery.js`: one file per ad.
- `saree-ink.js`: the ink-wash version (paper texture, dry brush, pigment washes, seal). Hand lettering uses the Kalam font (SIL OFL, `fonts/OFL.txt`).
- `audio.cjs`: synthesizes each soundtrack (no samples, no licensed music).
- `render.cjs`: renders a video through headless Chromium + ffmpeg.

```sh
node audio.cjs saree && node render.cjs saree        # → saree.mp4 (about 3 min)
node render.cjs saree stills 2 6 10                  # still frames for checking
```

Open `index.html?film=saree` in a browser to watch an ad live. To reuse an ad for a real client, change the name, colours and taglines at the top of its file.
