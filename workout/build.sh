#!/usr/bin/env bash
# Wraps the shared training app (workout/training.html, artifact-style page body)
# into a full HTML document. The same app is served at /training/, /workout/ and /aw26/
# (the old addresses keep working and share the same saved data on the site).
set -euo pipefail
cd "$(dirname "$0")/.."
for out in training workout aw26; do
  mkdir -p "public/$out"
  {
    printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    printf '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">\n'
    printf '<meta name="apple-mobile-web-app-title" content="Training">\n'
    printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
    printf '</head><body>\n'
    cat workout/training.html
    printf '\n</body></html>\n'
  } > "public/$out/index.html"
  echo "wrote public/$out/index.html"
done
