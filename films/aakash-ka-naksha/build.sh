#!/bin/sh
# One command: आकाश का नक्शा (Silkscreen Travel Poster), ~126 s, 1920×1080, 24 fps
#   sh build.sh              voice (if missing), cues + subtitles, events, score, mix, picture, master, poster
#   VOICE=1 sh build.sh      regenerate the narration
# Needs: setup.sh deps voice music; sh tools/fetch.sh instruments vcsl; ffmpeg 7+ on PATH
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; WORKERS=${WORKERS:-4}
cd "$LIB"
mkdir -p "$HERE/out/voice"
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/L15.wav" ]; then "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"; fi
"$PY" "$HERE/tools/cues.py"
node core/render/events.mjs "$HERE"
"$PY" "$HERE/music/compose.py"
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/aakash-ka-naksha.mp4" 24 1
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || grep -v '^OK' "$HERE/out/readcheck.txt" | tail -8
node core/render/still.mjs "$HERE" 99 --q nocap=1 --out "$HERE/out/poster" > /dev/null
ffmpeg -v error -y -i "$HERE/out/poster/t_99.jpg" -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/aakash-ka-naksha.mp4"
