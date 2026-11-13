---
name: anime-cooking
description: >-
  Plan and generate short anime-style cooking and slice-of-life videos: soft
  cinematic kitchens, glowing fridge light, glossy food, quiet ASMR mood.
  Writes the shot list, the per-shot video prompts and the sound design, then
  can generate the clips (vidIQ video tool) or hand off prompts for any AI
  video app. Use for "anime cooking video", "make it look like anime food",
  "aesthetic anime reel", "Ghibli-like / cozy anime kitchen", "anime ASMR".
---

# anime-cooking

These reels feel calm, not busy. Every shot is a still-life that moves a little: light shifts,
steam rises, a hand pours. The viewer should be able to pause any frame and save it as wallpaper.

## 1. Ask (only what is missing)

- **Dish or moment**: what is being cooked, or just "midnight snack from the fridge".
- **Length and format**: default 15–30 s, vertical 9:16 for Reels/Shorts.
- **Mood**: cozy morning, rainy evening, late night, summer. Default: late night, quiet.
- **People?** Default: hands only, no faces (keeps clips consistent between shots).

## 2. The look (put these in every prompt)

Write each prompt from this palette so the shots match each other:

| Element | What to write |
|---|---|
| Medium | "2D hand-painted anime film still, cel-shaded objects over painted backgrounds, cinematic" |
| Light | one motivated source: fridge light, window at golden hour, a single pendant lamp. Soft bloom, light leaks, lens flare on glass and water |
| Colour | night: teal, cool blue, cyan highlights with one warm accent (onion skin, egg yolk, tea). Day: warm cream, peach, pale green |
| Camera | close-ups and macro, shallow depth of field, blurred foreground, slow push-in or slow pan only |
| Objects | everyday items drawn lovingly: measuring jug with tick marks, water bottle with label, ceramic bowls, wooden spoon, tiles behind |
| Food | glossy, oversaturated, sparkle highlights, visible steam, sizzling oil dots, jiggle on eggs and jelly |
| Details | small cute touches, e.g. paw prints on measuring marks, a handwritten label, a sticky note |
| Avoid | "3D render, photorealistic, plastic, text artifacts, extra fingers, fast cuts, shaky camera" |

Do not name a real studio, film, director or character in prompts. Describe the look in the
words above instead; it gives better consistency and stays original.

## 3. Shot list (the structure)

A 20–30 s reel is usually 6–10 shots of 2–4 s each:

1. **Establish**: the light source opens (fridge door, curtain, lamp click). Wide-ish, quiet.
2. **Ingredients**: 2–3 macro shots, one item each, slow push-in.
3. **Action**: cutting, pouring, cracking, stirring. Hands only. One clear motion per shot.
4. **Transformation**: heat, sizzle, steam, simmer. The most "alive" shot.
5. **Plating**: top-down or 3/4 angle, garnish falls in.
6. **Payoff**: finished dish with sparkle, steam and a slow pull-out. Optional cosy cutaway (window rain, cat, tea).

Write the list as a table: `# | seconds | shot | camera move | sound`.

## 4. Prompt template (one per shot)

```
2D hand-painted anime film still, cinematic, [SHOT: e.g. close-up of a hand pouring water
into a glass measuring jug with red tick marks], inside an open refrigerator, cool blue fridge
light, soft bloom, light reflecting on glass and water, shallow depth of field, blurred
foreground, [ONE MOTION: slow push-in / water ripples / steam rises], calm late-night mood,
teal and cyan palette with a warm accent, highly detailed background, gentle movement.
Avoid: 3D, photorealistic, text artifacts, extra fingers, fast motion.
```

Keep one motion per prompt. Video models break when asked for several actions at once.

## 5. Generate

**With the vidIQ tool** (`vidiq_generate_video`), if it is connected:
- Tell the user the total cost before starting several shots; each shot is charged on submit.
- Use `aspectRatio: "9:16"`, `duration` 4–6 s, `resolution: "768p"` with `minimax-h3`
  (or `seedance-2` at 1080p for sharper results).
- For consistency between shots, generate one key frame first (canvas-design skill or any image
  app), then pass it as `startFrameB64` or `ingredients`.
- Poll `vidiq_job_poll` with each `mcpJobId`. Never resubmit a pending shot.

**Without it**: hand the prompts over, ready to paste into any AI video app (image-to-video works
best: make the still first in an image app, then animate it).

## 6. Sound (this is half the effect)

- No talking. Soft lo-fi or piano bed at low volume (`vidiq_generate_music` can make one:
  "soft lo-fi piano, rain, 70 bpm, cozy late night").
- Foley on every action: fridge hum, door seal pop, water pour, knife on board, sizzle, spoon on bowl.
- Cut on the sound, not the beat. Leave 0.5 s of quiet before the payoff shot.

## 7. Edit and caption

- Gentle cross-dissolves or straight cuts; no zooms, no flashy transitions.
- Add light grain, a slight bloom and a soft vignette over everything so clips from different
  generations match.
- Caption style: short, lowercase, aesthetic: "↻ midnight onion soup ˚. ✦". Add the recipe in
  the description, not on screen.

## Output

Give the user, in this order: the mood line, the shot table, one prompt per shot, the sound
list, then offer to generate (with the cost) or export everything to a file.
