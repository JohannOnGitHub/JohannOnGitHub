#!/usr/bin/env bash
# Wraps each workout page body (artifact-style HTML) into a full HTML document
# served by the main site:  workout/app.html -> /workout/,  workout/aw26.html -> /aw26/
set -euo pipefail
cd "$(dirname "$0")/.."
build() {
  local src="$1" out="$2" short="$3"
  mkdir -p "public/$out"
  {
    printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    printf '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">\n'
    printf '<meta name="apple-mobile-web-app-title" content="%s">\n' "$short"
    printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
    printf '</head><body>\n'
    cat "workout/$src"
    printf '\n</body></html>\n'
  } > "public/$out/index.html"
  echo "wrote public/$out/index.html"
}
build app.html workout "Mat &amp; Iron"
build aw26.html aw26 "AW/26"
