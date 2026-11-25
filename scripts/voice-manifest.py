# Rebuilds public/voices/manifest.json from the recorded files.
import os, json
m = {}
for role in sorted(os.listdir("public/voices")):
    d = f"public/voices/{role}"
    if os.path.isdir(d):
        m[role] = {f[:-4]: 1 for f in sorted(os.listdir(d)) if f.endswith(".mp3")}
json.dump(m, open("public/voices/manifest.json", "w"), separators=(",", ":"))
print({r: len(v) for r, v in m.items()})
