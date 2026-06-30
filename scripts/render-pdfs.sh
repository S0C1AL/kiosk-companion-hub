#!/bin/bash
# Rasterize every PDF in /etc/kiosk/game-plans/ to JPEGs so the kiosk
# can render them as a plain scroll of <img> elements (smooth on the Pi).
# Requires: sudo apt install -y poppler-utils
set -e
SRC="${KIOSK_GAME_PLANS_DIR:-/etc/kiosk/game-plans}"
OUT="${KIOSK_GAME_PLANS_RENDERED_DIR:-/etc/kiosk/game-plans-rendered}"
OWNER="${KIOSK_OWNER:-jkriha:jkriha}"

mkdir -p "$OUT"

shopt -s nullglob
for pdf in "$SRC"/*.pdf; do
  name=$(basename "$pdf" .pdf)
  dir="$OUT/$name"
  echo "Rendering $pdf -> $dir"
  rm -rf "$dir"
  mkdir -p "$dir"
  pdftoppm -jpeg -r 110 -jpegopt quality=82 "$pdf" "$dir/page"
  (cd "$dir" && ls page-*.jpg 2>/dev/null | sort > pages.txt)
done

chown -R "$OWNER" "$OUT" 2>/dev/null || true
echo "Done."