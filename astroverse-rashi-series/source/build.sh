#!/bin/sh
# Astroverse rashi series · sh build.sh [ids…]  (default: all 12)
# per rashi: cues, events, score + mix, 16:9 and 9:16 pictures; then intro + thumbnail card + film, master (−14 LUFS) → deliver/
# Needs: setup.sh deps voice music; tools/fetch.sh instruments vcsl; ffmpeg 7+ on PATH; voices made by tts.py (VOICE=1 to remake)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
PY="$LIB/.venv/bin/python"; WORKERS=${WORKERS:-4}
IDS=${*:-"mesh vrishabh mithun kark simha kanya tula vrishchik dhanu makar kumbh meen"}
cd "$LIB"; mkdir -p "$HERE/deliver"
"$PY" "$HERE/tools/make_content.py" > /dev/null
for r in $IDS; do
  N=$("$PY" -c "import json;print('%02d'%next(a['n'] for a in json.load(open('$HERE/rashi.json')) if a['id']=='$r'))")
  mkdir -p "$HERE/out/$r"
  if [ -f "$HERE/deliver/$N-$r-shorts.mp4" ] && [ -f "$HERE/deliver/$N-$r-16x9.mp4" ]; then echo "skip $N $r"; continue; fi
  if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/$r/L9.wav" ]; then "$PY" core/tts/tts.py "$HERE/voice/$r.json" "$HERE/out/voice/$r" > /dev/null; fi
  "$PY" "$HERE/tools/cues.py" "$r"
  node core/render/events.mjs "$HERE" --q "r=$r&f=h" --out "$HERE/out/$r/events.json" > /dev/null 2>&1
  "$PY" "$HERE/audio.py" "$r"
  for f in h v; do
    if [ $f = h ]; then SZ=1920x1080; else SZ=1080x1920; fi
    [ -f "$HERE/deliver/$N-$r-$( [ $f = h ] && echo 16x9 || echo shorts ).mp4" ] && continue
    node core/render/video.mjs "$HERE" --q "r=$r&f=$f" --size $SZ --fps 24 --workers "$WORKERS" --out "$HERE/out/$r/video-$f.mp4" > "$HERE/out/$r/render-$f.log" 2>&1
    "$PY" "$HERE/assemble.py" "$r" $f > "$HERE/out/$r/assemble-$f.log" 2>&1 || { tail -5 "$HERE/out/$r/assemble-$f.log"; exit 1; }
  done
  echo "done $N $r"
done
