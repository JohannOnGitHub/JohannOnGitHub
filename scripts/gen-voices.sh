#!/usr/bin/env bash
# Pre-records the app's lines with the free Piper voice "gilles" (fr_FR),
# into public/voices/<role>/<key>.mp3 + public/voices/manifest.json.
# Needs: pip install piper-tts, ffmpeg, and the voice model:
#   https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-gilles-low.tar.gz
set -euo pipefail
ROLE=${1:-man}
MODEL=${2:?path to fr-gilles-low.onnx}
cd "$(dirname "$0")/.."
OUT=public/voices/$ROLE
mkdir -p "$OUT"
TMP=$(mktemp -d)
npx -y tsx scripts/voice-lines.ts "$ROLE" > "$TMP/lines.json"
python3 - "$TMP/lines.json" "$OUT" "$MODEL" "$TMP" <<'PY'
import json, subprocess, sys, os
lines, out, model, tmp = sys.argv[1:5]
for l in json.load(open(lines)):
    mp3 = f"{out}/{l['key']}.mp3"
    if os.path.exists(mp3):
        continue
    wav = f"{tmp}/{l['key']}.wav"
    subprocess.run(["python3", "-m", "piper", "--model", model, "--output_file", wav], input=l["text"].encode(), check=True, capture_output=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "80k", mp3], check=True)
    print("✓", l["text"][:70])
PY
# Rebuild the manifest from the files present.
python3 - <<'PY'
import os, json
m = {}
for role in sorted(os.listdir("public/voices")):
    d = f"public/voices/{role}"
    if os.path.isdir(d):
        m[role] = {f[:-4]: 1 for f in sorted(os.listdir(d)) if f.endswith(".mp3")}
json.dump(m, open("public/voices/manifest.json", "w"), separators=(",", ":"))
print({r: len(v) for r, v in m.items()})
PY
