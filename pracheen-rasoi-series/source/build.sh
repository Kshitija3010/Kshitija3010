#!/bin/sh
# Kathaverse · प्राचीन रसोई · Ep 1 · दुनिया की पहली रोटी (Tablet Sketch Explainer), Hindi, 16:9 + 9:16
#   voice (if missing) → cues + .srt → events → mix → Kathaverse intro → pictures (h, v) → intro + thumbnail card + film, −14 LUFS → deliver/
# Needs: setup.sh deps voice music; tools/fetch.sh instruments vcsl freepats karoryfer; ffmpeg 7+ on PATH; logo_src.png (channel logo)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
PY="$LIB/.venv/bin/python"; WORKERS=${WORKERS:-2}
cd "$LIB"
[ -f "$HERE/logo.png" ] || "$PY" -c "from PIL import Image; Image.open('$HERE/logo_src.png').convert('RGB').resize((800,800)).save('$HERE/logo.png')"
if [ ! -f "$HERE/voice/L18.wav" ]; then "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"; fi
"$PY" "$HERE/tools/cues.py"
node core/render/events.mjs "$HERE" --q f=h
"$PY" "$HERE/mix.py"
[ -f "$HERE/out/intro-v.mp4" ] || "$PY" "$HERE/intro.py"
node core/render/video.mjs "$HERE" --q f=h --fps 24 --workers "$WORKERS" --out "$HERE/out/video-h.mp4"
node core/render/video.mjs "$HERE" --q f=v --size 1080x1920 --fps 24 --workers "$WORKERS" --out "$HERE/out/video-v.mp4"
"$PY" "$HERE/assemble.py" h
"$PY" "$HERE/assemble.py" v
echo "done: $HERE/deliver/"
