#!/usr/bin/env bash
#
# Transcode camera masters into web-ready derivatives.
#
# The masters in public/media/<Project>/ are 4K at 40-113 Mbps and total ~27GB.
# They are gitignored and must never be served directly. This script produces
# three derivatives per project into public/media/derived/<slug>/:
#
#   loop.mp4    ~10s, silent, long-side 1920, CRF 28 -> the ambient loop used
#               by the home reel and the /stories card previews.
#   film.mp4    full piece, long-side 1920, CRF 23 + AAC -> the fullscreen player.
#   poster.jpg  a single frame from the loop's start point.
#
# Encoding rules that matter (see docs/plan/05-real-media.md):
#   - `-movflags +faststart` so playback can begin before the file is complete.
#   - Loops carry NO audio track: they are never audible, so it is pure waste.
#   - Long side is capped at 1920 rather than forcing 16:9, because the sources
#     include vertical (1080x1920) and ultrawide (4096x1716) pieces and their
#     real aspect ratios drive the layout.
#
# Usage:
#   ./scripts/encode-media.sh                        # everything
#   ./scripts/encode-media.sh loops                  # loops + posters only (fast)
#   ./scripts/encode-media.sh films                  # films only (slow)
#   ./scripts/encode-media.sh all shoreline-f150-raptor   # one project only
#
# The optional second argument limits the run to a single slug, so re-cutting
# one piece does not mean re-encoding the whole slate.

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

MEDIA="$(cd "$(dirname "$0")/.." && pwd)/public/media"
OUT="$MEDIA/derived"
MODE="${1:-all}"
ONLY="${2:-}"

# Cap the long side at 1920 while preserving aspect ratio, keeping dims even.
SCALE="scale='if(gt(iw,ih),1920,-2)':'if(gt(iw,ih),-2,1920)'"

# slug | source (relative to public/media) | loop start seconds
read -r -d '' JOBS <<'EOF'
blazar-mantis-135|Blazar/MANTIS/Blazar MANTIS 135mm T3.2 First Look.mp4|60
nozomio-folk-doordash|Nozomio/V2 Folk DoorDash Credit Giveway Promo.mp4|6
fd-2022-buy-now-japan|Formula Drift 2022 - Buy Now Japan/SLC/FD SLC Promo Reel.mp4|4
shoreline-f150-raptor|Shoreline Motoring/F150/F150 Raptor R - Shoreline Motoring.mp4|12
88-silo|88/88 - Final final final.mp4|18
los-lamentos|Los Lamentos/Los Lamentos Promo Final.mp4|30
hotpit-autofest|Hotpit Autofest/Elliot Bright - Driver Showcase.mp4|25
blaque-diamond-model-s|Blaque Diamond Wheels/Model S Plaid/Tesla_Model_S_Plaid_Blaque_Diamond_Wheels_BD_F29_Gloss_Black YT Vid.mp4|14
born-to-ride|Born to Ride/Born To Ride - Loren Henley, Gabriel Bendana.mp4|15
joby-joshua-tree|JOBY/JOBY Joshua Tree Shoot/Joshua Tree Video Content/JOBY Telepod - Mobile REEL.mp4|4
EOF

mkdir -p "$OUT"

while IFS='|' read -r slug src start; do
  [ -z "${slug:-}" ] && continue
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue
  input="$MEDIA/$src"
  dir="$OUT/$slug"
  mkdir -p "$dir"

  if [ ! -f "$input" ]; then
    echo "!! MISSING SOURCE: $src"
    continue
  fi

  if [ "$MODE" = "all" ] || [ "$MODE" = "loops" ]; then
    echo ">> loop   $slug"
    ffmpeg -nostdin -v error -y -ss "$start" -t 10 -i "$input" \
      -vf "$SCALE" -an \
      -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
      -movflags +faststart "$dir/loop.mp4" </dev/null

    echo ">> poster $slug"
    ffmpeg -nostdin -v error -y -ss "$start" -i "$input" -frames:v 1 \
      -vf "$SCALE" -q:v 4 "$dir/poster.jpg" </dev/null
  fi

  if [ "$MODE" = "all" ] || [ "$MODE" = "films" ]; then
    echo ">> film   $slug"
    ffmpeg -nostdin -v error -y -i "$input" \
      -vf "$SCALE" \
      -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
      -c:a aac -b:a 128k -ac 2 \
      -movflags +faststart "$dir/film.mp4" </dev/null
  fi
done <<< "$JOBS"

echo "=== derived output ==="
du -sh "$OUT" 2>/dev/null
find "$OUT" -type f \( -name '*.mp4' -o -name '*.jpg' \) -exec ls -lh {} \; \
  | awk '{printf "%8s  %s\n", $5, $9}' | sed "s|$OUT/||"
