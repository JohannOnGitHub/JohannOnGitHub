#!/usr/bin/env bash
# Wraps workout/app.html (artifact-style page body) into a full HTML document
# served by the main site at /workout/.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/workout
{
  printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  printf '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">\n'
  printf '<meta name="apple-mobile-web-app-title" content="Mat &amp; Iron">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
  printf '</head><body>\n'
  cat workout/app.html
  printf '\n</body></html>\n'
} > public/workout/index.html
echo "wrote public/workout/index.html"
