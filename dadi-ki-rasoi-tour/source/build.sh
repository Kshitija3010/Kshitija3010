#!/bin/sh
# Kathaverse · दादी की रसोई का टूर (1930s Rubber Hose Cartoon), Hindi, 16:9 (4:3 gate) + 9:16 (3:4 gate)
# Needs: setup.sh deps voice music; tools/fetch.sh instruments vcsl vsco2ce; ffmpeg 7+; the Kathaverse intro (out/intro-h.mp4, intro-v.mp4, intro.wav: films/kv-food/intro.py)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
PY="$LIB/.venv/bin/python"; WORKERS=${WORKERS:-3}; cd "$LIB"
[ -f "$HERE/voice/L12.wav" ] || "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"
node core/render/events.mjs "$HERE" --q f=h
"$PY" "$HERE/music/score.py"
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --q f=h --fps 24 --workers "$WORKERS" --out "$HERE/out/video-h.mp4"
node core/render/video.mjs "$HERE" --q f=v --size 1080x1920 --fps 24 --workers "$WORKERS" --out "$HERE/out/video-v.mp4"
"$PY" "$HERE/assemble.py" h; "$PY" "$HERE/assemble.py" v
echo "done: $HERE/deliver/"
